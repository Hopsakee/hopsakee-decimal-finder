export interface GitHubConfig {
  owner: string;
  repo: string;
  path: string;
  token: string;
}

export interface SyncData {
  version: number;
  lastModified: string;
  activeSystemIndex: number;
  systems: unknown[];
}

interface GitHubFileResponse {
  content: string;
  sha: string;
  encoding: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

// Store SHA in memory for updates
let currentSha: string | null = null;

export function getSha(): string | null {
  return currentSha;
}

export function setSha(sha: string | null): void {
  currentSha = sha;
}

export async function fetchFromGitHub(config: GitHubConfig): Promise<{ data: SyncData; sha: string }> {
  const { owner, repo, path, token } = config;
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (response.status === 404) {
    // File doesn't exist yet - return empty data
    return {
      data: {
        version: 1,
        lastModified: new Date().toISOString(),
        activeSystemIndex: 0,
        systems: []
      },
      sha: ''
    };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  const fileData: GitHubFileResponse = await response.json();
  
  // Decode base64 content (handles Unicode/UTF-8)
  const binaryString = atob(fileData.content.replace(/\n/g, ''));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const content = new TextDecoder().decode(bytes);
  const data: SyncData = JSON.parse(content);
  
  currentSha = fileData.sha;
  
  return { data, sha: fileData.sha };
}

// Helper to encode string to base64 (handles Unicode)
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function pushToGitHub(
  config: GitHubConfig, 
  data: SyncData,
  message: string = 'Update Johnny Decimal data'
): Promise<{ sha: string }> {
  const { owner, repo, path, token } = config;
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  // Encode content to base64 (using helper for Unicode support)
  const jsonString = JSON.stringify(data, null, 2);
  const content = utf8ToBase64(jsonString);

  const body: Record<string, string> = {
    message,
    content
  };

  // Include SHA only if updating existing file (not for new files)
  if (currentSha && currentSha !== '') {
    body.sha = currentSha;
  }

  console.log('[GitHub Sync] Pushing to:', url, 'SHA:', currentSha || '(new file)');

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[GitHub Sync] Push failed:', response.status, error);
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  const result = await response.json();
  currentSha = result.content.sha;
  console.log('[GitHub Sync] Push successful, new SHA:', currentSha);
  
  return { sha: result.content.sha };
}

export async function validateConfig(config: GitHubConfig): Promise<{ valid: boolean; error?: string }> {
  const { owner, repo, token } = config;
  
  if (!owner || !repo || !token) {
    return { valid: false, error: 'Missing required fields' };
  }

  try {
    // Test connection by getting repo info
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (response.status === 401) {
      return { valid: false, error: 'Invalid token or token expired' };
    }

    if (response.status === 404) {
      return { valid: false, error: 'Repository not found or no access' };
    }

    if (!response.ok) {
      return { valid: false, error: `GitHub API error: ${response.status}` };
    }

    const repoData = await response.json();
    
    // Check if we have push access
    if (!repoData.permissions?.push) {
      return { valid: false, error: 'Token does not have write access to this repository' };
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
}
