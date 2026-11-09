import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api, type Paginated } from "@/lib/api";
import type {
  Booking,
  BookingDetail,
  CreatePaymentInput,
  ListBookingsParams,
  Payment,
  UpdateBookingInput,
  VendorBookingDetail,
} from "../types";

/* admin and vendor reads share the root key, so one invalidation refreshes both */
export const bookingKeys = {
  all: ["bookings"] as const,
  list: (params: ListBookingsParams) => [...bookingKeys.all, "list", params] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
  vendorList: (params: { page: number; limit: number }) => [...bookingKeys.all, "vendor", "list", params] as const,
  vendorDetail: (id: string) => [...bookingKeys.all, "vendor", "detail", id] as const,
};

export async function listBookings(params: ListBookingsParams): Promise<Paginated<Booking>> {
  return (await api.get<Paginated<Booking>>("/bookings", { params })).data;
}

export async function getBooking(id: string): Promise<BookingDetail> {
  return (await api.get<BookingDetail>(`/bookings/${id}`)).data;
}

/* idempotent: the same change again leaves the same booking */
export async function updateBooking(id: string, input: UpdateBookingInput): Promise<BookingDetail> {
  return (await api.patch<BookingDetail>(`/bookings/${id}`, input)).data;
}

export async function addPayment(id: string, input: CreatePaymentInput): Promise<Payment> {
  return (await api.post<Payment>(`/bookings/${id}/payments`, input)).data;
}

/* idempotent: deleting a payment that's already gone is a no-op */
export async function deletePayment(id: string, paymentId: string): Promise<void> {
  await api.delete(`/bookings/${id}/payments/${paymentId}`);
}

export async function listVendorBookings(params: { page: number; limit: number }): Promise<Paginated<Booking>> {
  return (await api.get<Paginated<Booking>>("/vendor/bookings", { params })).data;
}

export async function getVendorBooking(id: string): Promise<VendorBookingDetail> {
  return (await api.get<VendorBookingDetail>(`/vendor/bookings/${id}`)).data;
}

export const bookingsQuery = (params: ListBookingsParams) =>
  queryOptions({
    queryKey: bookingKeys.list(params),
    queryFn: () => listBookings(params),
    placeholderData: keepPreviousData,
  });

export const bookingQuery = (id: string) =>
  queryOptions({
    queryKey: bookingKeys.detail(id),
    queryFn: () => getBooking(id),
  });

export const vendorBookingsQuery = (params: { page: number; limit: number }) =>
  queryOptions({
    queryKey: bookingKeys.vendorList(params),
    queryFn: () => listVendorBookings(params),
    placeholderData: keepPreviousData,
  });

export const vendorBookingQuery = (id: string) =>
  queryOptions({
    queryKey: bookingKeys.vendorDetail(id),
    queryFn: () => getVendorBooking(id),
  });
