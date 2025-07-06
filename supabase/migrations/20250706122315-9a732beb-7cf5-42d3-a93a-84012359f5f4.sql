-- Force complete PostgREST schema refresh
NOTIFY pgrst, 'reload schema';