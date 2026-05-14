import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col bg-(--color-surface-sunken)">
      <header className="flex h-(--spacing-topbar) items-center px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-(--color-text-default)">
          <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-(--color-brand) text-(--color-text-onbrand)">
            <GraduationCap className="size-4" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Open-LMS</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-6 py-4 text-center text-xs text-(--color-text-subtle)">
        © Open-LMS — modern learning, on your terms.
      </footer>
    </div>
  );
}
