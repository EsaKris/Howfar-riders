import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function RootPage() {
  const cookieStore = cookies();
  const isLoggedIn  = cookieStore.has("hfc_logged_in");
  redirect(isLoggedIn ? "/dashboard" : "/login");
}
