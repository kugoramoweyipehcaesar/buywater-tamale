/**
 * BuyWater email helper (nodemailer)
 * Requires SMTP_* in .env for real delivery.
 */

import nodemailer from "nodemailer";

const SUPER_ADMIN =
  process.env.SUPER_ADMIN_EMAIL || "kugoramoweyipehcaesar49@gmail.com";
const APP_URL =
  process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
const FROM =
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  "BuyWater <noreply@buywater.local>";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || "").replace(/\s/g, "");

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  } else {
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
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error("Email send failed:", err.message);
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

export async function notifyAdminLogin({ email, name, role, when }) {
  const subject = `[BuyWater] Login: ${email}`;
  const text = `Login alert\nEmail: ${email}\nName: ${name || "—"}\nRole: ${role}\nTime: ${when}\n`;
  const html = wrapHtml(
    "User login",
    `<table style="width:100%;font-size:14px;color:#334155">
      <tr><td style="padding:4px 0;color:#64748b">Email</td><td><strong>${email}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Name</td><td>${name || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Role</td><td>${role}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Time</td><td>${when}</td></tr>
    </table>`
  );
  return sendMail({ to: SUPER_ADMIN, subject, text, html });
}

export async function notifyAdminOrderPlaced(order) {
  const subject = `[BuyWater] New order ${order.orderNumber}`;
  const text = `New order ${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${order.phone}\nHostel: ${order.hostel || order.address}\nGallons: ${order.gallons}\nTotal: Ghc${order.totalAmount}\nPayment: ${order.paymentMethod}\n`;
  const html = wrapHtml(
    `New order ${order.orderNumber}`,
    `<table style="width:100%;font-size:14px;color:#334155">
      <tr><td style="padding:4px 0;color:#64748b">Customer</td><td><strong>${order.customerName}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Phone</td><td>${order.phone || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Email</td><td>${order.email || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Hostel</td><td>${order.hostel || order.address || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Gallons</td><td>${order.gallons}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Total</td><td><strong style="color:#0077C8">Ghc${Number(order.totalAmount).toFixed(2)}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Payment</td><td>${order.paymentMethod === "momo" ? "Mobile Money" : "Cash on Delivery"}</td></tr>
    </table>
    <p style="margin-top:16px"><a href="${APP_URL}/admin" style="color:#0077C8">Open admin dashboard</a></p>`
  );
  return sendMail({ to: SUPER_ADMIN, subject, text, html });
}

export async function notifyAdminOrderCancelled(order) {
  const subject = `[BuyWater] Order cancelled ${order.orderNumber}`;
  const text = `Cancelled ${order.orderNumber}\nCustomer: ${order.customerName}\nReason: ${order.cancelReason || "—"}\nTotal: Ghc${order.totalAmount}\n`;
  const html = wrapHtml(
    `Order cancelled ${order.orderNumber}`,
    `<table style="width:100%;font-size:14px;color:#334155">
      <tr><td style="padding:4px 0;color:#64748b">Customer</td><td><strong>${order.customerName}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Phone</td><td>${order.phone || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Reason</td><td>${order.cancelReason || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Total</td><td>Ghc${Number(order.totalAmount).toFixed(2)}</td></tr>
    </table>
    <p style="margin-top:16px"><a href="${APP_URL}/admin" style="color:#0077C8">Open admin dashboard</a></p>`
  );
  return sendMail({ to: SUPER_ADMIN, subject, text, html });
}

export { SUPER_ADMIN, APP_URL };
