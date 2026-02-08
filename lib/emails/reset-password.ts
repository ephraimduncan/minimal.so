import { emailLayout } from "../email";

export function resetPasswordEmail(name: string, url: string) {
  const firstName = name.split(" ")[0];
  return {
    subject: "reset your password",
    html: emailLayout(`
      <p>hey ${firstName},</p>
      <p>someone requested a password reset for your minimal account. click below to set a new password:</p>
      <p><a href="${url}" style="color:#1a1a1a;">reset password →</a></p>
      <p>if you didn't request this, you can safely ignore this email.</p>
    `),
  };
}
