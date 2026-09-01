import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://afci.onrender.com';
const TOKEN_KEY = 'auth_token';

let authToken: string | null = null;

export async function loadStoredToken() {
  try {
    authToken = await SecureStore.getItemAsync(TOKEN_KEY);
    return authToken;
  } catch (err) {
    console.error('Failed to load stored token', err);
    return null;
  }
}

export async function saveAuthToken(token: string) {
  try {
    authToken = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save token securely', err);
  }
}

const NAME_KEY = 'auth_user_name';
const REMEMBERED_EMAIL_KEY = 'remembered_email';

export async function loadRememberedEmail() {
  try {
    return await SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY);
  } catch (err) {
    return null;
  }
}

export async function saveRememberedEmail(email: string) {
  try {
    await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email);
  } catch (err) {}
}


export async function loadStoredName() {
  try {
    return await SecureStore.getItemAsync(NAME_KEY);
  } catch (err) {
    return null;
  }
}

export async function saveStoredName(name: string) {
  try {
    await SecureStore.setItemAsync(NAME_KEY, name);
  } catch (err) {}
}

export async function clearStoredName() {
  try {
    await SecureStore.deleteItemAsync(NAME_KEY);
  } catch (err) {}
}

export async function clearAuthToken() {
  try {
    authToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await clearStoredName();
  } catch (err) {
    console.error('Failed to clear stored token', err);
  }
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function getAuthHeaders() {
  if (!authToken) {
    await loadStoredToken();
  }
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

// --- Auth ---
export async function registerUser(name: string, email: string, password: string, passwordConfirmation: string) {
  const res = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
  const data = await res.json();
  if (data.user && data.user.name) {
    await saveStoredName(data.user.name);
  }
  return data;
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  const data = await res.json();
  if (data.token) {
    await saveAuthToken(data.token);
  }
  if (data.user && data.user.name) {
    await saveStoredName(data.user.name);
  }
  return data;
}

export async function getCurrentUser() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/user`, {
    headers,
  });
  if (res.status === 401) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error('Failed to fetch user');
  const json = await res.json();
  const user = json.user || json.data || json;
  if (user && user.name) {
    await saveStoredName(user.name);
  }
  return user;
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${BASE_URL}/api/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Password reset request failed');
  return res.json();
}

export async function resetPassword(email: string, token: string, password: string, passwordConfirmation: string) {
  const res = await fetch(`${BASE_URL}/api/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, password, password_confirmation: passwordConfirmation }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Password reset failed');
  return res.json();
}

// --- Metadata / Categories ---
export async function getCategories() {
  const res = await fetch(`${BASE_URL}/api/categories`);
  const json = await res.json();
  return json.categories; // string[]
}

export async function getGenres() {
  const res = await fetch(`${BASE_URL}/api/genres`);
  const json = await res.json();
  return json.genres; // string[]
}

export async function getGlobalTrending(type?: 'video' | 'track' | 'article', limit = 5) {
  let url = `${BASE_URL}/api/trending?limit=${limit}`;
  if (type) url += `&type=${type}`;
  const res = await fetch(url);
  return res.json();
}

// --- Videos ---
export async function getTrendingVideos(search?: string, category?: string, sort?: string) {
  let url = `${BASE_URL}/api/videos?`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (category) url += `category=${encodeURIComponent(category)}&`;
  if (sort) url += `sort=${encodeURIComponent(sort)}&`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data;
}

export async function getVideoDetail(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/videos/${id}`);
  const json = await res.json();
  return json.data;
}

export async function getMyVideos() {
  const res = await fetch(`${BASE_URL}/api/my-videos`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data;
}

export async function uploadVideo(title: string, videoUrl: string, description?: string, category?: string, thumbnail?: string, duration?: number) {
  const res = await fetch(`${BASE_URL}/api/videos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      title,
      video_url: videoUrl,
      description,
      category,
      thumbnail_url: thumbnail,
      duration,
      status: 'published',
    }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
  return res.json();
}

export async function deleteVideo(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/videos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Delete failed');
}

// --- Music/Tracks ---
export async function getTrendingTracks(search?: string, genre?: string, sort?: string) {
  let url = `${BASE_URL}/api/tracks?`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (genre) url += `genre=${encodeURIComponent(genre)}&`;
  if (sort) url += `sort=${encodeURIComponent(sort)}&`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data;
}

export async function getTrackDetail(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/tracks/${id}`);
  const json = await res.json();
  return json.data;
}

export async function getMyTracks() {
  const res = await fetch(`${BASE_URL}/api/my-tracks`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data;
}

export async function uploadTrack(title: string, artist: string, audioUrl: string, genre?: string, coverArtUrl?: string, duration?: number, album?: string) {
  const res = await fetch(`${BASE_URL}/api/tracks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      title,
      artist,
      audio_url: audioUrl,
      genre,
      cover_art_url: coverArtUrl,
      duration,
      album,
      status: 'published',
    }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
  return res.json();
}

export async function deleteTrack(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/tracks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Delete failed');
}

// --- Articles/News ---
export async function getTrendingArticles(search?: string, category?: string, sort?: string) {
  let url = `${BASE_URL}/api/articles?`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (category) url += `category=${encodeURIComponent(category)}&`;
  if (sort) url += `sort=${encodeURIComponent(sort)}&`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data;
}

export async function getArticleDetail(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/articles/${id}`);
  const json = await res.json();
  return json.data;
}

export async function getMyArticles() {
  const res = await fetch(`${BASE_URL}/api/my-articles`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data;
}

export async function uploadArticle(title: string, body: string, excerpt?: string, category?: string, coverImageUrl?: string) {
  const res = await fetch(`${BASE_URL}/api/articles`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      title,
      body,
      excerpt,
      category,
      cover_image_url: coverImageUrl,
      status: 'published',
    }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
  return res.json();
}

export async function deleteArticle(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/articles/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Delete failed');
}

// --- Likes ---
export async function toggleLike(type: 'video' | 'track' | 'article', id: string | number) {
  const res = await fetch(`${BASE_URL}/api/${type}/${id}/like`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to toggle like');
  return res.json(); // { liked: boolean, likes_count: number }
}

// --- Comments ---
export async function getComments(type: 'video' | 'track' | 'article', id: string | number) {
  const res = await fetch(`${BASE_URL}/api/${type}/${id}/comments`);
  const json = await res.json();
  return json.data;
}

export async function addComment(type: 'video' | 'track' | 'article', id: string | number, body: string) {
  const res = await fetch(`${BASE_URL}/api/${type}/${id}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
}

export async function deleteComment(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/comments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete comment');
}

// --- Profile ---
export async function getProfile() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/profile`, {
    headers,
  });
  if (res.status === 401) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    return getCurrentUser();
  }
  const json = await res.json();
  const userData = json.user || json.data || json;
  if (userData && userData.name) {
    await saveStoredName(userData.name);
  }
  return userData;
}

export async function updateProfile(data: { name?: string; email?: string; password?: string; password_confirmation?: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update profile');
  }
  const result = await res.json();
  const userData = result.user || result.data || result;
  if (userData && userData.name) {
    await saveStoredName(userData.name);
  }
  return result;
}

// --- Search ---
// Returns: { query: string, results: { videos: [], tracks: [], articles: [] } }
export async function searchContent(query: string) {
  const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

// --- Bookmarks ---
export async function toggleBookmark(type: 'video' | 'track' | 'article', id: string | number) {
  const res = await fetch(`${BASE_URL}/api/${type}/${id}/bookmark`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  return res.json();
}

export async function getBookmarks() {
  const res = await fetch(`${BASE_URL}/api/bookmarks`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
  return res.json();
}

// --- Playlists ---
export async function getPlaylists() {
  const res = await fetch(`${BASE_URL}/api/playlists`);
  if (!res.ok) throw new Error('Failed to fetch playlists');
  const json = await res.json();
  return json.data || json;
}