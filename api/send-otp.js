const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // CORS configuration (App bata call garna allow garne)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, otp } = req.body;

  // 1. Setup Gmail Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"Loksewa Solution" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Verification Code: ${otp}`,
    html: `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #0a47c2;">Verify Your Identity</h2>
        <p>Your 6-digit verification code to change your email is:</p>
        <h1 style="font-size: 40px; letter-spacing: 5px; color: #333;">${otp}</h1>
        <p style="color: #94a3b8;">This code is valid for 5 minutes only.</p>
      </div>
    `,
  };

  try {
    // 2. Send the Email
    await transporter.sendMail(mailOptions);
    
    // Success Response
    return res.status(200).json({ success: true, message: 'OTP Sent Successfully' });
  } catch (error) {
    console.error("Mailer Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
