import nodemailer from "nodemailer";
import pug from "pug";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../config/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class EmailService {
  constructor(user) {
    this.to = user.email;
    this.firstName = user.profile?.legalName?.split(" ")[0] || "User";
    this.from = ""; // Set dynamically
  }

  // Helper: Fetch settings from DB
  async getSettings() {
    const settingsArray = await prisma.settings.findMany();
    // Convert Array to Object: { "SMTP_HOST": "smtp.mailtrap.io", ... }
    return settingsArray.reduce(
      (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
      {}
    );
  }

  async createTransport() {
    // const dbSettings = await this.getSettings();

    // LOGIC: Check DB first, if empty/null, use .env
    // const host = dbSettings.SMTP_HOST || process.env.EMAIL_HOST;
    // const port = dbSettings.SMTP_PORT || process.env.EMAIL_PORT;
    // const user = dbSettings.SMTP_USERNAME || process.env.EMAIL_USERNAME;
    // const pass = dbSettings.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USERNAME;
    const pass = process.env.EMAIL_PASSWORD;

    // Dynamic Sender Info
    // const businessName = dbSettings.BUSINESS_NAME || "Helix Platform";
    // const senderEmail =
    //   dbSettings.SMTP_FROM || process.env.EMAIL_FROM || "no-reply@helix.com";
    // this.from = `${businessName} <${senderEmail}>`;

    const businessName = "Helix Platform";
    const senderEmail = process.env.EMAIL_FROM || "no-reply@helix.com";
    this.from = `${businessName} <${senderEmail}>`;

    return nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });
  }

  async send(template, subject, templateData = {}) {
    // 1. Fetch Dynamic Content (Business Name, Footer)
    const dbSettings = await this.getSettings();
    const businessName = dbSettings.BUSINESS_NAME || "Helix";
    const footerText =
      dbSettings.MAIL_FOOTER_TEXT || "Best of Luck, Team Helix";

    // 2. Render Pug Template
    // Path: src/views/emails/otp.pug
    const html = pug.renderFile(
      path.join(__dirname, `../views/emails/${template}.pug`),
      {
        firstName: this.firstName,
        businessName,
        footerText,
        subject,
        ...templateData, // e.g. { otp: '123456' }
      }
    );

    // 3. Create Transport & Send
    const transporter = await this.createTransport();

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ""), // Strip HTML for plain text
    };

    await transporter.sendMail(mailOptions);
  }

  async sendOTP(otp) {
    await this.send("otp", "Your Verification Code", { otp });
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Helix Family!");
  }

  async sendProfileActive() {
    await this.send(
      "profile-active",
      "Congratulations! 🎉 Your Profile is Active"
    );
  }

  async sendProfileRejected(reason) {
    await this.send(
      "profile-rejected",
      "Action Required: Profile Review Update",
      {
        reason, // Pass the reason to the Pug template
      }
    );
  }
}
