import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { X, Minimize2 } from 'lucide-react';

export default function FleetGlobe3D({ vehicles = [], routes = [], onClose, onMinimize }) {
  const containerRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const globeRef = useRef();
  const animationRef = useRef();
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0f);
      sceneRef.current = scene;

      // Camera
      const width = containerRef.current.clientWidth || 1200;
      const height = containerRef.current.clientHeight || 800;
      
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.z = 2.5;
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }
      rendererRef.current = renderer;

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true });
    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Container group for globe + vehicles + routes
    const fleetGroup = new THREE.Group();
    scene.add(fleetGroup);
    sceneRef.current.userData.fleetGroup = fleetGroup;

    // Globe with continents
    const globeGeometry = new THREE.SphereGeometry(1, 128, 128);
    
    // Create texture with continents outline
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Ocean color
    ctx.fillStyle = '#0a1929';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Continents (simplified)
    ctx.fillStyle = '#1e3a5f';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    
    // North America
    ctx.beginPath();
    ctx.moveTo(200, 300);
    ctx.lineTo(300, 250);
    ctx.lineTo(400, 280);
    ctx.lineTo(450, 400);
    ctx.lineTo(350, 500);
    ctx.lineTo(250, 450);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // South America
    ctx.beginPath();
    ctx.moveTo(350, 550);
    ctx.lineTo(400, 600);
    ctx.lineTo(420, 750);
    ctx.lineTo(350, 800);
    ctx.lineTo(300, 700);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Europe
    ctx.beginPath();
    ctx.moveTo(900, 250);
    ctx.lineTo(1000, 220);
    ctx.lineTo(1050, 280);
    ctx.lineTo(1000, 350);
    ctx.lineTo(900, 320);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Africa
    ctx.beginPath();
    ctx.moveTo(950, 400);
    ctx.lineTo(1050, 380);
    ctx.lineTo(1100, 500);
    ctx.lineTo(1050, 650);
    ctx.lineTo(950, 700);
    ctx.lineTo(900, 550);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Asia
    ctx.beginPath();
    ctx.moveTo(1100, 200);
    ctx.lineTo(1400, 180);
    ctx.lineTo(1600, 250);
    ctx.lineTo(1650, 400);
    ctx.lineTo(1500, 500);
    ctx.lineTo(1300, 450);
    ctx.lineTo(1150, 350);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Australia
    ctx.beginPath();
    ctx.moveTo(1500, 650);
    ctx.lineTo(1600, 630);
    ctx.lineTo(1650, 700);
    ctx.lineTo(1600, 750);
    ctx.lineTo(1500, 730);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      emissive: 0x0a2a3f,
      emissiveIntensity: 0.3,
      shininess: 15,
      transparent: false
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    fleetGroup.add(globe);
    globeRef.current = globe;
    
    // Atmospheric glow
    const glowGeometry = new THREE.SphereGeometry(1.05, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { type: "f", value: 0.3 },
        p: { type: "f", value: 4.5 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float c;
        uniform float p;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
          gl_FragColor = vec4(0.0, 0.7, 0.8, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    fleetGroup.add(glow);

    // Grid lines (subtle)
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.15 });
    
    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      const curve = new THREE.EllipseCurve(0, 0, 1.01, 1.01, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      line.rotation.x = Math.PI / 2;
      line.position.y = Math.sin((lat * Math.PI) / 180) * 1.01;
      line.scale.set(Math.cos((lat * Math.PI) / 180), Math.cos((lat * Math.PI) / 180), 1);
      fleetGroup.add(line);
    }

    // Longitude lines
    for (let lon = 0; lon < 360; lon += 30) {
      const curve = new THREE.EllipseCurve(0, 0, 1.01, 1.01, 0, Math.PI, false, 0);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      line.rotation.y = (lon * Math.PI) / 180;
      fleetGroup.add(line);
    }

    // Add vehicles as glowing markers
    const vehicleMarkers = [];
    vehicles.forEach(vehicle => {
      if (vehicle.latitude && vehicle.longitude) {
        const phi = (90 - vehicle.latitude) * (Math.PI / 180);
        const theta = (vehicle.longitude + 180) * (Math.PI / 180);
        
        const x = -(1.08 * Math.sin(phi) * Math.cos(theta));
        const y = 1.08 * Math.cos(phi);
        const z = 1.08 * Math.sin(phi) * Math.sin(theta);

        // Vehicle marker (larger and brighter)
        const markerGeometry = new THREE.SphereGeometry(0.025, 32, 32);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
          color: vehicle.status === 'active' ? 0x00ffff : 0x888888,
          transparent: true,
          opacity: 1
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y, z);
        fleetGroup.add(marker);

        // Outer glow ring
        const glowGeometry = new THREE.SphereGeometry(0.045, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
          color: vehicle.status === 'active' ? 0x00ffff : 0x666666,
          transparent: true,
          opacity: 0.4,
          side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, y, z);
        fleetGroup.add(glow);

        // Vertical beam
        const beamGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.08, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({ 
          color: vehicle.status === 'active' ? 0x00ffff : 0x666666,
          transparent: true,
          opacity: 0.6
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        const beamDirection = new THREE.Vector3(x, y, z).normalize();
        beam.position.copy(beamDirection.multiplyScalar(1.04));
        beam.lookAt(0, 0, 0);
        beam.rotateX(Math.PI / 2);
        fleetGroup.add(beam);

        // Pulse animation
        vehicleMarkers.push({ marker, glow, beam });
        glow.userData.animate = () => {
          const scale = 1 + Math.sin(Date.now() * 0.003) * 0.3;
          glow.scale.set(scale, scale, scale);
          marker.material.opacity = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
        };
      }
    });

    // Add routes as animated arcs
    const routeLines = [];
    routes.forEach((route, idx) => {
      // Extract origin and destination from route data
      let origin_lat, origin_lng, destination_lat, destination_lng;
      
      if (route.waypoints && route.waypoints.length > 0) {
        origin_lat = route.waypoints[0]?.lat || route.waypoints[0]?.latitude;
        origin_lng = route.waypoints[0]?.lng || route.waypoints[0]?.longitude;
        destination_lat = route.waypoints[route.waypoints.length - 1]?.lat || route.waypoints[route.waypoints.length - 1]?.latitude;
        destination_lng = route.waypoints[route.waypoints.length - 1]?.lng || route.waypoints[route.waypoints.length - 1]?.longitude;
      } else {
        origin_lat = route.origin_lat;
        origin_lng = route.origin_lng;
        destination_lat = route.destination_lat;
        destination_lng = route.destination_lng;
      }
      
      if (origin_lat && origin_lng && destination_lat && destination_lng) {
        const phi1 = (90 - origin_lat) * (Math.PI / 180);
        const theta1 = (origin_lng + 180) * (Math.PI / 180);
        const phi2 = (90 - destination_lat) * (Math.PI / 180);
        const theta2 = (destination_lng + 180) * (Math.PI / 180);
        
        const start = new THREE.Vector3(
          -(1.06 * Math.sin(phi1) * Math.cos(theta1)),
          1.06 * Math.cos(phi1),
          1.06 * Math.sin(phi1) * Math.sin(theta1)
        );
        
        const end = new THREE.Vector3(
          -(1.06 * Math.sin(phi2) * Math.cos(theta2)),
          1.06 * Math.cos(phi2),
          1.06 * Math.sin(phi2) * Math.sin(theta2)
        );
        
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(1.25);
        
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(100);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Gradient effect with multiple colors
        const colors = [];
        for (let i = 0; i < points.length; i++) {
          const t = i / points.length;
          colors.push(
            0.5 + t * 0.5,  // R
            0.3 + t * 0.4,  // G
            1.0           // B
          );
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.LineBasicMaterial({ 
          vertexColors: true,
          transparent: true, 
          opacity: 0.8,
          linewidth: 3
        });
        const line = new THREE.Line(geometry, material);
        fleetGroup.add(line);
        
        // Moving dot along route
        const dotGeometry = new THREE.SphereGeometry(0.015, 16, 16);
        const dotMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.9
        });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        fleetGroup.add(dot);
        
        routeLines.push({ curve, dot, progress: Math.random() });
      }
    });
    
    // Store route animations
    scene.userData.routeLines = routeLines;

    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    
    const backLight = new THREE.DirectionalLight(0x0066ff, 0.5);
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);
    
    const fillLight = new THREE.PointLight(0x06b6d4, 0.8, 100);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    // Mouse interaction for camera rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    
    const onMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        fleetGroup.rotation.y += deltaX * 0.005;
        fleetGroup.rotation.x += deltaY * 0.005;
        
        // Clamp rotation
        fleetGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, fleetGroup.rotation.x));
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };
    
    const onMouseUp = () => {
      isDragging = false;
    };
    
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.001;
      camera.position.z = Math.max(1.5, Math.min(4, camera.position.z));
    };
    
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation loop
    const animate = () => {
      try {
        animationRef.current = requestAnimationFrame(animate);
        
        // Auto-rotate globe slowly
        if (!isDragging && fleetGroup) {
          fleetGroup.rotation.y += 0.0015;
        }
        
        // Animate markers
        if (sceneRef.current) {
          sceneRef.current.children.forEach(child => {
            if (child.userData?.animate) {
              child.userData.animate();
            }
          });
        }
        
        // Animate route dots
        if (scene.userData?.routeLines) {
          scene.userData.routeLines.forEach(routeLine => {
            routeLine.progress += 0.005;
            if (routeLine.progress > 1) routeLine.progress = 0;
            const point = routeLine.curve.getPoint(routeLine.progress);
            if (point && routeLine.dot) {
              routeLine.dot.position.copy(point);
            }
          });
        }
        
        // Rotate stars slowly
        if (stars) {
          stars.rotation.y += 0.0001;
        }
        
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      } catch (error) {
        console.error('Animation loop error:', error);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      try {
        window.removeEventListener('resize', handleResize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (rendererRef.current?.domElement) {
          rendererRef.current.domElement.removeEventListener('mousedown', onMouseDown);
          rendererRef.current.domElement.removeEventListener('mousemove', onMouseMove);
          rendererRef.current.domElement.removeEventListener('mouseup', onMouseUp);
          rendererRef.current.domElement.removeEventListener('wheel', onWheel);
        }
        if (containerRef.current && rendererRef.current?.domElement) {
          try {
            containerRef.current.removeChild(rendererRef.current.domElement);
          } catch (e) {
            // Already removed
          }
        }
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
    } catch (error) {
      console.error('3D Globe initialization error:', error);
      return () => {};
    }
  }, [vehicles, routes]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl h-[80vh] rounded-2xl border border-cyan-500/30 bg-slate-950/90 backdrop-blur-xl overflow-hidden"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-900/90 to-transparent backdrop-blur-sm border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-xl font-bold text-white">3D Fleet Globe</h3>
            <span className="text-sm text-cyan-400">{vehicles.length} vehicles • {routes.length} routes</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMinimize}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Info overlay */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div className="p-4 rounded-xl bg-slate-900/80 backdrop-blur-sm border border-cyan-500/20">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Active Vehicles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-slate-300">Idle Vehicles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-violet-500" />
                <span className="text-slate-300">Routes</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs text-emerald-400 font-semibold">Interactive 3D Globe</div>
            <div className="text-xs text-slate-500">
              Drag to rotate • Scroll to zoom • Live vehicle tracking
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}