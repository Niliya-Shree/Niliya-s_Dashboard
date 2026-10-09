/**
 * experience.js
 * Accordion toggles for the "Where I've worked" section.
 * Clicking an .xp-head toggles the open state on the parent .xp
 * and updates aria-expanded for accessibility.
 */

document.querySelectorAll('.xp-head').forEach(h => {
    h.addEventListener('click', () => {
        const open = h.closest('.xp').classList.toggle('open');
        h.setAttribute('aria-expanded', open);
    });
});
