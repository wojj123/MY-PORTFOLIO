// Accordion gallery — port of the React Bits "AccordionGallery" component.
// GSAP is loaded as a classic UMD script; if it's unavailable (e.g. offline),
// the gallery still works with instant layout updates.

(function () {
  const root = document.getElementById('accordionGallery');
  if (!root) return;

  const items = [
    { image: 'https://picsum.photos/id/1015/900/1200', label: 'C', link: 'https://en.cppreference.com/w/c', alt: 'C language' },
    { image: 'https://picsum.photos/id/1018/900/1200', label: 'Python', link: 'https://www.python.org', alt: 'Python' },
    { image: 'https://picsum.photos/id/1039/900/1200', label: 'Flask', link: 'https://flask.palletsprojects.com', alt: 'Flask' },
    { image: 'https://picsum.photos/id/1043/900/1200', label: 'SQL', link: 'https://www.w3schools.com/sql', alt: 'SQL' },
    { image: 'https://picsum.photos/id/1044/900/1200', label: 'Git', link: 'https://git-scm.com', alt: 'Git' },
    { image: 'https://picsum.photos/id/1036/900/1200', label: 'C++', link: 'https://en.cppreference.com/w/cpp', alt: 'C++' },
    { image: 'https://picsum.photos/id/1067/900/1200', label: 'Java', link: 'https://www.java.com', alt: 'Java' },
  ];

  const opts = {
    defaultIndex: 3,
    accentColor: '#1400FF',
    overlayColor: '#050507',
    textColor: '#ffffff',
    height: 380,
    gap: 10,
    radius: 16,
    expandRatio: 0.52,
    orientation: 'horizontal',
    duration: 0.6,
    ease: 'power3.out',
    parallax: 0.5,
    tilt: 8,
    stagger: 0.06,
    trigger: 'hover',
    showLabels: true,
    grayscale: true,
  };

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;

  const count = items.length;
  let active = Math.min(Math.max(opts.defaultIndex, 0), count - 1);
  let firstRun = true;
  let mediaSize = 320;
  let currentTl = null;

  const panels = [];
  const medias = [];
  const bars = [];
  const texts = [];

  root.style.setProperty('--ag-accent', opts.accentColor);
  root.style.setProperty('--ag-overlay', opts.overlayColor);
  root.style.setProperty('--ag-text', opts.textColor);
  root.style.setProperty('--ag-gap', `${opts.gap}px`);
  root.style.setProperty('--ag-radius', `${opts.radius}px`);
  root.style.height = `${opts.height}px`;
  root.setAttribute('role', 'list');
  root.setAttribute('aria-label', 'Tech stack gallery');

  items.forEach((item, i) => {
    const Tag = item.link ? 'a' : 'div';
    const panel = document.createElement(Tag);
    panel.className = 'ag-panel';
    panel.style.borderRadius = `${opts.radius}px`;
    if (item.link) {
      panel.href = item.link;
      panel.target = '_blank';
      panel.rel = 'noopener';
    }
    panel.setAttribute('role', 'listitem');
    panel.setAttribute('tabindex', '0');
    panel.setAttribute('aria-label', item.label);

    const frame = document.createElement('span');
    frame.className = 'ag-panel__frame';
    const media = document.createElement('span');
    media.className = 'ag-panel__media';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.alt || item.label || '';
    img.draggable = false;
    media.appendChild(img);
    const overlay = document.createElement('span');
    overlay.className = 'ag-panel__overlay';
    overlay.setAttribute('aria-hidden', 'true');
    frame.appendChild(media);
    frame.appendChild(overlay);
    panel.appendChild(frame);

    if (opts.showLabels) {
      const label = document.createElement('span');
      label.className = 'ag-panel__label';
      label.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('span');
      bar.className = 'ag-panel__bar';
      const text = document.createElement('span');
      text.className = 'ag-panel__text';
      text.textContent = item.label;
      label.appendChild(bar);
      label.appendChild(text);
      panel.appendChild(label);
      bars[i] = bar;
      texts[i] = text;
    }

    const onEnter = () => {
      if (opts.trigger === 'hover') setActive(i);
    };
    const onClick = (e) => {
      if (i !== active) {
        e.preventDefault();
        setActive(i);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i + 1) % count);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i - 1 + count) % count);
      }
    };

    panel.addEventListener('mouseenter', onEnter);
    panel.addEventListener('click', onClick);
    panel.addEventListener('focus', () => setActive(i));
    panel.addEventListener('keydown', onKeyDown);

    root.appendChild(panel);
    panels[i] = panel;
    medias[i] = media;
  });

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const applyLayout = (animate) => {
    if (currentTl) {
      currentTl.kill();
      currentTl = null;
    }
    const r = clamp(opts.expandRatio, 0.2, 0.9);
    const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
    const dur = animate && !prefersReduced ? opts.duration : 0;

    if (!gsap) {
      panels.forEach((panel, i) => {
        const isActive = i === active;
        const rot = isActive ? 0 : i < active ? opts.tilt : -opts.tilt;
        panel.style.flexGrow = isActive ? grow : 1;
        panel.style.transform = `rotateY(${-rot}deg)`;
        const media = medias[i];
        if (media) {
          const drift = clamp(active - i, -1.5, 1.5);
          const shift = drift * opts.parallax * mediaSize * 0.06;
          media.style.transform = `translate(-50%, -50%) translateX(${isActive ? 0 : shift}px)`;
          media.style.filter = opts.grayscale ? `grayscale(${isActive ? 0 : 1})` : 'none';
          media.style.setProperty('--ag-dim', isActive ? 0 : 0.35);
        }
        const bar = bars[i];
        const text = texts[i];
        if (bar && text) {
          bar.style.opacity = isActive ? 1 : 0;
          text.style.opacity = isActive ? 1 : 0;
          text.style.transform = isActive ? 'none' : 'translateX(-14px)';
        }
        panel.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
      return;
    }

    const tl = gsap.timeline();
    panels.forEach((panel, i) => {
      const isActive = i === active;
      const rot = isActive ? 0 : i < active ? opts.tilt : -opts.tilt;
      const media = medias[i];
      const bar = bars[i];
      const text = texts[i];

      tl.to(panel, { flexGrow: isActive ? grow : 1, rotateY: -rot, duration: dur, ease: opts.ease }, 0);

      if (media) {
        const drift = clamp(active - i, -1.5, 1.5);
        const shift = drift * opts.parallax * mediaSize * 0.06;
        const gray = opts.grayscale ? (isActive ? 0 : 1) : 0;
        tl.to(
          media,
          {
            xPercent: -50,
            yPercent: -50,
            x: isActive ? 0 : shift,
            '--ag-gray': gray,
            '--ag-dim': isActive ? 0 : 0.35,
            duration: dur,
            ease: opts.ease,
          },
          0
        );
      }

      if (opts.showLabels && bar && text) {
        if (isActive) {
          tl.to(
            [bar, text],
            { opacity: 1, x: 0, duration: dur, ease: opts.ease, stagger: prefersReduced ? 0 : opts.stagger },
            0
          );
        } else {
          tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease: opts.ease }, 0);
        }
      }

      panel.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    currentTl = tl;
  };

  const measure = () => {
    const rect = root.getBoundingClientRect();
    const total = rect.width;
    const usable = Math.max(total - opts.gap * (count - 1), 120);
    mediaSize = Math.max(140, usable * clamp(opts.expandRatio, 0.2, 0.9) * 1.22);
    root.style.setProperty('--ag-media-size', `${mediaSize}px`);
    applyLayout(!firstRun);
  };

  const ro = new ResizeObserver(measure);
  ro.observe(root);
  measure();
  firstRun = false;

  function setActive(i) {
    if (i === active) return;
    active = i;
    applyLayout(true);
  }
})();
