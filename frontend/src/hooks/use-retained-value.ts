import { useState } from "react";

/* the last non-null value: keeps a sheet or dialog's content on screen while it animates closed */
export function useRetainedValue<T>(value: T | null): T | null {
  const [retained, setRetained] = useState(value);
  if (value !== null && value !== retained) setRetained(value);
  return value ?? retained;
}
