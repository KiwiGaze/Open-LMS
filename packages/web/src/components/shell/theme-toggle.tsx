'use client';

import { Button } from '@/components/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light';
    setTheme(current);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      window.localStorage.setItem('openlms.theme', next);
    } catch {
      /* localStorage may be unavailable; ignore */
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button intent="ghost" size="icon-sm" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <Moon className="size-4" aria-hidden />
          ) : (
            <Sun className="size-4" aria-hidden />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</TooltipContent>
    </Tooltip>
  );
}
