import { useState } from 'react';
import { Settings, ExternalLink, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { validateConfig, type GitHubConfig } from '@/lib/githubSync';

interface GitHubSettingsProps {
  config: GitHubConfig;
  onSave: (config: Partial<GitHubConfig>) => void;
  onClear: () => void;
}

export function GitHubSettings({ config, onSave, onClear }: GitHubSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLocalConfig(config);
      setTestResult(null);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await validateConfig(localConfig);
      setTestResult(result);
    } catch {
      setTestResult({ valid: false, error: 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(localConfig);
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setLocalConfig({
      owner: '',
      repo: '',
      path: 'johnny-decimal-data.json',
      token: ''
    });
    setTestResult(null);
  };

  const isConfigured = !!(config.owner && config.repo && config.token);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">GitHub Sync Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>GitHub Sync Settings</DialogTitle>
          <DialogDescription>
            Sync your Johnny Decimal data with a private GitHub repository.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="owner">GitHub Username</Label>
            <Input
              id="owner"
              value={localConfig.owner}
              onChange={e => setLocalConfig(prev => ({ ...prev, owner: e.target.value }))}
              placeholder="your-username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo">Repository Name</Label>
            <Input
              id="repo"
              value={localConfig.repo}
              onChange={e => setLocalConfig(prev => ({ ...prev, repo: e.target.value }))}
              placeholder="my-jd-data"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="path">File Path</Label>
            <Input
              id="path"
              value={localConfig.path}
              onChange={e => setLocalConfig(prev => ({ ...prev, path: e.target.value }))}
              placeholder="johnny-decimal-data.json"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">
              Personal Access Token
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center text-xs text-muted-foreground hover:text-primary"
              >
                Create token <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Label>
            <Input
              id="token"
              type="password"
              value={localConfig.token}
              onChange={e => setLocalConfig(prev => ({ ...prev, token: e.target.value }))}
              placeholder="github_pat_..."
            />
            <p className="text-xs text-muted-foreground">
              Create a fine-grained token with read/write access to Contents for your repository.
            </p>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult.valid ? 'text-green-600' : 'text-destructive'}`}>
              {testResult.valid ? (
                <>
                  <Check className="h-4 w-4" />
                  Connection successful!
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  {testResult.error}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <div>
            {isConfigured && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive">
                Disconnect
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTest} disabled={testing || !localConfig.owner || !localConfig.repo || !localConfig.token}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Connection
            </Button>
            <Button onClick={handleSave} disabled={!localConfig.owner || !localConfig.repo || !localConfig.token}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
