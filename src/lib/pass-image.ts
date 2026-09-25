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

  // brand accent bar
  ctx.fillStyle = "#ad5cff";
  ctx.fillRect(0, 0, W, 10);

  // header
  ctx.fillStyle = "#6b7480";
  ctx.font = "28px ui-monospace, monospace";
  ctx.fillText("AWS SBG · COMMUNITY DAY", 50, 80);
  ctx.fillStyle = "#f5f3ee";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText("Event Entry Pass", 50, 145);
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#a8b0bb";
  ctx.fillText("AWS Student Community Day · Oct 6–8 · SUIIT", 50, 195);

  // serial, right side of header
  if (input.serial) {
    ctx.fillStyle = "#f5f3ee";
    ctx.font = "bold 32px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`No. ${input.serial}`, W - 50, 130);
    ctx.textAlign = "left";
  }

  // name block
  ctx.fillStyle = "#f5f3ee";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText(input.name.slice(0, 28), 50, 300);
  ctx.fillStyle = "#a8b0bb";
  ctx.font = "30px system-ui, sans-serif";
  ctx.fillText(input.email.slice(0, 40), 50, 350);
  // solid food badge + roll line (no veg logos)
  const vegMeal = input.food === "Veg";
  const badgeLabel = vegMeal ? "VEG" : "NON-VEG";
  ctx.font = "bold 26px system-ui, sans-serif";
  const badgeW = ctx.measureText(badgeLabel).width + 40;
  const badgeY = 382;
  ctx.fillStyle = vegMeal ? "#16a34a" : "#dc2626";
  ctx.beginPath();
  ctx.roundRect(50, badgeY, badgeW, 46, 12);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(badgeLabel, 50 + 20, badgeY + 32);
  ctx.fillStyle = "#6b7480";
  ctx.font = "30px system-ui, sans-serif";
  ctx.fillText(`Roll: ${input.rollNo}`, 50 + badgeW + 18, badgeY + 32);

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
