"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { SellerTeamMember } from "@/types/seller";

export function SellerTeamDesk() {
  const [team, setTeam] = useState<SellerTeamMember[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("staff");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/seller/team")
      .then((r) => r.json())
      .then((data) => setTeam(data.team ?? []))
      .catch(() => setTeam([]));
  }, []);

  async function invite() {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, role }),
      });
      const data = await res.json();
      if (data.member) setTeam((list) => [...list, data.member]);
      setEmail("");
      setFullName("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Invite employee</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2">
            <option value="manager">Manager</option>
            <option value="inventory">Inventory</option>
            <option value="support">Support / fulfillment</option>
            <option value="staff">Staff</option>
          </select>
          <Button type="button" className="sm:col-span-2" isLoading={loading} onClick={() => void invite()}>Send invite</Button>
        </div>
      </Card>
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Team members</h2>
        <ul className="mt-4 space-y-2">
          {team.map((member) => (
            <li key={member.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">{member.fullName}</p>
                <p className="text-neutral-500">{member.email}</p>
              </div>
              <span className="capitalize text-neutral-600">{member.role} · {member.status}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
