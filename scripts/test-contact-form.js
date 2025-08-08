// Test script to verify email and Airtable integration
async function testContactForm() {
  const testData = {
    formIdentifier: "Test Contact Form",
    name: "Test User",
    email: "test@example.com",
    message: "This is a test message to verify the email and Airtable integration is working correctly.",
    phone: "(928) 555-0123",
    company: "Test Company"
  };

  try {
    console.log('Sending test contact form submission...');
    
    const response = await fetch('http://localhost:3001/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!', result);
      console.log('Check your email and Airtable for the new record.');
    } else {
      console.error('❌ Error:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the test
testContactForm();