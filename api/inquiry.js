import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { name, email, message } = req.body || {};

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim();
    const cleanMessage = String(message || "").trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailOk) {
      return res.status(400).json({ error: "Please enter a valid email." });
    }

    await resend.emails.send({
      from: process.env.INQUIRY_FROM_EMAIL,
      to: process.env.INQUIRY_TO_EMAIL,
      subject: `New inquiry from ${cleanName}`,
      reply_to: cleanEmail,
      html: `
        <h2>New inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(cleanMessage).replaceAll("\n", "<br>")}</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Inquiry function error:", error);
    return res.status(500).json({ error: "Server error." });
  }
}