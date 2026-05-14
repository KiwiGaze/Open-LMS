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
import { signUpEmail } from '@/lib/api/auth-client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const Schema = z.object({
  name: z.string().min(1, 'Tell us your name.').max(120),
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(8, 'At least 8 characters.'),
});

type Values = z.infer<typeof Schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { publish } = useToast();
  const setSession = useSessionStore((s) => s.setSession);

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: signUpEmail,
    onSuccess: (session) => {
      setSession(session);
      publish({
        tone: 'success',
        title: 'Account created',
        description: session.user.emailVerified
          ? 'You can start exploring now.'
          : 'Check your inbox to verify your email.',
      });
      router.replace('/dashboard');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : 'Could not create your account. Try again later.';
      publish({ tone: 'danger', title: 'Sign up failed', description: message });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>It only takes a minute.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField id="name" label="Name" error={form.formState.errors.name?.message} required>
            <Input
              id="name"
              autoComplete="name"
              invalid={Boolean(form.formState.errors.name)}
              {...form.register('name')}
            />
          </FormField>
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
            description="Minimum 8 characters."
            error={form.formState.errors.password?.message}
            required
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
          </FormField>
          <Button type="submit" block loading={mutation.isPending}>
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-(--color-text-muted)">
          Already have an account?{' '}
          <Link
            className="font-medium text-(--color-text-link) hover:text-(--color-text-link-hover)"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
