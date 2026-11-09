import type { BidStatus } from "@/features/quotations/constants";

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  submitted: "Submitted",
  selected: "Selected",
  rejected: "Rejected",
};
