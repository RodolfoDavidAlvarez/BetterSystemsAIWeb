import Airtable from 'airtable';

// Initialize Airtable with configuration
const airtableApiKey = process.env.AIRTABLE_API_KEY || 'patSbE9ICNm4R5wFe.312391a8e222a9efc1466dae48d8e60c1d8265db9de581327c85d533bd5718b7';
const airtableBaseId = process.env.AIRTABLE_BASE_ID || 'appoRZaNnI2EWVIrj';

// Initialize Airtable
const base = new Airtable({ apiKey: airtableApiKey }).base(airtableBaseId);

// Log configuration status
console.log('[Airtable Service] Initialized with base:', airtableBaseId);

interface FormSubmission {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  formType: string;
  submittedAt: string;
  [key: string]: any;
}

export async function saveToAirtable(data: FormSubmission) {
  try {
    // Map form data to Airtable fields
    const record = {
      'Name': data.name,
      'Email': data.email,
      'Phone': data.phone || '',
      'Company': data.company || '',
      'Form Type': data.formType,
      'Submitted At': data.submittedAt,
      'Status': 'New',
      // Store all form data as JSON in a single field for flexibility
      'Form Data': JSON.stringify(data),
    };

    // Add specific fields based on form type
    if (data.message) {
      record['Message'] = data.message;
    }
    
    if (data.currentChallenges) {
      record['Current Challenges'] = data.currentChallenges;
    }
    
    if (data.timeline) {
      record['Timeline'] = data.timeline;
    }
    
    if (data.industry) {
      record['Industry'] = data.industry;
    }

    const result = await base(process.env.AIRTABLE_TABLE_NAME || 'tblYCy5c4UHCy0vr9').create(record);
    
    return { 
      success: true, 
      recordId: result.getId(),
      fields: result.fields 
    };
  } catch (error) {
    console.error('Error saving to Airtable:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function updateAirtableRecord(recordId: string, updates: any) {
  try {
    const result = await base(process.env.AIRTABLE_TABLE_NAME || 'tblYCy5c4UHCy0vr9').update(recordId, updates);
    
    return { 
      success: true, 
      fields: result.fields 
    };
  } catch (error) {
    console.error('Error updating Airtable record:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}