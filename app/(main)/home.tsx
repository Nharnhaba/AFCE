import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getGlobalTrending, getCurrentUser, loadStoredName } from '../../src/services/api';
import { fetchLiveNews } from '../../src/services/rss';
import { fetchLiveTrendingMusic } from '../../src/services/musicStreaming';
import { fetchLiveStreamingVideos } from '../../src/services/videoStreaming';
import MovingBackground from '../../src/components/MovingBackground';

export default function HomeScreen() {
  const router = useRouter();
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [topMusic, setTopMusic] = useState<any[]>([]);
  const [topNews, setTopNews] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredName().then((name) => {
      if (name) setUserName(name);
    });

    Promise.all([
      getGlobalTrending(undefined, 6).catch(() => null),
      getCurrentUser().catch(() => null),
      fetchLiveNews('All').catch(() => []),
      fetchLiveTrendingMusic().catch(() => []),
      fetchLiveStreamingVideos('Trending').catch(() => []),
    ])
      .then(([trendRes, userRes, liveNews, liveMusic, liveVideos]) => {
        if (trendRes && trendRes.trending) {
          const beVideos = trendRes.trending.videos || [];
          setTrendingVideos(beVideos.length > 0 ? beVideos : liveVideos.slice(0, 5));
          const beTracks = trendRes.trending.tracks || [];
          setTopMusic(beTracks.length > 0 ? beTracks : liveMusic.slice(0, 4));
          const beArticles = trendRes.trending.articles || [];
          setTopNews(beArticles.length > 0 ? beArticles : liveNews.slice(0, 4));
        } else {
          if (liveVideos && liveVideos.length > 0) setTrendingVideos(liveVideos.slice(0, 5));
          if (liveMusic && liveMusic.length > 0) setTopMusic(liveMusic.slice(0, 4));
          if (liveNews && liveNews.length > 0) setTopNews(liveNews.slice(0, 4));
        }
        if (userRes && userRes.name) {
          setUserName(userRes.name);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDuration = (sec?: number | string) => {
    if (!sec) return '3:20';
    if (typeof sec === 'string' && sec.includes(':')) return sec;
    const s = Number(sec);
    if (isNaN(s)) return '3:20';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const formatViews = (views?: number) => {
    if (!views) return '12K views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
    return `${views} views`;
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
      <MovingBackground type="all" direction="diagonal" opacity={0.35} />

      <LinearGradient
        colors={['rgba(10,10,15,0.3)', 'rgba(10,10,15,0.85)', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>Hi, {userName || 'Tino'} 👋</Text>
            <Text style={styles.greetingSubtitle}>Good to see you again</Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push('/(main)/profile')}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar Button */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.8}
        >
          <Feather name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search for videos, music, news...</Text>
        </TouchableOpacity>

        {/* 🔥 Trending Now Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/videos')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={trendingVideos}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.trendingCard}
              onPress={() => router.push(`/video/${item.id}` as any)}
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri:
                    item.thumbnail_url ||
                    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600',
                }}
                style={styles.trendingImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(10,10,15,0.9)']}
                style={styles.cardGradient}
              />
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
              </View>

              <View style={styles.cardBottomInfo}>
                <Text style={styles.trendingTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.trendingMeta}>
                  {formatViews(item.views)} • {item.author_name || 'AFCE Media'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No trending videos yet</Text>
          }
        />

        {/* 🎵 Top Music Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎵 Top Music</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/music')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.musicList}>
          {topMusic.slice(0, 4).map((track) => (
            <TouchableOpacity
              key={track.id}
              style={styles.musicItem}
              onPress={() => router.push(`/music/${track.id}` as any)}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri:
                    track.cover_art_url ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
                }}
                style={styles.trackImage}
              />
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist || 'Unknown Artist'}
                </Text>
              </View>

              <Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>
              <TouchableOpacity
                style={styles.playIconButton}
                onPress={() => router.push(`/music/${track.id}` as any)}
              >
                <Ionicons name="play" size={16} color="#c084fc" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {topMusic.length === 0 && (
            <Text style={styles.emptyText}>No top music available</Text>
          )}
        </View>

        {/* 📰 Top News Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📰 Top News</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/news')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.newsList}>
          {topNews.slice(0, 2).map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.newsCard}
              onPress={() => router.push(`/news/${article.id}` as any)}
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri:
                    article.cover_image_url ||
                    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600',
                }}
                style={styles.newsImage}
              />
              <View style={styles.newsContent}>
                <View style={styles.newsCategoryBadge}>
                  <Text style={styles.newsCategoryText}>
                    {article.category || 'Trending'}
                  </Text>
                </View>
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <Text style={styles.newsTime}>
                  {formatViews(article.views)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {topNews.length === 0 && (
            <Text style={styles.emptyText}>No news articles available</Text>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242436',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#a855f7',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#242436',
    marginBottom: 26,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    color: '#64748b',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '600',
  },
  trendingList: {
    paddingRight: 10,
    marginBottom: 24,
  },
  trendingCard: {
    width: 220,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: '#161622',
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  durationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBottomInfo: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  trendingTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  trendingMeta: {
    color: '#94a3b8',
    fontSize: 11,
  },
  musicList: {
    marginBottom: 24,
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242436',
  },
  trackImage: {
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
  playIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a1b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsList: {
    marginBottom: 20,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242436',
    height: 90,
  },
  newsImage: {
    width: 90,
    height: '100%',
  },
  newsContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  newsCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a1b3d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newsCategoryText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  newsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  newsTime: {
    color: '#64748b',
    fontSize: 11,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
});