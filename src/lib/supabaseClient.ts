import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdntlkpnelqqnsvtqfpt.supabase.co';
const supabaseServiceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbnRsa3BuZWxxcW5zdnRxZnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDExMDExMCwiZXhwIjoyMDU5Njg2MTEwfQ.N2ru7Hc0t0F095yWxxVAp98kTzgUMcz-OMFmJLwDsfs';

//const supabaseUrl = 'https://gdntlkpnelqqnsvtqfpt.supabase.co';
//const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbnRsa3BuZWxxcW5zdnRxZnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMTAxMTAsImV4cCI6MjA1OTY4NjExMH0.qrjzOAwi0fpfL9fIXK3lNVsXfpOmqzqqBsOAzWXeTfg';

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
