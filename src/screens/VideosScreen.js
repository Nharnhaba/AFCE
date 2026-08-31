import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getTrendingVideos, getCategories } from '../services/api';
import MovingBackground from '../components/MovingBackground';

export default function VideosScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState(['All', 'Trending', 'Music', 'Entertainment', 'Tech', 'Culture']);

  const fetchVideos = () => {
    setLoading(true);
    const catParam = (category === 'All' || category === 'Trending') ? undefined : category.toLowerCase();
    const sortParam = category === 'Trending' ? 'trending' : undefined;
    getTrendingVideos(undefined, catParam, sortParam)
      .then((data) => setVideos(data || []))
      .catch((err) => console.error('Failed to load videos:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          const capitalized = cats.map((c) => c.charAt(0).toUpperCase() + c.slice(1));
          setCategories(['All', 'Trending', ...capitalized]);
        }
      })
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [category]);

  const formatDuration = (sec) => {
    if (!sec) return '4:35';
    if (typeof sec === 'string' && sec.includes(':')) return sec;
    const s = Number(sec);
    if (isNaN(s)) return '4:35';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const formatViews = (views) => {
    if (!views) return '12K views • 2 days ago';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K views • 2 days ago`;
    return `${views} views`;
  };

  return (
    <View style={styles.container}>
      <MovingBackground type="video" direction="horizontal" opacity={0.35} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.85)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header Bar */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Videos</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Feather name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.chipsWrapper}>
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                category === item && styles.activeChip,
              ]}
              onPress={() => setCategory(item)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  category === item && styles.activeChipText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Video Feed */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.videoCard}
              onPress={() => router.push(`/video/${item.id}`)}
              activeOpacity={0.85}
            >
              {/* Thumbnail with duration badge */}
              <View style={styles.thumbnailWrapper}>
                <Image
                  source={{
                    uri:
                      item.thumbnail_url ||
                      'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600',
                  }}
                  style={styles.thumbnail}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                </View>
              </View>

              {/* Video Info Row */}
              <View style={styles.videoInfoRow}>
                <View style={styles.videoTextContainer}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.videoMeta}>{formatViews(item.views)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => router.push(`/video/${item.id}`)}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No videos found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 20,
    paddingTop: 54,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 24,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 14,
    marginBottom: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#242436',
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: 120,
    height: 75,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1e1b4b',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  videoInfoRow: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoTextContainer: {
    flex: 1,
    paddingRight: 8,
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
  moreButton: {
    padding: 6,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontStyle: 'italic',
  },
});