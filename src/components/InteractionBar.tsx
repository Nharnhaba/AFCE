import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toggleLike, toggleBookmark, loadStoredToken } from '../services/api';
import { useRouter } from 'expo-router';

interface InteractionBarProps {
  type: 'video' | 'track' | 'article';
  id: string | number;
  initialLikesCount?: number;
  initialLiked?: boolean;
  initialBookmarked?: boolean;
  onCommentPress: () => void;
  commentCount?: number;
}

export default function InteractionBar({
  type,
  id,
  initialLikesCount = 0,
  initialLiked = false,
  initialBookmarked = false,
  onCommentPress,
  commentCount = 0,
}: InteractionBarProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  React.useEffect(() => {
    loadStoredToken().then(setToken);
  }, []);

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiking, setIsLiking] = useState(false);

  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleLike = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    setIsLiking(true);
    try {
      const res = await toggleLike(type, id);
      setLiked(res.liked);
      if (res.likes_count !== undefined) {
        setLikesCount(res.likes_count);
      } else {
        setLikesCount((prev) => (res.liked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    setIsBookmarking(true);
    try {
      const res = await toggleBookmark(type, id);
      setBookmarked(res.bookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={isLiking}>
        {isLiking ? (
          <ActivityIndicator size="small" color="#f43f5e" />
        ) : (
          <>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? '#f43f5e' : '#94a3b8'} />
            <Text style={[styles.actionText, liked && { color: '#f43f5e' }]}>
              {likesCount > 0 ? likesCount : 'Like'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress}>
        <Ionicons name="chatbubble-outline" size={22} color="#94a3b8" />
        <Text style={styles.actionText}>
          {commentCount > 0 ? commentCount : 'Comment'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn} onPress={handleBookmark} disabled={isBookmarking}>
        {isBookmarking ? (
          <ActivityIndicator size="small" color="#a855f7" />
        ) : (
          <>
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? '#a855f7' : '#94a3b8'} />
            <Text style={[styles.actionText, bookmarked && { color: '#a855f7' }]}>Save</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e1e2d',
    marginVertical: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
