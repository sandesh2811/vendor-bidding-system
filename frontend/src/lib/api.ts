import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "vendor";
  vendorId: string | null;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // send the httpOnly session cookie set by the API
});

export async function login(input: LoginInput): Promise<User> {
  return (await api.post<User>("/auth/login", input)).data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

// 401 means "not logged in", a normal state rather than an error
export async function me(): Promise<User | null> {
  try {
    return (await api.get<User>("/auth/me")).data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) return null;
    throw e;
  }
}

export const meQuery = queryOptions({ queryKey: ["me"], queryFn: me, retry: false });

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(e)) {
    const message = e.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}
