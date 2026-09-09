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
import { getLocalVideoFiles, requestMediaPermission } from '../services/localMedia';
import MovingBackground from '../components/MovingBackground';

const CATEGORIES = ['All', 'Trending', 'On Device', 'Music', 'Tech', 'Entertainment', 'Culture', 'Sports'];

export default function VideosScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [localVideos, setLocalVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [localPermissionGranted, setLocalPermissionGranted] = useState<boolean | null>(null);
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

  const loadLocalVideos = useCallback(async () => {
    setLocalLoading(true);
    try {
      const assets = await getLocalVideoFiles();
      setLocalVideos(assets || []);
      setLocalPermissionGranted(true);
    } catch (err: any) {
      setLocalPermissionGranted(false);
    } finally {
      setLocalLoading(false);
    }
  }, []);

  const handleRequestLocalPermission = async () => {
    const granted = await requestMediaPermission();
    if (granted) {
      await loadLocalVideos();
    } else {
      setLocalPermissionGranted(false);
    }
  };

  const loadVideos = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
        triggerSpin();
      } else {
        setLoading(true);
      }

      if (category === 'On Device') {
        await loadLocalVideos();
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        // 1. Fetch live cloud streaming videos
        const streamVideos = await fetchLiveStreamingVideos(category, isRefresh);

        // 2. Also check if user has uploaded any videos to the backend
        let backendVideos: any[] = [];
        try {
          const catParam = category === 'All' || category === 'Trending' ? undefined : category.toLowerCase();
          const beData = await getTrendingVideos(undefined, catParam);
          if (Array.isArray(beData)) {
            backendVideos = beData.map((v) => ({
              id: `be-${v.id}`,
              title: v.title,
              description: v.description,
              thumbnail_url: v.thumbnail_url || (v.youtube_id ? `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'),
              video_url: v.video_url,
              youtube_id: v.youtube_id,
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
    [category, loadLocalVideos]
  );

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const onRefresh = () => {
    loadVideos(true);
  };

  const formatDuration = (sec: number | string) => {
    if (!sec) return '0:00';
    const s = Number(sec);
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const rem = Math.floor(s % 60);
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const formatViews = (views: number | string) => {
    if (!views) return '12K views';
    if (typeof views === 'string') return views;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
    return `${views} views`;
  };

  const renderVideoItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => router.push(`/video/${item.id}` as any)}
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
        <View style={styles.videoInfoText}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.videoMetaRow}>
            <Text style={styles.channelName} numberOfLines={1}>
              {item.channel_name || 'AFCE Stream'}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaViews}>{formatViews(item.views)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaTime}>{item.published_at || 'Recently'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLocalVideoItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() =>
        router.push({
          pathname: '/video/[id]',
          params: {
            id: `local-${item.id}`,
            uri: item.uri,
            video_url: item.uri,
            title: item.filename,
            duration: item.duration,
          },
        } as any)
      }
      activeOpacity={0.88}
    >
      <View style={styles.thumbnailWrapper}>
        <Image
          source={{
            uri:
              item.uri ||
              'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800',
          }}
          style={styles.thumbnail}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.playOverlayBadge}>
          <Ionicons name="play" size={16} color="#ffffff" style={{ marginLeft: 2 }} />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>

      <View style={styles.videoDetails}>
        <View style={styles.localIconBadge}>
          <Ionicons name="phone-portrait-outline" size={18} color="#c084fc" />
        </View>
        <View style={styles.videoInfoText}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.filename || 'Local Video'}
          </Text>
          <View style={styles.videoMetaRow}>
            <Text style={styles.channelName}>On This Device</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaViews}>{formatDuration(item.duration)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MovingBackground type="video" direction="diagonal" opacity={0.25} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.92)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Watch Live</Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveIndicatorText}>AFCE VIDEO NETWORK</Text>
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
              {item === 'On Device' && (
                <Ionicons
                  name="phone-portrait-outline"
                  size={13}
                  color={category === item ? '#ffffff' : '#94a3b8'}
                  style={{ marginRight: 4 }}
                />
              )}
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

      {/* On Device Tab View */}
      {category === 'On Device' ? (
        localPermissionGranted === false ? (
          <View style={styles.permissionContainer}>
            <View style={styles.permissionIconCircle}>
              <Ionicons name="folder-open-outline" size={42} color="#a855f7" />
            </View>
            <Text style={styles.permissionTitle}>Device Media Access Required</Text>
            <Text style={styles.permissionText}>
              Allow access to your media library to view and play videos stored on this device.
            </Text>
            <TouchableOpacity
              style={styles.grantBtn}
              onPress={handleRequestLocalPermission}
              activeOpacity={0.85}
            >
              <Text style={styles.grantBtnText}>Allow Access</Text>
            </TouchableOpacity>
          </View>
        ) : localLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingText}>Scanning device video files...</Text>
          </View>
        ) : (
          <FlatList
            data={localVideos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderLocalVideoItem}
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
                <Ionicons name="film-outline" size={48} color="#475569" />
                <Text style={styles.emptyText}>No local videos found</Text>
                <Text style={styles.emptySubtext}>
                  Videos stored on your device storage will appear here.
                </Text>
              </View>
            }
          />
        )
      ) : (
        /* Cloud / Trending Videos Feed */
        loading && !refreshing ? (
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
        )
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
    marginTop: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  liveIndicatorText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 8,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  feedContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  videoCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
  },
  thumbnailWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: '#12121a',
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  durationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  videoDetails: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#2a1b3d',
  },
  localIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoInfoText: {
    flex: 1,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  channelName: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: '#64748b',
    marginHorizontal: 5,
    fontSize: 10,
  },
  metaViews: {
    color: '#64748b',
    fontSize: 12,
  },
  metaTime: {
    color: '#64748b',
    fontSize: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#9333ea',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#161622',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#242436',
  },
  permissionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  grantBtn: {
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  grantBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
