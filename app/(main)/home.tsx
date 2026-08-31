import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const trending = [
  { id: '1', title: 'Official Trailer', duration: '2:45' },
  { id: '2', title: 'Ocean Vibes', duration: '4:20' },
];
const topMusic = [
  { id: '1', title: 'Calm Down', artist: 'Rema', duration: '3:41' },
  { id: '2', title: 'As It Was', artist: 'Harry Styles', duration: '2:47' },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Hi, Tino 👋</Text>
      <Text style={styles.subtitle}>Good to see you again</Text>

      <TextInput
        style={styles.search}
        placeholder="Search for videos, music, news..."
        placeholderTextColor="#666"
      />

      <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
      <FlatList
        horizontal
        data={trending}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.trendingCard}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.duration}</Text>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>🎵 Top Music</Text>
      {topMusic.map(track => (
        <View key={track.id} style={styles.musicRow}>
          <Text style={styles.cardTitle}>{track.title}</Text>
          <Text style={styles.cardMeta}>{track.artist} · {track.duration}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 20 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '600' },
  subtitle: { color: '#888', marginBottom: 20 },
  search: { backgroundColor: '#1a1a22', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  trendingCard: { backgroundColor: '#1a1a22', padding: 16, borderRadius: 12, marginRight: 12, width: 160 },
  musicRow: { backgroundColor: '#1a1a22', padding: 14, borderRadius: 10, marginBottom: 10 },
  cardTitle: { color: '#fff', fontWeight: '600' },
  cardMeta: { color: '#888', fontSize: 12, marginTop: 4 },
});