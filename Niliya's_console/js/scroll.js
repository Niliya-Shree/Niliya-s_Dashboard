/**
 * scroll.js
 * - Marquee drift on scroll
 * - IntersectionObserver scroll-reveal for .rv elements
 */

/* ── Marquee parallax ── */
const marq = document.getElementById('m');
addEventListener('scroll', () => {
    marq.style.transform = `translateX(${-scrollY * .6}px)`;
}, { passive: true });

/* ── Scroll reveal ── */
const io = new IntersectionObserver(entries => {
    entries.forEach(x => {
        if (x.isIntersecting) {
            x.target.classList.add('in');
            io.unobserve(x.target);
        }
    });
}, { threshold: .15 });

document.querySelectorAll('.rv').forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 90 + 'ms';
    io.observe(el);
});

/* ── Brand tag click: scroll to top ── */
const brandTag = document.getElementById('brandTag');
if (brandTag) {
    brandTag.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

