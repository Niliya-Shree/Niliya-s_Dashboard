/**
 * skills.js
 * Builds the "Tools I reach for" skills cloud.
 * Each tool is rendered as a pill button with a devicon SVG logo (or emoji fallback).
 */

const sk = document.getElementById('sk');
const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/';

const tools = [
    ['Python', 'python/python-original', '🐍'],
    ['JavaScript', 'javascript/javascript-original', '🟨'],
    ['React.js', 'react/react-original', '⚛️'],
    ['TypeScript', 'typescript/typescript-original', '🔷'],

    ['Node.js', 'nodejs/nodejs-original', '🟢'],

    ['Next.js', 'nextjs/nextjs-original', '▲'],
    ['Redux', 'redux/redux-original', '🔁'],
    ['LLM Evaluation', '', '🧪'],
    ['RAG', '', '📚'],

    ['Tailwind CSS', 'tailwindcss/tailwindcss-original', '🎨'],

    // ['Express', 'express/express-original', '🚂'],
    ['FastAPI', 'fastapi/fastapi-original', '⚡'],
    ['Linux', 'linux/linux-original', '🐧'],
    ['MySQL', 'mysql/mysql-original', '🐬'],
    ['REST APIs', '', '🔌'],

    ['MongoDB', 'mongodb/mongodb-original', '🍃'],
    ['Google Analytics', '', '📊'],
    ['Git', 'git/git-original', '🌿'],
    ['GitHub', 'github/github-original', '🐙'],
    ['GitHub Actions', 'githubactions/githubactions-original', '⚙️'],
    ['Vercel', 'vercel/vercel-original', '▲'],
    ['GCP', 'googlecloud/googlecloud-original', '☁️'],
    ['Hetzner VPS', '', '🖥️'],

    ['Cloudflare', 'cloudflare/cloudflare-original', '🛡️'],
];

tools.forEach(([name, icon, emoji], i) => {
    const b = document.createElement('button');
    b.className = 'skill';
    b.style.setProperty('--i', i);

    const ic = document.createElement('span');
    ic.className = 'ic';
    ic.setAttribute('aria-hidden', 'true');

    if (icon) {
        const img = document.createElement('img');
        img.src = DEVICON + icon + '.svg';
        img.alt = '';
        img.loading = 'lazy';
        img.onerror = () => { ic.textContent = emoji; img.remove(); };
        ic.appendChild(img);
    } else {
        ic.textContent = emoji;
    }

    b.append(ic, document.createTextNode(name));
    sk.appendChild(b);
});
