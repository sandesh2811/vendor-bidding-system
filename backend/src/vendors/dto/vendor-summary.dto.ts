/* what needs the vendor's attention, for the portal home */
export class VendorSummaryDto {
  /* sent to it, open, no bid and not declined */
  newRequests: number;
  /* its bids still waiting for a decision */
  bidsInProgress: number;
  /* its confirmed bookings */
  upcomingBookings: number;
}
