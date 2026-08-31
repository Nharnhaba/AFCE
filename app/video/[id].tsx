import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getVideoDetail,
  toggleLike,
  toggleBookmark,
  getComments,
  addComment,
  deleteComment,
  getTrendingVideos,
} from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

interface VideoDetail {
  id: string | number;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  views?: number;
  duration?: number | string;
  likes_count?: number;
  liked?: boolean;
  author_name?: string;
}

interface CommentItem {
  id: string | number;
  body: string;
  user?: {
    id: number;
    name: string;
  };
}

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [upNextVideos, setUpNextVideos] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  const fetchDetails = () => {
    if (!id) return;
    Promise.all([
      getVideoDetail(id as string).catch(() => null),
      getComments('video', id as string).catch(() => []),
      getTrendingVideos().catch(() => []),
    ])
      .then(([videoData, commentsData, trendVideos]) => {
        if (videoData) setVideo(videoData);
        setComments(commentsData || []);
        setUpNextVideos(
          (trendVideos || []).filter((v: any) => v.id.toString() !== id.toString())
        );
      })
      .catch((err) => console.error('Failed to load video details:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleLikeToggle = async () => {
    if (!video || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await toggleLike('video', video.id);
      setVideo((prev) =>
        prev ? { ...prev, liked: res.liked, likes_count: res.likes_count } : null
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle like');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!video) return;
    try {
      await toggleBookmark('video', video.id);
      setBookmarked(!bookmarked);
    } catch (err) {
      setBookmarked(!bookmarked);
    }
  };

  const handleShare = () => {
    Alert.alert('Share', `Sharing link to "${video?.title}"`);
  };

  const handleDownload = () => {
    Alert.alert('Download', `Downloading "${video?.title}" for offline playback.`);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !video || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await addComment('video', video.id, newComment);
      setComments((prev) => [res, ...prev]);
      setNewComment('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post comment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (err: any) {
            Alert.alert('Error', 'Failed to delete comment');
          }
        },
      },
    ]);
  };

  const formatDuration = (sec?: number | string) => {
    if (!sec) return '4:35';
    if (typeof sec === 'string' && sec.includes(':')) return sec;
    const s = Number(sec);
    if (isNaN(s)) return '4:35';
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
        <TouchableOpacity style={styles.backBtnPill} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="video" direction="horizontal" opacity={0.2} />

      <LinearGradient
        colors={['rgba(10,10,15,0.4)', 'rgba(10,10,15,0.95)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Player Header Area */}
        <View style={styles.playerWrapper}>
          <Image
            source={{
              uri:
                video.thumbnail_url ||
                'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800',
            }}
            style={styles.playerBackground}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Bar on Player */}
          <View style={styles.playerTopBar}>
            <TouchableOpacity
              style={styles.playerBackBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Center Play Button */}
          <TouchableOpacity style={styles.centerPlayBtn}>
            <Ionicons name="play" size={32} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Player Bottom Progress Bar */}
          <View style={styles.playerBottomControls}>
            <Text style={styles.playerTimeText}>1:20</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFilled, { width: '35%' }]} />
              <View style={styles.progressThumb} />
            </View>
            <Text style={styles.playerTimeText}>{formatDuration(video.duration)}</Text>
            <Ionicons name="scan-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </View>
        </View>

        {/* Video Title & Meta */}
        <View style={styles.detailsBlock}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.videoViewsText}>
            {video.views || '12K'} views • 2 days ago
          </Text>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, video.liked && styles.activeActionBtn]}
              onPress={handleLikeToggle}
              disabled={actionLoading}
            >
              <Ionicons
                name={video.liked ? 'heart' : 'heart-outline'}
                size={20}
                color={video.liked ? '#a855f7' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  video.liked && styles.activeActionBtnText,
                ]}
              >
                {video.likes_count || '1.2K'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={18} color="#94a3b8" />
              <Text style={styles.actionBtnText}>{comments.length || 32}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="arrow-redo-outline" size={19} color="#94a3b8" />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
              <Ionicons name="download-outline" size={19} color="#94a3b8" />
              <Text style={styles.actionBtnText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, bookmarked && styles.activeActionBtn]}
              onPress={handleBookmarkToggle}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={bookmarked ? '#a855f7' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  bookmarked && styles.activeActionBtnText,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Channel / Author Row */}
          <View style={styles.channelRow}>
            <View style={styles.channelInfo}>
              <View style={styles.channelAvatar}>
                <Text style={styles.channelAvatarText}>A</Text>
              </View>
              <View>
                <Text style={styles.channelName}>
                  {video.author_name || 'AFCE Media'}
                </Text>
                <Text style={styles.channelSubs}>54K subscribers</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeBtn,
                subscribed && styles.subscribedBtn,
              ]}
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

          {/* Description Box */}
          <TouchableOpacity
            style={styles.descriptionBox}
            onPress={() => setDescExpanded(!descExpanded)}
            activeOpacity={0.8}
          >
            <Text style={styles.descHeading}>Description</Text>
            <Text
              style={styles.descBody}
              numberOfLines={descExpanded ? undefined : 2}
            >
              {video.description ||
                'Artificial Intelligence is changing the world faster than ever before. In this video, we explore how AI will impact our future, digital streaming media, and the African creative economy.'}
            </Text>
            <Text style={styles.descMore}>
              {descExpanded ? 'Show less' : '...more'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Up Next Section */}
        <View style={styles.upNextSection}>
          <View style={styles.upNextHeader}>
            <Text style={styles.upNextTitle}>Up Next</Text>
            <View style={styles.autoplayRow}>
              <Text style={styles.autoplayText}>Autoplay</Text>
              <Switch
                value={autoplay}
                onValueChange={setAutoplay}
                trackColor={{ false: '#334155', true: '#9333ea' }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>

          {/* Recommended Videos List */}
          {upNextVideos.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recVideoCard}
              onPress={() => router.push(`/video/${item.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.recThumbWrapper}>
                <Image
                  source={{
                    uri:
                      item.thumbnail_url ||
                      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
                  }}
                  style={styles.recThumb}
                />
                <View style={styles.recDurationBadge}>
                  <Text style={styles.recDurationText}>
                    {formatDuration(item.duration)}
                  </Text>
                </View>
              </View>

              <View style={styles.recInfo}>
                <Text style={styles.recTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.recMeta}>
                  {item.views || '8K'} views • 3 days ago
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeading}>Comments ({comments.length})</Text>

          {/* Add Comment Input */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#64748b"
              value={newComment}
              onChangeText={setNewComment}
              editable={!actionLoading}
            />
            <TouchableOpacity
              style={styles.commentSendBtn}
              onPress={handlePostComment}
              disabled={actionLoading || !newComment.trim()}
            >
              <Ionicons name="send" size={18} color="#c084fc" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.map((c) => (
            <View key={c.id} style={styles.commentBubble}>
              <View style={styles.commentTop}>
                <Text style={styles.commentUser}>
                  {c.user?.name || 'AFCE Viewer'}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                  <Ionicons name="trash-outline" size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.commentContent}>{c.body}</Text>
            </View>
          ))}
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
  backBtnPill: {
    backgroundColor: '#161622',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  playerWrapper: {
    height: 230,
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBackground: {
    width: '100%',
    height: '100%',
  },
  playerTopBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
  },
  playerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(147, 51, 234, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  playerBottomControls: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerTimeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginHorizontal: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  progressFilled: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    left: '35%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    marginLeft: -5,
  },
  detailsBlock: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 4,
  },
  videoViewsText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  activeActionBtn: {},
  actionBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  activeActionBtnText: {
    color: '#a855f7',
    fontWeight: '700',
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e1e2d',
    marginBottom: 16,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  channelName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  channelSubs: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  subscribeBtn: {
    backgroundColor: '#9333ea',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  subscribedBtn: {
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#334155',
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
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 20,
  },
  descHeading: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  descBody: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  descMore: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  upNextSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
  },
  autoplayText: {
    color: '#94a3b8',
    fontSize: 12,
    marginRight: 4,
  },
  recVideoCard: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#161622',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#242436',
    alignItems: 'center',
  },
  recThumbWrapper: {
    width: 100,
    height: 62,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 10,
    backgroundColor: '#1e1b4b',
  },
  recThumb: {
    width: '100%',
    height: '100%',
  },
  recDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  recDurationText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  recInfo: {
    flex: 1,
  },
  recTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 3,
  },
  recMeta: {
    color: '#64748b',
    fontSize: 11,
  },
  commentsSection: {
    paddingHorizontal: 20,
  },
  commentsHeading: {
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
  commentBubble: {
    backgroundColor: '#161622',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
  },
  commentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
  },
  commentContent: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 17,
  },
});
