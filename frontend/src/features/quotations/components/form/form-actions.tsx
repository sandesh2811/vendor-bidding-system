import { PendingButton } from "@/components/form/pending-button";
import { LinkButton } from "@/components/layout/link-button";

/* Cancel + submit for a page-level form; the submit is linked to the form by id so it can live anywhere */
export function FormActions({
  formId,
  cancelHref,
  submitLabel,
  pending,
}: {
  formId: string;
  cancelHref: string;
  submitLabel: string;
  pending: boolean;
}) {
  return (
    <>
      <LinkButton variant="outline" href={cancelHref}>
        Cancel
      </LinkButton>
      <PendingButton type="submit" form={formId} pending={pending}>
        {submitLabel}
      </PendingButton>
    </>
  );
}
