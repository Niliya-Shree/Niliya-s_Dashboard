/**
 * pet.js
 * Full interactive pet system:
 *   - Mood bar (slowly decays, triggers sleep at 0)
 *   - Speech bubble
 *   - Actions: feed, play, walk
 *   - Sleeping → waking with bed/sheet animation
 *   - Pet profile (gender, color, accessories) persisted to localStorage
 *   - SVG pet renderer (petSVG / renderPet)
 *
 * Depends on sound functions from sound.js (loaded before this file).
 */

/* ── DOM references ── */
const pet     = document.getElementById('pet');
const petBody = document.getElementById('petBody');
const menu    = document.getElementById('menu');
const bub     = document.getElementById('bubble');
const moodBar = document.getElementById('mood');
const profile = document.getElementById('profile');

/* ── State ── */
let mood = 60, busy = false, bt;
let sleeping = false, bedAnim = false;

pet.style.left = '16px';

/* ── ZZZ element ── */
const zzz = document.createElement('div');
zzz.className = 'zzz';
zzz.setAttribute('aria-hidden', 'true');
zzz.innerHTML = '<span>z</span><span>Z</span><span>z</span>';
pet.appendChild(zzz);

/* ── Bed + sheet ── */
pet.insertAdjacentHTML('beforeend',
    '<div class="bed" aria-hidden="true"><i class="hb"></i><i class="mat"></i><i class="pil"></i></div>' +
    '<div class="sheet" aria-hidden="true"></div>');

/* ─────────────────────────── Helpers ─────────────────────────── */

function say(text, ms = 2200) {
    bub.textContent = text;
    bub.classList.add('show');
    clearTimeout(bt);
    bt = setTimeout(() => bub.classList.remove('show'), ms);
}

function setMood(d) {
    mood = Math.max(0, Math.min(100, mood + d));
    moodBar.style.width = mood + '%';
}

function finish() {
    busy = false;
    pet.classList.remove('busy');
}

/* ── Init ── */
setMood(0);
setTimeout(() => say('Hi! Click me'), 1200);

/* ─────────────────────────── Sleep / Wake ─────────────────────── */

function yawn() {
    pet.classList.add('yawn');
    yawnSound();   // from sound.js
    setTimeout(() => pet.classList.remove('yawn'), 1650);
}

function sleep() {
    sleeping = true;
    bedAnim = true;
    menu.hidden = true;
    profile.hidden = true;
    pet.classList.remove('open', 'leaving');
    petBody.setAttribute('aria-label', 'Your pet is going to bed');
    say('So sleepy… bedtime', 3000);

    pet.classList.add('bedon', 'walk');
    void pet.offsetWidth;
    pet.style.setProperty('--bl', '-12px');
    steps(3000);   // from sound.js

    setTimeout(() => {
        pet.classList.remove('walk');
        pet.classList.add('lying');
        thumpSound();   // from sound.js
    }, 3100);

    setTimeout(() => {
        pet.classList.add('tucked');
        tuckSound();    // from sound.js
    }, 4000);

    setTimeout(() => {
        say('Yaaawn…', 1800);
        yawn();
    }, 4900);

    setTimeout(() => {
        pet.classList.add('sleep');
        petBody.setAttribute('aria-label', 'Your pet is asleep. Click to wake it up');
        say('Zzz…', 3000);
        lullaby();      // from sound.js
        bedAnim = false;
    }, 6500);
}

function wake() {
    bedAnim = true;
    pet.classList.remove('sleep');
    setMood(20);
    say("I'm up!", 2000);
    boing();   // from sound.js

    setTimeout(() => {
        pet.classList.remove('tucked');
        untuckSound();  // from sound.js
    }, 700);

    setTimeout(() => {
        pet.classList.remove('lying');
        boing();
    }, 1700);

    setTimeout(() => {
        pet.classList.add('walk', 'leaving');
        pet.style.setProperty('--bl', '100vw');
        steps(3000);
        say('Off I go!', 2500);
    }, 2600);

    setTimeout(() => {
        pet.classList.remove('walk', 'leaving', 'bedon');
        petBody.setAttribute('aria-label', 'Your pet. Click for options');
        say('Good morning!');
        sleeping = false;
        bedAnim = false;
    }, 5700);
}

/* Mood decay */
setInterval(() => {
    if (busy || sleeping) return;
    setMood(-4);
    if (mood <= 0) sleep();
    else if (mood < 30) say("I'm bored… play with me?");
}, 8000);

/* ─────────────────────────── Menu / Profile ─────────────────────── */

petBody.addEventListener('click', () => {
    if (bedAnim) return;
    if (sleeping) { wake(); return; }
    const wasOpen = !menu.hidden || !profile.hidden;
    profile.hidden = true;
    menu.hidden = wasOpen;
    pet.classList.toggle('open', !menu.hidden);
});

document.addEventListener('click', e => {
    if (!pet.contains(e.target)) {
        menu.hidden = true;
        profile.hidden = true;
        pet.classList.remove('open');
    }
});

menu.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || busy) return;
    menu.hidden = true;
    if (b.dataset.act === 'profile') {
        profile.hidden = false;
        return;
    }
    pet.classList.remove('open');
    busy = true;
    pet.classList.add('busy');
    ({ feed, play, walk })[b.dataset.act]();
});

/* ─────────────────────────── Actions ─────────────────────────── */

function feed() {
    const f = document.createElement('div');
    f.className = 'food';
    f.textContent = ['🍖', '🍕', '🍩', '🍓'][Math.floor(Math.random() * 4)];
    pet.appendChild(f);
    say('Ooh, food!');
    setTimeout(() => {
        f.remove();
        pet.classList.add('eat');
        say('Nom nom nom!');
        nomSound();   // from sound.js
        setMood(25);
    }, 700);
    setTimeout(() => {
        pet.classList.remove('eat');
        say('Yum! Thanks!');
        finish();
    }, 1900);
}

function play() {
    const b = document.createElement('div');
    b.className = 'ball';
    b.textContent = '⚽';
    pet.appendChild(b);
    pet.classList.add('jump');
    say('Wheee!', 2600);
    [0, 600, 1200, 1800].forEach((t, i) => setTimeout(() => beep(i + 2), t));
    setMood(20);
    setTimeout(() => {
        b.remove();
        pet.classList.remove('jump');
        say('That was fun!');
        finish();
    }, 2500);
}

function walk() {
    const secs = 3.5;
    const far = innerWidth - pet.offsetWidth - 16;
    let k = 0;
    const stepInterval = setInterval(() => beep(k++ % 6), 400);
    pet.classList.add('walk');
    pet.style.transition = `left ${secs}s linear`;
    say('Walkies!');
    pet.style.left = far + 'px';
    setTimeout(() => {
        pet.classList.add('flip');
        pet.style.left = '16px';
    }, secs * 1000);
    setTimeout(() => {
        clearInterval(stepInterval);
        pet.classList.remove('walk', 'flip');
        pet.style.transition = 'none';
        setMood(20);
        say('Home again. Nice walk!');
        finish();
    }, secs * 2000 + 100);
}

/* ─────────────────────────── SVG Renderer ─────────────────────── */

const DEF = { girl: '#ffffff', boy: '#2b2540' };
let pf = { gender: 'girl', color: DEF.girl, acc: ['bow'] };

try {
    const saved = JSON.parse(localStorage.getItem('petProfile2'));
    if (saved && DEF[saved.gender] && Array.isArray(saved.acc)) pf = saved;
} catch { }

function petSVG() {
    const { gender, color, acc } = pf, girl = gender === 'girl', has = a => acc.includes(a);
    const k = '#1b1340', ear = '#ff9ec7', eyeCol = girl ? '#5ec8a0' : '#ffd23f';
    const paw = girl ? color : '#ffffff';
    let s = '<svg viewBox="0 0 120 120" width="110" height="110" aria-hidden="true">';

    // tail
    s += `<path d="M86 104 Q114 102 108 74 Q106 64 99 68" fill="none" stroke="${k}" stroke-width="15" stroke-linecap="round"/>
  <path d="M86 104 Q114 102 108 74 Q106 64 99 68" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>`;
    if (!girl) s += `<path d="M107 78 Q106 70 100 68" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`;

    // ears
    s += `<path d="M22 46 L27 8 L55 28Z" fill="${color}" stroke="${k}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M98 46 L93 8 L65 28Z" fill="${color}" stroke="${k}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M31 36 L32 18 L46 28Z" fill="${ear}"/><path d="M89 36 L88 18 L74 28Z" fill="${ear}"/>`;

    // body, chest and feet
    s += `<ellipse cx="60" cy="100" rx="28" ry="16" fill="${color}" stroke="${k}" stroke-width="4.5"/>`;
    if (!girl) s += `<ellipse cx="60" cy="104" rx="11" ry="9" fill="#fff"/>`;
    s += `<ellipse class="foot" cx="45" cy="110" rx="11" ry="6.5" fill="${paw}" stroke="${k}" stroke-width="4"/>
  <ellipse class="foot r" cx="75" cy="110" rx="11" ry="6.5" fill="${paw}" stroke="${k}" stroke-width="4"/>`;

    // head
    s += `<ellipse cx="60" cy="60" rx="40" ry="33" fill="${color}" stroke="${k}" stroke-width="5"/>`;
    if (!girl) {
        s += `<ellipse cx="72" cy="38" rx="8" ry="5" transform="rotate(-15 72 38)" fill="#fff"/>
    <circle cx="89" cy="66" r="5.5" fill="#fff"/>
    <ellipse cx="60" cy="76" rx="15" ry="11" fill="#fff"/>`;
    } else {
        s += `<ellipse cx="30" cy="72" rx="7" ry="4.5" fill="#ff9ec7" opacity=".7"/>
    <ellipse cx="90" cy="72" rx="7" ry="4.5" fill="#ff9ec7" opacity=".7"/>`;
    }

    // eyes
    const lash = (x, dir) => girl
        ? `<path d="M${x + dir * 8} 49 L${x + dir * 14} 44 M${x + dir * 9} 55 L${x + dir * 15} 54" stroke="${k}" stroke-width="2.5" stroke-linecap="round"/>`
        : '';
    s += `<g class="eye"><ellipse cx="44" cy="57" rx="9" ry="11" fill="${eyeCol}" stroke="${k}" stroke-width="3"/><ellipse cx="44" cy="58" rx="3" ry="8" fill="${k}"/><circle cx="41" cy="52" r="3" fill="#fff"/>${lash(44, -1)}</g>
  <g class="eye"><ellipse cx="76" cy="57" rx="9" ry="11" fill="${eyeCol}" stroke="${k}" stroke-width="3"/><ellipse cx="76" cy="58" rx="3" ry="8" fill="${k}"/><circle cx="73" cy="52" r="3" fill="#fff"/>${lash(76, 1)}</g>`;

    // nose, mouth, whiskers
    s += `<path d="M55.5 68 L64.5 68 L60 74Z" fill="#ff7aa8" stroke="${k}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M60 74 L60 77" stroke="${k}" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse class="mouth" cx="60" cy="80" rx="5" ry="3" fill="#d6336c"/>
  <path d="M46 74 L22 69 M46 78 L22 80 M74 74 L98 69 M74 78 L98 80" stroke="${k}" stroke-width="2.2" stroke-linecap="round"/>`;

    // accessories
    if (has('scarf'))   s += `<path d="M80 96 L90 96 L92 116 L82 114Z" fill="#7c4dff" stroke="${k}" stroke-width="3" stroke-linejoin="round"/><path d="M28 90 Q60 110 92 90 L91 101 Q60 121 29 101Z" fill="#7c4dff" stroke="${k}" stroke-width="3" stroke-linejoin="round"/>`;
    if (has('glasses')) s += `<g fill="#fff" fill-opacity=".35" stroke="${k}" stroke-width="3"><circle cx="44" cy="57" r="14"/><circle cx="76" cy="57" r="14"/><path d="M58 57h4"/></g>`;
    if (has('crown'))   s += `<path d="M49 34L49 20L55 27L60 15L65 27L71 20L71 34Z" fill="#ffb627" stroke="${k}" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="15" r="2.5" fill="#ff4fa3"/>`;
    if (has('bow'))     s += `<g transform="translate(90 34) rotate(15)"><path d="M0 0L-14-9L-14 9Z" fill="#ff4fa3" stroke="${k}" stroke-width="3" stroke-linejoin="round"/><path d="M0 0L14-9L14 9Z" fill="#ff4fa3" stroke="${k}" stroke-width="3" stroke-linejoin="round"/><circle r="4.5" fill="#ff2d87" stroke="${k}" stroke-width="2.5"/></g>`;

    return s + '</svg>';
}

function renderPet() {
    petBody.innerHTML = petSVG();
    profile.querySelectorAll('[data-g]').forEach(b =>
        b.setAttribute('aria-pressed', b.dataset.g === pf.gender));
    profile.querySelectorAll('[data-color]').forEach(b =>
        b.setAttribute('aria-pressed', b.dataset.color === pf.color));
    profile.querySelectorAll('[data-acc]').forEach(b =>
        b.setAttribute('aria-pressed', pf.acc.includes(b.dataset.acc)));
    try { localStorage.setItem('petProfile2', JSON.stringify(pf)); } catch { }
}

/* ─────────────────────────── Profile events ─────────────────────── */

profile.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'pfDone') {
        profile.hidden = true;
        pet.classList.remove('open');
        say('Love my new look!');
        return;
    }
    if (b.dataset.g) {
        if (pf.gender === b.dataset.g) return;
        pf.gender = b.dataset.g;
        pf.color = DEF[pf.gender];
    } else if (b.dataset.color) {
        pf.color = b.dataset.color;
    } else if (b.dataset.acc) {
        const a = b.dataset.acc;
        pf.acc = pf.acc.includes(a) ? pf.acc.filter(x => x !== a) : [...pf.acc, a];
    }
    renderPet();
    say('Ooh, new look!', 1500);
});

/* Initial render */
renderPet();
