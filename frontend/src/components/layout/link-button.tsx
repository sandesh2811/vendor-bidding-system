import Link from "next/link";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/* a Next.js link styled as a Button */
export function LinkButton({ href, ...props }: Omit<ComponentProps<typeof Button>, "render" | "nativeButton"> & { href: string }) {
  return <Button render={<Link href={href} />} nativeButton={false} {...props} />;
}
