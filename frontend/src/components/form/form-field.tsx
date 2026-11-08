"use client";

import type { ReactNode } from "react";
import { type ControllerRenderProps, type FieldPath, type FieldValues, useController, useFormContext } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { OptionalHint } from "./optional-hint";

export interface FormFieldControl<TValues extends FieldValues, TName extends FieldPath<TValues>> {
  field: ControllerRenderProps<TValues, TName>;
  id: string;
  invalid: boolean;
}

/* label, control, hint and validation message for one react-hook-form field; the control is a render prop */
export function FormField<TValues extends FieldValues, TName extends FieldPath<TValues> = FieldPath<TValues>>({
  name,
  label,
  optional,
  description,
  hideLabel,
  className,
  children,
}: {
  name: TName;
  label: string;
  optional?: boolean;
  description?: ReactNode;
  hideLabel?: boolean;
  className?: string;
  children: (control: FormFieldControl<TValues, TName>) => ReactNode;
}) {
  const { control } = useFormContext<TValues>();
  const { field, fieldState } = useController<TValues, TName>({ name, control });
  const id = `field-${name.replaceAll(".", "-")}`;
  const invalid = fieldState.invalid;

  return (
    <Field data-invalid={invalid} className={className}>
      <FieldLabel htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
        {optional && <OptionalHint />}
      </FieldLabel>
      {children({ field, id, invalid })}
      {description && !invalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[fieldState.error]} />
    </Field>
  );
}
