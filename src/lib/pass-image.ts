"use client";

/** Compose a shareable pass PNG on canvas. No deps. 900x1250. */
export async function drawPassImage(input: {
  serial: string;
  name: string;
  email: string;
  rollNo: string;
  food: string;
  qrDataUrl: string;
  token: string;
}): Promise<string> {
  const W = 900;
  const H = 1250;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");

  // bg (site surface)
  ctx.fillStyle = "#141a20";
  ctx.fillRect(0, 0, W, H);

  // logo
  const logo = new Image();
  await new Promise<void>((resolve) => {
    logo.onload = () => resolve();
    logo.onerror = () => resolve(); // proceed without logo
    logo.src = "/logo.png";
  });
  if (logo.naturalWidth > 0) ctx.drawImage(logo, 50, 42, 110, 110);

  // header
  ctx.fillStyle = "#f5f3ee";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText("Event Entry Pass", 180, 118);
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#a8b0bb";
  ctx.fillText("AWS Student Community Day · Oct 6–8 · SUIIT", 180, 166);

  // serial as white solid badge, right side of header
  if (input.serial) {
    const label = `Serial No. ${input.serial}`;
    ctx.font = "bold 32px ui-monospace, monospace";
    const tw = ctx.measureText(label).width;
    const bw = tw + 48;
    const bx = W - 50 - bw;
    const by = 78;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 56, 28);
    ctx.fill();
    ctx.fillStyle = "#141a20";
    ctx.textAlign = "left";
    ctx.fillText(label, bx + 24, by + 38);
  }

  // name block
  ctx.fillStyle = "#f5f3ee";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText(input.name.slice(0, 28), 50, 300);
  ctx.fillStyle = "#a8b0bb";
  ctx.font = "30px system-ui, sans-serif";
  ctx.fillText(input.email.slice(0, 40), 50, 350);
  // roll left, food badge right
  const vegMeal = input.food === "Veg";
  const badgeLabel = vegMeal ? "VEG" : "NON-VEG";
  ctx.font = "bold 26px system-ui, sans-serif";
  const badgeW = ctx.measureText(badgeLabel).width + 72;
  const badgeX = W - 50 - badgeW;
  const badgeY = 382;
  ctx.fillStyle = "#6b7480";
  ctx.font = "30px system-ui, sans-serif";
  ctx.fillText(`Roll: ${input.rollNo}`, 50, badgeY + 32);
  ctx.fillStyle = vegMeal ? "#16a34a33" : "#dc262633";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, 46, 23);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = vegMeal ? "#34d399" : "#f87171";
  ctx.stroke();
  ctx.fillStyle = vegMeal ? "#34d399" : "#f87171";
  ctx.beginPath();
  ctx.arc(badgeX + 24, badgeY + 23, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = vegMeal ? "#a7f3d0" : "#fecaca";
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.fillText(badgeLabel, badgeX + 42, badgeY + 32);

  // divider
  ctx.strokeStyle = "#232c36";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 468);
  ctx.lineTo(W - 50, 468);
  ctx.stroke();

  // QR on white well (keeps contrast for scanners)
  const QR = 500;
  const qx = (W - QR) / 2;
  const qy = 508;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(qx - 24, qy - 24, QR + 48, QR + 48, 28);
  ctx.fill();

  // QR
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("QR load failed."));
    img.src = input.qrDataUrl;
  });
  ctx.drawImage(img, qx, qy, QR, QR);

  // token + hint
  ctx.fillStyle = "#6b7480";
  ctx.font = "22px ui-monospace, monospace";
  const tok = input.token.length > 48 ? `${input.token.slice(0, 48)}…` : input.token;
  ctx.fillText(tok, 50, 1085);
  ctx.fillStyle = "#ad5cff";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("One-time entry · invalid after gate scan", 50, 1132);
  ctx.fillStyle = "#6b7480";
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText("Backup: take a screenshot of this pass.", 50, 1176);

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Email the exact PNG shown on web — server sends it as-is, zero drift. */
export async function emailExactPass(input: {
  serial: string;
  name: string;
  email: string;
  rollNo: string;
  food: string;
  qrDataUrl: string;
  token: string;
}): Promise<boolean> {
  try {
    const pngDataUrl = await drawPassImage(input);
    const res = await fetch("/api/passes/email-pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: input.token, pngDataUrl }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
