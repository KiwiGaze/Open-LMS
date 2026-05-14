'use client';

import { useMyCourseMembershipsQuery, useMyTenantMembershipsQuery } from '@/lib/api/queries/me.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COURSE_NAV } from './nav-config.ts';

const COURSE_STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

export function CourseTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const courseRoot = `/courses/${courseId}`;

  const activeTenantId = useSessionStore((s) => s.activeTenantId);
  const myCourseMemberships = useMyCourseMembershipsQuery();
  const myTenantMemberships = useMyTenantMembershipsQuery();

  const isCourseStaff =
    myCourseMemberships.data?.some(
      (m) => m.courseId === courseId && COURSE_STAFF_ROLES.has(m.role),
    ) ?? false;
  const isInstitutionAdmin =
    !!activeTenantId &&
    (myTenantMemberships.data?.some(
      (m) => m.tenantId === activeTenantId && m.role === 'institution_admin',
    ) ??
      false);
  const showStaffOnly = isCourseStaff || isInstitutionAdmin;

  const visibleItems = COURSE_NAV.filter((item) => !item.staffOnly || showStaffOnly);

  return (
    <nav
      className="-mb-px flex gap-1 overflow-x-auto border-b border-(--color-border-subtle)"
      aria-label="Course sections"
    >
      {visibleItems.map((item) => {
        const href = item.segment ? `${courseRoot}/${item.segment}` : courseRoot;
        const isActive = item.segment
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === courseRoot;
        const Icon = item.icon;
        return (
          <Link
            key={item.segment || 'home'}
            href={href}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-medium',
              'border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-(--color-brand-600) text-(--color-text-default)'
                : 'border-transparent text-(--color-text-muted) hover:text-(--color-text-default)',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="size-3.5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
