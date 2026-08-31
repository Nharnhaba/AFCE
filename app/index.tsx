import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loadStoredToken } from '../src/services/api';
import MovingBackground from '../src/components/MovingBackground';

export default function SplashScreen() {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const checkAuthAndNavigate = async () => {
      const token = await loadStoredToken();
      if (token) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
    };

    const timer = setTimeout(checkAuthAndNavigate, 2200);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <MovingBackground type="all" direction="diagonal" opacity={0.35} />

      <LinearGradient
        colors={['rgba(10,10,15,0.4)', 'rgba(10,10,15,0.85)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.centerContent}>
        {/* Sleek Gradient Play Logo */}
        <LinearGradient
          colors={['#8b5cf6', '#ec4899', '#38bdf8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}
        >
          <View style={styles.innerLogo}>
            <Ionicons name="play" size={44} color="#fff" style={{ marginLeft: 6 }} />
          </View>
        </LinearGradient>

        <Text style={styles.brandTitle}>
          AFCE <Text style={styles.brandAccent}>MEDIA</Text>
        </Text>
        <Text style={styles.brandSubtitle}>Watch. Listen. Read. Enjoy.</Text>
      </View>

      {/* Bottom Loading Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.loadingText}>Loading...</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  innerLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: '#12111a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 3,
  },
  brandAccent: {
    color: '#a855f7',
  },
  brandSubtitle: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  bottomBar: {
    width: '60%',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '500',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#1e1e2d',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 2,
  },
});