/*
  # Add created_at timestamp to projekt_fehler table

  1. Changes
    - Add created_at column with default timestamp
    - Add index for better query performance
*/

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projekt_fehler' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE projekt_fehler 
      ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for better sorting performance
CREATE INDEX IF NOT EXISTS idx_projekt_fehler_created_at 
  ON projekt_fehler(created_at DESC);
