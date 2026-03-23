"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { StatusBadge, InterestBadge } from "@/components/Badges";
import WhatsAppSheet from "@/components/WhatsAppSheet";
import type { Account } from "@/types";

interface Props {
  leadId: string;
  agent: { agentId: string; name: string; mobile: string; isAdmin: boolean };
}

const STATUSES = ["NEW", "LEAD", "INTERESTED", "ENROLLED", "NOT_INTERESTED"];
const INTERESTS = ["HIGH", "MID", "LOW"];

const INTEREST_STYLE: Record<string, { bg: string; color: string; activeBg: string }> = {
  HIGH: { bg:"#f0fae8", color:"#4a8c1c", activeBg:"#6AAF3D" },
  MID:  { bg:"#fffbf0", color:"#92600a", activeBg:"#F5A623" },
  LOW:  { bg:"#fff0f0", color:"#b91c1c", activeBg:"#ef4444" },
};

export default function LeadDetailClient({ leadId, agent }: Props) {
  const router = useRouter();
  const [lead, setLead] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [interest, setInterest] = useState("");
  const [callNote, setCallNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [callDirection, setCallDirection] = useState<"INCOMING"|"OUTGOING">("OUTGOING");
  const [allIds, setAllIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showWA, setShowWA] = useState(false);

  const fetchLead = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error("Not found");
      const data: Account = await res.json();
      setLead(data);
      setStatus(data.status);
      setInterest(data.interest);
      setFollowUpDate(data.followUpDate ? data.followUpDate.substring(0,10) : "");
    } catch { toast.error("Failed to load lead"); }
    finally { setLoading(false); }
  }, [leadId]);

  uuseEffect(() => {
  if (!leadId) return;
  fetch("/api/leads?type=all").then(r=>r.json()).then((data: Account[]) => {
      if (Array.isArray(data)) { const ids=data.map(l=>l.id); setAllIds(ids); setCurrentIndex(ids.indexOf(leadId)); }
    });
  }, [leadId]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ status, interest, followUpDate: followUpDate||null, callNote: callNote.trim()||undefined, callDirection }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Saved!");
      setCallNote("");
      await fetchLead();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  function navigate(dir: "prev"|"next") {
    const newIndex = dir==="prev" ? currentIndex-1 : currentIndex+1;
    if (newIndex<0||newIndex>=allIds.length) return;
    router.push(`/leads/${allIds[newIndex]}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:"#f4f7fa" }}>
        <div className="text-center">
          <img src="/images/mascot-only.png" alt="loading" style={{ width:60, height:60, objectFit:"contain", margin:"0 auto 12px", animation:"bounce 1s infinite" }} />
          <p className="text-sm" style={{ color:"#6a8fa8" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:"#f4f7fa" }}>
        <div className="text-center">
          <p style={{ color:"#6a8fa8" }}>Lead not found.</p>
          <Link href="/leads?type=all" className="text-sm mt-2 block" style={{ color:"#6AAF3D" }}>← Back</Link>
        </div>
      </div>
    );
  }

  const incomingCalls = lead.callHistories?.filter(c=>c.direction==="INCOMING")||[];
  const outgoingCalls = lead.callHistories?.filter(c=>c.direction==="OUTGOING")||[];

  return (
    <div className="min-h-screen flex flex-col" style={{ background:"#f4f7fa" }}>

      {/* Header */}
      <header className="sticky top-0 z-20 shadow-sm" style={{ background:"linear-gradient(135deg,#1B3D5C,#2A5A8A)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/leads?type=all" className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:"rgba(255,255,255,0.15)" }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <img src="/images/mascot-only.png" alt="CB" style={{ width:24, height:24, objectFit:"contain" }} />
          <h1 className="font-bold text-white flex-1 text-sm">Lead Profile</h1>
          <span className="text-xs" style={{ color:"rgba(255,255,255,0.5)" }}>{currentIndex+1} / {allIds.length}</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

          {/* Profile Card */}
          <div className="rounded-2xl overflow-hidden" style={{ background:"white", boxShadow:"0 2px 12px rgba(27,61,92,0.08)", border:"1.5px solid #eaf0f6" }}>
            <div className="h-1.5" style={{ background:"linear-gradient(90deg,#1B3D5C,#6AAF3D)" }} />
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background:"linear-gradient(135deg,#eef6ff,#e8f8e0)", border:"2px solid #dce8f0" }}>
                  <img src="/images/mascot-large.png" alt="student" style={{ width:52, height:52, objectFit:"contain" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-base leading-tight" style={{ color:"#1B3D5C" }}>{lead.name}</h2>
                      <p className="text-sm mt-0.5" style={{ color:"#6a8fa8" }}>{lead.college}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ background:"#f0f4f8", color:"#6a8fa8" }}>#{lead.sr}</span>
                        <span className="text-xs" style={{ color:"#9bb0c4" }}>{lead.session}</span>
                      </div>
                    </div>
                    {/* Call + WA buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setShowWA(true)}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-transform hover:scale-105"
                        style={{ background:"linear-gradient(135deg,#25D366,#1da851)", boxShadow:"0 4px 12px rgba(37,211,102,0.4)" }}>
                        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                      <a href={`tel:${lead.number}`}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-transform hover:scale-105"
                        style={{ background:"linear-gradient(135deg,#6AAF3D,#5a9a30)", boxShadow:"0 4px 12px rgba(106,175,61,0.4)" }}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <StatusBadge status={lead.status} />
                    <InterestBadge interest={lead.interest} />
                    <span className="text-xs ml-1" style={{ color:"#6a8fa8" }}>{lead.number}</span>
                  </div>
                  {/* Assigned agent */}
                  {(lead as Account & { assignedAgent?: { name: string } }).assignedAgent && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs" style={{ color:"#9bb0c4" }}>Assigned to:</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:"#e8f8e0", color:"#4a8c1c" }}>
                        {(lead as Account & { assignedAgent?: { name: string } }).assignedAgent?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Update Card */}
          <div className="rounded-2xl p-4 space-y-4" style={{ background:"white", boxShadow:"0 2px 12px rgba(27,61,92,0.08)", border:"1.5px solid #eaf0f6" }}>
            <h3 className="font-bold text-sm" style={{ color:"#1B3D5C" }}>Update Lead</h3>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:"#6a8fa8" }}>Status</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:"#6a8fa8" }}>Interest Level</label>
              <div className="flex gap-2">
                {INTERESTS.map(i => {
                  const st = INTEREST_STYLE[i]; const active = interest===i;
                  return (
                    <button key={i} onClick={()=>setInterest(i)} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background:active?st.activeBg:st.bg, color:active?"white":st.color, border:`1.5px solid ${active?st.activeBg:"transparent"}` }}>
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:"#6a8fa8" }}>Follow-up Date</label>
              <input type="date" value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:"#6a8fa8" }}>Call Type</label>
              <div className="flex gap-2">
                {(["OUTGOING","INCOMING"] as const).map(dir => (
                  <button key={dir} onClick={()=>setCallDirection(dir)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ background:callDirection===dir?"#1B3D5C":"#f7fbff", color:callDirection===dir?"white":"#4a6580", border:`1.5px solid ${callDirection===dir?"#1B3D5C":"#dce8f0"}` }}>
                    {dir==="OUTGOING"?"📤 Outgoing":"📥 Incoming"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:"#6a8fa8" }}>Call Notes</label>
              <textarea value={callNote} onChange={e=>setCallNote(e.target.value)} rows={3} placeholder="Add notes about this call..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} />
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background:"linear-gradient(135deg,#6AAF3D,#5a9a30)", boxShadow:"0 4px 12px rgba(106,175,61,0.3)", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Status History */}
          {lead.statusChanges && lead.statusChanges.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background:"white", boxShadow:"0 2px 12px rgba(27,61,92,0.08)", border:"1.5px solid #eaf0f6" }}>
              <h3 className="font-bold text-sm mb-3" style={{ color:"#1B3D5C" }}>Status History</h3>
              <div className="space-y-2">
                {lead.statusChanges.map(sc => (
                  <div key={sc.id} className="flex items-center gap-2 text-xs" style={{ color:"#6a8fa8" }}>
                    <span className="font-semibold" style={{ color:"#1B3D5C" }}>{sc.agent?.name}</span>
                    <span>→</span><StatusBadge status={sc.newStatus} />
                    <span className="ml-auto" style={{ color:"#9bb0c4" }}>{format(new Date(sc.changedAt),"dd MMM, HH:mm")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call History */}
          <div className="rounded-2xl p-4" style={{ background:"white", boxShadow:"0 2px 12px rgba(27,61,92,0.08)", border:"1.5px solid #eaf0f6" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color:"#1B3D5C" }}>Call History</h3>
            {lead.callHistories?.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color:"#9bb0c4" }}>No calls logged yet</p>
            ) : (
              <div className="space-y-3">
                {incomingCalls.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:"#9bb0c4" }}>Incoming</p>
                    {incomingCalls.map(call => (
                      <div key={call.id} className="rounded-xl p-3 mb-2" style={{ background:"#f0fae8", border:"1px solid #d4edba" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color:"#1B3D5C" }}>📥 {call.agent?.name}</span>
                          <span className="text-xs" style={{ color:"#9bb0c4" }}>{format(new Date(call.calledAt),"dd MMM, HH:mm")}</span>
                        </div>
                        {call.notes && <p className="text-xs mt-1.5 leading-relaxed" style={{ color:"#4a6580" }}>{call.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {outgoingCalls.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:"#9bb0c4" }}>Outgoing</p>
                    {outgoingCalls.map(call => (
                      <div key={call.id} className="rounded-xl p-3 mb-2" style={{ background:"#fffbf0", border:"1px solid #fde8b0" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color:"#1B3D5C" }}>📤 {call.agent?.name}</span>
                          <span className="text-xs" style={{ color:"#9bb0c4" }}>{format(new Date(call.calledAt),"dd MMM, HH:mm")}</span>
                        </div>
                        {call.notes && <p className="text-xs mt-1.5 leading-relaxed" style={{ color:"#4a6580" }}>{call.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky PREV/NEXT */}
      <div className="sticky bottom-0 z-10" style={{ background:"white", borderTop:"1.5px solid #eaf0f6", boxShadow:"0 -4px 16px rgba(27,61,92,0.08)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-3">
          <button onClick={()=>navigate("prev")} disabled={currentIndex<=0}
            className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            style={{ background:"#f0f4f8", color:"#4a6580", border:"1.5px solid #dce8f0" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            PREV
          </button>
          <button onClick={()=>navigate("next")} disabled={currentIndex>=allIds.length-1}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            style={{ background:"linear-gradient(135deg,#6AAF3D,#5a9a30)", boxShadow:"0 4px 12px rgba(106,175,61,0.3)" }}>
            NEXT
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* WhatsApp Sheet */}
      <WhatsAppSheet
        isOpen={showWA}
        onClose={() => setShowWA(false)}
        studentName={lead.name}
        studentNumber={lead.number}
        studentCollege={lead.college}
        agentName={agent.name}
      />
    </div>
  );
}