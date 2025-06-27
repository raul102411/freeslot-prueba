// src/lib/emailService.ts
import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_5w3vdii';
const TEMPLATE_ID = 'template_go3tam1';
const PUBLIC_KEY = 'lD4dsavlRZrrwurYh'; // También llamado USER_ID en algunos ejemplos

export const enviarConfirmacionCita = async ({
  email,
  servicio,
  fecha,
  hora,
  empresa,
  cancel_url,
  booking_url,
}: {
  email: string;
  servicio: string;
  fecha: string;
  hora: string;
  empresa: string;
  cancel_url: string;
  booking_url: string;
}) => {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        servicio,
        fecha,
        hora,
        empresa,
        cancel_url,
        booking_url,
      },
      PUBLIC_KEY
    );

    return true;
  } catch (err) {
    return false;
  }
};
