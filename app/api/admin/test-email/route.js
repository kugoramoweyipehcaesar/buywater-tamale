import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendTestEmail, SUPER_ADMIN } from "@/lib/email";

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const to = (body.to || SUPER_ADMIN).toString().trim().toLowerCase();
    const result = await sendTestEmail(to);
    return NextResponse.json({
      success: !!result.ok,
      result,
      resendConfigured: !!process.env.RESEND_API_KEY,
      smtpConfigured: false,
      to,
      from: "onboarding@resend.dev",
      hint: !process.env.RESEND_API_KEY
        ? "Set RESEND_API_KEY on Render. Remove all SMTP_* variables."
        : result.ok
          ? "Check inbox/spam. Free Resend only delivers to your Resend account email."
          : "Send failed — see result.error and Render logs [email]",
    });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json(
      {
        error: e.message || "Server error",
        resendConfigured: !!process.env.RESEND_API_KEY,
      },
      { status }
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({
      resendConfigured: !!process.env.RESEND_API_KEY,
      smtpConfigured: false,
      superAdmin: SUPER_ADMIN,
      from: "onboarding@resend.dev",
      hasResendKey: !!process.env.RESEND_API_KEY,
    });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
