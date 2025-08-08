#!/bin/bash

# Script to set up Vercel environment variables

echo "Setting up Vercel environment variables..."

# Add each environment variable
vercel env add RESEND_API_KEY production < <(echo "re_RzYzyomh_EqadjvdaFha6TxLxPocxmqVp")
vercel env add EMAIL_FROM production < <(echo "onboarding@resend.dev")
vercel env add EMAIL_TO production < <(echo "ralvarez@bettersystems.ai")
vercel env add AIRTABLE_API_KEY production < <(echo "patSbE9ICNm4R5wFe.312391a8e222a9efc1466dae48d8e60c1d8265db9de581327c85d533bd5718b7")
vercel env add AIRTABLE_BASE_ID production < <(echo "appoRZaNnI2EWVIrj")
vercel env add AIRTABLE_TABLE_NAME production < <(echo "tblYCy5c4UHCy0vr9")
vercel env add JWT_SECRET production < <(echo "prod-secret-$(openssl rand -hex 32)")
vercel env add NODE_ENV production < <(echo "production")

echo "Environment variables set up successfully!"