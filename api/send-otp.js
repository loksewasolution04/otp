const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  // CORS configuration same as before...
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { action, email, otp, uid, newEmail } = req.body;

  // LOGIC 1: OTP PATHAUNE (Aghi ko jastai)
  if (action === 'send-otp') {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });

    try {
      await transporter.sendMail({
        from: `"Loksewa Solution" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Code: ${otp}`,
        html: `<h2>Verification Code: ${otp}</h2>`,
      });
      return res.status(200).json({ success: true });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  // LOGIC 2: ADMIN BYPASS EMAIL CHANGE (Security fix)
  if (action === 'update-email') {
    try {
      await admin.auth().updateUser(uid, { email: newEmail });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}
