import * as THREE from "three";
import { clamp, linearColor, RECORD_TRACKS, type RoomProjectSpec, WISCONSIN_W_LAYERS } from "./roomData";
import {
  createBrickTexture,
  createFabricTexture,
  createFuzzTexture,
  createHaloTexture,
  createKeyTexture,
  createNeonTexture,
  createOakFloorTexture,
  createRecordTexture,
  createRugTextures,
  createSynthBandTexture,
  createThrowTexture,
} from "./textures";

export type CanvasMeshEntry = {
  group: THREE.Group;
  face: THREE.Mesh;
  light: THREE.Texture;
  dark: THREE.Texture | null;
  w: number;
  h: number;
  halo: THREE.Mesh;
  strip: THREE.Mesh;
};

export type RoomSceneRefs = {
  SCR: { w: number; h: number };
  screen: THREE.Mesh;
  screenMat: THREE.MeshBasicMaterial;
  PHONE_SCR: { w: number; h: number };
  phoneScreen: THREE.Mesh;
  phoneScreenMat: THREE.MeshBasicMaterial;
  windowHit: THREE.Mesh;
  skyMat: THREE.MeshBasicMaterial;
  moon: THREE.Mesh;
  neonSign: THREE.Mesh;
  neonMat: THREE.MeshStandardMaterial;
  neonLight: THREE.PointLight;
  rackHit: THREE.Mesh;
  keysMat: THREE.MeshStandardMaterial;
  guitarHit: THREE.Mesh;
  guitar: THREE.Group;
  poster: THREE.Group;
  pst: THREE.Mesh;
  printsHit: THREE.Mesh;
  printsAnchor: THREE.Object3D;
  deckHit: THREE.Mesh;
  crateHit: THREE.Mesh;
  record: THREE.Group;
  setRecordTrack: (index: number) => void;
  arm: THREE.Group;
  rotor: THREE.Group;
  bowlMat: THREE.MeshStandardMaterial;
  fanLight: THREE.PointLight;
  lampLight: THREE.PointLight;
  lampSpot: THREE.SpotLight;
  shadeMat: THREE.MeshStandardMaterial;
  bulbMat: THREE.MeshBasicMaterial;
  shadeInnerMat: THREE.MeshBasicMaterial;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  screenGlow: THREE.PointLight;
  canvasMeshes: Record<string, CanvasMeshEntry>;
  updateNeonTexture: (fontFamily?: string) => void;
};

export function buildRoomScene(
  scene: THREE.Scene,
  roomProjects: RoomProjectSpec[],
  onAssetLoad: () => void,
  onAssetProgress?: (loaded: number, total: number) => void,
): RoomSceneRefs {
  function mat(color: number, opts?: THREE.MeshStandardMaterialParameters) {
    return new THREE.MeshStandardMaterial({
      color: linearColor(color),
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
      ...opts,
    });
  }

  function box(
    w: number,
    h: number,
    d: number,
    m: THREE.Material | THREE.Material[],
    x = 0,
    y = 0,
    z = 0,
    parent: THREE.Object3D = scene,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cyl(
    rt: number,
    rb: number,
    h: number,
    seg: number,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    parent: THREE.Object3D = scene,
  ) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /* Shell */
  const brickTex = createBrickTexture();
  const floorTex = createOakFloorTexture();
  const M = {
    brick: mat(0xffffff, { map: brickTex, flatShading: false }),
    plaster: mat(0xe9e6df),
    floor: mat(0xffffff, { map: floorTex, flatShading: false }),
    ceiling: mat(0xf2f0eb),
    black: mat(0x1f1f22, { roughness: 0.6 }),
    steel: mat(0x2b2b2e, { roughness: 0.5, metalness: 0.4 }),
    white: mat(0xf4f4f1),
    wood: mat(0x7a4f2a),
    silver: mat(0xcfccc5, { roughness: 0.4, metalness: 0.5 }),
    cone: mat(0xf2f1ec, { roughness: 0.5 }),
    frame: mat(0x1d1d1f),
    canvasEdge: mat(0xfbfbf9),
  };

  // The room is a cutaway with no front wall, and the camera stands just outside it (z 4.1 to
  // 4.9). Floor, ceiling and side walls run on to z = 6, behind the camera, so turning on a phone
  // never looks past their edges into the void. The floor repeat grows with it to keep plank size.
  const SHELL_FRONT = 6;
  const shellDepth = SHELL_FRONT + 3;
  const shellMidZ = (SHELL_FRONT - 3) / 2;
  floorTex.repeat.set(3, (3 * shellDepth) / 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, shellDepth), M.floor);
  floor.position.z = shellMidZ;
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, shellDepth), M.ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 3.3, shellMidZ);
  scene.add(ceil);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.3), M.brick);
  back.position.set(0, 1.65, -3);
  back.receiveShadow = true;
  scene.add(back);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(shellDepth, 3.3), M.plaster);
  right.rotation.y = -Math.PI / 2;
  right.position.set(4, 1.65, shellMidZ);
  right.receiveShadow = true;
  scene.add(right);

  /* Left wall with window opening built from four panels */
  const WIN = { z0: -2.45, z1: -0.75, y0: 0.95, y1: 2.45 };
  function leftPanel(z0: number, z1: number, y0: number, y1: number) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), M.plaster);
    p.rotation.y = Math.PI / 2;
    p.position.set(-4, (y0 + y1) / 2, (z0 + z1) / 2);
    p.receiveShadow = true;
    p.castShadow = true;
    scene.add(p);
  }
  leftPanel(-3, WIN.z0, 0, 3.3);
  leftPanel(WIN.z1, SHELL_FRONT, 0, 3.3);
  leftPanel(WIN.z0, WIN.z1, 0, WIN.y0);
  leftPanel(WIN.z0, WIN.z1, WIN.y1, 3.3);
  box(8, 0.12, 0.03, M.white, 0, 0.06, -2.985);

  /* Window frame, mullions, sill, sky and moon */
  const winW = WIN.z1 - WIN.z0;
  const winH = WIN.y1 - WIN.y0;
  const wz = (WIN.z0 + WIN.z1) / 2;
  const wy = (WIN.y0 + WIN.y1) / 2;
  const windowGroup = new THREE.Group();
  scene.add(windowGroup);
  const frameBars: [number, number, number, number, number, number][] = [
    [0.06, winH + 0.12, 0.06, -4, wy, WIN.z0 - 0.03],
    [0.06, winH + 0.12, 0.06, -4, wy, WIN.z1 + 0.03],
    [0.06, 0.06, winW + 0.12, -4, WIN.y1 + 0.03, wz],
    [0.06, 0.06, winW + 0.12, -4, WIN.y0 - 0.03, wz],
    [0.04, winH, 0.035, -4, wy, wz],
    [0.04, 0.035, winW, -4, WIN.y0 + winH / 3, wz],
    [0.04, 0.035, winW, -4, WIN.y0 + (2 * winH) / 3, wz],
  ];
  frameBars.forEach((b) => box(b[0], b[1], b[2], M.steel, b[3], b[4], b[5], windowGroup));
  box(0.18, 0.05, winW + 0.2, M.steel, -3.92, WIN.y0 - 0.06, wz, windowGroup);

  const skyMat = new THREE.MeshBasicMaterial({ color: linearColor(0x9fd0ff) });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(winW + 0.4, winH + 0.4), skyMat);
  sky.rotation.y = Math.PI / 2;
  sky.position.set(-4.35, wy, wz);
  scene.add(sky);

  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(0.07, 20),
    new THREE.MeshBasicMaterial({ color: linearColor(0xf1eedd) }),
  );
  moon.rotation.y = Math.PI / 2;
  moon.position.set(-4.3, WIN.y1 - 0.3, WIN.z1 - 0.35);
  scene.add(moon);

  const windowHit = new THREE.Mesh(
    new THREE.PlaneGeometry(winW, winH),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  windowHit.rotation.y = Math.PI / 2;
  windowHit.position.set(-3.97, wy, wz);
  windowGroup.add(windowHit);

  /* L-shaped desk */
  const desk = new THREE.Group();
  scene.add(desk);
  const topY = 0.74;
  box(2.75, 0.045, 0.72, M.white, -3.96 + 2.75 / 2, topY, -2.62, desk);
  box(0.72, 0.045, 1.5, M.white, -3.6, topY, -2.26 + 0.75, desk);
  [
    [-3.9, -2.95],
    [-1.28, -2.95],
    [-1.28, -2.32],
    [-3.9, -0.8],
    [-3.3, -0.8],
  ].forEach((p) => {
    box(0.045, topY - 0.02, 0.045, M.black, p[0], (topY - 0.02) / 2, p[1], desk);
  });
  box(2.6, 0.03, 0.03, M.black, -2.6, 0.12, -2.95, desk);

  /* iMac-style all-in-one */
  const imac = new THREE.Group();
  imac.position.set(-2.5, topY + 0.02, -2.7);
  imac.rotation.y = 0.1;
  desk.add(imac);
  const SCR = { w: 1.12, h: 0.63 };
  const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  box(SCR.w + 0.04, SCR.h + 0.04, 0.03, M.frame, 0, 0.5, 0, imac);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCR.w, SCR.h), screenMat);
  screen.position.set(0, 0.5, 0.0155);
  imac.add(screen);
  box(SCR.w + 0.04, 0.11, 0.03, M.silver, 0, 0.5 - SCR.h / 2 - 0.075, 0, imac);
  const standArm = box(0.2, 0.32, 0.02, M.silver, 0, 0.13, -0.07, imac);
  standArm.rotation.x = -0.25;
  box(0.24, 0.012, 0.2, M.silver, 0, 0.006, -0.06, imac);
  box(0.42, 0.012, 0.13, M.white, 0, 0.006, 0.28, imac);

  /* Phone on a desk stand, right of the iMac. On phones it is the hero screen (the mobile hero
     rides onto it), so its screen keeps the 390:844 shape of a real phone. About twice real
     size, like the iMac, so it still reads from the wide shot. */
  const PHONE_SCR = { w: 0.3 * (390 / 844), h: 0.3 };
  const phoneScreenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const phoneStand = new THREE.Group();
  phoneStand.position.set(-1.8, topY + 0.02, -2.42);
  phoneStand.rotation.y = 0.28;
  desk.add(phoneStand);
  box(0.13, 0.012, 0.11, M.silver, 0, 0.006, 0, phoneStand);
  const brace = box(0.08, 0.2, 0.012, M.silver, 0, 0.1, -0.03, phoneStand);
  brace.rotation.x = -0.32;
  box(0.17, 0.02, 0.03, M.silver, 0, 0.022, 0.03, phoneStand);
  const phone = new THREE.Group();
  phone.position.set(0, 0.03 + (PHONE_SCR.h + 0.02) / 2, 0.022);
  phone.rotation.x = -0.18;
  phoneStand.add(phone);
  box(PHONE_SCR.w + 0.016, PHONE_SCR.h + 0.02, 0.012, M.frame, 0, 0, 0, phone);
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(PHONE_SCR.w, PHONE_SCR.h), phoneScreenMat);
  phoneScreen.position.set(0, 0, 0.0065);
  phone.add(phoneScreen);

  /* Nearfield studio monitors */
  function nearfield(x: number, z: number, rot: number) {
    const g = new THREE.Group();
    g.position.set(x, topY + 0.02, z);
    g.rotation.y = rot;
    g.scale.setScalar(1.5);
    desk.add(g);
    box(0.19, 0.29, 0.23, M.black, 0, 0.145, 0, g);
    const woof = cyl(0.068, 0.068, 0.02, 14, M.cone, 0, 0.1, 0.117, g);
    woof.rotation.x = Math.PI / 2;
    const cap = cyl(0.022, 0.022, 0.024, 10, M.black, 0, 0.1, 0.12, g);
    cap.rotation.x = Math.PI / 2;
    const tw = cyl(0.022, 0.022, 0.016, 10, M.steel, 0, 0.225, 0.118, g);
    tw.rotation.x = Math.PI / 2;
    return g;
  }
  nearfield(-3.5, -2.66, 0.28);
  nearfield(-1.5, -2.66, -0.18);

  /* Neon sign */
  const neonMat = new THREE.MeshStandardMaterial({
    color: linearColor(0x8f8a83),
    transparent: true,
    emissive: new THREE.Color(0x000000),
    roughness: 0.6,
  });
  const neon = new THREE.Group();
  neon.position.set(-2.45, 2.5, -2.96);
  neon.scale.setScalar(1.25);
  scene.add(neon);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.95, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.2 }),
  );
  neon.add(plate);
  const neonSign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.58), neonMat);
  neonSign.position.z = 0.012;
  neon.add(neonSign);
  [-0.7, 0.7].forEach((x) => {
    box(0.006, 0.5, 0.006, M.steel, x, 0.55, 0.01, neon);
  });
  const neonLight = new THREE.PointLight(linearColor(0xff3b1f), 0, 4.5, 2);
  neonLight.position.set(-2.45, 2.45, -2.4);
  scene.add(neonLight);

  function updateNeonTexture(fontFamily?: string) {
    const tex = createNeonTexture(fontFamily);
    if (neonMat.map) neonMat.map.dispose();
    neonMat.map = tex;
    neonMat.emissiveMap = tex;
    neonMat.needsUpdate = true;
  }

  /* Poster (Young Thug – Jeffery) */
  const manager = new THREE.LoadingManager(
    () => onAssetProgress?.(1, 1),
    (_url, loaded, total) => onAssetProgress?.(loaded, total),
    () => onAssetProgress?.(1, 1),
  );
  const loader = new THREE.TextureLoader(manager);
  const posterTex = loader.load("/room/jeffery.jpg", onAssetLoad);
  posterTex.colorSpace = THREE.SRGBColorSpace;
  posterTex.anisotropy = 4;
  const poster = new THREE.Group();
  poster.position.set(-0.78, 1.72, -2.975);
  poster.rotation.z = 0.06;
  scene.add(poster);
  box(0.78, 0.78, 0.025, M.frame, 0, 0, 0, poster);
  const pst = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.6 }),
  );
  pst.position.z = 0.014;
  poster.add(pst);

  /* Project canvases */
  const canvasMeshes: Record<string, CanvasMeshEntry> = {};
  const haloTex = createHaloTexture();
  roomProjects.forEach(({ project, spot, ar, crop }) => {
    const shape = crop || ar;
    let w: number;
    let h: number;
    if (shape < 1) {
      h = spot[2];
      w = h * shape;
    } else {
      w = spot[2];
      h = w / shape;
    }
    const g = new THREE.Group();
    g.position.set(spot[0], spot[1], -2.95);
    scene.add(g);
    box(w + 0.06, h + 0.06, 0.045, M.canvasEdge, 0, 0, 0, g);
    const t = loader.load(project.cover.src, onAssetLoad);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (crop) {
      t.repeat.set(crop / ar, 1);
      t.offset.set((1 - crop / ar) / 2, 0);
    }
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 }),
    );
    face.position.z = 0.0235;
    g.add(face);
    const tDark = project.cover.srcDark ? loader.load(project.cover.srcDark, onAssetLoad) : null;
    if (tDark) {
      tDark.colorSpace = THREE.SRGBColorSpace;
      tDark.anisotropy = 4;
    }
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.62, h + 0.62),
      new THREE.MeshBasicMaterial({
        map: haloTex,
        color: linearColor(0xffd9b0),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    halo.position.set(spot[0], spot[1], -2.988);
    scene.add(halo);
    const strip = box(
      w + 0.02,
      0.012,
      0.012,
      new THREE.MeshBasicMaterial({ color: linearColor(0x55555a) }),
      0,
      -h / 2 - 0.034,
      -0.012,
      g,
    );
    strip.castShadow = false;
    canvasMeshes[project.slug] = { group: g, face, light: t, dark: tDark, w, h, halo, strip };
  });

  /* Synth rack */
  const rack = new THREE.Group();
  rack.position.set(2.7, 0, -2.42);
  rack.rotation.y = -0.32;
  scene.add(rack);
  [-0.58, 0.58].forEach((px) => {
    const a = box(0.04, 1.2, 0.04, M.steel, px, 0.55, 0.12, rack);
    a.rotation.x = 0.18;
    const b = box(0.04, 1.2, 0.04, M.steel, px, 0.55, -0.12, rack);
    b.rotation.x = -0.18;
  });
  const TILT_LOW = 0.2;
  const TILT_HIGH = 0.38;
  box(1.24, 0.03, 0.42, M.steel, 0, 0.72, 0.02, rack).rotation.x = TILT_LOW;
  box(1.24, 0.03, 0.32, M.steel, 0, 1.02, -0.14, rack).rotation.x = TILT_HIGH;

  const keyTex = createKeyTexture();
  const keysMat = new THREE.MeshStandardMaterial({
    map: keyTex,
    roughness: 0.5,
    emissive: new THREE.Color(0x000000),
  });
  function synth(
    w: number,
    x: number,
    y: number,
    z: number,
    panelColor: number,
    cheeks: boolean,
    parent: THREE.Object3D,
    tilt = 0,
  ) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    box(w, 0.05, 0.3, mat(panelColor), 0, 0.025, 0, g);
    const k = new THREE.Mesh(new THREE.BoxGeometry(w - (cheeks ? 0.08 : 0.02), 0.022, 0.13), keysMat);
    k.position.set(0, 0.06, 0.07);
    k.castShadow = true;
    g.add(k);
    const panel = box(w - (cheeks ? 0.08 : 0.02), 0.012, 0.13, mat(panelColor), 0, 0.07, -0.07, g);
    panel.rotation.x = tilt;
    for (let i = 0; i < Math.floor(w / 0.06); i++) {
      cyl(0.009, 0.009, 0.012, 8, M.silver, -w / 2 + 0.06 + i * 0.06, 0.08 + (tilt ? 0.02 : 0), -0.07, g);
    }
    if (cheeks) {
      box(0.035, 0.12, 0.31, M.wood, -w / 2 + 0.017, 0.06, 0, g);
      box(0.035, 0.12, 0.31, M.wood, w / 2 - 0.017, 0.06, 0, g);
    }
    return g;
  }
  const lowSynth = synth(1.18, 0, 0.745, 0.02, 0x2a2a2d, false, rack, 0);
  lowSynth.rotation.x = TILT_LOW;
  const bandTex = createSynthBandTexture();
  const band = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.03), new THREE.MeshBasicMaterial({ map: bandTex }));
  band.rotation.x = -Math.PI / 2;
  band.position.set(0, 0.078, -0.07);
  lowSynth.add(band);
  synth(0.56, -0.31, 1.05, -0.14, 0x1f1f22, true, rack, -0.5).rotation.x = TILT_HIGH;
  synth(0.56, 0.31, 1.05, -0.14, 0x141416, true, rack, -0.12).rotation.x = TILT_HIGH;
  const rackHit = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.55, 0.5),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  rackHit.position.set(0, 0.95, -0.05);
  rack.add(rackHit);

  /* Floor lamp */
  const lamp = new THREE.Group();
  lamp.position.set(3.78, 0, -2.78);
  scene.add(lamp);
  cyl(0.17, 0.19, 0.035, 18, M.steel, 0, 0.018, 0, lamp);
  cyl(0.014, 0.014, 1.62, 8, M.steel, 0, 0.83, 0, lamp);
  const neckPts = [
    new THREE.Vector3(0, 1.62, 0),
    new THREE.Vector3(0, 1.98, 0.03),
    new THREE.Vector3(-0.1, 2.24, 0.09),
    new THREE.Vector3(-0.3, 2.36, 0.16),
    new THREE.Vector3(-0.5, 2.3, 0.22),
  ];
  const neckCurve = new THREE.CatmullRomCurve3(neckPts);
  const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 40, 0.011, 6, false), M.steel);
  neck.castShadow = true;
  lamp.add(neck);
  for (let ri = 0; ri <= 14; ri++) {
    const rp = neckCurve.getPoint(0.12 + ri * 0.055);
    const rt = neckCurve.getTangent(0.12 + ri * 0.055);
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 4, 8), M.steel);
    rib.position.copy(rp);
    rib.lookAt(rp.clone().add(rt));
    lamp.add(rib);
  }
  const tip = neckPts[neckPts.length - 1];
  const LAMP_TARGET = new THREE.Vector3(1.3, 1.85, -2.95);
  const tipBase = lamp.position.clone().add(tip);
  const LAMP_DIR = LAMP_TARGET.clone().sub(tipBase).normalize();
  const shadeGroup = new THREE.Group();
  shadeGroup.position.copy(tip);
  shadeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), LAMP_DIR);
  lamp.add(shadeGroup);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: linearColor(0x2b2b2e),
    roughness: 0.5,
    metalness: 0.3,
    emissive: new THREE.Color(0x000000),
    side: THREE.DoubleSide,
    flatShading: true,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.2, 14, 1, true), shadeMat);
  shade.position.y = -0.1;
  shade.castShadow = true;
  shadeGroup.add(shade);
  const shadeInnerMat = new THREE.MeshBasicMaterial({ color: linearColor(0x55555a), side: THREE.BackSide });
  const shadeInner = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.137, 0.198, 14, 1, true), shadeInnerMat);
  shadeInner.position.y = -0.1;
  shadeGroup.add(shadeInner);
  const bulbMat = new THREE.MeshBasicMaterial({ color: linearColor(0x77777c) });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), bulbMat);
  bulb.position.y = -0.13;
  shadeGroup.add(bulb);
  const tipWorld = tipBase.clone().add(LAMP_DIR.clone().multiplyScalar(0.12));
  const lampLight = new THREE.PointLight(linearColor(0xffb35c), 0, 9, 1.4);
  lampLight.position.copy(tipWorld);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(512, 512);
  scene.add(lampLight);
  const lampSpot = new THREE.SpotLight(linearColor(0xffb35c), 0, 8, 0.62, 0.7, 1.2);
  lampSpot.position.copy(tipWorld);
  lampSpot.target.position.copy(LAMP_TARGET);
  lampSpot.castShadow = true;
  lampSpot.shadow.mapSize.set(1024, 1024);
  lampSpot.shadow.bias = -0.0008;
  scene.add(lampSpot);
  scene.add(lampSpot.target);

  /* Rickenbacker-style electric guitar */
  const guitarPivot = new THREE.Group();
  guitarPivot.position.set(3.2, 2.55, -2.97);
  scene.add(guitarPivot);
  cyl(0.012, 0.012, 0.06, 8, M.steel, 0, 0, 0, guitarPivot).rotation.x = Math.PI / 2;
  const guitar = new THREE.Group();
  guitar.position.set(0, -0.02, 0.06);
  guitarPivot.add(guitar);
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(0, 0);
  bodyShape.bezierCurveTo(-0.17, 0, -0.24, 0.1, -0.22, 0.2);
  bodyShape.bezierCurveTo(-0.21, 0.27, -0.17, 0.3, -0.18, 0.36);
  bodyShape.bezierCurveTo(-0.2, 0.44, -0.12, 0.5, -0.05, 0.47);
  bodyShape.bezierCurveTo(-0.02, 0.46, 0.0, 0.43, 0.02, 0.43);
  bodyShape.bezierCurveTo(0.06, 0.43, 0.06, 0.5, 0.12, 0.51);
  bodyShape.bezierCurveTo(0.2, 0.5, 0.22, 0.4, 0.18, 0.34);
  bodyShape.bezierCurveTo(0.16, 0.3, 0.2, 0.26, 0.21, 0.2);
  bodyShape.bezierCurveTo(0.23, 0.09, 0.16, 0, 0, 0);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 1,
    curveSegments: 6,
  });
  const guitarRed = mat(0x151515, { roughness: 0.3 });
  const gBody = new THREE.Mesh(bodyGeo, guitarRed);
  gBody.position.set(0, -1.2, -0.02);
  gBody.castShadow = true;
  guitar.add(gBody);
  const bursts: [number, number, number][] = [
    [0.84, 0xd8661a, 0.032],
    [0.6, 0xf08a2a, 0.0335],
  ];
  bursts.forEach(([sc, col, zOff]) => {
    const face = new THREE.Mesh(new THREE.ShapeGeometry(bodyShape, 6), mat(col, { roughness: 0.3 }));
    face.scale.set(sc, sc, 1);
    face.position.set(0, -1.2 + 0.255 * (1 - sc), zOff);
    guitar.add(face);
  });
  const bind = new THREE.Mesh(bodyGeo, M.white);
  bind.scale.set(1.04, 1.03, 0.6);
  bind.position.set(0, -1.207, -0.018);
  guitar.add(bind);
  const guard = new THREE.Shape();
  guard.moveTo(-0.13, 0.08);
  guard.bezierCurveTo(-0.18, 0.2, -0.14, 0.32, -0.02, 0.4);
  guard.lineTo(0.03, 0.28);
  guard.bezierCurveTo(0.0, 0.2, 0.02, 0.1, -0.13, 0.08);
  const gGuard = new THREE.Mesh(new THREE.ExtrudeGeometry(guard, { depth: 0.004, bevelEnabled: false }), M.white);
  gGuard.position.set(0, -1.2, 0.036);
  guitar.add(gGuard);
  box(0.05, 0.62, 0.025, mat(0x4a3322), 0, -0.46, 0.012, guitar);
  const head = box(0.09, 0.17, 0.02, guitarRed, 0, -0.08, 0.008, guitar);
  head.rotation.z = 0.08;
  [-0.9, -1.02].forEach((y) => {
    box(0.09, 0.016, 0.006, M.silver, 0, y, 0.04, guitar);
  });
  const guitarHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.25, 0.12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  guitarHit.position.set(0, -0.62, 0.02);
  guitar.add(guitarHit);

  /* "WET GRASS" tufted plush rug */
  const { map: rugTex, bumpMap: rugBump, pileShells } = createRugTextures();
  const rugTopMat = new THREE.MeshStandardMaterial({
    map: rugTex,
    bumpMap: rugBump,
    bumpScale: 0.72,
    roughness: 1,
  });
  const rugSideMat = new THREE.MeshStandardMaterial({
    color: linearColor(0x19582a),
    bumpMap: rugBump,
    bumpScale: 0.6,
    roughness: 1,
  });
  const rug = box(
    2.9,
    0.028,
    1.9,
    [rugSideMat, rugSideMat, rugTopMat, rugSideMat, rugSideMat, rugSideMat],
    0.1,
    0.014,
    -0.55,
  );
  rug.castShadow = false;
  pileShells.forEach((shellTex, idx) => {
    const pad = (idx + 1) * 0.028;
    const shell = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9 + pad, 1.9 + pad),
      new THREE.MeshStandardMaterial({
        map: shellTex,
        transparent: true,
        alphaTest: 0.14,
        depthWrite: false,
        roughness: 1,
      }),
    );
    shell.rotation.x = -Math.PI / 2;
    shell.position.set(0.1, 0.0295 + idx * 0.0045, -0.55);
    shell.receiveShadow = true;
    scene.add(shell);
  });

  /* Desk chair */
  const chair = new THREE.Group();
  chair.position.set(-2.35, 0, -1.72);
  chair.rotation.y = 0.5;
  scene.add(chair);
  const chairMat = mat(0x232326, { roughness: 0.7 });
  for (let ci = 0; ci < 5; ci++) {
    const ca = (ci / 5) * Math.PI * 2;
    const cleg = box(0.3, 0.025, 0.04, M.steel, Math.cos(ca) * 0.15, 0.05, Math.sin(ca) * 0.15, chair);
    cleg.rotation.y = -ca;
    cyl(0.022, 0.022, 0.03, 8, M.black, Math.cos(ca) * 0.29, 0.02, Math.sin(ca) * 0.29, chair);
  }
  cyl(0.025, 0.025, 0.36, 8, M.steel, 0, 0.24, 0, chair);
  box(0.5, 0.07, 0.48, chairMat, 0, 0.46, 0, chair);
  box(0.05, 0.3, 0.04, M.steel, 0, 0.58, 0.24, chair);
  box(0.46, 0.46, 0.05, chairMat, 0, 0.82, 0.27, chair).rotation.x = 0.12;
  [-0.27, 0.27].forEach((x) => {
    box(0.035, 0.18, 0.035, M.steel, x, 0.57, 0.02, chair);
    box(0.06, 0.025, 0.26, chairMat, x, 0.67, 0, chair);
  });

  /* Soft furnishings helper */
  function soft(
    w: number,
    h: number,
    d: number,
    r: number,
    puff: number,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    parent: THREE.Object3D = scene,
    seg = 0.05,
  ) {
    const hx = w / 2;
    const hy = h / 2;
    const hz = d / 2;
    const rad = Math.min(r, hx, hy, hz) * 0.999;
    const g = new THREE.BoxGeometry(
      w,
      h,
      d,
      Math.max(3, Math.round(w / seg)),
      Math.max(3, Math.round(h / seg)),
      Math.max(3, Math.round(d / seg)),
    );
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    const inn = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      inn.set(clamp(v.x, -hx + rad, hx - rad), clamp(v.y, -hy + rad, hy - rad), clamp(v.z, -hz + rad, hz - rad));
      const n = v.clone().sub(inn);
      if (n.lengthSq() > 1e-12) v.copy(inn).add(n.normalize().multiplyScalar(rad));
      const px = clamp(v.x / hx, -1, 1);
      const py = clamp(v.y / hy, -1, 1);
      const pz = clamp(v.z / hz, -1, 1);
      v.x *= 1 + puff * (1 - py * py) * (1 - pz * pz);
      v.y *= 1 + puff * (1 - px * px) * (1 - pz * pz);
      v.z *= 1 + puff * (1 - px * px) * (1 - py * py);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /* Bean bag */
  const fuzzTex = createFuzzTexture();
  const beanMat = new THREE.MeshStandardMaterial({
    map: createFabricTexture("#1c3cc8", "rgba(90,125,245,.35)", "rgba(8,22,110,.35)", true),
    bumpMap: fuzzTex,
    bumpScale: 0.3,
    roughness: 1,
  });
  function beanGeo(r: number) {
    const g = new THREE.SphereGeometry(r, 64, 40, -Math.PI / 2);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    const dent = new THREE.Vector3(0, 0.55, 0.83).normalize();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = v.clone().normalize();
      const wide = 1 + 0.2 * (1 - (n.y + 1) / 2) - 0.1 * Math.max(0, n.y);
      v.x *= wide;
      v.z *= wide;
      if (n.y > -0.2) {
        v.y = (v.y + 0.2 * r) * (1 + 0.55 * Math.max(0, -n.z) - 0.35 * Math.max(0, n.z)) - 0.2 * r;
      }
      const dd = n.dot(dent);
      if (dd > 0.35) {
        const t = (dd - 0.35) / 0.65;
        v.addScaledVector(n, -r * 0.5 * t * t * (3 - 2 * t));
      }
      if (v.y < -r * 0.62) v.y = -r * 0.62 + (v.y + r * 0.62) * 0.08;
      v.addScaledVector(n, r * 0.03 * Math.sin(n.x * 9 + n.y * 4) * Math.sin(n.z * 8 - n.y * 6));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }
  const bean = new THREE.Group();
  bean.position.set(-1.15, 0, 0.85);
  bean.rotation.y = 0.75;
  scene.add(bean);
  const beanMesh = new THREE.Mesh(beanGeo(0.5), beanMat);
  beanMesh.position.y = 0.5 * 0.64;
  beanMesh.castShadow = true;
  beanMesh.receiveShadow = true;
  bean.add(beanMesh);

  /* Couch + pillow + continuous throw */
  const couch = new THREE.Group();
  couch.position.set(3.5, 0, -1.15);
  couch.rotation.y = -Math.PI / 2;
  scene.add(couch);
  const couchMat = new THREE.MeshStandardMaterial({
    color: linearColor(0x140804),
    roughness: 0.95,
    flatShading: true,
  });
  const couchLeg = mat(0x1e130c, { roughness: 0.6 });
  const LP = 0.11;
  const CL = 1.8;
  const CD = 0.92;
  const inner = CL - 0.44;
  [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ].forEach((s) => {
    cyl(0.025, 0.018, 0.08, 8, couchLeg, s[0] * (CL / 2 - 0.1), 0.04, s[1] * (CD / 2 - 0.1), couch);
  });
  soft(CL - 0.04, 0.24, CD, 0.08, 0.04, couchMat, 0, 0.2, 0, couch, LP);
  [-1, 1].forEach((s) => {
    soft(0.26, 0.5, CD, 0.13, 0.14, couchMat, s * (CL / 2 - 0.13), 0.42, 0, couch, LP);
  });
  soft(inner + 0.1, 0.5, 0.26, 0.11, 0.08, couchMat, 0, 0.58, -(CD / 2 - 0.13), couch, LP);
  [-1, 1].forEach((s) => {
    soft(inner / 2 - 0.01, 0.18, CD - 0.3, 0.08, 0.22, couchMat, (s * inner) / 4, 0.42, 0.11, couch, LP);
    soft(inner / 2 - 0.02, 0.4, 0.2, 0.1, 0.35, couchMat, (s * inner) / 4, 0.74, -0.2, couch, LP).rotation.x = -0.15;
  });
  const pillow = soft(
    0.38,
    0.38,
    0.13,
    0.06,
    0.4,
    mat(0x944a0a, { roughness: 1 }),
    -(inner / 2 - 0.2),
    0.72,
    -0.01,
    couch,
    0.08,
  );
  pillow.rotation.set(-0.3, 0, 0.18);

  const throwMat = new THREE.MeshStandardMaterial({
    map: createThrowTexture(),
    roughness: 1,
    flatShading: true,
  });
  function drape(path: [number, number][], width: number, thick: number, cols: number) {
    const n = path.length;
    const pts: THREE.Vector2[] = [];
    const nrm: THREE.Vector2[] = [];
    const len: number[] = [0];
    path.forEach((q, i) => {
      pts.push(new THREE.Vector2(q[0], q[1]));
      if (i) len.push(len[i - 1] + pts[i].distanceTo(pts[i - 1]));
    });
    for (let i = 0; i < n; i++) {
      const d = pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
      nrm.push(new THREE.Vector2(-d.y, d.x));
    }
    const verts: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    function add(i: number, j: number, side: number) {
      const u = j / (cols - 1);
      const x = (u - 0.5) * width;
      const puff = 0.35 + 0.65 * (1 - Math.pow(2 * u - 1, 2));
      const off = ((side * thick) / 2) * puff + 0.012 * Math.sin(i * 1.7 + j * 2.3);
      const dropEnd = i === n - 1 ? -0.05 * u : 0;
      verts.push(x, pts[i].y + nrm[i].y * off + dropEnd, pts[i].x + nrm[i].x * off);
      uvs.push(u, len[i] / len[n - 1]);
      return verts.length / 3 - 1;
    }
    const top: number[][] = [];
    const bot: number[][] = [];
    for (let i = 0; i < n; i++) {
      top.push([]);
      bot.push([]);
      for (let j = 0; j < cols; j++) {
        top[i].push(add(i, j, 1));
        bot[i].push(add(i, j, -1));
      }
    }
    function quad(a: number, b: number, c: number, d2: number) {
      idx.push(a, b, c, a, c, d2);
    }
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < cols - 1; j++) {
        quad(top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]);
        quad(bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j]);
      }
      quad(top[i][0], bot[i][0], bot[i + 1][0], top[i + 1][0]);
      quad(top[i][cols - 1], top[i + 1][cols - 1], bot[i + 1][cols - 1], bot[i][cols - 1]);
    }
    for (let j = 0; j < cols - 1; j++) {
      quad(top[0][j], top[0][j + 1], bot[0][j + 1], bot[0][j]);
      quad(top[n - 1][j], bot[n - 1][j], bot[n - 1][j + 1], top[n - 1][j + 1]);
    }
    let g: THREE.BufferGeometry = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g = g.toNonIndexed();
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, throwMat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  const throwMesh = drape(
    [
      [-0.42, 0.86],
      [-0.34, 0.99],
      [-0.25, 1.06],
      [-0.15, 1.04],
      [-0.07, 0.95],
      [-0.03, 0.78],
      [0.0, 0.62],
      [0.07, 0.6],
      [0.24, 0.61],
      [0.42, 0.59],
      [0.52, 0.53],
      [0.56, 0.42],
      [0.55, 0.28],
    ],
    0.6,
    0.055,
    5,
  );
  throwMesh.position.x = 0.32;
  throwMesh.rotation.y = 0.04;
  couch.add(throwMesh);

  /* UW-Madison Motion W felt wall crest centered above the couch */
  const badgersCrest = new THREE.Group();
  badgersCrest.position.set(3.992, 1.82, -1.15);
  badgersCrest.rotation.y = -Math.PI / 2;
  scene.add(badgersCrest);
  const crestScale = 0.94;
  WISCONSIN_W_LAYERS.forEach(({ points, color, depth, z }, layerIdx) => {
    const shape = new THREE.Shape();
    points.forEach(([px, py], idx) => {
      if (idx === 0) shape.moveTo(px * crestScale, py * crestScale);
      else shape.lineTo(px * crestScale, py * crestScale);
    });
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: layerIdx !== 1,
      bevelThickness: 0.0018,
      bevelSize: 0.0015,
      bevelSegments: 1,
    });
    const isFelt = layerIdx !== 1;
    const matCrest = new THREE.MeshStandardMaterial({
      color: linearColor(color),
      roughness: isFelt ? 0.92 : 0.85,
      metalness: 0.02,
      bumpMap: isFelt ? fuzzTex : null,
      bumpScale: layerIdx === 2 ? 0.14 : layerIdx === 0 ? 0.06 : 0,
    });
    const layerMesh = new THREE.Mesh(geo, matCrest);
    layerMesh.position.z = z;
    layerMesh.castShadow = true;
    layerMesh.receiveShadow = true;
    badgersCrest.add(layerMesh);
  });

  /* Coat rack with headphones & olive backpack */
  const coat = new THREE.Group();
  coat.position.set(-3.3, 0, -0.35);
  coat.rotation.y = 0.35;
  scene.add(coat);
  const coatWood = mat(0x2a1d14, { roughness: 0.6 });
  cyl(0.19, 0.21, 0.03, 16, M.black, 0, 0.015, 0, coat);
  cyl(0.02, 0.022, 1.72, 8, coatWood, 0, 0.89, 0, coat);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), coatWood);
  knob.position.y = 1.77;
  coat.add(knob);
  function hook(a: number) {
    const g = new THREE.Group();
    g.rotation.y = a;
    g.position.y = 1.6;
    coat.add(g);
    box(0.014, 0.014, 0.15, M.steel, 0, 0.03, 0.07, g).rotation.x = -0.45;
    const tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), M.steel);
    tipBall.position.set(0, 0.065, 0.135);
    g.add(tipBall);
    return g;
  }
  const hookA = hook(0);
  const hookB = hook(Math.PI / 2);
  hook(Math.PI);
  hook(-Math.PI / 2);

  const hp = new THREE.Group();
  hp.position.set(0, 0, 0.1);
  hookA.add(hp);
  const hpBand = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.011, 6, 16, Math.PI), M.black);
  hpBand.position.y = -0.04;
  hpBand.castShadow = true;
  hp.add(hpBand);
  [-1, 1].forEach((s) => {
    const cup = cyl(0.045, 0.045, 0.035, 14, M.black, s * 0.085, -0.075, 0, hp);
    cup.rotation.z = Math.PI / 2;
    const pad = cyl(0.038, 0.038, 0.012, 14, M.silver, s * 0.064, -0.075, 0, hp);
    pad.rotation.z = Math.PI / 2;
  });

  const packMat = mat(0x55613f, { roughness: 0.85 });
  const packDark = mat(0x3c4530, { roughness: 0.85 });
  const pack = new THREE.Group();
  pack.position.set(0, 0, 0.13);
  hookB.add(pack);
  box(0.3, 0.42, 0.15, packMat, 0, -0.34, 0.02, pack);
  box(0.24, 0.18, 0.05, packDark, 0, -0.44, 0.115, pack);
  const lid = box(0.3, 0.06, 0.16, packDark, 0, -0.12, 0.02, pack);
  lid.rotation.x = 0.1;
  [-0.08, 0.08].forEach((x) => {
    box(0.035, 0.2, 0.012, packDark, x, -0.03, -0.06, pack).rotation.x = 0.35;
  });

  /* Record player console */
  const walnut = mat(0x250f05, { roughness: 0.7 });
  const plinthMat = mat(0x1a0b05, { roughness: 0.6 });
  const consoleG = new THREE.Group();
  consoleG.position.set(0.9, 0, -2.76);
  scene.add(consoleG);
  box(1.7, 0.42, 0.42, walnut, 0, 0.33, 0, consoleG);
  [-0.42, 0.42].forEach((x) => {
    box(0.006, 0.36, 0.005, M.black, x, 0.33, 0.212, consoleG);
  });
  [
    [-0.8, -0.17],
    [0.8, -0.17],
    [-0.8, 0.17],
    [0.8, 0.17],
  ].forEach((q) => {
    box(0.035, 0.12, 0.035, M.black, q[0], 0.06, q[1], consoleG);
  });
  const deck = new THREE.Group();
  deck.position.set(-0.35, 0.54, 0.02);
  consoleG.add(deck);
  box(0.46, 0.07, 0.36, plinthMat, 0, 0.035, 0, deck);
  cyl(0.152, 0.152, 0.014, 32, M.silver, -0.06, 0.077, 0, deck);
  const recordTextures = RECORD_TRACKS.map((t) => createRecordTexture(t.labelColor));
  const record = new THREE.Group();
  record.position.set(-0.06, 0.086, 0);
  deck.add(record);
  const vinylMat = new THREE.MeshStandardMaterial({ map: recordTextures[0], roughness: 0.35 });
  const vinylTop = new THREE.Mesh(new THREE.CircleGeometry(0.148, 40), vinylMat);
  vinylTop.userData.extraTextures = recordTextures;
  vinylTop.rotation.x = -Math.PI / 2;
  vinylTop.position.y = 0.0021;
  record.add(vinylTop);
  cyl(0.148, 0.148, 0.004, 40, M.black, 0, 0, 0, record).castShadow = false;
  cyl(0.008, 0.008, 0.02, 8, M.silver, 0, 0.008, 0, record);

  function setRecordTrack(index: number) {
    const tex = recordTextures[((index % recordTextures.length) + recordTextures.length) % recordTextures.length];
    if (tex && vinylMat.map !== tex) {
      vinylMat.map = tex;
      vinylMat.needsUpdate = true;
    }
  }

  const arm = new THREE.Group();
  arm.position.set(0.16, 0.08, -0.12);
  deck.add(arm);
  cyl(0.02, 0.024, 0.03, 12, M.silver, 0, 0, 0, arm);
  box(0.01, 0.01, 0.24, M.silver, 0, 0.03, 0.11, arm);
  box(0.03, 0.012, 0.045, M.black, 0, 0.026, 0.235, arm);
  cyl(0.016, 0.016, 0.04, 10, M.steel, 0, 0.03, -0.035, arm).rotation.x = Math.PI / 2;

  const crate = new THREE.Group();
  crate.position.set(0.42, 0.54, 0);
  consoleG.add(crate);
  [0x8a1a0a, 0x0a2f6a, 0xc8920e, 0x0d0d0d, 0xb9b0a0].forEach((c, i) => {
    const sl = box(0.31, 0.31, 0.008, mat(c, { roughness: 0.8 }), 0, 0.165, -0.08 + i * 0.04, crate);
    sl.rotation.x = -0.18;
  });
  box(0.36, 0.02, 0.3, walnut, 0, 0.01, 0, crate);
  const crateHit = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.34), new THREE.MeshBasicMaterial({ visible: false }));
  crateHit.position.set(0, 0.18, 0);
  crate.add(crateHit);
  const deckHit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
  deckHit.position.set(0, 0.08, 0);
  deck.add(deckHit);

  /* Ceiling fan (casts no shadows) */
  const fan = new THREE.Group();
  fan.position.set(0.1, 3.3, -0.6);
  scene.add(fan);
  const fanParts: THREE.Mesh[] = [];
  fanParts.push(cyl(0.06, 0.06, 0.03, 14, M.black, 0, -0.015, 0, fan));
  fanParts.push(cyl(0.012, 0.012, 0.32, 8, M.black, 0, -0.19, 0, fan));
  fanParts.push(cyl(0.11, 0.13, 0.1, 16, M.black, 0, -0.39, 0, fan));
  const bowlMat = new THREE.MeshStandardMaterial({
    color: linearColor(0xf2efe6),
    roughness: 0.6,
    emissive: new THREE.Color(0x000000),
    flatShading: true,
  });
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    bowlMat,
  );
  bowl.position.y = -0.44;
  fan.add(bowl);
  fanParts.push(bowl);
  const rotor = new THREE.Group();
  rotor.position.y = -0.4;
  fan.add(rotor);
  for (let bi = 0; bi < 5; bi++) {
    const bladeArm = new THREE.Group();
    bladeArm.rotation.y = (bi / 5) * Math.PI * 2;
    rotor.add(bladeArm);
    fanParts.push(box(0.16, 0.012, 0.035, M.black, 0.16, 0, 0, bladeArm));
    const blade = box(0.6, 0.012, 0.14, walnut, 0.52, 0.005, 0, bladeArm);
    blade.rotation.x = 0.16;
    fanParts.push(blade);
  }
  fanParts.forEach((m) => {
    m.castShadow = false;
  });
  // The fan's light, switched on at night. Its shadow is turned on per device in StudioRoom.
  const fanLight = new THREE.PointLight(linearColor(0xffd9a8), 0, 6.5, 1.6);
  fanLight.position.y = -0.52;
  fanLight.shadow.mapSize.set(512, 512);
  fanLight.shadow.bias = -0.002;
  fan.add(fanLight);

  /* Project prints on desk return */
  const prints = new THREE.Group();
  prints.position.set(-3.42, topY + 0.026, -1.35);
  scene.add(prints);
  roomProjects.forEach(({ project }, i) => {
    const c = canvasMeshes[project.slug];
    const pw = 0.24;
    const ph = 0.17;
    const sheet = new THREE.Group();
    sheet.position.set((i - 1.5) * 0.035, i * 0.004, (i - 1.5) * 0.07);
    sheet.rotation.y = 0.5 - i * 0.28;
    prints.add(sheet);
    box(pw + 0.02, 0.003, ph + 0.02, M.canvasEdge, 0, 0, 0, sheet).castShadow = false;
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(pw, ph),
      new THREE.MeshStandardMaterial({ map: c.light, roughness: 0.6 }),
    );
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.0021;
    sheet.add(face);
  });
  const printsHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.06, 0.5),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  printsHit.position.set(0, 0.02, 0);
  prints.add(printsHit);
  const printsAnchor = new THREE.Object3D();
  printsAnchor.position.copy(prints.position);
  scene.add(printsAnchor);
  printsAnchor.lookAt(prints.position.clone().add(new THREE.Vector3(1, 1.15, 0.35)));

  /* Lights */
  const hemi = new THREE.HemisphereLight(linearColor(0xe8eef6), linearColor(0xb7ab98), 0.75 * Math.PI);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xffffff, 0.15 * Math.PI);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(linearColor(0xfff1d6), 1.5 * Math.PI);
  sun.position.set(-8.5, 4.2, -1.3);
  sun.target.position.set(-1, 0, -1.1);
  scene.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.bias = -0.0006;
  const sc = sun.shadow.camera;
  sc.left = -5;
  sc.right = 5;
  sc.top = 4;
  sc.bottom = -4;
  sc.near = 1;
  sc.far = 20;
  scene.add(sun);

  const screenGlow = new THREE.PointLight(linearColor(0x9fc7ff), 0, 2.2, 2);
  screenGlow.position.set(-2.45, 1.3, -2.3);
  scene.add(screenGlow);

  updateNeonTexture();

  return {
    SCR,
    screen,
    screenMat,
    PHONE_SCR,
    phoneScreen,
    phoneScreenMat,
    windowHit,
    skyMat,
    moon,
    neonSign,
    neonMat,
    neonLight,
    rackHit,
    keysMat,
    guitarHit,
    guitar,
    poster,
    pst,
    printsHit,
    printsAnchor,
    deckHit,
    crateHit,
    record,
    setRecordTrack,
    arm,
    rotor,
    bowlMat,
    fanLight,
    lampLight,
    lampSpot,
    shadeMat,
    bulbMat,
    shadeInnerMat,
    sun,
    hemi,
    ambient,
    screenGlow,
    canvasMeshes,
    updateNeonTexture,
  };
}

export function disposeRoomScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const extra = obj.userData.extraTextures as THREE.Texture[] | undefined;
      extra?.forEach((t) => t.dispose());
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!m) return;
        for (const val of Object.values(m)) {
          if (val && typeof val === "object" && "isTexture" in val) {
            (val as THREE.Texture).dispose();
          }
        }
        m.dispose();
      });
    }
  });
}
