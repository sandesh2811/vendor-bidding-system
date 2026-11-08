import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/* a submit/confirm button that disables itself and shows a spinner while its request runs */
export function PendingButton({
  pending,
  disabled,
  children,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean }) {
  return (
    <Button disabled={pending || disabled} {...props}>
      {pending && <Spinner data-icon="inline-start" />}
      {children}
    </Button>
  );
}
