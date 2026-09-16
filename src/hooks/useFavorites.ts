import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hbs_portal_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites', e);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((appId: string) => {
    setFavorites((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

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
