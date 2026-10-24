/**
 * cursor.js
 * - Smooth lagging custom cursor (.cur / .dot)
 * - Cursor enlarges on hover over interactive elements
 * - Click: confetti burst + beep sound
 * - Project card 3-D tilt on pointermove
 */

/* ── Custom cursor ── */
const cur = document.querySelector('.cur');
const dot = document.querySelector('.dot');
let mx = 0, my = 0, cx = 0, cy = 0;

addEventListener('pointermove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px)`;
});

(function loop() {
    cx += (mx - cx) * .18;
    cy += (my - cy) * .18;
    cur.style.transform = `translate(${cx}px,${cy}px)`;
    requestAnimationFrame(loop);
})();

document.addEventListener('pointerover', e => {
    if (e.target.closest('a,button')) cur.classList.add('big');
    const s = e.target.closest('.skill');
    if (s && !s.contains(e.relatedTarget))
        keyTouch();
});
document.addEventListener('pointerout', e => {
    if (e.target.closest('a,button')) cur.classList.remove('big');
});

/* ── Click: confetti burst ── */
const em = ['✦', '★', '♥', '⚡', '✿'];

document.addEventListener('click', e => {
    const el = e.target.closest('a,button');
    if (!el) return;

    // beep() is defined in sound.js (loaded first)
    if (el.classList.contains('skill') || el.classList.contains('xp-head')) keyClick();
    else beep(+el.dataset.s || 3);

    if (el.classList.contains('skill')) el.classList.toggle('on');

    for (let i = 0; i < 8; i++) {
        const p = document.createElement('span');
        p.className = 'pop';
        p.textContent = em[i % 5];
        p.style.left = e.clientX + 'px';
        p.style.top = e.clientY + 'px';
        const a = Math.random() * 6.28, d = 50 + Math.random() * 60;
        p.style.setProperty('--x', Math.cos(a) * d + 'px');
        p.style.setProperty('--y', Math.sin(a) * d + 'px');
        p.style.setProperty('--r', Math.random() * 360 + 'deg');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
});

/* ── Project card 3-D tilt & mousemove interaction ── */
document.querySelectorAll('.card').forEach(c => {
    const img = c.querySelector('.card-img img');
    const content = c.querySelector('div:not(.card-img)');

    c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const x = px - 0.5;
        const y = py - 0.5;

        // Set spotlight reflection coordinates
        c.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        c.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);

        // Smooth active tracking
        c.style.transition = 'transform 0.08s ease-out, box-shadow 0.2s';
        c.style.transform = `perspective(800px) rotateZ(var(--rot, 0deg)) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale(1.05) translateY(-4px)`;

        if (img) {
            img.style.transition = 'transform 0.08s ease-out';
            img.style.transform = `scale(1.12) translate(${x * -10}px, ${y * -10}px)`;
        }
        if (content) {
            content.style.transition = 'transform 0.08s ease-out';
            content.style.transform = `translate(${x * 6}px, ${y * 6}px)`;
        }
    });

    c.addEventListener('pointerleave', () => {
        c.style.transition = 'transform 0.4s ease-out, box-shadow 0.2s';
        c.style.transform = '';
        if (img) {
            img.style.transition = 'transform 0.4s ease-out';
            img.style.transform = '';
        }
        if (content) {
            content.style.transition = 'transform 0.4s ease-out';
            content.style.transform = '';
        }
    });

    // ---------- Project cards: open the link, or show the maintenance popup ----------
    let cardPop, cardPopT;
    document.addEventListener('click', e => {
        const c = e.target.closest('.card');
        if (!c) return;
        e.preventDefault();

        const href = c.getAttribute('href');
        if (href && !c.hasAttribute('data-offline')) {
            window.open(href, '_blank', 'noopener');
            return;
        }

        // no link, or marked data-offline: show the message
        if (cardPop) cardPop.remove();
        clearTimeout(cardPopT);
        const pop = document.createElement('div');
        pop.className = 'card-pop';
        pop.setAttribute('role', 'status');
        pop.textContent = "OOPS! Currently under maintenance Come back in a day or two to explore the awesome & fun projects I’ve built!";
        pop.style.left = e.pageX + 'px';
        pop.style.top = e.pageY + 'px';
        document.body.appendChild(pop);
        cardPop = pop;
        cardPopT = setTimeout(() => {
            if (cardPop === pop) { pop.remove(); cardPop = null; }
        }, 3400);
    });
});

// ---------- Snake cursor mode ----------
(() => {
    const btn = document.getElementById('curBtn');
    if (!btn) return;
    const cv = document.createElement('canvas');
    cv.id = 'snake';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const g = cv.getContext('2d');

    const PX = 14, LEN = 9, GAP = 3;
    const CLICKABLE = 'a,button,[role="button"],input,select,textarea,label,[data-s],.card,.skill,.xp-head,.icon-btn,.btn,.me-tag';
    let on = false, raf = 0, W = 0, H = 0;
    let px = innerWidth / 2, py = innerHeight / 2;   // mouse
    let hx = px, hy = py;                            // smoothed head
    let hot = 0;                                     // 0 = lime, 1 = pink
    const trail = [];

    function size() {
        const d = devicePixelRatio || 1;
        W = innerWidth; H = innerHeight;
        cv.width = W * d; cv.height = H * d;
        g.setTransform(d, 0, 0, d, 0, 0);
    }
    addEventListener('resize', () => { if (on) size(); });
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; });

    function frame() {
        hx += (px - hx) * .22;
        hy += (py - hy) * .22;
        trail.unshift([hx, hy]);
        if (trail.length > LEN * GAP + 2) trail.pop();

        // one hit-test per frame, at the real pointer position
        const el = document.elementFromPoint(px, py);
        const target = el && el.closest(CLICKABLE) ? 1 : 0;
        hot += (target - hot) * .2;                  // smooth lime <-> pink fade
        const hue = 78 - hot * 108;                  // 78 = lime, -30 = pink

        g.clearRect(0, 0, W, H);
        for (let i = LEN - 1; i >= 0; i--) {
            const p = trail[Math.min(i * GAP, trail.length - 1)];
            if (!p) continue;
            const x = Math.round(p[0] / PX) * PX - PX / 2;
            const y = Math.round(p[1] / PX) * PX - PX / 2;
            const c = i === 0
                ? `hsl(${hue} 85% 62%)`
                : `hsl(${hue + (i / LEN) * 22} 78% ${54 - (i / LEN) * 14}%)`;
            g.shadowBlur = i === 0 ? 6 : 0;
            g.shadowColor = c;
            g.fillStyle = c;
            g.fillRect(x, y, PX - 2, PX - 2);
            if (i === 0) {                            // eyes
                g.shadowBlur = 0;
                g.fillStyle = '#1b1340';
                g.fillRect(x + 3, y + 3, 3, 3);
                g.fillRect(x + 8, y + 3, 3, 3);
            }
        }
        raf = requestAnimationFrame(frame);
    }

    // three modes: arrow -> blob -> snake -> arrow
    let mode = 'arrow';
    const labels = {
        arrow: 'Switch to circle cursor',
        blob: 'Switch to snake cursor',
        snake: 'Switch to arrow cursor'
    };
    const next = { arrow: 'blob', blob: 'snake', snake: 'arrow' };

    function setMode(m) {
        mode = m;
        on = m === 'snake';
        document.body.classList.toggle('snake', on);
        document.body.classList.toggle('arrow', m === 'arrow');
        btn.setAttribute('aria-pressed', m !== 'blob');
        btn.setAttribute('aria-label', labels[m]);
        btn.dataset.mode = m;
        cancelAnimationFrame(raf);
        if (on) {
            size();
            hx = px; hy = py;
            trail.length = 0;
            frame();
        }
        try { localStorage.setItem('cursorMode', m); } catch (e) { }
    }

    btn.addEventListener('click', () => setMode(next[mode]));

    // start on the arrow, or on whatever the visitor picked last time
    if (matchMedia('(hover:hover)').matches) {
        let saved;
        try { saved = localStorage.getItem('cursorMode'); } catch (e) { }
        setMode(saved === 'blob' || saved === 'snake' || saved === 'arrow' ? saved : 'arrow');
    }
})();