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

document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('pointerenter', () => cur.classList.add('big'));
    el.addEventListener('pointerleave', () => cur.classList.remove('big'));
});

/* ── Click: confetti burst ── */
const em = ['✦', '★', '♥', '⚡', '✿'];

document.addEventListener('click', e => {
    const el = e.target.closest('a,button');
    if (!el) return;

    // beep() is defined in sound.js (loaded first)
    beep(el.classList.contains('skill')
        ? [...document.querySelectorAll('.skill')].indexOf(el)
        : +el.dataset.s || 3);

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

// Skill hover sound
document.querySelectorAll('.skill').forEach((s, i) =>
    s.addEventListener('pointerenter', () => beep(i % 6)));

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

    let cardPop, cardPopT;
    c.addEventListener('click', e => {
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
            if (cardPop === pop) {
                pop.remove();
                cardPop = null;
            }
        }, 3400);
    });
});
// ---------- Snake cursor mode ----------
(() => {
    const btn = document.getElementById('curBtn');
    const cv = document.createElement('canvas');
    cv.id = 'snake';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const g = cv.getContext('2d');

    const PX = 9, LEN = 14, GAP = 2.5;
    let on = false, raf = 0, W = 0, H = 0;
    let px = innerWidth / 2, py = innerHeight / 2;     // mouse
    let hx = px, hy = py;                              // smoothed head
    const trail = [];                                  // recent head positions

    function isClickable(el) {
        if (!el) return false;
        if (el.closest('a, button, [role="button"], input, select, textarea, label, .clickable, .skill, .card, .xp-head, .brand-tag, .icon-btn, .btn, .nav-link, .me-tag, [data-s], [onclick]')) {
            return true;
        }
        try {
            const s = window.getComputedStyle(el);
            if (s.cursor === 'pointer') return true;
        } catch (e) {}
        return false;
    }

    function size() {
        const d = devicePixelRatio || 1;
        W = innerWidth; H = innerHeight;
        cv.width = W * d; cv.height = H * d;
        g.setTransform(d, 0, 0, d, 0, 0);
    }
    addEventListener('resize', size);
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; });

    function frame() {
        hx += (px - hx) * .05;
        hy += (py - hy) * .05;
        trail.unshift([hx, hy]);
        if (trail.length > Math.ceil(LEN * GAP) + 2) trail.pop();

        g.clearRect(0, 0, W, H);

        // body from tail to head so the head sits on top
        for (let i = LEN - 1; i >= 0; i--) {
            const idx = Math.min(Math.floor(i * GAP), trail.length - 1);
            const p = trail[idx];
            if (!p) continue;
            const x = Math.round(p[0] / PX) * PX - PX / 2;
            const y = Math.round(p[1] / PX) * PX - PX / 2;
            const cx = x + PX / 2;
            const cy = y + PX / 2;

            const el = document.elementFromPoint(cx, cy);
            const inClickable = isClickable(el);

            let c;
            if (inClickable) {
                // Pink color when inside clickable area
                c = i === 0 ? '#ffc2e2' : `hsl(${330 + (i / LEN) * 15}, 92%, ${65 - (i / LEN) * 16}%)`;
            } else {
                // Smooth green color normally
                c = i === 0 ? '#9effc5' : `hsl(${142 + (i / LEN) * 16}, 80%, ${52 - (i / LEN) * 16}%)`;
            }

            g.shadowColor = c;
            g.shadowBlur = 8;
            g.fillStyle = c;
            g.fillRect(x, y, PX - 1, PX - 1);

            if (i === 0) {                      // eyes
                g.shadowBlur = 0;
                g.fillStyle = inClickable ? '#4a082b' : '#062615';
                g.fillRect(x + 2, y + 2, 2, 2);
                g.fillRect(x + 5, y + 2, 2, 2);
                g.shadowBlur = 8;
            }
        }
        raf = requestAnimationFrame(frame);
    }

    function set(v) {
        on = v;
        document.body.classList.toggle('snake', on);
        btn.setAttribute('aria-pressed', on);
        btn.setAttribute('aria-label', on ? 'Switch to circle cursor' : 'Switch to snake cursor');
        cancelAnimationFrame(raf);
        if (on) {
            size();
            hx = px; hy = py;
            trail.length = 0;
            frame();
        }
        try { localStorage.setItem('cursorMode', on ? 'snake' : 'blob'); } catch (e) { }
    }

    btn.addEventListener('click', () => set(!on));
    let saved;
    try { saved = localStorage.getItem('cursorMode'); } catch (e) { }
    if (saved === 'snake' && matchMedia('(hover:hover)').matches) set(true);
})();