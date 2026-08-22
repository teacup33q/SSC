import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({});

const TO_ADDRESS = "fly@seattlesimcenter.com";
const FROM_ADDRESS = "fly@seattlesimcenter.com"; // must be a verified SES identity

const ALLOWED_ORIGINS = new Set([
  "https://www.seattlesimcenter.com",
  "https://seattlesimcenter.com",
]);

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.seattlesimcenter.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const headers = corsHeaders(origin);

  const method = event.requestContext?.http?.method;
  if (method === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const name = (data.name || "").toString().trim().slice(0, 200);
  const email = (data.email || "").toString().trim().slice(0, 200);
  const program = (data.program || "").toString().trim().slice(0, 200);
  const message = (data.message || "").toString().trim().slice(0, 5000);

  if (!name || !EMAIL_RE.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing or invalid name/email" }) };
  }

  const textBody =
    `New contact form submission from seattlesimcenter.com\n\n` +
    `Name: ${name}\nEmail: ${email}\nInterested in: ${program || "-"}\n\n` +
    `Message:\n${message || "-"}\n`;

  const htmlBody =
    `<p><strong>New contact form submission from seattlesimcenter.com</strong></p>` +
    `<p><strong>Name:</strong> ${escapeHtml(name)}<br/>` +
    `<strong>Email:</strong> ${escapeHtml(email)}<br/>` +
    `<strong>Interested in:</strong> ${escapeHtml(program || "-")}</p>` +
    `<p><strong>Message:</strong><br/>${escapeHtml(message || "-").replace(/\n/g, "<br/>")}</p>`;

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: FROM_ADDRESS,
        Destination: { ToAddresses: [TO_ADDRESS] },
        ReplyToAddresses: [email],
        Content: {
          Simple: {
            Subject: { Data: `New inquiry: ${name}${program ? " — " + program : ""}` },
            Body: {
              Text: { Data: textBody },
              Html: { Data: htmlBody },
            },
          },
        },
      })
    );
  } catch (err) {
    console.error("SES send failed:", err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: "Failed to send email" }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};
