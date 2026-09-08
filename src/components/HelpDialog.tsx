import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";

interface HelpDialogProps {
  onClearData?: () => void;
}

export function HelpDialog({ onClearData }: HelpDialogProps) {
  const [open, setOpen] = useState(false);

  // Open help dialog with ? key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (e.key === '?' && !isEditing) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const exampleJson = `{
  "name": "d1-Work",
  "areas": [
    {
      "id": "10-19",
      "name": "Administration",
      "description": "Company admin tasks",
      "tags": ["hr", "legal"],
      "categories": [
        {
          "id": "11",
          "name": "HR Documents",
          "description": "Employee records",
          "tags": ["employees"],
          "items": [
            { "id": "d1.11.01", "name": "Contracts" },
            { "id": "d1.11.02", "name": "Policies" }
          ]
        }
      ]
    }
  ]
}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Help (?)">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Johnny Decimal Finder - Help</DialogTitle>
          <DialogDescription>
            A fast, privacy-first tool for your Johnny Decimal filing systems
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">What is Johnny Decimal?</h3>
              <p className="text-muted-foreground">
                Johnny Decimal is a system to organize your files, notes, and life. It uses a simple 
                numbering scheme: Areas (10-19, 20-29, etc.) contain Categories (11, 12, 21, 22, etc.), 
                which contain Items (11.01, 11.02, etc.).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">How to Use This App</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Import your Johnny Decimal system as a JSON file</li>
                <li>Type in the search box to find areas, categories, and items</li>
                <li>Browse the tree view when search is empty</li>
                <li>Click on a category to edit descriptions, tags, and items</li>
                <li>Export your updated system to save changes</li>
                <li>Switch between multiple systems (Work, Home, etc.)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Navigation</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">/</kbd> Focus search</li>
                    <li><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">?</kbd> Open this help</li>
                    <li><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">1</kbd>-<kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">9</kbd> Switch to system 1-9 (alphabetical order)</li>
                    <li><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↓</kbd> Navigate search results</li>
                    <li><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> Expand result / focus description</li>
                    <li><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> Clear search / close editor / blur field</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">In Description Fields</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li><code className="px-1 bg-muted rounded text-xs">#tag</code> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Space</kbd> Add a tag</li>
                    <li><code className="px-1 bg-muted rounded text-xs">Name [XX]</code> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> Add category (in area) or item (in category)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Quick-Add via Description</h3>
              <p className="text-muted-foreground mb-2">
                Add categories or items by typing directly in a description field:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Add category:</strong> In an area description, type <code className="px-1 bg-muted rounded text-xs">Python [52]</code> + Enter → creates category "52 Python"</li>
                <li><strong>Add item:</strong> In a category description, type <code className="px-1 bg-muted rounded text-xs">Router [03]</code> + Enter → creates item with full ID</li>
              </ul>
              <p className="text-muted-foreground mt-2 text-xs">
                The ID is built automatically: for items, from system prefix + category ID + number. 
                For categories, the two-digit number becomes the category ID.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">JSON File Format</h3>
              <p className="text-muted-foreground mb-2">
                Your JSON file should follow this structure:
              </p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                {exampleJson}
              </pre>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Field Descriptions</h3>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li><strong>name</strong>: System name, optionally prefixed (e.g., "d1-Work")</li>
                <li><strong>areas</strong>: Array of area objects (10-19, 20-29, etc.)</li>
                <li><strong>areas[].id</strong>: Area range like "10-19", "20-29"</li>
                <li><strong>areas[].name</strong>: Human-readable area name</li>
                <li><strong>areas[].description</strong>: Optional description for search</li>
                <li><strong>areas[].tags</strong>: Optional array of tags for search</li>
                <li><strong>categories</strong>: Array of category objects within an area</li>
                <li><strong>categories[].id</strong>: Two-digit ID like "11", "12"</li>
                <li><strong>categories[].name</strong>: Human-readable category name</li>
                <li><strong>categories[].description</strong>: Optional description</li>
                <li><strong>categories[].tags</strong>: Optional array of tags</li>
                <li><strong>categories[].items</strong>: Optional array of items</li>
                <li><strong>items[].id</strong>: Full ID like "d1.11.01"</li>
                <li><strong>items[].name</strong>: Item name</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Tips</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Add descriptive tags to make items easier to find</li>
                <li>Use hashtags in descriptions (#project) to quickly add tags</li>
                <li>Export regularly to save your changes</li>
                <li>Install as a PWA for offline desktop/mobile use</li>
                <li>Name systems with a prefix (d1-, d2-) for easy keyboard switching</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Privacy & Storage</h3>
              <p className="text-muted-foreground mb-2">
                Your filing system data is stored locally in your browser. It never leaves your device 
                unless you explicitly export it.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
                <li>Data persists until you clear browser storage</li>
                <li>On shared devices, others could view your data</li>
                <li>Consider exporting sensitive systems when not in use</li>
              </ul>
              {onClearData && (
                <div className="mt-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your stored systems and cannot be undone. 
                          Make sure to export your data first if you want to keep it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onClearData}>
                          Clear All Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
