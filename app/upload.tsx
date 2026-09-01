import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../src/components/MovingBackground';
import {
  uploadVideo,
  uploadTrack,
  uploadArticle,
} from '../src/services/api';

type TabType = 'video' | 'music' | 'article';

export default function UploadScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [artist, setArtist] = useState('');
  const [genreOrCategory, setGenreOrCategory] = useState('');
  const [bodyText, setBodyText] = useState('');

  const handleUploadSubmit = async () => {
    if (!title || (!mediaUrl && activeTab !== 'article') || (!bodyText && activeTab === 'article')) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
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

      Alert.alert('Success', 'Content uploaded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Something went wrong');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <MovingBackground type="all" direction="diagonal" opacity={0.2} />
      <LinearGradient colors={['rgba(10,10,15,0.7)', '#0a0a0f']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Content</Text>
        <View style={{ width: 40 }} />
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          placeholderTextColor="#64748b"
          value={title}
          onChangeText={setTitle}
        />

        {activeTab === 'music' && (
          <>
            <Text style={styles.label}>Artist *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter artist name"
              placeholderTextColor="#64748b"
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
              placeholderTextColor="#64748b"
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
              placeholderTextColor="#64748b"
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
          placeholder={`e.g. ${activeTab === 'music' ? 'Pop, Jazz' : 'Tech, Education'}`}
          placeholderTextColor="#64748b"
          value={genreOrCategory}
          onChangeText={setGenreOrCategory}
        />

        <Text style={styles.label}>Cover / Thumbnail Image URL</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter cover art URL"
          placeholderTextColor="#64748b"
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
              placeholderTextColor="#64748b"
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
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderColor: '#1e1e2d',
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#161622',
    borderWidth: 1, borderColor: '#242436', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabButton: { borderBottomColor: '#a855f7' },
  tabText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#a855f7' },
  formContainer: { padding: 24, paddingBottom: 60 },
  label: { color: '#e2e8f0', fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 16, marginLeft: 4 },
  input: {
    backgroundColor: '#161622', color: '#fff', paddingHorizontal: 16, height: 52,
    borderRadius: 12, borderWidth: 1, borderColor: '#242436', fontSize: 15,
  },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: 16 },
  submitBtn: {
    backgroundColor: '#a855f7', height: 54, borderRadius: 12, alignItems: 'center',
    marginTop: 32, justifyContent: 'center', shadowColor: '#a855f7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
