import { Resend } from 'resend';
import { IncomingForm } from 'formidable';
import fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();
    const [fields, files] = await form.parse(req);

    const name = fields.name?.[0] || '';
    const phone = fields.phone?.[0] || '';
    const email = fields.email?.[0] || '';
    const area = fields.area?.[0] || '';
    const services = fields.services?.[0] || '';
    const details = fields.details?.[0] || '';
    const photos = files.photos || [];

    // Build email body
    const emailBody = `
New Quote Request from Website:

Name: ${name}
Phone: ${phone}
Email: ${email}
Area: ${area}
Services Needed: ${services}
Additional Details: ${details}

---
Sent from Joe's Mowing Website
    `.trim();

    // Prepare attachments
    const attachments = [];
    for (const file of photos) {
      const fileContent = fs.readFileSync(file.filepath);
      attachments.push({
        filename: file.originalFilename,
        content: fileContent,
      });
    }

    // Send email with Resend
    const response = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: 'joesmowingns@gmail.com',
      subject: `Quote Request from ${name}`,
      text: emailBody,
      attachments: attachments,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    // Cleanup uploaded files
    photos.forEach(file => {
      fs.unlinkSync(file.filepath);
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Quote submitted successfully!' 
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to submit quote. Please try again.' 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
