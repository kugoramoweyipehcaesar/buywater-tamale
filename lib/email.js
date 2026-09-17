/**
 * BuyWater email helper
 * Priority: RESEND_API_KEY → SMTP/EMAIL_* env → console fallback
 * Super admin always: kugoramoweyipehcaesar49@gmail.com (override via ADMIN_EMAIL)
 */

import nodemailer from "nodemailer";

const SUPER_ADMIN =
  process.env.ADMIN_EMAIL ||
  process.env.SUPER_ADMIN_EMAIL ||
  "kugoramoweyipehcaesar49@gmail.com";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://buywater-tamale.onrender.com";

const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || "";
const FROM =
  process.env.SMTP_FROM ||
  process.env.EMAIL_FROM ||
  (SMTP_USER ? `BuyWater <${SMTP_USER}>` : `BuyWater <${SUPER_ADMIN}>`);

let transporter = null;
let smtpConfigured = null;

export function isSmtpConfigured() {
  if (smtpConfigured != null) return smtpConfigured;
  if (process.env.RESEND_API_KEY) {
    smtpConfigured = true;
    return true;
  }
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(
    /\s/g,
    ""
  );
  smtpConfigured = !!(host && user && pass);
  return smtpConfigured;
}

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "";
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || "";
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(
    /\s/g,
    ""
  );
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.EMAIL_SECURE === "true" ||
    port === 465;

  if (host && user && pass) {
    console.log("[email] SMTP configured:", host, "port:", port, "user:", user);
    if (host.includes("gmail") || user.endsWith("@gmail.com")) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
        tls: { rejectUnauthorized: false },
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
        tls: { rejectUnauthorized: false },
      });
    }
  } else {
    console.warn("[email] No SMTP/EMAIL env – emails log to console only");
    transporter = {
      sendMail: async (opts) => {
        console.log("\n========== EMAIL (dev – no SMTP) ==========");
        console.log("To:", opts.to);
        console.log("Cc:", opts.cc);
        console.log("Subject:", opts.subject);
        console.log("Text:", opts.text);
        console.log("===========================================\n");
        return { messageId: "dev-" + Date.now() };
      },
    };
  }
  return transporter;
}

async function sendViaResend({ to, cc, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;

  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    "BuyWater <onboarding@resend.dev>";

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html: html || `<pre style="font-family:sans-serif">${text}</pre>`,
  };
  if (cc) payload.cc = Array.isArray(cc) ? cc : [cc];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Resend HTTP ${res.status}`);
  }
  return { messageId: data.id || "resend-ok" };
}

async function sendMailOnce({ to, cc, subject, text, html }) {
  if (process.env.RESEND_API_KEY) {
    try {
      const info = await sendViaResend({ to, cc, subject, text, html });
      if (info) {
        console.log("[email] Resend OK →", to, "|", subject, "| id:", info.messageId);
        return { ok: true, messageId: info.messageId, provider: "resend" };
      }
    } catch (err) {
      console.error("[email] Resend failed, trying SMTP:", err.message);
    }
  }

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    cc: cc || undefined,
    subject,
    text,
    html: html || `<pre style="font-family:sans-serif">${text}</pre>`,
    headers: {
      "X-BuyWater": "1",
      "X-Priority": "1",
    },
  });
  console.log("[email] SMTP OK →", to, "|", subject, "| id:", info.messageId);
  return { ok: true, messageId: info.messageId, provider: "smtp" };
}

async function sendMail({ to, cc, subject, text, html }) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await sendMailOnce({ to, cc, subject, text, html });
    } catch (err) {
      lastErr = err;
      console.error(
        `[email] attempt ${attempt} FAILED →`,
        to,
        "|",
        subject,
        "|",
        err.message
      );
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  return { ok: false, error: lastErr?.message || "Send failed" };
}

function wrapHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#EEF6FC;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06)">
    <div style="background:#0077C8;padding:20px 24px;color:#fff">
      <div style="font-size:20px;font-weight:700">BuyWater</div>
      <div style="font-size:13px;opacity:.9">Fresh Water Delivered · Tamale</div>
    </div>
    <div style="padding:24px">
      <h1 style="margin:0 0 12px;font-size:18px;color:#0B2545">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:14px 24px;background:#f8fafc;font-size:12px;color:#64748b;text-align:center">
      BuyWater · Delivery in Tamale · Do not share this email with anyone
    </div>
  </div>
</body></html>`;
}

export async function resolveAdminEmail() {
  try {
    const { prisma } = await import("./prisma");
    const s = await prisma.appSettings.findFirst({ orderBy: { id: "asc" } });
    if (s?.adminEmail && String(s.adminEmail).includes("@")) {
      return String(s.adminEmail).trim().toLowerCase();
    }
  } catch (_) {}
  return SUPER_ADMIN;
}

export async function sendPasswordResetEmail(email, resetUrl) {
  const subject = "Reset your BuyWater password";
  const text = `You requested a password reset for BuyWater.\n\nOpen this link (valid 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email. Never share this link.`;
  const html = wrapHtml(
    "Reset your password",
    `<p style="color:#475569;line-height:1.5">We received a request to reset the password for <strong>${email}</strong>.</p>
     <p style="margin:20px 0"><a href="${resetUrl}" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Reset password</a></p>
     <p style="color:#94a3b8;font-size:13px">This link expires in <strong>1 hour</strong> and can only be used once.</p>`
  );
  const userResult = await sendMail({ to: email, subject, text, html });
  const adminTo = await resolveAdminEmail();
  await sendMail({
    to: adminTo,
    subject: `[BuyWater] Password reset requested: ${email}`,
    text: `Password reset for ${email} at ${new Date().toISOString()}`,
    html: wrapHtml("Password reset requested", `<p><strong>${email}</strong></p>`),
  });
  return userResult;
}

export async function sendAdminInviteEmail(email, inviteUrl, role = "ADMIN") {
  const subject = `[BuyWater] You are invited as ${role}`;
  const text = `You have been invited as ${role}.\n${inviteUrl}`;
  const html = wrapHtml(
    `Admin invite · ${role}`,
    `<p>You are invited as <strong>${role}</strong>.</p>
     <p style="margin:20px 0"><a href="${inviteUrl}" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Accept invite</a></p>`
  );
  const adminTo = await resolveAdminEmail();
  return sendMail({ to: email, cc: adminTo, subject, text, html });
}

export async function notifyAdminLogin({ email, name, role, when, ip }) {
  const to = await resolveAdminEmail();
  const subject = `[BuyWater] Login: ${email}`;
  const text = `Login: ${email} / ${role} / ${when} / ${ip || "—"}`;
  const html = wrapHtml(
    "User login",
    `<table style="width:100%;font-size:14px;color:#334155">
      <tr><td style="padding:4px 0;color:#64748b">Email</td><td><strong>${email}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Name</td><td>${name || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Role</td><td>${role}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Time</td><td>${when}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">IP</td><td>${ip || "—"}</td></tr>
    </table>`
  );
  return sendMail({ to, subject, text, html });
}

function formatProducts(order) {
  try {
    const raw = order.products;
    const items = typeof raw === "string" ? JSON.parse(raw || "[]") : raw || [];
    if (!Array.isArray(items) || items.length === 0) return "—";
    return items
      .map((p) => {
        const name = p.name || p.title || p.product || "Item";
        const qty = p.qty || p.quantity || p.gallons || 1;
        return `${name} × ${qty}`;
      })
      .join(", ");
  } catch {
    return String(order.products || "—").slice(0, 200);
  }
}

export async function notifyAdminOrderPlaced(order) {
  const to = await resolveAdminEmail();
  const productsLine = formatProducts(order);
  const subject = `[BuyWater] New order ${order.orderNumber}`;
  const text = `NEW ORDER ${order.orderNumber}
Customer: ${order.customerName}
Phone: ${order.phone}
Email: ${order.email || "—"}
Hostel: ${order.hostel || order.address || "—"}
Room / Block: ${order.roomNumber || "—"} / ${order.blockNumber || "—"}
Items: ${productsLine}
Gallons: ${order.gallons}
Total: Ghc ${Number(order.totalAmount).toFixed(2)}
Payment: ${order.paymentMethod}
MoMo: ${order.momoNumber || "—"} ${order.momoReference || ""}
Notes: ${order.notes || "—"}
Admin: ${APP_URL}/admin
`;
  const html = wrapHtml(
    `New order ${order.orderNumber}`,
    `<table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#64748b;width:40%">Order #</td><td><strong>${order.orderNumber}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Customer</td><td><strong>${order.customerName}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Phone</td><td><a href="tel:${order.phone || ""}">${order.phone || "—"}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td>${order.email || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Hostel / Address</td><td>${order.hostel || order.address || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Room / Block</td><td>${order.roomNumber || "—"} / ${order.blockNumber || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Items</td><td>${productsLine}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Gallons</td><td>${order.gallons}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Total</td><td><strong style="color:#0077C8;font-size:16px">Ghc ${Number(order.totalAmount).toFixed(2)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Payment</td><td>${String(order.paymentMethod || "").toLowerCase().includes("momo") ? "Mobile Money" : "Cash on Delivery"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Notes</td><td>${order.notes || "—"}</td></tr>
    </table>
    <p style="margin-top:20px"><a href="${APP_URL}/admin" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">Open admin dashboard</a></p>`
  );
  console.log("[email] notifyAdminOrderPlaced →", to, order.orderNumber);
  const result = await sendMail({ to, subject, text, html });
  console.log("[email] notifyAdminOrderPlaced result:", result);
  return result;
}

export async function notifyAdminOrderCancelled(order) {
  const to = await resolveAdminEmail();
  const subject = `[BuyWater] Order cancelled ${order.orderNumber}`;
  const text = `ORDER CANCELLED ${order.orderNumber}
Customer: ${order.customerName}
Phone: ${order.phone || "—"}
Email: ${order.email || "—"}
Hostel: ${order.hostel || order.address || "—"}
Gallons: ${order.gallons}
Reason: ${order.cancelReason || "—"}
Total: Ghc ${Number(order.totalAmount).toFixed(2)}
Admin: ${APP_URL}/admin
`;
  const html = wrapHtml(
    `Order cancelled ${order.orderNumber}`,
    `<table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#64748b;width:40%">Order #</td><td><strong>${order.orderNumber}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Customer</td><td><strong>${order.customerName}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Phone</td><td>${order.phone || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td>${order.email || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Hostel</td><td>${order.hostel || order.address || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Gallons</td><td>${order.gallons || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Reason</td><td><strong style="color:#b91c1c">${order.cancelReason || "—"}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Total</td><td>Ghc ${Number(order.totalAmount).toFixed(2)}</td></tr>
    </table>
    <p style="margin-top:20px"><a href="${APP_URL}/admin" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">Open admin dashboard</a></p>`
  );
  console.log("[email] notifyAdminOrderCancelled →", to, order.orderNumber);
  const result = await sendMail({ to, subject, text, html });
  console.log("[email] notifyAdminOrderCancelled result:", result);
  return result;
}

export async function sendTestEmail(to = SUPER_ADMIN) {
  const subject = `[BuyWater] Test email · ${new Date().toISOString()}`;
  const text = `BuyWater test email.\nSMTP: ${isSmtpConfigured()}\nResend: ${!!process.env.RESEND_API_KEY}\nTo: ${to}`;
  const html = wrapHtml(
    "Email system test",
    `<p>If you received this, outbound email is working.</p>
     <p style="font-size:13px;color:#64748b">SMTP: <strong>${isSmtpConfigured() ? "yes" : "no"}</strong><br/>Resend: <strong>${process.env.RESEND_API_KEY ? "yes" : "no"}</strong><br/>To: <strong>${to}</strong></p>`
  );
  return sendMail({ to, subject, text, html });
}

export { SUPER_ADMIN, APP_URL, sendMail };
