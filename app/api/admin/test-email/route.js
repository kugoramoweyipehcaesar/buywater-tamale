import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  sendTestEmail,
  isSmtpConfigured,
  SUPER_ADMIN,
} from "@/lib/email";

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const to = (body.to || SUPER_ADMIN).toString().trim().toLowerCase();

    const result = await sendTestEmail(to);

    return NextResponse.json({
      success: !!result.ok,
      result,
      smtpConfigured: isSmtpConfigured(),
      resendConfigured: !!process.env.RESEND_API_KEY,
      to,
      superAdmin: SUPER_ADMIN,
      hint: !isSmtpConfigured()
        ? "Set SMTP_HOST, SMTP_USER, SMTP_PASS (Gmail App Password) or RESEND_API_KEY on Render"
        : result.ok
          ? "Check inbox and spam for the test message"
          : "Send failed — check Render logs and SMTP credentials",
    });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json(
      { error: e.message || "Server error", smtpConfigured: isSmtpConfigured() },
      { status }
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({
      smtpConfigured: isSmtpConfigured(),
      resendConfigured: !!process.env.RESEND_API_KEY,
      superAdmin: SUPER_ADMIN,
      hasSmtpHost: !!(process.env.SMTP_HOST || process.env.EMAIL_HOST),
      hasSmtpUser: !!(process.env.SMTP_USER || process.env.EMAIL_USER),
      hasSmtpPass: !!(process.env.SMTP_PASS || process.env.EMAIL_PASS),
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || null,
    });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
