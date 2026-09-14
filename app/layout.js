import "./globals.css";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ThemeProvider from "@/components/ThemeProvider";
import PwaRegister from "@/components/PwaRegister";

export const metadata = {
  title: "BuyWater Tamale – Fresh Water Delivered",
  description: "Water delivery for UDS and environs, Tamale, Ghana",
  applicationName: "BuyWater Tamale",
  manifest: "/manifest.json",
  themeColor: "#0077C8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BuyWater Tamale",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.jpg", type: "image/jpeg" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0077C8",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0077C8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BuyWater Tamale" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-[#EEF6FC] text-slate-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>
          {children}
          <WhatsAppFloat />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
