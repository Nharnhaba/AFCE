import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../../src/components/MovingBackground';
import { getAdminUsers, updateUserRole } from '../../src/services/api';

const AVAILABLE_ROLES = ['admin', 'creator', 'user'];

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Role change modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | number | null>(null);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAdminUsers();
      const rawList = data.users?.data || data.users || data.data || data;
      setUsers(Array.isArray(rawList) ? rawList : []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    fetchUsers(true);
  };

  const handleOpenRoleModal = (user: any) => {
    setSelectedUser(user);
    setRoleModalVisible(true);
  };

  const handleSelectRole = async (targetRole: string) => {
    if (!selectedUser) return;
    if (selectedUser.role === targetRole) {
      setRoleModalVisible(false);
      return;
    }

    const userId = selectedUser.id;
    setRoleModalVisible(false);
    setUpdatingUserId(userId);

    try {
      await updateUserRole(userId, targetRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
      Alert.alert('Success', `Updated ${selectedUser.name || 'user'}'s role to ${targetRole.toUpperCase()}`);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update user role');
    } finally {
      setUpdatingUserId(null);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const renderUser = ({ item }: { item: any }) => {
    const isUpdating = updatingUserId === item.id;
    const role = (item.role || 'user').toLowerCase();
    const isAdmin = role === 'admin';
    const isCreator = role === 'creator';

    return (
      <View style={styles.userCard}>
        <View
          style={[
            styles.avatar,
            isAdmin && styles.avatarAdmin,
            isCreator && styles.avatarCreator,
          ]}
        >
          <Text style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name || 'Unnamed User'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
          <Text style={styles.userCreated}>
            Joined: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Active'}
          </Text>
        </View>

        {isUpdating ? (
          <ActivityIndicator size="small" color="#c084fc" style={{ paddingHorizontal: 12 }} />
        ) : (
          <TouchableOpacity
            style={[
              styles.roleBadge,
              isAdmin && styles.roleBadgeAdmin,
              isCreator && styles.roleBadgeCreator,
            ]}
            onPress={() => handleOpenRoleModal(item)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.roleText,
                isAdmin && styles.roleTextAdmin,
                isCreator && styles.roleTextCreator,
              ]}
            >
              {role.toUpperCase()}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={isAdmin ? '#ffffff' : isCreator ? '#38bdf8' : '#a855f7'}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.15} />
      <LinearGradient
        colors={['rgba(10,10,15,0.75)', 'rgba(10,10,15,0.95)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Filter Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name, email, or role..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Loading platform users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderUser}
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
              <Ionicons name="people-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* Role Selection Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRoleModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Role</Text>
            <Text style={styles.modalSubtitle}>
              Change role for {selectedUser?.name || selectedUser?.email}
            </Text>

            <View style={styles.rolesList}>
              {AVAILABLE_ROLES.map((r) => {
                const isCurrent = selectedUser?.role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleOptionBtn, isCurrent && styles.roleOptionSelected]}
                    onPress={() => handleSelectRole(r)}
                  >
                    <View style={styles.roleOptionLeft}>
                      <MaterialIcons
                        name={r === 'admin' ? 'admin-panel-settings' : r === 'creator' ? 'video-camera-front' : 'person'}
                        size={20}
                        color={isCurrent ? '#a855f7' : '#94a3b8'}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.roleOptionText, isCurrent && styles.roleOptionTextSelected]}>
                        {r.toUpperCase()}
                      </Text>
                    </View>
                    {isCurrent && <Ionicons name="checkmark-circle" size={18} color="#a855f7" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#242436',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarAdmin: {
    backgroundColor: '#9333ea',
  },
  avatarCreator: {
    backgroundColor: '#0284c7',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
  },
  userCreated: {
    color: '#64748b',
    fontSize: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  roleBadgeAdmin: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  roleBadgeCreator: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  roleText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleTextAdmin: {
    color: '#ffffff',
  },
  roleTextCreator: {
    color: '#38bdf8',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161622',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242436',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 18,
  },
  rolesList: {
    gap: 10,
    marginBottom: 16,
  },
  roleOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e2d',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e2e3e',
  },
  roleOptionSelected: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  roleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleOptionText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1e1e2d',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
