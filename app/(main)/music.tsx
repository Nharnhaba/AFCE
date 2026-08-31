import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getTrendingTracks } from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

interface TrackItem {
  id: string | number;
  title: string;
  artist?: string;
  duration?: string;
}

export default function MusicTab() {
  const router = useRouter();
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingTracks()
      .then(setTracks)
      .catch((err: any) => console.error('Failed to load tracks:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="music" direction="circular" opacity={0.65} />
        <View style={styles.overlay} />

      <LinearGradient
        colors={['rgba(30,30,40,0.5)', '#1a1a25']}
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.header}>Trending Music</Text>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.trackItem}
            onPress={() => router.push(`/music/${item.id}` as any)}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🎵</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist || 'Unknown Artist'}</Text>
            </View>
            {item.duration && <Text style={styles.duration}>{item.duration}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No music tracks found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 24, paddingTop: 40 },
  header: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  centered: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 24 },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a22',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  artist: { color: '#888', fontSize: 13, marginTop: 2 },
  duration: { color: '#666', fontSize: 14 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 40, fontSize: 15, fontStyle: 'italic' },
});
