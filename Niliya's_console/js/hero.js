/**
 * hero.js
 * - Animates each letter of the h1 heading (word-wrapped so names never split)
 * - Rotates the role pill (websites → APIs → …) every 2.2 s
 * - Portrait parallax on scroll
 * - Portrait click-to-classify (face / hair / jacket / background)
 * - "hi there!" ↔ "What's up?" tag toggle
 */

/* ── Letter hop animation ── */
const h = document.getElementById('h'), t = h.textContent;
h.textContent = '';
h.setAttribute('aria-label', t);
let li = 0;
const words = t.split(' ');
words.forEach((w, wi) => {
    const word = document.createElement('span');
    word.className = 'word';
    word.setAttribute('aria-hidden', 'true');
    [...w].forEach(c => {
        const s = document.createElement('span');
        s.style.setProperty('--i', li++);
        s.textContent = c;
        word.appendChild(s);
    });
    h.appendChild(word);
    if (wi < words.length - 1) { h.appendChild(document.createTextNode(' ')); li++; }
});

/* ── Rotating role words ── */
const roles = ['websites', 'APIs', 'AI tools', 'weird little apps', 'things that ship'];
const re = document.getElementById('role');
let ri = 0;
setInterval(() => {
    re.classList.add('flip');
    setTimeout(() => {
        ri = (ri + 1) % roles.length;
        re.textContent = roles[ri];
        re.classList.remove('flip');
    }, 200);
}, 2200);

/* ── Portrait parallax ── */
const me = document.getElementById('me');
addEventListener('scroll', () => {
    me.style.translate = `0 ${scrollY * .12}px`;
}, { passive: true });

/* ── Portrait tag toggle ── */
const meImg = me.querySelector('img'), meTag = me.querySelector('.me-tag');
let tagAlt = false;
meTag.addEventListener('click', () => {
    tagAlt = !tagAlt;
    meTag.textContent = tagAlt ? "What's up?" : 'hi there!';
    meTag.classList.remove('bump');
    void meTag.offsetWidth;
    meTag.classList.add('bump');
});

/* ── Portrait click-pop ── */
let meCanvas, meCtx, mePop, popT;

function showPop(text, x, y) {
    if (mePop) mePop.remove();
    clearTimeout(popT);
    mePop = document.createElement('div');
    mePop.className = 'me-pop';
    mePop.setAttribute('role', 'status');
    mePop.textContent = text;
    me.appendChild(mePop);
    mePop.style.left = Math.max(115, Math.min(me.clientWidth - 115, x)) + 'px';
    mePop.style.top = Math.max(70, y) + 'px';
    popT = setTimeout(() => { mePop.remove(); mePop = null; }, 3200);
}

const inFace = (x, y) => ((x - 1040) / 120) ** 2 + ((y - 355) / 170) ** 2 < 1;

const hairZone = (x, y) =>
    y > 80 && y < 680 &&
    ((x > 780 && x < 1295 && y < 540) ||
        (x > 780 && x < 960 && y >= 540) ||
        (x > 1120 && x < 1295 && y >= 540));

function classify(ix, iy) {
    const nw = meImg.naturalWidth, nh = meImg.naturalHeight;
    if (ix < 0 || iy < 0 || ix >= nw || iy >= nh) return 'background';
    if (inFace(ix, iy)) return 'face';
    try {
        if (!meCanvas) {
            meCanvas = document.createElement('canvas');
            meCanvas.width = nw;
            meCanvas.height = nh;
            meCtx = meCanvas.getContext('2d', { willReadFrequently: true });
            meCtx.drawImage(meImg, 0, 0);
        }
        const x0 = Math.max(0, Math.min(nw - 7, Math.round(ix) - 3));
        const y0 = Math.max(0, Math.min(nh - 7, Math.round(iy) - 3));
        const d = meCtx.getImageData(x0, y0, 7, 7).data;
        let r = 0, g = 0, b = 0, a = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; a += d[i + 3]; }
        const n = d.length / 4;
        r /= n; g /= n; b /= n; a /= n;
        const lum = .3 * r + .59 * g + .11 * b;
        if (a < 128 || Math.min(r, g, b) >= 249) return 'background';
        if (hairZone(ix, iy)) {
            if (lum < 135 && r - b < 70) return 'hair';
            const R = 15, wx = Math.max(0, Math.min(nw - 31, Math.round(ix) - R));
            const wy = Math.max(0, Math.min(nh - 31, Math.round(iy) - R));
            const w = meCtx.getImageData(wx, wy, 31, 31).data;
            let dark = 0;
            for (let i = 0; i < w.length; i += 4) {
                if (.3 * w[i] + .59 * w[i + 1] + .11 * w[i + 2] < 95) dark++;
            }
            if (dark / (w.length / 4) > .3) return 'hair';
        }
        if (lum > 190 && r - b < 40) return 'jacket';
        return 'other';
    } catch {
        if (hairZone(ix, iy)) return 'hair';
        if (iy > 590 && ix > 595 && ix < 1475) return 'jacket';
        return 'background';
    }
}

const popText = {
    background: "That's the background you are clicking on. Click somewhere else.",
    jacket: 'This white coat makes me feel like a doctor.',
    hair: 'I recently got short hair, and I like it.',
    face: 'Hehe, that tickles!',
    other: 'Hehe, that tickles!'
};
const popBeep = { background: 0, jacket: 1, hair: 3, face: 4, other: 4 };

meImg.addEventListener('click', e => {
    const w = meImg.clientWidth, h = meImg.clientHeight;
    const nw = meImg.naturalWidth, nh = meImg.naturalHeight;
    if (!nw) return;
    const s = Math.max(w / nw, h / nh);
    const ix = (e.offsetX - (w - nw * s) * .9) / s;
    const iy = (e.offsetY - (h - nh * s)) / s;
    const kind = classify(ix, iy);
    showPop(popText[kind], e.offsetX + 4, e.offsetY + 4);
    beep(popBeep[kind]);       // beep() is defined in sound.js, loaded first
});

// keep the social hover previews inside the screen
document.querySelectorAll('.social a').forEach(a => {
    const pv = a.querySelector('.pv');
    if (!pv) return;
    const fit = () => {
        pv.style.translate = '0 0';
        const r = pv.getBoundingClientRect(), m = 8;
        let dx = 0;
        if (r.right > innerWidth - m) dx = innerWidth - m - r.right;     // too far right: pull left
        if (r.left + dx < m) dx = m - r.left;                            // too far left: push right
        pv.style.translate = dx + 'px 0';
    };
    a.addEventListener('pointerenter', fit);
    a.addEventListener('focusin', fit);
});