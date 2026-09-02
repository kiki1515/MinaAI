# Mina AI — Chatbot Sipakar Minang

Asisten virtual untuk **Sipakar Minang** (Sistem Pakar Waris Pusako Minangkabau) berbasis Node.js + Express + Multi-Model AI.

## Tentang Project

**Mina AI** adalah bagian dari proyek skripsi:

> **Muhammad Fikri Khrisna**  
> *PERANCANGAN SISTEM CERDAS DENGAN PENDEKATAN FORWARD CHAINING DAN CERTAINTY FACTOR UNTUK PEMBAGIAN HARTA WARIS MENURUT HUKUM ADAT MINANGKABAU*  
> Universitas Putra Indonesia YPTK Padang — Oktober 2026

🌐 **Aplikasi web terkait**: [sipakarminang.my.id](https://sipakarminang.my.id)

## ✨ Fitur

- 💬 Chat interaktif dengan **multi-model AI**
  - **Gemini 3.8/3.7/3.6/3.5 Flash** (model terbaru dari Google AI Studio)
  - **Gemini 2.5/2.5 Lite** (legacy, lebih murah)
  - **Custom OpenAI-compatible endpoint** (pakai LLM sendiri: OpenAI, OpenRouter, Ollama, LM Studio, dll)
- 🏛️ Knowledge base waris Minangkabau (Pusako Randah & Pusako Tinggi)
- 🗣️ Deteksi & terjemahan bahasa Minang otomatis
- 🔗 Link navigasi ke halaman aplikasi Sipakar Minang (auto-rewrite)
- 🌙 Tampilan dark mode glassmorphism
- ⚙️ API endpoints:
  - `GET /api/health` — cek status server & model availability
  - `GET /api/models` — list model yang aktif
  - `POST /api/chat` — kirim pesan (dengan `model` opsional)

## 🤖 Model AI yang Didukung

### Google Gemini (via AI Studio)
| Model ID | Keterangan | Status |
|----------|------------|--------|
| `gemini-3.8-flash` | Latest, paling pintar | ✅ Stable |
| `gemini-3.7-flash` | Recommended for production | ✅ Stable |
| `gemini-3.6-flash` | Stable | ✅ Stable |
| `gemini-3.5-flash` | Legacy, stabil | ✅ Stable |
| `gemini-3.5-flash-lite` | Cheapest 3.5 | ✅ Stable |
| `gemini-2.5-flash` | Legacy | ⚠️ Shutting down Oct 2026 |
| `gemini-2.5-flash-lite` | Budget | ⚠️ Shutting down Oct 2026 |
| `gemini-2.0-flash` | Old default (dihapus) | ❌ Shut down |

### Custom OpenAI-Compatible Endpoint
Pakai LLM apapun yang support OpenAI API format:
- **OpenAI** (`https://api.openai.com/v1`)
- **OpenRouter** (`https://openrouter.ai/api/v1`)
- **Ollama** (`http://localhost:11434/v1`) — local!
- **LM Studio** (`http://localhost:1234/v1`) — local!
- **vLLM, llama.cpp, text-generation-webui**, dll

## 📁 Struktur Folder

```
MinaAI/
├── server.js              # Express server + multi-model handler
├── public/
│   ├── index.html         # Chat UI
│   ├── style.css          # Styling
│   └── script.js          # Client-side logic
├── .env                   # API keys (JANGAN di-commit)
├── package.json
├── knowledge.txt          # Knowledge base waris Minang
├── km_minang.txt          # Kamus Minang-Indonesia
└── foto/
    └── mina.svg           # Avatar chatbot
```

## 🚀 Cara Install & Jalankan

### 1. Clone repo

```bash
git clone https://github.com/kiki1515/MinaAI.git
cd MinaAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Buat file `.env` (di root folder)

**Minimum (pakai Gemini):**
```bash
GEMINI_API_KEY="your-google-ai-studio-api-key"
GEMINI_MODEL="gemini-3.5-flash"
```

**Atau pakai Custom OpenAI-compatible (contoh OpenRouter):**
```bash
CUSTOM_API_KEY="sk-or-v1-..."
CUSTOM_BASE_URL="https://openrouter.ai/api/v1"
CUSTOM_MODEL="anthropic/claude-3.5-sonnet"
```

**Atau Local LLM (LM Studio / Ollama):**
```bash
CUSTOM_API_KEY="lm-studio"
CUSTOM_BASE_URL="http://localhost:1234/v1"
CUSTOM_MODEL="llama-3.1-8b-instruct"
```

Dapatkan Gemini API key gratis: https://aistudio.google.com/apikey

### 4. Jalankan server

```bash
npm start
```

Atau dengan auto-reload saat edit:
```bash
npm run dev
```

### 5. Buka di browser

```
http://localhost:3000
```

## 🔌 API Endpoints

### `GET /api/health`
Cek status server & model availability.

**Response:**
```json
{
  "status": "ok",
  "gemini": true,
  "custom": false,
  "timestamp": "2026-09-03T04:00:00.000Z"
}
```

### `GET /api/models`
List model yang tersedia (filtered by API key yang aktif).

**Response:**
```json
{
  "gemini": [
    { "id": "gemini-3.8-flash", "label": "Gemini 3.8 Flash (newest)", "provider": "google" },
    { "id": "gemini-3.5-flash", "label": "Gemini 3.5 Flash", "provider": "google" }
  ],
  "custom": [],
  "default": "gemini-3.5-flash"
}
```

### `POST /api/chat`

**Request body:**
```json
{
  "message": "Apa itu Pusako Randah?",
  "model": "gemini-3.5-flash"   // optional, defaults to GEMINI_MODEL env
}
```

**Response:**
```json
{
  "response": "Pusako Randah adalah...",
  "model": "gemini-3.5-flash",
  "provider": "gemini"
}
```

## 🛠️ Teknologi

- **Node.js** — Runtime
- **Express 5** — Web framework
- **@google/genai** v2 — Gemini SDK
- **CORS** — untuk akses cross-origin
- **dotenv** — environment variable management
- **fetch** (native) — untuk custom OpenAI-compatible endpoint

## 🎓 Konteks Akademik

Proyek skripsi ini mendemonstrasikan integrasi **Sistem Pakar** (rule-based Forward Chaining + Certainty Factor) dengan **AI Generatif** (LLM) untuk:
- Meningkatkan aksesibilitas knowledge base hukum adat
- Memberikan penjelasan kontekstual untuk user awam
- Mendukung multi-bahasa (Indonesia + Minangkabau)
- Link langsung ke aplikasi web Sipakar Minang

## 📄 Lisensi

ISC License — bebas digunakan, dimodifikasi, dan didistribusikan.

## 👤 Author

**Muhammad Fikri Khrisna**
- GitHub: [@kiki1515](https://github.com/kiki1515)
- LinkedIn: [Muhammad Fikri Khrisna](https://www.linkedin.com/in/muhammad-fikri-khrisna-b756a51b3/)
- Instagram: [@kkhrisnaa](https://instagram.com/kkhrisnaa)
