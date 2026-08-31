// 100% Free Creative Commons Music via ccMixter Query API
// Public endpoint: https://ccmixter.org/api/query?f=json

import { JamendoTrack } from './jamendoApi';

const CCMIXTER_BASE_URL = 'https://ccmixter.org/api/query';

export const CCMIXTER_GENRE_MAP: Record<string, string> = {
  All: '',
  Afrobeats: 'world,afro,reggae',
  Gospel: 'vocal,soul',
  Reggae: 'reggae,dub,dancehall',
  'Hip-Hop': 'hip_hop,rap,beats',
  'R&B': 'rnb,soul,blues',
  Pop: 'pop,electronic,dance',
};

const DEFAULT_COVER_ARTS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600',
];

let cachedCCMixterTracks: JamendoTrack[] = [];

/**
 * Fetch Creative Commons streamable tracks from ccMixter API
 * @param tag Category or genre string
 * @param forceRefresh Trigger randomized offset / sort
 */
export async function fetchCCMixterTracks(tag?: string, forceRefresh = false): Promise<JamendoTrack[]> {
  try {
    const offset = forceRefresh ? Math.floor(Math.random() * 50) : 0;
    let url = `${CCMIXTER_BASE_URL}?f=json&limit=20&offset=${offset}&sort=date`;

    if (tag && tag.toLowerCase() !== 'all') {
      const mappedTags = CCMIXTER_GENRE_MAP[tag] || tag.toLowerCase();
      if (mappedTags) {
        url += `&tags=${encodeURIComponent(mappedTags)}`;
      }
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.warn('ccMixter API returned status:', res.status);
      return cachedCCMixterTracks;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return cachedCCMixterTracks;
    }

    const tracks: JamendoTrack[] = data
      .filter((item: any) => item.files && item.files.length > 0 && (item.files[0]?.download_url || item.file_url))
      .map((item: any, index: number) => {
        const primaryFile = item.files.find((f: any) => f.file_name?.endsWith('.mp3')) || item.files[0];
        const audioUrl = primaryFile?.download_url || item.file_url || '';
        const coverArt = DEFAULT_COVER_ARTS[index % DEFAULT_COVER_ARTS.length];

        return {
          id: `ccm-${item.upload_id}`,
          jamendo_id: item.upload_id.toString(),
          title: item.upload_name || 'CC Remix',
          artist: item.user_real_name || item.user_name || 'ccMixter Artist',
          album: item.license_name || 'Creative Commons',
          audio_url: audioUrl,
          cover_art_url: coverArt,
          duration: 210,
          genre: tag || 'Remix',
          likes_count: (item.upload_num_scores || 1) * 45 + 50,
          link: item.file_page_url || `https://ccmixter.org/files/${item.user_name}/${item.upload_id}`,
          source_url: item.file_page_url || `https://ccmixter.org/files/${item.user_name}/${item.upload_id}`,
          external_url: item.file_page_url || `https://ccmixter.org/files/${item.user_name}/${item.upload_id}`,
          is_full_song: true,
        };
      });

    if (tracks.length > 0) {
      cachedCCMixterTracks = tracks;
      return tracks;
    }

    return cachedCCMixterTracks;
  } catch (err) {
    console.error('Error fetching ccMixter tracks:', err);
    return cachedCCMixterTracks;
  }
}

/**
 * Get single ccMixter track detail by ID
 */
export async function getCCMixterTrackDetail(id: string): Promise<JamendoTrack | null> {
  const cleanId = id.replace('ccm-', '');
  const cached = cachedCCMixterTracks.find((t) => t.id === id || t.jamendo_id === cleanId);
  if (cached) return cached;

  try {
    const url = `${CCMIXTER_BASE_URL}?f=json&ids=${cleanId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      const item = data[0];
      const primaryFile = item.files?.find((f: any) => f.file_name?.endsWith('.mp3')) || item.files?.[0];
      return {
        id: `ccm-${item.upload_id}`,
        jamendo_id: item.upload_id.toString(),
        title: item.upload_name || 'CC Remix',
        artist: item.user_real_name || item.user_name || 'ccMixter Artist',
        album: item.license_name || 'Creative Commons',
        audio_url: primaryFile?.download_url || item.file_url || '',
        cover_art_url: DEFAULT_COVER_ARTS[0],
        duration: 210,
        genre: 'Remix',
        likes_count: 150,
        link: item.file_page_url || `https://ccmixter.org/files/${item.user_name}/${item.upload_id}`,
        source_url: item.file_page_url || `https://ccmixter.org/files/${item.user_name}/${item.upload_id}`,
        external_url: item.file_page_url || `https://ccmixter.org/files/${item.user_name}/${item.upload_id}`,
        is_full_song: true,
      };
    }
  } catch (err) {
    console.error('Failed to get ccMixter track detail:', err);
  }
  return null;
}
