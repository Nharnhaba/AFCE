import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import {
  getLiveVideoDetail,
  fetchLiveStreamingVideos,
  StreamingVideo,
} from '../../src/services/videoStreaming';
import {
  getVideoDetail,
  toggleLike,
  toggleBookmark,
  getComments,
  addComment,
  deleteComment,
} from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const videoRef = useRef<Video>(null);

  const [video, setVideo] = useState<StreamingVideo | any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [upNextVideos, setUpNextVideos] = useState<StreamingVideo[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const videoId = id as string;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (videoId.startsWith('be-')) {
          const backendId = videoId.replace('be-', '');
          const beData = await getVideoDetail(backendId);
          setVideo(beData);
          setLikesCount(beData.likes_count || 0);
          setLiked(!!beData.liked);
        } else {
          // Live cloud streaming video
          const liveData = await getLiveVideoDetail(videoId);
          if (liveData) {
            setVideo(liveData);
            setLikesCount(liveData.likes_count || 45000);
          }
        }

        // Up next videos
        const streams = await fetchLiveStreamingVideos('All');
        setUpNextVideos(streams.filter((v) => v.id.toString() !== videoId));
      } catch (err) {
        console.error('Failed to load video details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handlePlayToggle = async () => {
    if (videoRef.current) {
      if (videoStatus.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const handleOpenYouTube = async () => {
    if (video?.youtube_id) {
      await WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${video.youtube_id}`);
    }
  };

  const handleLikeToggle = () => {
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleBookmarkToggle = () => {
    setBookmarked(!bookmarked);
    Alert.alert('Saved', bookmarked ? 'Removed from saved videos.' : 'Added to your Watch Later list!');
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      body: newComment.trim(),
      user: { name: 'You' },
    };
    setComments([newEntry, ...comments]);
    setNewComment('');
  };

  const formatViews = (views?: number) => {
    if (!views) return '1.2M views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
    return `${views} views`;
  };

  const formatDuration = (sec?: number | string) => {
    if (!sec) return '3:45';
    const s = Number(sec);
    if (isNaN(s)) return '3:45';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Video not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="video" direction="diagonal" opacity={0.25} />

      <LinearGradient
        colors={['rgba(10,10,15,0.4)', 'rgba(10,10,15,0.95)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {video.channel_name || 'Video Stream'}
          </Text>
          <View style={styles.streamBadgeRow}>
            <View style={styles.streamDot} />
            <Text style={styles.streamBadgeText}>LIVE CLOUD VIDEO</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={handleBookmarkToggle}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={bookmarked ? '#a855f7' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Native Live Video Player */}
        <View style={styles.playerContainer}>
          <Video
            ref={videoRef}
            source={{
              uri:
                video.video_url ||
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            }}
            posterSource={{ uri: video.thumbnail_url }}
            usePoster
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            useNativeControls
            style={styles.videoPlayer}
            onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
          />
        </View>

        {/* Video Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.videoTitle}>{video.title}</Text>

          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {formatViews(video.views)} • {video.published_at || 'Recently'}
            </Text>
            {video.youtube_id && (
              <TouchableOpacity
                style={styles.youtubeLinkBtn}
                onPress={handleOpenYouTube}
              >
                <Ionicons name="logo-youtube" size={14} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={styles.youtubeLinkText}>Watch on YouTube</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 5-Action Toolbar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actionBtn, liked && styles.activeActionBtn]}
              onPress={handleLikeToggle}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? '#a855f7' : '#94a3b8'}
              />
              <Text style={[styles.actionText, liked && styles.activeActionText]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={19} color="#94a3b8" />
              <Text style={styles.actionText}>{comments.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Share', `Sharing "${video.title}"`)}
            >
              <Ionicons name="arrow-redo-outline" size={20} color="#94a3b8" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleBookmarkToggle}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={19}
                color={bookmarked ? '#a855f7' : '#94a3b8'}
              />
              <Text style={[styles.actionText, bookmarked && styles.activeActionText]}>
                {bookmarked ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Channel Info Row */}
          <View style={styles.channelRow}>
            <Image
              source={{
                uri:
                  video.channel_avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              }}
              style={styles.channelAvatar}
            />
            <View style={styles.channelMeta}>
              <Text style={styles.channelName}>{video.channel_name || 'Creator'}</Text>
              <Text style={styles.subscriberCount}>
                {video.subscribers || '1.2M subscribers'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.subscribeBtn, subscribed && styles.subscribedBtn]}
              onPress={() => setSubscribed(!subscribed)}
            >
              <Text
                style={[
                  styles.subscribeBtnText,
                  subscribed && styles.subscribedBtnText,
                ]}
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Collapsible Description */}
          <TouchableOpacity
            style={styles.descriptionBox}
            onPress={() => setDescExpanded(!descExpanded)}
            activeOpacity={0.8}
          >
            <Text
              style={styles.descriptionText}
              numberOfLines={descExpanded ? undefined : 3}
            >
              {video.description || 'Enjoy this high quality live video stream on AFCE Media.'}
            </Text>
            <Text style={styles.showMoreText}>
              {descExpanded ? 'Show less' : 'Show more...'}
            </Text>
          </TouchableOpacity>

          {/* Up Next Recommendations */}
          <View style={styles.upNextHeader}>
            <Text style={styles.upNextTitle}>Up Next</Text>
            <View style={styles.autoplayRow}>
              <Text style={styles.autoplayText}>Autoplay</Text>
              <Switch
                value={autoplay}
                onValueChange={setAutoplay}
                trackColor={{ false: '#242436', true: '#9333ea' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {upNextVideos.slice(0, 4).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.upNextCard}
              onPress={() =>
                router.push({
                  pathname: '/video/[id]',
                  params: { id: item.id },
                } as any)
              }
            >
              <View style={styles.upNextThumbWrapper}>
                <Image
                  source={{ uri: item.thumbnail_url }}
                  style={styles.upNextThumb}
                />
                <View style={styles.upNextDuration}>
                  <Text style={styles.upNextDurationText}>
                    {formatDuration(item.duration)}
                  </Text>
                </View>
              </View>

              <View style={styles.upNextInfo}>
                <Text style={styles.upNextItemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.upNextItemChannel}>
                  {item.channel_name} • {formatViews(item.views)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#64748b"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={styles.commentSendBtn}
                onPress={handlePostComment}
                disabled={!newComment.trim()}
              >
                <Ionicons name="send" size={18} color="#c084fc" />
              </TouchableOpacity>
            </View>

            {comments.map((c) => (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>
                    {c.user?.name || 'Viewer'}
                  </Text>
                </View>
                <Text style={styles.commentBody}>{c.body}</Text>
              </View>
            ))}
          </View>
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
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#161622',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBlock: {
    alignItems: 'center',
    maxWidth: '65%',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  streamBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  streamDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  streamBadgeText: {
    color: '#f87171',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  playerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  youtubeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#242436',
  },
  youtubeLinkText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e1e2d',
    marginBottom: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  activeActionBtn: {
    opacity: 0.9,
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeActionText: {
    color: '#a855f7',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  channelAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#2a1b3d',
  },
  channelMeta: {
    flex: 1,
  },
  channelName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  subscriberCount: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  subscribeBtn: {
    backgroundColor: '#9333ea',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  subscribedBtn: {
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
  },
  subscribeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  subscribedBtnText: {
    color: '#94a3b8',
  },
  descriptionBox: {
    backgroundColor: '#161622',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#242436',
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  showMoreText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  upNextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  upNextTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  autoplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoplayText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  upNextCard: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#161622',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242436',
  },
  upNextThumbWrapper: {
    width: 120,
    height: 75,
    position: 'relative',
    backgroundColor: '#1e1b4b',
  },
  upNextThumb: {
    width: '100%',
    height: '100%',
  },
  upNextDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upNextDurationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  upNextInfo: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  upNextItemTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  upNextItemChannel: {
    color: '#64748b',
    fontSize: 11,
  },
  commentsSection: {
    marginTop: 10,
  },
  commentsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#161622',
    color: '#ffffff',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#242436',
    marginRight: 10,
  },
  commentSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentCard: {
    backgroundColor: '#161622',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
  },
  commentBody: {
    color: '#e2e8f0',
    fontSize: 13,
  },
});
