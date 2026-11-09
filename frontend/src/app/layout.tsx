import type { Metadata } from "next";
import { Figtree, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

/* Figtree is the Mero Event brand typeface */
const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
/* display serif, used sparingly (sign-in headline) */
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "Mero Event · Vendor Portal", template: "%s · Mero Event" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full antialiased", figtree.variable, display.variable)}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
