"use client";

import { useState, useEffect } from "react";
import { Copy, Trash2, Plus } from "lucide-react";

interface Invite {
  _id: string;
  code: string;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  creatorId: {
    name: string;
  };
  createdAt: string;
}

export default function InviteManager({ serverId }: { serverId: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, [serverId]);

  const fetchInvites = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/invites`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxUses: null, expiresAt: null }),
      });
      if (res.ok) {
        fetchInvites();
      } else {
        alert("Failed to create invite");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    if (!confirm("Delete this invite?")) return;
    try {
      const res = await fetch(`/api/servers/${serverId}/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInvites();
      } else {
        alert("Failed to delete invite");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const copyInvite = (code: string) => {
    const inviteUrl = `${window.location.origin}/community/join/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    alert("Invite link copied!");
  };

  if (loading) return <div className="text-muted-foreground">Loading invites...</div>;

  return (
    <div className="space-y-4">
      <button
        onClick={createInvite}
        disabled={creating}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
      >
        <Plus size={16} /> {creating ? "Creating..." : "Create Invite"}
      </button>

      <div className="space-y-2">
        {invites.length === 0 ? (
          <div className="text-sm text-muted-foreground">No invites yet</div>
        ) : (
          invites.map((invite) => (
            <div
              key={invite._id}
              className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors"
            >
              <div>
                <div className="font-mono text-sm font-medium">{invite.code}</div>
                <div className="text-xs text-muted-foreground">
                  Uses: {invite.uses}
                  {invite.maxUses ? ` / ${invite.maxUses}` : " / ∞"} • Created by {invite.creatorId.name}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyInvite(invite.code)}
                  className="p-2 hover:bg-primary/10 text-primary rounded-md transition-colors"
                  title="Copy Invite Link"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => deleteInvite(invite._id)}
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded-md transition-colors"
                  title="Delete Invite"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
