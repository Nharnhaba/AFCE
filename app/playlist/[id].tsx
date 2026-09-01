import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../../src/components/MovingBackground';
import { getPlaylist, removeTrackFromPlaylist } from '../../src/services/api';

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    setLoading(true);
    try {
      const data = await getPlaylist(id as string);
      setPlaylist(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load playlist');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrack = (trackId: string | number, trackName: string) => {
    Alert.alert('Remove Track', `Are you sure you want to remove "${trackName}" from this playlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTrackFromPlaylist(id as string, trackId);
            setPlaylist((prev: any) => ({
              ...prev,
              tracks: prev.tracks.filter((t: any) => t.id !== trackId)
            }));
          } catch (err) {
            Alert.alert('Error', 'Failed to remove track');
          }
        }
      }
    ]);
  };

  const renderTrack = ({ item }: { item: any }) => (
    <View style={styles.trackCard}>
      <View style={styles.iconContainer}>
        <Ionicons name="musical-note" size={20} color="#a855f7" />
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{item.artist || 'Unknown Artist'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeBtn}
        onPress={() => handleRemoveTrack(item.id, item.title)}
      >
        <Ionicons name="remove-circle-outline" size={22} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="music" direction="diagonal" opacity={0.2} />
      <LinearGradient colors={['rgba(10,10,15,0.7)', '#0a0a0f']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {playlist?.name || 'Playlist'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={playlist?.tracks || []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTrack}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={64} color="#334155" />
            <Text style={styles.emptyTitle}>Empty Playlist</Text>
            <Text style={styles.emptySubtitle}>
              Add tracks to this playlist from the Music tab!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
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
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#161622',
    borderWidth: 1, borderColor: '#242436', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },
  listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(168,85,247,0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  trackInfo: { flex: 1 },
  trackTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  trackArtist: { color: '#94a3b8', fontSize: 13 },
  removeBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
