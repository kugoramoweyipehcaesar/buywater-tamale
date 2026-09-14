"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="buywater-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
