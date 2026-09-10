import "./globals.css";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const metadata = {
  title: "BuyWater – Fresh Water Delivered | Tamale",
  description: "Water delivery for UDS and environs, Tamale, Ghana",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
