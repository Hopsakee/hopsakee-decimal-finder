import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileImport } from '@/components/FileImport';
import { SystemSelector } from '@/components/SystemSelector';
import { SearchInput } from '@/components/SearchInput';
import { SearchResults } from '@/components/SearchResults';
import { SystemTree } from '@/components/SystemTree';
import { HelpDialog } from '@/components/HelpDialog';
import { GitHubSettings } from '@/components/GitHubSettings';
import { SyncStatus } from '@/components/SyncStatus';
import { useJohnnyDecimal } from '@/hooks/useJohnnyDecimal';
import { searchSystem } from '@/lib/bm25';
import { validateSystem, MAX_FILE_SIZE } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [query, setQuery] = useState('');
  const [focusIndex, setFocusIndex] = useState(-1);
  const resultsRef = useRef<{ focus: () => void }>(null);
  const { toast } = useToast();
  
  const {
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
    githubConfig,
    isGitHubConfigured,
    setGitHubConfig,
    clearGitHubConfig,
    syncState,
    lastSynced,
    syncError,
    pullFromGitHub,
    pushToGitHub
  } = useJohnnyDecimal();

  // Sort systems alphabetically and create index mapping
  const sortedSystemsMap = useMemo(() => {
    return systems
      .map((system, originalIndex) => ({ name: system.name, originalIndex }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [systems]);

  // Keyboard shortcuts: 1-9 to switch systems (alphabetical order)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isEditing) {
        return;
      }
      
      // Check for number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key, 10);
        if (num <= sortedSystemsMap.length) {
          e.preventDefault();
          const targetSystem = sortedSystemsMap[num - 1];
          setActiveSystemIndex(targetSystem.originalIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedSystemsMap, setActiveSystemIndex]);

  const results = useMemo(() => {
    if (!activeSystem || !query.trim()) return [];
    return searchSystem(activeSystem, query);
  }, [activeSystem, query]);

  // Reset focus when results change
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setFocusIndex(-1);
  }, []);

  const handleArrowDown = useCallback(() => {
    if (results.length > 0) {
      setFocusIndex(0);
      resultsRef.current?.focus();
    }
  }, [results.length]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight mb-1">Johnny Decimal Finder</h1>
            <p className="text-muted-foreground text-sm">Find where to file things fast</p>
          </div>
          <div className="flex items-center gap-1">
            <SyncStatus
              state={syncState}
              lastSynced={lastSynced}
              error={syncError}
              isConfigured={isGitHubConfigured}
              onPull={pullFromGitHub}
              onPush={pushToGitHub}
            />
            <GitHubSettings
              config={githubConfig}
              onSave={setGitHubConfig}
              onClear={clearGitHubConfig}
            />
            <HelpDialog onClearData={clearAllData} />
          </div>
        </header>

        {systems.length === 0 ? (
          <FileImport onImport={loadSystem} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <SystemSelector
                systems={systems}
                activeIndex={activeSystemIndex}
                onSelect={setActiveSystemIndex}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    Add system
                    <input
                      type="file"
                      accept=".json"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > MAX_FILE_SIZE) {
                            toast({
                              title: 'File too large',
                              description: 'Maximum file size is 5MB',
                              variant: 'destructive'
                            });
                            e.target.value = '';
                            return;
                          }
                          file.text().then(text => {
                            try {
                              const data = JSON.parse(text);
                              const result = validateSystem(data);
                              if (result.success) {
                                loadSystem(result.data);
                                toast({
                                  title: 'System loaded',
                                  description: `"${result.data.name}" added`
                                });
                              } else {
                                toast({
                                  title: 'Invalid file format',
                                  description: result.error,
                                  variant: 'destructive'
                                });
                              }
                            } catch {
                              toast({
                                title: 'Import failed',
                                description: 'Invalid JSON file',
                                variant: 'destructive'
                              });
                            }
                          });
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </Button>
                <Button variant="outline" size="sm" onClick={exportSystem}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            <SearchInput 
              value={query} 
              onChange={handleQueryChange}
              onArrowDown={handleArrowDown}
            />

            {query.trim() ? (
              results.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No matches found. Try different terms or add tags to your categories.
                </p>
              ) : (
                <SearchResults
                  ref={resultsRef}
                  results={results}
                  focusIndex={focusIndex}
                  systemName={activeSystem?.name}
                  onFocusChange={setFocusIndex}
                  onUpdateArea={updateArea}
                  onUpdateCategory={updateCategory}
                  onAddCategory={addCategory}
                  onRemoveCategory={removeCategory}
                  onAddItem={addItem}
                  onUpdateItem={updateItem}
                  onRemoveItem={removeItem}
                />
              )
            ) : (
              <SystemTree
                system={activeSystem}
                onUpdateArea={updateArea}
                onUpdateCategory={updateCategory}
                onAddCategory={addCategory}
                onRemoveCategory={removeCategory}
                onAddItem={addItem}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
