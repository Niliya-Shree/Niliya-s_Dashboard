// Toolkit placement:
//   zoom 100% or more (and screen big enough) -> under Experience, in column 1
//   zoomed out below 100%, or small screens   -> under Contributions
(() => {
    const tools = document.querySelector('.tools');
    const duo = document.querySelector('.duo');
    const contrib = document.getElementById('contrib');
    if (!tools || !duo || !contrib) return;

    // Optional manual override: put your window's innerWidth at 100% zoom here (e.g. 1536).
    // Leave at 0 to detect the zoom level automatically.
    const WIDTH_AT_100 = 0;

    const big = matchMedia('(min-width:1100px) and (min-height:600px)');

    function zoomIs100OrMore() {
        if (WIDTH_AT_100) return innerWidth <= WIDTH_AT_100 + 4;
        return outerWidth / innerWidth >= 0.97;          // zooming out makes this ratio drop below 1
    }

    function place() {
        const beside = big.matches && zoomIs100OrMore();
        if (beside) {
            if (tools.parentElement !== duo) duo.appendChild(tools);
            tools.classList.remove('out');
            duo.classList.remove('solo');
        } else {
            if (contrib.nextElementSibling !== tools) contrib.after(tools);
            tools.classList.add('out');
            duo.classList.add('solo');
        }
    }

    place();
    addEventListener('resize', place);                 // browser zoom also triggers resize
})();