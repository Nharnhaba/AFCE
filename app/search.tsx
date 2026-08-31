import { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getGlobalTrending, searchContent } from '../src/services/api';
import MovingBackground from '../src/components/MovingBackground';

const FILTER_TABS = ['All', 'Videos', 'Music', 'News', 'Users'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    videos: any[];
    tracks: any[];
    articles: any[];
  }>({ videos: [], tracks: [], articles: [] });

  // Initial load trending as suggested search
  useEffect(() => {
    getGlobalTrending()
      .then((res) => {
        if (res && res.trending) {
          setResults({
            videos: res.trending.videos || [],
            tracks: res.trending.tracks || [],
            articles: res.trending.articles || [],
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      getGlobalTrending().then((res) => {
        if (res && res.trending) {
          setResults({
            videos: res.trending.videos || [],
            tracks: res.trending.tracks || [],
            articles: res.trending.articles || [],
          });
        }
      });
      return;
    }

    setLoading(true);
    try {
      const res = await searchContent(text);
      setResults({
        videos: res.videos || res.data?.videos || [],
        tracks: res.tracks || res.data?.tracks || [],
        articles: res.articles || res.data?.articles || [],
      });
    } catch (err) {
      // Client-side fallback filter
      const q = text.toLowerCase();
      setResults((prev) => ({
        videos: prev.videos.filter((v) => v.title.toLowerCase().includes(q)),
        tracks: prev.tracks.filter((t) => t.title.toLowerCase().includes(q) || (t.artist && t.artist.toLowerCase().includes(q))),
        articles: prev.articles.filter((a) => a.title.toLowerCase().includes(q)),
      }));
    } finally {
      setLoading(false);
    }
  };

  const showVideos = activeTab === 'All' || activeTab === 'Videos';
  const showMusic = activeTab === 'All' || activeTab === 'Music';
  const showNews = activeTab === 'All' || activeTab === 'News';

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.25} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.9)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Search Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.searchBarContainer}>
          <Feather name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for movies, music, news..."
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => (
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
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Videos Section */}
          {showVideos && results.videos.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Videos</Text>
                <TouchableOpacity onPress={() => router.push('/(main)/videos')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              {results.videos.slice(0, 3).map((video) => (
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
                          'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400',
                      }}
                      style={styles.videoThumb}
                    />
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>4:35</Text>
                    </View>
                  </View>

                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {video.title}
                    </Text>
                    <Text style={styles.videoMeta}>
                      {video.views || '12K'} views • 2 days ago
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Music Section */}
          {showMusic && results.tracks.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Music</Text>
                <TouchableOpacity onPress={() => router.push('/(main)/music')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              {results.tracks.slice(0, 3).map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.musicItem}
                  onPress={() => router.push(`/music/${track.id}` as any)}
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
                      {track.artist || 'Unknown Artist'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.playIconBtn}
                    onPress={() => router.push(`/music/${track.id}` as any)}
                  >
                    <Ionicons name="play" size={16} color="#c084fc" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* News Section */}
          {showNews && results.articles.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>News</Text>
                <TouchableOpacity onPress={() => router.push('/(main)/news')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              {results.articles.slice(0, 2).map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.newsCard}
                  onPress={() => router.push(`/news/${article.id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.newsInfo}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {article.title}
                    </Text>
                    <Text style={styles.newsTime}>2h ago</Text>
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
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    height: 48,
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
  },
  tabsWrapper: {
    marginBottom: 16,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabChip: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '600',
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
    alignItems: 'center',
  },
  videoThumbWrapper: {
    width: 100,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
    backgroundColor: '#1e1b4b',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
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
    lineHeight: 18,
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
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#242436',
  },
  trackCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
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
  },
  trackArtist: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  playIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 8,
  },
  newsInfo: {
    flex: 1,
    paddingRight: 12,
  },
  newsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  newsTime: {
    color: '#64748b',
    fontSize: 11,
  },
  newsThumb: {
    width: 70,
    height: 65,
    borderRadius: 8,
    backgroundColor: '#2a1b3d',
  },
});
