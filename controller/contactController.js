const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactEmail = async (req, res) => {
  try {
    const { name, fullName, email, phone, company, subject, message } = req.body;
    const senderName = fullName || name;

    if (!senderName || !email || !subject || !message) {
      return res.status(400).json({ message: 'Full name, email, subject, and message are required.' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="border-bottom: 2px solid #4F46E5; padding-bottom: 8px; color: #4F46E5;">New Contact Form Submission</h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px;">Full Name</td>
            <td style="padding: 8px 0;">${senderName}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 0; font-weight: bold;">Email</td>
            <td style="padding: 8px 0;">${email}</td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Phone</td>
            <td style="padding: 8px 0;">${phone}</td>
          </tr>` : ''}
          ${company ? `
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 0; font-weight: bold;">Company</td>
            <td style="padding: 8px 0;">${company}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Subject</td>
            <td style="padding: 8px 0;">${subject}</td>
          </tr>
        </table>

        <div style="margin-top: 24px;">
          <p style="font-weight: bold; margin-bottom: 8px;">Message</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 6px; white-space: pre-wrap;">${message}</div>
        </div>

        <p style="margin-top: 24px; font-size: 12px; color: #999;">Sent via the contact form on your website.</p>
      </div>
    `;

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'ibr.suhel@gmail.com',
      reply_to: 'harshsadh21@gmail.com',
      subject: `Contact: ${subject}`,
      html,
    });

    return res.status(200).json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
};

module.exports = { sendContactEmail };
