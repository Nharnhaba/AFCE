import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTrendingVideos } from '../services/api';

export default function VideosScreen() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingVideos()
      .then(setVideos)
      .catch(err => console.error('Failed to load videos:', err))
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
      <Text style={styles.header}>Trending Videos</Text>
      <FlatList
        data={videos}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.videoItem}>
            <View style={styles.thumbnail}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              {item.views && <Text style={styles.meta}>{item.views} views</Text>}
            </View>
            {item.duration && <Text style={styles.duration}>{item.duration}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No videos found</Text>
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
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a22',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  thumbnail: {
    width: 60,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  playIcon: { color: '#a855f7', fontSize: 18 },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600' },
  meta: { color: '#888', fontSize: 12, marginTop: 2 },
  duration: { color: '#666', fontSize: 13 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 40, fontSize: 15, fontStyle: 'italic' },
});