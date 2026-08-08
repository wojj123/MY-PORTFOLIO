// --- editor gutter: line numbers down the left margin ---
function buildGutter() {
  const gutter = document.getElementById('gutter');
  if (!gutter) return;

  const lineHeight = 24;
  const count = Math.ceil(document.body.scrollHeight / lineHeight);

  const numbers = [];
  for (let i = 1; i <= count; i++) {
    numbers.push(`<span>${String(i).padStart(3, '0')}</span>`);
  }
  gutter.innerHTML = numbers.join('');
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

window.addEventListener('load', buildGutter);
window.addEventListener('resize', debounce(buildGutter, 200));

// --- highlight the active tab as sections scroll into view ---
const sections = document.querySelectorAll('.section');
const tabLinks = document.querySelectorAll('.tab-link');

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tabLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach((section) => navObserver.observe(section));

  // --- gentle reveal-on-scroll for content blocks ---
  const revealTargets = document.querySelectorAll(
    '.work-row, .lede, .stack-list, .contact-list'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

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
