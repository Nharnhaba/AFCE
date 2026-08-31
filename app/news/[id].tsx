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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getArticleDetail,
  toggleLike,
  toggleBookmark,
  getComments,
  addComment,
  deleteComment,
} from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

interface ArticleDetail {
  id: string | number;
  title: string;
  body: string;
  excerpt?: string;
  category?: string;
  cover_image_url?: string;
  published_at?: string;
  views?: number;
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
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = () => {
    if (!id) return;
    Promise.all([
      getArticleDetail(id as string).catch(() => null),
      getComments('article', id as string).catch(() => []),
    ])
      .then(([articleData, commentsData]) => {
        if (articleData) setArticle(articleData);
        setComments(commentsData || []);
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
      setArticle((prev) =>
        prev ? { ...prev, liked: res.liked, likes_count: res.likes_count } : null
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle like');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!article) return;
    try {
      await toggleBookmark('article', article.id);
      setBookmarked(!bookmarked);
    } catch (err) {
      setBookmarked(!bookmarked);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !article || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await addComment('article', article.id, newComment);
      setComments((prev) => [res, ...prev]);
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
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (err: any) {
            Alert.alert('Error', 'Failed to delete comment');
          }
        },
      },
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
        <TouchableOpacity style={styles.backBtnPill} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="article" direction="vertical" opacity={0.25} />

      <LinearGradient
        colors={['rgba(10,10,15,0.4)', 'rgba(10,10,15,0.9)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Read Article</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleBookmarkToggle}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={bookmarked ? '#a855f7' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <View style={styles.coverWrapper}>
          <Image
            source={{
              uri:
                article.cover_image_url ||
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
            }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.85)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Article Content */}
        <View style={styles.articleBodyWrapper}>
          {article.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {article.category.toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.articleTitle}>{article.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Published 2h ago • {article.views || '15K'} reads
            </Text>
          </View>

          {article.excerpt && (
            <Text style={styles.excerptText}>{article.excerpt}</Text>
          )}

          <Text style={styles.bodyParagraph}>{article.body}</Text>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, article.liked && styles.activeActionBtn]}
              onPress={handleLikeToggle}
              disabled={actionLoading}
            >
              <Ionicons
                name={article.liked ? 'heart' : 'heart-outline'}
                size={20}
                color={article.liked ? '#a855f7' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  article.liked && styles.activeActionBtnText,
                ]}
              >
                {article.likes_count || 0} Likes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Share', `Sharing article "${article.title}"`)}
            >
              <Ionicons name="arrow-redo-outline" size={19} color="#94a3b8" />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#64748b"
              value={newComment}
              onChangeText={setNewComment}
              editable={!actionLoading}
            />
            <TouchableOpacity
              style={styles.commentSendBtn}
              onPress={handlePostComment}
              disabled={actionLoading || !newComment.trim()}
            >
              <Ionicons name="send" size={18} color="#c084fc" />
            </TouchableOpacity>
          </View>

          {comments.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.user?.name || 'Reader'}</Text>
                <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                  <Ionicons name="trash-outline" size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 12,
  },
  backBtnPill: {
    backgroundColor: '#161622',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
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
  scrollContent: {
    paddingBottom: 40,
  },
  coverWrapper: {
    height: 220,
    position: 'relative',
    backgroundColor: '#1e1b4b',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  articleBodyWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#9333ea',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  articleTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  metaRow: {
    marginBottom: 16,
  },
  metaText: {
    color: '#64748b',
    fontSize: 13,
  },
  excerptText: {
    color: '#c084fc',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  bodyParagraph: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e1e2d',
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242436',
    gap: 6,
  },
  activeActionBtn: {
    borderColor: '#a855f7',
    backgroundColor: '#2a1b3d',
  },
  actionBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeActionBtnText: {
    color: '#a855f7',
  },
  commentsSection: {
    paddingHorizontal: 20,
  },
  commentsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#161622',
    color: '#ffffff',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#242436',
    marginRight: 10,
  },
  commentSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentCard: {
    backgroundColor: '#161622',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
  },
  commentBody: {
    color: '#e2e8f0',
    fontSize: 13,
  },
});
