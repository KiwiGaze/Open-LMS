'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { changePassword } from '@/lib/api/auth-client.ts';
import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useMeQuery } from '@/lib/api/queries/me.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from '@openlms/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const Schema = z.object({
  displayName: z.string().min(1, 'Required.').max(120),
  locale: z.string().max(35).optional(),
  timezone: z.string().max(64).optional(),
});

type Values = z.infer<typeof Schema>;

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required.'),
    newPassword: z.string().min(8, 'Must be at least 8 characters.').max(128),
    confirmPassword: z.string().min(1, 'Required.'),
    revokeOtherSessions: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'New passwords do not match.',
      });
    }
    if (value.currentPassword === value.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'New password must differ from the current one.',
      });
    }
  });

type PasswordValues = z.infer<typeof PasswordSchema>;

export default function AccountPage() {
  const me = useMeQuery();
  const queryClient = useQueryClient();
  const { publish } = useToast();

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    values: {
      displayName: me.data?.displayName ?? '',
      locale: me.data?.locale ?? '',
      timezone: me.data?.timezone ?? '',
    },
  });

  useEffect(() => {
    if (me.data) {
      form.reset({
        displayName: me.data.displayName ?? '',
        locale: me.data.locale ?? '',
        timezone: me.data.timezone ?? '',
      });
    }
  }, [me.data, form]);

  const update = useMutation({
    mutationFn: (values: Values) =>
      apiFetch<User>('/me', {
        method: 'PATCH',
        body: {
          displayName: values.displayName,
          locale: values.locale ? values.locale : null,
          timezone: values.timezone ? values.timezone : null,
        },
      }),
    onSuccess: (user) => {
      publish({ tone: 'success', title: 'Profile updated' });
      queryClient.setQueryData(queryKeys.me, user);
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save profile.';
      publish({ tone: 'danger', title: 'Update failed', description: message });
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      revokeOtherSessions: true,
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (values: PasswordValues) =>
      changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: values.revokeOtherSessions,
      }),
    onSuccess: () => {
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        revokeOtherSessions: true,
      });
      publish({ tone: 'success', title: 'Password updated' });
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiHttpError ? error.message : 'Could not change password.';
      publish({ tone: 'danger', title: 'Password change failed', description: message });
    },
  });

  if (me.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (me.error) {
    return <ErrorState error={me.error} onRetry={() => me.refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Account" description="Your profile and preferences." />
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Visible to other course members.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit((values) => update.mutate(values))}
            noValidate
          >
            <FormField
              id="displayName"
              label="Display name"
              error={form.formState.errors.displayName?.message}
              required
            >
              <Input
                id="displayName"
                invalid={Boolean(form.formState.errors.displayName)}
                {...form.register('displayName')}
              />
            </FormField>
            <FormField label="Email" id="email">
              <Input id="email" value={me.data?.email ?? ''} disabled />
            </FormField>
            <FormField
              id="locale"
              label="Locale"
              description='BCP 47 tag, e.g. "en-US"'
              error={form.formState.errors.locale?.message}
            >
              <Input id="locale" {...form.register('locale')} />
            </FormField>
            <FormField
              id="timezone"
              label="Timezone"
              description='IANA name, e.g. "America/New_York"'
              error={form.formState.errors.timezone?.message}
            >
              <Input id="timezone" {...form.register('timezone')} />
            </FormField>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={update.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Choose a new password. Existing sessions on other devices can be revoked at the same
            time so they have to sign in again with the new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={passwordForm.handleSubmit((values) => changePasswordMutation.mutate(values))}
            noValidate
          >
            <FormField
              id="currentPassword"
              label="Current password"
              error={passwordForm.formState.errors.currentPassword?.message}
              required
            >
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                invalid={Boolean(passwordForm.formState.errors.currentPassword)}
                {...passwordForm.register('currentPassword')}
              />
            </FormField>
            <div className="hidden sm:block" />
            <FormField
              id="newPassword"
              label="New password"
              description="At least 8 characters."
              error={passwordForm.formState.errors.newPassword?.message}
              required
            >
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(passwordForm.formState.errors.newPassword)}
                {...passwordForm.register('newPassword')}
              />
            </FormField>
            <FormField
              id="confirmPassword"
              label="Confirm new password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              required
            >
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
                {...passwordForm.register('confirmPassword')}
              />
            </FormField>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-(--color-text-default)">
              <input
                type="checkbox"
                {...passwordForm.register('revokeOtherSessions')}
                className="size-4 rounded-[var(--radius-xs)] border-(--color-border-default)"
              />
              Sign out other devices after updating
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={changePasswordMutation.isPending}>
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
