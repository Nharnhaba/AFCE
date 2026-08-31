import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getTrendingTracks, getPlaylists } from '../../src/services/api';
import MovingBackground from '../../src/components/MovingBackground';

interface TrackItem {
  id: string | number;
  title: string;
  artist?: string;
  duration?: string | number;
  cover_art_url?: string;
  genre?: string;
}

const FEATURED_PLAYLISTS = [
  {
    id: 'p1',
    title: "Today's Hits",
    songsCount: '50 Songs',
    colors: ['#6366f1', '#a855f7'],
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
  },
  {
    id: 'p2',
    title: 'Afrobeats Vibes',
    songsCount: '80 Songs',
    colors: ['#f97316', '#ea580c'],
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  },
  {
    id: 'p3',
    title: 'Chill & Relax',
    songsCount: '60 Songs',
    colors: ['#06b6d4', '#0d9488'],
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
  },
];

export default function MusicTab() {
  const router = useRouter();
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingTracks()
      .then((data) => setTracks(data || []))
      .catch((err: any) => console.error('Failed to load tracks:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatDuration = (sec?: number | string) => {
    if (!sec) return '3:41';
    if (typeof sec === 'string' && sec.includes(':')) return sec;
    const s = Number(sec);
    if (isNaN(s)) return '3:41';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MovingBackground type="music" direction="circular" opacity={0.35} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.85)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Music</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/search')}
          >
            <Feather name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Featured Playlists Section */}
        <Text style={styles.sectionTitle}>Featured Playlists</Text>

        <View style={styles.featuredPlaylistsContainer}>
          {FEATURED_PLAYLISTS.map((playlist, idx) => (
            <TouchableOpacity
              key={playlist.id}
              style={styles.playlistCard}
              onPress={() => {
                if (tracks.length > 0) {
                  const pickIdx = idx % tracks.length;
                  router.push(`/music/${tracks[pickIdx].id}` as any);
                }
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={playlist.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playlistGradient}
              >
                <View style={styles.playlistLeft}>
                  <Image
                    source={{ uri: playlist.image }}
                    style={styles.playlistThumb}
                  />
                  <View style={styles.playlistMeta}>
                    <Text style={styles.playlistTitle}>{playlist.title}</Text>
                    <Text style={styles.playlistSongs}>{playlist.songsCount}</Text>
                  </View>
                </View>

                <View style={styles.playlistPlayBtn}>
                  <Ionicons name="play" size={20} color="#6d28d9" style={{ marginLeft: 3 }} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recently Played Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tracksList}>
          {tracks.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.trackItem}
              onPress={() => router.push(`/music/${item.id}` as any)}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri:
                    item.cover_art_url ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
                }}
                style={styles.trackCover}
              />
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist || 'Unknown Artist'}
                </Text>
              </View>

              <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>

              <TouchableOpacity
                style={styles.trackPlayButton}
                onPress={() => router.push(`/music/${item.id}` as any)}
              >
                <Ionicons name="play" size={16} color="#c084fc" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {tracks.length === 0 && (
            <Text style={styles.emptyText}>No music tracks found</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  seeAllText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '600',
  },
  featuredPlaylistsContainer: {
    gap: 12,
  },
  playlistCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playlistGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  playlistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  playlistMeta: {},
  playlistTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  playlistSongs: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 3,
  },
  playlistPlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tracksList: {
    gap: 10,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242436',
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#2a1b3d',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  trackArtist: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  trackDuration: {
    color: '#64748b',
    fontSize: 12,
    marginRight: 12,
  },
  trackPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
