import nodemailer from "nodemailer";
import pug from "pug";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../config/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper: Fetch settings from DB
const getSettings = async () => {
  const settingsArray = await prisma.settings.findMany();
  return settingsArray.reduce(
    (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
    {}
  );
};

// Create email transporter
const createTransport = async () => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USERNAME;
  const pass = process.env.EMAIL_PASSWORD;

  return nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });
};

// Generic send email function
const sendEmail = async (to, template, subject, templateData = {}) => {
  try {
    // 1. Fetch Dynamic Content
    const dbSettings = await getSettings();
    const businessName = dbSettings.BUSINESS_NAME || "Helix";
    const footerText =
      dbSettings.MAIL_FOOTER_TEXT || "Best of Luck, Team Helix";
    const senderEmail = process.env.EMAIL_FROM || "no-reply@helix.com";
    const from = `${businessName} <${senderEmail}>`;

    // 2. Render Pug Template
    const html = pug.renderFile(
      path.join(__dirname, `../views/emails/${template}.pug`),
      {
        businessName,
        footerText,
        subject,
        ...templateData,
      }
    );

    // 3. Create Transport & Send
    const transporter = await createTransport();

    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ""),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

// --- EXPORTED FUNCTIONS ---

export const sendOtpEmail = async (email, otp) => {
  await sendEmail(email, "otp", "Your Verification Code", { otp });
};

export const sendWelcomeEmail = async (email, firstName) => {
  await sendEmail(email, "welcome", "Welcome to the Helix Family!", {
    firstName,
  });
};

export const sendProfileActiveEmail = async (email, firstName) => {
  await sendEmail(
    email,
    "profile-active",
    "Congratulations! 🎉 Your Profile is Active",
    { firstName }
  );
};

export const sendProfileRejectedEmail = async (email, firstName, reason) => {
  await sendEmail(
    email,
    "profile-rejected",
    "Action Required: Profile Review Update",
    {
      firstName,
      reason,
    }
  );
};

// Legacy Class Export (for backward compatibility)
export class EmailService {
  constructor(user) {
    this.to = user.email;
    this.firstName = user.profile?.legalName?.split(" ")[0] || "User";
  }

  async sendOTP(otp) {
    await sendOtpEmail(this.to, otp);
  }

  async sendWelcome() {
    await sendWelcomeEmail(this.to, this.firstName);
  }

  async sendProfileActive() {
    await sendProfileActiveEmail(this.to, this.firstName);
  }

  async sendProfileRejected(reason) {
    await sendProfileRejectedEmail(this.to, this.firstName, reason);
  }
}
