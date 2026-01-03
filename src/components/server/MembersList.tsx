"use client";

import { useState, useEffect } from "react";
import { Shield, UserMinus, Ban, User } from "lucide-react";

interface Member {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  roles: string[];
  joinedAt: string;
}

export default function MembersList({ serverId, canManage }: { serverId: string; canManage: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [serverId]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (memberId: string) => {
    if (!confirm("Are you sure you want to kick this member?")) return;
    try {
      const res = await fetch(`/api/servers/${serverId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMembers();
      } else {
        alert("Failed to kick member");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBan = async (userId: string) => {
    const reason = prompt("Reason for ban:");
    if (!reason) return;
    try {
      const res = await fetch(`/api/servers/${serverId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason }),
      });
      if (res.ok) {
        fetchMembers();
      } else {
        alert("Failed to ban member");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading members...</div>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">{members.length} members</div>
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <div className="font-medium">{member.userId.name}</div>
                <div className="text-xs text-muted-foreground">{member.userId.email}</div>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleKick(member._id)}
                  className="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded-md transition-colors"
                  title="Kick Member"
                >
                  <UserMinus size={16} />
                </button>
                <button
                  onClick={() => handleBan(member.userId._id)}
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded-md transition-colors"
                  title="Ban Member"
                >
                  <Ban size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
