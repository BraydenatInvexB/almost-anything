"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong");
        return;
      }

      setStatus("success");
      setMessage("You're subscribed! Check your inbox for exclusive deals.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <Card variant="elevated" padding="md" className="bg-white">
      <Badge variant="exclusive" className="mb-3 bg-neutral-100 text-neutral-600">
        Get a Bonus
      </Badge>
      <CardTitle>Discover our latest exclusive items</CardTitle>
      <CardDescription className="mt-2">
        Be first to know when we find rare deals.
      </CardDescription>

      <form onSubmit={handleSubscribe} className="mt-4 space-y-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-2xl"
        />
        <Button
          type="submit"
          className="w-full rounded-full"
          isLoading={status === "loading"}
        >
          Subscribe
        </Button>
        {message ? (
          <p
            className={`text-xs ${status === "success" ? "text-green-600" : "text-red-500"}`}
          >
            {message}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
