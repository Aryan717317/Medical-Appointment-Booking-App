import twilioClient from '../config/twilio.js';

export const sendSMS = async (to, body) => {
  if (!twilioClient) {
    console.log('Twilio not configured, skipping SMS');
    return null;
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    console.log('SMS sent:', message.sid);
    return message;
  } catch (error) {
    console.error('SMS send error:', error);
    throw error;
  }
};

export const sendAppointmentReminderSMS = async (phone, appointmentDetails) => {
  const { doctorName, date, time, type } = appointmentDetails;
  
  const message = `MedBook Reminder: You have a ${type} appointment with Dr. ${doctorName} on ${date} at ${time}. Please be prepared!`;

  return sendSMS(phone, message);
};

export const sendAppointmentConfirmationSMS = async (phone, appointmentDetails) => {
  const { doctorName, date, time } = appointmentDetails;
  
  const message = `MedBook: Your appointment with Dr. ${doctorName} on ${date} at ${time} is confirmed. Thank you!`;

  return sendSMS(phone, message);
};
