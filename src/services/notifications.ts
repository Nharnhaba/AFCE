import { getAuthHeaders } from './api';

const BASE_URL = 'https://afci.onrender.com';

export interface AppNotification {
  id: string | number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type?: string;
  action_url?: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.error('getNotifications error:', err);
    return []; // Return empty array on failure
  }
}

export async function markNotificationRead(id: string | number) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to mark read');
}

export async function clearAllNotifications() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/notifications`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to clear notifications');
}
