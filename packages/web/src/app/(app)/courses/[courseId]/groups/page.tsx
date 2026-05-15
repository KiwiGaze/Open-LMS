'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useAddCourseGroupMemberMutation,
  useCourseGroupMembersQuery,
  useCourseGroupSetsQuery,
  useCourseGroupsQuery,
  useCreateCourseGroupMutation,
  useCreateCourseGroupSetMutation,
  useDeleteCourseGroupMutation,
  useDeleteCourseGroupSetMutation,
  useLeaveCourseGroupMutation,
} from '@/lib/api/queries/groups.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { CourseGroup, CourseGroupMemberRole } from '@openlms/contracts';
import { ChevronDown, ChevronRight, LogOut, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { use, useMemo, useState } from 'react';

type Params = { courseId: string };

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export default function CourseGroupsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const sets = useCourseGroupSetsQuery(tenantId, courseId);
  const groups = useCourseGroupsQuery(tenantId, courseId);
  const createSet = useCreateCourseGroupSetMutation(tenantId, courseId);
  const createGroup = useCreateCourseGroupMutation(tenantId, courseId);
  const deleteSet = useDeleteCourseGroupSetMutation(tenantId, courseId);
  const deleteGroup = useDeleteCourseGroupMutation(tenantId, courseId);

  const handleDeleteSet = (id: string, name: string) => {
    if (!window.confirm(`Delete group set "${name}"? Groups inside will be removed too.`)) return;
    deleteSet.mutate(id, {
      onSuccess: () => publish({ tone: 'success', title: `Deleted ${name}` }),
      onError: (error) =>
        publish({
          tone: 'danger',
          title: 'Delete failed',
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  };

  const handleDeleteGroup = (id: string, name: string) => {
    if (!window.confirm(`Delete group "${name}"? Members will be removed.`)) return;
    deleteGroup.mutate(id, {
      onSuccess: () => publish({ tone: 'success', title: `Deleted ${name}` }),
      onError: (error) =>
        publish({
          tone: 'danger',
          title: 'Delete failed',
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  };

  const [newSetOpen, setNewSetOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const [setName, setSetName] = useState('');
  const [selfSignup, setSelfSignup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSetId, setGroupSetId] = useState<string>('');

  const groupsBySet = useMemo(() => {
    const map = new Map<string, CourseGroup[]>();
    for (const group of groups.data ?? []) {
      const list = map.get(group.groupSetId) ?? [];
      list.push(group);
      map.set(group.groupSetId, list);
    }
    return map;
  }, [groups.data]);

  const handleCreateSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = setName.trim();
    if (!trimmed) return;
    try {
      await createSet.mutateAsync({
        name: trimmed,
        selfSignupEnabled: selfSignup,
        status: 'active',
        position: sets.data?.length ?? 0,
      });
      publish({ tone: 'success', title: 'Group set created' });
      setSetName('');
      setSelfSignup(false);
      setNewSetOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not create. Try again.';
      publish({ tone: 'danger', title: 'Create failed', description: message });
    }
  };

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupSetId) return;
    const trimmed = groupName.trim();
    if (!trimmed) return;
    try {
      await createGroup.mutateAsync({
        groupSetId,
        name: trimmed,
        description: null,
        status: 'active',
        position: (groupsBySet.get(groupSetId) ?? []).length,
      });
      publish({ tone: 'success', title: 'Group created' });
      setGroupName('');
      setNewGroupOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not create. Try again.';
      publish({ tone: 'danger', title: 'Create failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Groups"
        title="Course groups"
        description="Organize students into project teams, discussion groups, or peer-review pods."
        actions={
          <div className="flex items-center gap-2">
            <Button
              intent="secondary"
              onClick={() => setNewGroupOpen(true)}
              disabled={(sets.data?.length ?? 0) === 0}
            >
              <Plus className="size-4" aria-hidden /> New group
            </Button>
            <Button onClick={() => setNewSetOpen(true)}>
              <Plus className="size-4" aria-hidden /> New group set
            </Button>
          </div>
        }
      />

      {sets.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : sets.error ? (
        <ErrorState error={sets.error} onRetry={() => sets.refetch()} />
      ) : (sets.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          title="No group sets"
          description="Start by creating a group set — like “Project teams” — then add groups inside it."
          action={
            <Button onClick={() => setNewSetOpen(true)}>
              <Plus className="size-4" aria-hidden /> New group set
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sets.data?.map((set) => {
            const setGroups = groupsBySet.get(set.id) ?? [];
            return (
              <Card key={set.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{set.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {set.selfSignupEnabled ? <Badge tone="info">Self-signup</Badge> : null}
                      <Badge tone={set.status === 'active' ? 'success' : 'neutral'}>
                        {set.status}
                      </Badge>
                      <Button
                        intent="ghost"
                        size="sm"
                        onClick={() => handleDeleteSet(set.id, set.name)}
                        disabled={deleteSet.isPending}
                        aria-label={`Delete group set ${set.name}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {setGroups.length === 0 ? (
                    <p className="text-sm text-(--color-text-muted)">No groups yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {setGroups.map((group) => {
                        const isOpen = openGroupId === group.id;
                        return (
                          <li key={group.id}>
                            <div className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-(--color-surface-muted)">
                              <button
                                type="button"
                                onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                                className="flex flex-1 items-center justify-between gap-2 text-left"
                              >
                                <span className="flex items-center gap-2">
                                  {isOpen ? (
                                    <ChevronDown className="size-4" aria-hidden />
                                  ) : (
                                    <ChevronRight className="size-4" aria-hidden />
                                  )}
                                  <span className="font-medium text-(--color-text-default)">
                                    {group.name}
                                  </span>
                                </span>
                                <Badge tone={group.status === 'active' ? 'success' : 'neutral'}>
                                  {group.status}
                                </Badge>
                              </button>
                              <Button
                                intent="ghost"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                disabled={deleteGroup.isPending}
                                aria-label={`Delete group ${group.name}`}
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                              </Button>
                            </div>
                            {isOpen ? (
                              <GroupMembersPanel
                                tenantId={tenantId}
                                courseId={courseId}
                                groupId={group.id}
                              />
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={newSetOpen} onOpenChange={setNewSetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New group set</DialogTitle>
            <DialogDescription>
              A group set holds related groups (e.g. “Project teams”).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSet} className="flex flex-col gap-4">
            <FormField label="Name" id="set-name" required>
              <Input
                id="set-name"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                maxLength={120}
                placeholder="Project teams"
                autoFocus
              />
            </FormField>
            <div className="flex items-center gap-2">
              <Switch id="self-signup" checked={selfSignup} onCheckedChange={setSelfSignup} />
              <label htmlFor="self-signup" className="text-sm text-(--color-text-default)">
                Let students sign themselves up
              </label>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" intent="secondary" disabled={createSet.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!setName.trim() || createSet.isPending}
                loading={createSet.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
            <FormField label="Group set" id="group-set">
              <Select value={groupSetId} onValueChange={setGroupSetId}>
                <SelectTrigger id="group-set">
                  <SelectValue placeholder="Pick a group set" />
                </SelectTrigger>
                <SelectContent>
                  {sets.data?.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Name" id="group-name" required>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={120}
                placeholder="Team Alpha"
              />
            </FormField>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" intent="secondary" disabled={createGroup.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!groupSetId || !groupName.trim() || createGroup.isPending}
                loading={createGroup.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupMembersPanel({
  tenantId,
  courseId,
  groupId,
}: {
  tenantId: string | null;
  courseId: string;
  groupId: string;
}) {
  const { publish } = useToast();
  const members = useCourseGroupMembersQuery(tenantId, courseId, groupId);
  const add = useAddCourseGroupMemberMutation(tenantId, courseId, groupId);
  const leave = useLeaveCourseGroupMutation(tenantId, courseId);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<CourseGroupMemberRole>('member');
  const [userIdError, setUserIdError] = useState<string | null>(null);

  const handleLeave = () => {
    if (!window.confirm('Leave this group?')) return;
    leave.mutate(groupId, {
      onSuccess: () => publish({ tone: 'success', title: 'Left group' }),
      onError: (error) =>
        publish({
          tone: 'danger',
          title: 'Could not leave',
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUserIdError(null);
    const trimmed = userId.trim();
    if (!ULID_RE.test(trimmed)) {
      setUserIdError('User ID must be a 26-character ULID.');
      return;
    }
    try {
      await add.mutateAsync({ userId: trimmed, role });
      publish({ tone: 'success', title: 'Member added' });
      setUserId('');
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not add. Try again.';
      publish({ tone: 'danger', title: 'Add failed', description: message });
    }
  };

  return (
    <div className="ml-6 mt-2 flex flex-col gap-2 rounded-[var(--radius-sm)] border border-(--color-border-subtle) p-3">
      <form onSubmit={handleAdd} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
        <FormField label="User ID" id={`g-${groupId}-user`} error={userIdError}>
          <Input
            id={`g-${groupId}-user`}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="01J9QW7B6N5W2YH3D3A1V0KE8M"
          />
        </FormField>
        <Select value={role} onValueChange={(v) => setRole(v as CourseGroupMemberRole)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="leader">Leader</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={add.isPending} loading={add.isPending}>
          <UserPlus className="size-4" aria-hidden /> Add
        </Button>
      </form>

      {members.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : members.error ? (
        <ErrorState error={members.error} onRetry={() => members.refetch()} />
      ) : (members.data?.length ?? 0) === 0 ? (
        <p className="text-xs text-(--color-text-muted)">No members yet.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-xs">
          {members.data?.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1"
            >
              <span className="font-mono text-(--color-text-default)">{m.userId.slice(-12)}</span>
              <Badge tone={m.role === 'leader' ? 'brand' : 'neutral'}>{m.role}</Badge>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end pt-1">
        <Button
          intent="ghost"
          size="sm"
          onClick={handleLeave}
          disabled={leave.isPending}
          loading={leave.isPending}
        >
          <LogOut className="size-3.5" aria-hidden /> Leave group
        </Button>
      </div>
    </div>
  );
}
