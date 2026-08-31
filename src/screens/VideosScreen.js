import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getTrendingVideos, getCategories } from '../services/api';
import MovingBackground from '../components/MovingBackground';

export default function VideosScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [sort, setSort] = useState('latest'); // 'latest' or 'trending'

  const fetchVideos = () => {
    setLoading(true);
    const catParam = category === 'All' ? undefined : category.toLowerCase();
    const sortParam = sort === 'trending' ? 'trending' : undefined;
    getTrendingVideos(search || undefined, catParam, sortParam)
      .then(setVideos)
      .catch(err => console.error('Failed to load videos:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getCategories()
      .then(cats => {
        if (cats && cats.length > 0) {
          const capitalized = cats.map(c => c.charAt(0).toUpperCase() + c.slice(1));
          setCategories(['All', ...capitalized]);
        }
      })
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [category, sort]);

  return (
    <View style={styles.container}>
      <MovingBackground type="video" opacity={0.25} />
      
      <LinearGradient
        colors={['rgba(10,10,15,0.4)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.header}>Videos</Text>
      
      {/* Search Input */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search videos..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={fetchVideos}
        returnKeyType="search"
      />

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryTab, category === item && styles.activeCategoryTab]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.categoryText, category === item && styles.activeCategoryText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sort === 'latest' && styles.activeSortButton]}
          onPress={() => setSort('latest')}
        >
          <Text style={[styles.sortText, sort === 'latest' && styles.activeSortText]}>Latest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sort === 'trending' && styles.activeSortButton]}
          onPress={() => setSort('trending')}
        >
          <Text style={[styles.sortText, sort === 'trending' && styles.activeSortText]}>Trending</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.videoItem}
              onPress={() => router.push(`/video/${item.id}`)}
            >
              <View style={styles.thumbnail}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                {item.views !== undefined && <Text style={styles.meta}>{item.views} views</Text>}
              </View>
              {item.duration && <Text style={styles.duration}>{item.duration}</Text>}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No videos found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 24, paddingTop: 40 },
  header: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  searchBar: {
    backgroundColor: '#1a1a22',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 15,
  },
  categoriesContainer: { marginBottom: 16, minHeight: 36 },
  categoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1a1a22',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  activeCategoryTab: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  categoryText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeCategoryText: { color: '#fff' },
  sortContainer: { flexDirection: 'row', marginBottom: 16 },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#1a1a22',
  },
  activeSortButton: {
    backgroundColor: '#2a1b3d',
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  sortText: { color: '#888', fontSize: 13, fontWeight: '500' },
  activeSortText: { color: '#a855f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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