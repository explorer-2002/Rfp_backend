import { Resend } from 'resend';
import dotenv from 'dotenv';
import { getEmailTemplate } from './sendingEmailTemplate.js';

dotenv.config();

// 2. Initialize Resend with your key
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmails = async (emails, rfpObject) => {
  try {
    const emailTemplate = getEmailTemplate(rfpObject);

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // MUST use this for testing
      to: emails, 
      subject: 'Request for Proposal',
      html: emailTemplate,
    });

    console.log('Email sent successfully!', data);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};