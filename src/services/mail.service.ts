import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using SMTP transport
// For Gmail, you must use an "App Password" if you have 2-Step Verification enabled.
// See: https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER, // Your Gmail address, e.g., 'you@gmail.com'
    pass: process.env.SMTP_PASS, // Your Gmail App Password
  },
});

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

class MailService {
  async sendMail(options: MailOptions) {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"Code Checker" <no-reply@example.com>',
      ...options,
    };

    // Only attempt to send mail if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully. Message ID:', info.messageId);
        return info;
      } catch (error) {
        console.error('Error sending email:', error);
        if ((error as any).code === 'EAUTH') {
          console.error('Authentication error: Check your SMTP_USER and SMTP_PASS. If using Gmail, ensure you are using an App Password.');
        }
        throw new Error('Failed to send notification email.');
      }
    }
  }
}

export const mailService = new MailService();