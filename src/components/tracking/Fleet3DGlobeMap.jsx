import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const STATUS = {
  active:      { int: 0x22d3ee, hex: "#22d3ee" },
  idle:        { int: 0xf59e0b, hex: "#f59e0b" },
  maintenance: { int: 0xf97316, hex: "#f97316" },
  offline:     { int: 0x475569, hex: "#475569" },
};

function latLngToVec3(lat, lng, r = 1) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function buildArc(lat1, lng1, lat2, lng2, r = 1.02, lift = 0.16) {
  const a   = latLngToVec3(lat1, lng1, r);
  const b   = latLngToVec3(lat2, lng2, r);
  const mid = a.clone().add(b).normalize().multiplyScalar(r + lift);
  const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(64);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
  return new THREE.Line(geo, mat);
}

export default function Fleet3DGlobeMap({ vehicles = [], routes = [], buses = [], busLines = [], busStops = [], onSelectVehicle }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth  || 800;
    const H = el.clientHeight || 600;

    // ── Scene / camera / renderer ──────────────────────────────────────────
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(0, 0.3, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    el.appendChild(renderer.domElement);

    // ── Globe group ────────────────────────────────────────────────────────
    const globe = new THREE.Group();
    scene.add(globe);

    // Earth body
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x0a1a2f, emissive: 0x050d1a, specular: 0x1e4976, shininess: 20 })
    ));

    // Wireframe grid
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.002, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0x0e3a5f, wireframe: true, transparent: true, opacity: 0.12 })
    ));

    // Latitude rings
    [0, 23.5, -23.5, 66.5, -66.5].forEach(lat => {
      const y = Math.sin(lat * Math.PI / 180);
      const r = Math.cos(lat * Math.PI / 180) * 1.004;
      const pts = Array.from({ length: 129 }, (_, i) => {
        const a = (i / 128) * Math.PI * 2;
        return new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));
      });
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globe.add(new THREE.Line(geo,
        new THREE.LineBasicMaterial({ color: lat === 0 ? 0x1e4976 : 0x0c2236, transparent: true, opacity: 0.5 })
      ));
    });

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const pts = Array.from({ length: 65 }, (_, i) => latLngToVec3(-90 + (i / 64) * 180, lng, 1.003));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globe.add(new THREE.Line(geo,
        new THREE.LineBasicMaterial({ color: 0x0c2236, transparent: true, opacity: 0.35 })
      ));
    }

    // ── Atmosphere ─────────────────────────────────────────────────────────
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.16, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.04, side: THREE.BackSide })
    ));
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.28, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x0e7490, transparent: true, opacity: 0.015, side: THREE.BackSide })
    ));

    // ── Stars ──────────────────────────────────────────────────────────────
    const starPos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const r = 55 + Math.random() * 120;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      starPos[i * 3]     = r * Math.sin(p) * Math.cos(t);
      starPos[i * 3 + 1] = r * Math.cos(p);
      starPos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.7, sizeAttenuation: true })
    ));

    // ── Lights ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x112244, 2.2));
    const sun = new THREE.DirectionalLight(0x6699ff, 0.9);
    sun.position.set(4, 2, 4);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x06b6d4, 0.3);
    rim.position.set(-4, -2, -4);
    scene.add(rim);

    // ── Vehicle markers ────────────────────────────────────────────────────
    const vehicleMeshes = [];
    const pulseRings    = [];

    vehicles.forEach(v => {
      if (!v.latitude || !v.longitude) return;
      const c   = (STATUS[v.status] || STATUS.offline).int;
      const pos = latLngToVec3(v.latitude, v.longitude, 1.022);

      // Cone marker
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.013, 0.038, 6),
        new THREE.MeshBasicMaterial({ color: c })
      );
      cone.position.copy(pos);
      cone.lookAt(0, 0, 0);
      cone.rotateX(Math.PI / 2);
      cone.userData = { vehicle: v };
      globe.add(cone);
      vehicleMeshes.push(cone);

      // Pulse ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.018, 0.030, 24),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      );
      ring.position.copy(pos.clone().multiplyScalar(1.001));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
      ring.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(ring);
      pulseRings.push(ring);

      // Speed trail (short arc behind vehicle)
      if (v.speed > 0 && v.heading !== undefined) {
        const backLat = v.latitude  - Math.cos(v.heading * Math.PI / 180) * 0.8;
        const backLng = v.longitude - Math.sin(v.heading * Math.PI / 180) * 0.8;
        const trailPts = [];
        for (let i = 0; i <= 12; i++) {
          const t = i / 12;
          trailPts.push(latLngToVec3(
            backLat + (v.latitude  - backLat) * t,
            backLng + (v.longitude - backLng) * t,
            1.022
          ));
        }
        const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts);
        const trailMat = new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.4 });
        globe.add(new THREE.Line(trailGeo, trailMat));
      }
    });

    // ── Bus stops ──────────────────────────────────────────────────────────
    busStops.forEach(stop => {
      if (!stop.latitude || !stop.longitude) return;
      const pos = latLngToVec3(stop.latitude, stop.longitude, 1.015);
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 })
      );
      marker.position.copy(pos);
      globe.add(marker);
    });

    // ── Bus lines (transit routes) ─────────────────────────────────────────
    busLines.forEach((line, idx) => {
      if (!line.directions || !line.directions.length) return;
      
      const lineColor = [0x06b6d4, 0x8b5cf6, 0x10b981, 0xf59e0b][idx % 4];
      
      line.directions.forEach(direction => {
        const stops = (direction.stop_sequence || [])
          .map(seq => busStops.find(s => s.stop_id === seq.stop_id))
          .filter(s => s && s.latitude && s.longitude);
        
        for (let i = 0; i < stops.length - 1; i++) {
          const arc = buildArc(stops[i].latitude, stops[i].longitude, stops[i + 1].latitude, stops[i + 1].longitude);
          arc.material.color.setHex(lineColor);
          arc.material.opacity = 0.8;
          globe.add(arc);
        }
      });
    });

    // ── Route arcs ─────────────────────────────────────────────────────────
    routes.forEach(route => {
      const wp = (route.waypoints || []).filter(w => w.lat && w.lng);
      for (let i = 0; i < wp.length - 1; i++) {
        globe.add(buildArc(wp[i].lat, wp[i].lng, wp[i + 1].lat, wp[i + 1].lng));
      }
    });

    // ── Buses (transit vehicles) ───────────────────────────────────────────
    const busMeshes = [];
    buses.forEach(bus => {
      if (!bus.latitude || !bus.longitude) return;
      const color = bus.status === 'in_service' ? 0x10b981 : 
                    bus.status === 'charging' ? 0xf59e0b : 0x64748b;
      const pos = latLngToVec3(bus.latitude, bus.longitude, 1.025);

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.015, 0.015, 0.015),
        new THREE.MeshBasicMaterial({ color: color })
      );
      cube.position.copy(pos);
      cube.userData = { bus: bus, type: 'bus' };
      globe.add(cube);
      busMeshes.push(cube);
      vehicleMeshes.push(cube);

      // Pulse ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.020, 0.028, 24),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      );
      ring.position.copy(pos.clone().multiplyScalar(1.001));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
      ring.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(ring);
      pulseRings.push(ring);
    });

    // ── Traffic obstacles (simulated near active vehicles) ─────────────────
    const obstacles = [];
    vehicles.filter(v => v.latitude && v.longitude).slice(0, 8).forEach(v => {
      const jlat = v.latitude  + (Math.random() - 0.5) * 3.5;
      const jlng = v.longitude + (Math.random() - 0.5) * 3.5;
      const pos  = latLngToVec3(jlat, jlng, 1.03);
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.016, 0),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 })
      );
      mesh.position.copy(pos);
      mesh.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(mesh);
      obstacles.push(mesh);
    });

    // ── Raycaster for clicks ───────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouseVec  = new THREE.Vector2();
    const handleClick = (e) => {
      const rect = el.getBoundingClientRect();
      mouseVec.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      const hits = raycaster.intersectObjects(vehicleMeshes);
      if (hits.length) {
        const data = hits[0].object.userData;
        if (data.vehicle) onSelectVehicle?.(data.vehicle);
        else if (data.bus) onSelectVehicle?.(data.bus);
      }
    };

    // ── Orbit controls (mouse + touch) ─────────────────────────────────────
    let dragging = false, lastX = 0, lastY = 0;
    const onDown  = e => { dragging = true;  lastX = e.clientX; lastY = e.clientY; };
    const onMove  = e => {
      if (!dragging) return;
      globe.rotation.y += (e.clientX - lastX) * 0.006;
      globe.rotation.x  = Math.max(-1.2, Math.min(1.2, globe.rotation.x + (e.clientY - lastY) * 0.006));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onUp    = () => { dragging = false; };
    const onWheel = e => { camera.position.z = Math.max(1.8, Math.min(6, camera.position.z + e.deltaY * 0.003)); };
    const onTDown = e => { dragging = true;  lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; };
    const onTMove = e => { if (!dragging) return; globe.rotation.y += (e.touches[0].clientX - lastX) * 0.006; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; };

    el.addEventListener('mousedown',  onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    el.addEventListener('click',      handleClick);
    el.addEventListener('wheel',      onWheel, { passive: true });
    el.addEventListener('touchstart', onTDown, { passive: true });
    el.addEventListener('touchmove',  onTMove, { passive: true });
    el.addEventListener('touchend',   onUp);

    // ── Animation loop ─────────────────────────────────────────────────────
    let t = 0, rafId;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      t += 0.012;

      if (!dragging) globe.rotation.y += 0.0007;

      pulseRings.forEach(ring => {
        const ph = ring.userData.phase + t * 1.9;
        ring.material.opacity = 0.12 + 0.55 * (0.5 + 0.5 * Math.sin(ph));
        ring.scale.setScalar(1 + 0.38 * (0.5 + 0.5 * Math.sin(ph * 0.75)));
      });

      obstacles.forEach(o => {
        const ph = o.userData.phase + t * 1.4;
        o.rotation.y = ph;
        o.rotation.x = ph * 0.7;
        o.material.opacity = 0.45 + 0.5 * (0.5 + 0.5 * Math.sin(ph));
      });

      busMeshes.forEach(bus => {
        bus.rotation.y = t * 1.2;
      });

      renderer.render(scene, camera);
    };
    tick();

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      const W = el.clientWidth, H = el.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize',    onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      el.removeEventListener('mousedown',  onDown);
      el.removeEventListener('click',      handleClick);
      el.removeEventListener('wheel',      onWheel);
      el.removeEventListener('touchstart', onTDown);
      el.removeEventListener('touchmove',  onTMove);
      el.removeEventListener('touchend',   onUp);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [vehicles, routes, buses, busLines, busStops]);

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* WebGL canvas */}
      <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />

      {/* Header badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full pointer-events-none"
        style={{ background: "rgba(2,6,18,0.8)", border: "1px solid rgba(6,182,212,0.25)" }}>
        <span className="text-[10px] font-mono tracking-widest" style={{ color: "#06b6d4" }}>
          FLEET 3D — LIVE GLOBE
        </span>
      </div>

      {/* Status chips */}
      <div className="absolute top-14 left-4 flex flex-wrap gap-2 pointer-events-none">
        {Object.entries(STATUS).map(([status, { hex }]) => {
          const count = vehicles.filter(v => v.status === status).length;
          if (!count) return null;
          return (
            <div key={status} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-sm"
              style={{ background: "rgba(2,6,18,0.75)", border: `1px solid ${hex}28` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: hex, boxShadow: `0 0 5px ${hex}` }} />
              <span className="text-[10px] font-mono capitalize" style={{ color: "#94a3b8" }}>
                {count} {status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-6 space-y-1.5 pointer-events-none">
        {[
          { color: "#22d3ee", label: "Active vehicle" },
          { color: "#f59e0b", label: "Idle vehicle" },
          { color: "#f97316", label: "Maintenance" },
          { color: "#ef4444", label: "Traffic obstacle" },
          { color: "#06b6d4", label: "Route arc" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: color, boxShadow: `0 0 5px ${color}60` }} />
            <span className="text-[10px] font-mono" style={{ color: "#4b5563" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-8 right-6 text-right pointer-events-none space-y-1">
        {["Drag to rotate", "Scroll to zoom", "Click marker to select"].map(txt => (
          <div key={txt} className="text-[9px] font-mono" style={{ color: "#334155" }}>{txt}</div>
        ))}
      </div>
    </div>
  );
}