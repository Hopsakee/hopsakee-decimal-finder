import { useState, useCallback, useEffect, useRef } from 'react';
import type { JohnnyDecimalSystem, Area, Category, Item } from '@/types/johnnyDecimal';
import { useGitHubConfig } from './useGitHubConfig';
import { fetchFromGitHub, pushToGitHub, setSha, type SyncData } from '@/lib/githubSync';
import type { SyncState } from '@/components/SyncStatus';

const STORAGE_KEY = 'johnny-decimal-systems';
const ACTIVE_INDEX_KEY = 'johnny-decimal-active-index';

function loadFromStorage(): { systems: JohnnyDecimalSystem[]; activeIndex: number } {
  try {
    const systemsData = localStorage.getItem(STORAGE_KEY);
    const activeIndexData = localStorage.getItem(ACTIVE_INDEX_KEY);
    return {
      systems: systemsData ? JSON.parse(systemsData) : [],
      activeIndex: activeIndexData ? parseInt(activeIndexData, 10) : 0
    };
  } catch {
    return { systems: [], activeIndex: 0 };
  }
}

export function useJohnnyDecimal() {
  const [systems, setSystems] = useState<JohnnyDecimalSystem[]>(() => loadFromStorage().systems);
  const [activeSystemIndex, setActiveSystemIndex] = useState(() => loadFromStorage().activeIndex);
  
  // Sync state
  const { config, isConfigured, setConfig, clearConfig } = useGitHubConfig();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const initialSyncDone = useRef(false);
  const hasLocalChanges = useRef(false);

  const activeSystem = systems[activeSystemIndex] || null;

  // Persist systems to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(systems));
      // Mark that we have local changes (unless this is from initial sync)
      if (initialSyncDone.current && isConfigured) {
        hasLocalChanges.current = true;
        setSyncState('pending');
      }
    } catch (e) {
      console.warn('Failed to save systems to localStorage:', e);
    }
  }, [systems, isConfigured]);

  // Persist active index to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_INDEX_KEY, String(activeSystemIndex));
    } catch (e) {
      console.warn('Failed to save active index to localStorage:', e);
    }
  }, [activeSystemIndex]);

  // Pull from GitHub
  const pullFromGitHub = useCallback(async () => {
    if (!isConfigured) return;
    
    setSyncState('syncing');
    setSyncError(null);
    
    try {
      const { data } = await fetchFromGitHub(config);
      
      if (data.systems && data.systems.length > 0) {
        setSystems(data.systems as JohnnyDecimalSystem[]);
        setActiveSystemIndex(data.activeSystemIndex || 0);
      }
      
      setLastSynced(new Date());
      hasLocalChanges.current = false;
      setSyncState('synced');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pull failed';
      setSyncError(message);
      setSyncState('error');
    }
  }, [config, isConfigured]);

  // Push to GitHub
  const pushToGitHubFn = useCallback(async () => {
    if (!isConfigured) return;
    
    setSyncState('syncing');
    setSyncError(null);
    
    try {
      const data: SyncData = {
        version: 1,
        lastModified: new Date().toISOString(),
        activeSystemIndex,
        systems
      };
      
      await pushToGitHub(config, data);
      
      setLastSynced(new Date());
      hasLocalChanges.current = false;
      setSyncState('synced');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Push failed';
      setSyncError(message);
      setSyncState('error');
    }
  }, [config, isConfigured, systems, activeSystemIndex]);

  // Auto-sync on first load
  useEffect(() => {
    if (isConfigured && !initialSyncDone.current) {
      initialSyncDone.current = true;
      pullFromGitHub();
    }
  }, [isConfigured, pullFromGitHub]);

  // Reset sync state when config changes
  useEffect(() => {
    if (!isConfigured) {
      setSyncState('idle');
      setLastSynced(null);
      setSyncError(null);
      setSha(null);
      initialSyncDone.current = false;
    }
  }, [isConfigured]);

  const loadSystem = useCallback((system: JohnnyDecimalSystem) => {
    setSystems(prev => {
      const existingIndex = prev.findIndex(s => s.name === system.name);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = system;
        return updated;
      }
      return [...prev, system];
    });
  }, []);

  const updateArea = useCallback((areaId: string, updates: Partial<Pick<Area, 'name' | 'description' | 'tags'>>) => {
    setSystems(prev => prev.map((system, idx) => {
      if (idx !== activeSystemIndex) return system;
      return {
        ...system,
        areas: system.areas.map(area => 
          area.id === areaId ? { ...area, ...updates } : area
        )
      };
    }));
  }, [activeSystemIndex]);

  const updateCategory = useCallback((areaId: string, categoryId: string, updates: Partial<Pick<Category, 'name' | 'description' | 'tags' | 'items'>>) => {
    setSystems(prev => prev.map((system, idx) => {
      if (idx !== activeSystemIndex) return system;
      return {
        ...system,
        areas: system.areas.map(area => {
          if (area.id !== areaId) return area;
          return {
            ...area,
            categories: area.categories.map(cat =>
              cat.id === categoryId ? { ...cat, ...updates } : cat
            )
          };
        })
      };
    }));
  }, [activeSystemIndex]);

  const addCategory = useCallback((areaId: string, category: Category) => {
    setSystems(prev => prev.map((system, idx) => {
      if (idx !== activeSystemIndex) return system;
      return {
        ...system,
        areas: system.areas.map(area => {
          if (area.id !== areaId) return area;
          // Insert category in sorted order by ID
          const categories = [...area.categories, category].sort((a, b) => a.id.localeCompare(b.id));
          return { ...area, categories };
        })
      };
    }));
  }, [activeSystemIndex]);

  const removeCategory = useCallback((areaId: string, categoryId: string) => {
    setSystems(prev => prev.map((system, idx) => {
      if (idx !== activeSystemIndex) return system;
      return {
        ...system,
        areas: system.areas.map(area => {
          if (area.id !== areaId) return area;
          return {
            ...area,
            categories: area.categories.filter(cat => cat.id !== categoryId)
          };
        })
      };
    }));
  }, [activeSystemIndex]);

  const addItem = useCallback((areaId: string, categoryId: string, item: Item) => {
    setSystems(prev => prev.map((system, idx) => {
      if (idx !== activeSystemIndex) return system;
      return {
        ...system,
        areas: system.areas.map(area => {
          if (area.id !== areaId) return area;
          return {
            ...area,
            categories: area.categories.map(cat => {
              if (cat.id !== categoryId) return cat;
              const items = cat.items || [];
              return { ...cat, items: [...items, item] };
            })
          };
        })
      };
    }));
  }, [activeSystemIndex]);

  const updateItem = useCallback((areaId: string, categoryId: string, itemId: string, updates: Partial<Item>) => {
    setSystems(prev => prev.map((system, idx) => {
      if (idx !== activeSystemIndex) return system;
      return {
        ...system,
        areas: system.areas.map(area => {
          if (area.id !== areaId) return area;
          return {
            ...area,
            categories: area.categories.map(cat => {
              if (cat.id !== categoryId) return cat;
              return {
                ...cat,
                items: (cat.items || []).map(item =>
                  item.id === itemId ? { ...item, ...updates } : item
                )
              };
            })
          };
        })
      };
    }));
  }, [activeSystemIndex]);

  const removeItem = useCallback((areaId: string, categoryId: string, itemId: string) => {
    setSystems(prev => prev.map((system, idx) => {
      if (idx !== activeSystemIndex) return system;
      return {
        ...system,
        areas: system.areas.map(area => {
          if (area.id !== areaId) return area;
          return {
            ...area,
            categories: area.categories.map(cat => {
              if (cat.id !== categoryId) return cat;
              return {
                ...cat,
                items: (cat.items || []).filter(item => item.id !== itemId)
              };
            })
          };
        })
      };
    }));
  }, [activeSystemIndex]);

  const exportSystem = useCallback(() => {
    if (!activeSystem) return;
    const blob = new Blob([JSON.stringify(activeSystem, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeSystem.name}.json`;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [activeSystem]);

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_INDEX_KEY);
    setSystems([]);
    setActiveSystemIndex(0);
  }, []);

  return {
    systems,
    activeSystem,
    activeSystemIndex,
    setActiveSystemIndex,
    loadSystem,
    updateArea,
    updateCategory,
    addCategory,
    removeCategory,
    addItem,
    updateItem,
    removeItem,
    exportSystem,
    clearAllData,
    // GitHub sync
    githubConfig: config,
    isGitHubConfigured: isConfigured,
    setGitHubConfig: setConfig,
    clearGitHubConfig: clearConfig,
    syncState,
    lastSynced,
    syncError,
    pullFromGitHub,
    pushToGitHub: pushToGitHubFn
  };
}
