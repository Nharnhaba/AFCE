import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../src/components/MovingBackground';
import {
  getNotifications,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../src/services/api';

interface NotificationItem {
  id: string | number;
  title?: string;
  message?: string;
  body?: string;
  type?: string;
  read?: boolean;
  read_at?: string | null;
  created_at?: string;
  action_url?: string;
  data?: any;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const fetchNotificationsList = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getNotifications();
      const rawList = data.notifications?.data || data.notifications || data.data || data;
      const listArray = Array.isArray(rawList) ? rawList : [];

      const formatted = listArray.map((item: any) => ({
        ...item,
        read: item.read !== undefined ? item.read : Boolean(item.read_at),
        title: item.title || item.data?.title || 'Notification',
        message: item.message || item.body || item.data?.message || item.data?.body || '',
      }));

      setNotifications(formatted);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationsList();
  }, [fetchNotificationsList]);

  const onRefresh = () => {
    fetchNotificationsList(true);
  };

  const handleMarkAllRead = async () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    if (unreadCount === 0) {
      Alert.alert('All Read', 'All notifications are already marked as read.');
      return;
    }

    setMarkingRead(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark notifications as read');
    } finally {
      setMarkingRead(false);
    }
  };

  const handleDeleteNotification = (id: string | number) => {
    Alert.alert('Delete Notification', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete notification');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffSeconds) || diffSeconds < 0) return 'Just now';
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getNotificationIconInfo = (type?: string, isUnread = false) => {
    const t = (type || '').toLowerCase();
    if (t.includes('comment')) {
      return { icon: 'chatbubble-ellipses-outline', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)' };
    }
    if (t.includes('like')) {
      return { icon: 'heart-outline', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
    }
    if (t.includes('admin') || t.includes('system') || t.includes('role')) {
      return { icon: 'shield-checkmark-outline', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
    }
    if (t.includes('video')) {
      return { icon: 'videocam-outline', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    }
    if (t.includes('music') || t.includes('track') || t.includes('song')) {
      return { icon: 'musical-notes-outline', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
    if (t.includes('article') || t.includes('news')) {
      return { icon: 'newspaper-outline', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
    }
    if (t.includes('playlist')) {
      return { icon: 'list-outline', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    }
    if (t.includes('alert') || t.includes('warn')) {
      return { icon: 'alert-circle-outline', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    }
    return {
      icon: 'notifications-outline',
      color: isUnread ? '#a855f7' : '#94a3b8',
      bg: isUnread ? 'rgba(168, 85, 247, 0.15)' : '#1e1e2d',
    };
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.read;
    const isDeleting = deletingId === item.id;
    const iconInfo = getNotificationIconInfo(item.type || item.data?.type, isUnread);

    return (
      <View style={[styles.card, isUnread && styles.unreadCard]}>
        {/* Type Icon Badge */}
        <View style={[styles.iconBox, { backgroundColor: iconInfo.bg }]}>
          <Ionicons
            name={iconInfo.icon as any}
            size={20}
            color={iconInfo.color}
          />
        </View>

        {/* Content Box */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, isUnread && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          {item.message ? (
            <Text style={[styles.cardMessage, isUnread && styles.unreadMessage]} numberOfLines={3}>
              {item.message}
            </Text>
          ) : null}

          <Text style={styles.cardTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteNotification(item.id)}
          disabled={isDeleting}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Ionicons name="trash-outline" size={17} color="#64748b" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.15} />

      <LinearGradient
        colors={['rgba(10,10,15,0.7)', 'rgba(10,10,15,0.95)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerCountBadge}>
              <Text style={styles.headerCountText}>{unreadCount} NEW</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.markReadHeaderBtn, unreadCount === 0 && { opacity: 0.5 }]}
          onPress={handleMarkAllRead}
          disabled={markingRead || unreadCount === 0}
        >
          {markingRead ? (
            <ActivityIndicator size="small" color="#c084fc" />
          ) : (
            <Ionicons name="checkmark-done" size={20} color="#c084fc" />
          )}
        </TouchableOpacity>
      </View>

      {/* Secondary Sub-toolbar */}
      {notifications.length > 0 && (
        <View style={styles.subToolbar}>
          <Text style={styles.subToolbarText}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All notifications are up to date'}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} disabled={markingRead}>
              <Text style={styles.markAllReadLink}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List / Loading / Empty */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
              <View style={styles.emptyIconBox}>
                <Ionicons name="notifications-off-outline" size={48} color="#a855f7" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                When you receive alerts, content updates, or system messages, they'll appear here.
              </Text>
              <TouchableOpacity
                style={styles.emptyRefreshBtn}
                onPress={() => fetchNotificationsList(true)}
              >
                <Text style={styles.emptyRefreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerCountBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  headerCountText: {
    color: '#c084fc',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  markReadHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1e1e2d',
    backgroundColor: '#11111a',
  },
  subToolbarText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  markAllReadLink: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#161622',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
  },
  unreadCard: {
    backgroundColor: '#19152b',
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e1e2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadIconBox: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    color: '#ffffff',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a855f7',
    marginLeft: 6,
  },
  cardMessage: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  unreadMessage: {
    color: '#e2e8f0',
  },
  cardTime: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#161622',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#242436',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyRefreshBtn: {
    backgroundColor: '#9333ea',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  emptyRefreshBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
