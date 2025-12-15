import nodemailer from "nodemailer";

// Retrieve email server configuration from environment variables.
const host = process.env.EMAIL_HOST;
const port = process.env.EMAIL_PORT;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

/**
 * Sends an email using the configured SMTP transport.
 * This function is primarily used for sending One-Time Passwords (OTPs) but can be used for any email.
 *
 * @param to - The recipient's email address.
 * @param subject - The subject line of the email.
 * @param text - The plain text body of the email.
 * @param html - The HTML body of the email.
 * @returns A promise that resolves with the `info` object from nodemailer upon success,
 *          or `undefined` if an error occurs.
 */
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
) => {
  try{
    // Create a transporter object using the SMTP transport configuration.
    const transporter = nodemailer.createTransport({
      host: host,
      // Use the port from environment variables, or default to 587 (standard for SMTP submission).
      port: Number(port) || 587,
      // `secure: false` is typically used for port 587 with STARTTLS.
      // `secure: true` would be used for port 465 (SMTPS).
      secure: false,
      auth: {
        user: user,
        pass: pass,
      },
    });

    // Verify the connection configuration to ensure the server is ready to accept messages.
    await transporter.verify();
    // Send the email with the specified options.
    const info = await transporter.sendMail({
      from: `"EV-Shop No Reply" <no.reply.electoVolte@gmail.com>`,
      to,
      subject: subject,
      text: text,
      html: html,
    });
    // Return the result from nodemailer, which contains information about the sent message.
    return info;
  }catch(err){
    // If an error occurs during transport creation, verification, or sending, log it to the console.
    console.log(err);
  }
};
