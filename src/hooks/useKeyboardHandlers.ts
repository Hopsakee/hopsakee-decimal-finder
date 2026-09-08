import { useCallback } from 'react';
import type { Item, Category } from '@/types/johnnyDecimal';

// Extract prefix from system name (e.g., "d1-Prive" → "d1")
export function extractSystemPrefix(systemName: string): string {
  const match = systemName.match(/^([a-zA-Z]\d+)/);
  return match ? match[1] : '';
}

// Parse "Name [XX]" format and return { name, number } or null
export function parseItemPattern(input: string): { name: string; number: string } | null {
  const match = input.trim().match(/^(.+?)\s*\[(\d+)\]$/);
  if (match) {
    return { name: match[1].trim(), number: match[2] };
  }
  return null;
}

// Build full item ID from components
export function buildItemId(systemPrefix: string, categoryId: string, number: string): string {
  const paddedNumber = number.padStart(2, '0');
  return systemPrefix
    ? `${systemPrefix}.${categoryId}.${paddedNumber}`
    : `${categoryId}.${paddedNumber}`;
}

// ============================================
// Input keyboard handler (for simple inputs)
// ============================================
interface UseInputKeyboardOptions {
  onSubmit?: () => void;
  onCancel?: () => void;
  clearOnEscape?: boolean;
  setValue?: (value: string) => void;
}

export function useInputKeyboard(options: UseInputKeyboardOptions = {}) {
  const { onSubmit, onCancel, clearOnEscape = false, setValue } = options;

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (clearOnEscape && setValue) {
        setValue('');
      }
      (e.target as HTMLInputElement).blur();
      onCancel?.();
    }
  }, [onSubmit, onCancel, clearOnEscape, setValue]);

  return { handleKeyDown };
}

// ============================================
// Description textarea keyboard handler
// ============================================
interface UseDescriptionKeyboardOptions {
  onEscape?: () => void;
  onAddItem?: (item: Item) => void;
  onAddCategory?: (category: Category) => void;
  onUpdateDescription?: (value: string) => void;
  onAddTag?: (tag: string, currentTags: string[]) => void;
  systemPrefix?: string;
  categoryId?: string;
  areaId?: string;
  currentTags?: string[];
  isCategory?: boolean;
  isArea?: boolean;
}

export function useDescriptionKeyboard(options: UseDescriptionKeyboardOptions = {}) {
  const {
    onEscape,
    onAddItem,
    onAddCategory,
    onUpdateDescription,
    onAddTag,
    systemPrefix = '',
    categoryId = '',
    areaId = '',
    currentTags = [],
    isCategory = false,
    isArea = false,
  } = options;

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);

    // Escape: blur and call onEscape
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      textarea.blur();
      onEscape?.();
      return;
    }

    // Enter: check for "Name [XX]" pattern on the current line
    if (e.key === 'Enter') {
      const lastNewline = textBeforeCursor.lastIndexOf('\n');
      const currentLine = textBeforeCursor.substring(lastNewline + 1);
      const parsed = parseItemPattern(currentLine);

      if (parsed) {
        // For categories: create item
        if (isCategory && onAddItem && categoryId) {
          e.preventDefault();
          const fullId = buildItemId(systemPrefix, categoryId, parsed.number);
          onAddItem({ id: fullId, name: parsed.name });

          // Remove the line from description
          const newValue = value.substring(0, lastNewline + 1) + value.substring(cursorPos);
          onUpdateDescription?.(newValue.replace(/\s+$/g, ''));
          return;
        }

        // For areas: create category
        if (isArea && onAddCategory && areaId) {
          e.preventDefault();
          const categoryIdNew = parsed.number.padStart(2, '0');
          onAddCategory({
            id: categoryIdNew,
            name: parsed.name,
            description: '',
            tags: [],
            items: [],
          });

          // Remove the line from description
          const newValue = value.substring(0, lastNewline + 1) + value.substring(cursorPos);
          onUpdateDescription?.(newValue.replace(/\s+$/g, ''));
          return;
        }
      }
    }

    // Space/Enter/Tab: check for hashtags
    if ((e.key === ' ' || e.key === 'Enter' || e.key === 'Tab') && onAddTag) {
      const hashtagRegex = /#(\w+)$/;
      const match = textBeforeCursor.match(hashtagRegex);

      if (match) {
        e.preventDefault();
        const tag = match[1].toLowerCase();

        // Remove the hashtag from description
        const newValue = value.substring(0, cursorPos - match[0].length) + value.substring(cursorPos);
        onUpdateDescription?.(newValue.trim());

        // Add tag if not duplicate
        if (!currentTags.includes(tag)) {
          onAddTag(tag, [...currentTags, tag]);
        }
        return;
      }
    }
  }, [onEscape, onAddItem, onAddCategory, onUpdateDescription, onAddTag, systemPrefix, categoryId, areaId, currentTags, isCategory, isArea]);

  return { handleKeyDown };
}

// ============================================
// Container navigation keyboard handler
// ============================================
interface UseContainerNavigationOptions {
  itemCount: number;
  focusIndex: number;
  onFocusChange: (index: number) => void;
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  getItemId: (index: number) => string;
  onFocusTextarea?: (id: string) => void;
  onRename?: (index: number) => void;
}

export function useContainerNavigation(options: UseContainerNavigationOptions) {
  const {
    itemCount,
    focusIndex,
    onFocusChange,
    expandedId,
    onToggleExpand,
    getItemId,
    onFocusTextarea,
    onRename,
  } = options;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Don't intercept keys when typing in inputs or textareas
    const target = e.target as HTMLElement;
    const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    if (isEditing) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      onFocusChange(Math.min(focusIndex + 1, itemCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onFocusChange(Math.max(focusIndex - 1, 0));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (expandedId) {
        onToggleExpand(null);
      }
    } else if (e.key === 'Enter' && focusIndex >= 0) {
      e.preventDefault();
      const id = getItemId(focusIndex);

      if (expandedId === id) {
        // Already expanded - focus the description field
        onFocusTextarea?.(id);
      } else {
        // Expand the item
        onToggleExpand(id);
      }
    } else if (e.key === 'e' && focusIndex >= 0) {
      e.preventDefault();
      onRename?.(focusIndex);
    }
  }, [itemCount, focusIndex, onFocusChange, expandedId, onToggleExpand, getItemId, onFocusTextarea, onRename]);

  return { handleKeyDown };
}
