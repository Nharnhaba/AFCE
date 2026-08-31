// 100% Free Live Music Streaming Service (Deezer + Apple Music APIs)
// Zero API keys, Zero trials, Unlimited live dynamic rotation on every refresh.

export interface StreamingTrack {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  audio_url: string;
  cover_art_url: string;
  duration: number; // in seconds
  genre?: string;
  rank?: number;
  likes_count?: number;
  link?: string;
  source_url?: string;
  external_url?: string;
}

export interface StreamingPlaylist {
  id: string;
  title: string;
  description: string;
  songsCount: string;
  colors: string[];
  image: string;
  query: string;
}

export const LIVE_PLAYLISTS: StreamingPlaylist[] = [
  {
    id: 'pl-today-hits',
    title: "Today's Global Hits",
    description: 'Top trending tracks across the world right now.',
    songsCount: '50 Songs',
    colors: ['#6366f1', '#a855f7'],
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
    query: 'top hits 2026',
  },
  {
    id: 'pl-afrobeats',
    title: 'Afrobeats Vibes',
    description: 'The hottest Afrobeats, Highlife & Naija rhythms.',
    songsCount: '80 Songs',
    colors: ['#f97316', '#ea580c'],
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
    query: 'afrobeats',
  },
  {
    id: 'pl-amapiano',
    title: 'Amapiano Grooves',
    description: 'South African log-drum basslines and piano keys.',
    songsCount: '45 Songs',
    colors: ['#06b6d4', '#0d9488'],
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
    query: 'amapiano',
  },
  {
    id: 'pl-chill',
    title: 'Chill & Relax',
    description: 'Smooth R&B, Lo-Fi, and acoustic sunset sessions.',
    songsCount: '60 Songs',
    colors: ['#ec4899', '#be185d'],
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    query: 'chill r&b acoustic',
  },
];

const ROTATING_TOPICS = [
  'top billboard hits',
  'afrobeats hits',
  'amapiano 2026',
  'viral global hits',
  'r&b essentials',
  'hip hop bangers',
  'reggae dancehall',
  'pop radio hits',
  'latin party',
];

let currentRotationIndex = 0;
let cachedTracks: StreamingTrack[] = [];

// Helper to shuffle arrays
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fetch from iTunes Apple Music API (100% Free Public API)
async function fetchItunesMusic(query: string): Promise<StreamingTrack[]> {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .filter((item: any) => item.previewUrl && item.trackName)
      .map((item: any) => ({
        id: `itunes-${item.trackId}`,
        title: item.trackName,
        artist: item.artistName || 'Artist',
        album: item.collectionName || 'Single',
        audio_url: item.previewUrl,
        cover_art_url: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
        duration: Math.floor((item.trackTimeMillis || 180000) / 1000),
        genre: item.primaryGenreName || 'Music',
        likes_count: Math.floor(Math.random() * 900) + 100,
        link: item.trackViewUrl || '',
      }));
  } catch (err) {
    console.warn('iTunes music fetch error:', err);
    return [];
  }
}

// Fetch from Deezer API (100% Free Public API)
async function fetchDeezerMusic(query?: string): Promise<StreamingTrack[]> {
  try {
    const offset = Math.floor(Math.random() * 4) * 20;
    const endpoint = query
      ? `https://api.deezer.com/search?q=${encodeURIComponent(query)}&index=${offset}&limit=25`
      : `https://api.deezer.com/chart/0/tracks?index=${offset}&limit=25`;

    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.data || [];

    if (!Array.isArray(items)) return [];

    return items
      .filter((item: any) => item.preview && item.title)
      .map((item: any) => ({
        id: `dz-${item.id}`,
        title: item.title_short || item.title,
        artist: item.artist?.name || 'Artist',
        album: item.album?.title || 'Single',
        audio_url: item.preview,
        cover_art_url:
          item.album?.cover_big ||
          item.album?.cover_medium ||
          item.artist?.picture_big ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        duration: item.duration || 180,
        genre: query || 'Popular',
        likes_count: Math.floor(Math.random() * 900) + 150,
        link: item.link || '',
      }));
  } catch (err) {
    console.warn('Deezer music fetch error:', err);
    return [];
  }
}

export async function fetchLiveTrendingMusic(query?: string, forceRefresh = false): Promise<StreamingTrack[]> {
  if (forceRefresh) {
    currentRotationIndex = (currentRotationIndex + 1) % ROTATING_TOPICS.length;
  }

  const activeQuery = query || ROTATING_TOPICS[currentRotationIndex];

  // Fetch simultaneously from both free public streaming providers
  const [itunesTracks, deezerTracks] = await Promise.all([
    fetchItunesMusic(activeQuery),
    fetchDeezerMusic(activeQuery),
  ]);

  const combined = [...itunesTracks, ...deezerTracks];

  // Deduplicate and randomize
  const seen = new Set<string>();
  const uniqueTracks = combined.filter((t) => {
    const key = `${t.title.toLowerCase()} - ${t.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const shuffled = shuffleArray(uniqueTracks);
  if (shuffled.length > 0) {
    cachedTracks = shuffled;
    return shuffled;
  }

  return cachedTracks;
}

export async function getLiveTrackDetail(id: string | number): Promise<StreamingTrack | null> {
  const found = cachedTracks.find((t) => t.id.toString() === id.toString());
  if (found) return found;

  const fresh = await fetchLiveTrendingMusic();
  return fresh.find((t) => t.id.toString() === id.toString()) || fresh[0] || null;
}
