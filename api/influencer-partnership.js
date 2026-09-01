import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.map(cleanText).filter(Boolean)
    : [];
}

function emailRow(label, value) {
  const display = Array.isArray(value) ? value.join(", ") : value;
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(display || "Not provided").replaceAll("\n", "<br>")}</p>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = req.body || {};
    const startedAt = Number(body.startedAt);

    if (cleanText(body.company)) {
      return res.status(200).json({ ok: true });
    }

    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500) {
      return res.status(200).json({ ok: true });
    }

    const submission = {
      name: cleanText(body.name),
      email: cleanText(body.email),
      handles: cleanText(body.handles),
      platform: cleanList(body.platform),
      platformOther: cleanText(body.platformOther),
      audienceSize: cleanText(body.audienceSize),
      categories: cleanList(body.categories),
      categoryOther: cleanText(body.categoryOther),
      city: cleanText(body.city),
      state: cleanText(body.state),
      interests: cleanList(body.interests),
      consent: cleanText(body.consent) === "yes",
    };

    if (!submission.name || !submission.email || !submission.handles || !submission.city || !submission.state || !submission.consent) {
      return res.status(400).json({ error: "Please complete all required fields." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
      return res.status(400).json({ error: "Please enter a valid email." });
    }

    await resend.emails.send({
      from: process.env.INQUIRY_FROM_EMAIL,
      to: ["alan@maykeagency.com", "nia@maykeagency.com"],
      reply_to: submission.email,
      subject: `New Influencer Partnership Inquiry — ${submission.name}`,
      html: `
        <h2>New Influencer Partnership Inquiry</h2>
        ${emailRow("Name", submission.name)}
        ${emailRow("Email", submission.email)}
        ${emailRow("Primary social handle(s)", submission.handles)}
        ${emailRow("Primary platform", submission.platform)}
        ${emailRow("Other primary platform", submission.platformOther)}
        ${emailRow("Approximate audience size", submission.audienceSize)}
        ${emailRow("Content categories", submission.categories)}
        ${emailRow("Other content category", submission.categoryOther)}
        ${emailRow("Location", `${submission.city}, ${submission.state}`)}
        ${emailRow("Partnership interests", submission.interests)}
        ${emailRow("Email consent", "Yes")}
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Influencer partnership function error:", error);
    return res.status(500).json({ error: "Server error." });
  }
}
