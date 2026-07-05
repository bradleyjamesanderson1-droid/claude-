import { NextResponse } from "next/server";

// Phase 2 wires this to Supabase (user + consent row, claim anon resets)
// and Resend (magic link, card email, Notion template delivery).
// Until those credentials exist, respond honestly: not configured.
export async function POST(request: Request) {
  let body: { email?: string; consentMarketing?: boolean; consentSource?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!body.email || !/.+@.+\..+/.test(body.email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const configured =
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE &&
    !!process.env.RESEND_API_KEY;

  if (!configured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  // Phase 2 implementation lands here.
  return NextResponse.json({ ok: false, error: "not_implemented" }, { status: 501 });
}
