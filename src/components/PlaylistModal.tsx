import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { getPlaylists, createPlaylist, addTrackToPlaylist } from '../services/api';

interface PlaylistModalProps {
  visible: boolean;
  trackId: string | number | null;
  trackTitle?: string;
  onClose: () => void;
  onPlaylistCreated?: () => void;
}

export default function PlaylistModal({
  visible,
  trackId,
  trackTitle,
  onClose,
  onPlaylistCreated,
}: PlaylistModalProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | number | null>(null);

  // Creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(Array.isArray(data) ? data : data?.playlists || []);
    } catch (err: any) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadPlaylists();
      setShowCreateForm(false);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
    }
  }, [visible, loadPlaylists]);

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Validation', 'Please provide a playlist name');
      return;
    }
    setCreating(true);
    try {
      const res = await createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim() || undefined);
      const newPlaylist = res.playlist || res.data || res;
      
      if (trackId && newPlaylist?.id) {
        await addTrackToPlaylist(newPlaylist.id, trackId);
        Alert.alert('Success', `Track added to "${newPlaylistName.trim()}"!`);
      } else {
        Alert.alert('Success', `Playlist "${newPlaylistName.trim()}" created!`);
      }
      
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateForm(false);
      if (onPlaylistCreated) onPlaylistCreated();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlist: any) => {
    if (!trackId) return;
    setIsAdding(true);
    setAddingToPlaylistId(playlist.id);
    try {
      await addTrackToPlaylist(playlist.id, trackId);
      Alert.alert('Success', `Added "${trackTitle || 'track'}" to "${playlist.name || 'playlist'}"!`);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add track to playlist');
    } finally {
      setIsAdding(false);
      setAddingToPlaylistId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="musical-notes" size={18} color="#c084fc" />
              </View>
              <View>
                <Text style={styles.title}>Add to Playlist</Text>
                {trackTitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    "{trackTitle}"
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Toggle Create Form / List */}
          {!showCreateForm ? (
            <TouchableOpacity
              style={styles.newPlaylistToggleBtn}
              onPress={() => setShowCreateForm(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={22} color="#a855f7" style={{ marginRight: 8 }} />
              <Text style={styles.newPlaylistToggleText}>Create New Playlist</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.createBox}>
              <Text style={styles.createBoxTitle}>New Playlist</Text>
              <TextInput
                style={styles.input}
                placeholder="Playlist name (required)"
                placeholderTextColor="#64748b"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Description (optional)"
                placeholderTextColor="#64748b"
                value={newPlaylistDesc}
                onChangeText={setNewPlaylistDesc}
                multiline
              />
              <View style={styles.createActionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowCreateForm(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createBtn, !newPlaylistName.trim() && styles.btnDisabled]}
                  onPress={handleCreateAndAdd}
                  disabled={creating || !newPlaylistName.trim()}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createBtnText}>Create & Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Playlists List */}
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#a855f7" />
              <Text style={styles.loadingText}>Loading playlists...</Text>
            </View>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isCurrentAdding = isAdding && addingToPlaylistId === item.id;
                const trackCount = item.tracks_count ?? item.tracks?.length ?? 0;
                return (
                  <TouchableOpacity
                    style={styles.playlistRow}
                    onPress={() => handleAddToPlaylist(item)}
                    disabled={isAdding}
                    activeOpacity={0.75}
                  >
                    <View style={styles.playlistIconBox}>
                      <Ionicons name="list" size={20} color="#a855f7" />
                    </View>
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistName} numberOfLines={1}>
                        {item.name || item.title || 'Untitled Playlist'}
                      </Text>
                      <Text style={styles.playlistTracksCount}>
                        {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                        {item.description ? ` • ${item.description}` : ''}
                      </Text>
                    </View>
                    {isCurrentAdding ? (
                      <ActivityIndicator size="small" color="#a855f7" />
                    ) : (
                      <Ionicons name="add-circle-outline" size={24} color="#64748b" />
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="musical-notes-outline" size={40} color="#334155" />
                  <Text style={styles.emptyText}>No playlists found</Text>
                  <Text style={styles.emptySubText}>
                    Create your first playlist above to start organizing your favorite tracks.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: '#161622',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '82%',
    borderTopWidth: 1,
    borderColor: '#242436',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e1e2d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPlaylistToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1b3d',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a855f7',
    marginBottom: 16,
  },
  newPlaylistToggleText: {
    color: '#c084fc',
    fontSize: 14,
    fontWeight: '700',
  },
  createBox: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 16,
  },
  createBoxTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    marginBottom: 10,
  },
  inputMultiline: {
    height: 60,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  createActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1e1e2d',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: '#9333ea',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  loader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 10,
  },
  playlistIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
    marginRight: 8,
  },
  playlistName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  playlistTracksCount: {
    color: '#94a3b8',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
});
