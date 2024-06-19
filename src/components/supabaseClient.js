import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwwyttirhxalydgvunzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d3l0dGlyaHhhbHlkZ3Z1bnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0NzMyMDUsImV4cCI6MjAzNDA0OTIwNX0.niXyxNYnR6OnytWMEvvYPxpatDDAaDzdYb6h8-O8ElA';

export const supabase = createClient(supabaseUrl, supabaseKey);
