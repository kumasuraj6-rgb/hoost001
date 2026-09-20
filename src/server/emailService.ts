import nodemailer, { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  if (!host || !user || !pass) {
    return null;
  }

  try {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    return cachedTransporter;
  } catch (err) {
    console.error('[EmailService] Failed to initialize SMTP transporter:', err);
    return null;
  }
}

export async function sendOtpEmail(toEmail: string, otpCode: string, purpose: 'CUSTOMER_PASSWORD_RESET' | 'ADMIN_PASSKEY_RESET'): Promise<{ sent: boolean; method: string }> {
  const isCustomer = purpose === 'CUSTOMER_PASSWORD_RESET';
  const roleName = isCustomer ? 'Rider Account' : 'Administrator Operations Portal';
  const subject = `[RIDEX] Security Verification Code: ${otpCode}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; margin: 0; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #1c1917; border: 1px solid #292524; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .badge { display: inline-block; padding: 4px 12px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px; color: #f59e0b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
          h1 { color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          p { color: #a8a29e; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
          .otp-box { background: #0c0a09; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #fbbf24; }
          .footer { border-top: 1px solid #292524; padding-top: 16px; font-size: 11px; color: #78716c; text-align: center; }
          .warning { color: #ef4444; font-size: 12px; margin-top: 16px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">RIDEX MOTO SECURITY</div>
          <h1>Security Verification</h1>
          <p>You recently requested a security verification code for your <strong>${roleName}</strong> associated with <code>${toEmail}</code>.</p>
          
          <div class="otp-box">
            <div style="font-size: 11px; color: #78716c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your One-Time Passcode</div>
            <div class="otp-code">${otpCode}</div>
          </div>

          <p>This verification code is strictly valid for <strong>5 minutes</strong>. If you did not initiate this password reset, please secure your account immediately.</p>
          <div class="warning">Never share this verification code with anyone. RIDEX support will never ask for your security code.</div>
          
          <div class="footer">
            &copy; ${new Date().getFullYear()} RIDEX MOTO Inc. All rights reserved. &bull; Automated Security Protocol
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Check Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'RIDEX Security <security@ridexmoto.com>',
          to: [toEmail],
          subject,
          html,
        }),
      });

      if (response.ok) {
        console.log(`[EmailService] OTP sent to ${toEmail} via Resend API`);
        return { sent: true, method: 'resend' };
      } else {
        const errText = await response.text();
        console.warn(`[EmailService] Resend API failed: ${errText}`);
      }
    } catch (err) {
      console.error('[EmailService] Error calling Resend API:', err);
    }
  }

  // 2. Check SMTP Transporter
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"RIDEX Moto Security" <no-reply@ridexmoto.com>',
        to: toEmail,
        subject,
        html,
        text: `Your RIDEX security verification code is: ${otpCode}. Valid for 5 minutes.`,
      });
      console.log(`[EmailService] OTP sent to ${toEmail} via SMTP`);
      return { sent: true, method: 'smtp' };
    } catch (err) {
      console.error('[EmailService] SMTP send error:', err);
    }
  }

  // 3. Fallback server notification
  console.log(`[EmailService] Production OTP generated for ${toEmail} (${purpose}). Code: [PROTECTED]. Valid for 5 minutes.`);
  return { sent: false, method: 'server_logged' };
}
