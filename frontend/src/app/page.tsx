"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { errorMessage, logout, meQuery } from "@/lib/api";

export default function HomePage() {
  const queryClient = useQueryClient();
  const { data: user, isPending, isError, error } = useQuery(meQuery);
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.setQueryData(meQuery.queryKey, null),
  });

  if (isPending) return <p>Loading…</p>;
  if (isError) return <p role="alert" className="text-red-600">{errorMessage(error)}</p>;

  if (!user) {
    return (
      <main className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-semibold">Vendor Bidding System</h1>
        <Link href="/login" className="rounded bg-gray-900 px-4 py-2 text-white">Log in</Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center gap-2">
      <h1 className="text-xl font-semibold">Welcome, {user.name}</h1>
      <p className="text-gray-600">{user.email} · {user.role}</p>
      {logoutMutation.isError && (
        <p role="alert" className="text-sm text-red-600">{errorMessage(logoutMutation.error)}</p>
      )}
      <button
        type="button"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="mt-2 rounded border px-4 py-2 disabled:opacity-50"
      >
        Log out
      </button>
    </main>
  );
}
