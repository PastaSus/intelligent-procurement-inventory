import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'Procurvin'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset your Procurvin password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #402020; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <span style="color: #e0c020; font-size: 24px; font-weight: bold;">Procurvin</span>
        </div>
        <div style="border: 1px solid #d0d0d0; border-top: 0; padding: 32px; border-radius: 0 0 12px 12px;">
          <h2 style="margin-top: 0; color: #121212;">Reset your password</h2>
          <p style="color: #666; line-height: 1.6;">
            Someone requested a password reset for your Procurvin account.
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #402020; color: #fff; text-decoration: none;
                    padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 24px;">
            If you didn't request this, you can ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}
