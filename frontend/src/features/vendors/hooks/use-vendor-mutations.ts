import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createVendor, updateVendor, vendorKeys } from "../api/vendors.api";
import type { CreateVendorInput, UpdateVendorInput } from "../types";

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVendorInput) => createVendor(input),
    onSuccess: (vendor) => {
      toast.success(`${vendor.name} added`, {
        description: "They can now sign in to the vendor portal.",
      });
      return queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVendorInput }) => updateVendor(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}
