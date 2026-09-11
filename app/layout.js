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
      <body className="min-h-screen transition-colors duration-300">
        <ThemeProvider>
          {children}
          <WhatsAppFloat />
        </ThemeProvider>
      </body>
    </html>
  );
}
