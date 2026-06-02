/* ============================================
   SUPABASE CONFIG — dipakai oleh script.js & admin.js
   Project: cerita-cristy-academy (region Singapore)
   ============================================ */
const SUPABASE_URL = "https://blnudryukjdcdgduwuwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbnVkcnl1a2pkY2RnZHV3dXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzOTExNzAsImV4cCI6MjA5NTk2NzE3MH0.XYrdVVP3YHylZofTIZIP8JJf0XP8JU4ka1rR7_6jpYo";

// Nomor WhatsApp Business (tanpa tanda + / spasi)
const WA_NUMBER = "62895321540399";

// Inisialisasi client (library dimuat via CDN di <head>)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);