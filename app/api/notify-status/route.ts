import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSessionUser, isAdmin, unauthorized, forbidden } from "@/lib/api-auth";

const FROM_ADDRESS = `DTV Portal <${process.env.GMAIL_USER}>`;
const BCC_ADDRESSES = "saotome14z@gmail.com";

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

const STATUS_SUBJECT: Record<string, string> = {
  確認待ち:       "申請を受け付けました",
  レビュー中:     "書類を確認しています",
  書類不足:       "書類不足のお知らせ",
  提出準備完了:   "大使館提出の準備が完了しました",
  大使館提出済み: "大使館への書類提出が完了しました",
  大使館修正依頼: "大使館から修正依頼が届きました",
  DTV承認:       "DTV申請が承認されました",
};

const STATUS_BODY: Record<string, string> = {
  確認待ち:
    "お申し込みを受け付けました。書類の確認が完了次第、ご連絡いたします。",
  レビュー中:
    "現在、提出いただいた書類を担当者が確認しています。今しばらくお待ちください。",
  書類不足:
    "提出いただいた書類を確認したところ、追加または再提出が必要な書類が見つかりました。マイページよりご対応いただきますようお願いいたします。",
  提出準備完了:
    "すべての書類の確認が完了し、大使館への提出準備が整いました。提出完了後、改めてご連絡いたします。",
  大使館提出済み:
    "大使館への書類提出が完了しました。審査結果が届くまでしばらくお待ちください。",
  大使館修正依頼:
    "大使館から書類の修正依頼が届きました。担当者より詳細をご連絡いたします。",
  DTV承認:
    "🎉 タイDTV（デジタルノマドビザ）の申請が承認されました。おめでとうございます！担当者より詳細の案内をお送りします。",
};

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();
  if (!isAdmin(sessionUser)) return forbidden();

  let body: {
    to: string;
    applicantName: string;
    applicationNumber: string;
    newStatus: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { to, applicantName, applicationNumber, newStatus, notes } = body;

  if (!to || !applicantName || !applicationNumber || !newStatus) {
    return NextResponse.json(
      { error: "to, applicantName, applicationNumber, newStatus are required" },
      { status: 400 }
    );
  }

  const subjectSuffix = STATUS_SUBJECT[newStatus] ?? `ステータス更新：${newStatus}`;
  const bodyText = STATUS_BODY[newStatus] ?? `申請ステータスが「${newStatus}」に更新されました。`;

  const noteBlock =
    notes && newStatus === "書類不足"
      ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 8px;font-weight:bold;color:#c2410c;">担当者からのコメント</p>
          <p style="margin:0;color:#7c2d12;">${notes.replace(/\n/g, "<br>")}</p>
         </div>`
      : "";

  const headerColor = newStatus === "DTV承認" ? "#059669" : newStatus === "書類不足" ? "#dc2626" : "#2563eb";

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${headerColor};padding:28px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:0.05em;">THAILAND DTV APPLICATION PORTAL</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">${subjectSuffix}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;color:#374151;">${applicantName} 様</p>
            <p style="margin:0 0 8px;color:#374151;line-height:1.7;">
              申請番号 <strong>${applicationNumber}</strong> のステータスが更新されました。
            </p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin:16px 0;display:inline-block;">
              <span style="font-size:13px;color:#6b7280;">現在のステータス：</span>
              <span style="font-size:15px;font-weight:700;color:${headerColor};">　${newStatus}</span>
            </div>
            <p style="margin:16px 0 20px;color:#374151;line-height:1.7;">${bodyText}</p>
            ${noteBlock}
            <div style="text-align:center;margin:28px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dtv-formtool.vercel.app"}/mypage"
                 style="display:inline-block;background:${headerColor};color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
                マイページで確認する
              </a>
            </div>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              ご不明な点がございましたら、担当者までお問い合わせください。<br>
              本メールは自動送信です。返信はできません。
            </p>
          </td>
        </tr>
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
      subject: `【DTV申請】${subjectSuffix} - ${applicationNumber}`,
      html,
    });
  } catch (err) {
    console.error("[notify-status] gmail error:", err);
    const message = err instanceof Error ? err.message : "送信失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
