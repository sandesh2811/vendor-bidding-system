"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { errorMessage, login, meQuery } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(meQuery.queryKey, user);
      router.push("/");
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({ email: String(form.get("email")), password: String(form.get("password")) });
  }

  return (
    <main className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Log in</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="rounded border px-3 py-2" />
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="rounded border px-3 py-2" />
        {mutation.isError && (
          <p role="alert" className="text-sm text-red-600">{errorMessage(mutation.error)}</p>
        )}
        <button type="submit" disabled={mutation.isPending} className="rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-50">
          {mutation.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        No account? Ask Mero Event for your vendor login.
      </p>
    </main>
  );
}
