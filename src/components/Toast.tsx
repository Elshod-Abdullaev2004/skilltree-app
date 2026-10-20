"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[390px] animate-in slide-in-from-top-4 duration-200 pointer-events-none">
      <div className="bg-manga-lime border-[3.5px] border-black p-3.5 shadow-[5px_5px_0px_#000] flex items-center gap-3 pointer-events-auto">
        <div className="w-8 h-8 bg-black text-manga-yellow border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
          <Sparkles className="w-4.5 h-4.5 stroke-[2.5]" />
        </div>
        <p className="text-xs font-black uppercase text-black leading-snug flex-1">
          {toast.message}
        </p>
      </div>
    </div>
  );
}
