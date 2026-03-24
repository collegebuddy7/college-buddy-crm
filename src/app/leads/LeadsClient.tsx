"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { StatusBadge, InterestBadge } from "@/components/Badges";
import type { Account } from "@/types";

interface Props {
  agent: { agentId: string; name: string; mobile: string; isAdmin: boolean };
  searchParams: { type?: string; status?: string; interest?: string; search?: string };
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "New", value: "NEW" },
  { label: "Lead", value: "LEAD" },
  { label: "Interested", value: "INTERESTED" },
  { label: "Enrolled", value: "ENROLLED" },
  { label: "Not Interested", value: "NOT_INTERESTED" },
];

const INTEREST_FILTERS = [
  { label: "Any", value: "" },
  { label: "High", value: "HIGH" },
  { label: "Mid", value: "MID" },
  { label: "Low", value: "LOW" },
];

const TYPE_LABELS: Record<string, string> = {
  new: "New Leads",
  followup: "Follow Up",
  all: "All Leads",
};

export default function LeadsClient({ agent, searchParams }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.search || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.status || "");
  const [interestFilter, setInterestFilter] = useState(searchParams.interest || "");
  const type = searchParams.type || "all";

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (statusFilter) params.set("status", statusFilter);
      if (interestFilter) params.set("interest", interestFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [type, statusFilter, interestFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchLeads, 300);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  return (
    <div className="min-h-screen" style={{ background: "#f4f7fa" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 shadow-sm"
        style={{ background: "linear-gradient(135deg, #1B3D5C 0%, #2A5A8A 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Logo small */}
          <Image src="/images/mascot-only.png" alt="CB" width={28} height={28} className="object-contain" />

          <div className="flex-1">
            <h1 className="font-bold text-white text-sm leading-none">
              {TYPE_LABELS[type] || "Leads"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              {leads.length} records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs hidden sm:block" style={{ color: "rgba(255,255,255,0.7)" }}>{agent.name}</span>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.replace("/login");
              }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{ background: "rgba(220,38,38,0.8)", color: "white" }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9bb0c4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, college, or number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "white", border: "1.5px solid #dce8f0", color: "#1B3D5C" }}
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: statusFilter === f.value ? "#1B3D5C" : "white",
                color: statusFilter === f.value ? "white" : "#4a6580",
                border: `1.5px solid ${statusFilter === f.value ? "#1B3D5C" : "#dce8f0"}`,
              }}
            >{f.label}</button>
          ))}
        </div>

        {/* Interest filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 items-center">
          <span className="text-xs font-medium flex-shrink-0" style={{ color: "#8aa8bc" }}>Interest:</span>
          {INTEREST_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setInterestFilter(f.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: interestFilter === f.value ? "#6AAF3D" : "white",
                color: interestFilter === f.value ? "white" : "#4a6580",
                border: `1.5px solid ${interestFilter === f.value ? "#6AAF3D" : "#dce8f0"}`,
              }}
            >{f.label}</button>
          ))}
        </div>

        {/* Lead cards */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <Image src="/images/mascot-only.png" alt="no leads" width={80} height={80} className="mx-auto mb-4 opacity-40" />
            <p className="font-semibold" style={{ color: "#4a6580" }}>No leads found</p>
            <p className="text-sm mt-1" style={{ color: "#9bb0c4" }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-6">
            {leads.map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`}
                className="block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "white", border: "1.5px solid #eaf0f6", boxShadow: "0 2px 8px rgba(27,61,92,0.06)" }}
              >
                <div className="p-4 flex items-start gap-3">
                  {/* Mascot avatar */}
                  <div
                    className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #eef6ff, #e8f8e0)" }}
                  >
                    <Image src="/images/mascot-only.png" alt="student" width={40} height={40} className="object-contain" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm leading-tight" style={{ color: "#1B3D5C" }}>{lead.name}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#6a8fa8" }}>{lead.college}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusBadge status={lead.status} />
                        <InterestBadge interest={lead.interest} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ background: "#f0f4f8", color: "#6a8fa8" }}>
                        #{lead.sr}
                      </span>
                      <span className="text-xs" style={{ color: "#9bb0c4" }}>{lead.session}</span>
                      <a
                        href={`tel:${lead.number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs font-semibold ml-auto px-2.5 py-1 rounded-lg transition-colors"
                        style={{ background: "#e8f8e0", color: "#4a8c1c" }}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        Call
                      </a>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}