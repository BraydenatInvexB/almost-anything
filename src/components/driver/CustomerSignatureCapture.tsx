"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";

export function CustomerSignatureCapture({ jobId }: { jobId: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [recipientName, setRecipientName] = useState("");
  const [signed, setSigned] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.25;
    context.strokeStyle = "#171717";
  }, []);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const current = point(event);
    context.beginPath();
    context.moveTo(current.x, current.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const current = point(event);
    context.lineTo(current.x, current.y);
    context.stroke();
    setSigned(true);
  }

  function stop() { drawing.current = false; }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  }

  async function complete() {
    const canvas = canvasRef.current;
    if (!canvas || !signed || !confirmed || recipientName.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/driver/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          id: jobId,
          recipientName: recipientName.trim(),
          signatureDataUrl: canvas.toDataURL("image/png"),
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) { setError(body.error ?? "Could not complete delivery."); return; }
      router.replace("/driver?delivered=1");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></span><div><h2 className="font-bold">Customer handover</h2><p className="text-sm text-neutral-500">The customer must sign before delivery can be completed.</p></div></div>
      <label className="mt-6 block text-sm font-medium text-neutral-700">Name of person receiving the order
        <input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-neutral-400" placeholder="Full name" />
      </label>
      <div className="mt-5 flex items-center justify-between"><p className="text-sm font-medium text-neutral-700">Customer signature</p><button type="button" onClick={clear} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500"><RotateCcw className="h-3.5 w-3.5" />Clear</button></div>
      <canvas ref={canvasRef} onPointerDown={start} onPointerMove={draw} onPointerUp={stop} onPointerCancel={stop} className="mt-2 h-44 w-full touch-none rounded-2xl border border-dashed border-neutral-300 bg-[#fdfdfc]" aria-label="Customer signature pad" />
      <label className="mt-4 flex items-start gap-3 text-sm text-neutral-600"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span>I confirm that the order was handed to the person named above and they signed in my presence.</span></label>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button type="button" disabled={busy || !signed || !confirmed || recipientName.trim().length < 2} onClick={() => void complete()} className="mt-5 w-full rounded-full bg-brand px-5 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Completing delivery…" : "Complete delivery"}</button>
    </section>
  );
}
