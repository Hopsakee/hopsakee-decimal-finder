import { useState, useRef, useEffect } from 'react';
import { Plus, X, Pencil, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInputKeyboard, parseItemPattern, buildItemId } from '@/hooks/useKeyboardHandlers';
import type { Item } from '@/types/johnnyDecimal';

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

interface ItemListProps {
  items: Item[];
  categoryId: string;
  systemPrefix?: string;
  matchedTerms?: string[];
  onAdd: (item: Item) => void;
  onUpdate: (itemId: string, updates: Partial<Item>) => void;
  onRemove: (itemId: string) => void;
}

export function ItemList({ items, categoryId, systemPrefix = '', matchedTerms = [], onAdd, onUpdate, onRemove }: ItemListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [quickAddValue, setQuickAddValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const quickAddRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort items by ID numerically
  const sortedItems = [...items].sort((a, b) => {
    const aNum = parseInt(a.id.split('.').pop() || '0');
    const bNum = parseInt(b.id.split('.').pop() || '0');
    return aNum - bNum;
  });

  // Keyboard shortcut: 'n' or 'a' to focus quick add when container has focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (!isInputFocused && (e.key === 'n' || e.key === 'a')) {
        if (containerRef.current?.closest('[data-item-list-active="true"]')) {
          e.preventDefault();
          quickAddRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handlers for adding items
  const handleAdd = () => {
    if (newId.trim() && newName.trim()) {
      onAdd({ id: newId.trim(), name: newName.trim() });
      setNewId('');
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleQuickAdd = () => {
    const parsed = parseItemPattern(quickAddValue);
    if (parsed) {
      const fullId = buildItemId(systemPrefix, categoryId, parsed.number);
      onAdd({ id: fullId, name: parsed.name });
      setQuickAddValue('');
    }
  };

  // Use shared keyboard handlers
  const { handleKeyDown: quickAddKeyDown } = useInputKeyboard({
    onSubmit: handleQuickAdd,
    clearOnEscape: true,
    setValue: setQuickAddValue,
  });

  const { handleKeyDown: manualAddKeyDown } = useInputKeyboard({
    onSubmit: handleAdd,
    onCancel: () => {
      setIsAdding(false);
      setNewId('');
      setNewName('');
    },
  });

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdate(editingId, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
    }
  };

  const { handleKeyDown: editKeyDown } = useInputKeyboard({
    onSubmit: handleSaveEdit,
    onCancel: () => {
      setEditingId(null);
      setEditName('');
    },
  });

  const handleStartEdit = (item: Item) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          Items
        </label>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Quick add input - always visible */}
      <div className="flex items-center gap-2">
        <Input
          ref={quickAddRef}
          value={quickAddValue}
          onChange={e => setQuickAddValue(e.target.value)}
          onKeyDown={quickAddKeyDown}
          placeholder={`Item name [${String(sortedItems.length + 1).padStart(2, '0')}]`}
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
        Format: Name [XX] → creates {systemPrefix ? `${systemPrefix}.` : ''}{categoryId}.XX
      </p>

      {/* Add new item form (manual) */}
      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            value={newId}
            onChange={e => setNewId(e.target.value)}
            onKeyDown={manualAddKeyDown}
            placeholder={`${categoryId}.XX`}
            className="w-24 h-7 text-xs font-mono"
            autoFocus
          />
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={manualAddKeyDown}
            placeholder="Name"
            className="flex-1 h-7 text-xs"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            className="h-7 w-7 p-0"
            disabled={!newId.trim() || !newName.trim()}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setNewId('');
              setNewName('');
            }}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Items list */}
      {sortedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedItems.map(item => (
            <div
              key={item.id}
              className="group inline-flex items-center gap-1.5 bg-muted/50 border rounded px-2 py-1 text-xs"
            >
              {editingId === item.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={editKeyDown}
                    onBlur={handleSaveEdit}
                    className="h-5 w-24 text-xs px-1"
                    autoFocus
                  />
                  <span className="font-mono text-muted-foreground">({item.id})</span>
                </>
              ) : (
                <>
                  <span className="font-medium"><HighlightText text={item.name} terms={matchedTerms} /></span>
                  <span className="font-mono text-muted-foreground">({item.id})</span>
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="opacity-0 group-hover:opacity-100 hover:text-foreground text-muted-foreground transition-opacity"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {sortedItems.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground italic">No items yet</p>
      )}
    </div>
  );
}
