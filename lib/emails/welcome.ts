import { emailLayout } from "../email";

export function welcomeEmail(name: string) {
  const firstName = name.split(" ")[0];
  return {
    subject: "welcome to minimal",
    html: emailLayout(`
      <p style="margin:0 0 16px;">hey ${firstName},</p>
      <p style="margin:0 0 16px;">welcome to minimal — a simple place to keep your bookmarks organized.</p>
      <p style="margin:0 0 16px;">head over to your <a href="https://minimal.so/dashboard" style="color:#1a1a1a;">dashboard</a> to get started.</p>
      <p style="margin:0 0 16px;">if you have any questions, just reply to this email.</p>
      <p style="margin:0;">— ephraim</p>
    `),
  };
}
