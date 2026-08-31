import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { registerUser, saveAuthToken } from '../src/services/api';
import MovingBackground from '../src/components/MovingBackground';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing info', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Pass password twice to satisfy backend password_confirmation check
      const response = await registerUser(name, email, password, password);
      await saveAuthToken(response.token);
      Alert.alert('Success', 'Account created successfully');
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Signup failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Wallpaper Grid */}
      <MovingBackground opacity={0.85} speedMultiplier={0.7} />

      {/* Dark overlay for readability */}
      <LinearGradient
        colors={['rgba(10,10,15,0.1)', 'rgba(10,10,15,0.45)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join AFCE Media</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          editable={!loading}
        />

        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkAccent}>Log In</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flex: 1, justifyContent: 'center', padding: 24, zIndex: 1 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#888', marginBottom: 32, fontSize: 15 },
  input: {
    backgroundColor: '#1a1a22', color: '#fff', padding: 14, borderRadius: 10, marginBottom: 16,
  },
  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a22',
    borderRadius: 10, marginBottom: 24, paddingRight: 14,
  },
  passwordInput: { flex: 1, color: '#fff', padding: 14 },
  toggleText: { color: '#c084fc', fontWeight: '600' },
  button: { backgroundColor: '#a855f7', paddingVertical: 14, borderRadius: 12, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#888' },
  linkAccent: { color: '#c084fc', fontWeight: '600' },
});