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

const MOCK_DOWNLOADED_VIDEOS = [
  {
    id: 1,
    title: 'The Future of AI',
    duration: '4:35',
    size: '106 MB',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400',
  },
  {
    id: 2,
    title: 'Beautiful Destinations',
    duration: '8:12',
    size: '210 MB',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  },
  {
    id: 3,
    title: 'Workout Motivation',
    duration: '4:02',
    size: '80 MB',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
  },
  {
    id: 4,
    title: 'Behind The Scenes',
    duration: '3:21',
    size: '75 MB',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
  },
];

const MOCK_DOWNLOADED_MUSIC = [
  {
    id: 101,
    title: 'Afrobeats & Amapiano Party 2026',
    duration: '4:44',
    size: '11 MB',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
  },
  {
    id: 102,
    title: 'High Life',
    duration: '2:41',
    size: '6.4 MB',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
  },
];

export default function DownloadsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Videos');
  const [videos, setVideos] = useState(MOCK_DOWNLOADED_VIDEOS);
  const [music, setMusic] = useState(MOCK_DOWNLOADED_MUSIC);

  const handleDelete = (id: number, type: string) => {
    Alert.alert('Delete Download', 'Remove this item from offline downloads?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (type === 'Videos') {
            setVideos((prev) => prev.filter((v) => v.id !== id));
          } else {
            setMusic((prev) => prev.filter((m) => m.id !== id));
          }
        },
      },
    ]);
  };

  const currentItems = activeTab === 'Videos' ? videos : activeTab === 'Music' ? music : [];

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
        <TouchableOpacity style={styles.backBtn} onPress={() => Alert.alert('Edit Downloads', 'Select items to delete.')}>
          <Feather name="edit-2" size={18} color="#fff" />
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
              else router.push(`/music/${item.id}` as any);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.thumbWrapper}>
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemMeta}>
                {item.duration} • {item.size}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => handleDelete(item.id, activeTab)}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {currentItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-download-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No offline downloads in {activeTab}</Text>
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
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
