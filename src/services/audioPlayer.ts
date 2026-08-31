import { Audio, AVPlaybackStatus } from 'expo-av';

export interface ActiveTrackInfo {
  id: string | number;
  title: string;
  artist: string;
  cover_art_url: string;
  audio_url: string;
  duration?: number;
  link?: string;
  source_url?: string;
  external_url?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  isLoading: boolean;
  currentTrackId: string | number | null;
  currentTrack: ActiveTrackInfo | null;
  error?: string | null;
}

let soundInstance: Audio.Sound | null = null;
let currentTrackUrl: string | null = null;
let currentTrackId: string | number | null = null;
let currentTrackMeta: ActiveTrackInfo | null = null;
let stateListeners: ((state: PlaybackState) => void)[] = [];

let currentState: PlaybackState = {
  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,
  isLoading: false,
  currentTrackId: null,
  currentTrack: null,
};

function notifyListeners() {
  stateListeners.forEach((listener) => listener({ ...currentState }));
}

export function subscribePlaybackState(callback: (state: PlaybackState) => void) {
  stateListeners.push(callback);
  callback({ ...currentState });
  return () => {
    stateListeners = stateListeners.filter((l) => l !== callback);
  };
}

export async function initAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (err) {
    console.warn('Audio mode init warning:', err);
  }
}

export async function playTrack(
  trackId: string | number,
  audioUrl: string,
  meta?: {
    title?: string;
    artist?: string;
    cover_art_url?: string;
    duration?: number;
    link?: string;
    source_url?: string;
    external_url?: string;
  }
) {
  try {
    await initAudioMode();

    if (meta) {
      currentTrackMeta = {
        id: trackId,
        title: meta.title || 'Playing Track',
        artist: meta.artist || 'Artist',
        cover_art_url: meta.cover_art_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
        audio_url: audioUrl,
        duration: meta.duration || 180,
        link: meta.link || meta.source_url || meta.external_url || '',
        source_url: meta.source_url || meta.link || '',
        external_url: meta.external_url || meta.link || '',
      };
    } else if (!currentTrackMeta || currentTrackMeta.id !== trackId) {
      currentTrackMeta = {
        id: trackId,
        title: 'Playing Track',
        artist: 'Artist',
        cover_art_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
        audio_url: audioUrl,
        duration: 180,
      };
    }

    if (currentTrackUrl === audioUrl && soundInstance) {
      const status = await soundInstance.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundInstance.pauseAsync();
        } else {
          await soundInstance.playAsync();
        }
        return;
      }
    }

    // Stop and unload previous
    if (soundInstance) {
      try {
        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
      } catch {}
      soundInstance = null;
    }

    currentState = {
      ...currentState,
      isLoading: true,
      currentTrackId: trackId,
      currentTrack: currentTrackMeta,
      error: null,
    };
    notifyListeners();

    currentTrackUrl = audioUrl;
    currentTrackId = trackId;

    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true, progressUpdateIntervalMillis: 250 },
      onPlaybackStatusUpdate
    );

    soundInstance = sound;
  } catch (err: any) {
    console.error('Failed to play audio stream:', err);
    currentState = {
      ...currentState,
      isLoading: false,
      isPlaying: false,
      error: err.message || 'Playback failed',
    };
    notifyListeners();
  }
}

function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
  if (!status.isLoaded) {
    if (status.error) {
      currentState = {
        ...currentState,
        isPlaying: false,
        isLoading: false,
        error: status.error,
      };
      notifyListeners();
    }
    return;
  }

  currentState = {
    isPlaying: status.isPlaying,
    positionMillis: status.positionMillis,
    durationMillis: status.durationMillis || 30000,
    isLoading: status.isBuffering && !status.isPlaying,
    currentTrackId,
    currentTrack: currentTrackMeta,
    error: null,
  };

  if (status.didJustFinish) {
    currentState.isPlaying = false;
    currentState.positionMillis = 0;
  }

  notifyListeners();
}

export async function togglePlayPause() {
  if (!soundInstance) return;
  try {
    const status = await soundInstance.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await soundInstance.pauseAsync();
      } else {
        await soundInstance.playAsync();
      }
    }
  } catch (err) {
    console.warn('Play/Pause error:', err);
  }
}

export async function seekTo(millis: number) {
  if (!soundInstance) return;
  try {
    await soundInstance.setPositionAsync(millis);
  } catch (err) {
    console.warn('Seek error:', err);
  }
}

export async function stopPlayback() {
  if (soundInstance) {
    try {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
    } catch {}
    soundInstance = null;
    currentTrackUrl = null;
    currentTrackId = null;
    currentTrackMeta = null;
    currentState = {
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 0,
      isLoading: false,
      currentTrackId: null,
      currentTrack: null,
    };
    notifyListeners();
  }
}
