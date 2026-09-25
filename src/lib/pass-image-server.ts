import { createCanvas, loadImage } from "@napi-rs/canvas";

/** Server twin of client drawPassImage — same 900x1250 info, plain rects. */
export async function drawPassImageServer(input: {
  serial: string;
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

    // serial, right side of header
    if (input.serial) {
      ctx.fillStyle = "#f5f3ee";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`No. ${input.serial}`, W - 50, 130);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = "#f5f3ee";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText(input.name.slice(0, 28), 50, 300);
    ctx.fillStyle = "#a8b0bb";
    ctx.font = "30px sans-serif";
    ctx.fillText(input.email.slice(0, 40), 50, 350);
    // solid food badge + roll line (no veg logos)
    const vegMeal = input.food === "Veg";
    const badgeLabel = vegMeal ? "VEG" : "NON-VEG";
    ctx.font = "bold 26px sans-serif";
    const badgeW = ctx.measureText(badgeLabel).width + 40;
    const badgeY = 382;
    ctx.fillStyle = vegMeal ? "#16a34a" : "#dc2626";
    const rc = ctx as CanvasRenderingContext2D & { roundRect?: (...a: number[]) => void };
    if (typeof rc.roundRect === "function") {
      ctx.beginPath();
      rc.roundRect(50, badgeY, badgeW, 46, 12);
      ctx.fill();
    } else {
      ctx.fillRect(50, badgeY, badgeW, 46);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillText(badgeLabel, 50 + 20, badgeY + 32);
    ctx.fillStyle = "#6b7480";
    ctx.font = "30px sans-serif";
    ctx.fillText(`Roll: ${input.rollNo}`, 50 + badgeW + 18, badgeY + 32);

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
    ctx.fillText(tok, 50, 1085);
    ctx.fillStyle = "#ad5cff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Show QR at gate · scans once", 50, 1132);
    ctx.fillStyle = "#6b7480";
    ctx.font = "26px sans-serif";
    ctx.fillText("Backup: take a screenshot of this pass.", 50, 1176);

    return Buffer.from(canvas.toBuffer("image/png"));
  } catch (err) {
    console.error("[passes/pass-image]", err);
    throw err;
  }
}
