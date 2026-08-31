import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getTrendingArticles } from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

interface ArticleItem {
  id: string | number;
  title: string;
  excerpt?: string;
  category?: string;
  cover_image_url?: string;
  views?: number;
  published_at?: string;
}

const CATEGORIES = ['All', 'World', 'Tech', 'Sports', 'Entertainment', 'Culture'];

export default function NewsTab() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchArticles = () => {
    setLoading(true);
    const catParam = activeCategory === 'All' ? undefined : activeCategory.toLowerCase();
    getTrendingArticles(undefined, catParam)
      .then((data) => setArticles(data || []))
      .catch((err: any) => console.error('Failed to load articles:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArticles();
  }, [activeCategory]);

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
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>News</Text>
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

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : (
          <>
            {/* Featured Article Card */}
            {featuredArticle && (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => router.push(`/news/${featuredArticle.id}` as any)}
                activeOpacity={0.9}
              >
                <Image
                  source={{
                    uri:
                      featuredArticle.cover_image_url ||
                      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
                  }}
                  style={styles.featuredImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(10,10,15,0.95)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.featuredOverlay}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {featuredArticle.category || 'Featured'}
                    </Text>
                  </View>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featuredArticle.title}
                  </Text>
                  <Text style={styles.featuredTime}>2h ago</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* List Articles */}
            <View style={styles.articlesList}>
              {listArticles.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.articleRow}
                  onPress={() => router.push(`/news/${item.id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.articleTextSide}>
                    <Text style={styles.rowCategory}>
                      {item.category || 'News'}
                    </Text>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowTime}>4h ago</Text>
                  </View>

                  <Image
                    source={{
                      uri:
                        item.cover_image_url ||
                        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400',
                    }}
                    style={styles.rowThumbnail}
                  />
                </TouchableOpacity>
              ))}

              {articles.length === 0 && (
                <Text style={styles.emptyText}>No news articles found</Text>
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
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
    height: 190,
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
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#9333ea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    justifyContent: 'space-between',
  },
  rowCategory: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
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
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
