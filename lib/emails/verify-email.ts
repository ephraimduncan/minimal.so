import { emailLayout } from "../email";

export function verifyEmailEmail(name: string, url: string) {
  const firstName = name.split(" ")[0];
  return {
    subject: "verify your email",
    html: emailLayout(`
      <p style="margin:0 0 16px;">hey ${firstName},</p>
      <p style="margin:0 0 16px;">click the link below to verify your email address:</p>
      <p style="margin:0 0 16px;"><a href="${url}" style="color:#1a1a1a;">verify email →</a></p>
      <p style="margin:0;">if you didn't create an account on minimal, you can ignore this.</p>
    `),
  };
}
