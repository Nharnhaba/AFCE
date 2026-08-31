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
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getTrackDetail,
  toggleLike,
  toggleBookmark,
  getComments,
  addComment,
  deleteComment,
} from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

interface TrackDetail {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  duration?: string | number;
  cover_art_url?: string;
  audio_url?: string;
  likes_count?: number;
  liked?: boolean;
}

interface CommentItem {
  id: string | number;
  body: string;
  user?: {
    id: number;
    name: string;
  };
}

export default function TrackDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = () => {
    if (!id) return;
    Promise.all([
      getTrackDetail(id as string).catch(() => null),
      getComments('track', id as string).catch(() => []),
    ])
      .then(([trackData, commentsData]) => {
        if (trackData) setTrack(trackData);
        setComments(commentsData || []);
      })
      .catch((err) => console.error('Failed to load track details:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleLikeToggle = async () => {
    if (!track || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await toggleLike('track', track.id);
      setTrack((prev) =>
        prev ? { ...prev, liked: res.liked, likes_count: res.likes_count } : null
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle like');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!track) return;
    try {
      await toggleBookmark('track', track.id);
      setBookmarked(!bookmarked);
    } catch (err) {
      setBookmarked(!bookmarked);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !track || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await addComment('track', track.id, newComment);
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
    if (!sec) return '3:41';
    if (typeof sec === 'string' && sec.includes(':')) return sec;
    const s = Number(sec);
    if (isNaN(s)) return '3:41';
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

  if (!track) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Track not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="music" direction="circular" opacity={0.3} />

      <LinearGradient
        colors={['rgba(10,10,15,0.4)', 'rgba(10,10,15,0.9)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleBookmarkToggle}
        >
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
        {/* Cover Art Stage */}
        <View style={styles.artworkStage}>
          <Image
            source={{
              uri:
                track.cover_art_url ||
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
            }}
            style={styles.coverArt}
          />

          <Text style={styles.trackTitle}>{track.title}</Text>
          <Text style={styles.trackArtist}>{track.artist}</Text>
          {track.album && <Text style={styles.trackAlbum}>{track.album}</Text>}

          {/* Scrubber Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressCurrent, { width: '40%' }]} />
              <View style={styles.progressKnob} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>1:15</Text>
              <Text style={styles.timeText}>{formatDuration(track.duration)}</Text>
            </View>
          </View>

          {/* Music Control Bar */}
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.sideControl}>
              <Ionicons name="shuffle" size={22} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideControl}>
              <Ionicons name="play-skip-back" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainPlayBtn}
              onPress={() => setIsPlaying(!isPlaying)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#9333ea', '#7c3aed']}
                style={styles.playGradient}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={30}
                  color="#fff"
                  style={isPlaying ? {} : { marginLeft: 3 }}
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideControl}>
              <Ionicons name="play-skip-forward" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideControl}>
              <Ionicons name="repeat" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, track.liked && styles.activeActionBtn]}
            onPress={handleLikeToggle}
            disabled={actionLoading}
          >
            <Ionicons
              name={track.liked ? 'heart' : 'heart-outline'}
              size={20}
              color={track.liked ? '#a855f7' : '#94a3b8'}
            />
            <Text
              style={[
                styles.actionBtnText,
                track.liked && styles.activeActionBtnText,
              ]}
            >
              {track.likes_count || 0} Likes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert('Share', `Sharing "${track.title}"`)}
          >
            <Ionicons name="arrow-redo-outline" size={19} color="#94a3b8" />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

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

          {comments.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.user?.name || 'Listener'}</Text>
                <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                  <Ionicons name="trash-outline" size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.commentBody}>{c.body}</Text>
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
    paddingBottom: 16,
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  artworkStage: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  coverArt: {
    width: 240,
    height: 240,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  trackArtist: {
    color: '#c084fc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackAlbum: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#242436',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  progressCurrent: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 2,
  },
  progressKnob: {
    position: 'absolute',
    left: '40%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
  },
  sideControl: {
    padding: 10,
  },
  mainPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  playGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e1e2d',
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242436',
    gap: 6,
  },
  activeActionBtn: {
    borderColor: '#a855f7',
    backgroundColor: '#2a1b3d',
  },
  actionBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeActionBtnText: {
    color: '#a855f7',
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
