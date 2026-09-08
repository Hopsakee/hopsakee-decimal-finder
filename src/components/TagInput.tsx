import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim().toLowerCase())) {
        onChange([...tags, input.trim().toLowerCase()]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map(tag => (
        <Badge key={tag} variant="secondary" className="gap-1 text-xs">
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag..."
        className="h-6 w-24 text-xs border-none shadow-none p-0 focus-visible:ring-0"
      />
    </div>
  );
}
