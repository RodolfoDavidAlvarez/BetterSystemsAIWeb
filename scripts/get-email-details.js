import 'dotenv/config';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_ID = 'd6b422ae-cea9-423b-bd14-c5dccfdfe18c'; // Support Tickets email

async function getEmailDetails() {
  try {
    console.log('📧 Fetching email details...\n');

    const response = await fetch(`https://api.resend.com/emails/${EMAIL_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return;
    }

    const email = await response.json();

    console.log('='.repeat(100));
    console.log('EMAIL DETAILS');
    console.log('='.repeat(100));
    console.log(`ID: ${email.id}`);
    console.log(`From: ${email.from}`);
    console.log(`To: ${email.to}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Status: ${email.last_event}`);
    console.log(`Created: ${new Date(email.created_at).toLocaleString()}`);
    console.log('\n' + '='.repeat(100));
    console.log('EMAIL BODY (HTML)');
    console.log('='.repeat(100));
    console.log(email.html || 'No HTML content');
    console.log('\n');

  } catch (error) {
    console.error('❌ Failed to fetch email:', error.message);
  }
}

getEmailDetails();
