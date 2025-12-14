import 'dotenv/config';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function fetchEmails() {
  try {
    console.log('🔍 Fetching emails from Resend API (Past 2 weeks)...\n');

    const response = await fetch('https://api.resend.com/emails', {
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

    const result = await response.json();
    let emails = result.data || [];

    // Filter to past 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    emails = emails.filter(email => {
      if (!email.created_at) return false;
      const emailDate = new Date(email.created_at);
      return emailDate >= twoWeeksAgo;
    });

    if (!emails || emails.length === 0) {
      console.log('📭 No emails found in the past 2 weeks.');
      return;
    }

    console.log(`📧 Found ${emails.length} emails in the past 2 weeks:\n`);
    console.log('='.repeat(100));

    emails.forEach((email, index) => {
      const createdDate = new Date(email.created_at);
      const daysAgo = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
      const timeAgo = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

      console.log(`\n${index + 1}. ${timeAgo} - ${createdDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`);
      console.log(`   From: ${email.from || 'N/A'}`);
      console.log(`   To: ${Array.isArray(email.to) ? email.to.join(', ') : email.to || 'N/A'}`);
      console.log(`   Subject: ${email.subject || 'No subject'}`);
      console.log(`   Status: ${email.last_event || 'Unknown'}`);
      console.log('-'.repeat(100));
    });

    console.log(`\n✅ Total emails (past 2 weeks): ${emails.length}`);

    // Group by status
    const statusGroups = emails.reduce((acc, email) => {
      const status = email.last_event || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Email Status Summary:');
    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Group by type (based on subject)
    const typeGroups = {
      'Client Proposals': 0,
      'Contract Signatures': 0,
      'Support Tickets': 0,
      'Service Requests': 0,
      'Other': 0
    };

    emails.forEach(email => {
      const subject = email.subject || '';
      if (subject.includes('Proposal') || subject.includes('proposal')) {
        typeGroups['Client Proposals']++;
      } else if (subject.includes('Signature') || subject.includes('Contract')) {
        typeGroups['Contract Signatures']++;
      } else if (subject.includes('Support Tickets')) {
        typeGroups['Support Tickets']++;
      } else if (subject.includes('Service Request')) {
        typeGroups['Service Requests']++;
      } else {
        typeGroups['Other']++;
      }
    });

    console.log('\n📋 Email Types:');
    Object.entries(typeGroups)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

    // Top recipients
    const recipientGroups = emails.reduce((acc, email) => {
      const recipients = Array.isArray(email.to) ? email.to : [email.to];
      recipients.forEach(recipient => {
        if (recipient) {
          acc[recipient] = (acc[recipient] || 0) + 1;
        }
      });
      return acc;
    }, {});

    console.log('\n📬 Top Recipients:');
    Object.entries(recipientGroups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([recipient, count]) => {
        console.log(`   ${recipient}: ${count} email(s)`);
      });

  } catch (error) {
    console.error('❌ Failed to fetch emails:', error.message);
  }
}

fetchEmails();
