import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalTrending, getCurrentUser, loadStoredName } from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

interface MediaItem {
  id: string | number;
  title: string;
  duration?: string | number;
  artist?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [topMusic, setTopMusic] = useState<MediaItem[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Load stored user name instantly for immediate greeting render
    loadStoredName().then(name => {
      if (name) setUserName(name);
    });

    Promise.all([
      getGlobalTrending(undefined, 5).catch(() => null),
      getCurrentUser().catch(() => null)
    ])
      .then(([trendRes, userRes]) => {
        if (trendRes) {
          setTrending(trendRes.trending?.videos || []);
          setTopMusic(trendRes.trending?.tracks || []);
        }
        if (userRes && userRes.name) {
          setUserName(userRes.name);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = () => {
    if (search.trim()) {
      router.push(`/videos?search=${encodeURIComponent(search)}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="all" opacity={0.25} />

      <LinearGradient
        colors={['rgba(10,10,15,0.4)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.greeting}>Hi, {userName || 'User'} 👋</Text>
        <Text style={styles.subtitle}>Good to see you again</Text>

        <TextInput
          style={styles.search}
          placeholder="Search for videos, music..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />

        <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
        <FlatList
          horizontal
          data={trending}
          keyExtractor={item => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.trendingCard}
              onPress={() => router.push(`/video/${item.id}` as any)}
            >
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.duration || '0:00'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No trending videos yet</Text>
          }
        />

        <Text style={styles.sectionTitle}>🎵 Top Music</Text>
        {topMusic.map(track => (
          <TouchableOpacity 
            key={track.id} 
            style={styles.musicRow}
            onPress={() => router.push(`/music/${track.id}` as any)}
          >
            <Text style={styles.cardTitle}>{track.title}</Text>
            <Text style={styles.cardMeta}>{track.artist || 'Unknown'} · {track.duration || '0:00'}</Text>
          </TouchableOpacity>
        ))}
        {topMusic.length === 0 && (
          <Text style={styles.emptyText}>No top music yet</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scrollContent: { padding: 20, paddingTop: 40 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '600', marginTop: 12 },
  subtitle: { color: '#888', marginBottom: 20 },
  search: { backgroundColor: '#1a1a22', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  trendingCard: { backgroundColor: '#1a1a22', padding: 16, borderRadius: 12, marginRight: 12, width: 160 },
  musicRow: { backgroundColor: '#1a1a22', padding: 14, borderRadius: 10, marginBottom: 10 },
  cardTitle: { color: '#fff', fontWeight: '600' },
  cardMeta: { color: '#888', fontSize: 12, marginTop: 4 },
  centered: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#444', fontStyle: 'italic', paddingLeft: 8, marginVertical: 8 },
});