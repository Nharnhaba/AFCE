import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../../src/components/MovingBackground';
import { getAdminUsers, updateAdminUserRole } from '../../src/services/api';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data.data || data); // Pagination check
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (userId: number | string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    Alert.alert(
      'Change Role', 
      `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`, 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Change', 
          onPress: async () => {
            try {
              await updateAdminUserRole(userId, newRole as 'admin'|'user');
              setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            } catch (err: any) {
              Alert.alert('Error', 'Failed to update role');
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'U'}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}
        onPress={() => handleRoleToggle(item.id, item.role)}
      >
        <Text style={[styles.roleText, item.role === 'admin' && styles.roleTextAdmin]}>
          {item.role?.toUpperCase() || 'USER'}
        </Text>
        <Ionicons name="swap-vertical" size={14} color={item.role === 'admin' ? '#fff' : '#a855f7'} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.15} />
      <LinearGradient colors={['rgba(10,10,15,0.7)', '#0a0a0f']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a1b3d',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  userEmail: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  roleBadgeAdmin: {
    backgroundColor: '#f43f5e',
    borderColor: '#f43f5e',
  },
  roleText: { color: '#a855f7', fontSize: 12, fontWeight: '700' },
  roleTextAdmin: { color: '#fff' },
});
