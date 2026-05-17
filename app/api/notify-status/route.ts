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

interface StatusContent {
  subject: string;
  body: string;
  headerColor: string;
}

const STATUS_CONTENT: Record<string, StatusContent> = {
  レビュー中: {
    subject: "Your documents are under review",
    body: "Our team is currently reviewing your submitted documents. We will be in touch shortly.",
    headerColor: "#2563eb",
  },
  書類不足: {
    subject: "Action required: Missing or incomplete documents",
    body: "We reviewed your documents and found that some items require resubmission. Please log in to your account and take the necessary action.",
    headerColor: "#dc2626",
  },
  提出準備完了: {
    subject: "Your documents are ready for submission",
    body: "All documents have been verified and are ready for embassy submission. We will notify you once submitted.",
    headerColor: "#059669",
  },
  大使館提出済み: {
    subject: "Your documents have been submitted to the embassy",
    body: "Your documents have been submitted to the embassy. Please wait for the review result.",
    headerColor: "#7c3aed",
  },
  大使館修正依頼: {
    subject: "Additional documents requested by the embassy",
    body: "The embassy has requested additional or revised documents. Our team will contact you with further details.",
    headerColor: "#ea580c",
  },
  DTV承認: {
    subject: "🎉 Your DTV application has been approved",
    body: "Congratulations! Your Thailand DTV (Destination Thailand Visa) application has been approved.\n\nYou can enter Thailand by presenting the PDF attached to your official DTV approval email at immigration.\n\nOur team will send you further instructions shortly.",
    headerColor: "#059669",
  },
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
    adminComment?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { to, applicantName, applicationNumber, newStatus, adminComment } = body;

  if (!to || !applicantName || !applicationNumber || !newStatus) {
    return NextResponse.json(
      { error: "to, applicantName, applicationNumber, newStatus are required" },
      { status: 400 }
    );
  }

  const content = STATUS_CONTENT[newStatus] ?? {
    subject: `Status updated: ${newStatus}`,
    body: `Your application status has been updated to "${newStatus}".`,
    headerColor: "#2563eb",
  };

  const commentBlock = adminComment
    ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-weight:bold;color:#c2410c;">Message from our team</p>
        <p style="margin:0;color:#7c2d12;line-height:1.6;">${adminComment.replace(/\n/g, "<br>")}</p>
       </div>`
    : "";

  const bodyHtml = content.body
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 16px;color:#374151;line-height:1.7;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${content.headerColor};padding:28px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:0.05em;">THAILAND DTV APPLICATION PORTAL</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">${content.subject}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px;color:#374151;">Dear ${applicantName},</p>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Application number: <strong style="color:#374151;">${applicationNumber}</strong></p>
            ${bodyHtml}
            ${commentBlock}
            <div style="text-align:center;margin:28px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dtv-formtool.vercel.app"}/mypage"
                 style="display:inline-block;background:${content.headerColor};color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
                View My Application
              </a>
            </div>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              If you have any questions, please contact our team.<br>
              This is an automated email. Please do not reply directly.
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
      subject: `[DTV Application] ${content.subject} - ${applicationNumber}`,
      html,
    });
  } catch (err) {
    console.error("[notify-status] gmail error:", err);
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
