import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../src/components/MovingBackground';
import { updateProfile, getProfile } from '../src/services/api';

export default function EditProfileScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    getProfile().then((res) => {
      setName(res.name || res.data?.name || '');
      setEmail(res.email || res.data?.email || '');
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (password && password !== passwordConfirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: any = { name, email };
      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirm;
      }
      
      const res = await updateProfile(payload);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <MovingBackground type="all" direction="diagonal" opacity={0.2} />
      <LinearGradient
        colors={['rgba(10,10,15,0.7)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        {loading ? (
          <ActivityIndicator size="large" color="#f43f5e" style={{ marginVertical: 40 }} />
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#64748b"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Your email"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Leave blank to keep current"
              placeholderTextColor="#64748b"
              secureTextEntry
            />
          </View>
        </View>

        {password.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder="Confirm password"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            </View>
          </View>
        )}

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242436',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#fff',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: '#f43f5e',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
