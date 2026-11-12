import { TextField } from "@/components/form/text-field";
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { VENDOR_LIMITS } from "../../constants";
import type { CreateVendorFormInput } from "../../schemas/vendor-forms.schema";

const { NAME_MAX, EMAIL_MAX, PASSWORD_MIN, PASSWORD_MAX } = VENDOR_LIMITS;

/* the vendor's portal login, set once at creation; must sit inside the create form's FormProvider */
export function VendorLoginFields() {
  return (
    <FieldSet>
      <FieldLegend>Portal login</FieldLegend>
      <FieldDescription>Share these with the vendor so they can see requests and submit bids.</FieldDescription>
      <FieldGroup>
        <TextField<CreateVendorFormInput>
          name="loginName"
          label="Account holder"
          optional
          maxLength={NAME_MAX}
          placeholder="Defaults to contact person"
        />
        <TextField<CreateVendorFormInput>
          name="loginEmail"
          label="Login email"
          type="email"
          autoComplete="off"
          maxLength={EMAIL_MAX}
        />
        <TextField<CreateVendorFormInput>
          name="loginPassword"
          label="Temporary password"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          description={`At least ${PASSWORD_MIN} characters.`}
        />
      </FieldGroup>
    </FieldSet>
  );
}
