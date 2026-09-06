import { useState } from 'react';
import { ChevronRight, Folder, FileText, X, Pencil, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/TagInput';
import { ItemList } from '@/components/ItemList';
import { useDescriptionKeyboard, extractSystemPrefix, useInputKeyboard, parseItemPattern } from '@/hooks/useKeyboardHandlers';
import type { JohnnyDecimalSystem, Area, Category, Item } from '@/types/johnnyDecimal';

interface SystemTreeProps {
  system: JohnnyDecimalSystem;
  onUpdateArea: (areaId: string, updates: Partial<Pick<Area, 'name' | 'description' | 'tags'>>) => void;
  onUpdateCategory: (areaId: string, categoryId: string, updates: Partial<Pick<Category, 'name' | 'description' | 'tags'>>) => void;
  onAddCategory: (areaId: string, category: Category) => void;
  onRemoveCategory: (areaId: string, categoryId: string) => void;
  onAddItem: (areaId: string, categoryId: string, item: Item) => void;
  onUpdateItem: (areaId: string, categoryId: string, itemId: string, updates: Partial<Item>) => void;
  onRemoveItem: (areaId: string, categoryId: string, itemId: string) => void;
}

// Component for area description textarea with keyboard handling
function AreaDescriptionTextarea({
  area,
  onUpdateArea,
  onAddCategory,
  onClose,
}: {
  area: Area;
  onUpdateArea: (areaId: string, updates: Partial<Pick<Area, 'description' | 'tags'>>) => void;
  onAddCategory: (areaId: string, category: Category) => void;
  onClose: () => void;
}) {
  const { handleKeyDown } = useDescriptionKeyboard({
    onEscape: onClose,
    onAddCategory: (category) => onAddCategory(area.id, category),
    onUpdateDescription: (value) => onUpdateArea(area.id, { description: value }),
    areaId: area.id,
    isArea: true,
  });

  return (
    <Textarea
      value={area.description}
      onChange={e => onUpdateArea(area.id, { description: e.target.value })}
      onKeyDown={handleKeyDown}
      placeholder="Area description... (type 'Name [XX]' + Enter to add category)"
      className="min-h-[50px] text-sm"
    />
  );
}

// Component for quick-add category input
function CategoryQuickAdd({
  areaId,
  onAddCategory,
}: {
  areaId: string;
  onAddCategory: (areaId: string, category: Category) => void;
}) {
  const [quickAddValue, setQuickAddValue] = useState('');

  const handleQuickAdd = () => {
    const parsed = parseItemPattern(quickAddValue);
    if (parsed) {
      const categoryId = parsed.number.padStart(2, '0');
      onAddCategory(areaId, {
        id: categoryId,
        name: parsed.name,
        description: '',
        tags: [],
        items: [],
      });
      setQuickAddValue('');
    }
  };

  const { handleKeyDown } = useInputKeyboard({
    onSubmit: handleQuickAdd,
    clearOnEscape: true,
    setValue: setQuickAddValue,
  });

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">Add Category</label>
      <div className="flex items-center gap-2">
        <Input
          value={quickAddValue}
          onChange={e => setQuickAddValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Category name [XX]"
          className="flex-1 h-7 text-xs"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleQuickAdd}
          className="h-7 w-7 p-0"
          disabled={!parseItemPattern(quickAddValue)}
        >
          <Check className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Format: Name [XX] → creates category XX
      </p>
    </div>
  );
}

// Component for category description textarea with keyboard handling
function CategoryDescriptionTextarea({
  areaId,
  category,
  systemName,
  onUpdateCategory,
  onAddItem,
  onClose,
}: {
  areaId: string;
  category: Category;
  systemName: string;
  onUpdateCategory: (areaId: string, categoryId: string, updates: Partial<Pick<Category, 'description' | 'tags'>>) => void;
  onAddItem: (areaId: string, categoryId: string, item: Item) => void;
  onClose: () => void;
}) {
  const systemPrefix = extractSystemPrefix(systemName);

  const { handleKeyDown } = useDescriptionKeyboard({
    onEscape: onClose,
    onAddItem: (item) => onAddItem(areaId, category.id, item),
    onUpdateDescription: (value) => onUpdateCategory(areaId, category.id, { description: value }),
    systemPrefix,
    categoryId: category.id,
    isCategory: true,
  });

  return (
    <Textarea
      value={category.description}
      onChange={e => onUpdateCategory(areaId, category.id, { description: e.target.value })}
      onKeyDown={handleKeyDown}
      placeholder="Category description... (type 'Name [XX]' + Enter to add item)"
      className="min-h-[50px] text-sm"
    />
  );
}

export function SystemTree({ system, onUpdateArea, onUpdateCategory, onAddCategory, onRemoveCategory, onAddItem, onUpdateItem, onRemoveItem }: SystemTreeProps) {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const systemPrefix = extractSystemPrefix(system.name);

  // Rename handlers - use :: as delimiter since IDs may contain dashes
  const startRenameArea = (area: Area) => {
    setRenamingId(`area::${area.id}`);
    setRenameValue(area.name);
  };

  const startRenameCategory = (areaId: string, category: Category) => {
    setRenamingId(`cat::${areaId}::${category.id}`);
    setRenameValue(category.name);
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

  return (
    <div className="space-y-1">
      {system.areas.map(area => {
        const isExpanded = expandedAreas.has(area.id);
        const isEditing = editingId === `area-${area.id}`;
        const isRenamingArea = renamingId === `area::${area.id}`;

        return (
          <div key={area.id} className="border rounded-lg overflow-hidden bg-card group/area">
            <div className="flex items-center">
              <button
                onClick={() => toggleArea(area.id)}
                className="flex-1 px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
              >
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                <Folder className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm text-muted-foreground">{area.id}</span>
                {isRenamingArea ? (
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
                  <span className="font-medium text-sm">{area.name}</span>
                )}
              </button>
              {!isRenamingArea && (
                <button
                  onClick={() => startRenameArea(area)}
                  className="opacity-0 group-hover/area:opacity-100 p-2 mr-2 hover:text-foreground text-muted-foreground transition-opacity"
                  title="Rename area"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="border-t">
                {/* Area edit section */}
                <div className="px-4 py-2 bg-muted/20 border-b">
                  <button
                    onClick={() => setEditingId(isEditing ? null : `area-${area.id}`)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isEditing ? 'Close' : 'Edit area'}
                  </button>
                  {isEditing && (
                    <div className="mt-2 space-y-3">
                      <AreaDescriptionTextarea
                        area={area}
                        onUpdateArea={onUpdateArea}
                        onAddCategory={onAddCategory}
                        onClose={() => setEditingId(null)}
                      />
                      <TagInput
                        tags={area.tags}
                        onChange={tags => onUpdateArea(area.id, { tags })}
                      />
                      <div className="pt-2 border-t">
                        <CategoryQuickAdd
                          areaId={area.id}
                          onAddCategory={onAddCategory}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories */}
                {area.categories.map(category => {
                  const isCatEditing = editingId === `cat-${area.id}-${category.id}`;
                  const isRenamingCat = renamingId === `cat::${area.id}::${category.id}`;

                  return (
                    <div key={category.id} className="border-b last:border-b-0 group/category">
                      <div className="flex items-center">
                        <div
                          onClick={() => setEditingId(isCatEditing ? null : `cat-${area.id}-${category.id}`)}
                          className="flex-1 min-w-0 px-4 py-2 pl-12 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs text-muted-foreground shrink-0">{category.id}</span>
                          {isRenamingCat ? (
                            <Input
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={renameKeyDown}
                              onBlur={saveRename}
                              onClick={e => e.stopPropagation()}
                              className="h-5 text-sm w-32"
                              autoFocus
                            />
                          ) : (
                            <span className="text-sm truncate">{category.name}</span>
                          )}
                        </div>
                        {!isRenamingCat && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startRenameCategory(area.id, category); }}
                            className="opacity-0 group-hover/category:opacity-100 p-2 hover:text-foreground text-muted-foreground transition-opacity"
                            title="Rename category"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveCategory(area.id, category.id)}
                          className="opacity-0 group-hover/category:opacity-100 p-2 mr-2 hover:text-destructive text-muted-foreground transition-opacity"
                          title="Delete category"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {isCatEditing && (
                        <div className="px-4 py-2 pl-12 bg-muted/30 space-y-2">
                          <CategoryDescriptionTextarea
                            areaId={area.id}
                            category={category}
                            systemName={system.name}
                            onUpdateCategory={onUpdateCategory}
                            onAddItem={onAddItem}
                            onClose={() => setEditingId(null)}
                          />
                          <TagInput
                            tags={category.tags}
                            onChange={tags => onUpdateCategory(area.id, category.id, { tags })}
                          />
                          <div className="pt-2 border-t" data-item-list-active="true">
                            <ItemList
                              items={category.items || []}
                              categoryId={category.id}
                              systemPrefix={systemPrefix}
                              onAdd={item => onAddItem(area.id, category.id, item)}
                              onUpdate={(itemId, updates) => onUpdateItem(area.id, category.id, itemId, updates)}
                              onRemove={itemId => onRemoveItem(area.id, category.id, itemId)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
