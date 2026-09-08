import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { JohnnyDecimalSystem } from '@/types/johnnyDecimal';
import { validateSystem, validateDomains, MAX_FILE_SIZE } from '@/lib/validation';

interface FileImportProps {
  onImport: (system: JohnnyDecimalSystem) => void;
}

export function FileImport({ onImport }: FileImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Handle domains wrapper format
      if (Array.isArray(data.domains)) {
        const result = validateDomains(data);
        if (result.success) {
          result.data.forEach(system => onImport(system));
          toast({
            title: 'Systems loaded',
            description: `Loaded ${result.data.length} systems`
          });
        } else {
          toast({
            title: 'Invalid file format',
            description: result.error,
            variant: 'destructive'
          });
        }
        return;
      }

      // Handle direct system format
      const result = validateSystem(data);
      if (result.success) {
        onImport(result.data);
        toast({
          title: 'System loaded',
          description: `"${result.data.name}" with ${result.data.areas.length} areas`
        });
      } else {
        toast({
          title: 'Invalid file format',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Invalid JSON file',
        variant: 'destructive'
      });
    }
  }, [onImport, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/json' || file?.name.endsWith('.json')) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
    >
      <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm text-muted-foreground mb-3">
        Drop a JSON file here or
      </p>
      <Button variant="outline" size="sm" asChild>
        <label className="cursor-pointer">
          Browse files
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </Button>
    </div>
  );
}
