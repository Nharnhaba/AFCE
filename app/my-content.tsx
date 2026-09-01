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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../src/components/MovingBackground';
import { 
  getMyVideos, getMyTracks, getMyArticles,
  deleteVideo, deleteTrack, deleteArticle
} from '../src/services/api';

export default function MyContentScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'videos' | 'tracks' | 'articles'>('videos');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'videos') res = await getMyVideos();
      else if (activeTab === 'tracks') res = await getMyTracks();
      else if (activeTab === 'articles') res = await getMyArticles();
      setData(res || []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = (id: string | number) => {
    Alert.alert('Delete Content', 'Are you sure you want to delete this item? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (activeTab === 'videos') await deleteVideo(id);
            else if (activeTab === 'tracks') await deleteTrack(id);
            else if (activeTab === 'articles') await deleteArticle(id);
            setData(data.filter(item => item.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete content');
          }
        },
      }
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const iconName = activeTab === 'videos' ? 'play-circle' : activeTab === 'tracks' ? 'musical-notes' : 'document-text';
    const iconColor = activeTab === 'videos' ? '#f43f5e' : activeTab === 'tracks' ? '#10b981' : '#3b82f6';
    
    return (
      <View style={styles.card}>
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
            {item.status === 'published' ? 'Published' : 'Draft'} • {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.2} />
      <LinearGradient colors={['rgba(10,10,15,0.7)', '#0a0a0f']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/upload')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {(['videos', 'tracks', 'articles'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
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
              <Ionicons name="cloud-upload-outline" size={64} color="#334155" />
              <Text style={styles.emptyTitle}>No {activeTab} yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to upload your first {activeTab.slice(0, -1)}!
              </Text>
            </View>
          }
        />
      )}
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
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#161622',
    borderWidth: 1, borderColor: '#242436', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  tabsContainer: {
    flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#a855f7' },
  tabText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#a855f7' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    flexDirection: 'row', backgroundColor: '#161622', borderRadius: 12,
    padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#242436', alignItems: 'center',
  },
  imageContainer: { width: 60, height: 60, borderRadius: 8, marginRight: 14, position: 'relative' },
  image: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#242436' },
  typeBadge: {
    position: 'absolute', bottom: -4, right: -4, width: 20, height: 20,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#161622',
  },
  info: { flex: 1, justifyContent: 'center' },
  title: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  subtitle: { color: '#94a3b8', fontSize: 13 },
  deleteBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
