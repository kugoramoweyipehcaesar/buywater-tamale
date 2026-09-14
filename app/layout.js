import "./globals.css";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata = {
  title: "BuyWater – Fresh Water Delivered | Tamale",
  description: "Water delivery for UDS and environs, Tamale, Ghana",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#EEF6FC] text-slate-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>
          {children}
          <WhatsAppFloat />
        </ThemeProvider>
      </body>
    </html>
  );
}
