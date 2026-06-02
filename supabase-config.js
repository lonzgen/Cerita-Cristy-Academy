/* ============================================
   SUPABASE CONFIG — dipakai oleh script.js & admin.js
   GANTI dua nilai di bawah dengan milik project Anda:
   Supabase Dashboard > Project Settings > API
   ============================================ */
const SUPABASE_URL = "https://zhotzzixgjxgfmcplghh.supabase.co";  
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpob3R6eml4Z2p4Z2ZtY3BsZ2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzEzODksImV4cCI6MjA5NTk0NzM4OX0.0pe2sZyjpTeKVx5OKWB9-ISEVw3CC6fbCuIUIQQTcCY"; 

// Nomor WhatsApp Business (tanpa tanda + / spasi)
const WA_NUMBER = "62895321540399";

// Inisialisasi client (library dimuat via CDN di <head>)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
