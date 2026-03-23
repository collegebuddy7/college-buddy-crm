import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("cb_token")?.value;

  if (!token) redirect("/login");

  const agent = verifyToken(token);
  if (!agent) redirect("/login");

  return <DashboardClient agent={agent} />;
}