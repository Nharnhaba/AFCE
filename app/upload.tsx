import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getMyVideos,
  getMyTracks,
  getMyArticles,
  uploadVideo,
  uploadTrack,
  uploadArticle,
  deleteVideo,
  deleteTrack,
  deleteArticle,
} from '../src/services/api';

type TabType = 'video' | 'music' | 'article';

interface MediaItem {
  id: string | number;
  title: string;
  artist?: string;
  category?: string;
  genre?: string;
}

export default function UploadDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [artist, setArtist] = useState('');
  const [genreOrCategory, setGenreOrCategory] = useState('');
  const [bodyText, setBodyText] = useState('');

  const fetchMyContent = () => {
    setLoading(true);
    const fetchFunc =
      activeTab === 'video'
        ? getMyVideos
        : activeTab === 'music'
        ? getMyTracks
        : getMyArticles;

    fetchFunc()
      .then(setItems)
      .catch((err) => console.error('Failed to load my uploads:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyContent();
  }, [activeTab]);

  const handleDeleteItem = (itemId: string | number) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this upload?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const deleteFunc =
              activeTab === 'video'
                ? deleteVideo
                : activeTab === 'music'
                ? deleteTrack
                : deleteArticle;

            await deleteFunc(itemId);
            setItems((prev) => prev.filter((i) => i.id !== itemId));
          } catch (err: any) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleUploadSubmit = async () => {
    if (!title || !mediaUrl) {
      if (activeTab === 'article' && !bodyText) {
        Alert.alert('Error', 'Please fill in required fields');
        return;
      }
      if (activeTab !== 'article') {
        Alert.alert('Error', 'Please fill in required fields');
        return;
      }
    }

    setSubmitLoading(true);
    try {
      if (activeTab === 'video') {
        await uploadVideo(title, mediaUrl, description, genreOrCategory, coverUrl);
      } else if (activeTab === 'music') {
        await uploadTrack(title, artist || 'Unknown', mediaUrl, genreOrCategory, coverUrl);
      } else {
        await uploadArticle(title, bodyText, description, genreOrCategory, coverUrl);
      }

      Alert.alert('Success', 'Content uploaded successfully!');
      setFormVisible(false);
      resetForm();
      fetchMyContent();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Something went wrong');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setCoverUrl('');
    setArtist('');
    setGenreOrCategory('');
    setBodyText('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Creator Dashboard</Text>
        <TouchableOpacity onPress={() => setFormVisible(true)}>
          <Ionicons name="add-circle" size={28} color="#a855f7" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['video', 'music', 'article'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}S
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>
                  {activeTab === 'music'
                    ? item.artist
                    : item.category || item.genre || 'General'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                <Ionicons name="trash" size={20} color="#ff4a5a" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>You haven't uploaded any {activeTab}s yet.</Text>
          }
        />
      )}

      {/* Upload Modal Form */}
      <Modal visible={formVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload {activeTab}</Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter title"
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
              />

              {activeTab === 'music' && (
                <>
                  <Text style={styles.label}>Artist *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter artist name"
                    placeholderTextColor="#666"
                    value={artist}
                    onChangeText={setArtist}
                  />
                </>
              )}

              {activeTab !== 'article' ? (
                <>
                  <Text style={styles.label}>Media URL *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter media source URL"
                    placeholderTextColor="#666"
                    value={mediaUrl}
                    onChangeText={setMediaUrl}
                    autoCapitalize="none"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Body Content *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter article text body..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={6}
                    value={bodyText}
                    onChangeText={setBodyText}
                  />
                </>
              )}

              <Text style={styles.label}>
                {activeTab === 'music' ? 'Genre' : 'Category'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Pop, Education, Tech"
                placeholderTextColor="#666"
                value={genreOrCategory}
                onChangeText={setGenreOrCategory}
              />

              <Text style={styles.label}>Cover / Thumbnail Image URL</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter cover art URL"
                placeholderTextColor="#666"
                value={coverUrl}
                onChangeText={setCoverUrl}
                autoCapitalize="none"
              />

              {activeTab !== 'music' && (
                <>
                  <Text style={styles.label}>Short Summary / Excerpt</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Short description..."
                    placeholderTextColor="#666"
                    value={description}
                    onChangeText={setDescription}
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleUploadSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Content</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a22',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a22' },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTabButton: { backgroundColor: '#1a1a22', borderWidth: 1, borderColor: '#a855f7' },
  tabText: { color: '#666', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#a855f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a22',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  itemMeta: { color: '#888', fontSize: 12, marginTop: 4 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: {
    height: '85%',
    backgroundColor: '#0a0a0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  formContainer: { paddingBottom: 60 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#1a1a22', color: '#fff', padding: 12, borderRadius: 10 },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    minHeight: 48,
    justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
