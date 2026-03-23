"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Agent { id: string; name: string; mobile: string; isAdmin: boolean; createdAt: string; _count?: { assignedLeads: number }; }
interface Lead { id: string; sr: number; name: string; college: string; number: string; session: string; status: string; interest: string; followUpDate?: string; createdAt: string; assignedAgent?: { id: string; name: string } | null; }
interface College { college: string; _count: { college: number }; }
interface DuplicateLead { row: Record<string, string>; existing: Lead; index: number; }
interface AgentPerf { id: string; name: string; mobile: string; callsToday: number; callsOnDate: number; totalCalls: number; }

interface Props { agent: { agentId: string; name: string; mobile: string; isAdmin: boolean }; }

const TABS = ["Overview", "Assignments", "Leads", "Import CSV", "Agents", "Performance"];
const STATUS_COLORS: Record<string, string> = { NEW:"bg-amber-100 text-amber-700", LEAD:"bg-blue-100 text-blue-700", INTERESTED:"bg-purple-100 text-purple-700", ENROLLED:"bg-green-100 text-green-700", NOT_INTERESTED:"bg-red-100 text-red-700" };
const INTEREST_COLORS: Record<string, string> = { HIGH:"bg-green-100 text-green-700", MID:"bg-amber-100 text-amber-700", LOW:"bg-red-100 text-red-700" };

export default function AdminDashboardClient({ agent }: Props) {
  const [tab, setTab] = useState("Overview");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [interestFilter, setInterestFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  // Assignment
  const [assignType, setAssignType] = useState<"college"|"range"|"individual">("college");
  const [assignAgentId, setAssignAgentId] = useState("");
  const [assignCollege, setAssignCollege] = useState("");
  const [assignSrFrom, setAssignSrFrom] = useState("");
  const [assignSrTo, setAssignSrTo] = useState("");
  const [assignLeadSearch, setAssignLeadSearch] = useState("");
  const [assignLeadId, setAssignLeadId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // CSV
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [duplicateActions, setDuplicateActions] = useState<Record<number, "skip"|"overwrite">>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{imported:number;skipped:number;overwritten:number;errors:number}|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Agent form
  const [agentForm, setAgentForm] = useState({ name:"", mobile:"", password:"", isAdmin:false });
  const [agentSaving, setAgentSaving] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent|null>(null);
  const [editPassword, setEditPassword] = useState("");

  // Performance
  const [perfDate, setPerfDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [perfData, setPerfData] = useState<AgentPerf[]>([]);
  const [perfLoading, setPerfLoading] = useState(false);

  // WhatsApp template
  const [waTemplate, setWaTemplate] = useState("Hi {name}, this is College Buddy. We wanted to follow up about your admission inquiry. Please call us at your convenience.");
  const [showWaTemplate, setShowWaTemplate] = useState(false);

  // Delete selected
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    const res = await fetch("/api/leads?type=all");
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
    setLeadsLoading(false);
  }, []);

  const fetchAgents = useCallback(async () => {
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(Array.isArray(data) ? data : []);
  }, []);

  const fetchAssignmentData = useCallback(async () => {
    const res = await fetch("/api/admin/assign");
    const data = await res.json();
    if (data.agents) setAgents(data.agents);
    if (data.colleges) setColleges(data.colleges);
  }, []);

  const fetchPerformance = useCallback(async () => {
    setPerfLoading(true);
    const res = await fetch(`/api/admin/performance?date=${perfDate}`);
    const data = await res.json();
    setPerfData(Array.isArray(data) ? data : []);
    setPerfLoading(false);
  }, [perfDate]);

  useEffect(() => { fetchLeads(); fetchAgents(); fetchAssignmentData(); }, [fetchLeads, fetchAgents, fetchAssignmentData]);
  useEffect(() => { if (tab === "Performance") fetchPerformance(); }, [tab, fetchPerformance]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/admin/login");
  }

  // ── WhatsApp ──
  function sendWhatsApp(number: string, name: string) {
    const msg = waTemplate.replace("{name}", name).replace("{number}", number);
    const cleaned = number.replace(/\D/g, "");
    const phone = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  // ── ASSIGN ──
  async function handleAssign() {
    if (!assignAgentId) return toast.error("Please select an agent");
    if (assignType === "college" && !assignCollege) return toast.error("Please select a college");
    if (assignType === "range" && (!assignSrFrom || !assignSrTo)) return toast.error("Please enter ID range");
    if (assignType === "individual" && !assignLeadId) return toast.error("Please select a lead");
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: assignType, agentId: assignAgentId, college: assignCollege, srFrom: assignSrFrom, srTo: assignSrTo, leadId: assignLeadId }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ ${data.assigned} lead(s) assigned!`);
      setTimeout(() => { fetchLeads(); fetchAssignmentData(); }, 500);
      setAssignCollege(""); setAssignSrFrom(""); setAssignSrTo(""); setAssignLeadId(""); setAssignLeadSearch("");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setAssigning(false); }
  }

  // ── CSV ──
  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/['"]/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
      return obj;
    }).filter(row => row.name || row.number);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    setCsvData(rows); setImportResult(null); setDuplicates([]); setDuplicateActions({});
    const numbers = rows.map(r => r.number).filter(Boolean);
    const res = await fetch("/api/admin/check-duplicates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numbers }),
    });
    const data = await res.json();
    if (data.duplicates?.length > 0) {
      const dups: DuplicateLead[] = data.duplicates.map((d: { number: string; existing: Lead }) => {
        const idx = rows.findIndex(r => r.number === d.number);
        return { row: rows[idx], existing: d.existing, index: idx };
      });
      setDuplicates(dups);
      toast(`Found ${dups.length} duplicate(s)`, { icon: "⚠️" });
    } else {
      toast.success(`${rows.length} rows loaded, no duplicates!`);
    }
  }

  function setAllDuplicateActions(action: "skip"|"overwrite") {
    const newActions: Record<number, "skip"|"overwrite"> = {};
    duplicates.forEach(d => { newActions[d.index] = action; });
    setDuplicateActions(newActions);
  }

  async function handleImport() {
    if (!csvData.length) return;
    setImporting(true); setImportProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12;
      if (progress >= 88) { clearInterval(interval); progress = 88; }
      setImportProgress(Math.round(progress));
    }, 250);
    try {
      const res = await fetch("/api/admin/import-csv", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: csvData, duplicateActions }),
      });
      const text = await res.text();
      if (!text) throw new Error("Empty response");
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error);
      clearInterval(interval); setImportProgress(100);
      setTimeout(() => {
        setImportResult(data); setImporting(false); setImportProgress(0);
        toast.success(`✅ ${data.imported} imported!`);
        setCsvData([]); setDuplicates([]); fetchLeads();
      }, 600);
    } catch (err: unknown) {
      clearInterval(interval); setImportProgress(0); setImporting(false);
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  }

  function handleExport() {
    const headers = ["sr","name","college","number","session","status","interest","assignedAgent","followUpDate"];
    const rows = leads.map(l => [l.sr, l.name, l.college, l.number, l.session, l.status, l.interest, l.assignedAgent?.name||"", l.followUpDate ? format(new Date(l.followUpDate),"yyyy-MM-dd") : ""]);
    const csv = [headers,...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`leads-${format(new Date(),"yyyy-MM-dd")}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }

  // ── Delete ──
  async function handleDeleteLead(id: string, name: string) {
    if (!confirm(`Delete lead "${name}"?`)) return;
    const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchLeads(); }
    else toast.error("Failed");
  }

  async function handleDeleteSelected() {
    if (!selectedLeads.size) return;
    if (!confirm(`Delete ${selectedLeads.size} selected leads? This cannot be undone.`)) return;
    setDeletingAll(true);
    let deleted = 0;
    for (const id of selectedLeads) {
      const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
      if (res.ok) deleted++;
    }
    toast.success(`Deleted ${deleted} leads`);
    setSelectedLeads(new Set());
    fetchLeads();
    setDeletingAll(false);
  }

  async function handleDeleteAll() {
    if (!confirm(`Delete ALL ${filteredLeads.length} filtered leads? This CANNOT be undone!`)) return;
    if (!confirm("Are you absolutely sure? This will permanently delete all filtered leads!")) return;
    setDeletingAll(true);
    let deleted = 0;
    for (const lead of filteredLeads) {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      if (res.ok) deleted++;
    }
    toast.success(`Deleted ${deleted} leads`);
    fetchLeads();
    setDeletingAll(false);
  }

  // ── Agents ──
  async function handleCreateAgent(e: React.FormEvent) {
    e.preventDefault(); setAgentSaving(true);
    try {
      const res = await fetch("/api/agents", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(agentForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Agent ${data.name} created!`);
      setAgentForm({ name:"",mobile:"",password:"",isAdmin:false });
      fetchAgents(); fetchAssignmentData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setAgentSaving(false); }
  }

  async function handleDeleteAgent(id: string, name: string) {
    if (!confirm(`Delete agent "${name}"?`)) return;
    const res = await fetch(`/api/agents/${id}`, { method:"DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchAgents(); }
    else toast.error("Failed");
  }

  async function handleUpdateAgent(e: React.FormEvent) {
    e.preventDefault(); if (!editAgent) return;
    const res = await fetch(`/api/agents/${editAgent.id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ name:editAgent.name, isAdmin:editAgent.isAdmin, ...(editPassword && {password:editPassword}) }),
    });
    if (res.ok) { toast.success("Updated!"); setEditAgent(null); setEditPassword(""); fetchAgents(); }
    else toast.error("Failed");
  }

  // Filtered leads
  const filteredLeads = leads.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.college.toLowerCase().includes(search.toLowerCase()) || l.number.includes(search);
    const matchStatus = !statusFilter || l.status === statusFilter;
    const matchInterest = !interestFilter || l.interest === interestFilter;
    const matchAssigned = !assignedFilter || (assignedFilter === "assigned" ? !!l.assignedAgent : !l.assignedAgent) || l.assignedAgent?.id === assignedFilter;
    return matchSearch && matchStatus && matchInterest && matchAssigned;
  });

  const filteredAssignLeads = leads.filter(l =>
    l.name.toLowerCase().includes(assignLeadSearch.toLowerCase()) ||
    l.number.includes(assignLeadSearch) ||
    l.college.toLowerCase().includes(assignLeadSearch.toLowerCase())
  ).slice(0, 8);

  const stats = { total:leads.length, assigned:leads.filter(l=>l.assignedAgent).length, unassigned:leads.filter(l=>!l.assignedAgent).length, enrolled:leads.filter(l=>l.status==="ENROLLED").length };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen" style={{ background:"#f4f7fa" }}>

      {/* Header */}
      <header className="sticky top-0 z-20 shadow-sm" style={{ background:"linear-gradient(135deg,#1B3D5C,#2A5A8A)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/mascot-only.png" alt="CB" style={{ width:32,height:32,objectFit:"contain" }} />
            <div>
              <h1 className="font-bold text-white text-sm leading-none">Admin Panel</h1>
              <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.5)" }}>
                {greeting}, {agent.name} 👋
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/dashboard" className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background:"rgba(255,255,255,0.15)", color:"white" }}>← CRM</a>
            <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background:"rgba(220,38,38,0.8)", color:"white" }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-14 z-10" style={{ borderColor:"#eaf0f6" }}>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{ borderColor:tab===t?"#1B3D5C":"transparent", color:tab===t?"#1B3D5C":"#6a8fa8" }}
            >{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── OVERVIEW ── */}
        {tab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[{label:"Total Leads",value:stats.total,color:"#1B3D5C"},{label:"Assigned",value:stats.assigned,color:"#6AAF3D"},{label:"Unassigned",value:stats.unassigned,color:"#F5A623"},{label:"Enrolled",value:stats.enrolled,color:"#2A7AC7"}].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor:"#eaf0f6" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3" style={{ background:s.color }}>{s.value}</div>
                  <p className="text-sm font-medium" style={{ color:"#6a8fa8" }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor:"#eaf0f6" }}>
              <h3 className="font-bold mb-4 text-sm" style={{ color:"#1B3D5C" }}>Agent Assignment Summary</h3>
              <div className="space-y-3">
                {agents.filter(a=>!a.isAdmin).map(a => {
                  const count = leads.filter(l=>l.assignedAgent?.id===a.id).length;
                  const pct = stats.total>0 ? Math.round((count/stats.total)*100) : 0;
                  return (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background:"#1B3D5C" }}>{a.name.charAt(0)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold" style={{ color:"#1B3D5C" }}>{a.name}</span>
                          <span style={{ color:"#9bb0c4" }}>{count} leads ({pct}%)</span>
                        </div>
                        <div className="rounded-full h-2" style={{ background:"#f0f4f8" }}>
                          <div className="h-2 rounded-full" style={{ width:`${pct}%`, background:"#6AAF3D" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── ASSIGNMENTS ── */}
        {tab === "Assignments" && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor:"#eaf0f6" }}>
              <h3 className="font-bold text-sm mb-3" style={{ color:"#1B3D5C" }}>Step 1 — Select Agent</h3>
              <div className="grid grid-cols-2 gap-2">
                {agents.filter(a=>!a.isAdmin).map(a => (
                  <button key={a.id} onClick={() => setAssignAgentId(a.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                    style={{ borderColor:assignAgentId===a.id?"#6AAF3D":"#eaf0f6", background:assignAgentId===a.id?"#f0fae8":"white" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background:assignAgentId===a.id?"#6AAF3D":"#1B3D5C" }}>{a.name.charAt(0)}</div>
                    <div><p className="font-semibold text-xs" style={{ color:"#1B3D5C" }}>{a.name}</p>
                    <p className="text-xs" style={{ color:"#9bb0c4" }}>{leads.filter(l=>l.assignedAgent?.id===a.id).length} assigned</p></div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor:"#eaf0f6" }}>
              <h3 className="font-bold text-sm mb-3" style={{ color:"#1B3D5C" }}>Step 2 — Method</h3>
              <div className="flex gap-2 mb-4">
                {([["college","🏫 College"],["range","🔢 ID Range"],["individual","👤 Individual"]] as const).map(([val,label]) => (
                  <button key={val} onClick={() => setAssignType(val)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                    style={{ borderColor:assignType===val?"#1B3D5C":"#eaf0f6", background:assignType===val?"#1B3D5C":"white", color:assignType===val?"white":"#4a6580" }}
                  >{label}</button>
                ))}
              </div>
              {assignType === "college" && (
                <div>
                  <select value={assignCollege} onChange={e => setAssignCollege(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }}>
                    <option value="">-- Select college --</option>
                    {colleges.map(c => <option key={c.college} value={c.college}>{c.college} ({c._count.college})</option>)}
                  </select>
                  {assignCollege && <div className="mt-2 p-2 rounded-xl text-xs" style={{ background:"#f0fae8", color:"#4a8c1c" }}>
                    {leads.filter(l=>l.college===assignCollege).length} leads will be assigned
                  </div>}
                </div>
              )}
              {assignType === "range" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-400 block mb-1">From ID</label>
                    <input type="number" value={assignSrFrom} onChange={e=>setAssignSrFrom(e.target.value)} placeholder="1001"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} /></div>
                  <div><label className="text-xs font-semibold text-gray-400 block mb-1">To ID</label>
                    <input type="number" value={assignSrTo} onChange={e=>setAssignSrTo(e.target.value)} placeholder="2000"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} /></div>
                  {assignSrFrom && assignSrTo && <div className="col-span-2 p-2 rounded-xl text-xs" style={{ background:"#f0fae8", color:"#4a8c1c" }}>
                    {leads.filter(l=>l.sr>=Number(assignSrFrom)&&l.sr<=Number(assignSrTo)).length} leads in this range
                  </div>}
                </div>
              )}
              {assignType === "individual" && (
                <div>
                  <input type="text" value={assignLeadSearch} onChange={e=>{setAssignLeadSearch(e.target.value);setAssignLeadId("");}}
                    placeholder="Search lead..." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} />
                  {assignLeadSearch && (
                    <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor:"#eaf0f6" }}>
                      {filteredAssignLeads.map(l => (
                        <button key={l.id} onClick={()=>{setAssignLeadId(l.id);setAssignLeadSearch(l.name);}}
                          className="w-full flex items-center gap-3 p-3 text-left border-b hover:bg-gray-50"
                          style={{ background:assignLeadId===l.id?"#f0fae8":"white", borderColor:"#f0f4f8" }}>
                          <div className="flex-1"><p className="font-semibold text-xs" style={{ color:"#1B3D5C" }}>{l.name}</p>
                          <p className="text-xs" style={{ color:"#9bb0c4" }}>#{l.sr} · {l.college}</p></div>
                          {l.assignedAgent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"#e8f8e0", color:"#4a8c1c" }}>{l.assignedAgent.name}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={handleAssign} disabled={assigning||!assignAgentId}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background:"linear-gradient(135deg,#6AAF3D,#5a9a30)", boxShadow:"0 4px 16px rgba(106,175,61,0.3)" }}>
              {assigning ? "Assigning..." : "🎯 Assign Leads"}
            </button>
          </div>
        )}

        {/* ── LEADS TABLE ── */}
        {tab === "Leads" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor:"#eaf0f6" }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..."
                  className="px-3 py-2 rounded-xl text-sm outline-none col-span-2 sm:col-span-1"
                  style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} />
                <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }}>
                  <option value="">All Status</option>
                  {["NEW","LEAD","INTERESTED","ENROLLED","NOT_INTERESTED"].map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
                </select>
                <select value={interestFilter} onChange={e=>setInterestFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }}>
                  <option value="">All Interest</option>
                  {["HIGH","MID","LOW"].map(i=><option key={i} value={i}>{i}</option>)}
                </select>
                <select value={assignedFilter} onChange={e=>setAssignedFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }}>
                  <option value="">All Agents</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                  {agents.filter(a=>!a.isAdmin).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs" style={{ color:"#9bb0c4" }}>{filteredLeads.length} records · {selectedLeads.size} selected</span>
                <button onClick={handleExport} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background:"#6AAF3D" }}>📤 Export</button>
                {selectedLeads.size > 0 && (
                  <button onClick={handleDeleteSelected} disabled={deletingAll}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background:"#dc2626" }}>
                    🗑️ Delete Selected ({selectedLeads.size})
                  </button>
                )}
                <button onClick={handleDeleteAll} disabled={deletingAll||filteredLeads.length===0}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold border" style={{ borderColor:"#fecaca", color:"#dc2626", background:"#fff0f0" }}>
                  {deletingAll ? "Deleting..." : `🗑️ Delete All (${filteredLeads.length})`}
                </button>
                <button onClick={()=>setShowWaTemplate(!showWaTemplate)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white ml-auto" style={{ background:"#25D366" }}>
                  💬 WA Template
                </button>
              </div>
              {/* WhatsApp template editor */}
              {showWaTemplate && (
                <div className="mt-3 p-3 rounded-xl" style={{ background:"#f0fae8", border:"1px solid #d4edba" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color:"#4a8c1c" }}>📱 WhatsApp Message Template</p>
                  <textarea value={waTemplate} onChange={e=>setWaTemplate(e.target.value)} rows={3}
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-none"
                    style={{ border:"1.5px solid #d4edba", background:"white", color:"#1B3D5C" }} />
                  <p className="text-xs mt-1" style={{ color:"#6a8fa8" }}>Use {"{name}"} for student name, {"{number}"} for phone number</p>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor:"#eaf0f6" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background:"#f7fbff" }}>
                    <tr>
                      <th className="px-3 py-3">
                        <input type="checkbox" onChange={e => {
                          if (e.target.checked) setSelectedLeads(new Set(filteredLeads.map(l=>l.id)));
                          else setSelectedLeads(new Set());
                        }} />
                      </th>
                      {["Sr","Name","College","Number","Status","Interest","Assigned","Actions"].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap" style={{ color:"#6a8fa8" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor:"#f0f4f8" }}>
                    {leadsLoading ? (
                      [...Array(5)].map((_,i) => <tr key={i}>{[...Array(9)].map((_,j) => <td key={j} className="px-3 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
                    ) : filteredLeads.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-12 text-center" style={{ color:"#9bb0c4" }}>No leads found</td></tr>
                    ) : filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50" style={{ background:selectedLeads.has(lead.id)?"#f0fae8":undefined }}>
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={selectedLeads.has(lead.id)}
                            onChange={e => { const s=new Set(selectedLeads); e.target.checked?s.add(lead.id):s.delete(lead.id); setSelectedLeads(s); }} />
                        </td>
                        <td className="px-3 py-3 font-mono text-xs" style={{ color:"#9bb0c4" }}>#{lead.sr}</td>
                        <td className="px-3 py-3 font-semibold text-xs whitespace-nowrap" style={{ color:"#1B3D5C" }}>{lead.name}</td>
                        <td className="px-3 py-3 text-xs max-w-28 truncate" style={{ color:"#6a8fa8" }}>{lead.college}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <a href={`tel:${lead.number}`} className="text-xs font-mono" style={{ color:"#2A7AC7" }}>{lead.number}</a>
                            <button onClick={() => sendWhatsApp(lead.number, lead.name)}
                              className="text-xs px-1.5 py-0.5 rounded-md font-semibold text-white" style={{ background:"#25D366" }}>WA</button>
                          </div>
                        </td>
                        <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[lead.status]}`}>{lead.status.replace("_"," ")}</span></td>
                        <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${INTEREST_COLORS[lead.interest]}`}>{lead.interest}</span></td>
                        <td className="px-3 py-3">
                          {lead.assignedAgent
                            ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background:"#e8f8e0", color:"#4a8c1c" }}>{lead.assignedAgent.name}</span>
                            : <span className="text-xs" style={{ color:"#d1d5db" }}>—</span>}
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color:"#dc2626" }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── IMPORT CSV ── */}
        {tab === "Import CSV" && (
          <div className="space-y-5 max-w-3xl">
            <div className="rounded-2xl p-5" style={{ background:"#eef6ff", border:"1px solid #dce8f0" }}>
              <h3 className="font-bold text-sm mb-2" style={{ color:"#1B3D5C" }}>CSV Format</h3>
              <code className="block bg-white rounded-xl px-4 py-3 text-xs font-mono" style={{ color:"#1B3D5C", border:"1px solid #dce8f0" }}>
                name,college,number,session,status,interest,followUpDate<br/>
                Ankit Kumar,R.N. College,9876500001,2025-26,NEW,HIGH,2026-04-01
              </code>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor:"#eaf0f6" }}>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all"
                style={{ borderColor:"#dce8f0" }}>
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm font-medium" style={{ color:"#6a8fa8" }}>Click to select CSV file</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </div>
              {csvData.length > 0 && (
                <div className="mt-4 p-3 rounded-xl" style={{ background:"#f0fae8", border:"1px solid #d4edba" }}>
                  <p className="font-semibold text-sm" style={{ color:"#4a8c1c" }}>✅ {csvData.length} rows loaded</p>
                </div>
              )}
            </div>

            {duplicates.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-amber-700">⚠️ {duplicates.length} Duplicate(s)</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setAllDuplicateActions("skip")}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold border" style={{ borderColor:"#1B3D5C", color:"#1B3D5C" }}>Skip All</button>
                    <button onClick={() => setAllDuplicateActions("overwrite")}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background:"#F5A623" }}>Overwrite All</button>
                  </div>
                </div>
                {duplicates.map((dup) => (
                  <div key={dup.index} className="border border-amber-100 rounded-xl p-3 bg-amber-50 mb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-xs" style={{ color:"#1B3D5C" }}>{dup.row.name}</p>
                        <p className="text-xs" style={{ color:"#9bb0c4" }}>{dup.row.number} · Exists as: {dup.existing.name}</p>
                      </div>
                      <div className="flex gap-2">
                        {(["skip","overwrite"] as const).map(action => (
                          <button key={action} onClick={() => setDuplicateActions(p=>({...p,[dup.index]:action}))}
                            className="px-3 py-1 rounded-lg text-xs font-semibold border capitalize"
                            style={{ background:duplicateActions[dup.index]===action?(action==="skip"?"#1B3D5C":"#F5A623"):"white", color:duplicateActions[dup.index]===action?"white":"#4a6580", borderColor:duplicateActions[dup.index]===action?(action==="skip"?"#1B3D5C":"#F5A623"):"#dce8f0" }}
                          >{action}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {csvData.length > 0 && (
              <div className="space-y-3">
                <button onClick={handleImport} disabled={importing || duplicates.some(d => !duplicateActions[d.index])}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                  style={{ background:"linear-gradient(135deg,#6AAF3D,#5a9a30)", boxShadow:"0 4px 16px rgba(106,175,61,0.3)" }}>
                  {importing ? `Importing ${csvData.length} leads...` : `Import ${csvData.length} Leads`}
                </button>
                {importing && (
                  <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor:"#eaf0f6" }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color:"#1B3D5C" }}>Importing leads...</span>
                      <span className="text-xs font-bold" style={{ color:"#6AAF3D" }}>{importProgress}%</span>
                    </div>
                    <div className="w-full rounded-full h-3" style={{ background:"#f0f4f8" }}>
                      <div className="h-3 rounded-full transition-all duration-300"
                        style={{ width:`${importProgress}%`, background:"linear-gradient(90deg,#6AAF3D,#5a9a30)" }} />
                    </div>
                    <p className="text-xs mt-2" style={{ color:"#9bb0c4" }}>Please wait, do not close this page...</p>
                  </div>
                )}
              </div>
            )}

            {importResult && (
              <div className="rounded-2xl p-5" style={{ background:"#f0fae8", border:"1px solid #d4edba" }}>
                <h3 className="font-bold mb-3 text-sm" style={{ color:"#4a8c1c" }}>✅ Import Complete!</h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[["Imported",importResult.imported,"#6AAF3D"],["Overwritten",importResult.overwritten,"#F5A623"],["Skipped",importResult.skipped,"#9bb0c4"],["Errors",importResult.errors,"#ef4444"]].map(([label,val,color]) => (
                    <div key={label as string} className="bg-white rounded-xl p-3 border border-green-100">
                      <p className="text-2xl font-bold" style={{ color:color as string }}>{val as number}</p>
                      <p className="text-xs" style={{ color:"#9bb0c4" }}>{label as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AGENTS ── */}
        {tab === "Agents" && (
          <div className="grid sm:grid-cols-2 gap-6 items-start">
            <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor:"#eaf0f6" }}>
              <h3 className="font-bold mb-4 text-sm" style={{ color:"#1B3D5C" }}>Add New Agent</h3>
              <form onSubmit={handleCreateAgent} className="space-y-3">
                {[["Full Name","text","name"],["Mobile Number","tel","mobile"],["Password","password","password"]].map(([label,type,field]) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold mb-1" style={{ color:"#6a8fa8" }}>{label}</label>
                    <input type={type} value={agentForm[field as keyof typeof agentForm] as string}
                      onChange={e=>setAgentForm(p=>({...p,[field]:e.target.value}))} placeholder={label} required
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} />
                  </div>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={agentForm.isAdmin} onChange={e=>setAgentForm(p=>({...p,isAdmin:e.target.checked}))} />
                  <span className="text-sm" style={{ color:"#6a8fa8" }}>Grant admin access</span>
                </label>
                <button type="submit" disabled={agentSaving} className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                  style={{ background:"linear-gradient(135deg,#1B3D5C,#2A5A8A)" }}>
                  {agentSaving ? "Creating..." : "Create Agent"}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor:"#eaf0f6" }}>
              <h3 className="font-bold mb-4 text-sm" style={{ color:"#1B3D5C" }}>All Agents ({agents.length})</h3>
              <div className="space-y-3">
                {agents.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background:"#f7fbff", borderColor:"#eaf0f6" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background:"#1B3D5C" }}>{a.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate" style={{ color:"#1B3D5C" }}>{a.name}</p>
                        {a.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white" style={{ background:"#1B3D5C" }}>Admin</span>}
                      </div>
                      <p className="text-xs" style={{ color:"#9bb0c4" }}>{a.mobile} · {leads.filter(l=>l.assignedAgent?.id===a.id).length} leads</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>{setEditAgent(a);setEditPassword("");}} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color:"#2A7AC7" }}>Edit</button>
                      <button onClick={()=>handleDeleteAgent(a.id,a.name)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color:"#dc2626" }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PERFORMANCE ── */}
        {tab === "Performance" && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color:"#6a8fa8" }}>Select Date</label>
                <input type="date" value={perfDate} onChange={e=>setPerfDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border:"1.5px solid #dce8f0", background:"white", color:"#1B3D5C" }} />
              </div>
              <button onClick={fetchPerformance}
                className="mt-5 px-4 py-2.5 rounded-xl font-semibold text-white text-sm"
                style={{ background:"#1B3D5C" }}>
                Load Data
              </button>
            </div>

            {perfLoading ? (
              <div className="grid sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-2xl p-5 h-32 animate-pulse" style={{ border:"1px solid #eaf0f6" }} />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {perfData.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor:"#eaf0f6" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background:"#1B3D5C" }}>{p.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-sm" style={{ color:"#1B3D5C" }}>{p.name}</p>
                        <p className="text-xs" style={{ color:"#9bb0c4" }}>{p.mobile}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl p-2" style={{ background:"#f0fae8" }}>
                        <p className="text-xl font-bold" style={{ color:"#6AAF3D" }}>{p.callsToday}</p>
                        <p className="text-xs" style={{ color:"#6a8fa8" }}>Today</p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background:"#eef6ff" }}>
                        <p className="text-xl font-bold" style={{ color:"#2A7AC7" }}>{p.callsOnDate}</p>
                        <p className="text-xs" style={{ color:"#6a8fa8" }}>On Date</p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background:"#f7fbff" }}>
                        <p className="text-xl font-bold" style={{ color:"#1B3D5C" }}>{p.totalCalls}</p>
                        <p className="text-xs" style={{ color:"#6a8fa8" }}>Total</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color:"#9bb0c4" }}>Activity</span>
                        <span style={{ color:"#6AAF3D" }}>{p.totalCalls > 0 ? Math.round((p.callsOnDate/p.totalCalls)*100) : 0}%</span>
                      </div>
                      <div className="rounded-full h-2" style={{ background:"#f0f4f8" }}>
                        <div className="h-2 rounded-full" style={{ width:`${p.totalCalls>0?Math.round((p.callsOnDate/p.totalCalls)*100):0}%`, background:"#6AAF3D" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Agent Modal */}
        {editAgent && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background:"rgba(0,0,0,0.5)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-bold mb-4" style={{ color:"#1B3D5C" }}>Edit Agent</h3>
              <form onSubmit={handleUpdateAgent} className="space-y-3">
                <input value={editAgent.name} onChange={e=>setEditAgent(p=>p?{...p,name:e.target.value}:p)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} />
                <input type="password" value={editPassword} onChange={e=>setEditPassword(e.target.value)}
                  placeholder="New password (blank = keep)" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editAgent.isAdmin} onChange={e=>setEditAgent(p=>p?{...p,isAdmin:e.target.checked}:p)} />
                  <span className="text-sm" style={{ color:"#6a8fa8" }}>Admin access</span>
                </label>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={()=>setEditAgent(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm border" style={{ borderColor:"#dce8f0", color:"#6a8fa8" }}>Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ background:"#1B3D5C" }}>Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}