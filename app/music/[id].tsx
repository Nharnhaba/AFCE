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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getLiveTrackDetail, StreamingTrack } from '../../src/services/musicStreaming';
import { getJamendoTrackDetail } from '../../src/services/jamendoApi';
import { getCCMixterTrackDetail } from '../../src/services/ccmixterApi';
import {
  playTrack,
  togglePlayPause,
  seekTo,
  playNext,
  playPrevious,
  subscribePlaybackState,
  PlaybackState,
} from '../../src/services/audioPlayer';
import { getTrackDetail, toggleLike, toggleBookmark } from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

export default function TrackDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [track, setTrack] = useState<StreamingTrack | any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    isLoading: false,
    currentTrackId: null,
    currentTrack: null,
    queueIndex: -1,
    queueLength: 0,
  });

  useEffect(() => {
    const unsubscribe = subscribePlaybackState((state) => {
      setPlaybackState(state);
      if (state.currentTrack && state.currentTrackId !== track?.id) {
        setTrack(state.currentTrack);
      }
    });
    return unsubscribe;
  }, [track?.id]);

  useEffect(() => {
    if (!id) return;
    const trackId = id as string;

    const fetchTrack = async () => {
      setLoading(true);
      try {
        if (trackId.startsWith('be-')) {
          const backendId = trackId.replace('be-', '');
          const beData = await getTrackDetail(backendId);
          setTrack(beData);
          setLikesCount(beData.likes_count || 0);
          setLiked(!!beData.liked);
        } else if (trackId.startsWith('jamendo-')) {
          // Jamendo full-length track
          const jamendoData = await getJamendoTrackDetail(trackId);
          if (jamendoData) {
            setTrack(jamendoData);
            setLikesCount(jamendoData.likes_count || 220);
            if (jamendoData.audio_url) {
              await playTrack(jamendoData.id, jamendoData.audio_url, {
                title: jamendoData.title,
                artist: jamendoData.artist,
                cover_art_url: jamendoData.cover_art_url,
                duration: jamendoData.duration,
                link: jamendoData.link,
                source_url: jamendoData.source_url,
                external_url: jamendoData.external_url,
              });
            }
          }
        } else if (trackId.startsWith('ccm-')) {
          // ccMixter Creative Commons track
          const ccmData = await getCCMixterTrackDetail(trackId);
          if (ccmData) {
            setTrack(ccmData);
            setLikesCount(ccmData.likes_count || 150);
            if (ccmData.audio_url) {
              await playTrack(ccmData.id, ccmData.audio_url, {
                title: ccmData.title,
                artist: ccmData.artist,
                cover_art_url: ccmData.cover_art_url,
                duration: ccmData.duration,
                link: ccmData.link,
                source_url: ccmData.source_url,
                external_url: ccmData.external_url,
              });
            }
          }
        } else {
          // Live streaming track
          const liveData = await getLiveTrackDetail(trackId);
          if (liveData) {
            setTrack(liveData);
            setLikesCount(liveData.likes_count || 140);
            // Auto play streaming track
            if (liveData.audio_url) {
              await playTrack(liveData.id, liveData.audio_url, {
                title: liveData.title,
                artist: liveData.artist,
                cover_art_url: liveData.cover_art_url,
                duration: liveData.duration,
                link: liveData.link || liveData.source_url || liveData.external_url,
                source_url: liveData.source_url || liveData.link,
                external_url: liveData.external_url || liveData.link,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load track:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, [id]);

  const handleListenFullSong = async () => {
    const fullUrl = track?.source_url || track?.external_url || track?.link || (track?.id ? `https://www.deezer.com/track/${track.id}` : null);
    if (fullUrl) {
      try {
        await Linking.openURL(fullUrl);
      } catch (e) {
        Alert.alert('Error', 'Could not open the track link in your browser or music app.');
      }
    } else {
      Alert.alert(
        'Full Song Link Missing',
        'No source_url or external_url was provided for this track in the backend API.'
      );
    }
  };

  const handleNext = async () => {
    const switched = await playNext();
    if (!switched) {
      handleSeek(0);
    }
  };

  const handlePrevious = async () => {
    const switched = await playPrevious();
    if (!switched) {
      handleSeek(0);
    }
  };

  const handlePlayToggle = async () => {
    if (!track) return;
    if (playbackState.currentTrackId === track.id) {
      await togglePlayPause();
    } else if (track.audio_url) {
      await playTrack(track.id, track.audio_url, {
        title: track.title,
        artist: track.artist,
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        link: track.link || track.source_url || track.external_url,
        source_url: track.source_url || track.link,
        external_url: track.external_url || track.link,
      });
    }
  };

  const handleSeek = (percentage: number) => {
    const targetMs = (playbackState.durationMillis || 30000) * percentage;
    seekTo(targetMs);
  };

  const handleLikeToggle = async () => {
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleBookmarkToggle = async () => {
    setBookmarked(!bookmarked);
    Alert.alert('Saved', bookmarked ? 'Removed from favorites.' : 'Saved to favorite music!');
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

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCurrentTrackPlaying =
    playbackState.currentTrackId === track?.id && playbackState.isPlaying;

  const progressPercent =
    playbackState.durationMillis > 0
      ? Math.min(100, (playbackState.positionMillis / playbackState.durationMillis) * 100)
      : 0;

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
        colors={['rgba(10,10,15,0.4)', 'rgba(10,10,15,0.95)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Now Streaming</Text>
          <View style={styles.streamBadgeRow}>
            <View style={styles.streamDot} />
            <Text style={styles.streamBadgeText}>LIVE CLOUD AUDIO</Text>
          </View>
        </View>
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
            <TouchableOpacity
              style={styles.progressBar}
              onPress={(e) => {
                const clickX = e.nativeEvent.locationX;
                const width = 300; // approximate width
                handleSeek(Math.max(0, Math.min(1, clickX / width)));
              }}
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.progressCurrent,
                  { width: `${progressPercent}%` },
                ]}
              />
              <View
                style={[
                  styles.progressKnob,
                  { left: `${progressPercent}%` },
                ]}
              />
            </TouchableOpacity>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>
                {formatMs(playbackState.positionMillis)}
              </Text>
              <Text style={styles.timeText}>
                {formatMs(playbackState.durationMillis || (track.duration ? track.duration * 1000 : 30000))}
              </Text>
            </View>
          </View>

          {/* Music Control Bar */}
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.sideControl}>
              <Ionicons name="shuffle" size={22} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideControl}
              onPress={handlePrevious}
            >
              <Ionicons name="play-skip-back" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainPlayBtn}
              onPress={handlePlayToggle}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#9333ea', '#7c3aed']}
                style={styles.playGradient}
              >
                {playbackState.isLoading && playbackState.currentTrackId === track.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name={isCurrentTrackPlaying ? 'pause' : 'play'}
                    size={30}
                    color="#fff"
                    style={isCurrentTrackPlaying ? {} : { marginLeft: 3 }}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideControl}
              onPress={handleNext}
            >
              <Ionicons name="play-skip-forward" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideControl}>
              <Ionicons name="repeat" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Listen Full Song Button */}
          <TouchableOpacity
            style={styles.listenFullSongBtn}
            onPress={handleListenFullSong}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.listenFullSongGradient}
            >
              <Ionicons name="open-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.listenFullSongText}>Listen Full Song</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, liked && styles.activeActionBtn]}
            onPress={handleLikeToggle}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? '#a855f7' : '#94a3b8'}
            />
            <Text
              style={[
                styles.actionBtnText,
                liked && styles.activeActionBtnText,
              ]}
            >
              {likesCount} Likes
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

        {/* Comments / Discussion Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

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
                <Text style={styles.commentAuthor}>{c.user?.name || 'Listener'}</Text>
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
  headerTitleBlock: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
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
    backgroundColor: '#22c55e',
    marginRight: 4,
  },
  streamBadgeText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    width: 250,
    height: 250,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
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
    height: 6,
    backgroundColor: '#242436',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  progressCurrent: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 3,
  },
  progressKnob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    marginLeft: -7,
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
  listenFullSongBtn: {
    width: '90%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  listenFullSongGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listenFullSongText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
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
