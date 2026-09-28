/* ============================================================
   HERO: a real-time 3D rocket cruising through deep space.
   three.js comes from jsDelivr (see the importmap in index.html).
   Pauses off screen, renders one still frame for reduced motion,
   and leaves the CSS night sky in place if WebGL is unavailable.
   ============================================================ */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const cv = document.getElementById('heroGL');
const hero = cv && cv.closest('.hx');
const slot = hero && hero.querySelector('.hx-visual');
/* Shared GLSL: cheap 3D value noise + fbm */
const NOISE = `
float hsh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(hsh(i),hsh(i+vec3(1,0,0)),f.x),mix(hsh(i+vec3(0,1,0)),hsh(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hsh(i+vec3(0,0,1)),hsh(i+vec3(1,0,1)),f.x),mix(hsh(i+vec3(0,1,1)),hsh(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+17.1;a*=.5;}return s;}
`;

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas: cv, antialias: true, powerPreference: 'high-performance'});
  } catch (e) { return; }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 900px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 3000);
  cam.position.set(0, 0, 14);

  /* ---- Lighting: hard key from the sun, cool bounce from the planet ---- */
  const SUN = new THREE.Vector3(8, 5, 5).normalize();
  const SUN_P = new THREE.Vector3(7, 2.5, -9).normalize();   // planet is backlit: night side faces us, crescent on the limb
  const sun = new THREE.DirectionalLight(0xfff4ea, 3.2);
  sun.position.copy(SUN).multiplyScalar(50);
  scene.add(sun);
  const bounce = new THREE.DirectionalLight(0x3a62c8, 0.55);
  bounce.position.set(-4, -7, 3);
  scene.add(bounce);
  scene.add(new THREE.AmbientLight(0x0c1426, 0.6));

  /* ---- Deep space backdrop: nebula baked once into a cube map ---- */
  const nebScene = new THREE.Scene();
  nebScene.add(new THREE.Mesh(
    new THREE.SphereGeometry(100, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: `varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: NOISE + `
        varying vec3 vD;
        void main(){
          vec3 d=normalize(vD);
          float n=fbm(d*2.4+vec3(3.,1.,7.));
          float n2=fbm(d*5.5+11.3);
          float band=exp(-pow(dot(d,normalize(vec3(-.55,.8,.3)))*3.,2.));
          float glow=pow(max(dot(d,normalize(vec3(.75,.55,-.4))),0.),2.5);
          vec3 deep=vec3(.010,.022,.075), violet=vec3(.085,.035,.16), teal=vec3(.02,.10,.16);
          vec3 col=mix(deep,violet,smoothstep(.42,.78,n));
          col=mix(col,teal,smoothstep(.5,.82,n2)*.55);
          float dens=smoothstep(.28,.9,n)*(.25+band*.9+glow*.9);
          col*=dens*1.35;
          col*=1.-smoothstep(.52,.78,n2)*band*.65;
          col+=vec3(.012,.018,.04)*band;
          gl_FragColor=vec4(col,1.);
        }`
    })
  ));
  const cubeRT = new THREE.WebGLCubeRenderTarget(small ? 512 : 1024, {type: THREE.HalfFloatType});
  new THREE.CubeCamera(1, 1000, cubeRT).update(renderer, nebScene);
  scene.background = cubeRT.texture;

  /* ---- Stars: twinkling points, a few bright enough to bloom ---- */
  const NS = small ? 3200 : 7000;
  const sPos = new Float32Array(NS * 3), sCol = new Float32Array(NS * 3), sSz = new Float32Array(NS), sPh = new Float32Array(NS);
  const tint = [[.72, .82, 1.1], [1, 1, 1], [1, .97, .92], [.85, .9, 1.05], [1.1, .92, .8]];
  for (let i = 0; i < NS; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 600 + Math.random() * 900, q = Math.sqrt(1 - u * u);
    sPos.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r], i * 3);
    const bright = Math.pow(Math.random(), 10);
    const t = tint[(Math.random() * tint.length) | 0], k = 0.35 + Math.random() * 0.5 + bright * 3.2;
    sCol.set([t[0] * k, t[1] * k, t[2] * k], i * 3);
    sSz[i] = 1.1 + Math.random() * 1.1 + bright * 5;
    sPh[i] = Math.random();
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('aColor', new THREE.BufferAttribute(sCol, 3));
  sGeo.setAttribute('aSize', new THREE.BufferAttribute(sSz, 1));
  sGeo.setAttribute('aPhase', new THREE.BufferAttribute(sPh, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {uTime: {value: 0}, uPR: {value: renderer.getPixelRatio()}},
    vertexShader: `
      attribute vec3 aColor;attribute float aSize;attribute float aPhase;
      uniform float uTime,uPR;varying vec3 vC;
      void main(){
        vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        float tw=.72+.28*sin(uTime*(.5+aPhase*2.2)+aPhase*50.);
        vC=aColor*tw;gl_PointSize=aSize*uPR;
      }`,
    fragmentShader: `
      varying vec3 vC;
      void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a*=a;gl_FragColor=vec4(vC*a,a);}`
  });
  const stars = new THREE.Points(sGeo, starMat);
  scene.add(stars);

  /* ---- Planet below: dark world, lit limb, thin atmosphere ---- */
  const PR = 40;
  const planet = new THREE.Group();
  planet.position.set(-4, -51.5, -40);
  planet.rotation.set(.3, 0, -.2);
  scene.add(planet);
  const planetMat = new THREE.ShaderMaterial({
    uniforms: {uSun: {value: SUN_P}},
    vertexShader: `varying vec3 vN,vW,vL;void main(){vL=normalize(position);vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: NOISE + `
      uniform vec3 uSun;varying vec3 vN,vW,vL;
      void main(){
        vec3 N=normalize(vN),V=normalize(cameraPosition-vW);
        float ndl=dot(N,uSun),day=smoothstep(-.05,.5,ndl);
        float land=smoothstep(.5,.6,fbm(vL*3.2+5.));
        float cloud=smoothstep(.52,.78,fbm(vL*7.+vec3(0.,2.,9.)));
        vec3 surf=mix(vec3(.008,.025,.07),vec3(.045,.05,.04),land);
        surf=mix(surf,vec3(.5,.56,.66),cloud*.8);
        vec3 col=surf*day*1.4+surf*.04;
        float city=smoothstep(.965,.995,hsh(floor(vL*520.)))*land*(1.-smoothstep(-.3,.05,ndl));
        col+=vec3(1.,.72,.42)*city*.5;
        float fr=pow(1.-max(dot(N,V),0.),3.2);
        col+=vec3(.22,.5,1.25)*fr*(.03+1.4*smoothstep(-.25,.6,ndl));
        gl_FragColor=vec4(col,1.);
      }`
  });
  planet.add(new THREE.Mesh(new THREE.SphereGeometry(PR, 160, 120), planetMat));
  const atmoMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {uSun: {value: SUN_P}},
    vertexShader: `varying vec3 vNv,vN;void main(){vNv=normalize(normalMatrix*normal);vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      uniform vec3 uSun;varying vec3 vNv,vN;
      void main(){
        float k=clamp(abs(vNv.z)/.2,0.,1.);
        float lit=.04+1.5*smoothstep(-.3,.7,dot(normalize(vN),uSun));
        vec3 c=vec3(.25,.55,1.3)*pow(k,3.)*lit*.8;
        gl_FragColor=vec4(c,1.);
      }`
  });
  planet.add(new THREE.Mesh(new THREE.SphereGeometry(PR * 1.02, 160, 120), atmoMat));

  /* ---- The rocket ---- */
  const R = 0.32, Y0 = -2.36, Y1 = 3.0;
  const rocketRoot = new THREE.Group();   // placed and tilted to fit the layout slot
  const rocket = new THREE.Group();       // rolls slowly around its own axis
  rocketRoot.add(rocket);
  scene.add(rocketRoot);

  // Paint livery on a canvas and wrap it around the body
  const TW = 1024, TH = 2048;
  const tc = document.createElement('canvas'); tc.width = TW; tc.height = TH;
  const g = tc.getContext('2d');
  const row = y => (1 - (y - Y0) / (Y1 - Y0)) * TH;
  g.fillStyle = '#D9DAD7'; g.fillRect(0, 0, TW, TH);
  for (let i = 0; i < 900; i++) {           // faint paint streaks
    g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},${(Math.random() * .035).toFixed(3)})`;
    g.fillRect(Math.random() * TW, Math.random() * TH, 1 + Math.random() * 3, 20 + Math.random() * 260);
  }
  const band = (a, b, c) => { g.fillStyle = c; g.fillRect(0, row(b), TW, row(a) - row(b)); };
  band(Y0, -1.95, '#23262B');               // thrust section
  band(0.55, 0.86, '#1D2025');              // interstage
  for (let k = 0; k < 4; k++) {             // roll pattern on the fairing base
    g.fillStyle = '#16181C';
    const lo = k % 2 ? 1.02 : 1.28;
    g.fillRect(k * TW / 4, row(lo + .26), TW / 4, row(lo) - row(lo + .26));
  }
  g.fillStyle = 'rgba(0,0,0,.2)';           // panel seams
  for (let y = -1.6; y < 2.9; y += .42) g.fillRect(0, row(y), TW, 2);
  for (let k = 0; k < 8; k++) g.fillRect(k * TW / 8, 0, 2, TH);
  const soot = g.createLinearGradient(0, row(Y0), 0, row(-1.2));
  soot.addColorStop(0, 'rgba(18,16,14,.6)'); soot.addColorStop(1, 'rgba(18,16,14,0)');
  g.fillStyle = soot; g.fillRect(0, row(-1.2), TW, row(Y0) - row(-1.2));
  // wordmark running up the body; scale corrects the u and v texel ratio
  g.save();
  g.translate(TW * .62, row(-0.55));
  g.rotate(-Math.PI / 2);
  g.scale(1, (TW / (2 * Math.PI * R)) / (TH / (Y1 - Y0)));
  g.fillStyle = '#1A1C21';
  g.font = '700 118px Helvetica, Arial, sans-serif';
  g.textBaseline = 'middle';
  if ('letterSpacing' in g) g.letterSpacing = '14px';
  g.fillText('INFLOW', 0, 0);
  g.restore();
  const bodyTex = new THREE.CanvasTexture(tc);
  bodyTex.colorSpace = THREE.SRGBColorSpace;
  bodyTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const prof = [new THREE.Vector2(0, Y0), new THREE.Vector2(.2, Y0), new THREE.Vector2(.26, -2.3), new THREE.Vector2(.3, -2.2), new THREE.Vector2(R, -2.05)];
  for (let y = -1.9; y < 1.6; y += .25) prof.push(new THREE.Vector2(R, y));
  const L = 1.4, rho = (R * R + L * L) / (2 * R);
  for (let i = 0; i <= 30; i++) {           // tangent ogive nose
    const t = Math.min(i / 30, .992);
    prof.push(new THREE.Vector2(Math.max(Math.sqrt(rho * rho - (L * t) ** 2) + R - rho, 0), 1.6 + L * t));
  }
  prof.push(new THREE.Vector2(0, Y1));
  const bodyGeo = new THREE.LatheGeometry(prof, 128);
  const pos = bodyGeo.attributes.position, uv = bodyGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, (pos.getY(i) - Y0) / (Y1 - Y0));
  const paint = new THREE.MeshPhysicalMaterial({map: bodyTex, roughness: .46, metalness: .06, clearcoat: .35, clearcoatRoughness: .5});
  rocket.add(new THREE.Mesh(bodyGeo, paint));

  const graphite = new THREE.MeshStandardMaterial({color: 0x2a2d33, roughness: .5, metalness: .35});
  const finShape = new THREE.Shape();
  finShape.moveTo(0, -1.35); finShape.lineTo(.5, -2.02); finShape.lineTo(.53, -2.44); finShape.lineTo(0, -2.3); finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {depth: .04, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 2});
  finGeo.translate(0, 0, -.02);
  for (let k = 0; k < 4; k++) {
    const pivot = new THREE.Group(); pivot.rotation.y = k * Math.PI / 2 + Math.PI / 4;
    const fin = new THREE.Mesh(finGeo, graphite); fin.position.x = R - .02;
    pivot.add(fin); rocket.add(pivot);
  }
  const raceway = new THREE.Mesh(new THREE.BoxGeometry(.035, 3.3, .07), new THREE.MeshStandardMaterial({color: 0xc4c6c8, roughness: .55, metalness: .1}));
  raceway.position.set(R + .012, -.25, 0);
  rocket.add(raceway);

  const bell = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; bell.push(new THREE.Vector2(.11 + .16 * Math.pow(t, .65), Y0 - .5 * t)); }
  rocket.add(new THREE.Mesh(new THREE.LatheGeometry(bell, 64),
    new THREE.MeshStandardMaterial({color: 0x4a4440, roughness: .32, metalness: .9, side: THREE.DoubleSide})));
  const NOZ = Y0 - .5;

  /* ---- Exhaust plume: layered additive cones, white hot core fading to blue ---- */
  const plumeMats = [];
  const plume = (len, r0, r1, amp) => {
    const geo = new THREE.CylinderGeometry(r0, r1, len, 64, 1, true); geo.translate(0, -len / 2, 0);
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: {uTime: {value: 0}, uAmp: {value: amp}, uOn: {value: 1}},
      vertexShader: `varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: NOISE + `
        uniform float uTime,uAmp,uOn;varying vec2 vUv;varying vec3 vN,vV;
        void main(){
          float a=1.-vUv.y;
          float face=pow(abs(dot(normalize(vN),normalize(vV))),1.7);
          float fall=pow(1.-a,1.7)*smoothstep(0.,.04,a+.01);
          float n=vn(vec3(vUv.x*14.,a*7.-uTime*11.,uTime*2.));
          float flick=.88+.12*sin(uTime*41.+a*9.);
          vec3 col=mix(vec3(.18,.36,1.3),vec3(2.4,2.6,3.2),pow(1.-a,7.)*face);
          float i=face*fall*(.65+.35*n)*flick*uAmp*uOn;
          gl_FragColor=vec4(col*i,1.);
        }`
    });
    plumeMats.push(m);
    const mesh = new THREE.Mesh(geo, m); mesh.position.y = NOZ + .02; rocket.add(mesh);
  };
  plume(1.5, .2, .06, 2.8);     // white hot core, tapering
  plume(3.2, .24, .55, 1.5);
  plume(6.5, .26, 1.3, .62);

  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(190,215,255,.55)'); gr.addColorStop(1, 'rgba(120,160,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const nozGlow = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, color: 0xbad2ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
  nozGlow.position.y = NOZ - .08; nozGlow.scale.setScalar(1);
  rocket.add(nozGlow);
  const engLight = new THREE.PointLight(0x8fb4ff, 6, 6, 2);
  engLight.position.y = NOZ - .4;
  rocket.add(engLight);

  rocketRoot.rotation.set(.32, 0, -.64);   // nose up and to the right, tipped toward camera
  rocketRoot.updateMatrixWorld();
  const DIR = new THREE.Vector3(0, 1, 0).applyQuaternion(rocketRoot.quaternion).normalize();

  /* ---- Space dust streaming past: the sense of speed ---- */
  const ND = small ? 70 : 150;
  const E1 = new THREE.Vector3().crossVectors(DIR, new THREE.Vector3(0, 0, 1)).normalize();
  const E2 = new THREE.Vector3().crossVectors(DIR, E1).normalize();
  const dust = [];
  const dPos = new Float32Array(ND * 6), dCol = new Float32Array(ND * 6);
  const spawn = (p, any) => {
    p.a = any ? (Math.random() * 2 - 1) * 16 : 16;
    p.b = (Math.random() * 2 - 1) * 14; p.c = (Math.random() * 2 - 1) * 6 - 2;
    p.v = 5 + Math.random() * 12; p.k = (p.v / 17) * (.1 + Math.random() * .22);
  };
  for (let i = 0; i < ND; i++) { const p = {}; spawn(p, true); dust.push(p); }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  scene.add(new THREE.LineSegments(dGeo, new THREE.LineBasicMaterial({vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})));
  const V = new THREE.Vector3();
  function stepDust(dt) {
    for (let i = 0; i < ND; i++) {
      const p = dust[i];
      p.a -= p.v * dt; if (p.a < -16) spawn(p, false);
      V.copy(DIR).multiplyScalar(p.a).addScaledVector(E1, p.b).addScaledVector(E2, p.c);
      const len = p.v * .09;
      dPos[i * 6] = V.x; dPos[i * 6 + 1] = V.y; dPos[i * 6 + 2] = V.z;
      dPos[i * 6 + 3] = V.x + DIR.x * len; dPos[i * 6 + 4] = V.y + DIR.y * len; dPos[i * 6 + 5] = V.z + DIR.z * len;
      dCol[i * 6] = .75 * p.k; dCol[i * 6 + 1] = .85 * p.k; dCol[i * 6 + 2] = 1.1 * p.k;
    }
    dGeo.attributes.position.needsUpdate = true; dGeo.attributes.color.needsUpdate = true;
  }

  /* ---- Post: bloom, then a film pass (grain, vignette, slight fringing) ---- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), .7, .45, .85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const film = new ShaderPass({
    uniforms: {tDiffuse: {value: null}, uTime: {value: 0}, uRes: {value: new THREE.Vector2(1, 1)}},
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      uniform sampler2D tDiffuse;uniform float uTime;uniform vec2 uRes;varying vec2 vUv;
      void main(){
        vec2 c=vUv-.5;float e=dot(c,c);
        vec3 col=vec3(texture2D(tDiffuse,vUv+c*e*.012).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-c*e*.012).b);
        col*=mix(.5,1.,smoothstep(.98,.22,length(c*vec2(1.,1.2))));
        float gr=fract(sin(dot(floor(vUv*uRes)+fract(uTime*7.3)*93.1,vec2(12.9898,78.233)))*43758.5453);
        col+=(gr-.5)*.05;
        gl_FragColor=vec4(col,1.);
      }`
  });
  composer.addPass(film);

  /* ---- Layout: sit the rocket inside the .hx-visual slot ---- */
  const HALF_H = Math.tan(THREE.MathUtils.degToRad(15)) * 14;
  const base = new THREE.Vector3();
  let W = 0, H = 0, scale = 1;
  function layout() {
    const hr = hero.getBoundingClientRect(), sr = slot.getBoundingClientRect();
    W = hr.width; H = hr.height;
    renderer.setSize(W, H, false);
    composer.setSize(W, H);
    bloom.resolution.set(W / 2, H / 2);
    film.uniforms.uRes.value.set(W * renderer.getPixelRatio(), H * renderer.getPixelRatio());
    cam.aspect = W / H; cam.updateProjectionMatrix();
    const nx = ((sr.left + sr.width / 2 - hr.left) / W) * 2 - 1;
    const ny = -(((sr.top + sr.height / 2 - hr.top) / H) * 2 - 1);
    base.set(nx * HALF_H * cam.aspect, ny * HALF_H, 0);
    scale = (Math.min(sr.height, sr.width * 1.3) / H) * 2 * HALF_H * .9 / (Y1 - Y0);
    rocketRoot.scale.setScalar(scale);
  }

  /* ---- Loop ---- */
  let visible = true, last = performance.now(), t = 0, intro = reduce ? 1 : 0, mx = 0, my = 0, cx = 0, cy = 0;
  if (!small && !reduce) {
    addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, {passive: true});
  }
  function frame(dt) {
    t += dt;
    intro = Math.min(1, intro + dt / 2.6);
    const ease = 1 - Math.pow(1 - intro, 3);
    cx += (mx * .5 - cx) * .04; cy += (-my * .3 - cy) * .04;
    cam.position.set(cx + Math.sin(t * .07) * .2, cy + Math.cos(t * .05) * .12, 14);
    cam.lookAt(0, 0, 0);
    rocketRoot.position.copy(base).addScaledVector(DIR, -2.2 * (1 - ease) * scale);
    rocketRoot.position.x += Math.sin(t * 1.7) * .006 * scale;
    rocketRoot.position.y += Math.cos(t * 2.3) * .006 * scale;
    rocket.rotation.y = .9 + t * .1;
    rocket.rotation.z = Math.sin(t * .9) * .012;
    const on = .35 + .65 * ease;
    for (const m of plumeMats) { m.uniforms.uTime.value = t; m.uniforms.uOn.value = on; }
    nozGlow.scale.setScalar((.95 + Math.sin(t * 37) * .06) * on);
    engLight.intensity = (5 + Math.sin(t * 29) * .8) * on;
    stars.rotation.y = t * .004;
    starMat.uniforms.uTime.value = t;
    film.uniforms.uTime.value = t;
    stepDust(dt);
    composer.render();
  }
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (visible) frame(dt);
    requestAnimationFrame(loop);
  }

  layout();
  if (reduce) { t = 6; frame(0); }
  else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    requestAnimationFrame(now => { last = now; loop(now); });
  }
  hero.classList.add('gl-on');

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (Math.abs(hero.clientWidth - W) < 1 && Math.abs(hero.clientHeight - H) < 80) return;
      layout(); if (reduce) frame(0);
    }, 150);
  });
}

if (cv && hero && slot) init();
