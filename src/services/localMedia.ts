import * as MediaLibrary from 'expo-media-library';

export async function requestMediaPermission(): Promise<boolean> {
  try {
    const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      return true;
    }
    // Check if permissions are already granted
    const current = await MediaLibrary.getPermissionsAsync();
    return current.status === 'granted';
  } catch (err) {
    console.warn('requestMediaPermission error:', err);
    return false;
  }
}

export async function checkMediaPermission(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('checkMediaPermission error:', err);
    return false;
  }
}

export async function getLocalAudioFiles(): Promise<MediaLibrary.Asset[]> {
  const permission = await requestMediaPermission();
  if (!permission) {
    throw new Error('Media library permission not granted');
  }

  try {
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 100,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });
    return media.assets;
  } catch (err: any) {
    console.error('Failed to get local audio files:', err);
    throw err;
  }
}

export async function getLocalVideoFiles(): Promise<MediaLibrary.Asset[]> {
  const permission = await requestMediaPermission();
  if (!permission) {
    throw new Error('Media library permission not granted');
  }

  try {
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'video',
      first: 100,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });
    return media.assets;
  } catch (err: any) {
    console.error('Failed to get local video files:', err);
    throw err;
  }
}
