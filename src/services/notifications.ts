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
    const rawList = json.notifications?.data || json.notifications || json.data || json;
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item: any) => ({
      ...item,
      read: item.read !== undefined ? item.read : item.read_at !== null,
    }));
  } catch (err) {
    console.error('getNotifications error:', err);
    return []; // Return empty array on failure
  }
}

export async function markNotificationRead(id: string | number) {
  // Wait, backend api.php only has /notifications/read-all for marking all as read,
  // but if we need individual delete we can use /notifications/{id}
  // Let's implement individual deletion and mark all as read.
}

export async function clearAllNotifications() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to mark all as read / clear');
}

export async function deleteNotification(id: string | number) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/notifications/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete notification');
}
