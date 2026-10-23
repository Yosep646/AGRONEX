import type { ReactNode } from "react";
export const metadata = { title: "AGRONEX", description: "Datos NASA para una agricultura más informada" };
export default function RootLayout({ children }: {children: ReactNode}) {
  return <html lang="es"><body style={{margin:0,fontFamily:"Arial,sans-serif",background:"#f2f7f4",color:"#153429"}}>{children}</body></html>;
}
