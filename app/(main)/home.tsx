import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrentUser, loadStoredName } from '../../src/services/api';
import { fetchLiveNews, LiveArticle } from '../../src/services/rss';
import {
  fetchLiveTrendingMusic,
  LIVE_PLAYLISTS,
  StreamingTrack,
  StreamingPlaylist,
} from '../../src/services/musicStreaming';
import {
  fetchLiveStreamingVideos,
  StreamingVideo,
} from '../../src/services/videoStreaming';
import {
  fetchJamendoTracks,
  JamendoTrack,
} from '../../src/services/jamendoApi';
import {
  fetchCCMixterTracks,
} from '../../src/services/ccmixterApi';
import {
  playTrack,
  setQueue,
  subscribePlaybackState,
  PlaybackState,
} from '../../src/services/audioPlayer';
import MovingBackground from '../../src/components/MovingBackground';
import FeaturedPlaylists from '../../src/components/FeaturedPlaylists';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Content feeds
  const [trendingVideos, setTrendingVideos] = useState<StreamingVideo[]>([]);
  const [topVideos, setTopVideos] = useState<StreamingVideo[]>([]);
  const [fullSongs, setFullSongs] = useState<JamendoTrack[]>([]);
  const [topMusic, setTopMusic] = useState<StreamingTrack[]>([]);
  const [latestNews, setLatestNews] = useState<LiveArticle[]>([]);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    isLoading: false,
    currentTrackId: null,
    currentTrack: null,
  });

  useEffect(() => {
    const unsubscribe = subscribePlaybackState(setPlaybackState);
    return unsubscribe;
  }, []);

  const loadHomeData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      loadStoredName().then((name) => {
        if (name) setUserName(name);
      });

      const [
        userRes,
        trendVideos,
        moreVideos,
        musicData,
        jamendoData,
        ccmData,
        newsData,
      ] = await Promise.all([
        getCurrentUser().catch(() => null),
        fetchLiveStreamingVideos('Trending', isRefresh).catch(() => []),
        fetchLiveStreamingVideos('All', isRefresh).catch(() => []),
        fetchLiveTrendingMusic(undefined, isRefresh).catch(() => []),
        fetchJamendoTracks(undefined, isRefresh).catch(() => []),
        fetchCCMixterTracks(undefined, isRefresh).catch(() => []),
        fetchLiveNews('All', isRefresh).catch(() => []),
      ]);

      if (userRes && userRes.name) {
        setUserName(userRes.name);
      }

      setTrendingVideos(trendVideos && trendVideos.length > 0 ? trendVideos.slice(0, 6) : []);
      // Ensure topVideos are distinct or complement trending
      const complementaryVideos = (moreVideos || []).filter(
        (v) => !(trendVideos || []).slice(0, 6).some((tv) => tv.id === v.id)
      );
      setTopVideos(
        complementaryVideos.length > 0
          ? complementaryVideos.slice(0, 5)
          : (moreVideos || []).slice(0, 5)
      );

      const combinedFull = [...(jamendoData || []), ...(ccmData || [])];
      setFullSongs(combinedFull.slice(0, 6));

      setTopMusic((musicData || []).slice(0, 5));
      setLatestNews((newsData || []).slice(0, 4));
    } catch (err) {
      console.error('Failed to load home feeds:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const formatDuration = (sec?: number | string) => {
    if (!sec) return '3:20';
    if (typeof sec === 'string' && sec.includes(':')) return sec;
    const s = Number(sec);
    if (isNaN(s)) return '3:20';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const formatViews = (views?: number) => {
    if (!views) return '12K views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
    return `${views} views`;
  };

  const handlePlayMusic = async (track: StreamingTrack | JamendoTrack, list: (StreamingTrack | JamendoTrack)[]) => {
    const queueList = list.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      cover_art_url: t.cover_art_url,
      audio_url: t.audio_url,
      duration: t.duration,
      link: t.link || (t as any).source_url || (t as any).external_url,
      source_url: (t as any).source_url || t.link,
      external_url: (t as any).external_url || t.link,
    }));
    const index = queueList.findIndex((t) => t.id.toString() === track.id.toString());
    if (index >= 0) {
      await setQueue(queueList, index);
    } else if (track.audio_url) {
      await playTrack(track.id, track.audio_url, {
        title: track.title,
        artist: track.artist,
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        link: track.link,
        source_url: (track as any).source_url,
        external_url: (track as any).external_url,
      });
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <MovingBackground type="all" direction="diagonal" opacity={0.35} />
        <LinearGradient
          colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.85)', '#0a0a0f']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Curating your content feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.35} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.85)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHomeData(true)}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      >
        {/* ========================================================
            1. Header: Greeting + Notification Bell + Search Bar
           ======================================================== */}
        <View style={styles.topHeader}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>Hi, {userName || 'Friend'} 👋</Text>
            <Text style={styles.greetingSubtitle}>Welcome to AFCE Media Hub</Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.85}
        >
          <Feather name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search videos, full songs, news...</Text>
          <View style={styles.searchRightBadge}>
            <Ionicons name="mic-outline" size={16} color="#c084fc" />
          </View>
        </TouchableOpacity>

        {/* ========================================================
            2. "Trending Now" — Horizontal Video Carousel
           ======================================================== */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>🔥</Text>
            <Text style={styles.sectionTitle}>Trending Now</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/videos')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {trendingVideos.map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.trendingCard}
              onPress={() => router.push(`/video/${video.id}` as any)}
              activeOpacity={0.88}
            >
              <View style={styles.trendingImageContainer}>
                <Image
                  source={{
                    uri:
                      video.thumbnail_url ||
                      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600',
                  }}
                  style={styles.trendingImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(10,10,15,0.92)']}
                  style={styles.cardGradient}
                />
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
                </View>
                <View style={styles.platformBadge}>
                  <Text style={styles.platformBadgeText}>{video.source_platform || 'Video'}</Text>
                </View>
                <View style={styles.playFloatingIcon}>
                  <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
                </View>
              </View>

              <View style={styles.cardBottomInfo}>
                <Text style={styles.trendingTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.trendingMeta}>
                  {formatViews(video.views)} • {video.channel_name || 'AFCE Broadcast'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {trendingVideos.length === 0 && (
            <Text style={styles.emptyText}>No trending videos available right now</Text>
          )}
        </ScrollView>

        {/* ========================================================
            3. "Featured Playlists" — Reused Music Playlists
           ======================================================== */}
        <FeaturedPlaylists />

        {/* ========================================================
            4. "Full Songs (Free Library)" — Jamendo / ccMixter Preview
           ======================================================== */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>⚡</Text>
            <Text style={styles.sectionTitle}>Full Songs (Free Library)</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/music')}>
            <Text style={[styles.seeAllText, { color: '#34d399' }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {fullSongs.map((track) => {
            const isPlayingThis =
              playbackState.currentTrackId === track.id && playbackState.isPlaying;

            return (
              <TouchableOpacity
                key={track.id}
                style={styles.fullSongCard}
                onPress={() =>
                  router.push({
                    pathname: '/music/[id]',
                    params: { id: track.id },
                  } as any)
                }
                activeOpacity={0.88}
              >
                <View style={styles.fullSongCoverWrap}>
                  <Image
                    source={{ uri: track.cover_art_url }}
                    style={styles.fullSongCover}
                  />
                  <View style={styles.fullSongBadge}>
                    <Text style={styles.fullSongBadgeText}>FULL SONG</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.fullSongPlayBtn,
                      isPlayingThis && { backgroundColor: '#10b981' },
                    ]}
                    onPress={() => handlePlayMusic(track, fullSongs)}
                  >
                    <Ionicons
                      name={isPlayingThis ? 'pause' : 'play'}
                      size={16}
                      color="#fff"
                      style={isPlayingThis ? {} : { marginLeft: 2 }}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.fullSongTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.fullSongArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ========================================================
            5. "Top Videos" — Vertical Rich Video List
           ======================================================== */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>🎬</Text>
            <Text style={styles.sectionTitle}>Top Videos</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/videos')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {topVideos.map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.topVideoItem}
              onPress={() => router.push(`/video/${video.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.topVideoThumbWrap}>
                <Image
                  source={{
                    uri:
                      video.thumbnail_url ||
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
                  }}
                  style={styles.topVideoThumb}
                />
                <View style={styles.topVideoDuration}>
                  <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
                </View>
              </View>

              <View style={styles.topVideoMeta}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{video.category || 'Music'}</Text>
                </View>
                <Text style={styles.topVideoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.topVideoStats}>
                  {video.channel_name || 'AFCE Video'} • {formatViews(video.views)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ========================================================
            6. "Top Music" — Rich Audio Cards
           ======================================================== */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>🎵</Text>
            <Text style={styles.sectionTitle}>Top Music</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/music')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {topMusic.map((track) => {
            const isPlayingThis =
              playbackState.currentTrackId === track.id && playbackState.isPlaying;

            return (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.topMusicItem,
                  isPlayingThis && styles.activeMusicItem,
                ]}
                onPress={() => router.push(`/music/${track.id}` as any)}
                activeOpacity={0.85}
              >
                <Image
                  source={{
                    uri:
                      track.cover_art_url ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
                  }}
                  style={styles.musicThumb}
                />

                <View style={styles.musicTextCol}>
                  <Text
                    style={[
                      styles.musicTitle,
                      isPlayingThis && { color: '#c084fc', fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <Text style={styles.musicArtist} numberOfLines={1}>
                    {track.artist || 'Artist'} • {track.genre || 'Trending'}
                  </Text>
                </View>

                <Text style={styles.musicDuration}>
                  {formatDuration(track.duration)}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.musicPlayBtn,
                    isPlayingThis && { backgroundColor: '#9333ea' },
                  ]}
                  onPress={() => handlePlayMusic(track, topMusic)}
                >
                  <Ionicons
                    name={isPlayingThis ? 'pause' : 'play'}
                    size={16}
                    color="#fff"
                    style={isPlayingThis ? {} : { marginLeft: 2 }}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================
            7. "Latest News" — Rich Global Articles Feed
           ======================================================== */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>📰</Text>
            <Text style={styles.sectionTitle}>Latest News</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/news')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {latestNews.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.newsCard}
              onPress={() => router.push(`/news/${article.id}` as any)}
              activeOpacity={0.88}
            >
              <Image
                source={{
                  uri:
                    article.cover_image_url ||
                    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600',
                }}
                style={styles.newsImage}
              />
              <View style={styles.newsContent}>
                <View style={styles.newsTopRow}>
                  <View style={styles.newsCategoryBadge}>
                    <Text style={styles.newsCategoryText}>
                      {article.category || 'World'}
                    </Text>
                  </View>
                  <Text style={styles.newsSourceText}>{article.source || 'News Feed'}</Text>
                </View>

                <Text style={styles.newsTitle} numberOfLines={2}>
                  {article.title}
                </Text>

                <View style={styles.newsBottomRow}>
                  <Text style={styles.newsTime}>{article.published_at || 'Just now'}</Text>
                  <View style={styles.readMoreRow}>
                    <Text style={styles.readMoreText}>Read Article</Text>
                    <Ionicons name="arrow-forward" size={12} color="#c084fc" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {latestNews.length === 0 && (
            <Text style={styles.emptyText}>No news articles available</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 14,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 90,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161622',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#242436',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ec4899',
    borderWidth: 1.5,
    borderColor: '#161622',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#64748b',
    fontSize: 14,
  },
  searchRightBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '700',
  },
  horizontalScroll: {
    paddingRight: 18,
    gap: 14,
    marginBottom: 20,
  },
  verticalList: {
    gap: 12,
    marginBottom: 24,
  },

  // 2. Trending Video Cards
  trendingCard: {
    width: 250,
    backgroundColor: '#161622',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242436',
  },
  trendingImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#1c1b2e',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  platformBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(147, 51, 234, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platformBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  playFloatingIcon: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(147, 51, 234, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottomInfo: {
    padding: 12,
  },
  trendingTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  trendingMeta: {
    color: '#94a3b8',
    fontSize: 11,
  },

  // 3. Featured Playlists
  playlistCard: {
    width: 220,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
  },
  playlistGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    position: 'relative',
  },
  playlistThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playlistContent: {
    flex: 1,
  },
  playlistTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  playlistSongs: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  playlistPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 4. Full Songs (Free Library) Preview
  fullSongCard: {
    width: 140,
    backgroundColor: '#161622',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242436',
  },
  fullSongCoverWrap: {
    width: 120,
    height: 120,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1c1b2e',
    marginBottom: 8,
  },
  fullSongCover: {
    width: '100%',
    height: '100%',
  },
  fullSongBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#064e3b',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullSongBadgeText: {
    color: '#34d399',
    fontSize: 7,
    fontWeight: '900',
  },
  fullSongPlayBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#132e27',
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSongTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  fullSongArtist: {
    color: '#94a3b8',
    fontSize: 11,
  },

  // 5. Top Videos (Vertical)
  topVideoItem: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242436',
    gap: 12,
    alignItems: 'center',
  },
  topVideoThumbWrap: {
    width: 110,
    height: 72,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1c1b2e',
  },
  topVideoThumb: {
    width: '100%',
    height: '100%',
  },
  topVideoDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  topVideoMeta: {
    flex: 1,
  },
  categoryPill: {
    backgroundColor: '#2a1b3d',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryPillText: {
    color: '#c084fc',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  topVideoTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 3,
  },
  topVideoStats: {
    color: '#64748b',
    fontSize: 11,
  },

  // 6. Top Music Rows
  topMusicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242436',
    gap: 12,
  },
  activeMusicItem: {
    borderColor: '#a855f7',
    backgroundColor: '#1a1528',
  },
  musicThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2a1b3d',
  },
  musicTextCol: {
    flex: 1,
  },
  musicTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  musicArtist: {
    color: '#94a3b8',
    fontSize: 12,
  },
  musicDuration: {
    color: '#64748b',
    fontSize: 12,
    marginRight: 6,
  },
  musicPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 7. Latest News Cards
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242436',
    padding: 10,
    gap: 12,
  },
  newsImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#1c1b2e',
  },
  newsContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  newsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsCategoryBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newsCategoryText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  newsSourceText: {
    color: '#64748b',
    fontSize: 10,
  },
  newsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginVertical: 4,
  },
  newsBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsTime: {
    color: '#64748b',
    fontSize: 11,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: 13,
    paddingVertical: 12,
  },
});