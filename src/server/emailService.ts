import nodemailer, { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let cachedTransporter: Transporter | null = null;

/**
 * Format and sanitize the 'from' email address to strictly adhere to:
 * - 'email@example.com' or 'Name <email@example.com>'
 * Handles unverified domain fallbacks, truncated inputs (e.g. 'onboarding@resend.'),
 * and plain display names gracefully.
 */
export function formatSenderAddress(rawFrom?: string, isSmtp = false): string {
  let val = (rawFrom || '').trim().replace(/^['"]|['"]$/g, '');

  // Auto-correct common truncated resend domain inputs
  if (val.includes('onboarding@resend') && !val.includes('onboarding@resend.dev')) {
    val = val.replace(/onboarding@resend\.?/g, 'onboarding@resend.dev');
  }

  // 1. Check if format is already "DisplayName <email@domain.com>"
  const angleMatch = val.match(/^(.*?)\s*<([^\s@<>]+@[^\s@<>]+\.[a-zA-Z]{2,})>$/);
  if (angleMatch) {
    const name = angleMatch[1].trim() || 'RIDEX Security';
    const email = angleMatch[2].trim();
    return `${name} <${email}>`;
  }

  // 2. Check if format is a bare valid email "user@domain.com"
  const emailMatch = val.match(/^[^\s@<>]+@[^\s@<>]+\.[a-zA-Z]{2,}$/);
  if (emailMatch) {
    return `RIDEX Security <${val}>`;
  }

  // 3. If provided string is just a name or malformed email
  if (val && !val.includes('@')) {
    const defaultEmail = isSmtp ? 'no-reply@ridexmoto.com' : 'onboarding@resend.dev';
    return `${val} <${defaultEmail}>`;
  }

  // 4. Default fallback
  return isSmtp ? '"RIDEX Moto Security" <no-reply@ridexmoto.com>' : 'RIDEX Security <onboarding@resend.dev>';
}

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

export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  purpose: 'CUSTOMER_PASSWORD_RESET' | 'ADMIN_PASSKEY_RESET'
): Promise<{ sent: boolean; method: string; error?: string }> {
  const isCustomer = purpose === 'CUSTOMER_PASSWORD_RESET';
  const subject = isCustomer
    ? 'RIDEX - Password Reset Verification Code'
    : `[RIDEX Admin] Passkey Verification Code: ${otpCode}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; margin: 0; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #1c1917; border: 1px solid #292524; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .badge { display: inline-block; padding: 4px 12px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px; color: #f59e0b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
          h1 { color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: 0.5px; }
          .subtitle { color: #f59e0b; font-size: 14px; font-weight: 600; margin-bottom: 18px; }
          p { color: #a8a29e; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
          .otp-box { background: #0c0a09; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-label { font-size: 12px; color: #a8a29e; margin-bottom: 8px; font-weight: 500; }
          .otp-code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #fbbf24; }
          .footer { border-top: 1px solid #292524; padding-top: 16px; font-size: 11px; color: #78716c; text-align: center; margin-top: 24px; }
          .warning { color: #a8a29e; font-size: 12px; margin-top: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">RIDEX</div>
          <h1>RIDEX</h1>
          <div class="subtitle">Password Reset Verification</div>
          
          <div class="otp-box">
            <div class="otp-label">Your verification code is:</div>
            <div class="otp-code">${otpCode}</div>
          </div>

          <p><strong>This code expires in 10 minutes.</strong></p>
          <p class="warning">If you did not request a password reset, you can safely ignore this email.</p>
          
          <div class="footer">
            &copy; ${new Date().getFullYear()} RIDEX MOTO Inc. All rights reserved. &bull; Automated Security Protocol
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `RIDEX\nPassword Reset Verification\n\nYour verification code is:\n${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.`;

  // 1. Check Resend API
  if (process.env.RESEND_API_KEY) {
    let fromAddress = formatSenderAddress(process.env.EMAIL_FROM, false);

    try {
      let response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject,
          html,
          text: textContent,
        }),
      });

      if (response.ok) {
        console.log(`[EmailService] OTP successfully sent to ${toEmail} via Resend API (from: ${fromAddress})`);
        return { sent: true, method: 'resend' };
      }

      // Read response error body once
      let errText = await response.text();

      // If invalid 'from' address (422) and not already using the official sandbox sender, retry once with sandbox sender
      if (response.status === 422 && fromAddress !== 'RIDEX Support <onboarding@resend.dev>') {
        console.warn(`[EmailService] Resend API rejected sender "${fromAddress}" (422: ${errText}). Retrying with verified sandbox sender...`);
        fromAddress = 'RIDEX Support <onboarding@resend.dev>';
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [toEmail],
            subject,
            html,
            text: textContent,
          }),
        });

        if (response.ok) {
          console.log(`[EmailService] OTP successfully sent to ${toEmail} via Resend API (from: ${fromAddress})`);
          return { sent: true, method: 'resend' };
        }
        errText = await response.text();
      }

      // Handle Resend free-tier sandbox recipient restriction (403)
      const isSandboxRestriction =
        response.status === 403 &&
        (errText.includes('testing emails') ||
          errText.includes('validation_error') ||
          errText.includes('resend.com/domains') ||
          errText.includes('sandbox') ||
          errText.includes('only send'));

      if (isSandboxRestriction) {
        console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
        console.log('│ [EmailService] ⚠️  RESEND SANDBOX RECIPIENT RESTRICTION DETECTED       │');
        console.log(`│ Recipient: ${toEmail.padEnd(59)} │`);
        console.log(`│ Purpose:   ${purpose.padEnd(59)} │`);
        console.log(`│ >>> OTP VERIFICATION CODE: [ ${otpCode} ] <<<                            │`);
        console.log('│ Note: Resend sandbox currently restricts deliveries to account owner.  │');
        console.log('│ Development bypass active: OTP logged above so testing can continue.   │');
        console.log('└────────────────────────────────────────────────────────────────────────┘\n');

        return {
          sent: true,
          method: 'resend_sandbox_console',
        };
      }

      const safeErrorMsg = `Resend delivery failed (${response.status}): ${errText || 'Check sender and domain verification.'}`;
      console.warn(`[EmailService] ${safeErrorMsg}`);

      // In development mode, if Resend delivery fails for any reason, log OTP to console so testing is not blocked
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
        console.log('│ [EmailService] ⚠️  RESEND DELIVERY FAILED IN DEV MODE - LOGGING OTP    │');
        console.log(`│ Recipient: ${toEmail.padEnd(59)} │`);
        console.log(`│ Purpose:   ${purpose.padEnd(59)} │`);
        console.log(`│ >>> OTP VERIFICATION CODE: [ ${otpCode} ] <<<                            │`);
        console.log(`│ Error:     ${errText.slice(0, 59).padEnd(59)} │`);
        console.log('└────────────────────────────────────────────────────────────────────────┘\n');

        return {
          sent: true,
          method: 'dev_console_fallback',
        };
      }

      return { sent: false, method: 'resend', error: safeErrorMsg };
    } catch (err: any) {
      console.error('[EmailService] Error calling Resend API:', err);

      if (process.env.NODE_ENV !== 'production') {
        console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
        console.log('│ [EmailService] ⚠️  RESEND API NETWORK ERROR IN DEV MODE - LOGGING OTP  │');
        console.log(`│ Recipient: ${toEmail.padEnd(59)} │`);
        console.log(`│ Purpose:   ${purpose.padEnd(59)} │`);
        console.log(`│ >>> OTP VERIFICATION CODE: [ ${otpCode} ] <<<                            │`);
        console.log('└────────────────────────────────────────────────────────────────────────┘\n');
        return { sent: true, method: 'dev_network_fallback' };
      }

      return { sent: false, method: 'resend', error: err?.message || 'Network error communicating with Resend API.' };
    }
  }

  // 2. Check SMTP Transporter
  const transporter = getTransporter();
  if (transporter) {
    const smtpFrom = formatSenderAddress(process.env.EMAIL_FROM, true);
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        html,
        text: textContent,
      });
      console.log(`[EmailService] OTP sent to ${toEmail} via SMTP`);
      return { sent: true, method: 'smtp' };
    } catch (err: any) {
      console.error('[EmailService] SMTP send error:', err);

      if (process.env.NODE_ENV !== 'production') {
        console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
        console.log('│ [EmailService] ⚠️  SMTP ERROR IN DEV MODE - LOGGING OTP                 │');
        console.log(`│ Recipient: ${toEmail.padEnd(59)} │`);
        console.log(`│ Purpose:   ${purpose.padEnd(59)} │`);
        console.log(`│ >>> OTP VERIFICATION CODE: [ ${otpCode} ] <<<                            │`);
        console.log('└────────────────────────────────────────────────────────────────────────┘\n');
        return { sent: true, method: 'dev_smtp_fallback' };
      }

      return { sent: false, method: 'smtp', error: err?.message || 'SMTP delivery failed.' };
    }
  }

  // 3. Neither email provider configured
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
    console.log('│ [EmailService] ℹ️  DEV MODE (NO EMAIL PROVIDER CONFIGURED)              │');
    console.log(`│ Recipient: ${toEmail.padEnd(59)} │`);
    console.log(`│ Purpose:   ${purpose.padEnd(59)} │`);
    console.log(`│ >>> OTP VERIFICATION CODE: [ ${otpCode} ] <<<                            │`);
    console.log('└────────────────────────────────────────────────────────────────────────┘\n');
    return { sent: true, method: 'dev_no_provider' };
  }

  return {
    sent: false,
    method: 'none',
    error: 'Email service is not configured. Please set RESEND_API_KEY in the environment variables.',
  };
}
