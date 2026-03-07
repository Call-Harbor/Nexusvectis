import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2, RotateCcw, ZoomIn, ZoomOut, Truck, Ship, Plane, ChevronLeft, ChevronRight, Info, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Vehicle 3D Model Builders ─────────────────────────────────────────────

function buildTruck(scene, config = {}) {
  const group = new THREE.Group();
  const { trailerType = 'standard', color = '#1e40af', cabColor = null } = config;

  const cabCol = new THREE.Color(cabColor || color);
  const bodyCol = new THREE.Color(color).offsetHSL(0, 0, 0.05);
  const darkMetal = new THREE.Color('#1a1a2e');
  const chrome = new THREE.Color('#c0c0c0');
  const glassColor = new THREE.Color('#a8d8ea');
  const rubber = new THREE.Color('#111111');
  const lightYellow = new THREE.Color('#ffee88');
  const lightRed = new THREE.Color('#ff4444');

  // CAB
  const cabGeo = new THREE.BoxGeometry(2.2, 2.2, 2.8);
  const cabMat = new THREE.MeshPhysicalMaterial({ color: cabCol, roughness: 0.3, metalness: 0.6 });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 1.5, 1.0);
  group.add(cab);

  // Cab roof visor
  const visorGeo = new THREE.BoxGeometry(2.2, 0.15, 0.8);
  const visorMat = new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.5, metalness: 0.8 });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 2.68, 0.6);
  group.add(visor);

  // Windshield
  const windshieldGeo = new THREE.BoxGeometry(1.8, 1.0, 0.08);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: glassColor, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6 });
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 1.8, 2.36);
  group.add(windshield);

  // Side windows
  const sideWinGeo = new THREE.BoxGeometry(0.08, 0.7, 0.9);
  [-1.05, 1.05].forEach(x => {
    const sw = new THREE.Mesh(sideWinGeo, glassMat);
    sw.position.set(x, 1.9, 1.3);
    group.add(sw);
  });

  // Grille
  const grillGeo = new THREE.BoxGeometry(1.8, 0.9, 0.1);
  const grillMat = new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.4, metalness: 0.9 });
  const grill = new THREE.Mesh(grillGeo, grillMat);
  grill.position.set(0, 0.9, 2.35);
  group.add(grill);

  // Headlights
  const headlightGeo = new THREE.BoxGeometry(0.5, 0.3, 0.1);
  const headlightMat = new THREE.MeshStandardMaterial({ color: lightYellow, emissive: lightYellow, emissiveIntensity: 1.2 });
  [-0.7, 0.7].forEach(x => {
    const hl = new THREE.Mesh(headlightGeo, headlightMat);
    hl.position.set(x, 1.1, 2.38);
    group.add(hl);
  });

  // Exhaust stacks
  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.95 });
  [-0.9, 0.9].forEach(x => {
    const ex = new THREE.Mesh(exhaustGeo, exhaustMat);
    ex.position.set(x, 2.8, 0.7);
    group.add(ex);
  });

  // Fuel tank
  const tankGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 16);
  tankGeo.rotateZ(Math.PI / 2);
  const tankMat = new THREE.MeshPhysicalMaterial({ color: chrome, roughness: 0.1, metalness: 1.0 });
  [-1.2, 1.2].forEach(x => {
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(x, 0.55, 0.2);
    group.add(tank);
  });

  // TRAILER based on type
  const trailerGroup = new THREE.Group();
  trailerGroup.position.set(0, 0, -2.5);

  if (trailerType === 'refrigerated') {
    // White refrigerated trailer with ribbing
    const trailerBody = new THREE.BoxGeometry(2.4, 2.6, 8.5);
    const trailerMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#f0f0f0'), roughness: 0.5, metalness: 0.3 });
    const trailer = new THREE.Mesh(trailerBody, trailerMat);
    trailer.position.set(0, 1.8, -1.75);
    trailerGroup.add(trailer);
    // Ribs
    for (let i = 0; i < 8; i++) {
      const ribGeo = new THREE.BoxGeometry(2.42, 2.62, 0.05);
      const ribMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.3, metalness: 0.8 });
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(0, 1.8, -1.75 + (i - 3.5) * 1.1);
      trailerGroup.add(rib);
    }
    // Cooling unit
    const coolerGeo = new THREE.BoxGeometry(2.4, 0.7, 1.0);
    const coolerMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#888888'), roughness: 0.3, metalness: 0.8 });
    const cooler = new THREE.Mesh(coolerGeo, coolerMat);
    cooler.position.set(0, 3.25, 1.0);
    trailerGroup.add(cooler);
  } else if (trailerType === 'flatbed') {
    // Flatbed trailer
    const bedGeo = new THREE.BoxGeometry(2.4, 0.18, 9.5);
    const bedMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#8B4513'), roughness: 0.9, metalness: 0.1 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(0, 0.8, -2.25);
    trailerGroup.add(bed);
    // Side rails
    const railGeo = new THREE.BoxGeometry(0.08, 0.35, 9.5);
    const railMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.9 });
    [-1.16, 1.16].forEach(x => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, 1.06, -2.25);
      trailerGroup.add(rail);
    });
    // Cross beams
    for (let i = 0; i < 6; i++) {
      const beamGeo = new THREE.BoxGeometry(2.4, 0.12, 0.08);
      const beam = new THREE.Mesh(beamGeo, railMat);
      beam.position.set(0, 0.65, -2.25 + (i - 2.5) * 1.6);
      trailerGroup.add(beam);
    }
  } else if (trailerType === 'tanker') {
    // Cylindrical tanker
    const tankBodyGeo = new THREE.CylinderGeometry(1.1, 1.1, 9.0, 24);
    tankBodyGeo.rotateZ(Math.PI / 2);
    const tankBodyMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#c8c8c8'), roughness: 0.15, metalness: 0.95 });
    const tankBody = new THREE.Mesh(tankBodyGeo, tankBodyMat);
    tankBody.position.set(0, 1.8, -2.0);
    trailerGroup.add(tankBody);
    // Rings
    for (let i = 0; i < 6; i++) {
      const ringGeo = new THREE.TorusGeometry(1.12, 0.04, 8, 24);
      ringGeo.rotateY(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.3, metalness: 0.9 }));
      ring.position.set(0, 1.8, -2.0 + (i - 2.5) * 1.5);
      trailerGroup.add(ring);
    }
  } else if (trailerType === 'car_carrier') {
    // Car carrier / multi-level
    const frameGeo = new THREE.BoxGeometry(2.4, 3.5, 9.0);
    const wireframe = new THREE.EdgesGeometry(frameGeo);
    const frameMat = new THREE.LineBasicMaterial({ color: chrome });
    const frame = new THREE.LineSegments(wireframe, frameMat);
    frame.position.set(0, 2.5, -2.0);
    trailerGroup.add(frame);
    // Decks
    [0.8, 2.2, 3.6].forEach(y => {
      const deckGeo = new THREE.BoxGeometry(2.3, 0.08, 9.0);
      const deck = new THREE.Mesh(deckGeo, new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.5, metalness: 0.7 }));
      deck.position.set(0, y, -2.0);
      trailerGroup.add(deck);
    });
    // Small car silhouettes on deck
    const carGeo = new THREE.BoxGeometry(0.85, 0.5, 1.8);
    const carMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#cc4444'), roughness: 0.3, metalness: 0.5 });
    const carPositions = [[-0.65, 0.95, -3.0], [0.65, 0.95, -1.0], [-0.65, 0.95, 1.0], [0.65, 2.35, -3.0], [-0.65, 2.35, -1.0]];
    carPositions.forEach(([cx, cy, cz]) => {
      const car = new THREE.Mesh(carGeo, carMat);
      car.position.set(cx, cy, cz);
      trailerGroup.add(car);
    });
  } else {
    // Standard box trailer
    const trailerBody = new THREE.BoxGeometry(2.4, 2.6, 9.0);
    const trailerMat = new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.4, metalness: 0.5 });
    const trailer = new THREE.Mesh(trailerBody, trailerMat);
    trailer.position.set(0, 1.8, -2.0);
    trailerGroup.add(trailer);
    // Company stripe
    const stripeGeo = new THREE.BoxGeometry(2.42, 0.3, 9.02);
    const stripeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).offsetHSL(0, 0, -0.2) });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 2.5, -2.0);
    trailerGroup.add(stripe);
  }

  // Trailer undercarriage
  const underGeo = new THREE.BoxGeometry(2.2, 0.25, 8.5);
  const underMat = new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.7, metalness: 0.6 });
  const under = new THREE.Mesh(underGeo, underMat);
  under.position.set(0, 0.3, -2.0);
  trailerGroup.add(under);

  // Trailer rear lights
  const rearLightGeo = new THREE.BoxGeometry(0.4, 0.25, 0.08);
  const rearLightMat = new THREE.MeshStandardMaterial({ color: lightRed, emissive: lightRed, emissiveIntensity: 0.8 });
  [-0.9, 0.9].forEach(x => {
    const rl = new THREE.Mesh(rearLightGeo, rearLightMat);
    rl.position.set(x, 1.6, -6.45);
    trailerGroup.add(rl);
  });

  group.add(trailerGroup);

  // WHEELS — front cab axle
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 24);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: rubber, roughness: 0.9, metalness: 0.0 });
  const hubcapGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.36, 16);
  hubcapGeo.rotateZ(Math.PI / 2);
  const hubcapMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.9 });

  const addWheel = (x, y, z) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(x, y, z);
    const h = new THREE.Mesh(hubcapGeo, hubcapMat);
    h.position.set(x, y, z);
    group.add(w); group.add(h);
  };

  // Front wheels
  addWheel(-1.3, 0.5, 1.8);
  addWheel(1.3, 0.5, 1.8);
  // Rear drive axle (dual)
  const dualWheel = (x, y, z) => {
    addWheel(x, y, z);
    addWheel(x + (x > 0 ? 0.3 : -0.3), y, z);
  };
  dualWheel(-1.4, 0.5, -0.5);
  dualWheel(1.4, 0.5, -0.5);
  dualWheel(-1.4, 0.5, -1.3);
  dualWheel(1.4, 0.5, -1.3);

  // Trailer wheels (2 rear axles)
  dualWheel(-1.4, 0.5, -6.0);
  dualWheel(1.4, 0.5, -6.0);
  dualWheel(-1.4, 0.5, -7.0);
  dualWheel(1.4, 0.5, -7.0);

  // Fifth wheel coupling
  const fifthGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16);
  const fifthMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.9 });
  const fifth = new THREE.Mesh(fifthGeo, fifthMat);
  fifth.position.set(0, 1.05, -0.6);
  group.add(fifth);

  group.rotation.y = Math.PI / 6;
  group.position.y = 0.5;
  return group;
}

function buildShip(scene, config = {}) {
  const group = new THREE.Group();
  const { shipType = 'container', color = '#1e3a5f' } = config;
  const hullCol = new THREE.Color(color);
  const white = new THREE.Color('#f0f0f0');
  const darkMetal = new THREE.Color('#333344');
  const orange = new THREE.Color('#ff6600');
  const rust = new THREE.Color('#8B4513');

  // HULL
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-3, 0);
  hullShape.lineTo(-3.5, -1.5);
  hullShape.lineTo(-2.5, -2.5);
  hullShape.lineTo(2.5, -2.5);
  hullShape.lineTo(3.5, -1.5);
  hullShape.lineTo(3, 0);
  hullShape.closePath();

  const extrudeSettings = { depth: 14, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.2, bevelSegments: 4 };
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
  const hullMat = new THREE.MeshPhysicalMaterial({ color: hullCol, roughness: 0.5, metalness: 0.7 });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.rotation.y = Math.PI / 2;
  hull.position.set(7, 0, -3);
  group.add(hull);

  // Red waterline stripe
  const waterlineGeo = new THREE.BoxGeometry(7.2, 0.25, 14.2);
  const waterlineMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#cc2222'), roughness: 0.5 });
  const waterline = new THREE.Mesh(waterlineGeo, waterlineMat);
  waterline.position.set(0, -1.4, 0);
  group.add(waterline);

  // DECK
  const deckGeo = new THREE.BoxGeometry(6.8, 0.3, 14);
  const deckMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#666666'), roughness: 0.7, metalness: 0.4 });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.set(0, 0.35, 0);
  group.add(deck);

  if (shipType === 'container') {
    // Stacked containers in multiple colors
    const containerColors = ['#1e40af', '#dc2626', '#15803d', '#92400e', '#6d28d9', '#0f766e'];
    const rows = [[-2, 0], [0, 0], [2, 0], [-2, 1.3], [0, 1.3], [2, 1.3], [-1, 2.6], [1, 2.6]];
    const zPositions = [-5, -2.5, 0, 2.5, 5];
    rows.forEach(([x, y], ri) => {
      zPositions.forEach((z, zi) => {
        const cGeo = new THREE.BoxGeometry(1.8, 1.1, 2.3);
        const cMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(containerColors[(ri + zi) % containerColors.length]), roughness: 0.4, metalness: 0.3 });
        const c = new THREE.Mesh(cGeo, cMat);
        c.position.set(x, 1.0 + y, z);
        group.add(c);
        // Container door lines
        const doorGeo = new THREE.EdgesGeometry(cGeo);
        const doorMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        const door = new THREE.LineSegments(doorGeo, doorMat);
        door.position.copy(c.position);
        group.add(door);
      });
    });

    // Crane structure
    const craneGeo = new THREE.BoxGeometry(0.2, 4, 0.2);
    const craneMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f59e0b'), roughness: 0.3, metalness: 0.7 });
    [-2, 2].forEach(x => {
      const pole = new THREE.Mesh(craneGeo, craneMat);
      pole.position.set(x, 5.0, 5);
      group.add(pole);
    });
    const craneBarGeo = new THREE.BoxGeometry(4.5, 0.2, 0.2);
    const craneBar = new THREE.Mesh(craneBarGeo, craneMat);
    craneBar.position.set(0, 7.0, 5);
    group.add(craneBar);

  } else if (shipType === 'tanker') {
    // Large cylindrical tanks
    const tankGeo = new THREE.CylinderGeometry(1.4, 1.4, 3, 20);
    const tankMat = new THREE.MeshPhysicalMaterial({ color: white, roughness: 0.2, metalness: 0.8 });
    [-5, -1.5, 2.0, 5.0].forEach(z => {
      const t = new THREE.Mesh(tankGeo, tankMat);
      t.position.set(0, 2.2, z);
      group.add(t);
    });
    // Piping
    const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 14, 8);
    pipeGeo.rotateZ(Math.PI / 2);
    const pipeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#888888'), roughness: 0.3, metalness: 0.8 });
    [-1.1, 0, 1.1].forEach(x => {
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(x, 0.85, 0);
      group.add(pipe);
    });
  } else {
    // Bulk carrier — large open hold
    const holdGeo = new THREE.BoxGeometry(5.5, 1.5, 11);
    const holdMat = new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.8, metalness: 0.4 });
    const hold = new THREE.Mesh(holdGeo, holdMat);
    hold.position.set(0, 1.25, 0);
    group.add(hold);
    // Hatch covers
    for (let i = -2; i <= 2; i++) {
      const hatchGeo = new THREE.BoxGeometry(5.2, 0.1, 1.8);
      const hatchMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#444444'), roughness: 0.5, metalness: 0.6 });
      const hatch = new THREE.Mesh(hatchGeo, hatchMat);
      hatch.position.set(0, 2.07, i * 2.2);
      group.add(hatch);
    }
  }

  // SUPERSTRUCTURE (bridge)
  const bridgeGeo = new THREE.BoxGeometry(4.5, 3.5, 4);
  const bridgeMat = new THREE.MeshPhysicalMaterial({ color: white, roughness: 0.4, metalness: 0.3 });
  const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridge.position.set(0, 2.4, -5.5);
  group.add(bridge);

  // Bridge windows
  const bridgeWinGeo = new THREE.BoxGeometry(3.2, 0.8, 0.1);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#88bbdd'), transparent: true, opacity: 0.7, roughness: 0.05 });
  [0, 1, 2].forEach(i => {
    const win = new THREE.Mesh(bridgeWinGeo, glassMat);
    win.position.set(0, 2.8 + i * 1.0, -3.49);
    group.add(win);
  });

  // Funnel/smokestack
  const funnelGeo = new THREE.CylinderGeometry(0.5, 0.7, 2.5, 16);
  const funnelMat = new THREE.MeshStandardMaterial({ color: orange, roughness: 0.3, metalness: 0.5 });
  const funnel = new THREE.Mesh(funnelGeo, funnelMat);
  funnel.position.set(0, 5.8, -5.5);
  group.add(funnel);

  // Funnel black top
  const funnelTopGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.4, 16);
  const funnelTop = new THREE.Mesh(funnelTopGeo, new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.3 }));
  funnelTop.position.set(0, 7.0, -5.5);
  group.add(funnelTop);

  // Mast
  const mastGeo = new THREE.CylinderGeometry(0.07, 0.07, 4, 8);
  const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({ color: white, roughness: 0.3 }));
  mast.position.set(0, 9, -5.5);
  group.add(mast);
  
  // Radar
  const radarGeo = new THREE.TorusGeometry(0.3, 0.04, 6, 12);
  const radar = new THREE.Mesh(radarGeo, new THREE.MeshStandardMaterial({ color: white }));
  radar.position.set(0, 11.2, -5.5);
  group.add(radar);

  // Bow
  const bowGeo = new THREE.CylinderGeometry(0.5, 2, 2, 12, 1, false, 0, Math.PI);
  const bowMat = new THREE.MeshPhysicalMaterial({ color: hullCol, roughness: 0.5, metalness: 0.7 });
  const bow = new THREE.Mesh(bowGeo, bowMat);
  bow.rotation.z = Math.PI / 2;
  bow.position.set(0, -0.5, 7.5);
  group.add(bow);

  group.rotation.y = -Math.PI / 8;
  group.scale.set(0.5, 0.5, 0.5);
  group.position.y = -0.5;
  return group;
}

function buildDrone(scene, config = {}) {
  const group = new THREE.Group();
  const { color = '#1e293b' } = config;
  const bodyCol = new THREE.Color(color);
  const darkMetal = new THREE.Color('#111111');
  const cyan = new THREE.Color('#06b6d4');
  const red = new THREE.Color('#ef4444');
  const chrome = new THREE.Color('#c0c0c0');

  // Central body
  const bodyGeo = new THREE.OctahedronGeometry(0.7, 1);
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.8 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Landing gear legs
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.5, metalness: 0.9 });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x * 0.5, -0.6, z * 0.5);
    leg.rotation.x = Math.PI / 5 * z;
    leg.rotation.z = Math.PI / 5 * x;
    group.add(leg);
    const footGeo = new THREE.BoxGeometry(0.4, 0.04, 0.04);
    const foot = new THREE.Mesh(footGeo, legMat);
    foot.position.set(x * 0.7, -1.0, z * 0.7);
    foot.rotation.y = Math.PI / 4;
    group.add(foot);
  });

  // Arms (4 arms extending outward)
  const armPositions = [[1.2, 0, 0], [-1.2, 0, 0], [0, 0, 1.2], [0, 0, -1.2]];
  armPositions.forEach(([ax, ay, az]) => {
    const armGeo = new THREE.BoxGeometry(ax !== 0 ? 1.4 : 0.15, 0.1, az !== 0 ? 1.4 : 0.15);
    const armMat = new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.7 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(ax * 0.5, 0, az * 0.5);
    group.add(arm);

    // Motor housing
    const motorGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.2, 12);
    const motorMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.9 });
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(ax, 0.12, az);
    group.add(motor);

    // Propeller
    const propGeo = new THREE.BoxGeometry(0.8, 0.03, 0.1);
    const propMat = new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.5, transparent: true, opacity: 0.7 });
    const prop = new THREE.Mesh(propGeo, propMat);
    prop.position.set(ax, 0.25, az);
    prop.rotation.y = Math.random() * Math.PI;
    group.add(prop);
    const prop2 = prop.clone();
    prop2.rotation.y += Math.PI / 2;
    group.add(prop2);
    prop.userData.spin = true;
    prop2.userData.spin = true;
    prop.userData.spinAxis = 'y';
    prop2.userData.spinAxis = 'y';
    prop.userData.spinSpeed = 0.3;
    prop2.userData.spinSpeed = 0.3;
  });

  // Camera gimbal
  const gimbalGeo = new THREE.SphereGeometry(0.15, 12, 12);
  const gimbalMat = new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.3, metalness: 0.8 });
  const gimbal = new THREE.Mesh(gimbalGeo, gimbalMat);
  gimbal.position.set(0, -0.55, 0.2);
  group.add(gimbal);

  // LED lights
  const ledGeo = new THREE.SphereGeometry(0.06, 6, 6);
  [[1, 0, 0, 0x00ffff], [-1, 0, 0, 0x00ffff], [0, 0, 1, 0xff2200], [0, 0, -1, 0x00ff00]].forEach(([x, y, z, col]) => {
    const ledMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(x, y, z);
    group.add(led);
  });

  // Antenna
  const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
  const ant = new THREE.Mesh(antGeo, new THREE.MeshStandardMaterial({ color: chrome }));
  ant.position.set(0, 0.85, 0);
  group.add(ant);

  // Battery indicator stripe
  const batGeo = new THREE.BoxGeometry(0.3, 0.08, 0.08);
  const batMat = new THREE.MeshStandardMaterial({ color: cyan, emissive: cyan, emissiveIntensity: 0.5 });
  const bat = new THREE.Mesh(batGeo, batMat);
  bat.position.set(0, 0.45, 0);
  group.add(bat);

  group.scale.set(1.8, 1.8, 1.8);
  group.position.y = 1.5;
  group.rotation.y = Math.PI / 4;
  return group;
}

function buildAircraft(scene, config = {}) {
  const group = new THREE.Group();
  const { color = '#e5e7eb' } = config;
  const bodyCol = new THREE.Color(color);
  const darkMetal = new THREE.Color('#222233');
  const blue = new THREE.Color('#1d4ed8');
  const chrome = new THREE.Color('#c8c8c8');
  const glass = new THREE.Color('#7ecef4');

  // Fuselage (tapered cylinder)
  const fuselageGeo = new THREE.CylinderGeometry(0.7, 0.3, 8, 20);
  fuselageGeo.rotateZ(Math.PI / 2);
  const fuselageMat = new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.6 });
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
  group.add(fuselage);

  // Nose cone
  const noseGeo = new THREE.ConeGeometry(0.7, 2, 20);
  noseGeo.rotateZ(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, fuselageMat);
  nose.position.set(5, 0, 0);
  group.add(nose);

  // Main wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(3.5, -1.2);
  wingShape.lineTo(3.8, -0.5);
  wingShape.lineTo(0.8, 0.2);
  wingShape.closePath();
  const wingExtSettings = { depth: 0.12, bevelEnabled: false };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtSettings);
  const wingMat = new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.5 });
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.rotation.x = Math.PI / 2;
  wingL.position.set(-0.5, -0.1, 0);
  group.add(wingL);
  const wingR = wingL.clone();
  wingR.rotation.x = -Math.PI / 2;
  wingR.position.set(-0.5, -0.1, 0.12);
  group.add(wingR);

  // Engines under wings
  [[0.8, -0.6, -2.0], [0.8, -0.6, 2.0]].forEach(([x, y, z]) => {
    const engGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.6, 16);
    engGeo.rotateZ(Math.PI / 2);
    const engMat = new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.3, metalness: 0.9 });
    const eng = new THREE.Mesh(engGeo, engMat);
    eng.position.set(x, y, z);
    group.add(eng);
    // Engine intake ring
    const intakeGeo = new THREE.TorusGeometry(0.35, 0.05, 8, 16);
    intakeGeo.rotateY(Math.PI / 2);
    const intake = new THREE.Mesh(intakeGeo, new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 1.0 }));
    intake.position.set(x + 0.82, y, z);
    group.add(intake);
  });

  // Tail section
  const tailGeo = new THREE.BoxGeometry(0.8, 2.0, 0.12);
  const tail = new THREE.Mesh(tailGeo, wingMat);
  tail.position.set(-3.5, 0.8, 0);
  group.add(tail);
  const tailHorzGeo = new THREE.BoxGeometry(0.08, 0.12, 3.5);
  const tailHorz = new THREE.Mesh(tailHorzGeo, wingMat);
  tailHorz.position.set(-3.5, -0.1, 0);
  group.add(tailHorz);

  // Cockpit windows
  const cockpitGeo = new THREE.BoxGeometry(0.05, 0.4, 1.0);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: glass, transparent: true, opacity: 0.6, roughness: 0.05 });
  const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
  cockpit.position.set(4.3, 0.3, 0);
  group.add(cockpit);

  // Airline stripe
  const stripeGeo = new THREE.BoxGeometry(8.2, 0.25, 0.71);
  const stripeMat = new THREE.MeshStandardMaterial({ color: blue, roughness: 0.3 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(-0.5, 0.2, 0);
  group.add(stripe);

  // Landing gear (retracted bumps)
  const gearGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const gearMat = new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.5 });
  [[-0.5, -0.7, 0], [1.5, -0.7, 0]].forEach(([x, y, z]) => {
    const gear = new THREE.Mesh(gearGeo, gearMat);
    gear.position.set(x, y, z);
    group.add(gear);
  });

  group.rotation.y = Math.PI / 5;
  group.scale.set(0.75, 0.75, 0.75);
  group.position.y = 1.5;
  return group;
}

// ─── Vehicle Catalog ───────────────────────────────────────────────────────

const VEHICLE_CATALOG = [
  { id: 'volvo_fh_standard', label: 'Volvo FH — Standardtrailer', type: 'truck', icon: '🚛', config: { color: '#1a3a6e', trailerType: 'standard' }, description: 'Volvo FH serie med standard kassevogn. Det mest populære langdistance-trækkøretøj i Europa.' },
  { id: 'mercedes_actros_refrigerated', label: 'Mercedes Actros — Køltrailer', type: 'truck', icon: '🚛', config: { color: '#1c1c2e', cabColor: '#2d2d40', trailerType: 'refrigerated' }, description: 'Mercedes-Benz Actros med kølet trailer til temperaturkontrolleret gods (cold chain).' },
  { id: 'scania_r_flatbed', label: 'Scania R-serie — Flatbed', type: 'truck', icon: '🚛', config: { color: '#b91c1c', trailerType: 'flatbed' }, description: 'Scania R-serie med flatbed trailer. Ideel til tungt udstyr, maskiner og oversize gods.' },
  { id: 'man_tgx_tanker', label: 'MAN TGX — Tanktrailer', type: 'truck', icon: '⛽', config: { color: '#15803d', trailerType: 'tanker' }, description: 'MAN TGX med cirkulær tanktrailer til flydende gods, kemikalier eller brændstof.' },
  { id: 'daf_xf_car_carrier', label: 'DAF XF — Biltransporter', type: 'truck', icon: '🚛', config: { color: '#d97706', trailerType: 'car_carrier' }, description: 'DAF XF med multi-level biltransporter. Kan transportere op til 10 personbiler.' },
  { id: 'container_ship', label: 'Containerskib', type: 'ship', icon: '🚢', config: { color: '#1e3a5f', shipType: 'container' }, description: 'Moderne containerskib. Transporterer standardiserede ISO-containere på tværs af verdenshavene.' },
  { id: 'tanker_ship', label: 'Tankskib (VLCC)', type: 'ship', icon: '🛢️', config: { color: '#374151', shipType: 'tanker' }, description: 'Very Large Crude Carrier (VLCC). Et af verdens største skibe med cylindriske tanke til råolie.' },
  { id: 'bulk_carrier', label: 'Bulkcarrier', type: 'ship', icon: '⚓', config: { color: '#1f2937', shipType: 'bulk' }, description: 'Bulkcarrier til tørt løst gods som korn, kul, malm og cement.' },
  { id: 'cargo_drone', label: 'Cargo Drone', type: 'drone', icon: '🚁', config: { color: '#111827' }, description: 'Autonom cargo drone til last-mile levering i byer og svært tilgængelige områder.' },
  { id: 'cargo_aircraft', label: 'Fragtfly (Narrowbody)', type: 'aircraft', icon: '✈️', config: { color: '#e5e7eb' }, description: 'Narrowbody fragtfly til ekspresgods og tidskritiske forsendelser på kortere ruter.' },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Fleet3DViewer({ onClose, initialVehicleId = null, vehicles = [] }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const modelGroupRef = useRef(null);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.15, y: 0.4 });
  const autoRotateRef = useRef(true);

  const [selectedId, setSelectedId] = useState(initialVehicleId || VEHICLE_CATALOG[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [showCatalog, setShowCatalog] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const selected = VEHICLE_CATALOG.find(v => v.id === selectedId) || VEHICLE_CATALOG[0];
  const filtered = filterType === 'all' ? VEHICLE_CATALOG : VEHICLE_CATALOG.filter(v => v.type === filterType);

  // ── Three.js Setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth || 700;
    const h = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a14);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
    camera.position.set(8, 5, 12);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0x223344, 0.6);
    scene.add(ambient);
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(10, 15, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);
    const fillLight = new THREE.DirectionalLight(0x4488bb, 0.8);
    fillLight.position.set(-8, 5, -5);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.4);
    rimLight.position.set(0, -3, -10);
    scene.add(rimLight);
    const groundLight = new THREE.HemisphereLight(0x223366, 0x0a0a14, 0.5);
    scene.add(groundLight);

    // Grid / floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x0d3d5a, 0x0a2a3a);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Reflective floor plane
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x05101e, roughness: 0.9, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Particle field (background stars)
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 1500; i++) {
      starVerts.push((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x88aacc, size: 0.5, transparent: true, opacity: 0.5 })));

    // Mouse events
    const onDown = (e) => {
      isDragging.current = true;
      autoRotateRef.current = false;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e) => {
      if (!isDragging.current || !modelGroupRef.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      rotationRef.current.y += dx * 0.008;
      rotationRef.current.x += dy * 0.005;
      rotationRef.current.x = Math.max(-0.6, Math.min(0.8, rotationRef.current.x));
      modelGroupRef.current.rotation.y = rotationRef.current.y;
      modelGroupRef.current.rotation.x = rotationRef.current.x;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDragging.current = false; };
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(5, Math.min(25, camera.position.z + e.deltaY * 0.02));
      camera.position.y = Math.max(2, Math.min(15, camera.position.y + e.deltaY * 0.005));
    };
    renderer.domElement.addEventListener('mousedown', onDown);
    renderer.domElement.addEventListener('mousemove', onMove);
    renderer.domElement.addEventListener('mouseup', onUp);
    renderer.domElement.addEventListener('mouseleave', onUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Touch support
    const onTouchStart = (e) => onDown(e.touches[0]);
    const onTouchMove = (e) => onMove(e.touches[0]);
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    renderer.domElement.addEventListener('touchend', onUp);

    // Resize
    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      if (autoRotateRef.current && modelGroupRef.current) {
        rotationRef.current.y += 0.004;
        modelGroupRef.current.rotation.y = rotationRef.current.y;
      }
      // Spin drone props
      if (modelGroupRef.current) {
        modelGroupRef.current.traverse(obj => {
          if (obj.userData?.spin) {
            obj.rotation[obj.userData.spinAxis || 'y'] += obj.userData.spinSpeed || 0.2;
          }
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationRef.current);
      renderer.domElement.removeEventListener('mousedown', onDown);
      renderer.domElement.removeEventListener('mousemove', onMove);
      renderer.domElement.removeEventListener('mouseup', onUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // ── Load Model on Selection ─────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    setIsLoading(true);
    // Remove old model
    if (modelGroupRef.current) {
      sceneRef.current.remove(modelGroupRef.current);
      modelGroupRef.current = null;
    }
    // Auto-rotate reset
    autoRotateRef.current = true;
    rotationRef.current = { x: 0.12, y: 0.4 };

    const v = VEHICLE_CATALOG.find(c => c.id === selectedId);
    if (!v) { setIsLoading(false); return; }

    setTimeout(() => {
      let model;
      if (v.type === 'truck') model = buildTruck(sceneRef.current, v.config);
      else if (v.type === 'ship') model = buildShip(sceneRef.current, v.config);
      else if (v.type === 'drone') model = buildDrone(sceneRef.current, v.config);
      else if (v.type === 'aircraft') model = buildAircraft(sceneRef.current, v.config);
      if (model) {
        sceneRef.current.add(model);
        modelGroupRef.current = model;
        model.rotation.y = rotationRef.current.y;
        model.rotation.x = rotationRef.current.x;
      }
      setIsLoading(false);
    }, 120);
  }, [selectedId]);

  const goNext = () => {
    const idx = filtered.findIndex(v => v.id === selectedId);
    setSelectedId(filtered[(idx + 1) % filtered.length].id);
  };
  const goPrev = () => {
    const idx = filtered.findIndex(v => v.id === selectedId);
    setSelectedId(filtered[(idx - 1 + filtered.length) % filtered.length].id);
  };

  if (isMinimized) {
    return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed bottom-20 left-4 z-50">
        <button onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-white text-sm font-medium backdrop-blur">
          <Layers className="w-4 h-4 text-cyan-400" />
          3D Fleet Viewer
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={() => setIsMinimized(true)}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#060a14] flex flex-col"
        style={{ boxShadow: '0 0 60px rgba(6,182,212,0.15), 0 0 120px rgba(139,92,246,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white font-bold text-sm tracking-widest uppercase font-mono">Fleet 3D Viewer</span>
            <span className="text-cyan-400/60 text-xs font-mono">— H.A.R.B.O.R Visual Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCatalog(v => !v)} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition">
              <Layers className="w-4 h-4" />
            </button>
            <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition">
              <Minimize2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Catalog sidebar */}
          <AnimatePresence>
            {showCatalog && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-r border-cyan-500/20 bg-slate-900/60 overflow-y-auto flex-shrink-0"
              >
                {/* Filter tabs */}
                <div className="p-3 border-b border-slate-700/50">
                  <div className="flex gap-1 flex-wrap">
                    {[['all', '🌐 Alle'], ['truck', '🚛 Lastbil'], ['ship', '🚢 Skib'], ['drone', '🚁 Drone'], ['aircraft', '✈️ Fly']].map(([t, label]) => (
                      <button key={t} onClick={() => setFilterType(t)}
                        className={`px-2 py-1 text-[10px] rounded font-mono transition ${filterType === t ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {filtered.map(v => (
                  <button key={v.id} onClick={() => setSelectedId(v.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition border-b border-slate-800/50 ${selectedId === v.id ? 'bg-cyan-500/15 border-l-2 border-l-cyan-500' : 'hover:bg-white/5'}`}>
                    <span className="text-lg">{v.icon}</span>
                    <span className={`text-xs font-medium leading-tight ${selectedId === v.id ? 'text-cyan-300' : 'text-slate-300'}`}>{v.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Canvas */}
          <div className="flex-1 relative min-w-0">
            <div ref={containerRef} className="w-full h-full" />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#060a14]/80 z-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                  <span className="text-cyan-400 text-xs font-mono tracking-widest">LOADING 3D MODEL...</span>
                </div>
              </div>
            )}

            {/* Controls hint */}
            <div className="absolute bottom-4 right-4 text-[10px] text-slate-500 font-mono text-right">
              <p>Træk for at rotere</p>
              <p>Scroll for at zoome</p>
            </div>

            {/* Navigation arrows */}
            <button onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-white hover:border-cyan-500/50 transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-white hover:border-cyan-500/50 transition">
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Auto-rotate button */}
            <button onClick={() => { autoRotateRef.current = !autoRotateRef.current; }}
              className="absolute top-3 right-3 p-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-400 hover:text-cyan-400 transition">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="border-t border-cyan-500/20 bg-slate-900/60 px-5 py-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg">{selected.icon}</span>
                <h3 className="text-white font-bold text-sm">{selected.label}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono border border-cyan-500/30 capitalize">{selected.type}</span>
              </div>
              <p className={`text-slate-400 text-xs leading-relaxed transition-all ${infoExpanded ? '' : 'line-clamp-1'}`}>
                {selected.description}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setInfoExpanded(v => !v)} className="p-1.5 rounded text-slate-500 hover:text-cyan-400 transition">
                <Info className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                <span>{filtered.findIndex(v => v.id === selectedId) + 1}</span>
                <span>/</span>
                <span>{filtered.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}