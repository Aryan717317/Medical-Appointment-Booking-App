import createTransporter from '../config/email.js';

const transporter = createTransporter();

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MedBook <noreply@medbook.com>',
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

export const sendAppointmentConfirmation = async (appointment, user) => {
  const doctorName = `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`;
  const date = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  await sendEmail({
    to: user.email,
    subject: 'Appointment Confirmed - MedBook',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Confirmed!</h2>
        <p>Dear ${user.firstName},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
          <p><strong>Type:</strong> ${appointment.type === 'video' ? 'Video Consultation' : 'In-Person Visit'}</p>
        </div>
        
        ${appointment.type === 'video' ? `
          <p>For video consultations, you can join the call from your dashboard 10 minutes before the scheduled time.</p>
        ` : `
          <p>Please arrive 10-15 minutes before your scheduled appointment time.</p>
        `}
        
        <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        
        <p>Thank you for choosing MedBook!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated message from MedBook. Please do not reply to this email.
        </p>
      </div>
    `
  });
};

export const sendAppointmentCancellation = async (appointment, user) => {
  const date = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  await sendEmail({
    to: user.email,
    subject: 'Appointment Cancelled - MedBook',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Appointment Cancelled</h2>
        <p>Dear ${user.firstName},</p>
        <p>Your appointment scheduled for ${date} at ${appointment.startTime} has been cancelled.</p>
        
        ${appointment.payment.status === 'refunded' ? `
          <p>A refund has been initiated and should appear in your account within 5-10 business days.</p>
        ` : ''}
        
        <p>If you'd like to reschedule, please visit our website or contact us.</p>
        
        <p>Thank you for your understanding.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated message from MedBook. Please do not reply to this email.
        </p>
      </div>
    `
  });
};

export const sendAppointmentReminder = async (appointment, user, hoursUntil) => {
  const doctorName = `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`;
  const date = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  await sendEmail({
    to: user.email,
    subject: `Appointment Reminder - ${hoursUntil} hours to go`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Reminder</h2>
        <p>Dear ${user.firstName},</p>
        <p>This is a reminder that you have an appointment in ${hoursUntil} hours.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${appointment.startTime}</p>
          <p><strong>Type:</strong> ${appointment.type === 'video' ? 'Video Consultation' : 'In-Person Visit'}</p>
        </div>
        
        <p>Thank you for choosing MedBook!</p>
      </div>
    `
  });
};
