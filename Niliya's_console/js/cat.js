(() => {
    const btn = document.getElementById('catBtn');
    if (!btn) return;
    if (matchMedia('(hover:none)').matches) { btn.hidden = true; return; }   // touch-only: no cat
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const SW = 28, SH = 22, S = 3, CW = SW * S, CH = SH * S, GAP = 90;
    const INK = '#1b1340', WHITE = '#ffffff';
    const MSGS = [
        'Hey! Following you.',
        'A moth entered the room. I became a weather event.',
        'pspspsps... where are we going?',
        'Your code looks suspicious. Let me inspect it.',
        'I was totally not sleeping.',
        'Meow. That\'s my professional opinion.',
        'This portfolio needs more cat.',
        'I have important cat business to attend to.'
    ];

    // ---- DOM ----
    const cat = document.createElement('div');
    cat.id = 'cat';
    cat.innerHTML =
        '<div class="cat-bubble" role="status"></div>' +
        '<div class="cat-zz" aria-hidden="true"><span>z</span><span>Z</span><span>z</span></div>' +
        '<div class="cat-flip" aria-hidden="true"><canvas width="' + SW + '" height="' + SH + '"></canvas></div>';
    document.body.appendChild(cat);
    const bub = cat.querySelector('.cat-bubble');
    const flip = cat.querySelector('.cat-flip');
    const g = cat.querySelector('canvas').getContext('2d');

    // ---- state ----
    let on = true;
    try { on = localStorage.getItem('catOn') !== '0'; } catch (e) { }
    let x = innerWidth - CW - 40, y = innerHeight - CH - 60;
    let mx = x + CW / 2, my = y + CH / 2;
    let state = 'sit', frame = 0, ft = 0, last = performance.now();
    let lastMouse = last, lastStep = last, coolUntil = 0;
    let facingLeft = false, drawn = '', raf = 0;
    let bt = 0, bubOn = false, bubW = 0, bubH = 0, lastMsg = '';

    // ---- pixel sprites (drawn from text grids; the black outline is added automatically) ----
    const PAL = { w: '#ffffff', p: '#ff9ec7', g: '#dcd8ee', k: INK };
    const r = (n, s) => '.'.repeat(n) + s, w = n => 'w'.repeat(n);
    const rows = m => { const a = Array(SH).fill(''); for (const y in m) a[y] = m[y]; return a; };

    // sitting cat: left half only, mirrored automatically
    function sitRows(blink) {
        const eye = blink
            ? ['wwwwwwwww', 'wwwkkwwww', 'wwwwwwwww']
            : ['wwwwkwwww', 'wwwkkwwww', 'wwwkkwwww'];
        return ['', '.w.......', '.ww......', '.wpw.....', '.wppwwwww', 'wwwwwwwww', 'wwwwwwwww',
            ...eye, 'wppwwwwwp', 'wwwwwwkkw', 'wwwwwwwww', '.wwwwwwww', '..wwwwwww', '..wwwwwww',
            '.wwwwwwww', '.wwwwwwww', '.wwwwwwwk', '.wwwwwwwk', '.wwwwwwww'];
    }
    const tailSit = [
        rows({ 16: r(22, 'ww'), 17: r(22, 'ww'), 18: r(22, 'ww'), 19: r(21, 'www'), 20: r(20, 'www') }),
        rows({ 16: r(24, 'ww'), 17: r(23, 'ww'), 18: r(22, 'ww'), 19: r(21, 'www'), 20: r(20, 'www') })
    ];

    // walking cat, facing right
    const walkBody = ['', '', '', r(19, 'w...w'), r(18, 'wpw.wpw'), r(18, w(8)), r(18, w(8)),
        r(18, w(5) + 'kww'), r(18, w(5) + 'kww' + 'p'), r(5, w(21)), r(5, w(20)),
        r(5, w(15)), r(5, w(15)), r(5, w(15)), r(5, 'www' + 'g'.repeat(9) + 'www'), r(6, w(13))];
    const tailWalk = [
        rows({ 5: r(2, 'ww'), 6: r(1, 'ww'), 7: r(1, 'ww'), 8: r(1, 'ww'), 9: r(1, 'wwww'), 10: r(2, 'www') }),
        rows({ 4: r(3, 'ww'), 5: r(2, 'ww'), 6: r(2, 'ww'), 7: r(1, 'ww'), 8: r(1, 'ww'), 9: r(1, 'wwww'), 10: r(2, 'www') })
    ];

    // sleeping, curled up
    const sleepRows = [...Array(10).fill(''),
    r(6, 'w...w'), r(5, 'wpw.wpw'), r(4, w(18)), r(3, w(20)),
    r(3, 'ww' + 'kk' + 'www' + 'kk' + w(11)),
    r(3, w(5) + 'p' + w(14)),
    r(3, w(20)), r(3, w(20)), r(4, w(18)), r(5, w(16)), r(7, w(12))];

    function put(gr, rws, ox, dy, mirror) {
        rws.forEach((row, y) => {
            if (mirror) row += [...row].reverse().join('');
            [...row].forEach((c, x) => {
                const yy = y + dy, xx = x + ox;
                if (c !== '.' && yy >= 0 && yy < SH && xx < SW) gr[yy][xx] = c;
            });
        });
    }

    function build(pose, f) {
        const gr = Array.from({ length: SH }, () => Array(SW).fill(''));
        if (pose === 'sit') {
            put(gr, sitRows(f === 3), 2, 0, true);
            put(gr, tailSit[f % 2], 0, 0);
        } else if (pose === 'walk') {
            const dy = f % 2 ? -1 : 0, ph = [0, 2, 1, 3];
            [7, 10, 15, 18].forEach((lx, i) => {
                const end = (f + ph[i]) % 4 === 0 ? 17 : 19;
                for (let y = 15; y <= end; y++) { gr[y][lx] = 'w'; gr[y][lx + 1] = 'w'; }
            });
            put(gr, walkBody, 0, dy);
            put(gr, tailWalk[f % 2], 0, dy);
        } else {
            put(gr, sleepRows, 0, 0);
            for (let x = 13; x <= 21; x++) gr[17][x] = 'k';
            for (let x = 13; x <= 20; x++) gr[18][x] = 'g';
            for (let x = 14; x <= 19; x++) gr[19][x] = 'g';
        }
        // automatic 1px black outline around the silhouette
        const out = gr.map(row => row.slice());
        for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
            if (gr[y][x]) continue;
            if ((y > 0 && gr[y - 1][x]) || (y < SH - 1 && gr[y + 1][x]) ||
                (x > 0 && gr[y][x - 1]) || (x < SW - 1 && gr[y][x + 1])) out[y][x] = 'k';
        }
        return out;
    }

    function draw() {
        const key = state + frame;
        if (key === drawn) return;
        drawn = key;
        g.clearRect(0, 0, SW, SH);
        build(state, frame).forEach((row, y) => row.forEach((c, x) => {
            if (c) { g.fillStyle = PAL[c]; g.fillRect(x, y, 1, 1); }
        }));
    }
    // ---- speech bubble ----
    function pick() {
        let m;
        do { m = MSGS[Math.floor(Math.random() * MSGS.length)]; } while (m === lastMsg);
        return (lastMsg = m);
    }
    function placeBubble() {
        const rel = Math.max(8, Math.min(innerWidth - bubW - 8, x + CW / 2 - bubW / 2)) - x;
        bub.style.translate = rel + 'px 0';
        bub.classList.toggle('below', y < bubH + 16);
    }
    function hide() { clearTimeout(bt); bubOn = false; bub.classList.remove('show'); }
    function say(text, ms = 4200) {
        if (!on) return;
        clearTimeout(bt);
        bub.textContent = text;                 // plain text only
        bubW = bub.offsetWidth; bubH = bub.offsetHeight;
        bubOn = true;
        placeBubble();
        bub.classList.add('show');
        bt = setTimeout(hide, ms);
    }
    bub.addEventListener('click', hide);
    addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });

    // ---- helpers ----
    function setState(s) {
        if (state === s) return;
        state = s; frame = 0; ft = 0;
        cat.classList.toggle('sleeping', s === 'sleep');
    }
    function hop() {
        flip.classList.remove('hop');
        void flip.offsetWidth;
        flip.classList.add('hop');
    }
    function apply() {
        cat.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
        flip.classList.toggle('left', facingLeft);
        if (bubOn) placeBubble();
    }
    function clamp() {
        x = Math.max(4, Math.min(innerWidth - CW - 4, x));
        y = Math.max(4, Math.min(innerHeight - CH - 4, y));
    }

    // ---- main loop ----
    function tick(now) {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(64, now - last); last = now;
        if (!on || innerWidth < 600) return;

        const dx = mx - (x + CW / 2), dy = my - (y + CH / 2), d = Math.hypot(dx, dy) || 1;
        let moved = 0;

        if (state !== 'sleep') {
            if (d > GAP) {                                   // glide toward a spot GAP px from the cursor
                const k = 1 - Math.exp(-dt / 520);             // bigger number = lazier
                let nx = x + (mx - dx / d * GAP - CW / 2 - x) * k;
                let ny = y + (my - dy / d * GAP - CH / 2 - y) * k;
                const step = Math.hypot(nx - x, ny - y), cap = dt * 0.16;   // top speed about 160px/s
                if (step > cap) { nx = x + (nx - x) * cap / step; ny = y + (ny - y) * cap / step; }
                moved = Math.hypot(nx - x, ny - y);
                x = nx; y = ny;
                clamp();
            }
            if (Math.abs(dx) > 8) facingLeft = dx < 0;

            if (moved > .4 * dt / 16) { lastStep = now; setState('walk'); }
            else if (state === 'walk' && now - lastStep > 250) setState('sit');

            if (state === 'sit' && now - lastMouse > 8000) setState('sleep');

            if (d < 60 && now > coolUntil) {                 // cursor came close: little reaction
                coolUntil = now + 7000;
                hop();
                say(['Meow.', 'mrrp!', 'pspspsps... where are we going?'][Math.floor(Math.random() * 3)], 2500);
            }
        }

        ft += dt;
        const period = state === 'walk' ? 170 : state === 'sit' ? 450 : 1000;
        if (ft >= period) { ft = 0; frame = (frame + 1) % (state === 'sleep' ? 1 : 4); }

        draw();
        apply();
    }

    // ---- input ----
    addEventListener('pointermove', e => {
        mx = e.clientX; my = e.clientY;
        lastMouse = performance.now();
        if (state === 'sleep' && on) {
            setState('sit');
            hop();
            say('I was totally not sleeping.');
        }
    }, { passive: true });
    addEventListener('resize', () => { clamp(); apply(); });

    // ---- show / hide button ----
    function setOn(v, announce) {
        on = v;
        cat.hidden = !v;
        btn.setAttribute('aria-pressed', v);
        btn.setAttribute('aria-label', v ? 'Hide the cat' : 'Show the cat');
        if (!v) hide(); else if (announce) say(MSGS[0]);
        try { localStorage.setItem('catOn', v ? '1' : '0'); } catch (e) { }
    }
    btn.addEventListener('click', () => setOn(!on, true));

    // ---- random chatter ----
    (function chatter() {
        setTimeout(() => {
            if (on && state !== 'sleep' && !bubOn && innerWidth >= 600) say(pick());
            chatter();
        }, 14000 + Math.random() * 10000);
    })();

    // ---- start ----
    cat.hidden = !on;
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Hide the cat' : 'Show the cat');
    if (reduce) {                                         // reduced motion: sits quietly in a corner
        x = innerWidth - CW - 24; y = innerHeight - CH - 24;
        draw(); apply();
    } else {
        clamp(); draw(); apply();
        raf = requestAnimationFrame(tick);
    }
    setTimeout(() => say(MSGS[0]), 700);
})();