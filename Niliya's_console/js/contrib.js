(() => {
    const USER = 'Niliya-Shree';
    const grid = document.getElementById('ghGrid');
    const sc = document.getElementById('ghScroll');
    const months = document.getElementById('ghMonths'), total = document.getElementById('ghTotal');
    const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function render(days, sum) {
        grid.textContent = '';
        months.textContent = '';
        const first = new Date(days[0].date + 'T00:00:00');
        const lead = first.getDay();                          // blank cells so weeks start on Sunday
        for (let i = 0; i < lead; i++) {
            const b = document.createElement('i');
            b.className = 'b';
            grid.appendChild(b);
        }
        days.forEach(d => {
            const c = document.createElement('i');
            c.className = 'l' + d.level;
            const dt = new Date(d.date + 'T00:00:00');
            const when = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            c.title = (d.count ? d.count + ' contribution' + (d.count > 1 ? 's' : '') : 'No contributions') + ' on ' + when;
            grid.appendChild(c);
        });
        const weeks = Math.ceil((lead + days.length) / 7);
        let lastM = -1;
        days.forEach((d, i) => {
            const dt = new Date(d.date + 'T00:00:00');
            const m = dt.getMonth(), w = Math.floor((lead + i) / 7);
            if (m !== lastM && (dt.getDate() <= 7 || i === 0) && w < weeks - 2) {
                const s = document.createElement('span');
                s.textContent = MN[m];
                s.style.left = (w / weeks * 100) + '%';
                months.appendChild(s);
                lastM = m;
            }
        });
        total.textContent = sum.toLocaleString() + ' contributions in the last year';
        if (sc) sc.scrollLeft = sc.scrollWidth;               // start at the most recent weeks
    }

    function empty(msg) {                                   // empty grid, no fake numbers
        grid.textContent = '';
        for (let i = 0; i < 7 * 53; i++) grid.appendChild(document.createElement('i'));
        total.textContent = msg;
    }

    empty('Loading…');
    fetch('https://github-contributions-api.jogruber.de/v4/' + USER + '?y=last')
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            const days = (data.contributions || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
            if (!days.length) throw new Error('no data');
            const sum = (data.total && (data.total.lastYear ?? Object.values(data.total)[0])) ||
                days.reduce((n, d) => n + d.count, 0);
            render(days, sum);
        })
        .catch(() => empty("Couldn't load contributions right now"));
    // drag to scroll
    if (sc) {
        let down = false, sx = 0, sl = 0;
        sc.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sl = sc.scrollLeft; sc.classList.add('drag'); });
        addEventListener('pointermove', e => { if (down) sc.scrollLeft = sl - (e.clientX - sx); });
        addEventListener('pointerup', () => { down = false; sc.classList.remove('drag'); });
    }
    addEventListener('resize', () => { if (sc) sc.scrollLeft = sc.scrollWidth; });
})();