import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import LeadsClient from "./LeadsClient";

interface Props {
  searchParams: { type?: string; status?: string; interest?: string; search?: string };
}

export default async function LeadsPage({ searchParams }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get("cb_token")?.value;

  if (!token) redirect("/login");

  const agent = verifyToken(token);
  if (!agent) redirect("/login");

  return <LeadsClient agent={agent} searchParams={searchParams} />;
}