-- Add user_id column to delays table
ALTER TABLE delays 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_delays_user_id 
ON delays(user_id);

-- Add comment explaining the column
COMMENT ON COLUMN delays.user_id IS 'The user who reported this delay';
