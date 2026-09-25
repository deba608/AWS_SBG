import { createCanvas, loadImage } from "@napi-rs/canvas";

/** Server twin of client drawPassImage — same 900x1250 info, plain rects. */
export async function drawPassImageServer(input: {
  name: string;
  email: string;
  rollNo: string;
  food: string;
  qrDataUrl: string;
  token: string;
}): Promise<Buffer> {
  try {
    const W = 900;
    const H = 1250;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#141a20";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ad5cff";
    ctx.fillRect(0, 0, W, 10);

    ctx.fillStyle = "#6b7480";
    ctx.font = "28px sans-serif";
    ctx.fillText("AWS SBG · COMMUNITY DAY", 50, 80);
    ctx.fillStyle = "#f5f3ee";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText("Event Entry Pass", 50, 145);
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#a8b0bb";
    ctx.fillText("AWS Student Community Day · Oct 6-8 · SUIIT", 50, 195);

    ctx.fillStyle = "#f5f3ee";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText(input.name.slice(0, 28), 50, 300);
    ctx.fillStyle = "#a8b0bb";
    ctx.font = "30px sans-serif";
    ctx.fillText(input.email.slice(0, 40), 50, 350);
    // veg / non-veg mark + roll line (mirrors web pass)
    const vegMeal = input.food === "Veg";
    ctx.lineWidth = 4;
    ctx.strokeStyle = vegMeal ? "#34d399" : "#f87171";
    ctx.strokeRect(50, 392, 34, 34);
    ctx.fillStyle = vegMeal ? "#34d399" : "#f87171";
    if (vegMeal) {
      ctx.beginPath();
      ctx.arc(67, 409, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(67, 398);
      ctx.lineTo(77, 416);
      ctx.lineTo(57, 416);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#6b7480";
    ctx.fillText(`Roll: ${input.rollNo} · Food: ${input.food}`, 100, 419);

    // divider
    ctx.strokeStyle = "#232c36";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 468);
    ctx.lineTo(W - 50, 468);
    ctx.stroke();

    const QR = 500;
    const qx = (W - QR) / 2;
    const qy = 508;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qx - 24, qy - 24, QR + 48, QR + 48);
    const img = await loadImage(input.qrDataUrl);
    ctx.drawImage(img, qx, qy, QR, QR);

    ctx.fillStyle = "#6b7480";
    ctx.font = "22px monospace";
    const tok = input.token.length > 48 ? `${input.token.slice(0, 48)}…` : input.token;
    ctx.fillText(tok, 50, 1060);
    ctx.fillStyle = "#ad5cff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Show QR at gate · scans once", 50, 1115);
    ctx.fillStyle = "#6b7480";
    ctx.font = "26px sans-serif";
    ctx.fillText("Backup: take a screenshot of this pass.", 50, 1158);

    return Buffer.from(canvas.toBuffer("image/png"));
  } catch (err) {
    console.error("[passes/pass-image]", err);
    throw err;
  }
}
