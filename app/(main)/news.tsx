import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getTrendingArticles } from '../../src/services/api';

interface ArticleItem {
  id: string | number;
  title: string;
  source?: string;
  publishedAt?: string;
}

export default function NewsTab() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingArticles()
      .then(setArticles)
      .catch((err: any) => console.error('Failed to load articles:', err))
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
      <Text style={styles.header}>Trending News</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.articleItem}
            onPress={() => router.push(`/news/${item.id}` as any)}
          >
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <View style={styles.metadata}>
                <Text style={styles.source}>{item.source || 'General News'}</Text>
                {item.publishedAt && <Text style={styles.dot}>•</Text>}
                {item.publishedAt && <Text style={styles.date}>{item.publishedAt}</Text>}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No news articles found</Text>
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
  articleItem: {
    backgroundColor: '#1a1a22',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  textContainer: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 22 },
  metadata: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  source: { color: '#c084fc', fontSize: 12, fontWeight: '600' },
  dot: { color: '#444', marginHorizontal: 6, fontSize: 12 },
  date: { color: '#666', fontSize: 12 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 40, fontSize: 15, fontStyle: 'italic' },
});
