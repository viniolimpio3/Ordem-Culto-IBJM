import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


export default function sendMail(options: {
  from: string|undefined,
  to: string|undefined,
  subject: string,
  text: string,
  html?: string,
  attachments?: Array<{
    filename: string,
    path: string
  }>
}) {
  return transporter.sendMail(options);
}