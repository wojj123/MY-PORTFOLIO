const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// --- highlight the active tab as sections scroll into view ---
const sections = document.querySelectorAll('.section');
const tabLinks = document.querySelectorAll('.tab-link');
const tabsEl = document.querySelector('.tabs');
const indicator = document.querySelector('.tab-indicator');
const workRows = document.querySelectorAll('.work-row');

// --- liquid spring-driven tab indicator (vertical rail on desktop, bar on mobile) ---
const ind = { x: 0, y: 0, w: 0, h: 0 };
let indRaf = null;
let indFirst = true;

function stepIndicator() {
  const active = tabsEl.querySelector('.tab-link.active');
  if (!active) { indRaf = null; return; }
  const tx = active.offsetLeft;
  const ty = active.offsetTop;
  const tw = active.offsetWidth;
  const th = active.offsetHeight;
  const k = reduceMotion || indFirst ? 1 : 0.22;
  indFirst = false;
  ind.x += (tx - ind.x) * k;
  ind.y += (ty - ind.y) * k;
  ind.w += (tw - ind.w) * k;
  ind.h += (th - ind.h) * k;
  const settled = Math.abs(tx - ind.x) < 0.05 && Math.abs(ty - ind.y) < 0.05 &&
    Math.abs(tw - ind.w) < 0.05 && Math.abs(th - ind.h) < 0.05;
  if (settled) { ind.x = tx; ind.y = ty; ind.w = tw; ind.h = th; }
  indicator.style.width = `${ind.w.toFixed(2)}px`;
  indicator.style.height = `${ind.h.toFixed(2)}px`;
  indicator.style.transform = `translate(${ind.x.toFixed(2)}px, ${ind.y.toFixed(2)}px)`;
  indRaf = settled ? null : requestAnimationFrame(stepIndicator);
}

function moveIndicator() {
  if (!tabsEl || !indicator || indRaf) return;
  stepIndicator();
}

tabLinks.forEach((link) => {
  link.addEventListener('click', () => {
    tabLinks.forEach((l) => l.classList.toggle('active', l === link));
    moveIndicator();
    if (tabsEl.scrollWidth > tabsEl.clientWidth) {
      link.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    }
  });
});

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tabLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
          moveIndicator();
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach((section) => navObserver.observe(section));

  // --- gentle reveal-on-scroll for content blocks ---
  const revealTargets = [...workRows, ...document.querySelectorAll('.stack-list, .contact-list')];
  revealTargets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--d', `${Math.min(i * 90, 360)}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));

  // drop the reveal transition once done so the cards' own spring hover transitions return
  revealTargets.forEach((el) => {
    el.addEventListener('transitionend', (ev) => {
      if (ev.propertyName === 'opacity') el.classList.remove('reveal');
    });
  });
}

// --- liquid tilt + cursor glow on glass cards ---
const finePointer = window.matchMedia('(pointer: fine)').matches;
if (!reduceMotion && finePointer && 'IntersectionObserver' in window) {
  workRows.forEach((row) => {
    row.addEventListener('pointermove', (e) => {
      const r = row.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      row.style.transform = `translateY(-4px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg)`;
      row.style.setProperty('--mx', `${e.clientX - r.left}px`);
      row.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
    row.addEventListener('pointerleave', () => {
      row.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
    }, { passive: true });
  });
}

// --- ambient orbs drift slightly with the pointer ---
const orbs = document.querySelector('.orbs');
if (orbs && !reduceMotion && finePointer) {
  let rx = 0, ry = 0, tx = 0, ty = 0, raf = null;
  window.addEventListener('pointermove', (e) => {
    rx = (e.clientX / window.innerWidth - 0.5) * 2;
    ry = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!raf) {
      raf = requestAnimationFrame(() => {
        tx += (rx * 26 - tx) * 0.06;
        ty += (ry * 22 - ty) * 0.06;
        orbs.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
        raf = null;
      });
    }
  }, { passive: true });
}

// --- keep the tab indicator in sync after layout/fonts settle ---
window.addEventListener('load', () => requestAnimationFrame(moveIndicator));
window.addEventListener('resize', debounce(moveIndicator, 150));

// --- floating back-to-top ---
const toTop = document.getElementById('toTop');
function updateToTop() {
  toTop.classList.toggle('show', window.scrollY > 600);
  if (!toTop.classList.contains('show')) toTop.style.transform = '';
}
updateToTop();
toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

// --- scrolling typewriter for the hero subtitle ---
const typedEl = document.getElementById('typed');
const typedPhrases = [
  'BSIT student passionate about technology.',
  'Frontend developer and Figma designer.',
  'Vibe coder who builds projects with AI.',
  'Interested in web development and computer hardware.',
  'Enjoys PC building and tech exploration.',
  'Works well in teams and independently.',
  'Always learning and improving new skills.',
  'Focused on creating clean and user-friendly designs.',
];
if (typedEl) {
  if (reduceMotion) {
    typedEl.textContent = typedPhrases[0];
  } else {
    let tp = 0, ci = 0, deleting = false;
    setTimeout(function typeLoop() {
      if (document.hidden) { setTimeout(typeLoop, 1000); return; }
      const phrase = typedPhrases[tp];
      if (deleting) {
        ci--;
        typedEl.textContent = phrase.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          tp = (tp + 1) % typedPhrases.length;
        }
        setTimeout(typeLoop, ci === 0 ? 500 : 38);
      } else {
        ci++;
        typedEl.textContent = phrase.slice(0, ci);
        deleting = ci === phrase.length;
        setTimeout(typeLoop, deleting ? 2100 : 75 + Math.random() * 45);
      }
    }, 1200);
  }
}

// --- wavy liquid name + star sparkles ---
const nameEl = document.querySelector('.name-grad');
if (nameEl && !reduceMotion) {
  const chars = [...nameEl.textContent];
  const starSpots = [3, 8, 14, 20, 26, 31];
  nameEl.classList.add('is-wavy');
  nameEl.textContent = '';
  chars.forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = ch === ' ' ? 'wavy-letter wavy-space' : 'wavy-letter';
    s.textContent = ch;
    s.style.setProperty('--i', i);
    if (ch !== ' ' && starSpots.includes(i)) {
      s.style.setProperty('--sc', "'✦'");
      s.style.setProperty('--sd', Math.round(300 + Math.random() * 2400));
    }
    nameEl.appendChild(s);
  });

  const h1 = nameEl.closest('h1');
  if (h1) {
    h1.style.position = 'relative';
    const sparkCount = 4;
    for (let n = 0; n < sparkCount; n++) {
      const star = document.createElement('span');
      star.className = 'h1-spark';
      star.textContent = '✦';
      star.style.left = `${(8 + Math.random() * 84).toFixed(1)}%`;
      star.style.top = `${(Math.random() * 110).toFixed(1)}%`;
      star.style.setProperty('--sd', Math.round(Math.random() * 5000));
      h1.appendChild(star);
    }
  }
}

// --- scroll progress (top bar + to-top ring) + back-to-top visibility ---
const scrollProgress = document.getElementById('scrollProgress');
let progRaf = null;
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (scrollProgress) scrollProgress.style.setProperty('--p', p);
  if (toTop) toTop.style.setProperty('--ring', p * 100);
}
function onScroll() {
  if (progRaf) return;
  progRaf = requestAnimationFrame(() => { updateProgress(); updateToTop(); progRaf = null; });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', debounce(onScroll, 150));
onScroll();

// --- cursor spotlight that glides across the page ---
const spotlight = document.getElementById('spotlight');
if (spotlight && finePointer && !reduceMotion) {
  let sx = window.innerWidth / 2, sy = window.innerHeight * 0.3, rX = sx, rY = sy, sRaf = null;
  window.addEventListener('pointermove', (e) => {
    rX = e.clientX;
    rY = e.clientY;
    if (!sRaf) {
      sRaf = requestAnimationFrame(() => {
        sx += (rX - sx) * 0.12;
        sy += (rY - sy) * 0.12;
        spotlight.style.setProperty('--sx', `${sx.toFixed(1)}px`);
        spotlight.style.setProperty('--sy', `${sy.toFixed(1)}px`);
        sRaf = null;
      });
    }
  }, { passive: true });
}

// --- presentation deck preview modal (Muay Type / TSRO) ---
const deckModal = document.getElementById('deckModal');
const deckFrame = document.getElementById('deckFrame');
const deckLoading = document.getElementById('deckLoading');
const deckFallback = document.getElementById('deckFallback');
const deckOpenBtn = document.getElementById('deckOpenBtn');
const deckFallbackBtn = document.getElementById('deckFallbackBtn');
const deckClose = document.getElementById('deckClose');
const deckTitleEl = document.getElementById('deckTitle');
let deckTimer = null;

function closeDeck() {
  deckModal.hidden = true;
  document.body.style.overflow = '';
  deckFrame.removeAttribute('src');
  clearTimeout(deckTimer);
}

document.querySelectorAll('[data-deck]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const deckUrl = btn.dataset.deck;
    deckOpenBtn.href = deckUrl;
    deckFallbackBtn.href = deckUrl;
    deckTitleEl.textContent = btn.dataset.deckTitle || 'Presentation preview';
    deckFrame.title = deckTitleEl.textContent;
    deckFallback.hidden = true;
    deckLoading.hidden = false;
    deckFrame.src = btn.dataset.deckEmbed;
    deckModal.hidden = false;
    document.body.style.overflow = 'hidden';
    deckClose.focus();
    clearTimeout(deckTimer);
    deckTimer = setTimeout(() => {
      deckLoading.hidden = true;
      deckFallback.hidden = false;
    }, 8000);
  });
});

deckFrame.addEventListener('load', () => {
  deckLoading.hidden = true;
  clearTimeout(deckTimer);
});

document.querySelectorAll('[data-deck-close]').forEach((el) => el.addEventListener('click', closeDeck));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !deckModal.hidden) closeDeck();
});

// --- tech stack preview modal ---
const stackModal = document.getElementById('stackModal');
const stackTitle = document.getElementById('stackTitle');
const stackPreview = document.getElementById('stackPreview');
const stackDesc = document.getElementById('stackDesc');
const stackLink = document.getElementById('stackLink');

const stackInfo = {
  c: {
    name: 'C',
    link: 'https://en.cppreference.com/w/c',
    desc: 'A low-level systems language I use for socket programming, memory handling, and OS-level work. It powers the networking layer of Muay Type.',
    svg: `<svg viewBox="0 0 220 130" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="14" width="192" height="102" rx="14" fill="rgba(7,25,30,0.7)" stroke="rgba(2,245,161,0.35)" stroke-width="2"/>
      <circle cx="36" cy="36" r="5" fill="#ff5f56"/><circle cx="56" cy="36" r="5" fill="#ffbd2e"/><circle cx="76" cy="36" r="5" fill="#27c93f"/>
      <text x="30" y="80" fill="#02F5A1" font-family="monospace" font-size="17">printf("Hello!");</text>
      <rect class="sv-cursor" x="190" y="68" width="9" height="16" fill="#02F5A1"/>
    </svg>`,
  },
  python: {
    name: 'Python',
    link: 'https://www.python.org',
    desc: 'My go-to for scripting, automation, and quick tooling — readable syntax and a huge ecosystem. Used in class projects and personal scripts.',
    svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
      <path class="sv-draw" d="M70 15 h50 q32 0 32 27 q0 27 -32 27 h-36 q-32 0 -32 27 q0 12 22 12 h28" fill="none" stroke="#4B8BBE" stroke-width="12" stroke-linecap="round"/>
      <path class="sv-draw d2" d="M130 15 h-10 q32 0 32 27 q0 27 -32 27 h-36 q-32 0 -32 27 q0 12 22 12 h28" fill="none" stroke="#FFD43B" stroke-width="5" stroke-linecap="round"/>
      <circle class="sv-eye" cx="140" cy="36" r="4" fill="#07191E"/>
    </svg>`,
  },
  flask: {
    name: 'Flask',
    link: 'https://flask.palletsprojects.com',
    desc: 'A minimal Python web framework — Flask and Flask-SQLAlchemy drive the TSRO Gas Station backend, with Supabase as the database.',
    svg: `<svg viewBox="0 0 140 170" xmlns="http://www.w3.org/2000/svg">
      <path class="sv-flask" d="M52 18 h36 v50 l32 58 q-3 18 -16 24 q-8 4 -34 4 q-26 0 -34 -4 q-13 -6 -16 -24 l32 -58 z" fill="rgba(2,245,161,0.12)" stroke="#02F5A1" stroke-width="4" stroke-linejoin="round"/>
      <line x1="70" y1="62" x2="70" y2="104" stroke="#02D690" stroke-width="3" stroke-linecap="round"/>
      <circle class="sv-bubble" cx="64" cy="122" r="4.5" fill="#02F5A1"/>
      <circle class="sv-bubble b2" cx="77" cy="134" r="3.5" fill="#02D690"/>
    </svg>`,
  },
  sql: {
    name: 'SQL',
    link: 'https://www.w3schools.com/sql',
    desc: 'Querying and structuring relational data — schema design, joins, and CRUD. I work with PostgreSQL through Supabase in my projects.',
    svg: `<svg viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="90" cy="30" rx="62" ry="17" fill="rgba(2,245,161,0.12)" stroke="#02F5A1" stroke-width="3"/>
      <path d="M28 30 v78 a62 17 0 0 0 124 0 V30" fill="rgba(2,245,161,0.06)" stroke="#02F5A1" stroke-width="3"/>
      <ellipse cx="90" cy="108" rx="62" ry="17" fill="rgba(2,245,161,0.12)" stroke="#02F5A1" stroke-width="3"/>
      <rect class="sv-row" x="42" y="56" width="96" height="10" rx="5" fill="#02F5A1"/>
      <rect class="sv-row r2" x="58" y="72" width="64" height="10" rx="5" fill="#02D690"/>
      <rect class="sv-row r3" x="50" y="88" width="80" height="10" rx="5" fill="#02C78B"/>
    </svg>`,
  },
  git: {
    name: 'Git',
    link: 'https://git-scm.com',
    desc: 'Version control for every project — branching, merging, and collaborating with teammates, including my Muay Type duo work.',
    svg: `<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <line class="sv-gitline" x1="30" y1="35" x2="92" y2="35" stroke="#02F5A1" stroke-width="3.5"/>
      <line class="sv-gitline l2" x1="92" y1="35" x2="92" y2="78" stroke="#02D690" stroke-width="3.5"/>
      <line class="sv-gitline l3" x1="92" y1="78" x2="152" y2="78" stroke="#02C78B" stroke-width="3.5"/>
      <circle class="sv-commit" cx="30" cy="35" r="7" fill="#02F5A1"/>
      <circle class="sv-commit c2" cx="92" cy="35" r="7" fill="#02F5A1"/>
      <circle class="sv-commit c3" cx="92" cy="78" r="7" fill="#02D690"/>
      <circle class="sv-commit c4" cx="152" cy="78" r="7" fill="#02C78B"/>
    </svg>`,
  },
  cpp: {
    name: 'C++',
    link: 'https://en.cppreference.com/w/cpp',
    desc: 'A performance-focused extension of C — object-oriented features with low-level control. A coursework staple.',
    svg: `<svg viewBox="0 0 210 120" xmlns="http://www.w3.org/2000/svg">
      <text x="58" y="84" fill="#02F5A1" font-family="monospace" font-size="66" font-weight="700" text-anchor="middle">C</text>
      <g class="sv-plus"><line x1="122" y1="44" x2="122" y2="76" stroke="#02D690" stroke-width="8" stroke-linecap="round"/><line x1="106" y1="60" x2="138" y2="60" stroke="#02D690" stroke-width="8" stroke-linecap="round"/></g>
      <g class="sv-plus p2"><line x1="158" y1="44" x2="158" y2="76" stroke="#02C78B" stroke-width="8" stroke-linecap="round"/><line x1="142" y1="60" x2="174" y2="60" stroke="#02C78B" stroke-width="8" stroke-linecap="round"/></g>
    </svg>`,
  },
  java: {
    name: 'Java',
    link: 'https://www.java.com',
    desc: 'A classic object-oriented language with a huge standard library — used across my programming coursework and CSDC subjects.',
    svg: `<svg viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg">
      <path d="M42 52 h66 v10 a33 27 0 0 1 -66 0 z M108 52 h12 a10 12 0 0 1 0 24 h-12" fill="rgba(2,245,161,0.10)" stroke="#02F5A1" stroke-width="3.5" stroke-linejoin="round"/>
      <path class="sv-steam" d="M62 40 q6 -8 1 -15 q-5 -7 1 -13" fill="none" stroke="#02D690" stroke-width="3" stroke-linecap="round"/>
      <path class="sv-steam s2" d="M84 44 q6 -8 1 -15 q-5 -7 1 -13" fill="none" stroke="#02C78B" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
};

function closeStack() {
  stackModal.hidden = true;
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-stack]').forEach((pill) => {
  pill.addEventListener('click', () => {
    const info = stackInfo[pill.dataset.stack];
    if (!info) return;
    stackTitle.textContent = info.name;
    stackDesc.textContent = info.desc;
    stackLink.href = info.link;
    stackPreview.innerHTML = info.svg;
    stackModal.hidden = false;
    document.body.style.overflow = 'hidden';
    stackModal.querySelector('.deck-close').focus();
  });
});

document.querySelectorAll('[data-stack-close]').forEach((el) => el.addEventListener('click', closeStack));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !stackModal.hidden) closeStack();
});

// --- magnetic back-to-top ---
if (finePointer && !reduceMotion) {
  toTop.addEventListener('pointermove', (e) => {
    if (!toTop.classList.contains('show')) return;
    const r = toTop.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * 0.3;
    const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
    toTop.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  }, { passive: true });
  toTop.addEventListener('pointerleave', () => {
    toTop.style.transform = '';
  }, { passive: true });
}
