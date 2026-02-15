import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a4d68,
      emissive: 0x022e3f,
      shininess: 10,
      transparent: true,
      opacity: 0.9
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);
    globeRef.current = globe;

    // Grid lines
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.3 });
    
    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      const curve = new THREE.EllipseCurve(0, 0, 1, 1, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      line.rotation.x = Math.PI / 2;
      line.position.y = Math.sin((lat * Math.PI) / 180);
      line.scale.set(Math.cos((lat * Math.PI) / 180), Math.cos((lat * Math.PI) / 180), 1);
      scene.add(line);
    }

    // Longitude lines
    for (let lon = 0; lon < 360; lon += 30) {
      const curve = new THREE.EllipseCurve(0, 0, 1, 1, 0, Math.PI, false, 0);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      line.rotation.y = (lon * Math.PI) / 180;
      scene.add(line);
    }

    // Add vehicles as glowing points
    vehicles.forEach(vehicle => {
      if (vehicle.latitude && vehicle.longitude) {
        const phi = (90 - vehicle.latitude) * (Math.PI / 180);
        const theta = (vehicle.longitude + 180) * (Math.PI / 180);
        
        const x = -(1.05 * Math.sin(phi) * Math.cos(theta));
        const y = 1.05 * Math.cos(phi);
        const z = 1.05 * Math.sin(phi) * Math.sin(theta);

        // Vehicle marker
        const markerGeometry = new THREE.SphereGeometry(0.015, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
          color: vehicle.status === 'active' ? 0x06b6d4 : 0x64748b,
          transparent: true,
          opacity: 0.9
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y, z);
        scene.add(marker);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(0.025, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
          color: vehicle.status === 'active' ? 0x06b6d4 : 0x64748b,
          transparent: true,
          opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, y, z);
        scene.add(glow);

        // Pulse animation
        const pulseScale = () => {
          const scale = 1 + Math.sin(Date.now() * 0.003) * 0.2;
          glow.scale.set(scale, scale, scale);
        };
        glow.userData.animate = pulseScale;
      }
    });

    // Add routes as curved lines
    routes.forEach((route, idx) => {
      if (route.origin_lat && route.origin_lng && route.destination_lat && route.destination_lng) {
        const phi1 = (90 - route.origin_lat) * (Math.PI / 180);
        const theta1 = (route.origin_lng + 180) * (Math.PI / 180);
        const phi2 = (90 - route.destination_lat) * (Math.PI / 180);
        const theta2 = (route.destination_lng + 180) * (Math.PI / 180);
        
        const start = new THREE.Vector3(
          -(1.05 * Math.sin(phi1) * Math.cos(theta1)),
          1.05 * Math.cos(phi1),
          1.05 * Math.sin(phi1) * Math.sin(theta1)
        );
        
        const end = new THREE.Vector3(
          -(1.05 * Math.sin(phi2) * Math.cos(theta2)),
          1.05 * Math.cos(phi2),
          1.05 * Math.sin(phi2) * Math.sin(theta2)
        );
        
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(1.2);
        
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: 0x8b5cf6, 
          transparent: true, 
          opacity: 0.6,
          linewidth: 2
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
      }
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x06b6d4, 1, 100);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate globe
      globe.rotation.y += 0.001;
      
      // Animate markers
      scene.children.forEach(child => {
        if (child.userData.animate) {
          child.userData.animate();
        }
      });
      
      renderer.render(scene, camera);
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
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
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
          <div className="text-xs text-slate-500">
            Use mouse to rotate • Scroll to zoom
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}