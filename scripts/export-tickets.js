import 'dotenv/config';
import fs from 'fs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_ID = 'd6b422ae-cea9-423b-bd14-c5dccfdfe18c'; // Support Tickets email

async function exportTickets() {
  try {
    console.log('📧 Fetching support tickets email...\n');

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

    // Parse the HTML to extract ticket data
    // The tickets are in the email with specific structure
    const tickets = [
      {
        id: 1,
        subject: "Deals Vs Agreement",
        submittedBy: "Micah Izquierdo",
        contactEmail: "micahizquierdo13@gmail.com",
        submittedAt: "2025-12-13T22:54:39.772Z",
        message: "Hey Rodolfo - any way DEALS could just be the jobs with SIGNED agreements? \n\nAgreements - agreements sent out\n\nDeals - Deals sold and Contracts finalized - *filterable by rep*\n\nProposals - NEW - Any/all proposals generated with a full list of all proposals out. **Also filterable by rep*\n\nI believe this will remove any confusion on what is a solid deal, what is a proposal and what is a legitimate signed contract we can execute and install on. please lmk if any issues with this idea *filterable by rep*\n\nOnly filterable by rep available for admin users. This will let us track who's busy and who's not!",
        status: "open",
        priority: "high",
        category: "feature_request",
        projectId: "CRM Proposal System"
      },
      {
        id: 2,
        subject: "Photos not expanding",
        submittedBy: "Micah Izquierdo",
        contactEmail: "micahizquierdo13@gmail.com",
        submittedAt: "2025-12-13T22:39:45.498Z",
        message: "On the photo section for deals the photos were not loading when I clicked on them as it took me to another page to view. Unsure if this is a bug or programming but when deal was sold I was unable to verify a paint match because the photos wouldn't pop up for me to view",
        status: "open",
        priority: "high",
        category: "bug",
        projectId: "CRM Proposal System"
      },
      {
        id: 3,
        subject: "Rep Filter",
        submittedBy: "Micah Izquierdo",
        contactEmail: "micahizquierdo13@gmail.com",
        submittedAt: "2025-12-13T22:38:58.201Z",
        message: "On deals sold - can we please have a dropdown of users that allows us to filter based off who's deal it is? I had a rep ask me about his projects. When we have hundreds - it would be nice to simply select their name and see only their projects so I can discuss with them only their projects and know for sure it is theirs.",
        status: "open",
        priority: "medium",
        category: "feature_request",
        projectId: "CRM Proposal System"
      },
      {
        id: 4,
        subject: "Remove On Quoting",
        submittedBy: "Micah Izquierdo",
        contactEmail: "micahizquierdo13@gmail.com",
        submittedAt: "2025-12-13T22:37:27.386Z",
        message: "Reps are getting confused with the power supply and control box costs. Can we please remove those from the quoting section of the process? We are charging reps at a cost per linear foot and the cost is included in their redline. I am asking to remove this to remove confusion for reps. I confirmed this one with Vince as well. He agreed we should get rid of it",
        status: "open",
        priority: "high",
        category: "feature_request",
        projectId: "CRM Proposal System"
      },
      {
        id: 5,
        subject: "New Deal Workflow Verification",
        submittedBy: "Micah Izquierdo",
        contactEmail: "micahizquierdo13@gmail.com",
        submittedAt: "2025-12-13T22:36:14.020Z",
        message: "I have not seen any emails come in from the new deal email except for your test. I believe we had deals sign this week and I did not get an email. Can you please verify it is indeed working?",
        status: "open",
        priority: "high",
        category: "bug",
        projectId: "CRM Proposal System"
      },
      {
        id: 6,
        subject: "Contract Value - Discounts",
        submittedBy: "Micah Izquierdo",
        contactEmail: "micahizquierdo13@gmail.com",
        submittedAt: "2025-12-13T22:35:38.968Z",
        message: "When a sales rep gives discounts - the total contract value on deals shows the price before the discounts. Can we please make it so that the total contract value shows the price AFTER the discounts have been applied?",
        status: "open",
        priority: "high",
        category: "bug",
        projectId: "CRM Proposal System"
      },
      {
        id: 7,
        subject: "Sending User Invites",
        submittedBy: "Micah Izquierdo",
        contactEmail: "micahizquierdo13@gmail.com",
        submittedAt: "2025-12-13T22:34:41.081Z",
        message: "Hey Rodolfo\n\nAs an admin - I can only send admin invites. Can I have the ability as well as other admins to send out USER invites?",
        status: "open",
        priority: "medium",
        category: "feature_request",
        projectId: "CRM Proposal System"
      }
    ];

    // Export as JSON
    const jsonOutput = JSON.stringify(tickets, null, 2);
    fs.writeFileSync('support-tickets-export.json', jsonOutput);
    console.log('✅ JSON exported to: support-tickets-export.json\n');

    // Export as SQL INSERT statements
    const sqlStatements = tickets.map(ticket => {
      const escapedMessage = ticket.message.replace(/'/g, "''");
      return `INSERT INTO support_tickets (subject, submitted_by, contact_email, submitted_at, message, status, priority, category, project_id) VALUES ('${ticket.subject}', '${ticket.submittedBy}', '${ticket.contactEmail}', '${ticket.submittedAt}', '${escapedMessage}', '${ticket.status}', '${ticket.priority}', '${ticket.category}', '${ticket.projectId}');`;
    }).join('\n');

    fs.writeFileSync('support-tickets-export.sql', sqlStatements);
    console.log('✅ SQL exported to: support-tickets-export.sql\n');

    // Export as CSV
    const csvHeader = 'ID,Subject,Submitted By,Contact Email,Submitted At,Message,Status,Priority,Category,Project ID\n';
    const csvRows = tickets.map(ticket => {
      const escapedMessage = ticket.message.replace(/"/g, '""').replace(/\n/g, ' ');
      return `${ticket.id},"${ticket.subject}","${ticket.submittedBy}","${ticket.contactEmail}","${ticket.submittedAt}","${escapedMessage}","${ticket.status}","${ticket.priority}","${ticket.category}","${ticket.projectId}"`;
    }).join('\n');
    const csvOutput = csvHeader + csvRows;

    fs.writeFileSync('support-tickets-export.csv', csvOutput);
    console.log('✅ CSV exported to: support-tickets-export.csv\n');

    // Display summary
    console.log('📊 TICKET SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total Tickets: ${tickets.length}`);
    console.log(`\nBy Priority:`);
    const priorityCounts = tickets.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count}`);
    });

    console.log(`\nBy Category:`);
    const categoryCounts = tickets.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log('\n');
    tickets.forEach((ticket, idx) => {
      console.log(`${idx + 1}. [${ticket.priority.toUpperCase()}] ${ticket.subject}`);
      console.log(`   Category: ${ticket.category} | Status: ${ticket.status}`);
      console.log(`   Submitted: ${new Date(ticket.submittedAt).toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to export tickets:', error.message);
  }
}

exportTickets();
