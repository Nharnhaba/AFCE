import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { clearAuthToken, getCurrentUser } from '../../src/services/api';

export default function ProfileTab() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch((err) => console.error('Failed to load user info:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await clearAuthToken();
    router.replace('/login');
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
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{user?.name || 'User'}</Text>
      <Text style={styles.email}>{user?.email || 'No email'}</Text>

      <TouchableOpacity 
        style={styles.uploadsButton} 
        onPress={() => router.push('/upload')}
      >
        <Text style={styles.uploadsButtonText}>My Uploads & Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', padding: 24 },
  centered: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
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
  email: { color: '#888', marginTop: 4, fontSize: 14, marginBottom: 40 },
  uploadsButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
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
});
