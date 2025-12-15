import { TestDriveBooking } from "../../entities/TestDrivingBooking";
import { sendEmail } from "./Email.util";
import logger from "./logger";

/**
 * Get tomorrow start & end date
 */
const getTomorrowRange = () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Send test drive reminder emails
 */
export const sendTomorrowTestDriveReminders = async () => {
  try {
    const { start, end } = getTomorrowRange();

    const tomorrowBookings = await TestDriveBooking.find({
      booking_date: {
        $gte: start,
        $lte: end,
      },
      status: "confirmed",
      // Optional: prevent duplicate emails
      reminder_sent: false,
    }).populate("customer_id", "email name");

    for (const booking of tomorrowBookings) {
      // Type safety check
      if (!booking.customer_id) continue;

      const { email, name } = booking.customer_id as unknown as {
        email: string;
        name: string;
      };
      const subject = "🚗 Test Drive Reminder - Tomorrow!";
      const text = `Hi ${name}, This is a reminder that you have a test drive scheduled tomorrow at ${booking.booking_time}. Please arrive on time. We look forward to seeing you!`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f7fa;
            }
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 8px 0 0 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #555;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .details-card {
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              border-radius: 10px;
              padding: 25px;
              margin: 25px 0;
              border-left: 4px solid #667eea;
            }
            .detail-row {
              display: flex;
              align-items: center;
              margin: 15px 0;
              font-size: 16px;
            }
            .detail-icon {
              font-size: 24px;
              margin-right: 12px;
              min-width: 30px;
            }
            .detail-label {
              font-weight: 600;
              color: #333;
              margin-right: 8px;
            }
            .detail-value {
              color: #555;
            }
            .important-note {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px 20px;
              margin: 25px 0;
              border-radius: 6px;
            }
            .important-note p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
            }
            .footer {
              background-color: #f8f9fa;
              padding: 25px 30px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <h1>🚗 Test Drive Reminder</h1>
              <p>Your exciting test drive is tomorrow!</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Hi <strong>${name}</strong>,
              </div>

              <div class="message">
                We're excited to remind you that your test drive is scheduled for <strong>tomorrow</strong>! 
                Get ready for an amazing experience behind the wheel.
              </div>

              <!-- Booking Details Card -->
              <div class="details-card">
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">⏰</span>
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${booking.booking_time}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">⏱️</span>
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${booking.duration_minutes || 30} minutes</span>
                </div>
              </div>

              <!-- Important Note -->
              <div class="important-note">
                <p><strong>⚠️ Important:</strong> Please arrive 10 minutes early to complete any necessary paperwork. Don't forget to bring your valid driver's license!</p>
              </div>

              <div class="message">
                We look forward to seeing you tomorrow. If you have any questions or need to reschedule, 
                please don't hesitate to contact us.
              </div>

              <center>
                <a href="#" class="cta-button">View My Booking</a>
              </center>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>EV Shop</strong></p>
              <p>Your trusted partner for electric vehicles</p>
              <p style="margin-top: 15px; font-size: 12px;">
                This is an automated reminder. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail(email, subject, text, html);

      // mark reminder as sent
      booking.reminder_sent = true;
      await booking.save();
    }

    logger.info("✅ Test drive reminders sent successfully");
  } catch (error) {
    logger.error("❌ Failed to send test drive reminders", error);
  }
};
