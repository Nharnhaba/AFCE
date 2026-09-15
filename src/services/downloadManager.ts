import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

export interface DownloadedItem {
  unique_key?: string;
  id: string; // The original media ID, treated as string for consistency
  type: 'track' | 'video' | 'article';
  title: string;
  artist: string; // Or channel name for videos
  local_file_path: string;
  thumbnail: string;
  downloaded_at: string;
  file_size: string; // Format it nicely, e.g. "5.2 MB"
}

// Open or create the downloads database synchronously
const db = SQLite.openDatabaseSync('downloads.db');

export function initDownloadsDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS downloads (
      unique_key TEXT PRIMARY KEY,
      id TEXT,
      type TEXT,
      title TEXT,
      artist TEXT,
      local_file_path TEXT,
      thumbnail TEXT,
      downloaded_at TEXT,
      file_size TEXT
    );
  `);
}

// Initialize the database on module load
initDownloadsDB();

const DOWNLOADS_FOLDER = FileSystem.documentDirectory + 'downloads/';

async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_FOLDER);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_FOLDER, { intermediates: true });
  }
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function downloadMedia(
  item: {
    id: string | number;
    type: 'track' | 'video' | 'article';
    title: string;
    artist: string;
    thumbnail: string;
    url: string; // Audio or video source URL
  },
  onProgress?: (progress: number) => void
) {
  await ensureDirExists();
  const fileExt = item.url.split('.').pop()?.split('?')[0] || (item.type === 'video' ? 'mp4' : 'mp3');
  const fileUri = `${DOWNLOADS_FOLDER}${item.type}_${item.id}.${fileExt}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    item.url,
    fileUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      if (onProgress) onProgress(progress);
    }
  );

  try {
    const result = await downloadResumable.downloadAsync();
    if (!result) throw new Error('Download failed');

    // Get file info for size
    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const sizeStr = fileInfo.exists && fileInfo.size ? formatBytes(fileInfo.size) : 'Unknown size';
    const downloadedAt = new Date().toISOString();
    const idStr = item.id.toString();
    const uniqueKey = `${item.type}_${idStr}`;

    db.runSync(
      `INSERT OR REPLACE INTO downloads (unique_key, id, type, title, artist, local_file_path, thumbnail, downloaded_at, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      uniqueKey, idStr, item.type, item.title, item.artist, result.uri, item.thumbnail, downloadedAt, sizeStr
    );

    return true;
  } catch (e) {
    console.error('Download error:', e);
    return false;
  }
}

export function getDownloadedItems(): DownloadedItem[] {
  return db.getAllSync<DownloadedItem>('SELECT * FROM downloads ORDER BY downloaded_at DESC');
}

export async function deleteDownload(id: string | number, type: 'track' | 'video' | 'article' = 'video') {
  const idStr = id.toString();
  const uniqueKey = idStr.includes('_') ? idStr : `${type}_${idStr}`;
  const item = db.getFirstSync<DownloadedItem>('SELECT local_file_path FROM downloads WHERE unique_key = ?', uniqueKey);
  
  if (item && item.local_file_path) {
    try {
      await FileSystem.deleteAsync(item.local_file_path, { idempotent: true });
    } catch (e) {
      console.warn('Failed to delete physical file:', e);
    }
  }

  db.runSync('DELETE FROM downloads WHERE unique_key = ?', uniqueKey);
}

export function isDownloaded(id: string | number, type: 'track' | 'video' | 'article' = 'video'): boolean {
  const idStr = id.toString();
  const uniqueKey = idStr.includes('_') ? idStr : `${type}_${idStr}`;
  const row = db.getFirstSync<{ unique_key: string }>('SELECT unique_key FROM downloads WHERE unique_key = ?', uniqueKey);
  return !!row;
}
