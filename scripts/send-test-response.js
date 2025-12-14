import 'dotenv/config';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendTestEmail() {
  try {
    console.log('📧 Sending simple response email...\n');

    // Simple, natural email - like a regular Gmail message
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #000;">
        <p>Hey Micah,</p>

        <p>Got all 7 tickets. Here's what I'm doing:</p>

        <p><strong>Tonight:</strong> Photo bug fix, contract value showing correct total after discounts, removing power supply/control box from quotes.</p>

        <p><strong>Tomorrow:</strong> User invite capability for admins, checking the new deal email notifications.</p>

        <p><strong>Next few days:</strong> Rep filter dropdown on deals page, full workflow reorganization (Proposals/Agreements/Deals split).</p>

        <p>The workflow change makes a lot of sense - will make it way clearer what's what. I'll send updates as I finish each one.</p>

        <p>Let me know if you need anything else.</p>

        <p>Rodolfo</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ralvarez@bettersystems.ai',
        to: 'ralvarez@soilseedandwater.com',
        subject: 'Re: Support Tickets',
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to send email (${response.status}):`, errorText);
      return;
    }

    const result = await response.json();

    console.log('✅ Email sent successfully!');
    console.log(`   Email ID: ${result.id}`);
    console.log(`   To: ralvarez@soilseedandwater.com`);
    console.log(`   Subject: Re: Support Tickets`);
    console.log('\n📬 Check your inbox - much simpler this time!\n');

  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}

sendTestEmail();
