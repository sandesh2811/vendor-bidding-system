import { OptionalHint } from "@/components/form/optional-hint";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { VENDOR_LIMITS } from "../../constants";

const { NAME_MAX, EMAIL_MAX, PASSWORD_MIN, PASSWORD_MAX } = VENDOR_LIMITS;

/* the vendor's portal login, set once at creation; read back with readCreateVendor */
export function VendorLoginFields() {
  return (
    <FieldSet>
      <FieldLegend>Portal login</FieldLegend>
      <FieldDescription>Share these with the vendor so they can see requests and submit bids.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="login-name">
            Account holder <OptionalHint />
          </FieldLabel>
          <Input id="login-name" name="loginName" maxLength={NAME_MAX} placeholder="Defaults to contact person" />
        </Field>
        <Field>
          <FieldLabel htmlFor="login-email">Login email</FieldLabel>
          <Input id="login-email" name="loginEmail" type="email" required maxLength={EMAIL_MAX} autoComplete="off" />
        </Field>
        <Field>
          <FieldLabel htmlFor="login-password">Temporary password</FieldLabel>
          <Input
            id="login-password"
            name="loginPassword"
            type="password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            autoComplete="new-password"
          />
          <FieldDescription>At least {PASSWORD_MIN} characters.</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
