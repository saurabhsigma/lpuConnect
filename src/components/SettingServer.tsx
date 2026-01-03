"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Settings, Trash2, Save, X } from "lucide-react";


export default function ServerSettingsModal({ server, onClose, onUpdate }: any) {
    const router = useRouter();
    const [name, setName] = useState(server.name);
    const [rules, setRules] = useState(server.rules || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/servers/${server._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, rules }),
            });
            if (res.ok) {
                onUpdate();
            } else {
                alert("Failed to update server");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this server? This action cannot be undone.")) return;
        
        try {
            const res = await fetch(`/api/servers/${server._id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                router.push("/community");
            } else {
                alert("Failed to delete server");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/10">
                    <h2 className="font-bold flex items-center gap-2"><Settings size={20} /> Server Settings</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Server Name</label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* Rules */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Community Rules</label>
                        <textarea 
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            className="w-full h-32 bg-input border border-border rounded-md px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                            placeholder="Set guidelines for your community..."
                        />
                    </div>

                    <div className="pt-4 border-t border-border flex justify-between items-center">
                        <button 
                            onClick={handleDelete}
                            className="text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={16} /> Delete Server
                        </button>

                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}