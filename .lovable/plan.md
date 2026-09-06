

# GitHub Sync Implementation Plan

## Overview

Add two-way sync with a GitHub private repository. Your Johnny Decimal data will be stored as a single JSON file in your own private repo. The app will automatically load the latest version when opened, and you can manually push changes or refresh anytime.

## How It Works

1. **On app load**: Fetch the latest `johnny-decimal-data.json` from your private GitHub repo
2. **Manual save**: Click a "Push to GitHub" button to save your changes
3. **Manual refresh**: Click a "Pull from GitHub" button to fetch latest
4. **Conflict handling**: Last-write-wins (simple for single user)

## Implementation Steps

### Step 1: GitHub Personal Access Token Setup

You'll need to create a GitHub Personal Access Token (PAT) with `repo` scope:
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
2. Create a token with access to your private repo (read/write Contents permission)
3. Store the token in the app's settings (saved to localStorage, encrypted optional)

### Step 2: Create Settings UI for GitHub Configuration

Add a settings panel where you enter:
- GitHub username
- Repository name
- File path (default: `johnny-decimal-data.json`)
- Personal Access Token (stored securely in localStorage)

### Step 3: Create GitHub API Service

Build a simple service to interact with GitHub's Contents API:

```text
┌─────────────────────────────────────────────────────┐
│                  githubSync.ts                      │
├─────────────────────────────────────────────────────┤
│ fetchFromGitHub()                                   │
│   → GET /repos/{owner}/{repo}/contents/{path}       │
│   → Decodes base64 content → returns JSON           │
│   → Stores SHA for updates                          │
├─────────────────────────────────────────────────────┤
│ pushToGitHub(data)                                  │
│   → PUT /repos/{owner}/{repo}/contents/{path}       │
│   → Encodes JSON to base64                          │
│   → Uses stored SHA to update (not create new)      │
├─────────────────────────────────────────────────────┤
│ validateConfig()                                    │
│   → Tests connection with a simple API call         │
└─────────────────────────────────────────────────────┘
```

### Step 4: Add Sync UI Components

Add to the header area:
- **Sync status indicator**: Shows last sync time and status
- **Pull button**: Fetch latest from GitHub
- **Push button**: Save current state to GitHub
- **Settings gear icon**: Opens GitHub configuration modal

### Step 5: Modify useJohnnyDecimal Hook

Extend the hook to:
- Auto-fetch from GitHub on first load (if configured)
- Expose `pullFromGitHub()` and `pushToGitHub()` functions
- Track sync state (synced/pending changes/error)
- Merge localStorage and GitHub data intelligently

### Step 6: Handle Edge Cases

- **No internet**: Fall back to localStorage, show "offline" indicator
- **First sync**: If GitHub file doesn't exist, create it
- **Token expired**: Show clear error message with link to create new token
- **Rate limiting**: GitHub allows 5000 requests/hour (more than enough)

## File Changes Summary

| File | Changes |
|------|---------|
| `src/lib/githubSync.ts` | New file - GitHub API functions |
| `src/hooks/useJohnnyDecimal.ts` | Add sync functions and state |
| `src/hooks/useGitHubConfig.ts` | New file - manage GitHub settings |
| `src/components/GitHubSettings.tsx` | New file - settings modal |
| `src/components/SyncStatus.tsx` | New file - sync indicator + buttons |
| `src/pages/Index.tsx` | Add sync UI to header |

## Security Considerations

- **Token storage**: The GitHub PAT will be stored in localStorage. This is acceptable for a single-user app running on your own devices. The token only has access to the specific repo you configure.
- **HTTPS only**: GitHub API requires HTTPS, which Lovable provides.
- **No server needed**: All sync happens client-side, no secrets on a server.

## Technical Details

### GitHub API Endpoints Used

```text
GET  /repos/{owner}/{repo}/contents/{path}
     → Returns file content (base64) and SHA

PUT  /repos/{owner}/{repo}/contents/{path}
     → Body: { message, content (base64), sha }
     → Creates or updates file
```

### Data Structure in GitHub

The file will contain all your systems:

```json
{
  "version": 1,
  "lastModified": "2026-01-26T10:30:00Z",
  "activeSystemIndex": 0,
  "systems": [
    { "name": "Domain 1", "areas": [...] },
    { "name": "Domain 2", "areas": [...] }
  ]
}
```

## User Experience Flow

1. **First time setup**:
   - Click settings icon → Enter GitHub details → Test connection → Save
   - App creates the JSON file in your repo if it doesn't exist

2. **Daily use**:
   - Open app → Auto-loads latest from GitHub
   - Make edits → Changes saved to localStorage immediately
   - Click "Push" when ready to sync to GitHub
   - Status shows "Synced" or "Pending changes"

3. **Multiple devices**:
   - Device A: Make changes, push to GitHub
   - Device B: Open app (auto-pulls) or click "Pull" → See latest changes

## Alternative: Simple Token Input

For maximum simplicity, we could skip the full settings modal and just have a single input field for the GitHub token, with the repo/path hardcoded or derived from the token's repo access. Let me know if you prefer this simpler approach.

