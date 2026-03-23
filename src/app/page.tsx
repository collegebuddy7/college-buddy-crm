import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default function Home() {
  const cookieStore = cookies();
  const token = cookieStore.get("cb_token")?.value;
  const agent = token ? verifyToken(token) : null;
  if (agent) redirect("/dashboard");
  redirect("/login");
}