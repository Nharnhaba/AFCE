import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

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
  queueIndex?: number;
  queueLength?: number;
  error?: string | null;
}

let playerInstance: AudioPlayer | null = null;
let statusListenerSubscription: { remove: () => void } | null = null;
let currentTrackUrl: string | null = null;
let currentTrackId: string | number | null = null;
let currentTrackMeta: ActiveTrackInfo | null = null;
let trackQueue: ActiveTrackInfo[] = [];
let currentQueueIndex: number = -1;
let stateListeners: ((state: PlaybackState) => void)[] = [];

let currentState: PlaybackState = {
  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,
  isLoading: false,
  currentTrackId: null,
  currentTrack: null,
  queueIndex: -1,
  queueLength: 0,
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
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  } catch (err) {
    console.warn('Audio mode init warning:', err);
  }
}

/**
 * Load a playlist/queue of tracks and immediately start playing from startIndex
 */
export async function setQueue(tracks: ActiveTrackInfo[], startIndex: number = 0) {
  trackQueue = [...tracks];
  const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
  currentQueueIndex = safeIndex;

  const trackToPlay = trackQueue[safeIndex];
  if (trackToPlay && trackToPlay.audio_url) {
    await playTrack(trackToPlay.id, trackToPlay.audio_url, trackToPlay);
  }
}

/**
 * Play the next track in the queue
 */
export async function playNext(): Promise<boolean> {
  if (trackQueue.length === 0) return false;

  const nextIndex = (currentQueueIndex + 1) % trackQueue.length;
  currentQueueIndex = nextIndex;
  const nextTrack = trackQueue[nextIndex];

  if (nextTrack && nextTrack.audio_url) {
    await playTrack(nextTrack.id, nextTrack.audio_url, nextTrack);
    return true;
  }
  return false;
}

/**
 * Play the previous track in the queue
 */
export async function playPrevious(): Promise<boolean> {
  if (trackQueue.length === 0) return false;

  const prevIndex = currentQueueIndex <= 0 ? trackQueue.length - 1 : currentQueueIndex - 1;
  currentQueueIndex = prevIndex;
  const prevTrack = trackQueue[prevIndex];

  if (prevTrack && prevTrack.audio_url) {
    await playTrack(prevTrack.id, prevTrack.audio_url, prevTrack);
    return true;
  }
  return false;
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

    // Check if track is already in queue or add it
    const existingIndex = trackQueue.findIndex((t) => t.id.toString() === trackId.toString());
    if (existingIndex >= 0) {
      currentQueueIndex = existingIndex;
    } else if (currentTrackMeta) {
      trackQueue = [currentTrackMeta, ...trackQueue];
      currentQueueIndex = 0;
    }

    if (currentTrackUrl === audioUrl && playerInstance) {
      if (playerInstance.playing) {
        playerInstance.pause();
      } else {
        playerInstance.play();
      }
      return;
    }

    // Release previous player
    if (playerInstance) {
      try {
        if (statusListenerSubscription) {
          statusListenerSubscription.remove();
          statusListenerSubscription = null;
        }
        playerInstance.pause();
        playerInstance.release();
      } catch {}
      playerInstance = null;
    }

    currentState = {
      ...currentState,
      isLoading: true,
      currentTrackId: trackId,
      currentTrack: currentTrackMeta,
      queueIndex: currentQueueIndex,
      queueLength: trackQueue.length,
      error: null,
    };
    notifyListeners();

    currentTrackUrl = audioUrl;
    currentTrackId = trackId;

    const player = createAudioPlayer(audioUrl, { updateInterval: 250 });
    playerInstance = player;

    statusListenerSubscription = player.addListener('playbackStatusUpdate', (status) => {
      currentState = {
        isPlaying: status.playing,
        positionMillis: Math.floor((status.currentTime || 0) * 1000),
        durationMillis: Math.floor((status.duration || (currentTrackMeta?.duration ? currentTrackMeta.duration : 30)) * 1000),
        isLoading: status.isBuffering && !status.playing,
        currentTrackId,
        currentTrack: currentTrackMeta,
        queueIndex: currentQueueIndex,
        queueLength: trackQueue.length,
        error: null,
      };

      if (status.didJustFinish) {
        currentState.isPlaying = false;
        currentState.positionMillis = 0;
        // Auto play next in queue
        if (trackQueue.length > 1) {
          playNext();
        }
      }

      notifyListeners();
    });

    player.play();
  } catch (err: any) {
    console.error('Failed to play audio stream with expo-audio:', err);
    currentState = {
      ...currentState,
      isLoading: false,
      isPlaying: false,
      error: err.message || 'Playback failed',
    };
    notifyListeners();
  }
}

export async function togglePlayPause() {
  if (!playerInstance) return;
  try {
    if (playerInstance.playing) {
      playerInstance.pause();
    } else {
      playerInstance.play();
    }
  } catch (err) {
    console.warn('Play/Pause error:', err);
  }
}

export async function seekTo(millis: number) {
  if (!playerInstance) return;
  try {
    playerInstance.seekTo(millis / 1000);
  } catch (err) {
    console.warn('Seek error:', err);
  }
}

export async function stopPlayback() {
  if (playerInstance) {
    try {
      if (statusListenerSubscription) {
        statusListenerSubscription.remove();
        statusListenerSubscription = null;
      }
      playerInstance.pause();
      playerInstance.release();
    } catch {}
    playerInstance = null;
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
      queueIndex: -1,
      queueLength: trackQueue.length,
    };
    notifyListeners();
  }
}
