import { useEffect, useMemo } from "react";

/* blob: URLs previewing local files, revoked when the files change or the component unmounts */
export function useObjectUrls(files: File[]): string[] {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);

  return urls;
}
