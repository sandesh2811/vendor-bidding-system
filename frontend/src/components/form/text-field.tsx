"use client";

import type { ComponentProps, ReactNode } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./form-field";

type TextControlProps = Pick<
  ComponentProps<"input">,
  "placeholder" | "maxLength" | "inputMode" | "autoComplete" | "type"
> & { rows?: number };

/* a react-hook-form text input (or textarea with `multiline`) with its label and error */
export function TextField<TValues extends FieldValues>({
  name,
  label,
  optional,
  description,
  hideLabel,
  multiline,
  className,
  rows,
  ...inputProps
}: TextControlProps & {
  name: FieldPath<TValues>;
  label: string;
  optional?: boolean;
  description?: ReactNode;
  hideLabel?: boolean;
  multiline?: boolean;
  className?: string;
}) {
  return (
    <FormField<TValues> name={name} label={label} optional={optional} description={description} hideLabel={hideLabel} className={className}>
      {({ field, id, invalid }) => {
        const shared = { ...field, value: field.value ?? "", id, "aria-invalid": invalid };
        return multiline ? (
          <Textarea {...shared} rows={rows} placeholder={inputProps.placeholder} maxLength={inputProps.maxLength} />
        ) : (
          <Input {...shared} {...inputProps} />
        );
      }}
    </FormField>
  );
}
