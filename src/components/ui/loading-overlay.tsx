
'use client';

import { useLoading } from '@/contexts/loading-context';
import { cn } from '@/lib/utils';

export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-6 p-12 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center animate-bounce duration-[2s] overflow-hidden">
            <img 
              src="/new-logo/logo-annimate.png" 
              alt="Chargement..." 
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg sm:text-2xl font-black tracking-tight animate-pulse text-foreground">
            {loadingMessage || "Chargement..."}
          </h2>
          <div className="flex justify-center gap-1.5 pt-2">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full bg-primary animate-bounce`} style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
