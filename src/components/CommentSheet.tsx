import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getComments, addComment, loadStoredToken } from '../services/api';

interface CommentSheetProps {
  visible: boolean;
  onClose: () => void;
  type: 'video' | 'track' | 'article';
  id: string | number;
}

export default function CommentSheet({ visible, onClose, type, id }: CommentSheetProps) {
  const [token, setToken] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStoredToken().then(setToken);
    if (visible) {
      fetchComments();
    }
  }, [visible, id]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(type, id);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newComment.trim() || !token) return;
    setIsSubmitting(true);
    try {
      const res = await addComment(type, id, newComment.trim());
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.userName}>{item.user?.name || 'User'}</Text>
        <Text style={styles.commentBody}>{item.body}</Text>
        <Text style={styles.timeText}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#f43f5e" />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderComment}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                </View>
              }
            />
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={token ? "Add a comment..." : "Sign in to comment"}
              placeholderTextColor="#64748b"
              value={newComment}
              onChangeText={setNewComment}
              editable={!!token}
              multiline
            />
            <TouchableOpacity 
              style={[styles.postBtn, (!newComment.trim() || !token) && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={!newComment.trim() || isSubmitting || !token}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#161622',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#242436',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  loader: {
    padding: 40,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentBody: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#242436',
    backgroundColor: '#161622',
  },
  input: {
    flex: 1,
    backgroundColor: '#242436',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#fff',
    maxHeight: 100,
    minHeight: 40,
  },
  postBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f43f5e',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: -2, 
  },
  postBtnDisabled: {
    backgroundColor: '#334155',
  },
});
