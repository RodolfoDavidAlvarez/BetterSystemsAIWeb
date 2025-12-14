-- Add multi-photo support to support_tickets table
-- Change screenshot_url from single text to array of text (max 3 photos)

-- Step 1: Add new column for screenshot URLs array
ALTER TABLE support_tickets
ADD COLUMN screenshot_urls text[];

-- Step 2: Migrate existing screenshot_url data to screenshot_urls array
UPDATE support_tickets
SET screenshot_urls = ARRAY[screenshot_url]
WHERE screenshot_url IS NOT NULL AND screenshot_url != '';

-- Step 3: Add a check constraint to limit array to max 3 items
ALTER TABLE support_tickets
ADD CONSTRAINT screenshot_urls_max_3 CHECK (
  screenshot_urls IS NULL OR
  array_length(screenshot_urls, 1) IS NULL OR
  array_length(screenshot_urls, 1) <= 3
);

-- Add comment for documentation
COMMENT ON COLUMN support_tickets.screenshot_urls IS 'Array of screenshot URLs (max 3) for the support ticket';

-- Verify migration
SELECT id, title, screenshot_url, screenshot_urls FROM support_tickets WHERE screenshot_url IS NOT NULL LIMIT 5;
