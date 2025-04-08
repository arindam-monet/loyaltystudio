import { Resend } from 'resend';
import { env } from '../../config/env.js';

// Initialize Resend with API key if available
let resend: Resend | null = null;

// Validate Resend API key
if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_123456789') {
  try {
    resend = new Resend(env.RESEND_API_KEY);
    console.log('Resend initialized successfully with API key');
  } catch (error) {
    console.error('Failed to initialize Resend:', error);
  }
} else {
  console.warn('No valid Resend API key found, using mock email service');
}

// Mock email service for development or when Resend is not available
const mockEmailService = {
  send: async (options: any) => {
    console.log('MOCK EMAIL SENT:', options);
    return { id: 'mock-email-id-' + Date.now(), success: true };
  }
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send an email using Resend
 * @param options Email options
 * @returns Promise with the result of the email sending operation
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, text, html, from, replyTo } = options;

  try {
    console.log(`Sending email to ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Subject: ${subject}`);

    // Prepare email data
    const emailData = {
      from: from || env.EMAIL_FROM || 'noreply@loyaltystudio.ai',
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
      reply_to: replyTo,
    };

    // Try to use Resend if available, fallback to mock otherwise
    if (resend) {
      try {
        // Use Resend for email delivery
        // Cast to any to bypass type checking issues with the Resend package
        const { data, error } = await (resend.emails.send as any)({
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
          text: emailData.text || undefined,
          html: emailData.html || undefined,
          replyTo: emailData.reply_to,
        });

        if (error) {
          console.error('Failed to send email with Resend:', error);
          throw new Error(`Failed to send email: ${error.message}`);
        }

        console.log('Email sent successfully with Resend');
        return data;
      } catch (error) {
        console.error('Error sending email with Resend:', error);

        // If in production, rethrow the error
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }

        // In development, fall back to mock service
        console.warn('Falling back to mock email service');
      }
    }

    // Use mock email service in development or when Resend fails
    console.log('Using mock email service');
    await mockEmailService.send(emailData);

    console.log('Email sent successfully (mock)');
    return { id: `mock-email-${Date.now()}` };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send a demo request confirmation email to the user
 * @param to Recipient email
 * @param name Recipient name
 * @param calLink Cal.com booking link
 */
export async function sendDemoRequestConfirmationEmail(to: string, name: string, calLink: string) {
  // Validate Cal.com booking URL
  const bookingUrl = calLink || env.CAL_BOOKING_URL;
  console.log(`Using Cal.com booking URL: ${bookingUrl}`);

  return sendEmail({
    to,
    subject: 'Your Demo Request with Loyalty Studio',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo Request Confirmation</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            padding: 20px;
            text-align: center;
            color: white;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e1e1e1;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Interest!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for requesting a demo of Loyalty Studio. We're excited to show you how our platform can help your business grow.</p>
            <p>Your request has been received and is being reviewed by our team.</p>

            <div style="text-align: center;">
              <p><strong>Ready to see Loyalty Studio in action?</strong></p>
              <p>Schedule a time that works for you using our booking system:</p>
              <a href="${bookingUrl}" class="button">Schedule Your Demo</a>
            </div>

            <p>During the demo, we'll:</p>
            <ul>
              <li>Show you how to set up and customize your loyalty program</li>
              <li>Demonstrate how to create and manage rewards</li>
              <li>Explain how to track customer engagement and program performance</li>
              <li>Answer any questions you have about our platform</li>
            </ul>

            <p>If you have any questions before your demo, please don't hesitate to contact our support team.</p>

            <p>Best regards,<br>The Loyalty Studio Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Loyalty Studio. All rights reserved.</p>
            <p>If you did not request this demo, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Thank You for Your Interest!

      Hello ${name},

      Thank you for requesting a demo of Loyalty Studio. We're excited to show you how our platform can help your business grow.

      Your request has been received and is being reviewed by our team.

      Ready to see Loyalty Studio in action?
      Schedule a time that works for you using our booking system: ${bookingUrl}

      During the demo, we'll:
      - Show you how to set up and customize your loyalty program
      - Demonstrate how to create and manage rewards
      - Explain how to track customer engagement and program performance
      - Answer any questions you have about our platform

      If you have any questions before your demo, please don't hesitate to contact our support team.

      Best regards,
      The Loyalty Studio Team

      © ${new Date().getFullYear()} Loyalty Studio. All rights reserved.
      If you did not request this demo, please ignore this email.
    `
  });
}

/**
 * Send a notification email to admins about a new demo request
 * @param adminEmail Admin email address
 * @param requestData Demo request data
 * @param adminPortalUrl Admin portal URL
 */
export async function sendAdminNotificationEmail(adminEmail: string, requestData: any, adminPortalUrl: string) {
  return sendEmail({
    to: adminEmail,
    subject: `New Demo Request: ${requestData.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Demo Request</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            padding: 20px;
            text-align: center;
            color: white;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e1e1e1;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Demo Request</h1>
          </div>
          <div class="content">
            <p>A new demo request has been submitted with the following details:</p>

            <div class="details">
              <p><strong>Name:</strong> ${requestData.name}</p>
              <p><strong>Email:</strong> ${requestData.email}</p>
              <p><strong>Company:</strong> ${requestData.companyName}</p>
              <p><strong>Company Size:</strong> ${requestData.companySize}</p>
              <p><strong>Industry:</strong> ${requestData.industry}</p>
              ${requestData.phoneNumber ? `<p><strong>Phone:</strong> ${requestData.phoneNumber}</p>` : ''}
              ${requestData.jobTitle ? `<p><strong>Job Title:</strong> ${requestData.jobTitle}</p>` : ''}
              ${requestData.message ? `<p><strong>Message:</strong> ${requestData.message}</p>` : ''}
            </div>

            <div style="text-align: center;">
              <a href="${adminPortalUrl}/admin/demo-requests" class="button">View in Admin Portal</a>
            </div>

            <p>Please review this request and take appropriate action.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Loyalty Studio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Demo Request

      A new demo request has been submitted with the following details:

      Name: ${requestData.name}
      Email: ${requestData.email}
      Company: ${requestData.companyName}
      Company Size: ${requestData.companySize}
      Industry: ${requestData.industry}
      ${requestData.phoneNumber ? `Phone: ${requestData.phoneNumber}` : ''}
      ${requestData.jobTitle ? `Job Title: ${requestData.jobTitle}` : ''}
      ${requestData.message ? `Message: ${requestData.message}` : ''}

      Please review this request in the admin portal: ${adminPortalUrl}/admin/demo-requests

      © ${new Date().getFullYear()} Loyalty Studio. All rights reserved.
    `
  });
}

/**
 * Send an approval email to the user
 * @param to User email
 * @param name User name
 * @param resetPasswordUrl Reset password URL
 */
export async function sendApprovalEmail(to: string, name: string, resetPasswordUrl: string) {
  return sendEmail({
    to,
    subject: 'Your Demo Request Has Been Approved',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo Request Approved</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            padding: 20px;
            text-align: center;
            color: white;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e1e1e1;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Demo Request Has Been Approved!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Congratulations! Your demo request for Loyalty Studio has been approved.</p>
            <p>You can now access your account and start exploring our platform.</p>

            <div style="text-align: center;">
              <p><strong>To get started, please set your password:</strong></p>
              <a href="${resetPasswordUrl}" class="button">Set Your Password</a>
            </div>

            <p>After setting your password, you'll be able to log in and:</p>
            <ul>
              <li>Create and customize your loyalty program</li>
              <li>Set up rewards and tiers</li>
              <li>Manage your customers and their points</li>
              <li>Track program performance</li>
            </ul>

            <p>If you have any questions or need assistance, our support team is here to help.</p>

            <p>Best regards,<br>The Loyalty Studio Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Loyalty Studio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Your Demo Request Has Been Approved!

      Hello ${name},

      Congratulations! Your demo request for Loyalty Studio has been approved.

      You can now access your account and start exploring our platform.

      To get started, please set your password: ${resetPasswordUrl}

      After setting your password, you'll be able to log in and:
      - Create and customize your loyalty program
      - Set up rewards and tiers
      - Manage your customers and their points
      - Track program performance

      If you have any questions or need assistance, our support team is here to help.

      Best regards,
      The Loyalty Studio Team

      © ${new Date().getFullYear()} Loyalty Studio. All rights reserved.
    `
  });
}

/**
 * Send a rejection email to the user
 * @param to User email
 * @param name User name
 * @param reason Rejection reason
 */
export async function sendRejectionEmail(to: string, name: string, reason?: string) {
  return sendEmail({
    to,
    subject: 'Update on Your Demo Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo Request Update</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            padding: 20px;
            text-align: center;
            color: white;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e1e1e1;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Update on Your Demo Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for your interest in Loyalty Studio.</p>
            <p>After careful consideration, we regret to inform you that we are unable to approve your demo request at this time.</p>

            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

            <p>If you have any questions or would like to provide additional information, please don't hesitate to contact our support team.</p>

            <p>Best regards,<br>The Loyalty Studio Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Loyalty Studio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Update on Your Demo Request

      Hello ${name},

      Thank you for your interest in Loyalty Studio.

      After careful consideration, we regret to inform you that we are unable to approve your demo request at this time.

      ${reason ? `Reason: ${reason}` : ''}

      If you have any questions or would like to provide additional information, please don't hesitate to contact our support team.

      Best regards,
      The Loyalty Studio Team

      © ${new Date().getFullYear()} Loyalty Studio. All rights reserved.
    `
  });
}
