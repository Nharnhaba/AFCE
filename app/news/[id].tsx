import { useLocalSearchParams, useRouter } from 'expo-router';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getArticleDetail, toggleLike, getComments, addComment, deleteComment } from '../../src/services/api';

interface ArticleDetail {
  id: string | number;
  title: string;
  body: string;
  excerpt?: string;
  category?: string;
  published_at?: string;
  likes_count?: number;
  liked?: boolean;
}

interface CommentItem {
  id: string | number;
  body: string;
  user?: {
    id: number;
    name: string;
  };
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = () => {
    if (!id) return;
    Promise.all([
      getArticleDetail(id as string),
      getComments('article', id as string)
    ])
      .then(([articleData, commentsData]) => {
        setArticle(articleData);
        setComments(commentsData);
      })
      .catch((err) => console.error('Failed to load article details:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleLikeToggle = async () => {
    if (!article || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await toggleLike('article', article.id);
      setArticle(prev => prev ? { ...prev, liked: res.liked, likes_count: res.likes_count } : null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle like');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !article || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await addComment('article', article.id, newComment);
      setComments(prev => [res, ...prev]);
      setNewComment('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post comment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
          } catch (err: any) {
            Alert.alert('Error', 'Failed to delete comment');
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Article not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Read Article</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Photo Placeholder */}
        <View style={styles.coverPlaceholder}>
          <Ionicons name="newspaper" size={48} color="#a855f7" />
        </View>

        {/* Article Details */}
        <View style={styles.articleSection}>
          {article.category && <Text style={styles.articleCategory}>{article.category.toUpperCase()}</Text>}
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.meta}>Published: {article.published_at || 'Recently'}</Text>
          <Text style={styles.bodyText}>{article.body}</Text>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, article.liked && styles.activeActionButton]} 
              onPress={handleLikeToggle}
              disabled={actionLoading}
            >
              <Ionicons 
                name={article.liked ? 'heart' : 'heart-outline'} 
                size={20} 
                color={article.liked ? '#a855f7' : '#888'} 
              />
              <Text style={[styles.actionText, article.liked && styles.activeActionText]}>
                {article.likes_count || 0} Likes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

          {/* New Comment Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              value={newComment}
              onChangeText={setNewComment}
              editable={!actionLoading}
            />
            <TouchableOpacity 
              style={styles.postButton} 
              onPress={handlePostComment}
              disabled={actionLoading || !newComment.trim()}
            >
              <Ionicons name="send" size={20} color="#a855f7" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.map(c => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.user?.name || 'Anonymous'}</Text>
                <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                  <Ionicons name="trash-outline" size={16} color="#ff4a5a" />
                </TouchableOpacity>
              </View>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          ))}
          {comments.length === 0 && (
            <Text style={styles.noCommentsText}>Be the first to comment!</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  centered: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ff4a5a', fontSize: 16, marginBottom: 12 },
  backButton: { backgroundColor: '#1a1a22', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  backText: { color: '#fff', fontWeight: '600' },
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
  scrollContent: { paddingBottom: 40 },
  coverPlaceholder: {
    height: 180,
    backgroundColor: '#1a1a22',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  articleSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a22' },
  articleCategory: { color: '#a855f7', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8, lineHeight: 28 },
  meta: { color: '#666', fontSize: 13, marginBottom: 20 },
  bodyText: { color: '#ddd', fontSize: 15, lineHeight: 24, marginBottom: 24 },
  actionRow: { flexDirection: 'row' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a22',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  activeActionButton: {
    borderColor: '#a855f7',
    backgroundColor: '#2a1b3d',
  },
  actionText: { color: '#888', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  activeActionText: { color: '#a855f7' },
  commentsSection: { padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  commentInput: {
    flex: 1,
    backgroundColor: '#1a1a22',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
  },
  postButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentCard: { backgroundColor: '#1a1a22', padding: 14, borderRadius: 10, marginBottom: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor: { color: '#c084fc', fontSize: 13, fontWeight: '600' },
  commentBody: { color: '#eee', fontSize: 14, lineHeight: 18 },
  noCommentsText: { color: '#444', fontStyle: 'italic', textAlign: 'center', marginTop: 12 },
});
