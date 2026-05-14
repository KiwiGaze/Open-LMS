'use client';

import { FormField } from '@/components/patterns/form-field.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Tenant } from '@openlms/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const Schema = z.object({
  displayName: z.string().min(1, 'Required.').max(160),
  slug: z
    .string()
    .min(3, 'At least 3 characters.')
    .max(64)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Lowercase letters, numbers, and hyphens only.'),
});

type Values = z.infer<typeof Schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { publish } = useToast();
  const setActiveTenant = useSessionStore((s) => s.setActiveTenant);

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { displayName: '', slug: '' },
  });

  const create = useMutation({
    mutationFn: (values: Values) =>
      apiFetch<Tenant>('/onboarding/create-tenant', {
        method: 'POST',
        body: values,
      }),
    onSuccess: (tenant) => {
      setActiveTenant(tenant.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants() });
      publish({
        tone: 'success',
        title: 'Institution created',
        description: `${tenant.displayName} is now your active tenant.`,
      });
      router.replace('/dashboard');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not create institution.';
      publish({ tone: 'danger', title: 'Setup failed', description: message });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <div className="mb-2 inline-flex size-10 items-center justify-center rounded-full bg-(--color-brand-subtle) text-(--color-brand-700)">
            <Building2 className="size-5" aria-hidden />
          </div>
          <CardTitle>Create your institution</CardTitle>
          <CardDescription>
            One last step before you can start teaching or learning. Pick a name and a short slug
            for the URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
            noValidate
          >
            <FormField
              id="displayName"
              label="Institution name"
              error={form.formState.errors.displayName?.message}
              required
            >
              <Input
                id="displayName"
                placeholder="Acme University"
                invalid={Boolean(form.formState.errors.displayName)}
                {...form.register('displayName')}
              />
            </FormField>
            <FormField
              id="slug"
              label="Slug"
              description='URL-safe handle, e.g. "acme-u"'
              error={form.formState.errors.slug?.message}
              required
            >
              <Input
                id="slug"
                placeholder="acme-u"
                autoCapitalize="none"
                autoComplete="off"
                invalid={Boolean(form.formState.errors.slug)}
                {...form.register('slug')}
              />
            </FormField>
            <Button type="submit" block loading={create.isPending}>
              Create institution
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
