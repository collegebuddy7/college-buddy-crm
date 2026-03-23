"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
      toast.success(`Welcome, ${data.name}!`);
      setTimeout(() => { window.location.replace("/dashboard"); }, 500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/images/bg-pattern.png" alt="bg"
          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div className="absolute inset-0" style={{ background:"rgba(255,255,255,0.55)" }} />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.93)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(27,61,92,0.15)",
            border: "1.5px solid rgba(255,255,255,0.8)",
          }}>

          {/* Header */}
          <div className="px-8 pt-8 pb-6 flex flex-col items-center"
            style={{ background:"linear-gradient(135deg, #1B3D5C 0%, #2A5A8A 100%)" }}>
              
            <div style={{
  width: "90px", height: "90px", borderRadius: "50%",
  overflow: "hidden", background: "white",
  border: "3px solid rgba(255,255,255,0.3)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  display: "flex", alignItems: "center", justifyContent: "center"
}}>
  <img src="/images/mascot-large.png" alt="College Buddy"
    style={{ width: "75px", height: "75px", objectFit: "contain" }} />
</div>
<p style={{ color: "white", fontWeight: "bold", fontSize: "20px", marginTop: "10px", letterSpacing: "0.5px" }}>
  College <span style={{ color: "#6AAF3D" }}>Buddy</span>
</p>

            <div className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background:"rgba(106,175,61,0.25)", color:"#a8d87c",
                border:"1px solid rgba(106,175,61,0.35)" }}>
              CRM Agent Portal
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <h2 className="text-lg font-bold mb-5" style={{ color:"#1B3D5C" }}>
              Sign in to your account
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:"#4a6580" }}>
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">📱</span>
                  <input type="tel" value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter your mobile number" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:"#4a6580" }}>
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">🔒</span>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password" required
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none"
                    style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white mt-2"
                style={{
                  background: "linear-gradient(135deg, #6AAF3D 0%, #5a9a30 100%)",
                  boxShadow: "0 4px 16px rgba(106,175,61,0.35)",
                  opacity: loading ? 0.7 : 1,
                }}>
                {loading ? "Signing in..." : "Sign In →"}
              </button>
            </form>

            <p className="text-center mt-5">
              <a href="/admin/login" className="text-xs font-medium"
                style={{ color:"#8aa8bc" }}>
                Admin Panel →
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color:"#8aa8bc" }}>
          © {new Date().getFullYear()} College Buddy. All rights reserved.
        </p>
      </div>
    </div>
  );
}