import { Audio, AVPlaybackStatus } from 'expo-av';

export interface PlaybackState {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  isLoading: boolean;
  currentTrackId: string | number | null;
  error?: string | null;
}

let soundInstance: Audio.Sound | null = null;
let currentTrackUrl: string | null = null;
let currentTrackId: string | number | null = null;
let stateListeners: ((state: PlaybackState) => void)[] = [];

let currentState: PlaybackState = {
  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,
  isLoading: false,
  currentTrackId: null,
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

export async function playTrack(trackId: string | number, audioUrl: string) {
  try {
    await initAudioMode();

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
    currentState = {
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 0,
      isLoading: false,
      currentTrackId: null,
    };
    notifyListeners();
  }
}
