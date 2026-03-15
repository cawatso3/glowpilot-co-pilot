import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Loader2 } from 'lucide-react';
import type { IntegrationProvider } from '@/types/database';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
}

interface ApiKeyConnectionFormProps {
  provider: IntegrationProvider;
  fields: Field[];
  onSubmit: (credentials: Record<string, string>) => void;
  onCancel: () => void;
  isLoading: boolean;
  helpLink?: string;
}

export function ApiKeyConnectionForm({ fields, onSubmit, onCancel, isLoading, helpLink }: ApiKeyConnectionFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.key, '']))
  );

  const allFilled = fields.every(f => values[f.key]?.trim());

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      {helpLink && (
        <a href={helpLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
          <ExternalLink className="h-3 w-3" /> Where do I find this?
        </a>
      )}
      {fields.map(f => (
        <div key={f.key} className="space-y-1">
          <Label className="text-xs">{f.label}</Label>
          <Input
            type={f.type}
            value={values[f.key]}
            onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSubmit(values)} disabled={!allFilled || isLoading}>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          Test & Connect
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
