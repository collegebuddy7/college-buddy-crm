import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("cb_token")?.value;
  if (!token) redirect("/admin/login");

  const agent = verifyToken(token);
  if (!agent || !agent.isAdmin) redirect("/admin/login");

  return <AdminDashboardClient agent={agent} />;
}
