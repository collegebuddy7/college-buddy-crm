import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import LeadDetailClient from "./LeadDetailClient";

interface Props {
  params: { id: string };
}

export default async function LeadDetailPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get("cb_token")?.value;

  if (!token) redirect("/login");

  const agent = verifyToken(token);
  if (!agent) redirect("/login");

  return <LeadDetailClient leadId={params.id} agent={agent} />;
}