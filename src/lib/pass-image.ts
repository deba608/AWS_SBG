"use client";

/** Compose a shareable pass PNG on canvas. No deps. 900x1250. */
export async function drawPassImage(input: {
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

  // bg
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // header band
  ctx.fillStyle = "#7c3aed";
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px system-ui, sans-serif";
  ctx.fillText("Event Entry Pass", 50, 90);
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#e9d5ff";
  ctx.fillText("AWS Student Community Day · Oct 6–8 · SUIIT", 50, 145);

  // name block
  ctx.fillStyle = "#111111";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText(input.name.slice(0, 28), 50, 290);
  ctx.fillStyle = "#555555";
  ctx.font = "30px system-ui, sans-serif";
  ctx.fillText(input.email.slice(0, 40), 50, 340);
  ctx.fillText(`Roll: ${input.rollNo} · Food: ${input.food}`, 50, 385);

  // QR
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("QR load failed."));
    img.src = input.qrDataUrl;
  });
  const QR = 560;
  ctx.drawImage(img, (W - QR) / 2, 440, QR, QR);

  // token + hint
  ctx.fillStyle = "#333333";
  ctx.font = "22px ui-monospace, monospace";
  const tok = input.token.length > 48 ? `${input.token.slice(0, 48)}…` : input.token;
  ctx.fillText(tok, 50, 1060);
  ctx.fillStyle = "#7c3aed";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("Show QR at gate · scans once", 50, 1115);
  ctx.fillStyle = "#777777";
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText("Backup: take a screenshot of this pass.", 50, 1158);

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
