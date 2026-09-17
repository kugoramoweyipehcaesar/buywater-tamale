import { NextResponse } from "next/server";
import { sendEmail, sendTestEmail, SUPER_ADMIN } from "@/lib/email";

/** GET /api/test-email — Resend-only smoke test */
export async function GET() {
  const to =
    process.env.SUPER_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    SUPER_ADMIN ||
    "kugoramoweyipehcaesar49@gmail.com";

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "RESEND_API_KEY is not set on Render Environment",
        hint: "Add RESEND_API_KEY only. Remove SMTP_* vars. From is onboarding@resend.dev",
      },
      { status: 500 }
    );
  }

  const result = await sendEmail({
    to,
    subject: "BuyWater Test - Resend Working!",
    html: "<h1>Resend is FIXED!</h1><p>BuyWater admin email via onboarding@resend.dev</p>",
  });

  if (result.ok) {
    return NextResponse.json({
      success: true,
      to,
      from: "onboarding@resend.dev",
      data: result.data,
    });
  }
  return NextResponse.json(
    { success: false, error: result.error, to },
    { status: 500 }
  );
}

export async function POST(request) {
  try {
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
      hint: result.ok
        ? "Check inbox (and spam). Free Resend only delivers to your Resend account email."
        : result.error || "Send failed",
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
