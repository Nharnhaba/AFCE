import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getGlobalTrending, searchContent } from '../src/services/api';
import { fetchLiveTrendingMusic } from '../src/services/musicStreaming';
import {
  fetchLiveStreamingVideos,
  searchLiveStreamingVideos,
} from '../src/services/videoStreaming';
import { fetchLiveNews } from '../src/services/rss';
import { playTrack } from '../src/services/audioPlayer';
import MovingBackground from '../src/components/MovingBackground';

const FILTER_TABS = ['All', 'Videos', 'Music', 'News'];

const SUGGESTED_TAGS = [
  'Afrobeats',
  'Amapiano',
  'Tyla',
  'Burna Boy',
  'Tech',
  'Football',
  'World News',
  'Culture',
];

interface SearchResultsState {
  videos: any[];
  tracks: any[];
  articles: any[];
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultsState>({
    videos: [],
    tracks: [],
    articles: [],
  });

  const debounceTimeout = useRef<any>(null);

  // Initial load trending suggestions
  const loadInitialTrending = useCallback(async () => {
    setLoading(true);
    try {
      const [trendingRes, musicStreams, videoStreams, newsArticles] = await Promise.allSettled([
        getGlobalTrending(undefined, 10),
        fetchLiveTrendingMusic('afrobeats'),
        fetchLiveStreamingVideos('All'),
        fetchLiveNews('All'),
      ]);

      const beVideos = trendingRes.status === 'fulfilled' ? trendingRes.value?.trending?.videos || [] : [];
      const beTracks = trendingRes.status === 'fulfilled' ? trendingRes.value?.trending?.tracks || [] : [];
      const beArticles = trendingRes.status === 'fulfilled' ? trendingRes.value?.trending?.articles || [] : [];

      const liveMusic = musicStreams.status === 'fulfilled' ? musicStreams.value || [] : [];
      const liveVideos = videoStreams.status === 'fulfilled' ? videoStreams.value || [] : [];
      const liveNews = newsArticles.status === 'fulfilled' ? newsArticles.value || [] : [];

      setResults({
        videos: deduplicate([...beVideos, ...liveVideos], 'title'),
        tracks: deduplicate([...beTracks, ...liveMusic], 'title'),
        articles: deduplicate([...beArticles, ...liveNews], 'title'),
      });
    } catch (err) {
      console.warn('Initial search preload error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialTrending();
  }, [loadInitialTrending]);

  const deduplicate = (items: any[], key: string = 'id') => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const val = (item[key] || item.id || '').toString().toLowerCase();
      if (!val || seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  };

  // Perform multi-source global search across Backend API, Music Streams, Video Streams, and Live RSS
  const executeSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) {
      loadInitialTrending();
      return;
    }

    setLoading(true);
    try {
      const lowerQ = q.toLowerCase();

      // Parallel fetch across all channels
      const [backendSearchRes, musicRes, videoRes, newsRes] = await Promise.allSettled([
        searchContent(q),
        fetchLiveTrendingMusic(q),
        searchLiveStreamingVideos(q),
        fetchLiveNews('All'),
      ]);

      // 1. Backend results
      let beVideos: any[] = [];
      let beTracks: any[] = [];
      let beArticles: any[] = [];

      if (backendSearchRes.status === 'fulfilled' && backendSearchRes.value?.results) {
        beVideos = backendSearchRes.value.results.videos || [];
        beTracks = backendSearchRes.value.results.tracks || [];
        beArticles = backendSearchRes.value.results.articles || [];
      }

      // 2. Live music results
      let streamMusic: any[] = [];
      if (musicRes.status === 'fulfilled' && Array.isArray(musicRes.value)) {
        streamMusic = musicRes.value;
      }

      // 3. Live video results (YouTube & Dailymotion streams)
      let streamVideos: any[] = [];
      if (videoRes.status === 'fulfilled' && Array.isArray(videoRes.value)) {
        streamVideos = videoRes.value;
      }

      // 4. Live RSS News results
      let streamNews: any[] = [];
      if (newsRes.status === 'fulfilled' && Array.isArray(newsRes.value)) {
        streamNews = newsRes.value.filter(
          (n) =>
            n.title?.toLowerCase().includes(lowerQ) ||
            n.excerpt?.toLowerCase().includes(lowerQ) ||
            n.body?.toLowerCase().includes(lowerQ) ||
            n.category?.toLowerCase().includes(lowerQ) ||
            n.source?.toLowerCase().includes(lowerQ)
        );
      }

      const combinedVideos = deduplicate([...beVideos, ...streamVideos], 'title');
      const combinedTracks = deduplicate([...beTracks, ...streamMusic], 'title');
      const combinedArticles = deduplicate([...beArticles, ...streamNews], 'title');

      setResults({
        videos: combinedVideos,
        tracks: combinedTracks,
        articles: combinedArticles,
      });
    } catch (err) {
      console.error('Search execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      executeSearch(text);
    }, 350);
  };

  const handleSelectTag = (tag: string) => {
    setQuery(tag);
    Keyboard.dismiss();
    executeSearch(tag);
  };

  const handlePlayMusic = (track: any, e?: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    const audioUrl = track.audio_url || track.preview || '';
    playTrack(track.id, audioUrl, {
      title: track.title,
      artist: track.artist || 'Artist',
      cover_art_url: track.cover_art_url || '',
      duration: track.duration,
      link: track.link,
    });
    router.push(`/music/${track.id}` as any);
  };

  const totalResultsCount =
    results.videos.length + results.tracks.length + results.articles.length;

  const showVideos = activeTab === 'All' || activeTab === 'Videos';
  const showMusic = activeTab === 'All' || activeTab === 'Music';
  const showNews = activeTab === 'All' || activeTab === 'News';

  const displayedVideos =
    activeTab === 'All' ? results.videos.slice(0, 4) : results.videos;
  const displayedTracks =
    activeTab === 'All' ? results.tracks.slice(0, 5) : results.tracks;
  const displayedArticles =
    activeTab === 'All' ? results.articles.slice(0, 4) : results.articles;

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.25} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.92)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Search Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.searchBarContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search music, videos, news, artists..."
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            onSubmitEditing={() => executeSearch(query)}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                executeSearch('');
              }}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggested Quick Search Tags */}
      <View style={styles.tagsRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContainer}
        >
          {SUGGESTED_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.suggestedTag,
                query.toLowerCase() === tag.toLowerCase() && styles.activeSuggestedTag,
              ]}
              onPress={() => handleSelectTag(tag)}
            >
              <Text
                style={[
                  styles.suggestedTagText,
                  query.toLowerCase() === tag.toLowerCase() && styles.activeSuggestedTagText,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            let count = 0;
            if (item === 'All') count = totalResultsCount;
            else if (item === 'Videos') count = results.videos.length;
            else if (item === 'Music') count = results.tracks.length;
            else if (item === 'News') count = results.articles.length;

            return (
              <TouchableOpacity
                style={[styles.tabChip, activeTab === item && styles.activeTabChip]}
                onPress={() => setActiveTab(item)}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    activeTab === item && styles.activeTabChipText,
                  ]}
                >
                  {item}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      activeTab === item && styles.activeTabBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        activeTab === item && styles.activeTabBadgeText,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingSubtext}>Searching across Music, Videos & News...</Text>
        </View>
      ) : totalResultsCount === 0 ? (
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons name="magnify-scan" size={64} color="#334155" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyDescription}>
            {`We couldn't find matches for "${query}". Try checking your spelling or searching another artist, topic, or genre.`}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Videos Section */}
          {showVideos && displayedVideos.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="videocam" size={18} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Videos ({results.videos.length})</Text>
                </View>
                {activeTab === 'All' && results.videos.length > 4 && (
                  <TouchableOpacity onPress={() => setActiveTab('Videos')}>
                    <Text style={styles.seeAllText}>See all</Text>
                  </TouchableOpacity>
                )}
              </View>

              {displayedVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoCard}
                  onPress={() => router.push(`/video/${video.id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.videoThumbWrapper}>
                    <Image
                      source={{
                        uri:
                          video.thumbnail_url ||
                          (video.youtube_id
                            ? `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`
                            : 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400'),
                      }}
                      style={styles.videoThumb}
                    />
                    <View style={styles.playIconOverlay}>
                      <Ionicons name="play" size={14} color="#ffffff" style={{ marginLeft: 2 }} />
                    </View>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>
                        {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'Live'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {video.title}
                    </Text>
                    <Text style={styles.videoMeta} numberOfLines={1}>
                      {video.channel_name || 'AFCE Stream'} • {video.views || '12K'} views
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Music Section */}
          {showMusic && displayedTracks.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="musical-notes" size={18} color="#a855f7" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Music ({results.tracks.length})</Text>
                </View>
                {activeTab === 'All' && results.tracks.length > 5 && (
                  <TouchableOpacity onPress={() => setActiveTab('Music')}>
                    <Text style={styles.seeAllText}>See all</Text>
                  </TouchableOpacity>
                )}
              </View>

              {displayedTracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.musicItem}
                  onPress={() => handlePlayMusic(track)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri:
                        track.cover_art_url ||
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
                    }}
                    style={styles.trackCover}
                  />
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist || 'Unknown Artist'} • {track.genre || 'Afrobeats'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.playIconBtn}
                    onPress={(e) => handlePlayMusic(track, e)}
                  >
                    <Ionicons name="play" size={15} color="#ffffff" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* News Section */}
          {showNews && displayedArticles.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="newspaper" size={18} color="#38bdf8" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>News ({results.articles.length})</Text>
                </View>
                {activeTab === 'All' && results.articles.length > 4 && (
                  <TouchableOpacity onPress={() => setActiveTab('News')}>
                    <Text style={styles.seeAllText}>See all</Text>
                  </TouchableOpacity>
                )}
              </View>

              {displayedArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.newsCard}
                  onPress={() => router.push(`/news/${article.id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.newsInfo}>
                    <View style={styles.newsBadgeRow}>
                      <Text style={styles.newsSourceTag}>{article.source || article.category || 'News'}</Text>
                      <Text style={styles.newsDot}>•</Text>
                      <Text style={styles.newsTime}>{article.published_at || 'Recently'}</Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {article.title}
                    </Text>
                    {article.excerpt && (
                      <Text style={styles.newsExcerpt} numberOfLines={2}>
                        {article.excerpt}
                      </Text>
                    )}
                  </View>

                  <Image
                    source={{
                      uri:
                        article.cover_image_url ||
                        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
                    }}
                    style={styles.newsThumb}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: 54,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingSubtext: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 12,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#242436',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  tagsRowWrapper: {
    marginBottom: 12,
  },
  tagsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  suggestedTag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activeSuggestedTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: '#a855f7',
  },
  suggestedTagText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  activeSuggestedTagText: {
    color: '#c084fc',
    fontWeight: '700',
  },
  tabsWrapper: {
    marginBottom: 14,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    gap: 6,
  },
  activeTabChip: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  tabChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#242436',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  activeTabBadgeText: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionBlock: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllText: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '600',
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
    alignItems: 'center',
  },
  videoThumbWrapper: {
    width: 110,
    height: 68,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
    backgroundColor: '#1e1b4b',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 4,
  },
  videoMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#242436',
  },
  trackCover: {
    width: 46,
    height: 46,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#2a1b3d',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  trackArtist: {
    color: '#94a3b8',
    fontSize: 12,
  },
  playIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 10,
  },
  newsInfo: {
    flex: 1,
    paddingRight: 12,
  },
  newsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  newsSourceTag: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  newsDot: {
    color: '#64748b',
    marginHorizontal: 4,
  },
  newsTime: {
    color: '#64748b',
    fontSize: 11,
  },
  newsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  newsExcerpt: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  newsThumb: {
    width: 76,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
