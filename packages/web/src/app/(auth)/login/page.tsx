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
import { signInEmail } from '@/lib/api/auth-client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const Schema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

type Values = z.infer<typeof Schema>;

export default function LoginPage() {
  const router = useRouter();
  const { publish } = useToast();
  const setSession = useSessionStore((s) => s.setSession);

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: signInEmail,
    onSuccess: (session) => {
      setSession(session);
      publish({ tone: 'success', title: 'Welcome back', description: session.user.email });
      router.replace('/dashboard');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : 'Something went wrong while signing in. Please try again.';
      publish({ tone: 'danger', title: 'Could not sign in', description: message });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back. Sign in to continue learning.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField id="email" label="Email" error={form.formState.errors.email?.message} required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
          </FormField>
          <FormField
            id="password"
            label="Password"
            error={form.formState.errors.password?.message}
            required
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
          </FormField>
          <Button type="submit" block loading={mutation.isPending}>
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-(--color-text-muted)">
          New to Open-LMS?{' '}
          <Link
            className="font-medium text-(--color-text-link) hover:text-(--color-text-link-hover)"
            href="/register"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
