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

  // name block
  ctx.fillStyle = "#f5f3ee";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText(input.name.slice(0, 28), 50, 300);
  ctx.fillStyle = "#a8b0bb";
  ctx.font = "30px system-ui, sans-serif";
  ctx.fillText(input.email.slice(0, 40), 50, 350);
  // veg / non-veg mark + roll line
  const vegMeal = input.food === "Veg";
  ctx.lineWidth = 4;
  ctx.strokeStyle = vegMeal ? "#34d399" : "#f87171";
  ctx.strokeRect(50, 406, 34, 34);
  ctx.fillStyle = vegMeal ? "#34d399" : "#f87171";
  if (vegMeal) {
    ctx.beginPath();
    ctx.arc(67, 423, 9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(67, 412);
    ctx.lineTo(77, 430);
    ctx.lineTo(57, 430);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#6b7480";
  ctx.fillText(`Roll: ${input.rollNo} · Food: ${input.food}`, 100, 433);

  // QR on white well (keeps contrast for scanners)
  const QR = 560;
  const qx = (W - QR) / 2;
  const qy = 445;
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
  ctx.fillText(tok, 50, 1060);
  ctx.fillStyle = "#ad5cff";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("Show QR at gate · scans once", 50, 1115);
  ctx.fillStyle = "#6b7480";
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
