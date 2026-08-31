import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { clearAuthToken } from '../src/services/api';
import MovingBackground from '../src/components/MovingBackground';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [streamQuality, setStreamQuality] = useState(true);

  const handleLogout = () => {
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

  const settingsSections = [
    {
      title: 'Account',
      icon: 'person-outline',
      onPress: () => router.push('/(main)/profile'),
    },
    {
      title: 'Security',
      icon: 'shield-checkmark-outline',
      onPress: () => Alert.alert('Security', 'Password and two-factor authentication settings.'),
    },
    {
      title: 'Notifications',
      icon: 'notifications-outline',
      hasSwitch: true,
      switchVal: notifications,
      onSwitchChange: setNotifications,
    },
    {
      title: 'Playback & Downloads',
      icon: 'play-circle-outline',
      onPress: () => router.push('/downloads'),
    },
    {
      title: 'Data & Storage',
      icon: 'server-outline',
      onPress: () => Alert.alert('Storage', 'Cached media: 184 MB.\nAll systems optimal.'),
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Help & Support', 'Visit support.afce.media or contact us at contact@afce.media'),
    },
    {
      title: 'About AFCE Media',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('About', 'AFCE Media v1.0.0 (Production Build)\nWatch. Listen. Read. Enjoy.'),
    },
  ];

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.25} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.9)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuBox}>
          {settingsSections.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.settingRow,
                index === settingsSections.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={item.onPress}
              disabled={!!item.hasSwitch}
              activeOpacity={0.8}
            >
              <View style={styles.leftRow}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color="#c084fc"
                  style={styles.icon}
                />
                <Text style={styles.settingTitle}>{item.title}</Text>
              </View>

              {item.hasSwitch ? (
                <Switch
                  value={item.switchVal}
                  onValueChange={item.onSwitchChange}
                  trackColor={{ false: '#334155', true: '#9333ea' }}
                  thumbColor="#ffffff"
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#64748b" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: 54,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backBtn: {
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  menuBox: {
    backgroundColor: '#161622',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242436',
    overflow: 'hidden',
    marginBottom: 28,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 14,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
