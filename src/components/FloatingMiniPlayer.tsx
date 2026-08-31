import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  subscribePlaybackState,
  togglePlayPause,
  stopPlayback,
  PlaybackState,
} from '../services/audioPlayer';

export default function FloatingMiniPlayer() {
  const router = useRouter();
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    isLoading: false,
    currentTrackId: null,
    currentTrack: null,
  });

  useEffect(() => {
    const unsubscribe = subscribePlaybackState(setPlaybackState);
    return unsubscribe;
  }, []);

  if (!playbackState.currentTrack && !playbackState.currentTrackId) {
    return null;
  }

  const track = playbackState.currentTrack;
  const progressPercent =
    playbackState.durationMillis > 0
      ? Math.min(100, (playbackState.positionMillis / playbackState.durationMillis) * 100)
      : 0;

  const handleOpenFullPlayer = () => {
    if (playbackState.currentTrackId) {
      router.push(`/music/${playbackState.currentTrackId}` as any);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        style={styles.container}
        onPress={handleOpenFullPlayer}
        activeOpacity={0.92}
      >
        <LinearGradient
          colors={['#1c172e', '#13111e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {/* Top Mini Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.innerContent}>
            {/* Artwork */}
            <Image
              source={{
                uri:
                  track?.cover_art_url ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
              }}
              style={styles.artwork}
            />

            {/* Song Meta */}
            <View style={styles.metaBox}>
              <Text style={styles.title} numberOfLines={1}>
                {track?.title || 'Now Playing'}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {track?.artist || 'Live Audio Stream'}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controlBox}>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
              >
                {playbackState.isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name={playbackState.isPlaying ? 'pause' : 'play'}
                    size={20}
                    color="#ffffff"
                    style={playbackState.isPlaying ? {} : { marginLeft: 2 }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  stopPlayback();
                }}
              >
                <Ionicons name="close" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 84 : 68,
    left: 12,
    right: 12,
    zIndex: 999,
  },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'relative',
  },
  progressBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#a855f7',
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 3,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2a1b3d',
    marginRight: 10,
  },
  metaBox: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  artist: {
    color: '#c084fc',
    fontSize: 11,
    marginTop: 2,
  },
  controlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 6,
  },
});
