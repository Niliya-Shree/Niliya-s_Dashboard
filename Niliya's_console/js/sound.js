/**
 * sound.js
 * Central audio module.
 *
 * Exports (globals, since no bundler):
 *   beep(k)         – UI click beep (square/triangle/sine, 6-note scale)
 *   tone(opts)      – single pitched blip
 *   swish(opts)     – filtered-noise cloth/breath sweep
 *   pitter()        – one pit-pat footstep
 *   steps(ms)       – repeated footsteps for `ms` milliseconds
 *   thumpSound()    – landing thump
 *   tuckSound()     – sheet-pull rustle
 *   untuckSound()   – sheet-off rustle
 *   boing()         – springy jump
 *   lullaby()       – 4-note sleep melody
 *   yawnSound()     – full yawn synthesis
 *   nomSound()      – eating crunches + happy hum
 */

let ctx;
let on = true;    // shared sound-on flag, toggled by nav.js

/* ── Sound-toggle button ── */
const snd = document.getElementById('snd');
snd.onclick = () => {
    on = !on;
    snd.setAttribute('aria-pressed', on);
    snd.setAttribute('aria-label', on ? 'Mute sound' : 'Unmute sound');
    if (on) beep(0);
};

/* ── AudioContext helper ── */
function actx() {
    try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    } catch { return null; }
}

/* ── UI click beep ── */
function beep(k) {
    if (!on) return;
    try {
        const c = actx();
        const notes = [523, 659, 784, 880, 988, 1175];
        const o = c.createOscillator(), g = c.createGain();
        o.type = ['square', 'triangle', 'sine'][k % 3];
        o.frequency.value = notes[k % notes.length];
        g.gain.setValueAtTime(.12, c.currentTime);
        g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .25);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + .26);
    } catch { }
}

/* ── Soft pitched blip ── */
function tone({ f = 600, f2 = f, t = 0, d = .15, type = 'sine', v = .1 }) {
    const c = actx();
    if (!c || !on) return;
    const o = c.createOscillator(), g = c.createGain(), now = c.currentTime + t;
    o.type = type;
    o.frequency.setValueAtTime(f, now);
    o.frequency.exponentialRampToValueAtTime(f2, now + d);
    g.gain.setValueAtTime(.0001, now);
    g.gain.exponentialRampToValueAtTime(v, now + .012);
    g.gain.exponentialRampToValueAtTime(.0001, now + d);
    o.connect(g).connect(c.destination);
    o.start(now);
    o.stop(now + d + .02);
}

/* ── Filtered-noise cloth/breath sweep ── */
function swish({ from = 400, to = 1800, d = .5, v = .12, t = 0 }) {
    const c = actx();
    if (!c || !on) return;
    const len = Math.floor(c.sampleRate * d);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter(), g = c.createGain(), now = c.currentTime + t;
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(from, now);
    bp.frequency.exponentialRampToValueAtTime(to, now + d);
    g.gain.setValueAtTime(.0001, now);
    g.gain.exponentialRampToValueAtTime(v, now + d * .4);
    g.gain.exponentialRampToValueAtTime(.0001, now + d);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(now);
}
// ---------- Tiny key press ----------
let lastKey = 0;
function keyClick(v = Math.random()) {
    const c = actx();
    if (!c || !on) return;
    const now = c.currentTime;
    if (now - lastKey < .035) return;              // avoids buzzing when you sweep fast
    lastKey = now;

    // 1) a very short, high "tick"
    const len = Math.floor(c.sampleRate * .012);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const src = c.createBufferSource();
    src.buffer = buf;
    const hp = c.createBiquadFilter(), bp = c.createBiquadFilter(), ng = c.createGain();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    bp.type = 'bandpass';
    bp.frequency.value = 3800 + v * 1500;
    bp.Q.value = 1.2;
    ng.gain.value = .3;
    src.connect(hp).connect(bp).connect(ng).connect(c.destination);
    src.start(now);

    // 2) a tiny little "pip" body (small and high, no bass)
    const o = c.createOscillator(), og = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1000 + v * 300, now);
    o.frequency.exponentialRampToValueAtTime(520, now + .012);
    og.gain.setValueAtTime(.0001, now);
    og.gain.exponentialRampToValueAtTime(.07, now + .002);
    og.gain.exponentialRampToValueAtTime(.0001, now + .02);
    o.connect(og).connect(c.destination);
    o.start(now);
    o.stop(now + .03);
}

// ---------- Light key touch (hover): barely there ----------
let lastTouch = 0;
function keyTouch() {
    const c = actx();
    if (!c || !on) return;
    const now = c.currentTime;
    if (now - lastTouch < .06) return;             // sweeping across pills won't buzz
    lastTouch = now;

    // a tiny, soft, high tick
    const len = Math.floor(c.sampleRate * .006);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = c.createBufferSource();
    src.buffer = buf;
    const hp = c.createBiquadFilter(), bp = c.createBiquadFilter(), g = c.createGain();
    hp.type = 'highpass';
    hp.frequency.value = 2600;
    bp.type = 'bandpass';
    bp.frequency.value = 4800 + Math.random() * 1200;
    bp.Q.value = 1;
    g.gain.value = .07;                              // about a quarter of the click's loudness
    src.connect(hp).connect(bp).connect(g).connect(c.destination);
    src.start(now);
}