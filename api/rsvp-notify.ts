// Guest RSVP -> Telegram. The bot token never reaches the browser: it is read
// from Vercel env vars TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID. If they are not
// set the RSVP is simply not forwarded.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, description: "Method not allowed" });

  const { guestName, attending, message } = req.body ?? {};
  if (typeof guestName !== "string" || typeof attending !== "boolean") {
    return res.status(400).json({ ok: false, description: "Invalid request" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(200).json({ ok: false, description: "Telegram notifications are off" });
  }

  const text =
    `🎊 <b>New RSVP Response</b>\n\n` +
    `👤 <b>Guest:</b> ${esc(guestName.slice(0, 100))}\n` +
    `✅ <b>Status:</b> ${attending ? "Attending" : "Not Attending"}\n` +
    `💌 <b>Message:</b> ${esc(String(message || "No message").slice(0, 1500))}\n` +
    `📅 <b>Date:</b> ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh" })}`;

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const body = await tg.json().catch(() => ({}));
    return res.status(tg.ok ? 200 : 502).json({ ok: tg.ok, description: body?.description });
  } catch {
    return res.status(502).json({ ok: false, description: "Could not reach Telegram" });
  }
}
