import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/onboarding'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.iconCircle}>
        <Text style={styles.playIcon}>▶</Text>
      </LinearGradient>
      <Text style={styles.title}>AFCE <Text style={styles.titleAccent}>MEDIA</Text></Text>
      <Text style={styles.subtitle}>Watch. Listen. Read. Enjoy.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 90, height: 90, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  playIcon: { color: '#fff', fontSize: 36 },
  title: { color: '#fff', fontSize: 24, fontWeight: '600', letterSpacing: 1 },
  titleAccent: { color: '#c084fc' },
  subtitle: { color: '#888', marginTop: 8, fontSize: 14 },
});