import { redirect } from "next/navigation";

/** El dashboard existente es la única portada oficial de AGRONEX. */
export default function HomePage() {
  redirect("/dashboard");
}
