import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://afce-media-api.test'; // swap for live URL once hosted
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

export async function clearAuthToken() {
  try {
    authToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to clear stored token', err);
  }
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

function authHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

// --- Auth ---
export async function registerUser(name: string, email: string, password: string, passwordConfirmation: string) {
  const res = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
  return res.json(); // { user, token }
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  return res.json(); // { user, token }
}

// --- Content (all paginated — actual items are in .data) ---
export async function getTrendingVideos() {
  const res = await fetch(`${BASE_URL}/api/videos?sort=trending`);
  const json = await res.json();
  return json.data;
}

export async function getTrendingTracks() {
  const res = await fetch(`${BASE_URL}/api/tracks?sort=trending`);
  const json = await res.json();
  return json.data;
}

export async function getTrendingArticles() {
  const res = await fetch(`${BASE_URL}/api/articles?sort=trending`);
  const json = await res.json();
  return json.data;
}