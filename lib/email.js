/**
 * BuyWater email — Resend ONLY (no nodemailer / no SMTP)
 * Free Resend: from must be onboarding@resend.dev
 * Deliverable "to" on free plan is usually the Resend account email only.
 */

import { Resend } from "resend";

const FROM = "BuyWater <onboarding@resend.dev>";
const ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "kugoramoweyipehcaesar49@gmail.com";

const APP_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://buywater-tamale.onrender.com";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[email] RESEND_API_KEY is missing");
    return null;
  }
  return new Resend(key);
}

/** Core send — Resend only */
export async function sendEmail({ to, subject, html, text }) {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not set on Render" };
  }

  const recipient = to || ADMIN_EMAIL;
  console.log("[email] Sending via Resend →", recipient, "|", subject);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(recipient) ? recipient : [recipient],
      subject,
      html:
        html ||
        `<pre style="font-family:sans-serif">${text || subject}</pre>`,
      text: text || undefined,
    });

    if (error) {
      console.error("[email] Resend FAILED:", error);
      return {
        ok: false,
        error:
          typeof error === "string"
            ? error
            : error.message || JSON.stringify(error),
      };
    }

    console.log("[email] Resend SUCCESS:", data);
    return { ok: true, data, messageId: data?.id };
  } catch (err) {
    console.error("[email] CRITICAL FAIL:", err?.message || err);
    return { ok: false, error: err?.message || String(err) };
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
      BuyWater · Delivery in Tamale
    </div>
  </div>
</body></html>`;
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

/** Admin: new order */
export async function notifyAdminOrderPlaced(order) {
  const num = order.orderNumber || order.order_number || order.id;
  const total = Number(order.totalAmount ?? order.total_amount ?? 0).toFixed(2);
  const subject = `[BuyWater] New order ${num} — Ghc ${total}`;
  const productsLine = formatProducts(order);
  const html = wrapHtml(
    `New order ${num}`,
    `<table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#64748b;width:40%">Order #</td><td><strong>${num}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Customer</td><td><strong>${order.customerName || order.customer_name || "—"}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Phone</td><td>${order.phone || order.customer_phone || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td>${order.email || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Hostel / Address</td><td>${order.hostel || order.address || order.delivery_address || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Room / Block</td><td>${order.roomNumber || "—"} / ${order.blockNumber || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Items</td><td>${productsLine}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Gallons</td><td>${order.gallons ?? "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Total</td><td><strong style="color:#0077C8;font-size:16px">Ghc ${total}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Payment</td><td>${String(order.paymentMethod || "").toLowerCase().includes("momo") ? "Mobile Money" : "Cash on Delivery"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Notes</td><td>${order.notes || "—"}</td></tr>
    </table>
    <p style="margin-top:20px"><a href="${APP_URL}/admin" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">Open admin</a></p>`
  );
  return sendEmail({ to: ADMIN_EMAIL, subject, html });
}

/** Admin: order cancelled */
export async function notifyAdminOrderCancelled(order) {
  const num = order.orderNumber || order.order_number || order.id;
  const total = Number(order.totalAmount ?? order.total_amount ?? 0).toFixed(2);
  const subject = `[BuyWater] Order cancelled ${num}`;
  const html = wrapHtml(
    `Order cancelled ${num}`,
    `<table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#64748b;width:40%">Order #</td><td><strong>${num}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Customer</td><td><strong>${order.customerName || "—"}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Phone</td><td>${order.phone || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td>${order.email || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Hostel</td><td>${order.hostel || order.address || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Gallons</td><td>${order.gallons ?? "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Reason</td><td><strong style="color:#b91c1c">${order.cancelReason || "—"}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Total</td><td>Ghc ${total}</td></tr>
    </table>
    <p style="margin-top:20px"><a href="${APP_URL}/admin" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">Open admin</a></p>`
  );
  return sendEmail({ to: ADMIN_EMAIL, subject, html });
}

/** Admin: login alert */
export async function notifyAdminLogin({ email, name, role, when, ip }) {
  const subject = `[BuyWater] Login: ${email}`;
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
  return sendEmail({ to: ADMIN_EMAIL, subject, html });
}

/** Password reset */
export async function sendPasswordResetEmail(email, resetUrl) {
  const subject = "Reset your BuyWater password";
  const html = wrapHtml(
    "Reset your password",
    `<p style="color:#475569">Reset link for <strong>${email}</strong>:</p>
     <p style="margin:20px 0"><a href="${resetUrl}" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Reset password</a></p>
     <p style="color:#94a3b8;font-size:12px;word-break:break-all">${resetUrl}</p>`
  );
  const userResult = await sendEmail({ to: email, subject, html });
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[BuyWater] Password reset requested: ${email}`,
    html: wrapHtml(
      "Password reset requested",
      `<p><strong>${email}</strong></p>
       <p>User send: ${userResult.ok ? "OK" : userResult.error || "failed"}</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>`
    ),
  });
  return userResult.ok ? userResult : { ok: true, data: { adminNotified: true } };
}

/** Admin invite */
export async function sendAdminInviteEmail(email, inviteUrl, role = "ADMIN") {
  const subject = `[BuyWater] You are invited as ${role}`;
  const html = wrapHtml(
    `Admin invite · ${role}`,
    `<p>You are invited as <strong>${role}</strong>.</p>
     <p style="margin:20px 0"><a href="${inviteUrl}" style="display:inline-block;background:#0077C8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Accept invite</a></p>`
  );
  const toUser = await sendEmail({ to: email, subject, html });
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[BuyWater] Invite sent to ${email} as ${role}`,
    html: wrapHtml(
      "Invite copy",
      `<p>To: ${email}</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>User result: ${toUser.ok ? "OK" : toUser.error}</p>`
    ),
  });
  return toUser;
}

/** Test email to admin */
export async function sendTestEmail(to = ADMIN_EMAIL) {
  return sendEmail({
    to: to || ADMIN_EMAIL,
    subject: `[BuyWater] Test email · ${new Date().toISOString()}`,
    html: wrapHtml(
      "Email system test",
      `<p>If you received this, <strong>Resend is working</strong>.</p>
       <p style="font-size:13px;color:#64748b">From: ${FROM}<br/>To: ${to || ADMIN_EMAIL}<br/>Time: ${new Date().toLocaleString()}</p>`
    ),
  });
}

export function isSmtpConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export const SUPER_ADMIN = ADMIN_EMAIL;

export default {
  sendEmail,
  notifyAdminOrderPlaced,
  notifyAdminOrderCancelled,
};
