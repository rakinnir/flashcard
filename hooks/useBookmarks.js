import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bookmarks';
const UNKNOWN_SHEET = 'Unknown';

export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  // Always holds the latest list, so back-to-back saves/removes never read stale state
  // and the state updater stays free of side effects.
  const latest = useRef([]);

  const loadBookmarks = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const loaded = json ? JSON.parse(json) : [];
      latest.current = loaded;
      setBookmarks(loaded);
    } catch (e) {
      console.warn('Load bookmarks error', e);
    }
  }, []);

  useEffect(() => { loadBookmarks(); }, [loadBookmarks]);

  const commit = useCallback((next) => {
    latest.current = next;
    setBookmarks(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) =>
      console.warn('Save bookmarks error', e)
    );
  }, []);

  const saveBookmark = useCallback((card, sheetName) => {
    const prev = latest.current;
    if (prev.some((x) => x.Word === card.Word)) return;
    commit([...prev, { ...card, sheetName: sheetName ?? UNKNOWN_SHEET }]);
  }, [commit]);

  const removeBookmark = useCallback((word) => {
    commit(latest.current.filter((x) => x.Word !== word));
  }, [commit]);

  // Group bookmarks by sheetName: { 'GRE 333': [...], 'WS1': [...] }
  const groupedBookmarks = useMemo(() => {
    return bookmarks.reduce((acc, item) => {
      const key = item.sheetName ?? UNKNOWN_SHEET;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [bookmarks]);

  return { bookmarks, groupedBookmarks, loadBookmarks, saveBookmark, removeBookmark };
}
