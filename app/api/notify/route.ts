import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSessionUser, isAdmin, unauthorized, forbidden } from "@/lib/api-auth";

const FROM_ADDRESS = `DTV Portal <${process.env.GMAIL_USER}>`;
const BCC_ADDRESSES = "hobby.chameleonclub@gmail.com, saotome14z@gmail.com";

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ""),
    },
  });
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();
  if (!isAdmin(sessionUser)) return forbidden();

  let body: {
    to: string;
    applicantName: string;
    applicationNumber: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { to, applicantName, applicationNumber, notes } = body;

  if (!to || !applicantName || !applicationNumber) {
    return NextResponse.json(
      { error: "to, applicantName, applicationNumber are required" },
      { status: 400 }
    );
  }

  const noteBlock = notes
    ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-weight:bold;color:#c2410c;">担当者からのコメント</p>
        <p style="margin:0;color:#7c2d12;">${notes.replace(/\n/g, "<br>")}</p>
       </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:28px 40px;">
            <p style="margin:0;color:#bfdbfe;font-size:12px;letter-spacing:0.05em;">THAILAND DTV APPLICATION PORTAL</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">書類不足のお知らせ</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;color:#374151;">${applicantName} 様</p>
            <p style="margin:0 0 20px;color:#374151;line-height:1.7;">
              申請番号 <strong>${applicationNumber}</strong> の書類を確認したところ、
              追加または再提出が必要な書類が見つかりました。<br>
              マイページよりご対応いただきますようお願いいたします。
            </p>

            ${noteBlock}

            <div style="text-align:center;margin:28px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dtv-formtool.vercel.app"}/mypage"
                 style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
                マイページで確認する
              </a>
            </div>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              ご不明な点がございましたら、担当者までお問い合わせください。<br>
              本メールは自動送信です。返信はできません。
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} DTV Application Portal</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      bcc: BCC_ADDRESSES,
      subject: `【DTV申請】書類不足のお知らせ - ${applicationNumber}`,
      html,
    });
  } catch (err) {
    console.error("[notify] gmail error:", err);
    const message = err instanceof Error ? err.message : "送信失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
