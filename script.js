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
  const revealTargets = document.querySelectorAll('.work-row, .stack-list, .contact-list');
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
}

// --- liquid tilt + cursor glow on glass cards ---
const finePointer = window.matchMedia('(pointer: fine)').matches;
if (!reduceMotion && finePointer && 'IntersectionObserver' in window) {
  document.querySelectorAll('.work-row').forEach((row) => {
    row.addEventListener('pointermove', (e) => {
      const r = row.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      row.style.transform = `translateY(-4px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg)`;
      row.style.setProperty('--mx', `${e.clientX - r.left}px`);
      row.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    row.addEventListener('pointerleave', () => {
      row.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
    });
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
  });
}

// --- keep the tab indicator in sync after layout/fonts settle ---
window.addEventListener('load', () => requestAnimationFrame(moveIndicator));
window.addEventListener('resize', debounce(moveIndicator, 150));

// --- floating back-to-top ---
const toTop = document.getElementById('toTop');
function updateToTop() {
  toTop.classList.toggle('show', window.scrollY > 600);
}
updateToTop();
window.addEventListener('scroll', debounce(updateToTop, 100), { passive: true });
toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});
