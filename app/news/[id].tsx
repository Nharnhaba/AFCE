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
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { getLiveArticleById, LiveArticle } from '../../src/services/rss';
import {
  getArticleDetail,
  toggleLike,
  toggleBookmark,
  getComments,
  addComment,
  deleteComment,
} from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [article, setArticle] = useState<LiveArticle | any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const articleId = id as string;

    const fetchArticle = async () => {
      setLoading(true);
      try {
        if (articleId.startsWith('be-')) {
          const backendId = articleId.replace('be-', '');
          const beData = await getArticleDetail(backendId);
          setArticle(beData);
          setLikesCount(beData.likes_count || 0);
          setLiked(!!beData.liked);
        } else {
          // Live RSS article
          const liveData = await getLiveArticleById(articleId);
          if (liveData) {
            setArticle(liveData);
            setLikesCount(liveData.likes_count || 12);
          }
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleOpenSource = async () => {
    if (article?.link) {
      await WebBrowser.openBrowserAsync(article.link);
    } else {
      Alert.alert('Original Story', 'This is a community published article.');
    }
  };

  const handleLikeToggle = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (article?.id && typeof article.id === 'string' && article.id.startsWith('be-')) {
        const backendId = article.id.replace('be-', '');
        const res = await toggleLike('article', backendId);
        setLiked(res.liked);
        setLikesCount(res.likes_count);
      } else {
        setLiked(!liked);
        setLikesCount(prev => (liked ? prev - 1 : prev + 1));
      }
    } catch {
      setLiked(!liked);
      setLikesCount(prev => (liked ? prev - 1 : prev + 1));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    setBookmarked(!bookmarked);
    Alert.alert('Saved', bookmarked ? 'Removed from saved articles.' : 'Article saved to your bookmarks!');
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      body: newComment.trim(),
      user: { name: 'You' },
    };
    setComments([newEntry, ...comments]);
    setNewComment('');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
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
        colors={['rgba(10,10,15,0.4)', 'rgba(10,10,15,0.95)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {article.source || 'News Article'}
        </Text>
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

        {/* Article Body */}
        <View style={styles.articleBodyWrapper}>
          <View style={styles.categorySourceRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {article.category || 'World'}
              </Text>
            </View>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>
                {article.source || 'AFCE News'}
              </Text>
            </View>
          </View>

          <Text style={styles.articleTitle}>{article.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Published {article.published_at || 'Recently'} • {article.views || '1.8K'} reads
            </Text>
          </View>

          {article.excerpt ? (
            <Text style={styles.excerptText}>{article.excerpt}</Text>
          ) : null}

          <Text style={styles.bodyParagraph}>{article.body}</Text>

          {/* Open full source button */}
          {article.link ? (
            <TouchableOpacity
              style={styles.openSourceBtn}
              onPress={handleOpenSource}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#9333ea', '#7c3aed']}
                style={styles.openSourceGradient}
              >
                <Feather name="external-link" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.openSourceText}>
                  Read Full Story on {article.source}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, liked && styles.activeActionBtn]}
              onPress={handleLikeToggle}
              disabled={actionLoading}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? '#a855f7' : '#94a3b8'}
              />
              <Text style={[styles.actionBtnText, liked && styles.activeActionBtnText]}>
                {likesCount} Likes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Share', `Sharing "${article.title}"`)}
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
              placeholder="Join the discussion..."
              placeholderTextColor="#64748b"
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity
              style={styles.commentSendBtn}
              onPress={handlePostComment}
              disabled={!newComment.trim()}
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
    fontSize: 16,
    fontWeight: '700',
    maxWidth: '65%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverWrapper: {
    height: 230,
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
  categorySourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sourceBadge: {
    backgroundColor: '#161622',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#242436',
  },
  sourceBadgeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  openSourceBtn: {
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  openSourceGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openSourceText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
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
