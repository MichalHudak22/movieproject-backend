// utils/mailer.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to, username, verificationUrl) {
  try {
    await resend.emails.send({
      from: "no-reply@hudo22portfolio.shop", // tvoja overená doména
      to,
      subject: "Verify your CinemaSpace account",
      html: `
        <h2>Hello ${username}</h2>
        <p>Thanks for registering! Please verify your account by clicking the link below:</p>
        <a href="${verificationUrl}" 
           style="display:inline-block;padding:10px 20px;background:red;color:white;text-decoration:none;border-radius:5px;">
           Verify Account
        </a>
        <p style="margin-top:20px;font-size:12px;color:#888;">
          If you didn’t create this account, you can ignore this email.
        </p>
      `,
    });

    console.log("Verification email sent to", to);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    throw err;
  }
}
