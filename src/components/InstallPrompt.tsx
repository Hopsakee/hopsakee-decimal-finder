import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-card border border-border rounded-lg p-3 shadow-lg animate-in slide-in-from-bottom-4">
      <Download className="h-5 w-5 text-primary" />
      <span className="text-sm text-foreground">Install app for offline use</span>
      <Button size="sm" onClick={handleInstall}>
        Install
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDismiss} className="p-1 h-auto">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
