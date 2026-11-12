"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { homeFor } from "@/features/auth/require-role";
import { login, meQuery } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(meQuery);
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (loggedIn) => queryClient.setQueryData(meQuery.queryKey, loggedIn),
  });

  /* already signed in, or just signed in: go to that user's portal */
  useEffect(() => {
    if (user) router.replace(homeFor(user));
  }, [user, router]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({ email: String(form.get("email")), password: String(form.get("password")) });
  }

  return (
    <div className="flex min-h-svh flex-col bg-sidebar">
      <header className="flex items-center gap-2 px-6 py-5 md:px-10">
        <BrandMark className="size-7 text-xs" />
        <span className="text-sm font-semibold">Mero Event</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Request quotes, compare bids and book vendors. For Mero Event staff and partner vendors.
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" required className="h-10 bg-background" />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-10 bg-background"
                />
              </Field>
              <Field>
                <Button type="submit" size="lg" className="h-10" disabled={mutation.isPending || mutation.isSuccess}>
                  {(mutation.isPending || mutation.isSuccess) && <Spinner data-icon="inline-start" />}
                  Sign in
                </Button>
                <FieldDescription className="text-center">
                  Vendor without an account? Ask your Mero Event contact for a login.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </main>

      <footer className="px-6 py-5 text-xs text-muted-foreground md:px-10">Digital Events Pvt Ltd</footer>
    </div>
  );
}
