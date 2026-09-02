// =====================================================================
// MINA AI — Express + Multi-Model Chatbot API
// Supports: Gemini (all 3.5-3.8 Flash) + Custom OpenAI-compatible endpoint
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

// ===== Model registry =====
// Gemini models available via Google AI Studio
// See: https://ai.google.dev/gemini-api/docs/models
const GEMINI_MODELS = [
  { id: 'gemini-3.8-flash',         label: 'Gemini 3.8 Flash (newest)' },
  { id: 'gemini-3.7-flash',         label: 'Gemini 3.7 Flash' },
  { id: 'gemini-3.6-flash',         label: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash',         label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.5-flash-lite',    label: 'Gemini 3.5 Flash-Lite (cheapest)' },
  { id: 'gemini-2.5-flash',         label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite',    label: 'Gemini 2.5 Flash-Lite' },
  { id: 'gemini-2.0-flash',         label: 'Gemini 2.0 Flash (legacy)' },
];

// Default model
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

// Custom OpenAI-compatible endpoint support
const CUSTOM_API_KEY = process.env.CUSTOM_API_KEY || '';
const CUSTOM_BASE_URL = process.env.CUSTOM_BASE_URL || '';
const CUSTOM_MODEL = process.env.CUSTOM_MODEL || 'custom-model';

function hasCustomConfig() {
  return Boolean(CUSTOM_API_KEY && CUSTOM_BASE_URL);
}

// ===== Gemini AI client =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.KIMI_API_KEY || '';
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ===== Custom OpenAI-compatible chat (for non-Gemini endpoints) =====
async function callCustomLLM(systemPrompt, userMessage) {
  const res = await fetch(`${CUSTOM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CUSTOM_API_KEY}`,
    },
    body: JSON.stringify({
      model: CUSTOM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Custom LLM ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Maaf, tidak ada respons dari custom LLM.';
}

// ===== GET /api/models — list available models =====
app.get('/api/models', (req, res) => {
  const out = {
    gemini: GEMINI_API_KEY
      ? GEMINI_MODELS.map((m) => ({ id: m.id, label: m.label, provider: 'google' }))
      : [],
    custom: hasCustomConfig()
      ? [{ id: CUSTOM_MODEL, label: `${CUSTOM_MODEL} (custom)`, provider: 'custom' }]
      : [],
    default: GEMINI_API_KEY ? DEFAULT_GEMINI_MODEL : (hasCustomConfig() ? CUSTOM_MODEL : null),
  };
  res.json(out);
});

// ===== GET /api/health =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    gemini: Boolean(GEMINI_API_KEY),
    custom: hasCustomConfig(),
    timestamp: new Date().toISOString(),
  });
});

// ===== POST /api/chat =====
app.post('/api/chat', async (req, res) => {
  try {
    const msg = (req.body.message || '').trim();
    const requestedModel = (req.body.model || '').trim();

    if (!msg) {
      return res.json({ response: 'Silakan tulis pertanyaan Anda.' });
    }

    // Determine which model + provider to use
    let provider = 'gemini';
    let modelName = requestedModel || DEFAULT_GEMINI_MODEL;

    if (requestedModel === CUSTOM_MODEL && hasCustomConfig()) {
      provider = 'custom';
    } else if (!GEMINI_API_KEY && hasCustomConfig()) {
      // Fallback to custom if no Gemini key
      provider = 'custom';
      modelName = CUSTOM_MODEL;
    }

    if (provider === 'gemini' && !genAI) {
      return res.json({ response: 'Maaf, API key belum dikonfigurasi. 😅' });
    }
    if (provider === 'custom' && !hasCustomConfig()) {
      return res.json({ response: 'Maaf, custom LLM belum dikonfigurasi. Set CUSTOM_API_KEY + CUSTOM_BASE_URL di .env. 😅' });
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

    let reply;
    if (provider === 'gemini') {
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: msg,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });
      reply = result.text || 'Maaf, AI sedang sibuk. Coba lagi ya! 😊';
    } else {
      // Custom LLM call
      reply = await callCustomLLM(systemPrompt, msg);
    }

    reply = reply
      .replace(/http:\/\/deploy\.test/g, 'https://sipakarminang.my.id')
      .replace(/https?:\/\/(www\.)?sangkak\.com[^"'\s)]*/g, 'https://sipakarminang.my.id')
      .replace(/https?:\/\/localhost(:\d+)?[^"'\s)]*/g, 'https://sipakarminang.my.id');

    res.json({
      response: reply,
      model: modelName,
      provider,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.json({
      response: 'Maaf, terjadi gangguan. Coba lagi nanti. 😅 (Error: ' + err.message + ')',
    });
  }
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Mina AI running at http://localhost:${PORT}`);
  console.log(`  Gemini: ${GEMINI_API_KEY ? '✓ enabled (' + DEFAULT_GEMINI_MODEL + ')' : '✗ disabled'}`);
  console.log(`  Custom: ${hasCustomConfig() ? '✓ enabled (' + CUSTOM_BASE_URL + ')' : '✗ disabled'}`);
});
