import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  fetchLiveTrendingMusic,
  LIVE_PLAYLISTS,
  StreamingTrack,
  StreamingPlaylist,
} from '../../src/services/musicStreaming';
import {
  fetchJamendoTracks,
  JamendoTrack,
} from '../../src/services/jamendoApi';
import {
  fetchCCMixterTracks,
} from '../../src/services/ccmixterApi';
import {
  playTrack,
  setQueue,
  subscribePlaybackState,
  PlaybackState,
} from '../../src/services/audioPlayer';
import MovingBackground from '../../src/components/MovingBackground';

const GENRES = ['All', 'Afrobeats', 'Gospel', 'Reggae', 'Hip-Hop', 'R&B', 'Pop'];

export default function MusicTab() {
  const router = useRouter();
  const [tracks, setTracks] = useState<StreamingTrack[]>([]);
  const [jamendoTracks, setJamendoTracks] = useState<JamendoTrack[]>([]);
  const [activeSource, setActiveSource] = useState<'trending' | 'full_songs'>('trending');
  const [loading, setLoading] = useState(true);
  const [jamendoLoading, setJamendoLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    isLoading: false,
    currentTrackId: null,
    currentTrack: null,
    queueIndex: -1,
    queueLength: 0,
  });

  useEffect(() => {
    const unsubscribe = subscribePlaybackState(setPlaybackState);
    return unsubscribe;
  }, []);

  const triggerSpin = () => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadMusic = useCallback(async (query?: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      triggerSpin();
    } else {
      setLoading(true);
    }
    setJamendoLoading(true);

    try {
      const genreTag = selectedGenre !== 'All' ? selectedGenre : undefined;
      const [trendingData, fullData, ccmData] = await Promise.all([
        fetchLiveTrendingMusic(query || genreTag?.toLowerCase(), isRefresh),
        fetchJamendoTracks(genreTag, isRefresh),
        fetchCCMixterTracks(genreTag, isRefresh),
      ]);
      setTracks(trendingData || []);
      const combined = [...(fullData || []), ...(ccmData || [])];
      setJamendoTracks(combined);
    } catch (err) {
      console.error('Failed to load music streams:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setJamendoLoading(false);
    }
  }, [selectedGenre]);

  useEffect(() => {
    loadMusic();
  }, [loadMusic]);

  const handleRefreshClick = () => {
    let query: string | undefined;
    if (selectedGenre !== 'All') {
      query = selectedGenre.toLowerCase();
    } else if (selectedPlaylist) {
      query = LIVE_PLAYLISTS.find((p) => p.id === selectedPlaylist)?.query;
    }
    loadMusic(query, true);
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setSelectedPlaylist(null);
  };

  const handlePlaylistSelect = (playlist: StreamingPlaylist) => {
    if (selectedPlaylist === playlist.id) {
      setSelectedPlaylist(null);
      const query = selectedGenre !== 'All' ? selectedGenre.toLowerCase() : undefined;
      loadMusic(query, true);
    } else {
      setSelectedPlaylist(playlist.id);
      setSelectedGenre('All');
      loadMusic(playlist.query, true);
    }
  };

  const handleInlinePlay = async (track: StreamingTrack | JamendoTrack) => {
    const currentList = activeSource === 'full_songs' ? jamendoTracks : tracks;
    const queueList = currentList.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      cover_art_url: t.cover_art_url,
      audio_url: t.audio_url,
      duration: t.duration,
      link: t.link || (t as any).source_url || (t as any).external_url,
      source_url: (t as any).source_url || t.link,
      external_url: (t as any).external_url || t.link,
    }));
    const index = queueList.findIndex((t) => t.id.toString() === track.id.toString());
    if (index >= 0) {
      await setQueue(queueList, index);
    } else if (track.audio_url) {
      await playTrack(track.id, track.audio_url, {
        title: track.title,
        artist: track.artist,
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        link: track.link || (track as any).source_url || (track as any).external_url,
        source_url: (track as any).source_url || track.link,
        external_url: (track as any).external_url || track.link,
      });
    } else {
      router.push({ pathname: '/music/[id]', params: { id: track.id } } as any);
    }
  };

  const formatDuration = (sec?: number | string) => {
    if (!sec) return '3:41';
    const s = Number(sec);
    if (isNaN(s)) return '3:41';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefreshClick}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Live Music Stream</Text>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveIndicatorText}>
                {activeSource === 'full_songs' ? '100% FREE FULL-LENGTH SONGS' : 'STREAMING FROM CLOUD'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleRefreshClick}
              disabled={refreshing}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh" size={20} color="#c084fc" />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/search')}
            >
              <Feather name="search" size={19} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Source Toggle Switcher: Trending vs Full Songs */}
        <View style={styles.sourceToggleRow}>
          <TouchableOpacity
            style={[
              styles.sourceToggleBtn,
              activeSource === 'trending' && styles.activeSourceToggleBtn,
            ]}
            onPress={() => setActiveSource('trending')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="flame"
              size={15}
              color={activeSource === 'trending' ? '#ffffff' : '#94a3b8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.sourceToggleText,
                activeSource === 'trending' && styles.activeSourceToggleText,
              ]}
            >
              Trending Previews
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sourceToggleBtn,
              activeSource === 'full_songs' && styles.activeSourceToggleBtn,
            ]}
            onPress={() => setActiveSource('full_songs')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="musical-notes"
              size={15}
              color={activeSource === 'full_songs' ? '#ffffff' : '#94a3b8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.sourceToggleText,
                activeSource === 'full_songs' && styles.activeSourceToggleText,
              ]}
            >
              Full Songs (Free Library)
            </Text>
            <View style={styles.fullBadgePill}>
              <Text style={styles.fullBadgePillText}>FREE</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Genre Filter Tabs */}
        <View style={styles.genresWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genresContainer}
          >
            {GENRES.map((genre) => {
              const isSelected = selectedGenre === genre;
              return (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    isSelected && styles.selectedGenreChip,
                  ]}
                  onPress={() => handleGenreSelect(genre)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genreChipText,
                      isSelected && styles.selectedGenreChipText,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* If Active Source is Full Songs: Render Jamendo & ccMixter Library */}
        {activeSource === 'full_songs' ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Full Songs (Free Library)</Text>
                <Text style={styles.sectionSubtitle}>
                  Direct full-length streamable MP3 tracks from Jamendo & ccMixter
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshBadge}
                onPress={handleRefreshClick}
                disabled={refreshing || jamendoLoading}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync-outline" size={14} color="#10b981" />
                </Animated.View>
                <Text style={[styles.refreshBadgeText, { color: '#34d399' }]}>
                  {refreshing || jamendoLoading ? 'Refreshing...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>

            {jamendoLoading ? (
              <View style={styles.tracksList}>
                {[1, 2, 3, 4, 5, 6].map((key) => (
                  <View key={key} style={styles.skeletonTrackItem}>
                    <View style={styles.skeletonCover} />
                    <View style={styles.skeletonInfo}>
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonArtist} />
                    </View>
                    <View style={styles.skeletonButton} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.tracksList}>
                {jamendoTracks.map((item) => {
                  const isCurrentlyPlaying =
                    playbackState.currentTrackId === item.id && playbackState.isPlaying;
                  const isCurrentTrack = playbackState.currentTrackId === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.trackItem,
                        isCurrentTrack && styles.activeTrackItemJamendo,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/music/[id]',
                          params: { id: item.id },
                        } as any)
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.coverWrapper}>
                        <Image
                          source={{ uri: item.cover_art_url }}
                          style={styles.trackCover}
                        />
                        {isCurrentlyPlaying && (
                          <View style={[styles.playingOverlay, { backgroundColor: 'rgba(16, 185, 129, 0.75)' }]}>
                            <Ionicons name="volume-high" size={16} color="#fff" />
                          </View>
                        )}
                      </View>

                      <View style={styles.trackInfo}>
                        <View style={styles.titleRowBadge}>
                          <Text
                            style={[
                              styles.trackTitle,
                              isCurrentTrack && { color: '#34d399', fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                        </View>
                        <Text style={styles.trackArtist} numberOfLines={1}>
                          {item.artist} • {item.genre}
                        </Text>
                      </View>

                      <View style={styles.durationBlock}>
                        <View style={styles.fullSongTag}>
                          <Text style={styles.fullSongTagText}>FULL SONG</Text>
                        </View>
                        <Text style={styles.trackDuration}>
                          {formatDuration(item.duration)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.trackPlayButton,
                          isCurrentlyPlaying ? { backgroundColor: '#10b981' } : { backgroundColor: '#132e27' },
                        ]}
                        onPress={() => handleInlinePlay(item)}
                      >
                        {playbackState.isLoading && isCurrentTrack ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons
                            name={isCurrentlyPlaying ? 'pause' : 'play'}
                            size={16}
                            color={isCurrentlyPlaying ? '#ffffff' : '#34d399'}
                            style={isCurrentlyPlaying ? {} : { marginLeft: 2 }}
                          />
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}

                {jamendoTracks.length === 0 && !loading && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="musical-notes-outline" size={48} color="#475569" />
                    <Text style={styles.emptyText}>No full songs found for {selectedGenre}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRefreshClick}>
                      <Text style={styles.retryBtnText}>Tap to Refresh</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Featured Playlists Section */}
            <Text style={styles.sectionTitle}>Featured Playlists</Text>

            <View style={styles.featuredPlaylistsContainer}>
              {LIVE_PLAYLISTS.map((playlist) => {
                const isSelected = selectedPlaylist === playlist.id;
                return (
                  <TouchableOpacity
                    key={playlist.id}
                    style={[
                      styles.playlistCard,
                      isSelected && styles.selectedPlaylistCard,
                    ]}
                    onPress={() => handlePlaylistSelect(playlist)}
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
                          <Text style={styles.playlistSongs}>
                            {isSelected ? 'Active Filter • Tap to Reset' : playlist.songsCount}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.playlistPlayBtn}>
                        <Ionicons
                          name={isSelected ? 'checkmark' : 'play'}
                          size={20}
                          color="#6d28d9"
                          style={isSelected ? {} : { marginLeft: 3 }}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Separate Full Songs Highlight Carousel */}
            {jamendoTracks.length > 0 && (
              <View style={styles.fullSongsHighlightSection}>
                <View style={styles.highlightHeaderRow}>
                  <View>
                    <Text style={styles.highlightTitle}>Full Songs (Free Library)</Text>
                    <Text style={styles.highlightSubtitle}>Unclipped 3–5 min full tracks</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.seeAllFullBtn}
                    onPress={() => setActiveSource('full_songs')}
                  >
                    <Text style={styles.seeAllFullText}>View All</Text>
                    <Ionicons name="chevron-forward" size={14} color="#34d399" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.highlightCarousel}
                >
                  {jamendoTracks.slice(0, 6).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.highlightCard}
                      onPress={() => handleInlinePlay(item)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.highlightThumbWrapper}>
                        <Image
                          source={{ uri: item.cover_art_url }}
                          style={styles.highlightThumb}
                        />
                        <View style={styles.fullTagBadge}>
                          <Text style={styles.fullTagBadgeText}>FULL</Text>
                        </View>
                        <View style={styles.highlightPlayCircle}>
                          <Ionicons
                            name={playbackState.currentTrackId === item.id && playbackState.isPlaying ? 'pause' : 'play'}
                            size={16}
                            color="#fff"
                          />
                        </View>
                      </View>
                      <Text style={styles.highlightCardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.highlightCardArtist} numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Streaming Tracks List Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedPlaylist
                  ? `${LIVE_PLAYLISTS.find((p) => p.id === selectedPlaylist)?.title || 'Playlist'} Tracks`
                  : 'Trending Now'}
              </Text>
              <TouchableOpacity
                style={styles.refreshBadge}
                onPress={handleRefreshClick}
                disabled={refreshing}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync-outline" size={14} color="#c084fc" />
                </Animated.View>
                <Text style={styles.refreshBadgeText}>
                  {refreshing ? 'Refreshing...' : 'Refresh Tracks'}
                </Text>
              </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#a855f7" />
                <Text style={styles.loadingText}>Connecting to live music streams...</Text>
              </View>
            ) : (
              <View style={styles.tracksList}>
                {tracks.map((item) => {
                  const isCurrentlyPlaying =
                    playbackState.currentTrackId === item.id && playbackState.isPlaying;
                  const isCurrentTrack = playbackState.currentTrackId === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.trackItem,
                        isCurrentTrack && styles.activeTrackItem,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/music/[id]',
                          params: { id: item.id },
                        } as any)
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.coverWrapper}>
                        <Image
                          source={{ uri: item.cover_art_url }}
                          style={styles.trackCover}
                        />
                        {isCurrentlyPlaying && (
                          <View style={styles.playingOverlay}>
                            <Ionicons name="volume-high" size={16} color="#fff" />
                          </View>
                        )}
                      </View>

                      <View style={styles.trackInfo}>
                        <Text
                          style={[
                            styles.trackTitle,
                            isCurrentTrack && styles.activeTrackTitle,
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>
                          {item.artist} • {item.album}
                        </Text>
                      </View>

                      <Text style={styles.trackDuration}>
                        {formatDuration(item.duration)}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.trackPlayButton,
                          isCurrentlyPlaying && styles.activePlayButton,
                        ]}
                        onPress={() => handleInlinePlay(item)}
                      >
                        {playbackState.isLoading && isCurrentTrack ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons
                            name={isCurrentlyPlaying ? 'pause' : 'play'}
                            size={16}
                            color={isCurrentlyPlaying ? '#ffffff' : '#c084fc'}
                            style={isCurrentlyPlaying ? {} : { marginLeft: 2 }}
                          />
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}

                {tracks.length === 0 && !loading && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="musical-notes-outline" size={48} color="#475569" />
                    <Text style={styles.emptyText}>No live streaming tracks available</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRefreshClick}>
                      <Text style={styles.retryBtnText}>Tap to Refresh</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
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
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a855f7',
    marginRight: 6,
  },
  liveIndicatorText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#12111d',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222035',
  },
  sourceToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  activeSourceToggleBtn: {
    backgroundColor: '#2a1b3d',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  sourceToggleText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeSourceToggleText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  fullBadgePill: {
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  fullBadgePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  genresWrapper: {
    marginBottom: 20,
  },
  genresContainer: {
    paddingRight: 10,
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
  },
  selectedGenreChip: {
    backgroundColor: '#9333ea',
    borderColor: '#c084fc',
  },
  genreChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedGenreChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  refreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1b3d',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  refreshBadgeText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
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
  selectedPlaylistCard: {
    borderWidth: 2,
    borderColor: '#ffffff',
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
    flex: 1,
  },
  playlistThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  playlistMeta: {
    flex: 1,
  },
  playlistTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  playlistSongs: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  playlistPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSongsHighlightSection: {
    marginTop: 24,
    backgroundColor: '#0f171d',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#133529',
  },
  highlightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  highlightTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  highlightSubtitle: {
    color: '#34d399',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  seeAllFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#132e27',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 3,
  },
  seeAllFullText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  highlightCarousel: {
    gap: 12,
    paddingRight: 10,
  },
  highlightCard: {
    width: 115,
  },
  highlightThumbWrapper: {
    width: 115,
    height: 115,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1b2d24',
    marginBottom: 8,
  },
  highlightThumb: {
    width: '100%',
    height: '100%',
  },
  fullTagBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullTagBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  highlightPlayCircle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 150, 105, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightCardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightCardArtist: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
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
  activeTrackItem: {
    borderColor: '#a855f7',
    backgroundColor: '#1a1528',
  },
  activeTrackItemJamendo: {
    borderColor: '#10b981',
    backgroundColor: '#0e1f1a',
  },
  coverWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2a1b3d',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 51, 234, 0.7)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  titleRowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTrackTitle: {
    color: '#c084fc',
    fontWeight: '700',
  },
  trackArtist: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  durationBlock: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  fullSongTag: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginBottom: 3,
  },
  fullSongTagText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '800',
  },
  trackDuration: {
    color: '#64748b',
    fontSize: 12,
  },
  trackPlayButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePlayButton: {
    backgroundColor: '#9333ea',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#2a1b3d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#c084fc',
    fontWeight: '600',
  },
  skeletonTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242436',
    opacity: 0.6,
  },
  skeletonCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    marginRight: 12,
  },
  skeletonInfo: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    width: '65%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  skeletonArtist: {
    width: '40%',
    height: 10,
    borderRadius: 4,
    backgroundColor: '#1e293b',
  },
  skeletonButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1e293b',
  },
});
