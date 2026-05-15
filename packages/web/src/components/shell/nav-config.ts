import {
  Archive,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Flag,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Library,
  MessagesSquare,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Video,
  Webhook,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show only when the user has a staff role somewhere. */
  staffOnly?: boolean;
};

export const PRIMARY_NAV: AppNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/catalog', label: 'Catalog', icon: Library },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/announcements', label: 'Announcements', icon: Bell },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export const ADMIN_NAV: AppNavItem[] = [
  { href: '/admin/tenant', label: 'Tenant settings', icon: Settings, staffOnly: true },
  { href: '/admin/providers', label: 'AI providers', icon: Sparkles, staffOnly: true },
  { href: '/admin/ai-usage', label: 'AI usage', icon: Sparkles, staffOnly: true },
  { href: '/admin/feature-flags', label: 'Feature flags', icon: Flag, staffOnly: true },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Webhook, staffOnly: true },
  { href: '/admin/retention', label: 'Retention', icon: Archive, staffOnly: true },
  { href: '/admin/legal-holds', label: 'Legal holds', icon: ShieldAlert, staffOnly: true },
  { href: '/admin/audit-logs', label: 'Audit logs', icon: Shield, staffOnly: true },
];

export type CourseNavItem = {
  segment: string;
  label: string;
  icon: LucideIcon;
  /** Show only to course staff (instructor / teaching_assistant / course_admin). */
  staffOnly?: boolean;
};

export const COURSE_NAV: CourseNavItem[] = [
  { segment: '', label: 'Home', icon: GraduationCap },
  { segment: 'modules', label: 'Modules', icon: BookOpen },
  { segment: 'assignments', label: 'Assignments', icon: ClipboardList },
  { segment: 'discussions', label: 'Discussions', icon: MessagesSquare },
  { segment: 'quizzes', label: 'Quizzes', icon: ClipboardList },
  { segment: 'gradebook', label: 'Gradebook', icon: ClipboardList },
  { segment: 'people', label: 'People', icon: Users },
  { segment: 'attendance', label: 'Attendance', icon: CalendarCheck, staffOnly: true },
  { segment: 'pages', label: 'Pages', icon: BookOpen },
  { segment: 'wiki', label: 'Wiki', icon: BookOpen },
  { segment: 'files', label: 'Files', icon: BookOpen },
  { segment: 'glossary', label: 'Glossary', icon: Library },
  { segment: 'meetings', label: 'Meetings', icon: Video },
  { segment: 'calendar', label: 'Calendar', icon: CalendarClock },
  { segment: 'announcements', label: 'Announcements', icon: Bell },
  { segment: 'settings', label: 'Settings', icon: Settings, staffOnly: true },
];
