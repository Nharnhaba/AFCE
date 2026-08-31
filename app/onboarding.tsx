import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../src/components/MovingBackground';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background Animated Video Grid */}
      <MovingBackground opacity={0.85} speedMultiplier={1.0} />

      {/* Premium dark gradient overlay */}
      <LinearGradient
        colors={['rgba(10,10,15,0.1)', 'rgba(10,10,15,0.45)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Foreground Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#c084fc', '#a855f7']}
            style={styles.logoBadge}
          >
            <Ionicons name="play" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandName}>AFCE</Text>
        </View>

        <Text style={styles.title}>Discover. Stream. Enjoy.</Text>
        <Text style={styles.subtitle}>
          Your ultimate digital destination for videos, premium music, and global updates.
        </Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: '#a855f7',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
