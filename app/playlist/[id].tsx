import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../../src/components/MovingBackground';
import {
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  removeTrackFromPlaylist,
} from '../../src/services/api';
import {
  playTrack,
  subscribePlaybackState,
  PlaybackState,
} from '../../src/services/audioPlayer';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [playlist, setPlaylist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingTrackId, setRemovingTrackId] = useState<string | number | null>(null);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Playback state
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
    const unsub = subscribePlaybackState((state) => {
      setPlaybackState(state);
    });
    return unsub;
  }, []);

  const fetchPlaylistDetail = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPlaylist(id as string);
      const playlistData = data.playlist || data.data || data;
      setPlaylist(playlistData);

      const rawTracks = playlistData.tracks || [];
      setTracks(Array.isArray(rawTracks) ? rawTracks : []);
      setEditName(playlistData.name || playlistData.title || '');
      setEditDesc(playlistData.description || '');
    } catch (err: any) {
      console.error('Failed to load playlist:', err);
      Alert.alert('Error', err.message || 'Could not load playlist details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylistDetail();
  }, [fetchPlaylistDetail]);

  const onRefresh = () => {
    fetchPlaylistDetail(true);
  };

  const handleOpenEditModal = () => {
    setEditName(playlist?.name || playlist?.title || '');
    setEditDesc(playlist?.description || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Playlist name cannot be empty');
      return;
    }

    setSavingEdit(true);
    try {
      await updatePlaylist(id as string, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });

      setPlaylist((prev: any) => ({
        ...prev,
        name: editName.trim(),
        title: editName.trim(),
        description: editDesc.trim(),
      }));

      setEditModalVisible(false);
      Alert.alert('Success', 'Playlist updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update playlist');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePlaylist = () => {
    const name = playlist?.name || playlist?.title || 'this playlist';
    Alert.alert('Delete Playlist', `Are you sure you want to delete "${name}"? This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlaylist(id as string);
            Alert.alert('Deleted', 'Playlist has been deleted.', [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete playlist');
          }
        },
      },
    ]);
  };

  const handleRemoveTrack = (track: any) => {
    const trackTitle = track.title || 'Track';
    Alert.alert('Remove Track', `Remove "${trackTitle}" from this playlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingTrackId(track.id);
          try {
            await removeTrackFromPlaylist(id as string, track.id);
            setTracks((prev) => prev.filter((t) => t.id !== track.id));
            setPlaylist((prev: any) => ({
              ...prev,
              tracks_count: Math.max(0, (prev?.tracks_count || 1) - 1),
            }));
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to remove track from playlist');
          } finally {
            setRemovingTrackId(null);
          }
        },
      },
    ]);
  };

  const handlePlayTrack = (track: any) => {
    const audioUrl = track.audio_url || track.preview || '';
    if (!audioUrl) {
      Alert.alert('Audio Unavailable', 'No audio stream is available for this track.');
      return;
    }

    playTrack(track.id, audioUrl, {
      title: track.title,
      artist: track.artist || 'Artist',
      cover_art_url: track.cover_art_url || '',
      duration: track.duration,
      link: track.link || track.source_url || track.external_url,
    });
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    handlePlayTrack(tracks[0]);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const playlistTitle = playlist?.name || playlist?.title || 'Playlist Details';
  const playlistDesc = playlist?.description;

  const renderTrackItem = ({ item, index }: { item: any; index: number }) => {
    const isCurrentPlaying =
      playbackState.currentTrackId === item.id && playbackState.isPlaying;
    const isRemoving = removingTrackId === item.id;

    return (
      <View style={styles.trackCard}>
        {/* Track Index or Playing Indicator */}
        <TouchableOpacity
          style={styles.trackIndexBox}
          onPress={() => handlePlayTrack(item)}
        >
          {isCurrentPlaying ? (
            <Ionicons name="volume-high" size={18} color="#34d399" />
          ) : (
            <Text style={styles.trackIndexText}>{index + 1}</Text>
          )}
        </TouchableOpacity>

        {/* Artwork */}
        <TouchableOpacity
          style={styles.artworkWrapper}
          onPress={() => handlePlayTrack(item)}
        >
          <Image
            source={{
              uri:
                item.cover_art_url ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
            }}
            style={styles.trackArt}
          />
        </TouchableOpacity>

        {/* Track Info */}
        <TouchableOpacity
          style={styles.trackInfo}
          onPress={() => handlePlayTrack(item)}
        >
          <Text
            style={[
              styles.trackTitle,
              isCurrentPlaying && { color: '#34d399', fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.artist || 'Unknown Artist'} {item.genre ? `• ${item.genre}` : ''}
          </Text>
        </TouchableOpacity>

        {/* Duration */}
        <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>

        {/* Play / Pause Toggle Button */}
        <TouchableOpacity
          style={[
            styles.playTrackBtn,
            isCurrentPlaying && styles.playTrackBtnActive,
          ]}
          onPress={() => handlePlayTrack(item)}
        >
          <Ionicons
            name={isCurrentPlaying ? 'pause' : 'play'}
            size={16}
            color={isCurrentPlaying ? '#ffffff' : '#a855f7'}
          />
        </TouchableOpacity>

        {/* Remove Track Button */}
        <TouchableOpacity
          style={styles.removeTrackBtn}
          onPress={() => handleRemoveTrack(item)}
          disabled={isRemoving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Ionicons name="remove-circle-outline" size={20} color="#ef4444" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MovingBackground type="music" direction="diagonal" opacity={0.2} />

      <LinearGradient
        colors={['rgba(10,10,15,0.7)', 'rgba(10,10,15,0.95)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Playlist
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleOpenEditModal}>
            <Feather name="edit-2" size={18} color="#c084fc" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { marginLeft: 8 }]}
            onPress={handleDeletePlaylist}
          >
            <Ionicons name="trash-outline" size={19} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Loading playlist...</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#a855f7"
              colors={['#a855f7']}
            />
          }
          ListHeaderComponent={
            <View style={styles.heroSection}>
              <LinearGradient
                colors={['#7c3aed', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCover}
              >
                <Ionicons name="musical-notes" size={48} color="#ffffff" />
              </LinearGradient>

              <Text style={styles.heroTitle}>{playlistTitle}</Text>
              {playlistDesc ? (
                <Text style={styles.heroDesc}>{playlistDesc}</Text>
              ) : null}

              <Text style={styles.heroMeta}>
                {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              </Text>

              {/* Action Buttons */}
              {tracks.length > 0 && (
                <View style={styles.heroBtnRow}>
                  <TouchableOpacity
                    style={styles.playAllBtn}
                    onPress={handlePlayAll}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.playAllText}>Play All</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={handleOpenEditModal}
                    activeOpacity={0.85}
                  >
                    <Feather name="edit" size={16} color="#c084fc" style={{ marginRight: 6 }} />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.divider} />
              <Text style={styles.tracksSectionTitle}>Tracks</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyTracksContainer}>
              <Ionicons name="musical-note-outline" size={48} color="#334155" />
              <Text style={styles.emptyTitle}>This playlist is empty</Text>
              <Text style={styles.emptySubtitle}>
                Add tracks from the Music screen or Search results by tapping the "+" button.
              </Text>
            </View>
          }
        />
      )}

      {/* Edit Playlist Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Feather name="edit-3" size={18} color="#c084fc" />
              </View>
              <Text style={styles.modalTitle}>Edit Playlist</Text>
            </View>

            <Text style={styles.inputLabel}>Playlist Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist name"
              placeholderTextColor="#64748b"
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Description"
              placeholderTextColor="#64748b"
              value={editDesc}
              onChangeText={setEditDesc}
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, !editName.trim() && styles.btnDisabled]}
                onPress={handleSaveEdit}
                disabled={savingEdit || !editName.trim()}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderBottomWidth: 1,
    borderColor: '#1e1e2d',
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
    maxWidth: 200,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerContainer: {
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  heroCover: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  heroMeta: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  playAllText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242436',
  },
  editText: {
    color: '#c084fc',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#1e1e2d',
    marginTop: 12,
    marginBottom: 16,
  },
  tracksSectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
  },
  trackIndexBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  trackIndexText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  artworkWrapper: {
    marginRight: 12,
  },
  trackArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2a1b3d',
  },
  trackInfo: {
    flex: 1,
    marginRight: 8,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  trackArtist: {
    color: '#94a3b8',
    fontSize: 12,
  },
  trackDuration: {
    color: '#64748b',
    fontSize: 12,
    marginRight: 10,
  },
  playTrackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playTrackBtnActive: {
    backgroundColor: '#10b981',
  },
  removeTrackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTracksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161622',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242436',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#242436',
    borderRadius: 12,
    color: '#ffffff',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    marginBottom: 14,
  },
  inputMultiline: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#1e1e2d',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#9333ea',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
