import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { fetchLiveNews, LiveArticle } from '../../src/services/rss';
import { getTrendingArticles } from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

const CATEGORIES = ['All', 'World', 'Tech', 'Sports', 'Entertainment', 'Culture'];

export default function NewsTab() {
  const router = useRouter();
  const [articles, setArticles] = useState<LiveArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const loadNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch live internet RSS feeds
      const rssData = await fetchLiveNews(activeCategory, isRefresh);

      // 2. Also fetch any user-published articles from backend
      let backendArticles: LiveArticle[] = [];
      try {
        const catParam = activeCategory === 'All' ? undefined : activeCategory.toLowerCase();
        const beData = await getTrendingArticles(undefined, catParam);
        if (Array.isArray(beData)) {
          backendArticles = beData.map((a: any) => ({
            id: `be-${a.id}`,
            title: a.title,
            excerpt: a.excerpt || a.body?.slice(0, 140) || '',
            body: a.body || '',
            category: a.category || 'World',
            cover_image_url: a.cover_image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
            source: a.author_name || 'AFCE Community',
            published_at: 'Community Post',
            link: '',
            views: a.views || 120,
            likes_count: a.likes_count || 0,
          }));
        }
      } catch {}

      // Merge backend community articles on top of live RSS internet feeds
      setArticles([...backendArticles, ...rssData]);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const onRefresh = () => {
    loadNews(true);
  };

  const featuredArticle = articles[0];
  const listArticles = articles.slice(1);

  return (
    <View style={styles.container}>
      <MovingBackground type="article" direction="vertical" opacity={0.35} />

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
            onRefresh={onRefresh}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Global News & Feeds</Text>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveIndicatorText}>LIVE WORLDWIDE FEEDS</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/search')}
          >
            <Feather name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Categories Chips */}
        <View style={styles.chipsWrapper}>
          <FlatList
            horizontal
            data={CATEGORIES}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.chipsContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chip,
                  activeCategory === item && styles.activeChip,
                ]}
                onPress={() => setActiveCategory(item)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeCategory === item && styles.activeChipText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingFeedText}>Fetching live RSS internet updates...</Text>
          </View>
        ) : (
          <>
            {/* Featured Article Card */}
            {featuredArticle && (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => router.push({ pathname: '/news/[id]', params: { id: featuredArticle.id } } as any)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: featuredArticle.cover_image_url }}
                  style={styles.featuredImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(10,10,15,0.95)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.featuredOverlay}>
                  <View style={styles.badgeRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {featuredArticle.category}
                      </Text>
                    </View>
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>
                        {featuredArticle.source}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featuredArticle.title}
                  </Text>
                  <Text style={styles.featuredTime}>
                    {featuredArticle.published_at}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* List Articles */}
            <View style={styles.articlesList}>
              {listArticles.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.articleRow}
                  onPress={() => router.push({ pathname: '/news/[id]', params: { id: item.id } } as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.articleTextSide}>
                    <View style={styles.rowSourceRow}>
                      <Text style={styles.rowCategory}>
                        {item.category}
                      </Text>
                      <Text style={styles.rowDot}>•</Text>
                      <Text style={styles.rowSource}>
                        {item.source}
                      </Text>
                    </View>

                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <Text style={styles.rowTime}>{item.published_at}</Text>
                  </View>

                  <Image
                    source={{ uri: item.cover_image_url }}
                    style={styles.rowThumbnail}
                  />
                </TouchableOpacity>
              ))}

              {articles.length === 0 && !loading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="newspaper-outline" size={48} color="#475569" />
                  <Text style={styles.emptyText}>No live news articles found</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => loadNews(true)}>
                    <Text style={styles.retryBtnText}>Tap to Refresh</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
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
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFeedText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  liveIndicatorText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsWrapper: {
    marginBottom: 18,
  },
  chipsContainer: {
    paddingRight: 10,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#161622',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#242436',
  },
  activeChip: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#ffffff',
  },
  featuredCard: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sourceBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sourceBadgeText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 4,
  },
  featuredTime: {
    color: '#94a3b8',
    fontSize: 12,
  },
  articlesList: {
    gap: 12,
  },
  articleRow: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#242436',
  },
  articleTextSide: {
    flex: 1,
    paddingRight: 12,
  },
  rowSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rowCategory: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowDot: {
    color: '#64748b',
    fontSize: 10,
  },
  rowSource: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  rowTime: {
    color: '#64748b',
    fontSize: 11,
  },
  rowThumbnail: {
    width: 80,
    height: 75,
    borderRadius: 10,
    backgroundColor: '#2a1b3d',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
    fontStyle: 'italic',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#2a1b3d',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#c084fc',
    fontWeight: '600',
  },
});
