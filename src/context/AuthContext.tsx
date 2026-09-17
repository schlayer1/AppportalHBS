import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PortalUser, CustomUserApp, SavedBoardTemplate, UserPreferences } from '../types/user';
import { BoardScreen } from '../components/board/types';
import { 
  loadPortalDataFromCloud, 
  savePortalDataToCloud, 
  syncTeachersFromVertretungsstatistik, 
  MASTER_ADMIN_PIN, 
  getCachedPortalData 
} from '../services/firebase';
import { MentiPresentation, MentiLiveSession } from '../types/mentiTypes';
import { DEFAULT_MENTI_TEMPLATES } from '../data/defaultMentiTemplates';

interface AuthContextType {
  currentUser: PortalUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  users: PortalUser[];
  isLoading: boolean;
  userPreferences: UserPreferences | null;
  boardTemplates: SavedBoardTemplate[];
  
  // Auth actions
  loginWithUser: (userId: string, pin: string) => Promise<boolean>;
  loginWithAdminMaster: (pin: string) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
  
  // User Management actions (Admin)
  saveUsersList: (newUsers: PortalUser[]) => Promise<void>;
  syncWithVertretungsstatistik: () => Promise<{ added: number; updated: number; total: number }>;
  
  // Custom Apps & Reordering
  updateAppOrder: (newOrder: string[]) => Promise<void>;
  addCustomApp: (app: Omit<CustomUserApp, 'id' | 'createdAt'>) => Promise<void>;
  removeCustomApp: (appId: string) => Promise<void>;
  
  // Board Templates
  saveBoardTemplate: (
    title: string, 
    screen: BoardScreen, 
    isSchoolTemplate: boolean,
    metadata?: {
      description?: string;
      subject?: string;
      grade?: string;
      isSubstitution?: boolean;
      substitutionClass?: string;
      substitutionNotes?: string;
      targetDate?: string;
    }
  ) => Promise<SavedBoardTemplate>;
  deleteBoardTemplate: (id: string) => Promise<void>;

  // Menti Presentations & Live Sessions
  mentiPresentations: MentiPresentation[];
  activeMentiSession: MentiLiveSession | null;
  saveMentiPresentation: (presentation: MentiPresentation) => Promise<MentiPresentation>;
  deleteMentiPresentation: (id: string) => Promise<void>;
  toggleShareMentiPresentation: (id: string) => Promise<void>;
  duplicateMentiPresentation: (id: string) => Promise<MentiPresentation>;
  updateActiveMentiSession: (session: MentiLiveSession | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_USER_KEY = 'hbs_current_portal_user_v1';
const AUTH_GUEST_KEY = 'hbs_guest_portal_mode_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<PortalUser[]>(() => getCachedPortalData().users);
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_GUEST_KEY) === 'true';
  });
  const [allPreferences, setAllPreferences] = useState<Record<string, UserPreferences>>(() => getCachedPortalData().preferences);
  const [boardTemplates, setBoardTemplates] = useState<SavedBoardTemplate[]>(() => getCachedPortalData().boardTemplates);
  const [mentiPresentations, setMentiPresentations] = useState<MentiPresentation[]>(() => getCachedPortalData().mentiPresentations || DEFAULT_MENTI_TEMPLATES);
  const [activeMentiSession, setActiveMentiSession] = useState<MentiLiveSession | null>(() => getCachedPortalData().activeMentiSession || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load latest data from Cloud on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoading(true);
      try {
        const cloudData = await loadPortalDataFromCloud();
        if (isMounted) {
          setUsers(cloudData.users);
          setAllPreferences(cloudData.preferences);
          setBoardTemplates(cloudData.boardTemplates);
          if (cloudData.mentiPresentations && cloudData.mentiPresentations.length > 0) {
            setMentiPresentations(cloudData.mentiPresentations);
          }
          setActiveMentiSession(cloudData.activeMentiSession || null);
        }
      } catch (err) {
        console.warn("Cloud init error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  const isAuthenticated = !!currentUser || isGuest;
  const isAdmin = currentUser?.role === 'admin';

  // Get current user's preferences
  const userPreferences: UserPreferences | null = currentUser 
    ? allPreferences[currentUser.id] || { userId: currentUser.id, appOrder: [], favorites: [], customApps: [], updatedAt: Date.now() }
    : null;

  // Login with Teacher name + 4-digit PIN
  const loginWithUser = useCallback(async (userId: string, pin: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const trimmedPin = pin.trim();
    if (user.pin === trimmedPin || trimmedPin === MASTER_ADMIN_PIN) {
      const updatedUser: PortalUser = {
        ...user,
        role: trimmedPin === MASTER_ADMIN_PIN ? 'admin' : user.role,
        lastLoginAt: Date.now()
      };
      setCurrentUser(updatedUser);
      setIsGuest(false);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      localStorage.removeItem(AUTH_GUEST_KEY);
      localStorage.setItem('hbs_portal_auth', 'true');
      return true;
    }
    return false;
  }, [users]);

  // Login with Master Admin PIN
  const loginWithAdminMaster = useCallback((pin: string): boolean => {
    if (pin.trim() === MASTER_ADMIN_PIN) {
      const adminUser: PortalUser = {
        id: 'master-admin',
        name: 'Schulleitung / Admin',
        pin: MASTER_ADMIN_PIN,
        role: 'admin',
        active: true,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      };
      setCurrentUser(adminUser);
      setIsGuest(false);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(adminUser));
      localStorage.removeItem(AUTH_GUEST_KEY);
      localStorage.setItem('hbs_portal_auth', 'true');
      return true;
    }
    return false;
  }, []);

  // Guest login (e.g. Smartboard mode)
  const loginAsGuest = useCallback(() => {
    setCurrentUser(null);
    setIsGuest(true);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.setItem(AUTH_GUEST_KEY, 'true');
    localStorage.setItem('hbs_portal_auth', 'true');
  }, []);

  // Logout
  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsGuest(false);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_GUEST_KEY);
    localStorage.removeItem('hbs_portal_auth');
    localStorage.removeItem('hbs_portal_auth_timestamp');
    sessionStorage.removeItem('hbs_portal_auth');
  }, []);

  // Admin: Save updated users list to cloud
  const saveUsersList = useCallback(async (newUsers: PortalUser[]) => {
    setUsers(newUsers);
    const cloudData = await loadPortalDataFromCloud();
    cloudData.users = newUsers;
    await savePortalDataToCloud(cloudData);
  }, []);

  // Admin: Sync with Vertretungsstatistik
  const syncWithVertretungsstatistik = useCallback(async () => {
    const res = await syncTeachersFromVertretungsstatistik();
    const updated = await loadPortalDataFromCloud();
    setUsers(updated.users);
    return res;
  }, []);

  // Reorder apps for current user
  const updateAppOrder = useCallback(async (newOrder: string[]) => {
    if (!currentUser) return;
    const currentPref = allPreferences[currentUser.id] || {
      userId: currentUser.id,
      appOrder: [],
      favorites: [],
      customApps: [],
      updatedAt: Date.now()
    };
    const updatedPref: UserPreferences = {
      ...currentPref,
      appOrder: newOrder,
      updatedAt: Date.now()
    };

    const newAllPrefs = { ...allPreferences, [currentUser.id]: updatedPref };
    setAllPreferences(newAllPrefs);

    const cloudData = await loadPortalDataFromCloud();
    cloudData.preferences = newAllPrefs;
    await savePortalDataToCloud(cloudData);
  }, [currentUser, allPreferences]);

  // Add custom link / app for current user
  const addCustomApp = useCallback(async (appData: Omit<CustomUserApp, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const currentPref = allPreferences[currentUser.id] || {
      userId: currentUser.id,
      appOrder: [],
      favorites: [],
      customApps: [],
      updatedAt: Date.now()
    };
    const newCustomApp: CustomUserApp = {
      ...appData,
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now()
    };
    const updatedCustomApps = [...(currentPref.customApps || []), newCustomApp];
    const updatedPref: UserPreferences = {
      ...currentPref,
      customApps: updatedCustomApps,
      appOrder: currentPref.appOrder ? [...currentPref.appOrder, newCustomApp.id] : [newCustomApp.id],
      updatedAt: Date.now()
    };

    const newAllPrefs = { ...allPreferences, [currentUser.id]: updatedPref };
    setAllPreferences(newAllPrefs);

    const cloudData = await loadPortalDataFromCloud();
    cloudData.preferences = newAllPrefs;
    await savePortalDataToCloud(cloudData);
  }, [currentUser, allPreferences]);

  // Remove custom link
  const removeCustomApp = useCallback(async (appId: string) => {
    if (!currentUser) return;
    const currentPref = allPreferences[currentUser.id];
    if (!currentPref) return;

    const updatedCustomApps = (currentPref.customApps || []).filter(a => a.id !== appId);
    const updatedOrder = (currentPref.appOrder || []).filter(id => id !== appId);
    const updatedPref: UserPreferences = {
      ...currentPref,
      customApps: updatedCustomApps,
      appOrder: updatedOrder,
      updatedAt: Date.now()
    };

    const newAllPrefs = { ...allPreferences, [currentUser.id]: updatedPref };
    setAllPreferences(newAllPrefs);

    const cloudData = await loadPortalDataFromCloud();
    cloudData.preferences = newAllPrefs;
    await savePortalDataToCloud(cloudData);
  }, [currentUser, allPreferences]);

  // Save current blackboard state
  const saveBoardTemplate = useCallback(async (
    title: string, 
    screen: BoardScreen, 
    isSchoolTemplate: boolean,
    metadata?: {
      description?: string;
      subject?: string;
      grade?: string;
      isSubstitution?: boolean;
      substitutionClass?: string;
      substitutionNotes?: string;
      targetDate?: string;
    }
  ): Promise<SavedBoardTemplate> => {
    const authorId = currentUser ? currentUser.id : 'guest';
    const authorName = currentUser ? currentUser.name : 'Gast';

    const newTemplate: SavedBoardTemplate = {
      id: `board-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      description: metadata?.description,
      subject: metadata?.subject,
      grade: metadata?.grade,
      isSubstitution: metadata?.isSubstitution,
      substitutionClass: metadata?.substitutionClass,
      substitutionNotes: metadata?.substitutionNotes,
      targetDate: metadata?.targetDate,
      authorId,
      authorName,
      isSchoolTemplate,
      screen: JSON.parse(JSON.stringify(screen)),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedTemplates = [newTemplate, ...boardTemplates];
    setBoardTemplates(updatedTemplates);

    const cloudData = await loadPortalDataFromCloud();
    cloudData.boardTemplates = updatedTemplates;
    await savePortalDataToCloud(cloudData);

    return newTemplate;
  }, [currentUser, boardTemplates]);

  // Delete saved board template
  const deleteBoardTemplate = useCallback(async (templateId: string) => {
    const updatedTemplates = boardTemplates.filter(t => t.id !== templateId);
    setBoardTemplates(updatedTemplates);

    const cloudData = await loadPortalDataFromCloud();
    cloudData.boardTemplates = updatedTemplates;
    await savePortalDataToCloud(cloudData);
  }, [boardTemplates]);

  // Menti Presentations Actions
  const saveMentiPresentation = useCallback(async (presentation: MentiPresentation): Promise<MentiPresentation> => {
    const existingIndex = mentiPresentations.findIndex(p => p.id === presentation.id);
    const now = Date.now();
    const presentationToSave: MentiPresentation = {
      ...presentation,
      updatedAt: now,
      authorId: presentation.authorId || currentUser?.id || 'guest',
      authorName: presentation.authorName || currentUser?.name || 'Kollege'
    };

    let updatedList: MentiPresentation[];
    if (existingIndex >= 0) {
      updatedList = [...mentiPresentations];
      updatedList[existingIndex] = presentationToSave;
    } else {
      updatedList = [presentationToSave, ...mentiPresentations];
    }

    setMentiPresentations(updatedList);
    const cloudData = await loadPortalDataFromCloud();
    cloudData.mentiPresentations = updatedList;
    await savePortalDataToCloud(cloudData);
    return presentationToSave;
  }, [currentUser, mentiPresentations]);

  const deleteMentiPresentation = useCallback(async (id: string) => {
    const updated = mentiPresentations.filter(p => p.id !== id);
    setMentiPresentations(updated);
    const cloudData = await loadPortalDataFromCloud();
    cloudData.mentiPresentations = updated;
    await savePortalDataToCloud(cloudData);
  }, [mentiPresentations]);

  const toggleShareMentiPresentation = useCallback(async (id: string) => {
    const updated = mentiPresentations.map(p => {
      if (p.id === id) {
        return { ...p, isShared: !p.isShared, updatedAt: Date.now() };
      }
      return p;
    });
    setMentiPresentations(updated);
    const cloudData = await loadPortalDataFromCloud();
    cloudData.mentiPresentations = updated;
    await savePortalDataToCloud(cloudData);
  }, [mentiPresentations]);

  const duplicateMentiPresentation = useCallback(async (id: string): Promise<MentiPresentation> => {
    const orig = mentiPresentations.find(p => p.id === id);
    const newPresentation: MentiPresentation = orig ? {
      ...orig,
      id: `menti-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `${orig.title} (Kopie)`,
      authorId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Kollege',
      isShared: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    } : {
      id: `menti-${Date.now()}`,
      title: 'Neue Präsentation',
      authorId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Kollege',
      isShared: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      slides: []
    };

    const updated = [newPresentation, ...mentiPresentations];
    setMentiPresentations(updated);
    const cloudData = await loadPortalDataFromCloud();
    cloudData.mentiPresentations = updated;
    await savePortalDataToCloud(cloudData);
    return newPresentation;
  }, [currentUser, mentiPresentations]);

  const updateActiveMentiSession = useCallback(async (session: MentiLiveSession | null) => {
    setActiveMentiSession(session);
    const cloudData = await loadPortalDataFromCloud();
    cloudData.activeMentiSession = session;
    await savePortalDataToCloud(cloudData);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        isGuest,
        users,
        isLoading,
        userPreferences,
        boardTemplates,
        mentiPresentations,
        activeMentiSession,
        loginWithUser,
        loginWithAdminMaster,
        loginAsGuest,
        logout,
        saveUsersList,
        syncWithVertretungsstatistik,
        updateAppOrder,
        addCustomApp,
        removeCustomApp,
        saveBoardTemplate,
        deleteBoardTemplate,
        saveMentiPresentation,
        deleteMentiPresentation,
        toggleShareMentiPresentation,
        duplicateMentiPresentation,
        updateActiveMentiSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
