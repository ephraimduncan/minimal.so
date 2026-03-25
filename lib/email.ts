import { APP_URL } from "./config";

const PLUNK_API_URL = "https://next-api.useplunk.com/v1/send";
const FROM_EMAIL = "ephraim@minimal.so";
const FROM_NAME = "minimal";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.PLUNK_API_KEY;
  if (!apiKey) {
    const error = "PLUNK_API_KEY not set";
    console.error(`[email] ${error}, skipping email to`, to);
    return { ok: false, error };
  }

  try {
    const res = await fetch(PLUNK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [to],
        subject,
        body: html,
        from: FROM_EMAIL,
        name: FROM_NAME,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Plunk error:", res.status, body);
      return { ok: false, status: res.status, error: body || "Plunk error" };
    }

    const data = await res.json();
    if (!data.success) {
      console.error("[email] Plunk rejected:", data);
      return { ok: false, error: "Plunk rejected the request" };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    console.error("[email] Failed to send:", err);
    const error = err instanceof Error ? err.message : "Unknown email error";
    return { ok: false, error };
  }
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${FONT_STACK};font-size:1.077em;line-height:155%;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:10px 0;">
    <tr>
      <td align="left">
        <table cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td>
              ${content}
              <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px;" />
              <p style="font-size:0.8em;color:#999;margin:0;">
                minimal — <a href="${APP_URL}" style="color:#999;">minimal.so</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
