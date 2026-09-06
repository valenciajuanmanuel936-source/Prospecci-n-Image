import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { LoginGate } from "@/components/LoginGate";

export const metadata: Metadata = {
  title: "Copiloto de Setting — IMAGE",
  description:
    "Copiloto de setting y prospección por Instagram para el programa IMAGE. Guía conversaciones fase a fase con mensajes sugeridos.",
};

export const viewport: Viewport = {
  themeColor: "#221f1c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <LoginGate>
          <StoreProvider>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </LoginGate>
      </body>
    </html>
  );
}
