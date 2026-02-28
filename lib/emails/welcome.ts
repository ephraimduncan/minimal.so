import { emailLayout } from "../email";
import { APP_URL } from "../config";

export function welcomeEmail(name: string) {
  const firstName = name.split(" ")[0];
  return {
    subject: "welcome to minimal",
    html: emailLayout(`
      <p style="margin:0 0 16px;">hey ${firstName},</p>
      <p style="margin:0 0 16px;">welcome to minimal — a simple place to keep your bookmarks organized.</p>
      <p style="margin:0 0 16px;">head over to your <a href="${APP_URL}/dashboard" style="color:#1a1a1a;">dashboard</a> to get started.</p>
      <p style="margin:0 0 16px;">minimal is open source — if you like it, give us a <a href="https://github.com/ephraimduncan/minimal.so" style="color:#1a1a1a;">star on github</a>.</p>
      <p style="margin:0 0 16px;">if you have any questions, just reply to this email.</p>
      <p style="margin:0;">— ephraim</p>
    `),
    text: `hey ${firstName},\n\nwelcome to minimal — a simple place to keep your bookmarks organized.\n\nhead over to your dashboard: ${APP_URL}/dashboard\n\nminimal is open source — if you like it, give us a star on github: https://github.com/ephraimduncan/minimal.so\n\nif you have any questions, just reply to this email.\n\n— ephraim`,
  };
}
