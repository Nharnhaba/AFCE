import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../src/components/MovingBackground';
import { getBookmarks } from '../src/services/api';

export default function BookmarksScreen() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    try {
      const data = await getBookmarks();
      const allBookmarks = [
        ...(data.bookmarks?.videos || []).map((v: any) => ({ ...v, _type: 'video' })),
        ...(data.bookmarks?.tracks || []).map((t: any) => ({ ...t, _type: 'track' })),
        ...(data.bookmarks?.articles || []).map((a: any) => ({ ...a, _type: 'article' })),
      ];
      // Sort by some criteria if needed, assuming the API returns latest, we can just leave it or sort by ID
      setBookmarks(allBookmarks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookmarks();
  };

  const handlePress = (item: any) => {
    if (item._type === 'video') router.push(`/video/${item.id}`);
    else if (item._type === 'track') router.push(`/music/${item.id}`);
    else if (item._type === 'article') router.push(`/news/${item.id}`);
  };

  const renderItem = ({ item }: { item: any }) => {
    const iconName = item._type === 'video' ? 'play-circle' : item._type === 'track' ? 'musical-notes' : 'document-text';
    const iconColor = item._type === 'video' ? '#f43f5e' : item._type === 'track' ? '#10b981' : '#3b82f6';
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePress(item)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.thumbnail_url || item.cover_art_url || item.cover_image_url || 'https://via.placeholder.com/150' }}
            style={styles.image}
          />
          <View style={[styles.typeBadge, { backgroundColor: iconColor }]}>
            <Ionicons name={iconName} size={12} color="#fff" />
          </View>
        </View>
        
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.artist || item.channelTitle || item.category || 'Unknown'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748b" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.2} />

      <LinearGradient
        colors={['rgba(10,10,15,0.7)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Bookmarks</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => `${item._type}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#a855f7"
              colors={['#a855f7']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={64} color="#334155" />
              <Text style={styles.emptyTitle}>No Bookmarks</Text>
              <Text style={styles.emptySubtitle}>
                Save videos, tracks, or articles you want to find easily later!
              </Text>
            </View>
          }
        />
      )}
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242436',
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 14,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#242436',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#161622',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '40%',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
