import { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../api/services';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {}
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const remove = async (id) => {
    const n = notifications.find((x) => x._id === id);
    await notificationsAPI.delete(id);
    setNotifications((prev) => prev.filter((x) => x._id !== id));
    if (n && !n.read) setUnreadCount((c) => Math.max(0, c - 1));
  };

  return { notifications, unreadCount, markRead, markAllRead, remove, refresh: fetch };
}
