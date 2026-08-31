import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LIVE_PLAYLISTS, StreamingPlaylist } from '../services/musicStreaming';

interface FeaturedPlaylistsProps {
  onPlaylistPress?: (playlist: StreamingPlaylist) => void;
}

export default function FeaturedPlaylists({ onPlaylistPress }: FeaturedPlaylistsProps) {
  const router = useRouter();

  const handlePress = (playlist: StreamingPlaylist) => {
    if (onPlaylistPress) {
      onPlaylistPress(playlist);
    } else {
      router.push('/(main)/music');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionEmoji}>✨</Text>
          <Text style={styles.sectionTitle}>Featured Playlists</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(main)/music')}>
          <Text style={styles.seeAllText}>Explore</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {LIVE_PLAYLISTS.map((playlist: StreamingPlaylist) => (
          <TouchableOpacity
            key={playlist.id}
            style={styles.playlistCard}
            onPress={() => handlePress(playlist)}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={playlist.colors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playlistGradient}
            >
              <Image
                source={{ uri: playlist.image }}
                style={styles.playlistThumb}
              />
              <View style={styles.playlistContent}>
                <Text style={styles.playlistTitle} numberOfLines={1}>
                  {playlist.title}
                </Text>
                <Text style={styles.playlistSongs}>
                  {playlist.songsCount} • Curated Hits
                </Text>
              </View>
              <View style={styles.playlistPlayBtn}>
                <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 1 }} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '700',
  },
  horizontalScroll: {
    paddingRight: 18,
    gap: 14,
    marginBottom: 14,
  },
  playlistCard: {
    width: 220,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
  },
  playlistGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    position: 'relative',
  },
  playlistThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playlistContent: {
    flex: 1,
  },
  playlistTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  playlistSongs: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  playlistPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
