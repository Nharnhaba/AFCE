import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../../src/components/MovingBackground';
import { getAdminStats } from '../../src/services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminStats();
      setStats(data.stats || data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.15} />
      <LinearGradient colors={['rgba(10,10,15,0.7)', '#0a0a0f']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={40} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchStats}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={28} color="#3b82f6" />
                <Text style={styles.statValue}>{stats?.total_users ?? stats?.users ?? 0}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="play-circle" size={28} color="#f43f5e" />
                <Text style={styles.statValue}>{stats?.total_videos ?? stats?.videos ?? 0}</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="musical-notes" size={28} color="#10b981" />
                <Text style={styles.statValue}>{stats?.total_tracks ?? stats?.tracks ?? 0}</Text>
                <Text style={styles.statLabel}>Tracks</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="document-text" size={28} color="#eab308" />
                <Text style={styles.statValue}>{stats?.total_articles ?? stats?.articles ?? 0}</Text>
                <Text style={styles.statLabel}>Articles</Text>
              </View>
            </View>

            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuBtn}
                onPress={() => router.push('/admin/users')}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="people-outline" size={24} color="#a855f7" style={{ marginRight: 12 }} />
                  <Text style={styles.menuText}>Manage Users</Text>
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
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#161622',
    borderWidth: 1, borderColor: '#242436', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  centerContainer: { padding: 40, alignItems: 'center' },
  errorContainer: { padding: 40, alignItems: 'center' },
  errorText: { color: '#ef4444', marginTop: 12, textAlign: 'center', marginBottom: 20 },
  retryBtn: { padding: 10, backgroundColor: '#1e1e2d', borderRadius: 8 },
  retryText: { color: '#fff' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#161622',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 16,
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  statLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  menuContainer: {
    marginTop: 20,
    backgroundColor: '#161622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242436',
    overflow: 'hidden',
  },
  menuBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
