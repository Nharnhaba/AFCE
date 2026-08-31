import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { fetchLiveStreamingVideos } from '../services/videoStreaming';
import { getTrendingVideos } from '../services/api';
import MovingBackground from '../components/MovingBackground';

const CATEGORIES = ['All', 'Trending', 'Music', 'Tech', 'Entertainment', 'Culture', 'Sports'];

export default function VideosScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const spinAnim = useRef(new Animated.Value(0)).current;

  const triggerSpin = () => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadVideos = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
        triggerSpin();
      } else {
        setLoading(true);
      }

      try {
        // 1. Fetch live cloud streaming videos
        const streamVideos = await fetchLiveStreamingVideos(category, isRefresh);

        // 2. Also check if user has uploaded any videos to the backend
        let backendVideos = [];
        try {
          const catParam = category === 'All' || category === 'Trending' ? undefined : category.toLowerCase();
          const beData = await getTrendingVideos(undefined, catParam);
          if (Array.isArray(beData)) {
            backendVideos = beData.map((v) => ({
              id: `be-${v.id}`,
              title: v.title,
              description: v.description,
              thumbnail_url: v.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
              video_url: v.video_url,
              channel_name: v.user?.name || 'AFCE Creator',
              channel_avatar: v.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              views: v.views_count || 120,
              likes_count: v.likes_count || 0,
              duration: v.duration || 180,
              subscribers: 'Community Creator',
              published_at: 'Community Upload',
            }));
          }
        } catch {}

        setVideos([...backendVideos, ...streamVideos]);
      } catch (err) {
        console.error('Failed to load videos:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category]
  );

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const onRefresh = () => {
    loadVideos(true);
  };

  const formatDuration = (sec) => {
    if (!sec) return '3:45';
    const s = Number(sec);
    if (isNaN(s)) return '3:45';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const formatViews = (views) => {
    if (!views) return '12K views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
    return `${views} views`;
  };

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => router.push(`/video/${item.id}`)}
      activeOpacity={0.88}
    >
      {/* 16:9 Thumbnail with Duration Badge */}
      <View style={styles.thumbnailWrapper}>
        <Image
          source={{
            uri:
              item.thumbnail_url ||
              'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
          }}
          style={styles.thumbnail}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Play Icon Badge */}
        <View style={styles.playOverlayBadge}>
          <Ionicons name="play" size={16} color="#ffffff" style={{ marginLeft: 2 }} />
        </View>

        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>

      {/* Video Details Row */}
      <View style={styles.videoDetails}>
        <Image
          source={{
            uri:
              item.channel_avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          }}
          style={styles.channelAvatar}
        />

        <View style={styles.metaColumn}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.channelName}>
            {item.channel_name} • {formatViews(item.views)} • {item.published_at}
          </Text>
        </View>

        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MovingBackground type="video" direction="diagonal" opacity={0.35} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.85)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Watch & Stream</Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveIndicatorText}>LIVE VIDEO STREAMS</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="refresh" size={20} color="#c084fc" />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/search')}
          >
            <Feather name="search" size={19} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                category === item && styles.categoryChipActive,
              ]}
              onPress={() => setCategory(item)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Videos Feed */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Connecting to live video streams...</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#a855f7"
              colors={['#a855f7']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No videos found</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryBtnText}>Tap to Refresh</Text>
              </TouchableOpacity>
            </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
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
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  liveIndicatorText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
  },
  categoryChipActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  feedContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  videoCard: {
    marginBottom: 20,
    backgroundColor: '#161622',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242436',
  },
  thumbnailWrapper: {
    width: '100%',
    height: 195,
    position: 'relative',
    backgroundColor: '#1e1b4b',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlayBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 51, 234, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  videoDetails: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  channelAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    marginTop: 2,
    backgroundColor: '#2a1b3d',
  },
  metaColumn: {
    flex: 1,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  channelName: {
    color: '#94a3b8',
    fontSize: 12,
  },
  moreBtn: {
    padding: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
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