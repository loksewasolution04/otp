const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Initialization with Safety Check
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Private key logic fixing newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      }),
    });
    console.log("Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("Firebase Init Error:", error.message);
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { action, email, otp, uid, newEmail } = req.body;

  // LOGIC 1: SEND OTP (Gmail SMTP)
  if (action === 'send-otp') {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, 
      },
    });

    try {
      await transporter.sendMail({
        from: `"Loksewa Solution" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Verification Code: ${otp}`,
        html: `<div style="font-family:sans-serif;text-align:center;"><h2>Code: ${otp}</h2></div>`,
      });
      return res.status(200).json({ success: true, message: 'OTP Sent' });
    } catch (error) {
      console.error("Mailer Error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // LOGIC 2: UPDATE EMAIL (Firebase Admin Bypass)
  if (action === 'update-email') {
    if (!uid || !newEmail) return res.status(400).json({ error: "Missing UID or Email" });

    try {
      await admin.auth().updateUser(uid, { email: newEmail });
      return res.status(200).json({ success: true, message: 'Email updated successfully' });
    } catch (error) {
      console.error("Admin Auth Error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(400).json({ error: "Invalid Action" });
}
