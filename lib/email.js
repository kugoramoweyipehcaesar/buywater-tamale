/**
 * BuyWater email helper (nodemailer)
 * Supports SMTP_* or EMAIL_* env vars (Render-friendly).
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
  (SMTP_USER ? `BuyWater <${SMTP_USER}>` : "BuyWater <noreply@buywater.local>");

let transporter = null;
let smtpConfigured = null;

export function isSmtpConfigured() {
  if (smtpConfigured != null) return smtpConfigured;
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

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
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
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 12000,
      tls: { rejectUnauthorized: false },
    });
  } else {
    console.warn("[email] No SMTP/EMAIL env – emails log to console only");
    transporter = {
      sendMail: async (opts) => {
        console.log("\n========== EMAIL (dev – no SMTP) ==========");
        console.log("To:", opts.to);
        console.log("Subject:", opts.subject);
        console.log("Text:", opts.text);
        console.log("===========================================\n");
        return { messageId: "dev-" + Date.now() };
      },
    };
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  try {
    const info = await getTransporter().sendMail({
      from: FROM,
      to,
      subject,
      text,
      html: html || `<pre style="font-family:sans-serif">${text}</pre>`,
    });
    console.log("[email] sent OK →", to, "|", subject, "| id:", info.messageId);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error("[email] SEND FAILED →", to, "|", subject, "|", err.message);
    return { ok: false, error: err.message };
  }
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

export async function sendPasswordResetEmail(email, resetUrl) {
  const subject = "Reset your BuyWater password";
  const text = `You requested a password reset for BuyWater.\n\nOpen this link (valid 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email. Never share this link.`;
  const html = wrapHtml(
    "Reset your password",
    `<p style="color:#475569;line-height:1.5">We received a request to reset the password for <strong>${email}</strong>.</p>
     <p style="margin:20px 0"><a href="${resetUrl}" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Reset password</a></p>
     <p style="color:#94a3b8;font-size:13px">This link expires in <strong>1 hour</strong> and can only be used once. If you did not ask for this, ignore this email — your account stays safe.</p>
     <p style="color:#94a3b8;font-size:11px;word-break:break-all">${resetUrl}</p>`
  );
  return sendMail({ to: email, subject, text, html });
}

/** Admin invite email – required by /api/admin/invite */
export async function sendAdminInviteEmail(email, inviteUrl, role = "ADMIN") {
  const subject = `[BuyWater] You are invited as ${role}`;
  const text = `You have been invited to join BuyWater as ${role}.\n\nAccept this invite (valid 24 hours):\n${inviteUrl}\n\nIf you did not expect this, ignore this email.`;
  const html = wrapHtml(
    `Admin invite · ${role}`,
    `<p style="color:#475569;line-height:1.5">You have been invited to manage <strong>BuyWater Tamale</strong> as <strong>${role}</strong>.</p>
     <p style="margin:20px 0"><a href="${inviteUrl}" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Accept invite</a></p>
     <p style="color:#94a3b8;font-size:13px">This link expires in <strong>24 hours</strong> and can only be used once.</p>
     <p style="color:#94a3b8;font-size:11px;word-break:break-all">${inviteUrl}</p>`
  );
  const result = await sendMail({ to: email, subject, text, html });
  console.log("[email] sendAdminInviteEmail result:", result);
  return result;
}

export async function notifyAdminLogin({ email, name, role, when, ip }) {
  const to = SUPER_ADMIN;
  const subject = `[BuyWater] Login: ${email}`;
  const text = `Login alert\nEmail: ${email}\nName: ${name || "—"}\nRole: ${role}\nTime: ${when}\nIP: ${ip || "—"}\n`;
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
  const result = await sendMail({ to, subject, text, html });
  console.log("[email] notifyAdminLogin result:", result);
  return result;
}

export async function notifyAdminOrderPlaced(order) {
  const to = SUPER_ADMIN;
  const subject = `[BuyWater] New order ${order.orderNumber}`;
  const text = `New order ${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${order.phone}\nEmail: ${order.email || "—"}\nHostel: ${order.hostel || order.address}\nRoom: ${order.roomNumber || "—"}\nGallons: ${order.gallons}\nTotal: Ghc${order.totalAmount}\nPayment: ${order.paymentMethod}\nNotes: ${order.notes || "—"}\n`;
  const html = wrapHtml(
    `New order ${order.orderNumber}`,
    `<table style="width:100%;font-size:14px;color:#334155">
      <tr><td style="padding:4px 0;color:#64748b">Customer</td><td><strong>${order.customerName}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Phone</td><td>${order.phone || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Email</td><td>${order.email || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Hostel</td><td>${order.hostel || order.address || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Room / Block</td><td>${order.roomNumber || "—"} / ${order.blockNumber || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Gallons</td><td>${order.gallons}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Total</td><td><strong style="color:#0077C8">Ghc${Number(order.totalAmount).toFixed(2)}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Payment</td><td>${order.paymentMethod === "momo" ? "Mobile Money" : "Cash on Delivery"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Notes</td><td>${order.notes || "—"}</td></tr>
    </table>
    <p style="margin-top:16px"><a href="${APP_URL}/admin" style="color:#0077C8">Open admin dashboard</a></p>`
  );
  const result = await sendMail({ to, subject, text, html });
  console.log("[email] notifyAdminOrderPlaced result:", result);
  return result;
}

export async function notifyAdminOrderCancelled(order) {
  const to = SUPER_ADMIN;
  const subject = `[BuyWater] Order cancelled ${order.orderNumber}`;
  const text = `Cancelled ${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${order.phone || "—"}\nReason: ${order.cancelReason || "—"}\nTotal: Ghc${order.totalAmount}\n`;
  const html = wrapHtml(
    `Order cancelled ${order.orderNumber}`,
    `<table style="width:100%;font-size:14px;color:#334155">
      <tr><td style="padding:4px 0;color:#64748b">Customer</td><td><strong>${order.customerName}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Phone</td><td>${order.phone || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Email</td><td>${order.email || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Reason</td><td>${order.cancelReason || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Total</td><td>Ghc${Number(order.totalAmount).toFixed(2)}</td></tr>
    </table>
    <p style="margin-top:16px"><a href="${APP_URL}/admin" style="color:#0077C8">Open admin dashboard</a></p>`
  );
  const result = await sendMail({ to, subject, text, html });
  console.log("[email] notifyAdminOrderCancelled result:", result);
  return result;
}

export { SUPER_ADMIN, APP_URL };
