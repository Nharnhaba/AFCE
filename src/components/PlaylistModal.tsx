import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaylists, createPlaylist, addTrackToPlaylist } from '../services/api';

interface PlaylistModalProps {
  visible: boolean;
  trackId: string | number | null;
  onClose: () => void;
}

export default function PlaylistModal({ visible, trackId, onClose }: PlaylistModalProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPlaylists();
    }
  }, [visible]);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data || []);
    } catch (err) {
      console.error('Failed to load playlists', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    setCreating(true);
    try {
      const res = await createPlaylist(newPlaylistName.trim());
      const newPlaylist = res.playlist || res.data;
      if (trackId && newPlaylist) {
        await addTrackToPlaylist(newPlaylist.id, trackId);
        Alert.alert('Success', 'Track added to new playlist!');
        onClose();
      }
      setNewPlaylistName('');
      loadPlaylists();
    } catch (err) {
      Alert.alert('Error', 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string | number) => {
    if (!trackId) return;
    setIsAdding(true);
    try {
      await addTrackToPlaylist(playlistId, trackId);
      Alert.alert('Success', 'Track added to playlist!');
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to add track');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Playlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.createRow}>
            <TextInput
              style={styles.input}
              placeholder="New Playlist Name"
              placeholderTextColor="#64748b"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleCreateAndAdd}
              disabled={creating || !newPlaylistName.trim()}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#a855f7" />
            </View>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistRow}
                  onPress={() => handleAddToPlaylist(item.id)}
                  disabled={isAdding}
                >
                  <Ionicons name="list" size={24} color="#a855f7" />
                  <Text style={styles.playlistName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No playlists yet. Create one above!</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#161622',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  createRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#242436',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 14,
    height: 44,
    marginRight: 10,
  },
  createBtn: {
    backgroundColor: '#9333ea',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#242436',
  },
  playlistName: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 30,
  },
});
