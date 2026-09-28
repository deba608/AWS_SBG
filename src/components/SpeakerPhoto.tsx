"use client";

import { useState } from "react";
import { Mic } from "lucide-react";

export default function SpeakerPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="inline-flex h-36 w-36 items-center justify-center rounded-3xl border border-line bg-ink text-faint">
        <Mic className="h-10 w-10" aria-hidden />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={144}
      height={144}
      onError={() => setFailed(true)}
      className="h-36 w-36 rounded-3xl border border-line object-cover shadow-[0_16px_48px_rgba(0,0,0,0.5)] ring-1 ring-brand/25"
    />
  );
}
