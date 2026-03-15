import { Sparkles } from 'lucide-react';

export function GlowPilotLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-display text-xl font-semibold text-foreground">GlowPilot</span>
    </div>
  );
}
