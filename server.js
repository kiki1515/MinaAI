// =====================================================================
// MINA AI — Express + Gemini Chatbot API
// =====================================================================
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== Load knowledge.txt =====
const KNOWLEDGE_PATH = path.join(__dirname, 'knowledge.txt');
let knowledgeBase = '';
try {
  knowledgeBase = fs.readFileSync(KNOWLEDGE_PATH, 'utf-8');
} catch {
  knowledgeBase = '';
}

// ===== Load km_minang.txt (kamus Minang) =====
const KM_PATH = path.join(__dirname, 'km_minang.txt');
let minangToId = {};
let idToMinang = {};

try {
  const lines = fs.readFileSync(KM_PATH, 'utf-8').split('\n');
  // Skip header rows (first 2 lines)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('=')) continue;
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const minang = parts[0].trim().toLowerCase();
      const indo = parts[1].trim().toLowerCase();
      if (minang && indo && minang !== 'minangkabau' && minang !== 'indonesia') {
        minangToId[minang] = indo;
        if (!idToMinang[indo]) idToMinang[indo] = [];
        idToMinang[indo].push(parts[0].trim()); // keep original case
      }
    }
  }
} catch {
  // Kamus tidak ada
}

// ===== Helper functions =====
function translateMinang(text, dict) {
  const words = text.toLowerCase().trim().split(/\s+/);
  const translated = [];
  let count = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, '');
    if (dict[clean]) {
      translated.push('*' + dict[clean] + '*');
      count++;
    } else {
      translated.push(w);
    }
    if (count >= 30) break;
  }
  return translated.join(' ');
}

function detectMinang(text, dict) {
  const words = text.toLowerCase().trim().split(/\s+/);
  let found = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean.length > 2 && dict[clean]) found++;
  }
  return found >= 2;
}

// ===== Gemini AI =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.KIMI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ===== POST /api/chat =====
app.post('/api/chat', async (req, res) => {
  try {
    const msg = (req.body.message || '').trim();
    if (!msg) {
      return res.json({ response: 'Silakan tulis pertanyaan Anda.' });
    }

    // Minang detection & translation
    const isMinang = detectMinang(msg, minangToId);
    let kmData = '';
    let translatedMsg = '';
    if (isMinang) {
      translatedMsg = translateMinang(msg, minangToId);
      kmData = `\n\n[USER MENGGUNAKAN BAHASA MINANG – TERJEMAHAN: ${translatedMsg}]`;
    }

    const systemPrompt = `Kamu adalah **Mina AI** — asisten virtual untuk **Sipakar Minang** (Sistem Pakar Waris Pusako Minangkabau). **Namamu adalah MINA** (bukan Sipakar AI, bukan Minang, bukan nama lain).

**PENTING: SELALU perkenalkan diri sebagai "Mina AI" ketika:**
- User bertanya "siapa kamu?" / "kamu siapa?" / "perkenalkan" / "namamu apa?"
- User menyapa di awal percakapan
- User bingung dengan identitas chatbot
- Jawaban: "Saya **Mina AI** 👋, asisten virtual untuk Sipakar Minang"

Gunakan informasi berikut untuk menjawab pertanyaan user dengan ramah, jelas, dan ringkas:

${knowledgeBase}${kmData}

Gunakan bahasa Indonesia yang santai dan friendly. Jawab dengan padat, maksimal 3-4 paragraf.
Format jawaban pakai markdown (boleh **bold** untuk poin penting).

**PENTING: Domain aplikasi adalah https://sipakarminang.my.id/ — WAJIB gunakan domain ini untuk SEMUA link navigasi, jangan gunakan domain lain!**
Format link: [Teks Link](https://sipakarminang.my.id/halaman)
Contoh:
- Untuk diagnosa: [→ Mulai Diagnosa](https://sipakarminang.my.id/diagnosa)
- Untuk dalil: [→ Lihat Dalil](https://sipakarminang.my.id/dalil)
- Untuk about: [→ Tentang Aplikasi](https://sipakarminang.my.id/about)
- Untuk login: [→ Login](https://sipakarminang.my.id/login)
- Untuk register: [→ Daftar](https://sipakarminang.my.id/register)
- Untuk riwayat: [→ Riwayat Diagnosa](https://sipakarminang.my.id/riwayat)
- Untuk kontak: [→ Hubungi Kami](https://sipakarminang.my.id/kontak)

Jika user bertanya dalam bahasa Minang, jawablah dalam bahasa Indonesia yang mudah dipahami, tapi boleh menyelipkan istilah Minang yang relevan untuk menunjukkan kearifan lokal.`;

    if (!genAI) {
      return res.json({ response: 'Maaf, API key belum dikonfigurasi. 😅' });
    }

    const result = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: msg,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const reply = (result.text || 'Maaf, AI sedang sibuk. Coba lagi ya! 😊')
      .replace(/http:\/\/deploy\.test/g, 'https://sipakarminang.my.id');
    res.json({ response: reply });
  } catch (err) {
    console.error('Gemini error:', err);
    res.json({ response: 'Maaf, terjadi gangguan. Coba lagi nanti. 😅 (Error: ' + err.message + ')' });
  }
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Mina AI running at http://localhost:${PORT}`);
});
