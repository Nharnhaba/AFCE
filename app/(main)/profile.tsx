import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { clearAuthToken, getCurrentUser, getProfile, updateProfile } from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

export default function ProfileTab() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');

  const loadUser = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch (err) {
      console.error('Failed to load user info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuthToken();
          router.replace('/login');
        },
      },
    ]);
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPassword('');
    setEditPasswordConfirm('');
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    if (!editEmail.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }
    if (editPassword && editPassword !== editPasswordConfirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (editPassword && editPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const payload: any = { name: editName.trim(), email: editEmail.trim() };
      if (editPassword) {
        payload.password = editPassword;
        payload.password_confirmation = editPasswordConfirm;
      }
      await updateProfile(payload);
      setUser((prev: any) => ({ ...prev, name: editName.trim(), email: editEmail.trim() }));
      setEditVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'T';
  const usernameHandle = user?.email
    ? `@${user.email.split('@')[0]}`
    : '@tinodavin';

  const menuItems = [
    {
      id: 'watch-later',
      title: 'Watch Later',
      icon: 'time-outline',
      onPress: () => router.push('/(main)/videos'),
    },
    {
      id: 'liked-videos',
      title: 'Liked Videos',
      icon: 'heart-outline',
      onPress: () => router.push('/(main)/videos'),
    },
    {
      id: 'playlists',
      title: 'Playlists',
      icon: 'list-outline',
      onPress: () => router.push('/(main)/music'),
    },
    {
      id: 'downloads',
      title: 'Downloads',
      icon: 'download-outline',
      onPress: () => router.push('/downloads'),
    },
    {
      id: 'my-articles',
      title: 'My Articles & Uploads',
      icon: 'newspaper-outline',
      onPress: () => router.push('/upload'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => router.push('/settings'),
    },
  ];

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.35} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.85)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <TouchableOpacity style={styles.avatarEditBadge} onPress={openEditModal}>
              <Feather name="edit-2" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{user?.name || 'Tino Davin'}</Text>
            <Text style={styles.profileHandle}>{usernameHandle}</Text>
            <TouchableOpacity
              style={styles.editProfilePill}
              onPress={openEditModal}
            >
              <Text style={styles.editProfilePillText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>128</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2.3K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>420</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Account Details Box */}
        <View style={styles.accountDetailsCard}>
          <Text style={styles.detailsCardTitle}>Account Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Full Name</Text>
            <Text style={styles.detailVal}>{user?.name || 'Tino Davin'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Email</Text>
            <Text style={styles.detailVal}>{user?.email || 'tino@afce.media'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Account Role</Text>
            <Text style={styles.detailValAccent}>{user?.role || 'Member'}</Text>
          </View>
        </View>

        {/* Menu Navigation List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuRow}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBox}>
                  <Ionicons name={item.icon as any} size={20} color="#c084fc" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>
          ))}

          {/* Logout Row */}
          <TouchableOpacity
            style={[styles.menuRow, styles.logoutRow]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, styles.logoutIconBox]}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              </View>
              <Text style={styles.logoutRowText}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Slide-up Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditVisible(false)}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Avatar Preview */}
              <View style={styles.modalAvatarRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {editName ? editName.charAt(0).toUpperCase() : 'T'}
                  </Text>
                </View>
              </View>

              {/* Name Input */}
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#64748b"
                autoCapitalize="words"
              />

              {/* Email Input */}
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="your@email.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Password Section Divider */}
              <View style={styles.divider} />
              <Text style={styles.sectionHint}>
                Leave blank to keep your current password
              </Text>

              {/* New Password Input */}
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={editPassword}
                onChangeText={setEditPassword}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
              />

              {/* Confirm Password Input */}
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={editPasswordConfirm}
                onChangeText={setEditPasswordConfirm}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
              />

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <LinearGradient
                  colors={['#9333ea', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 30,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#161622',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242436',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0f',
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileHandle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  editProfilePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a1b3d',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  editProfilePillText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#242436',
  },
  accountDetailsCard: {
    backgroundColor: '#161622',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 20,
  },
  detailsCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  detailKey: {
    color: '#94a3b8',
    fontSize: 13,
  },
  detailVal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValAccent: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  menuContainer: {
    backgroundColor: '#161622',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242436',
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutRow: {
    borderBottomWidth: 0,
  },
  logoutIconBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutRowText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#12121c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#242436',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  modalAvatarRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  modalAvatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#161622',
    color: '#ffffff',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#242436',
  },
  divider: {
    height: 1,
    backgroundColor: '#242436',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHint: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  saveButton: {
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 24,
  },
  saveGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
});
