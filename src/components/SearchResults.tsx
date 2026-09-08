import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ChevronRight, Folder, FileText, X, Pencil } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/TagInput';
import { ItemList } from '@/components/ItemList';
import { useDescriptionKeyboard, useContainerNavigation, useInputKeyboard, extractSystemPrefix } from '@/hooks/useKeyboardHandlers';
import type { SearchResult, Area, Category, Item } from '@/types/johnnyDecimal';

interface SearchResultsProps {
  results: SearchResult[];
  focusIndex: number;
  systemName?: string;
  onFocusChange: (index: number) => void;
  onUpdateArea: (areaId: string, updates: Partial<Pick<Area, 'name' | 'description' | 'tags'>>) => void;
  onUpdateCategory: (areaId: string, categoryId: string, updates: Partial<Pick<Category, 'name' | 'description' | 'tags'>>) => void;
  onAddCategory: (areaId: string, category: Category) => void;
  onRemoveCategory: (areaId: string, categoryId: string) => void;
  onAddItem: (areaId: string, categoryId: string, item: Item) => void;
  onUpdateItem: (areaId: string, categoryId: string, itemId: string, updates: Partial<Item>) => void;
  onRemoveItem: (areaId: string, categoryId: string, itemId: string) => void;
}

export interface SearchResultsRef {
  focus: () => void;
}

function HighlightText({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;

  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        terms.some(t => part.toLowerCase().includes(t.toLowerCase()))
          ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  );
}

// Description textarea component with shared keyboard handling
function ResultDescriptionTextarea({
  result,
  systemName,
  containerRef,
  descriptionRef,
  onUpdateArea,
  onUpdateCategory,
  onAddCategory,
  onAddItem,
}: {
  result: SearchResult;
  systemName?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  descriptionRef: (el: HTMLTextAreaElement | null) => void;
  onUpdateArea: (areaId: string, updates: Partial<Pick<Area, 'description' | 'tags'>>) => void;
  onUpdateCategory: (areaId: string, categoryId: string, updates: Partial<Pick<Category, 'description' | 'tags'>>) => void;
  onAddCategory: (areaId: string, category: Category) => void;
  onAddItem: (areaId: string, categoryId: string, item: Item) => void;
}) {
  const isCategory = result.type === 'category';
  const isArea = result.type === 'area';
  const systemPrefix = systemName ? extractSystemPrefix(systemName) : '';
  const currentTags = isCategory ? result.category!.tags : result.area.tags;
  const currentValue = isCategory ? result.category!.description : result.area.description;

  const { handleKeyDown } = useDescriptionKeyboard({
    onEscape: () => containerRef.current?.focus(),
    onAddItem: isCategory
      ? (item) => onAddItem(result.area.id, result.category!.id, item)
      : undefined,
    onAddCategory: isArea
      ? (category) => onAddCategory(result.area.id, category)
      : undefined,
    onUpdateDescription: (value) => {
      if (isCategory) {
        onUpdateCategory(result.area.id, result.category!.id, { description: value });
      } else {
        onUpdateArea(result.area.id, { description: value });
      }
    },
    onAddTag: (tag, newTags) => {
      if (isCategory) {
        onUpdateCategory(result.area.id, result.category!.id, { tags: newTags });
      } else {
        onUpdateArea(result.area.id, { tags: newTags });
      }
    },
    systemPrefix,
    categoryId: isCategory ? result.category!.id : '',
    areaId: isArea ? result.area.id : '',
    currentTags,
    isCategory,
    isArea,
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isCategory) {
      onUpdateCategory(result.area.id, result.category!.id, { description: e.target.value });
    } else {
      onUpdateArea(result.area.id, { description: e.target.value });
    }
  };

  return (
    <Textarea
      ref={descriptionRef}
      value={currentValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={isCategory
        ? "Add a description... (use #tag to add tags, 'Name [XX]' + Enter to add item)"
        : "Add a description... (use #tag to add tags, 'Name [XX]' + Enter to add category)"
      }
      className="min-h-[60px] text-sm"
    />
  );
}

export const SearchResults = forwardRef<SearchResultsRef, SearchResultsProps>(({
  results,
  focusIndex,
  systemName,
  onFocusChange,
  onUpdateArea,
  onUpdateCategory,
  onAddCategory,
  onRemoveCategory,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}, ref) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const descriptionRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // Rename handlers - use :: as delimiter since IDs may contain dashes
  const startRename = (result: SearchResult) => {
    const id = result.type === 'area' 
      ? `area::${result.area.id}` 
      : `cat::${result.area.id}::${result.category!.id}`;
    setRenamingId(id);
    setRenameValue(result.type === 'area' ? result.area.name : result.category!.name);
  };

  const saveRename = () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      setRenameValue('');
      return;
    }
    
    if (renamingId.startsWith('area::')) {
      const areaId = renamingId.replace('area::', '');
      onUpdateArea(areaId, { name: renameValue.trim() });
    } else if (renamingId.startsWith('cat::')) {
      const parts = renamingId.split('::');
      const areaId = parts[1];
      const categoryId = parts[2];
      onUpdateCategory(areaId, categoryId, { name: renameValue.trim() });
    }
    
    setRenamingId(null);
    setRenameValue('');
  };

  const { handleKeyDown: renameKeyDown } = useInputKeyboard({
    onSubmit: saveRename,
    onCancel: () => {
      setRenamingId(null);
      setRenameValue('');
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => containerRef.current?.focus(),
  }));

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIndex]);

  const getItemId = useCallback((index: number) => {
    const result = results[index];
    return result.type === 'area'
      ? `area-${result.area.id}`
      : `cat-${result.area.id}-${result.category!.id}`;
  }, [results]);

  const handleFocusTextarea = useCallback((id: string) => {
    const textarea = descriptionRefs.current.get(id);
    if (textarea) {
      textarea.focus();
    }
  }, []);

  const handleRename = useCallback((index: number) => {
    const result = results[index];
    if (result) startRename(result);
  }, [results]);

  const { handleKeyDown } = useContainerNavigation({
    itemCount: results.length,
    focusIndex,
    onFocusChange,
    expandedId,
    onToggleExpand: setExpandedId,
    getItemId,
    onFocusTextarea: handleFocusTextarea,
    onRename: handleRename,
  });

  if (results.length === 0) return null;

  const systemPrefix = systemName ? extractSystemPrefix(systemName) : undefined;

  return (
    <div
      ref={containerRef}
      className="space-y-2 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {results.map((result, idx) => {
        const id = result.type === 'area'
          ? `area-${result.area.id}`
          : `cat-${result.area.id}-${result.category!.id}`;
        const renameId = result.type === 'area'
          ? `area::${result.area.id}`
          : `cat::${result.area.id}::${result.category!.id}`;
        const isExpanded = expandedId === id;
        const isFocused = focusIndex === idx;
        const isRenaming = renamingId === renameId;

        return (
          <div
            key={id}
            className={`border rounded-lg overflow-hidden bg-card transition-colors group/result ${isFocused ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="flex items-center">
              <button
                ref={el => itemRefs.current[idx] = el}
                onClick={() => setExpandedId(isExpanded ? null : id)}
                className="flex-1 px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
              >
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />

                {result.type === 'area' ? (
                  <Folder className="h-4 w-4 text-primary" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-muted-foreground">
                      {result.type === 'area' ? result.area.id : `${result.area.id} › ${result.category!.id}`}
                    </span>
                    {isRenaming ? (
                      <Input
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={renameKeyDown}
                        onBlur={saveRename}
                        onClick={e => e.stopPropagation()}
                        className="h-6 text-sm font-medium w-40"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium truncate">
                        <HighlightText
                          text={result.type === 'area' ? result.area.name : result.category!.name}
                          terms={result.matchedTerms}
                        />
                      </span>
                    )}
                  </div>
                  {result.type === 'category' && (
                    <div className="text-xs text-muted-foreground truncate">
                      {result.area.name}
                    </div>
                  )}
                </div>

                <span className="text-xs text-muted-foreground">
                  {result.score.toFixed(2)}
                </span>
              </button>
              {!isRenaming && (
                <button
                  onClick={() => startRename(result)}
                  className="opacity-0 group-hover/result:opacity-100 p-2 hover:text-foreground text-muted-foreground transition-opacity"
                  title={`Rename ${result.type}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {result.type === 'category' && (
                <button
                  onClick={() => onRemoveCategory(result.area.id, result.category!.id)}
                  className="opacity-0 group-hover/result:opacity-100 p-2 mr-2 hover:text-destructive text-muted-foreground transition-opacity"
                  title="Delete category"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t bg-muted/30 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Description
                  </label>
                  <ResultDescriptionTextarea
                    result={result}
                    systemName={systemName}
                    containerRef={containerRef as React.RefObject<HTMLDivElement>}
                    descriptionRef={(el) => {
                      if (el) descriptionRefs.current.set(id, el);
                    }}
                    onUpdateArea={onUpdateArea}
                    onUpdateCategory={onUpdateCategory}
                    onAddCategory={onAddCategory}
                    onAddItem={onAddItem}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Tags
                  </label>
                  <TagInput
                    tags={result.type === 'area' ? result.area.tags : result.category!.tags}
                    onChange={tags => {
                      if (result.type === 'area') {
                        onUpdateArea(result.area.id, { tags });
                      } else {
                        onUpdateCategory(result.area.id, result.category!.id, { tags });
                      }
                    }}
                  />
                </div>
                {result.type === 'category' && (
                  <div className="pt-2 border-t" data-item-list-active="true">
                    <ItemList
                      items={result.category!.items || []}
                      categoryId={result.category!.id}
                      systemPrefix={systemPrefix}
                      matchedTerms={result.matchedTerms}
                      onAdd={item => onAddItem(result.area.id, result.category!.id, item)}
                      onUpdate={(itemId, updates) => onUpdateItem(result.area.id, result.category!.id, itemId, updates)}
                      onRemove={itemId => onRemoveItem(result.area.id, result.category!.id, itemId)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
