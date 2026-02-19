
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gpobmcthpljksgqmkqzu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwb2JtY3RocGxqa3NncW1rcXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzk3NzksImV4cCI6MjA4Njg1NTc3OX0.PoIFKQDH3hz_uhM0jhMFaRJ9s6zIRwPogY0WsZmbg0A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
