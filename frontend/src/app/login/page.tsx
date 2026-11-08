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
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-8" />
          <span className="font-semibold text-sidebar-accent-foreground">Mero Event</span>
        </div>
        <div className="max-w-md space-y-4">
          <p className="text-sm font-medium tracking-wide text-brand uppercase">Vendor bidding</p>
          <h2 className="text-3xl leading-tight font-semibold text-sidebar-accent-foreground">
            Request quotes, compare bids and book the right vendor for every event.
          </h2>
        </div>
        <p className="text-xs text-sidebar-foreground/60">Digital Events Pvt Ltd</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark className="size-8" />
            <span className="font-semibold">Mero Event</span>
          </div>
          <div className="mb-8 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">Mero Event staff and partner vendors.</p>
          </div>

          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-10"
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
    </div>
  );
}
