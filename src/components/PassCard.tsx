import { cn } from "@/lib/utils";

export type PassCardType = "ENTRY" | "FOOD";

export default function PassCard({
  name,
  email,
  mobile,
  type,
  qrImage,
  token,
}: {
  name: string;
  email: string;
  mobile: string;
  type: PassCardType;
  qrImage: string;
  token: string;
}) {
  const isEntry = type === "ENTRY";
  return (
    <div className="rank-card overflow-hidden bg-white text-black print:border-black print:shadow-none">
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3 text-sm font-bold tracking-wide text-white uppercase",
          isEntry ? "bg-[#7c3aed]" : "bg-[#15803d]",
        )}
      >
        <span>{isEntry ? "Event Entry Pass" : "Food Pass"}</span>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-mono">
          {type}
        </span>
      </div>
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImage}
          alt={`${type} QR for ${name}`}
          width={220}
          height={220}
          className="h-[220px] w-[220px] shrink-0 rounded-lg border border-black/10 bg-white p-2"
        />
        <div className="w-full min-w-0 text-center sm:text-left">
          <p className="truncate text-xl font-bold">{name}</p>
          <p className="mt-1 truncate text-sm text-black/60">{email}</p>
          <p className="text-sm text-black/60">{mobile}</p>
          <p className="mt-3 rounded-lg bg-black/5 p-2 font-mono text-[11px] break-all text-black/70">
            {token}
          </p>
          <p className="mt-2 text-xs font-medium text-black/50">
            {isEntry
              ? "Show at gate. Single scan — re-scan blocked."
              : "Show at food counter. Single meal — re-scan blocked."}
          </p>
        </div>
      </div>
    </div>
  );
}
