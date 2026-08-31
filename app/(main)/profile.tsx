import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { clearAuthToken, getCurrentUser, updateProfile } from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

export default function ProfileTab() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
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
    await clearAuthToken();
    router.replace('/login');
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
      setUser({ name: editName.trim(), email: editEmail.trim() });
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

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.45} />

      <LinearGradient
        colors={['rgba(10,10,15,0.25)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{user?.name || 'User'}</Text>
      <Text style={styles.email}>{user?.email || 'No email'}</Text>

      {/* Edit Profile Button */}
      <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
        <Text style={styles.editButtonText}>✏️  Edit Profile</Text>
      </TouchableOpacity>

      {/* Uploads Button */}
      <TouchableOpacity
        style={styles.uploadsButton}
        onPress={() => router.push('/upload')}
      >
        <Text style={styles.uploadsButtonText}>My Uploads & Dashboard</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
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
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Avatar Preview */}
              <View style={styles.modalAvatarRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {editName ? editName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              </View>

              {/* Name Input */}
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#555"
                autoCapitalize="words"
              />

              {/* Email Input */}
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="your@email.com"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Divider */}
              <View style={styles.divider} />
              <Text style={styles.sectionHint}>Leave blank to keep current password</Text>

              {/* New Password Input */}
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={editPassword}
                onChangeText={setEditPassword}
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry
              />

              {/* Confirm Password Input */}
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={editPasswordConfirm}
                onChangeText={setEditPasswordConfirm}
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry
              />

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  name: { color: '#fff', fontSize: 24, fontWeight: '600' },
  email: { color: '#888', marginTop: 4, fontSize: 14, marginBottom: 30 },
  editButton: {
    backgroundColor: '#1e1e2e',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  editButtonText: { color: '#a855f7', fontWeight: '600', fontSize: 16 },
  uploadsButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadsButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  logoutButton: {
    backgroundColor: '#ff4a5a',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121218',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  modalClose: {
    color: '#888',
    fontSize: 22,
    padding: 4,
  },
  modalAvatarRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1a1a24',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a35',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHint: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 15,
  },
});
