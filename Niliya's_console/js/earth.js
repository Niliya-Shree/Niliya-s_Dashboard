(() => {
    const box = document.getElementById('earth');
    if (!box) return;
    const cv = box.querySelector('canvas'), g = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let CELL = 9;
    const BASE = 0.28;                       // dot spacing, spin speed (radians per second)

    // tiny world map: for each of 32 latitude rows, the land spans across 64 longitude columns
    const SPANS = [
        [], [[21, 28], [44, 50]], [[8, 17], [19, 29], [33, 35], [40, 43], [47, 53], [56, 60]],
        [[3, 8], [9, 20], [19, 28], [33, 38], [39, 63]], [[2, 22], [22, 27], [28, 29], [32, 40], [41, 63]],
        [[3, 22], [24, 26], [30, 31], [33, 63]], [[7, 22], [30, 32], [34, 60]],
        [[8, 22], [31, 42], [43, 57], [59, 60]], [[9, 22], [30, 40], [41, 58], [60, 61]],
        [[9, 21], [30, 33], [35, 36], [38, 61]], [[9, 20], [29, 41], [43, 60]],
        [[11, 19], [21, 22], [29, 41], [42, 59]], [[13, 22], [29, 52], [53, 58]],
        [[15, 19], [29, 45], [49, 51], [54, 57], [59, 60]], [[17, 26], [30, 43], [50, 51], [54, 57]],
        [[17, 26], [31, 43], [52, 58], [61, 63]], [[17, 27], [32, 43], [52, 54], [56, 58], [60, 63]],
        [[17, 26], [33, 42], [53, 57], [61, 63]], [[17, 26], [33, 42], [53, 58]],
        [[18, 26], [33, 44], [52, 60]], [[19, 25], [33, 41], [43, 44], [52, 60]],
        [[19, 24], [33, 40], [52, 61]], [[19, 23], [34, 38], [53, 60], [63, 63]],
        [[19, 22], [57, 58], [62, 63]], [[19, 22], [62, 63]], [[19, 21]], [], [[17, 19]],
        [[0, 12], [16, 26], [36, 63]], [[0, 63]], [[0, 63]], [[0, 63]]
    ];
    const MW = 64, MH = 32, mask = new Float32Array(MW * MH);
    SPANS.forEach((row, y) => row.forEach(([a, b]) => { for (let x = a; x <= b; x++) mask[y * MW + x] = 1; }));
    function land(u, v) {                               // nearest cell: no smoothing, so edges stay blocky
        const x = ((Math.floor(u) % MW) + MW) % MW, y = Math.max(0, Math.min(MH - 1, Math.floor(v)));
        return mask[y * MW + x];
    }
    const LG = 'o0c6e€8&%$#@', WG = '.:·+*';
    function hash(a, b, c) { const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return n - Math.floor(n); }

    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    let rot = 0.6, rotV = BASE, dragging = false, lastX = 0, lastT = 0, mx = -999, my = -999, last = 0, raf = 0;

    function size() {
        const d = devicePixelRatio || 1;
        W = box.clientWidth; H = box.clientHeight;
        if (!W || !H) return;
        cv.width = W * d; cv.height = H * d;
        g.setTransform(d, 0, 0, d, 0, 0);
        const top = 50;                                   // space taken by the buttons
        // R = Math.min(W * .4, (H - top) * .46);
        // CELL = Math.max(3.5, Math.min(9, R / 26));
        R = Math.min(W * .44, (H - top) * .5);
        CELL = Math.max(5.5, Math.min(10, R / 13));
        cx = W / 2; cy = top + (H - top) / 2;             // centred in the space under the buttons
        draw(performance.now(), true);
    }

    function draw(now, still) {
        if (!still && now - last < 42) return;            // about 24 fps for a choppier, terminal feel
        const dt = Math.min(.1, (now - last) / 1000) || 0; last = now;
        if (!reduce && !dragging && !still) {
            rotV += (BASE - rotV) * Math.min(1, dt * 2);   // glide back to the slow spin after a drag
            rot += rotV * dt;
        }
        const tick = reduce ? 0 : Math.floor(now / 110);  // flicker steps about 9 times a second
        const simple = CELL < 6.5;                        // small globe: plain dots, no letters
        g.clearRect(0, 0, W, H);
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.lineWidth = 1.1;

        const gx0 = Math.floor((cx - R) / CELL), gx1 = Math.ceil((cx + R) / CELL);
        const gy0 = Math.floor((cy - R) / CELL), gy1 = Math.ceil((cy + R) / CELL);
        const reach = 70 * (CELL / 9);                    // hover glow scales with the dots
        for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
            const px = gx * CELL + CELL / 2, py = gy * CELL + CELL / 2;
            const nx = (px - cx) / R, ny = (cy - py) / R, r2 = nx * nx + ny * ny;
            if (r2 > 1) continue;
            const nz = Math.sqrt(1 - r2);
            const lat = Math.asin(ny), lon = Math.atan2(nx, nz) - rot;
            const u = ((((lon / 6.2832) + .5) % 1) + 1) % 1 * MW, v = (.5 - lat / Math.PI) * MH;
            const shade = Math.pow(nz, .5) * .8 + Math.max(0, -.5 * nx + .5 * ny + .7 * nz) * .2;
            const dd = Math.hypot(px - mx, py - my), boost = dd < reach ? 1 - dd / reach : 0;
            const f = hash(gx, gy, tick);                   // changes every tick = flicker

            if (land(u, v) > .5) {
                if (simple) {
                    g.fillStyle = `rgba(255,79,163,${Math.min(1, .6 + .35 * shade + boost * .3).toFixed(2)})`;
                    g.beginPath(); g.arc(px, py, CELL * (.46 + boost * .15), 0, 6.283); g.fill();
                } else {
                    const dim = f > .93 ? .45 : 1;              // a few cells dim for a moment
                    g.fillStyle = `rgba(255,79,163,${((.55 + .4 * shade) * dim).toFixed(2)})`;
                    g.beginPath(); g.arc(px, py, CELL * (.44 + boost * .12), 0, 6.283); g.fill();
                    g.strokeStyle = `rgba(255,190,225,${((.35 + .6 * shade) * dim).toFixed(2)})`;
                    g.beginPath(); g.arc(px, py, CELL * (.44 + boost * .12), 0, 6.283); g.stroke();
                    g.fillStyle = `rgba(27,19,64,${((.55 + .4 * shade + boost * .2) * dim).toFixed(2)})`;
                    g.font = `bold ${CELL - 2}px ui-monospace,Menlo,Consolas,monospace`;
                    g.fillText(LG[Math.floor(hash(gx, gy, Math.floor(tick / 3)) * LG.length)], px, py + .5);
                }
            } else {
                if (simple) {
                    if (f < .04 && !boost) continue;            // a few ocean dots blink off
                    g.fillStyle = `rgba(255,255,255,${Math.min(1, .2 + .32 * shade + boost * .4).toFixed(2)})`;
                    g.beginPath(); g.arc(px, py, CELL * (.15 + boost * .15), 0, 6.283); g.fill();
                } else {
                    if (f < .05 && !boost) continue;            // some ocean characters blink off
                    const hi = f > .9 || boost > .3;            // others flash brighter
                    g.fillStyle = `rgba(255,255,255,${Math.min(1, (hi ? .85 : .22 + .38 * shade) + boost * .3).toFixed(2)})`;
                    g.font = `${hi ? CELL + 1 : CELL - 1}px ui-monospace,Menlo,Consolas,monospace`;
                    g.fillText(WG[Math.floor(hash(gy, gx, Math.floor(tick / 2)) * WG.length)], px, py);
                }
            }
        }
    }

    function loop(now) { raf = requestAnimationFrame(loop); draw(now); }

    // drag to spin, hover to make the dots swell
    box.addEventListener('pointerdown', e => {
        if (e.target.closest('a')) return;
        dragging = true; lastX = e.clientX; lastT = performance.now();
        box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', e => {
        const r = box.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
        if (dragging) {
            const now = performance.now(), dx = e.clientX - lastX;
            rot += dx / R;
            rotV = Math.max(-4, Math.min(4, (dx / R) / Math.max(.008, (now - lastT) / 1000)));
            lastX = e.clientX; lastT = now;
        }
        if (reduce) draw(performance.now(), true);
    });
    const up = () => { dragging = false; };
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    box.addEventListener('pointerleave', () => { mx = my = -999; if (reduce) draw(performance.now(), true); });

    new ResizeObserver(size).observe(box);
    if (!reduce) {                                     // only animate while it's on screen
        new IntersectionObserver(es => {
            cancelAnimationFrame(raf);
            if (es[0].isIntersecting) { last = performance.now(); raf = requestAnimationFrame(loop); }
        }).observe(box);
    }
    size();
})();