import type { ReactNode } from "react";
import "./globals.css";
export const metadata = { title: "AGRONEX | Agricultura inteligente", description: "Plataforma de inteligencia agrícola con observaciones de NASA" };
export default function RootLayout({ children }: {children: ReactNode}) {
  return <html lang="es"><body>{children}</body></html>;
}
