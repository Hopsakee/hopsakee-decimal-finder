import { useState, useCallback, useEffect } from 'react';
import type { GitHubConfig } from '@/lib/githubSync';

const GITHUB_CONFIG_KEY = 'johnny-decimal-github-config';

const DEFAULT_CONFIG: GitHubConfig = {
  owner: '',
  repo: '',
  path: 'johnny-decimal-data.json',
  token: ''
};

export function useGitHubConfig() {
  const [config, setConfigState] = useState<GitHubConfig>(() => {
    try {
      const stored = localStorage.getItem(GITHUB_CONFIG_KEY);
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if all required fields are filled
    const configured = !!(config.owner && config.repo && config.token);
    setIsConfigured(configured);
  }, [config]);

  const setConfig = useCallback((newConfig: Partial<GitHubConfig>) => {
    setConfigState(prev => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save GitHub config:', e);
      }
      return updated;
    });
  }, []);

  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(GITHUB_CONFIG_KEY);
    } catch (e) {
      console.warn('Failed to clear GitHub config:', e);
    }
    setConfigState(DEFAULT_CONFIG);
  }, []);

  return {
    config,
    isConfigured,
    setConfig,
    clearConfig
  };
}
