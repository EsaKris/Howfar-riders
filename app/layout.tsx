import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"], variable: "--font-syne",
  weight: ["400","600","700","800"], display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"], variable: "--font-jakarta",
  weight: ["300","400","500","600","700"], display: "swap",
});

export const metadata: Metadata = {
  title: "HFC — Request a Ride",
  description: "Fast, safe bike rides anywhere in Makurdi for ₦500.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#09090F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${jakarta.variable} font-body bg-hfc-black text-hfc-light antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
