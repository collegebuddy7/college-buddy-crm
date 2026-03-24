"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Props {
  agent: { agentId: string; name: string; mobile: string; isAdmin: boolean };
}

interface Stats {
  callsToday: number;
  myLeads: number;
  followUpToday: number;
  newLeads: number;
}

export default function DashboardClient({ agent }: Props) {
  const [stats, setStats] = useState<Stats>({ callsToday:0, myLeads:0, followUpToday:0, newLeads:0 });
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [leadsRes, perfRes] = await Promise.all([
  fetch("/api/leads?type=mine"),
  fetch("/api/agent/stats"),
]);
if (!leadsRes.ok || !perfRes.ok) return;
const leadsData = await leadsRes.json();
const perfData = await perfRes.json();
        const now = new Date();
        const followUpToday = Array.isArray(leadsData)
          ? leadsData.filter((l: { followUpDate?: string }) => l.followUpDate && new Date(l.followUpDate) <= now).length
          : 0;
        const newLeads = Array.isArray(leadsData)
          ? leadsData.filter((l: { status: string }) => l.status === "NEW").length
          : 0;
        setStats({
          callsToday: perfData.callsToday || 0,
          myLeads: Array.isArray(leadsData) ? leadsData.length : 0,
          followUpToday,
          newLeads,
        });
      } catch {}
    }
    fetchStats();
  }, []);

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const greetEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  const menuItems = [
    { label:"My Leads", href:"/leads?type=mine", bg:"linear-gradient(135deg,#1B3D5C,#2A5A8A)", shadow:"rgba(27,61,92,0.35)", icon:"🎯", description:"Assigned to me", badge:stats.myLeads },
    { label:"New Leads", href:"/leads?type=new", bg:"linear-gradient(135deg,#F5A623,#e8940f)", shadow:"rgba(245,166,35,0.35)", icon:"✨", description:"Fresh new leads", badge:stats.newLeads },
    { label:"Follow Up", href:"/leads?type=followup", bg:"linear-gradient(135deg,#2A7AC7,#1d6ab5)", shadow:"rgba(42,122,199,0.35)", icon:"📞", description:"Due today", badge:stats.followUpToday },
    { label:"All Leads", href:"/leads?type=all", bg:"linear-gradient(135deg,#6AAF3D,#5a9a30)", shadow:"rgba(106,175,61,0.35)", icon:"👥", description:"Complete database", badge:null },
  ];

  return (
    <div className="min-h-screen" style={{ background:"linear-gradient(160deg,#eef6ff 0%,#f0fae8 60%,#fffbf0 100%)" }}>
      {/* Blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none opacity-15" style={{ background:"#6AAF3D", filter:"blur(100px)", transform:"translate(-40%,-40%)" }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-15" style={{ background:"#1B3D5C", filter:"blur(100px)", transform:"translate(40%,40%)" }} />

      <div className="relative max-w-sm mx-auto px-4 py-6 space-y-4">

        {/* Top greeting card */}
        <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background:"linear-gradient(135deg,#1B3D5C 0%,#2A5A8A 100%)" }}>
          {/* Logo area */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div style={{ width:72, height:72, borderRadius:"50%", overflow:"hidden", background:"white",
              border:"3px solid rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
              <img src="/images/logo-full.png" alt="CB" style={{ width:58, height:58, objectFit:"contain" }} />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color:"rgba(255,255,255,0.5)" }}>
                {time.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}
              </p>
              <p className="font-bold text-lg text-white">{time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</p>
            </div>
          </div>

          {/* Greeting */}
          <div className="px-6 pb-5">
            <p className="text-sm font-medium mb-0.5" style={{ color:"rgba(255,255,255,0.6)" }}>
              {greetEmoji} {greeting}
            </p>
            <h1 className="text-2xl font-bold text-white leading-tight">
              Hi, {agent.name.split(" ")[0]}! 👋
            </h1>
            <p className="text-xs mt-1" style={{ color:"rgba(255,255,255,0.5)" }}>
              {agent.isAdmin ? "Administrator" : "Sales Agent"} · College Buddy CRM
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-0 border-t" style={{ borderColor:"rgba(255,255,255,0.1)" }}>
            {[
              { label:"Calls Today", value:stats.callsToday, icon:"📞", color:"#6AAF3D" },
              { label:"My Leads", value:stats.myLeads, icon:"🎯", color:"#F5A623" },
            ].map((s,i) => (
              <div key={s.label} className={`px-5 py-4 ${i===0?"border-r":""}`} style={{ borderColor:"rgba(255,255,255,0.1)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-2xl font-bold text-white">{s.value}</span>
                </div>
                <p className="text-xs font-medium" style={{ color:"rgba(255,255,255,0.5)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:"Follow Ups Due", value:stats.followUpToday, color:"#dc2626", bg:"#fff0f0", border:"#fecaca" },
            { label:"New Assigned", value:stats.newLeads, color:"#F5A623", bg:"#fffbf0", border:"#fde68a" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 border" style={{ background:s.bg, borderColor:s.border }}>
              <p className="text-2xl font-bold" style={{ color:s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color:s.color, opacity:0.7 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="space-y-2.5">
          {menuItems.map(item => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-white font-bold text-sm transition-all hover:-translate-y-0.5"
              style={{ background:item.bg, boxShadow:`0 4px 16px ${item.shadow}` }}>
              <span className="text-xl w-8 text-center">{item.icon}</span>
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"rgba(255,255,255,0.25)" }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-70 font-normal mt-0.5">{item.description}</div>
              </div>
              <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Admin panel */}
        {agent.isAdmin && (
          <Link href="/admin/dashboard"
            className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
            style={{ background:"linear-gradient(135deg,#374151,#1f2937)", boxShadow:"0 4px 16px rgba(31,41,55,0.3)" }}>
            <span className="text-xl w-8 text-center">⚙️</span>
            <div className="text-left flex-1">
              <div>Admin Panel</div>
              <div className="text-xs opacity-70 font-normal mt-0.5">Assignments, CSV import, agents</div>
            </div>
            <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all"
          style={{ background:"white", color:"#dc2626", border:"1.5px solid #fecaca" }}>
          <span className="text-xl w-8 text-center">🚪</span>
          <span>Logout</span>
        </button>

        <p className="text-center text-xs pb-4" style={{ color:"#9bb0c4" }}>
          © {new Date().getFullYear()} College Buddy CRM
        </p>
      </div>
    </div>
  );
}