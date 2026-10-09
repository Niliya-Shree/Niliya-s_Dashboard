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

/* ── Pit-pat footsteps ── */
let foot = 0;
function pitter() {
    foot++;
    const f = foot % 2 ? 760 : 960;
    tone({ f, f2: f * .6, d: .09, type: 'triangle', v: .09 });
    tone({ f: f * 1.5, f2: f * .9, t: .05, d: .06, v: .04 });
}
function steps(ms) {
    const id = setInterval(pitter, 175);
    setTimeout(() => clearInterval(id), ms);
}

/* ── One-off sound effects ── */
function thumpSound() {
    tone({ f: 170, f2: 60, d: .22, v: .2 });
}

function tuckSound() {
    swish({ from: 500, to: 1600, d: .55, v: .13 });
    tone({ f: 140, f2: 70, t: .5, d: .2, v: .18 });
    tone({ f: 1046, t: .62, d: .16, v: .05 });
    tone({ f: 1318, t: .74, d: .2, v: .05 });
}

function untuckSound() {
    swish({ from: 1600, to: 450, d: .5, v: .13 });
    tone({ f: 330, f2: 180, t: .45, d: .12, v: .08 });
}

function boing() {
    tone({ f: 420, f2: 900, d: .14, type: 'triangle', v: .1 });
}

function lullaby() {
    [784, 659, 523, 392].forEach((f, i) => tone({ f, t: i * .4, d: .7, v: .07 }));
}

function yawnSound() {
    const c = actx();
    if (!c || !on) return;
    const now = c.currentTime, d = 1.5;

    swish({ from: 700, to: 1500, d: .4, v: .035 });
    swish({ from: 1400, to: 700, d: .5, v: .03, t: .95 });

    const o = c.createOscillator(), o2 = c.createOscillator();
    const lp = c.createBiquadFilter(), g = c.createGain(), g2 = c.createGain();
    const lfo = c.createOscillator(), lg = c.createGain();
    const glide = p => {
        p.setValueAtTime(520, now);
        p.linearRampToValueAtTime(900, now + .55);
        p.linearRampToValueAtTime(840, now + .9);
        p.linearRampToValueAtTime(460, now + d);
    };
    o.type = 'triangle';
    o2.type = 'sine';
    glide(o.frequency);
    glide(o2.frequency);
    g2.gain.value = .3;
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    lp.Q.value = .7;
    g.gain.setValueAtTime(.0001, now);
    g.gain.setValueAtTime(.0001, now + .2);
    g.gain.exponentialRampToValueAtTime(.1, now + .5);
    g.gain.setValueAtTime(.1, now + .95);
    g.gain.exponentialRampToValueAtTime(.0001, now + d);
    lfo.frequency.value = 5.5;
    lg.gain.value = 7;
    lfo.connect(lg).connect(o.frequency);
    o.connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(g).connect(c.destination);
    [o, o2, lfo].forEach(n => { n.start(now); n.stop(now + d + .05); });

    tone({ f: 700, f2: 520, t: d - .12, d: .2, v: .045 });
}

/* ── Eating sounds ── */
function chompSound(t, hi) {
    swish({ from: 1500, to: 700, d: .07, v: .1, t });
    tone({ f: hi ? 560 : 480, f2: hi ? 300 : 240, t, d: .11, v: .13 });
    tone({ f: 1400, f2: 900, t: t + .01, d: .04, type: 'triangle', v: .03 });
}
function nomSound() {
    [0, .25, .5, .75, 1].forEach((t, i) => chompSound(t, i % 2));
    tone({ f: 520, f2: 760, t: 1.2, d: .18, type: 'triangle', v: .09 });
    tone({ f: 760, f2: 620, t: 1.36, d: .2, type: 'triangle', v: .08 });
}
