"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (!data.isAdmin) throw new Error("You are not an admin");
      toast.success(`Welcome, ${data.name}!`);
      setTimeout(() => { window.location.replace("/admin/dashboard"); }, 500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 pt-10 pb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">⚙️</span>
              </div>
              <div className="text-left">
                <h1 className="text-white font-bold text-2xl leading-tight">College Buddy</h1>
                <h1 className="text-slate-300 font-bold text-lg leading-tight -mt-1">Admin Panel</h1>
              </div>
            </div>
            <p className="text-slate-400 text-sm">Restricted access — admins only</p>
          </div>
          <div className="px-8 py-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Admin Mobile</label>
                <input
                  type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter admin mobile" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none text-gray-800"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white font-bold rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg disabled:opacity-60 mt-2"
              >
                {loading ? "Signing in..." : "Sign In as Admin"}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-4">
          <a href="/login" className="hover:text-slate-300 transition-colors">← Back to Agent Login</a>
        </p>
      </div>
    </div>
  );
}
