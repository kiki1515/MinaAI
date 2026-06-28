# Mina AI — Chatbot Sipakar Minang

Asisten virtual untuk **Sipakar Minang** (Sistem Pakar Waris Pusako Minangkabau) berbasis Node.js + Express + Gemini API.

## Tentang Project

**Mina AI** adalah bagian dari proyek skripsi:

> **Muhammad Fikri Khrisna**  
> *PERANCANGAN SISTEM CERDAS DENGAN PENDEKATAN FORWARD CHAINING DAN CERTAINTY FACTOR UNTUK PEMBAGIAN HARTA WARIS MENURUT HUKUM ADAT MINANGKABAU*  
> Universitas Putra Indonesia YPTK Padang — Oktober 2028

## Fitur

- 💬 Chat interaktif dengan **Gemini 2.5 Flash**
- 🏛️ Knowledge base waris Minangkabau (Pusako Randah & Pusako Tinggi)
- 🗣️ Deteksi & terjemahan bahasa Minang otomatis
- 🔗 Link navigasi ke halaman aplikasi Sipakar Minang
- 🌙 Tampilan dark mode glassmorphism

## Struktur Folder

```
MinaAI/
├── server.js              # Express server + Gemini API handler
├── public/
│   ├── index.html         # Chat UI
│   ├── style.css          # Styling
│   └── script.js          # Client-side logic (fetch ke API)
├── .env                   # API keys (jangan di-commit)
├── package.json
├── knowledge.txt          # Knowledge base
├── km_minang.txt          # Kamus Minang-Indonesia
└── foto/
    └── mina.svg           # Avatar chatbot
```

## Cara Install & Jalankan

1. **Clone repo**

```bash
git clone <repo-url>
cd MinaAI
```

2. **Install dependencies**

```bash
npm install
```

3. **Buat file `.env`**

```
GEMINI_API_KEY="isi_api_key_kamu"
GEMINI_MODEL="gemini-2.5-flash"
```

4. **Jalankan server**

```bash
npm start
```

Atau dengan auto-restart:

```bash
npm run dev
```

5. **Buka di browser**

```
http://localhost:3000
```

## API Endpoint

**POST** `/api/chat`

```json
Request:  { "message": "Apa itu CF?" }
Response: { "response": "..." }
```

## Teknologi

- **Node.js** — Runtime
- **Express 5** — Web framework
- **Gemini 2.5 Flash** — AI model via `@google/genai`
- **GoogleGenAI SDK** — `@google/genai`
