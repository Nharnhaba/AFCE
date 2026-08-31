import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password');
      return;
    }

    // TODO: replace this with your real API call to the backend later
    Alert.alert('Login successful');
    router.replace('/home'); // 👈 this is what actually moves you to the next screen
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
      />

      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Link href="/signup" style={styles.link}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkAccent}>Sign Up</Text></Text>
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
  button: { backgroundColor: '#a855f7', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#888' },
  linkAccent: { color: '#c084fc', fontWeight: '600' },
});