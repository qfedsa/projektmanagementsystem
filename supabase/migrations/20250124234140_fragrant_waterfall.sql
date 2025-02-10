-- Add archived column to message_sent table
ALTER TABLE message_sent ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_message_sent_archived ON message_sent(archived);

-- Add comment to table
COMMENT ON COLUMN message_sent.archived IS 'Indicates whether the message has been archived';
