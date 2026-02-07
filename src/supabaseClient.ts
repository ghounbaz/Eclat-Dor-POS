import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://zijgsgfgfogdfdlwhpbu.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppamdzZ2ZnZm9nZGZkbHdocGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTY4ODMsImV4cCI6MjA4NjA3Mjg4M30.Ln4sK2ynsrnyKpbQykWC9G4Le5o1mbVprztAv5AqGEk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);