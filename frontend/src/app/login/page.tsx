"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { BrandMark } from "@/components/layout/brand-mark";
import { LinkButton } from "@/components/layout/link-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { type LoginFormValues, loginSchema } from "@/features/auth/login.schema";
import { homeFor } from "@/features/auth/require-role";
import { errorMessage, login, meQuery } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(meQuery);
  /* signing in replaces any current session (the API revokes it), so nothing cached for the previous account may survive */
  const mutation = useMutation({
    mutationFn: login,
    /* wrong credentials and rate limits are shown in the form, not as a toast */
    meta: { inlineError: true },
    onSuccess: (loggedIn) => {
      queryClient.clear();
      queryClient.setQueryData(meQuery.queryKey, loggedIn);
      router.replace(homeFor(loggedIn));
    },
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

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

          {/* already signed in: the form stays usable so another account can sign in */}
          {user && !mutation.isSuccess && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3 text-sm">
              <span className="min-w-0 truncate">
                Signed in as <span className="font-medium">{user.email}</span>
              </span>
              <LinkButton variant="outline" size="sm" href={homeFor(user)}>
                Continue
              </LinkButton>
            </div>
          )}

          <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <FieldGroup>
                {mutation.isError && (
                  <Alert variant="destructive" role="alert">
                    <CircleAlertIcon />
                    <AlertDescription>{errorMessage(mutation.error)}</AlertDescription>
                  </Alert>
                )}
                <TextField<LoginFormValues>
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  inputClassName="h-10 bg-background"
                />
                <TextField<LoginFormValues>
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  inputClassName="h-10 bg-background"
                />
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
          </FormProvider>
        </div>
      </main>

      <footer className="px-6 py-5 text-xs text-muted-foreground md:px-10">Digital Events Pvt Ltd</footer>
    </div>
  );
}
