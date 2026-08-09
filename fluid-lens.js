/* 3D fluid glass lens — procedural three.js (no GLB needed).
   Hover a glass surface to summon it at the cursor; click open space to pin; Esc to unpin.
   No-op when WebGL is unavailable, motion is reduced, or the pointer is coarse. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

(() => {
  const stage = document.getElementById('lens-stage');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const canWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch { return false; }
  })();
  if (!stage || reduceMotion || !finePointer || !canWebGL) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 14);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const lensMat = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 5,
    ior: 1.15,
    roughness: 0.04,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    dispersion: 0.15,
    attenuationColor: new THREE.Color(0.96, 0.99, 1.0),
    attenuationDistance: 7,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  let uTime = null;
  lensMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = { value: 0 };
    uTime = sh.uniforms.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float wf = sin(position.x * 4.0 + uTime * 1.6) * cos(position.y * 5.0 - uTime * 1.2) * 0.05
                 + sin(position.y * 9.0 + uTime * 2.2) * cos(position.x * 7.0 + uTime * 1.8) * 0.028;
        transformed.z += wf;
        transformed.x += wf * 0.35 * position.x;
        transformed.y += wf * 0.35 * position.y;`);
  };

  const lensPts = [];
  for (let i = 0; i <= 28; i++) {
    const t = (i / 28) * 2 - 1;
    const r = Math.sqrt(Math.max(0, 1 - t * t));
    lensPts.push(new THREE.Vector2(r, t * 0.55));
  }
  const lensGeo = new THREE.LatheGeometry(lensPts, 72);
  lensGeo.computeVertexNormals();
  const lens = new THREE.Mesh(lensGeo, lensMat);
  const group = new THREE.Group();
  group.add(lens);
  group.scale.setScalar(0.001);
  scene.add(group);

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const target = new THREE.Vector3(0, 0, 0);
  const cur = new THREE.Vector3(0, 0, 0);
  const toWorld = (sx, sy, out) => {
    pointer.set((sx / window.innerWidth) * 2 - 1, -(sy / window.innerHeight) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    ray.ray.intersectPlane(plane, out);
  };

  const surfaces = '.work-row, .stack-pill, .hero-chips span';
  let lastX = 0, lastY = 0, lastT = 0, vx = 0, vy = 0;
  let hoverActive = false, pinned = false, shown = false;

  document.addEventListener('pointermove', (e) => {
    hoverActive = !!e.target.closest(surfaces);
    if (hoverActive) {
      toWorld(e.clientX, e.clientY, target);
      if (!pinned) shown = true;
    }
    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0 && dt < 200) { vx = (e.clientX - lastX) / dt; vy = (e.clientY - lastY) / dt; }
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, .tab-link, [data-deck], [data-stack], [data-close]')) return;
    pinned = !pinned;
    if (pinned) { toWorld(e.clientX, e.clientY, target); shown = true; }
    else if (!hoverActive) shown = false;
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pinned) {
      pinned = false;
      if (!hoverActive) shown = false;
    }
  });

  const clock = new THREE.Clock();
  const ease = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

  const tick = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (uTime) uTime.value = t;

    cur.x = ease(cur.x, target.x, 8, dt);
    cur.y = ease(cur.y, target.y, 8, dt);
    group.position.set(cur.x, cur.y, Math.sin(t * 1.3) * 0.35);

    const targetS = shown ? 0.8 : 0.001;
    group.scale.setScalar(ease(group.scale.x, targetS, 10, dt));
    lensMat.opacity = ease(lensMat.opacity, shown ? 1 : 0, 8, dt);

    if (pinned) {
      group.rotation.y = Math.sin(t * 0.4) * 0.5;
      group.rotation.x = Math.cos(t * 0.3) * 0.2;
      lens.scale.set(1, 1, 1);
    } else if (shown) {
      group.rotation.x = THREE.MathUtils.clamp(vy * 0.0005, -0.3, 0.3);
      group.rotation.y = THREE.MathUtils.clamp(-vx * 0.0005, -0.3, 0.3) + Math.sin(t * 0.5) * 0.08;
      const squash = THREE.MathUtils.clamp(vy * 0.00035, -0.12, 0.12);
      lens.scale.set(1 - squash, 1 + squash, 1);
    } else {
      group.rotation.x = 0;
      group.rotation.y = 0;
      lens.scale.set(1, 1, 1);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
