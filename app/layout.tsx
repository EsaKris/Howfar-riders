import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://riders-howfartransports.onrender.com"),

  title: {
    default: "User Login | Howfar Transport Company (HFC)",
    template: "%s | HFC User Portal",
  },

  description:
    "Secure User login portal for Howfar Transport Company (HFC). Sign in to request ₦500 fixed-fare bike rides, manage trips, and access your ride dashboard in Makurdi, Benue State, Nigeria.",

  keywords: [
    "Howfar Transport Company login",
    "HFC User login",
    "request bike ride Makurdi",
    "₦500 bike ride Makurdi",
    "HFC user dashboard",
    "Makurdi bike transport app",
  ],

  authors: [{ name: "Howfar Transport Company" }],
  creator: "Howfar Transport Company",
  publisher: "Howfar Transport Company",

  robots: {
    index: true,
    follow: false,
    googleBot: {
      index: true,
      follow: false,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: "/img/logo.png",
    shortcut: "/img/logo.png",
    apple: "/img/logo.png",
  },

  openGraph: {
    title: "User Login — Howfar Transport Company (HFC)",
    description:
      "Sign in to your HFC account to request safe, affordable ₦500 bike rides and manage your trips in Makurdi, Benue State.",
    url: "https://riders-howfartransports.onrender.com/",
    siteName: "Howfar Transport Company",
    type: "website",
    locale: "en_NG",
    images: [
      {
        url: "/img/login.jpeg",
        width: 1080,
        height: 1350,
        alt: "Howfar Transport Company User login and ride dashboard",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "HFC User Login | ₦500 Bike Rides in Makurdi",
    description:
      "Access your Howfar Transport Company account. Book fast, safe ₦500 bike rides in Makurdi, Benue State.",
    images: ["/img/login.jpeg"],
  },

  alternates: {
    canonical: "https://riders-howfartransports.onrender.com/",
  },

  category: "Transportation",

  // Google Search Console Verification (CORRECT WAY)
  verification: {
    google: "4FP3mrdBA1hcJ7hYmRwpeCg2p1M5cZIdkX1P_Q3S4QY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-NG">
      <body
        className={`${syne.variable} ${jakarta.variable} font-body bg-hfc-black text-hfc-light antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
