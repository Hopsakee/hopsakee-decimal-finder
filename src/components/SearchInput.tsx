import { useRef, useEffect, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onArrowDown?: () => void;
}

export function SearchInput({ value, onChange, onArrowDown }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Focus search on "/" key when not already focused
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onChange('');
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && onArrowDown) {
      e.preventDefault();
      onArrowDown();
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What do you want to file? (Press / to focus)"
        className="pl-10 h-12 text-base"
        autoFocus
      />
    </div>
  );
}
