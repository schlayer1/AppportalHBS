import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'hbs_portal_favorites';

export function useFavorites(
  cloudFavorites?: string[], 
  onSaveCloudFavorites?: (favs: string[]) => void
) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (Array.isArray(cloudFavorites) && cloudFavorites.length > 0) {
      return cloudFavorites;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isFirstSyncRef = useRef(true);

  // Sync state when cloud favorites arrive (e.g. from iMac via Firestore real-time listener)
  useEffect(() => {
    if (Array.isArray(cloudFavorites)) {
      if (isFirstSyncRef.current) {
        isFirstSyncRef.current = false;
        // Merge with local if cloud had none, else cloud wins
        if (cloudFavorites.length > 0) {
          setFavorites(cloudFavorites);
        } else {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const local = saved ? JSON.parse(saved) : [];
            if (local.length > 0 && onSaveCloudFavorites) {
              onSaveCloudFavorites(local);
            }
          } catch {}
        }
      } else {
        setFavorites(cloudFavorites);
      }
    }
  }, [cloudFavorites, onSaveCloudFavorites]);

  // Persist to local storage as instant local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites to localStorage', e);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((appId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId];
      if (onSaveCloudFavorites) {
        onSaveCloudFavorites(next);
      }
      return next;
    });
  }, [onSaveCloudFavorites]);

  const isFavorite = useCallback(
    (appId: string) => favorites.includes(appId),
    [favorites]
  );

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    hasFavorites: favorites.length > 0,
  };
}

