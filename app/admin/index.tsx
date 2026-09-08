import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../../src/components/MovingBackground';
import { getAdminStats } from '../../src/services/api';

export default function AdminDashboardIndex() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await getAdminStats();
      setStats(data.stats || data);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    fetchStats(true);
  };

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.18} />
      <LinearGradient
        colors={['rgba(10,10,15,0.75)', 'rgba(10,10,15,0.95)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.adminBadge}>
            <View style={styles.adminDot} />
            <Text style={styles.adminBadgeText}>SUPERADMIN</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={onRefresh} disabled={refreshing}>
          <Feather name="refresh-cw" size={18} color="#c084fc" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingText}>Fetching system metrics...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchStats()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Overview Banner */}
            <LinearGradient
              colors={['#7c3aed', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerCard}
            >
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitle}>Platform Overview</Text>
                <Text style={styles.bannerSubtitle}>
                  Real-time database statistics & system health.
                </Text>
              </View>
              <View style={styles.bannerIconWrapper}>
                <FontAwesome5 name="chart-line" size={28} color="#ffffff" />
              </View>
            </LinearGradient>

            {/* Metrics Grid */}
            <Text style={styles.sectionHeader}>System Metrics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Ionicons name="people" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statValue}>{stats?.total_users ?? stats?.users ?? 0}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                  <Ionicons name="videocam" size={24} color="#f43f5e" />
                </View>
                <Text style={styles.statValue}>{stats?.total_videos ?? stats?.videos ?? 0}</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="musical-notes" size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{stats?.total_tracks ?? stats?.tracks ?? 0}</Text>
                <Text style={styles.statLabel}>Tracks</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                  <Ionicons name="newspaper" size={24} color="#eab308" />
                </View>
                <Text style={styles.statValue}>{stats?.total_articles ?? stats?.articles ?? 0}</Text>
                <Text style={styles.statLabel}>Articles</Text>
              </View>

              {stats?.total_comments !== undefined && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <Ionicons name="chatbubbles" size={24} color="#a855f7" />
                  </View>
                  <Text style={styles.statValue}>{stats?.total_comments ?? 0}</Text>
                  <Text style={styles.statLabel}>Comments</Text>
                </View>
              )}

              {stats?.total_likes !== undefined && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                    <Ionicons name="heart" size={24} color="#ec4899" />
                  </View>
                  <Text style={styles.statValue}>{stats?.total_likes ?? 0}</Text>
                  <Text style={styles.statLabel}>Total Likes</Text>
                </View>
              )}
            </View>

            {/* Quick Actions & Navigation */}
            <Text style={styles.sectionHeader}>Management Tools</Text>
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => router.push('/admin/users')}
                activeOpacity={0.85}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <Ionicons name="people-outline" size={22} color="#c084fc" />
                  </View>
                  <View style={styles.menuTextBlock}>
                    <Text style={styles.menuText}>User Management & Roles</Text>
                    <Text style={styles.menuSubText}>Promote or demote users to admin/creator</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => router.push('/upload')}
                activeOpacity={0.85}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Feather name="upload-cloud" size={22} color="#38bdf8" />
                  </View>
                  <View style={styles.menuTextBlock}>
                    <Text style={styles.menuText}>Publish Official Content</Text>
                    <Text style={styles.menuSubText}>Upload new official music, videos, or articles</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => router.push('/my-content')}
                activeOpacity={0.85}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                    <Ionicons name="folder-open-outline" size={22} color="#eab308" />
                  </View>
                  <View style={styles.menuTextBlock}>
                    <Text style={styles.menuText}>Content Moderation & Deletion</Text>
                    <Text style={styles.menuSubText}>View and manage published media catalog</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
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
  headerTitleBlock: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  adminDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  adminBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  retryBtn: {
    backgroundColor: '#9333ea',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  bannerIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#161622',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242436',
  },
  statIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#161622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242436',
    overflow: 'hidden',
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextBlock: {
    flex: 1,
  },
  menuText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubText: {
    color: '#64748b',
    fontSize: 11,
  },
});
