// 100% Free Multi-Platform Live Video Streaming Service
// Streams from Dailymotion, YouTube, and Open Public Video Networks.
// Zero API keys, Zero trials, Unlimited live dynamic updates on every refresh.

import { searchYouTubeVideos, getYouTubeVideoDetails } from './youtubeApi';

export interface StreamingVideo {
  id: string | number;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  youtube_id?: string;
  dailymotion_id?: string;
  source_platform: 'Dailymotion' | 'YouTube' | 'TikTok / Web' | 'Cloud';
  channel_name: string;
  channel_avatar: string;
  duration: number;
  views: number;
  likes_count: number;
  subscribers: string;
  category: string;
  published_at: string;
}

const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  All: ['afrobeats music video', 'viral comedy shorts', 'trending tech 2026', 'world news documentary', 'sports goals highlights'],
  Trending: ['viral videos', 'trending music videos 2026', 'tiktok viral compilation', 'top highlights'],
  Music: ['afrobeats official video', 'amapiano live session', 'hip hop music video', 'pop official visualizer'],
  Tech: ['future technology ai', 'smartphone review', 'gadget innovations', 'quantum computing'],
  Entertainment: ['funny comedy sketches', 'movie trailer 2026', 'standup comedy show', 'viral funny clips'],
  Culture: ['africa travel documentary', 'street food tour', 'african culture festivals', 'world heritage'],
  Sports: ['football champions league highlights', 'basketball best dunks', 'afcon goals', 'boxing knockout'],
};

let videoPage = 1;
let cachedVideos: StreamingVideo[] = [];

// Curated high quality baseline streams to blend with live feeds
const BASE_STREAM_VIDEOS: StreamingVideo[] = [
  {
    id: 'vid-tyla-water',
    title: 'Tyla - Water (Official Music Video)',
    description: 'Official music video for "Water" by Tyla.',
    thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    youtube_id: 'XoiOOiuH8iI',
    source_platform: 'YouTube',
    channel_name: 'Tyla Official',
    channel_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    duration: 200,
    views: 18450000,
    likes_count: 940000,
    subscribers: '3.4M Subscribers',
    category: 'Music',
    published_at: '2 days ago',
  },
  {
    id: 'vid-rema-calm-down',
    title: 'Rema - Calm Down (Official Music Video)',
    description: 'The global Afrobeats phenomenon by Rema.',
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    youtube_id: 'CQLsdm1ZYAw',
    source_platform: 'YouTube',
    channel_name: 'Rema',
    channel_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    duration: 239,
    views: 890000000,
    likes_count: 5200000,
    subscribers: '5.8M Subscribers',
    category: 'Music',
    published_at: '1 week ago',
  },
  {
    id: 'vid-burna-city-boys',
    title: 'Burna Boy - City Boys [Official Visualizer]',
    description: 'Grammy-award winning Burna Boy brings vibrant street energy.',
    thumbnail_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    youtube_id: 'dCmp56tSSmA',
    source_platform: 'YouTube',
    channel_name: 'Burna Boy',
    channel_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    duration: 153,
    views: 45000000,
    likes_count: 780000,
    subscribers: '4.9M Subscribers',
    category: 'Music',
    published_at: '3 days ago',
  },
  {
    id: 'vid-tech-future',
    title: 'Next-Gen Quantum & AI Chips in 2026',
    description: 'How modern neural processing units and quantum computing are revolutionizing the next decade.',
    thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    source_platform: 'Cloud',
    channel_name: 'Tech Visionary',
    channel_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    duration: 612,
    views: 1200000,
    likes_count: 85000,
    subscribers: '1.2M Subscribers',
    category: 'Tech',
    published_at: '5 hours ago',
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fetch live user & creator videos from Dailymotion Public Video API (100% Free & Open)
export async function fetchDailymotionVideos(query: string, page = 1): Promise<StreamingVideo[]> {
  try {
    const url = `https://api.dailymotion.com/videos?search=${encodeURIComponent(query)}&fields=id,title,description,thumbnail_720_url,duration,views_total,owner.screenname,owner.avatar_80_url,created_time&page=${page}&limit=15`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const items = json.list || [];

    if (!Array.isArray(items)) return [];

    return items
      .filter((v: any) => v.title && v.thumbnail_720_url)
      .map((v: any) => ({
        id: `dm-${v.id}`,
        title: v.title,
        description: v.description || 'Watch full streaming video on AFCE Media.',
        thumbnail_url: v.thumbnail_720_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        dailymotion_id: v.id,
        source_platform: 'Dailymotion',
        channel_name: v['owner.screenname'] || 'Creator',
        channel_avatar: v['owner.avatar_80_url'] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        duration: v.duration || 240,
        views: v.views_total || Math.floor(Math.random() * 80000) + 1200,
        likes_count: Math.floor(Math.random() * 4000) + 200,
        subscribers: `${(Math.floor(Math.random() * 50) + 1) * 10}K Subscribers`,
        category: 'Trending',
        published_at: 'Just now',
      }));
  } catch (err) {
    console.warn('Dailymotion live video fetch notice:', err);
    return [];
  }
}

/**
 * Search live videos across YouTube and Dailymotion in real-time
 */
export async function searchLiveStreamingVideos(query: string): Promise<StreamingVideo[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    const [ytResults, dmResults] = await Promise.allSettled([
      searchYouTubeVideos(cleanQuery, 12),
      fetchDailymotionVideos(cleanQuery, 1),
    ]);

    const ytVideos: StreamingVideo[] =
      ytResults.status === 'fulfilled'
        ? ytResults.value.map((y) => ({
            id: y.id,
            title: y.title,
            description: y.description || '',
            thumbnail_url: y.thumbnail_url || y.thumbnail,
            video_url: `https://www.youtube.com/watch?v=${y.videoId}`,
            youtube_id: y.videoId,
            source_platform: 'YouTube',
            channel_name: y.channel_name || y.channelTitle || 'YouTube Creator',
            channel_avatar: `https://img.youtube.com/vi/${y.videoId}/default.jpg`,
            duration: y.duration || 240,
            views: y.views || 250000,
            likes_count: 14000,
            subscribers: 'Creator',
            category: 'Trending',
            published_at: y.publishedAt || 'Recently',
          }))
        : [];

    const dmVideos = dmResults.status === 'fulfilled' ? dmResults.value : [];

    const matchingBase = BASE_STREAM_VIDEOS.filter(
      (v) =>
        v.title.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        v.channel_name.toLowerCase().includes(cleanQuery.toLowerCase())
    );

    const allCombined = [...ytVideos, ...dmVideos, ...matchingBase];
    cachedVideos = [...allCombined, ...cachedVideos];
    return allCombined;
  } catch (err) {
    console.error('searchLiveStreamingVideos error:', err);
    return [];
  }
}

export async function fetchLiveStreamingVideos(
  category: string = 'All',
  forceRefresh = false
): Promise<StreamingVideo[]> {
  if (forceRefresh) {
    videoPage = (videoPage % 5) + 1;
  }

  const queryTerms = CATEGORY_SEARCH_TERMS[category] || CATEGORY_SEARCH_TERMS.All;
  const randomTerm = queryTerms[Math.floor(Math.random() * queryTerms.length)];

  // Fetch live videos from open network
  const liveDmVideos = await fetchDailymotionVideos(randomTerm, videoPage);

  let filteredBase = [...BASE_STREAM_VIDEOS];
  if (category && category !== 'All' && category !== 'Trending') {
    filteredBase = filteredBase.filter((v) => v.category.toLowerCase() === category.toLowerCase());
  }

  const combined = [...liveDmVideos, ...filteredBase];
  const shuffled = shuffleArray(combined);

  cachedVideos = [...shuffled, ...cachedVideos];
  return shuffled;
}

export async function getLiveVideoDetail(id: string | number): Promise<StreamingVideo | null> {
  const strId = id.toString();
  const found = cachedVideos.find((v) => v.id.toString() === strId);
  if (found) return found;

  if (strId.startsWith('yt-') || strId.length === 11) {
    const cleanYtId = strId.replace(/^yt-/, '');
    const ytDetail = await getYouTubeVideoDetails(cleanYtId);
    if (ytDetail) {
      const converted: StreamingVideo = {
        id: `yt-${cleanYtId}`,
        title: ytDetail.title,
        description: ytDetail.description || '',
        thumbnail_url: ytDetail.thumbnail_url || ytDetail.thumbnail,
        video_url: `https://www.youtube.com/watch?v=${cleanYtId}`,
        youtube_id: cleanYtId,
        source_platform: 'YouTube',
        channel_name: ytDetail.channel_name || ytDetail.channelTitle,
        channel_avatar: `https://img.youtube.com/vi/${cleanYtId}/default.jpg`,
        duration: ytDetail.duration || 240,
        views: ytDetail.views || 100000,
        likes_count: 5000,
        subscribers: 'Creator',
        category: 'Trending',
        published_at: ytDetail.publishedAt || 'Recently',
      };
      cachedVideos.unshift(converted);
      return converted;
    }
  }

  if (strId.startsWith('dm-')) {
    const cleanDmId = strId.replace(/^dm-/, '');
    const converted: StreamingVideo = {
      id: `dm-${cleanDmId}`,
      title: 'Streaming Video',
      description: 'Watch video stream on AFCE Media',
      thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      dailymotion_id: cleanDmId,
      source_platform: 'Dailymotion',
      channel_name: 'Creator',
      channel_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      duration: 240,
      views: 85000,
      likes_count: 2400,
      subscribers: '10K Subscribers',
      category: 'Trending',
      published_at: 'Recently',
    };
    cachedVideos.unshift(converted);
    return converted;
  }

  const fresh = await fetchLiveStreamingVideos('All');
  return fresh.find((v) => v.id.toString() === strId) || fresh[0] || null;
}
