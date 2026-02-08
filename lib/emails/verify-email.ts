import { emailLayout } from "../email";

export function verifyEmailEmail(name: string, url: string) {
  const firstName = name.split(" ")[0];
  return {
    subject: "verify your email",
    html: emailLayout(`
      <p>hey ${firstName},</p>
      <p>click the link below to verify your email address:</p>
      <p><a href="${url}" style="color:#1a1a1a;">verify email →</a></p>
      <p>if you didn't create an account on minimal, you can ignore this.</p>
    `),
  };
}
