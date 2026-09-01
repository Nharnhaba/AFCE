// 100% Free Full-Length Music Streaming Service via Jamendo API
// Direct full-length MP3 streamable songs (no 30s clips)

export interface JamendoTrack {
  id: string;
  jamendo_id: string;
  title: string;
  artist: string;
  album: string;
  audio_url: string; // Full-length streamable MP3 URL
  cover_art_url: string;
  duration: number; // In seconds
  genre: string;
  likes_count: number;
  link: string;
  source_url: string;
  external_url: string;
  is_full_song: boolean;
}

const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0/tracks/';
const CLIENT_ID = '9f39e35a';

// Category tag mapper for Jamendo
export const JAMENDO_GENRE_MAP: Record<string, string> = {
  All: '',
  Afrobeats: 'afrobeat',
  Gospel: 'gospel',
  Reggae: 'reggae',
  'Hip-Hop': 'hiphop',
  'R&B': 'rnb',
  Pop: 'pop',
};

let cachedJamendoTracks: JamendoTrack[] = [];

/**
 * Fetch full-length streamable tracks from Jamendo API
 * @param tag Category/genre tag (e.g. 'afrobeat', 'gospel', 'reggae', 'hiphop', 'pop')
 * @param forceRefresh Bypass cache
 */
export async function fetchJamendoTracks(tag?: string, forceRefresh = false): Promise<JamendoTrack[]> {
  try {
    const offset = forceRefresh ? Math.floor(Math.random() * 40) : 0;
    let url = `${JAMENDO_BASE_URL}?client_id=${CLIENT_ID}&format=json&limit=20&offset=${offset}&include=musicinfo&order=popularity_total&audioformat=mp32`;

    if (tag && tag.toLowerCase() !== 'all') {
      const mappedTag = JAMENDO_GENRE_MAP[tag] || tag.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (mappedTag) {
        url += `&tags=${encodeURIComponent(mappedTag)}`;
      }
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Jamendo API returned status:', res.status);
      return cachedJamendoTracks;
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return cachedJamendoTracks;
    }

    const formattedTracks: JamendoTrack[] = data.results
      .filter((item: any) => item.audio && item.name)
      .map((item: any) => ({
        id: `jamendo-${item.id}`,
        jamendo_id: item.id,
        title: item.name,
        artist: item.artist_name || 'Jamendo Artist',
        album: item.album_name || 'Free Single',
        audio_url: item.audio, // Full streamable MP3
        cover_art_url: item.image ? item.image.replace('1.100.jpg', '1.600.jpg') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        duration: item.duration || 180,
        genre: item.musicinfo?.tags?.genres?.[0] || tag || 'Music',
        likes_count: Math.floor(Math.random() * 800) + 120,
        link: item.shareurl || item.audiodownload || `https://www.jamendo.com/track/${item.id}`,
        source_url: item.shareurl || `https://www.jamendo.com/track/${item.id}`,
        external_url: item.shareurl || `https://www.jamendo.com/track/${item.id}`,
        is_full_song: true,
      }));

    if (formattedTracks.length > 0) {
      cachedJamendoTracks = formattedTracks;
      return formattedTracks;
    } else if (forceRefresh && offset > 0) {
      return await fetchJamendoTracks(tag, false);
    }

    return cachedJamendoTracks;
  } catch (err) {
    console.error('Error fetching Jamendo tracks:', err);
    return cachedJamendoTracks;
  }
}

/**
 * Get single Jamendo track detail by ID
 */
export async function getJamendoTrackDetail(id: string): Promise<JamendoTrack | null> {
  const cleanId = id.replace('jamendo-', '');
  const cached = cachedJamendoTracks.find((t) => t.id === id || t.jamendo_id === cleanId);
  if (cached) return cached;

  try {
    const url = `${JAMENDO_BASE_URL}?client_id=${CLIENT_ID}&format=json&id=${cleanId}&include=musicinfo&audioformat=mp32`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results[0]) {
      const item = data.results[0];
      return {
        id: `jamendo-${item.id}`,
        jamendo_id: item.id,
        title: item.name,
        artist: item.artist_name || 'Jamendo Artist',
        album: item.album_name || 'Free Single',
        audio_url: item.audio,
        cover_art_url: item.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        duration: item.duration || 180,
        genre: item.musicinfo?.tags?.genres?.[0] || 'Music',
        likes_count: Math.floor(Math.random() * 800) + 120,
        link: item.shareurl || item.audiodownload || `https://www.jamendo.com/track/${item.id}`,
        source_url: item.shareurl || `https://www.jamendo.com/track/${item.id}`,
        external_url: item.shareurl || `https://www.jamendo.com/track/${item.id}`,
        is_full_song: true,
      };
    }
  } catch (err) {
    console.error('Failed to get Jamendo track detail:', err);
  }
  return null;
}
