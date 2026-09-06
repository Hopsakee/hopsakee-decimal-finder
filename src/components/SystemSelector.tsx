import type { JohnnyDecimalSystem } from '@/types/johnnyDecimal';

interface SystemSelectorProps {
  systems: JohnnyDecimalSystem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function SystemSelector({ systems, activeIndex, onSelect }: SystemSelectorProps) {
  if (systems.length <= 1) return null;

  const sorted = systems
    .map((system, originalIndex) => ({ system, originalIndex }))
    .sort((a, b) => a.system.name.localeCompare(b.system.name));

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {sorted.map(({ system, originalIndex }) => (
        <button
          key={system.name}
          onClick={() => onSelect(originalIndex)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            originalIndex === activeIndex
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {system.name}
        </button>
      ))}
    </div>
  );
}
