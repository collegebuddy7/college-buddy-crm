"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Template {
  id: string;
  name: string;
  message: string;
  isDefault: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentNumber: string;
  studentCollege: string;
  agentName: string;
}

export default function WhatsAppSheet({ isOpen, onClose, studentName, studentNumber, studentCollege, agentName }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "custom">("templates");

  useEffect(() => {
    if (isOpen) fetchTemplates();
  }, [isOpen]);

  async function fetchTemplates() {
    const res = await fetch("/api/wa-templates");
    const data = await res.json();
    if (Array.isArray(data)) {
      setTemplates(data);
      // Auto-select default template
      const def = data.find((t: Template) => t.isDefault);
      if (def) {
        setSelectedTemplate(def);
        setCustomMessage(fillTemplate(def.message));
      }
    }
  }

  function fillTemplate(msg: string) {
    return msg
      .replace(/\{name\}/gi, studentName)
      .replace(/\{college\}/gi, studentCollege)
      .replace(/\{number\}/gi, studentNumber)
      .replace(/\{agent\}/gi, agentName);
  }

  function selectTemplate(t: Template) {
    setSelectedTemplate(t);
    setCustomMessage(fillTemplate(t.message));
    setActiveTab("custom");
  }

  function sendWhatsApp() {
    const msg = customMessage.trim();
    if (!msg) return toast.error("Message cannot be empty");
    const cleaned = studentNumber.replace(/\D/g, "");
    const phone = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Opening WhatsApp...");
    onClose();
  }

  async function handleSaveTemplate() {
    if (!newName.trim() || !newMessage.trim()) return toast.error("Name and message required");
    setSaving(true);
    try {
      const res = await fetch("/api/wa-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, message: newMessage, isDefault: templates.length === 0 }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Template saved!");
      setNewName(""); setNewMessage(""); setShowNewForm(false);
      fetchTemplates();
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/wa-templates/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    fetchTemplates();
    if (selectedTemplate?.id === id) setSelectedTemplate(null);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto"
        style={{ borderRadius:"24px 24px 0 0", background:"white", boxShadow:"0 -8px 40px rgba(0,0,0,0.15)", maxHeight:"85vh", display:"flex", flexDirection:"column" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background:"#dce8f0" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0" style={{ borderBottom:"1px solid #eaf0f6" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background:"#25D366" }}>
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color:"#1B3D5C" }}>WhatsApp Message</h3>
              <p className="text-xs" style={{ color:"#9bb0c4" }}>{studentName} · {studentNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:"#f0f4f8", color:"#6a8fa8" }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-2 flex-shrink-0">
          {(["templates","custom"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                background: activeTab === t ? "#1B3D5C" : "#f0f4f8",
                color: activeTab === t ? "white" : "#6a8fa8",
              }}>
              {t === "templates" ? "📋 Templates" : "✏️ Edit Message"}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">

          {/* Templates tab */}
          {activeTab === "templates" && (
            <>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-medium" style={{ color:"#6a8fa8" }}>No templates yet</p>
                  <p className="text-xs mt-1" style={{ color:"#9bb0c4" }}>Create your first template below</p>
                </div>
              ) : (
                templates.map(t => (
                  <div key={t.id}
                    className="rounded-2xl p-4 cursor-pointer transition-all border-2"
                    style={{
                      borderColor: selectedTemplate?.id === t.id ? "#25D366" : "#eaf0f6",
                      background: selectedTemplate?.id === t.id ? "#f0fff4" : "white",
                    }}
                    onClick={() => selectTemplate(t)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color:"#1B3D5C" }}>{t.name}</span>
                        {t.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:"#e8f8e0", color:"#4a8c1c" }}>Default</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); selectTemplate(t); setActiveTab("custom"); }}
                          className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color:"#2A7AC7", background:"#eef6ff" }}>
                          Use
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                          className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color:"#dc2626", background:"#fff0f0" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color:"#6a8fa8" }}>
                      {fillTemplate(t.message).substring(0, 100)}{t.message.length > 100 ? "..." : ""}
                    </p>
                  </div>
                ))
              )}

              {/* Add new template */}
              {!showNewForm ? (
                <button onClick={() => setShowNewForm(true)}
                  className="w-full py-3 rounded-2xl text-sm font-semibold border-2 border-dashed transition-all"
                  style={{ borderColor:"#dce8f0", color:"#6a8fa8" }}>
                  + Create New Template
                </button>
              ) : (
                <div className="rounded-2xl p-4 border-2" style={{ borderColor:"#25D366", background:"#f0fff4" }}>
                  <h4 className="font-bold text-sm mb-3" style={{ color:"#1B3D5C" }}>New Template</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color:"#6a8fa8" }}>Template Name</label>
                      <input value={newName} onChange={e => setNewName(e.target.value)}
                        placeholder="e.g. Follow Up, Introduction..."
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ border:"1.5px solid #dce8f0", background:"white", color:"#1B3D5C" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color:"#6a8fa8" }}>Message</label>
                      <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        placeholder="Hi {name}, this is College Buddy..."
                        rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                        style={{ border:"1.5px solid #dce8f0", background:"white", color:"#1B3D5C" }} />
                      <p className="text-xs mt-1" style={{ color:"#9bb0c4" }}>
                        Variables: {"{name}"} {"{college}"} {"{agent}"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowNewForm(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor:"#dce8f0", color:"#6a8fa8" }}>
                        Cancel
                      </button>
                      <button onClick={handleSaveTemplate} disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                        style={{ background:"#25D366" }}>
                        {saving ? "Saving..." : "Save Template"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Custom message tab */}
          {activeTab === "custom" && (
            <div className="space-y-3">
              {selectedTemplate && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background:"#f0fff4", border:"1px solid #d4edba" }}>
                  <span className="text-xs" style={{ color:"#4a8c1c" }}>📋 Using: <strong>{selectedTemplate.name}</strong></span>
                  <button onClick={() => { setSelectedTemplate(null); setCustomMessage(""); setActiveTab("templates"); }}
                    className="ml-auto text-xs" style={{ color:"#9bb0c4" }}>Change</button>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:"#6a8fa8" }}>Message to send</label>
                <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)}
                  rows={7} placeholder="Type your message here..."
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ border:"1.5px solid #dce8f0", background:"#f7fbff", color:"#1B3D5C" }} />
                <p className="text-xs mt-1" style={{ color:"#9bb0c4" }}>{customMessage.length} characters</p>
              </div>
            </div>
          )}
        </div>

        {/* Send button - always visible */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop:"1px solid #eaf0f6" }}>
          <button onClick={sendWhatsApp}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background:"linear-gradient(135deg,#25D366,#1da851)", boxShadow:"0 4px 16px rgba(37,211,102,0.4)" }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Send on WhatsApp
          </button>
        </div>
      </div>
    </>
  );
}