/**
 * main.js — entry point / load orchestrator
 *
 * Scripts are loaded in dependency order via <script> tags in index.html:
 *   1. sound.js      (defines beep, tone, swish, etc.)
 *   2. cursor.js     (uses beep)
 *   3. scroll.js     (no deps)
 *   4. hero.js       (uses beep)
 *   5. skills.js     (no deps beyond DOM)
 *   6. pet.js        (uses beep, tone, swish, steps, etc.)
 *   7. experience.js (no deps)
 *   8. main.js       (this file — nothing left to do)
 *
 * All logic has been split into dedicated modules.
 * Add cross-module wiring here if ever needed.
 */
// ---------- Theme toggle ----------
const themeBtn = document.getElementById('theme');
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}
let theme;
try { theme = localStorage.getItem('theme'); } catch (e) { }
if (theme !== 'light' && theme !== 'dark') {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
applyTheme(theme);
themeBtn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('theme', theme); } catch (e) { }
});