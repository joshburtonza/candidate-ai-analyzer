-- Enable realtime for cv_uploads table
ALTER TABLE cv_uploads REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE cv_uploads;