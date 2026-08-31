import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import MovingBackground from '../src/components/MovingBackground';

const DOWNLOAD_TABS = ['Videos', 'Music', 'Articles'];

export default function DownloadsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [music, setMusic] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  const handleDelete = (id: number, type: string) => {
    Alert.alert('Delete Download', 'Remove this item from offline downloads?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (type === 'Videos') {
            setVideos((prev) => prev.filter((v) => v.id !== id));
          } else if (type === 'Music') {
            setMusic((prev) => prev.filter((m) => m.id !== id));
          } else {
            setArticles((prev) => prev.filter((a) => a.id !== id));
          }
        },
      },
    ]);
  };

  const currentItems = activeTab === 'Videos' ? videos : activeTab === 'Music' ? music : articles;

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.25} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.9)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Downloads</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => Alert.alert('Downloads', 'Offline storage management')}
        >
          <Feather name="folder" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsRow}>
        {DOWNLOAD_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.activeTabChip]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabChipText,
                activeTab === tab && styles.activeTabChipText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Downloads List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.downloadCard}
            onPress={() => {
              if (activeTab === 'Videos') router.push(`/video/${item.id}` as any);
              else if (activeTab === 'Music') router.push(`/music/${item.id}` as any);
              else router.push(`/news/${item.id}` as any);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.thumbWrapper}>
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{item.duration || '0:00'}</Text>
              </View>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemMeta}>
                {item.duration || '0:00'} • {item.size || 'Local File'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => handleDelete(item.id, activeTab)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {currentItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-download-outline" size={54} color="#334155" />
            <Text style={styles.emptyTitle}>No Downloads</Text>
            <Text style={styles.emptyText}>
              Downloaded {activeTab.toLowerCase()} will appear here for offline viewing.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: 54,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  tabChip: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
  },
  activeTabChip: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  tabChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabChipText: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  downloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242436',
  },
  thumbWrapper: {
    width: 100,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
    backgroundColor: '#1e1b4b',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  infoBlock: {
    flex: 1,
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  menuBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
