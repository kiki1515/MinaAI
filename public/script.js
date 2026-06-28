// =====================================================================
// Mina AI — Chat UI Script
// Mengirim input pengguna ke Gemini API via HTTP request
// =====================================================================
(function() {
    const API_URL = '/api/chat';
    const STORAGE_KEY = 'minaai_chat';
    const QUICK_REPLIES = [
        'Bagaimana cara diagnosa?', 'Apa itu CF?',
        'Apa saja penyebab?', 'Siapa saja ahli waris?',
        'Apa beda S1 S2 S3?', 'Tentang aplikasi ini',
        'Berapa jumlah rule?'
    ];
    let history = loadHistory();
    let loading = false;
    let inited = false;
    const $ = id => document.getElementById(id);

    function md2html(text) {
        const lines = text.split('\n');
        let out = '', tbl = '', inTbl = false, inList = false;
        const fmt = s => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#3cb371;text-decoration:underline;">$1</a>');
        for (let i = 0; i < lines.length; i++) {
            const L = lines[i], nx = lines[i+1];
            if (L.includes('|') && nx && /^\|[\s\-:]+\|/.test(nx)) {
                if (inList) { out += '</ul>'; inList = false; }
                inTbl = true; tbl = '<table><thead><tr>';
                L.split('|').filter(c => c.trim()).forEach(h => { tbl += '<th>' + fmt(h.trim()) + '</th>'; });
                tbl += '</tr></thead><tbody>'; i++; continue;
            }
            if (inTbl && L.includes('|')) {
                tbl += '<tr>';
                L.split('|').filter(c => c.trim()).forEach(c => { tbl += '<td>' + fmt(c.trim()) + '</td>'; });
                tbl += '</tr>'; continue;
            }
            if (inTbl && !L.includes('|')) { out += tbl + '</tbody></table>'; tbl = ''; inTbl = false; }
            if (/^[\-\*]\s/.test(L)) {
                if (!inList) { out += '<ul>'; inList = true; }
                out += '<li>' + fmt(L.replace(/^[\-\*]\s/, '')) + '</li>'; continue;
            }
            if (inList && !/^[\-\*]\s/.test(L)) { out += '</ul>'; inList = false; }
            if (/^###\s/.test(L)) { out += '<h3>' + fmt(L.replace(/^###\s/, '')) + '</h3>'; continue; }
            if (/^##\s/.test(L)) { out += '<h2>' + fmt(L.replace(/^##\s/, '')) + '</h2>'; continue; }
            out += L.trim() ? '<p>' + fmt(L) + '</p>' : '<br>';
        }
        if (inTbl) out += tbl + '</tbody></table>';
        if (inList) out += '</ul>';
        return out;
    }

    function init() {
        if (inited) return;
        inited = true;
        const qr = $('cb-quick');
        QUICK_REPLIES.forEach(t => {
            const b = document.createElement('button');
            b.className = 'cb-quick-btn';
            b.textContent = t;
            b.onclick = () => { $('cb-input').value = t; send(); };
            qr.appendChild(b);
        });
        if (history.length === 0) {
            addBubble('bot', 'Halo! Saya **Mina AI** 👋\n\nSaya asisten virtual untuk **Sipakar Minang** — Sistem Pakar Waris Pusako Minangkabau. 😊\n\nSaya bisa bantu jelaskan cara diagnosa, CF, ahli waris, dan lainnya. Ketik pertanyaan atau pilih dari tombol di bawah 👇', false);
        } else {
            history.forEach(m => addBubble(m.role, m.text, false));
        }
        $('cb-send').onclick = send;
        $('cb-input').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    }

    function loadHistory() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
    function saveHistory() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-50))); }
        catch {}
    }
    window.clearChat = function() {
        history = []; saveHistory();
        $('cb-messages').innerHTML = '';
        addBubble('bot', 'Halo! Saya **Mina AI** 👋 Ada yang bisa saya bantu? 😊', true);
    };

    function addBubble(role, text, save) {
        const div = document.createElement('div');
        div.className = 'cb-bubble ' + (role === 'user' ? 'cb-user' : 'cb-bot');
        if (role === 'user') div.textContent = text;
        else div.innerHTML = md2html(text);
        $('cb-messages').appendChild(div);
        scrollBottom();
        if (save) { history.push({ role, text }); saveHistory(); }
    }

    function typing(on) {
        const el = document.getElementById('cb-typing');
        if (on && !el) {
            const d = document.createElement('div');
            d.className = 'cb-typing'; d.id = 'cb-typing';
            d.innerHTML = '<span></span><span></span><span></span>';
            $('cb-messages').appendChild(d);
            scrollBottom();
        } else if (!on && el) el.remove();
    }

    function scrollBottom() {
        requestAnimationFrame(() => { $('cb-messages').scrollTop = $('cb-messages').scrollHeight; });
    }

    function send() {
        if (loading) return;
        const input = $('cb-input');
        const text = input.value.trim();
        if (!text || text.length < 2) { input.focus(); return; }
        input.value = '';
        addBubble('user', text, true);
        loading = true;
        $('cb-send').disabled = true;
        input.disabled = true;
        typing(true);
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
        })
        .then(r => r.json())
        .then(d => {
            typing(false);
            addBubble('bot', d.response || 'Maaf, terjadi kesalahan.', true);
        })
        .catch(() => {
            typing(false);
            addBubble('bot', 'Maaf, gangguan koneksi. Coba lagi. 😅', true);
        })
        .finally(() => {
            loading = false;
            $('cb-send').disabled = false;
            input.disabled = false;
            input.focus();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();
