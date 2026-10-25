"use client";

import { useState, useEffect } from "react";
import { Terminal } from "lucide-react";

export default function Toast() {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(
    null
  );

  useEffect(() => {
    function handleToast(e: Event) {
      const customEvent = e as CustomEvent<{
        message: string;
        duration?: number;
      }>;
      const message = customEvent.detail?.message;
      if (!message) return;

      const id = Date.now();
      setToast({ message, id });

      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, customEvent.detail?.duration || 3500);
    }

    window.addEventListener("skilltree:toast", handleToast);
    return () => window.removeEventListener("skilltree:toast", handleToast);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-[400px] animate-in slide-in-from-top-4 duration-200 pointer-events-none font-mono">
      <div className="bg-cyber-dark border border-cyber-green p-3 shadow-cyber-glow flex items-center gap-3 pointer-events-auto rounded-none">
        <div className="w-7 h-7 bg-cyber-black text-cyber-green border border-cyber-green flex items-center justify-center shrink-0">
          <Terminal className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <p className="text-xs font-bold uppercase text-cyber-green leading-snug flex-1">
          {toast.message}
        </p>
      </div>
    </div>
  );
}
