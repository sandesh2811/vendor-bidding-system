"use client";

import type { ComponentProps, ReactNode } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./form-field";
import { PasswordInput } from "./password-input";

type TextControlProps = Pick<
  ComponentProps<"input">,
  "placeholder" | "maxLength" | "inputMode" | "autoComplete" | "type"
> & { rows?: number };

/* a react-hook-form text input (textarea with `multiline`, show/hide toggle with `type="password"`) with its label and error */
export function TextField<TValues extends FieldValues>({
  name,
  label,
  optional,
  description,
  hideLabel,
  multiline,
  className,
  rows,
  inputClassName,
  ...inputProps
}: TextControlProps & {
  /* styles the input itself (e.g. height), where className styles the field wrapper */
  inputClassName?: string;
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
        if (multiline)
          return <Textarea {...shared} rows={rows} placeholder={inputProps.placeholder} maxLength={inputProps.maxLength} />;
        if (inputProps.type === "password") return <PasswordInput {...shared} {...inputProps} className={inputClassName} />;
        return <Input {...shared} {...inputProps} className={inputClassName} />;
      }}
    </FormField>
  );
}
