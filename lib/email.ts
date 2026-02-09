const AUTOSEND_API_URL = "https://api.autosend.com/v1/mails/send";
const FROM_EMAIL = "ephraim@minimal.so";
const FROM_NAME = "minimal";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const apiKey = process.env.AUTOSEND_API_KEY;
  if (!apiKey) {
    console.error("[email] AUTOSEND_API_KEY not set, skipping email to", to);
    return;
  }

  try {
    const res = await fetch(AUTOSEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: { email: to },
        subject,
        html,
        ...(text && { text }),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Autosend error:", res.status, body);
    }
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${FONT_STACK};font-size:1.077em;line-height:155%;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="left">
        <table cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td>
              ${content}
              <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px;" />
              <p style="font-size:0.8em;color:#999;margin:0;">
                minimal — <a href="https://minimal.so" style="color:#999;">minimal.so</a>
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
