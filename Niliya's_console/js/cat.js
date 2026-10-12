(() => {
    const btn = document.getElementById('catBtn');
    if (!btn) return;
    if (matchMedia('(hover:none)').matches) { btn.hidden = true; return; }   // touch-only: no cat
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const SW = 28, SH = 20, S = 3, CW = SW * S, CH = SH * S, GAP = 90;
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

    // ---- pixel sprites: white shapes get an automatic black outline ----
    function sprite(pose, f) {
        const w = [], k = [];
        if (pose === 'walk') {
            const b = f % 2 ? -1 : 0, ph = [0, 2, 1, 3];
            w.push([6, 8 + b, 13, 6], [18, 4 + b, 8, 7], [18, 2 + b, 2, 3], [24, 2 + b, 2, 3],
                [4, 9 + b, 3, 2], f < 2 ? [2, 5 + b, 2, 5] : [2, 6 + b, 2, 4]);
            [7, 10, 14, 17].forEach((lx, i) => {
                const up = (f + ph[i]) % 4 === 0;
                w.push([lx, 12, 2, up ? 3 : 4]);
            });
            k.push([21, 6 + b, 1, 2], [24, 6 + b, 1, 2], [25, 8 + b, 1, 1]);
        } else if (pose === 'sit') {
            w.push([9, 10, 10, 7], [9, 3, 10, 8], [9, 1, 3, 3], [16, 1, 3, 3],
                [9, 16, 3, 2], [16, 16, 3, 2], [19, 15, 3, 2],
                f % 2 ? [22, 12, 2, 4] : [21, 11, 2, 5]);
            if (f === 3) k.push([10, 7, 3, 1], [15, 7, 3, 1]);       // blink
            else k.push([11, 6, 1, 2], [16, 6, 1, 2]);
            k.push([13, 8, 2, 1]);
        } else {                                                   // sleep (breathing)
            const b = f % 2;
            w.push([6, 10 + b, 16, 7 - b], [3, 11 + b, 8, 6 - b], [3, 9 + b, 2, 2], [8, 9 + b, 2, 2], [20, 13, 7, 3]);
            k.push([4, 13 + b, 2, 1], [7, 13 + b, 2, 1]);
        }
        return { w, k };
    }
    function draw() {
        const key = state + frame;
        if (key === drawn) return;
        drawn = key;
        const { w, k } = sprite(state, frame);
        g.clearRect(0, 0, SW, SH);
        g.fillStyle = INK;
        w.forEach(r => g.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2));
        g.fillStyle = WHITE;
        w.forEach(r => g.fillRect(r[0], r[1], r[2], r[3]));
        g.fillStyle = INK;
        k.forEach(r => g.fillRect(r[0], r[1], r[2], r[3]));
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
                const k = 1 - Math.exp(-dt / 280);
                const nx = x + (mx - dx / d * GAP - CW / 2 - x) * k;
                const ny = y + (my - dy / d * GAP - CH / 2 - y) * k;
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
        const period = state === 'walk' ? 110 : state === 'sit' ? 400 : 1000;
        if (ft >= period) { ft = 0; frame = (frame + 1) % (state === 'sleep' ? 2 : 4); }

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