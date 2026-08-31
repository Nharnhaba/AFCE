import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { loginUser, saveAuthToken } from '../src/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(email, password);
      await saveAuthToken(response.token);
      Alert.alert('Success', 'Login successful');
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Username"
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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <Link href="/signup" style={styles.link} asChild>
        <TouchableOpacity disabled={loading}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkAccent}>Sign Up</Text></Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 26, fontWeight: '600', marginBottom: 4 },
  subtitle: { color: '#888', marginBottom: 32 },
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