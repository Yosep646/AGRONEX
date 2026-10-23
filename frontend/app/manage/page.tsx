import { redirect } from "next/navigation";

/** La gestión de parcelas forma parte del dashboard profesional. */
export default function ManagePage(){redirect("/dashboard?section=parcels");}
