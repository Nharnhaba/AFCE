import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MovingBackground from '../src/components/MovingBackground';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Dynamic Background */}
      <MovingBackground type="onboarding" direction="vertical" opacity={0.6} />

      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['rgba(10,10,15,0.4)', 'rgba(10,10,15,0.8)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Header Text */}
        <View style={styles.headerBlock}>
          <Text style={styles.titleLine}>Discover.</Text>
          <Text style={styles.titleLine}>Stream.</Text>
          <Text style={[styles.titleLine, styles.titleAccent]}>Enjoy.</Text>
          <Text style={styles.subtitle}>All your favorite content in one place.</Text>
        </View>

        {/* 3D Floating Cards Display */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Music Card */}
          <LinearGradient
            colors={['#8b5cf6', '#6d28d9']}
            style={[styles.floatingCard, styles.musicCard]}
          >
            <Ionicons name="musical-notes" size={28} color="#fff" />
            <View style={styles.cardLines}>
              <View style={[styles.cardLine, { width: 30 }]} />
              <View style={[styles.cardLine, { width: 20, opacity: 0.6 }]} />
            </View>
          </LinearGradient>

          {/* Card 2: Main Video Player Card */}
          <LinearGradient
            colors={['#1e1b4b', '#312e81']}
            style={[styles.floatingCard, styles.videoCard]}
          >
            <View style={styles.videoPlayCircle}>
              <Ionicons name="play" size={22} color="#fff" style={{ marginLeft: 3 }} />
            </View>
            <Text style={styles.videoDurationBadge}>4:20</Text>
          </LinearGradient>

          {/* Card 3: Article / Chat Card */}
          <LinearGradient
            colors={['#4c1d95', '#581c87']}
            style={[styles.floatingCard, styles.articleCard]}
          >
            <Ionicons name="newspaper-outline" size={22} color="#c084fc" />
          </LinearGradient>

          {/* Card 4: Wave Card */}
          <LinearGradient
            colors={['#701a75', '#86198f']}
            style={[styles.floatingCard, styles.waveCard]}
          >
            <MaterialCommunityIcons name="waveform" size={24} color="#f472b6" />
          </LinearGradient>
        </View>

        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#9333ea', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 40,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  headerBlock: {
    alignItems: 'flex-start',
  },
  titleLine: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#ec4899',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 12,
    fontWeight: '400',
    lineHeight: 22,
  },
  cardsContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  floatingCard: {
    position: 'absolute',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  musicCard: {
    left: 20,
    top: 30,
    width: 80,
    height: 80,
    transform: [{ rotate: '-12deg' }],
    justifyContent: 'space-between',
  },
  cardLines: {
    gap: 4,
  },
  cardLine: {
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  videoCard: {
    right: 30,
    top: 20,
    width: 140,
    height: 95,
    transform: [{ rotate: '8deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  videoPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  articleCard: {
    right: 70,
    bottom: 20,
    width: 60,
    height: 60,
    transform: [{ rotate: '15deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveCard: {
    left: 60,
    bottom: 25,
    width: 70,
    height: 70,
    transform: [{ rotate: '-8deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  activeDot: {
    width: 24,
    backgroundColor: '#a855f7',
  },
  getStartedButton: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
  skipButton: {
    paddingVertical: 6,
  },
});
