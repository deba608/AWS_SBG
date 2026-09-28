"use client";

import { useState } from "react";
import { Mic } from "lucide-react";

export default function SpeakerPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="inline-flex h-28 w-28 items-center justify-center rounded-2xl border border-line bg-ink text-faint">
        <Mic className="h-8 w-8" aria-hidden />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={112}
      height={112}
      onError={() => setFailed(true)}
      className="h-28 w-28 rounded-2xl border border-line object-cover"
    />
  );
}
