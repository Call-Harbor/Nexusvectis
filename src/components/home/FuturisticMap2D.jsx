import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";

export default function FuturisticMap2D({ vehicles = [], routes = [], resources = [] }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe sphere with gradient material
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 color1 = vec3(0.024, 0.714, 0.824); // cyan
          vec3 color2 = vec3(0.545, 0.361, 0.965); // violet
          
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 gradient = mix(color1, color2, vPosition.y * 0.5 + 0.5);
          
          float pulse = sin(time * 0.5) * 0.1 + 0.9;
          
          gl_FragColor = vec4(gradient * 0.3 * pulse, 0.4 + fresnel * 0.3);
        }
      `
    });
    
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    globeRef.current = globe;

    // Wireframe overlay
    const wireframeGeo = new THREE.SphereGeometry(1.01, 32, 32);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireframe = new THREE.Mesh(wireframeGeo, wireframeMat);
    scene.add(wireframe);

    // Latitude/longitude lines
    const createLatLine = (latitude) => {
      const phi = (90 - latitude) * Math.PI / 180;
      const radius = Math.sin(phi) * 1.02;
      const circleGeo = new THREE.BufferGeometry();
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(
          radius * Math.cos(theta),
          Math.cos(phi) * 1.02,
          radius * Math.sin(theta)
        );
      }
      circleGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      const lineMat = new THREE.LineBasicMaterial({ 
        color: 0x06b6d4, 
        transparent: true, 
        opacity: 0.2 
      });
      return new THREE.Line(circleGeo, lineMat);
    };

    [-60, -30, 0, 30, 60].forEach(lat => {
      scene.add(createLatLine(lat));
    });

    // Longitude lines
    const createLongLine = (longitude) => {
      const curvePoints = [];
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI;
        const theta = longitude * Math.PI / 180;
        curvePoints.push(new THREE.Vector3(
          1.02 * Math.sin(phi) * Math.cos(theta),
          1.02 * Math.cos(phi),
          1.02 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
      const lineMat = new THREE.LineBasicMaterial({ 
        color: 0x06b6d4, 
        transparent: true, 
        opacity: 0.2 
      });
      return new THREE.Line(curveGeo, lineMat);
    };

    [0, 30, 60, 90, 120, 150].forEach(lng => {
      scene.add(createLongLine(lng));
    });

    // Vehicle markers
    const markerGeo = new THREE.SphereGeometry(0.02, 16, 16);
    vehicles.forEach((vehicle, idx) => {
      const phi = (90 - vehicle.latitude) * Math.PI / 180;
      const theta = (vehicle.longitude + 180) * Math.PI / 180;
      const x = 1.05 * Math.sin(phi) * Math.cos(theta);
      const y = 1.05 * Math.cos(phi);
      const z = 1.05 * Math.sin(phi) * Math.sin(theta);

      const markerMat = new THREE.MeshBasicMaterial({ 
        color: vehicle.status === 'active' ? 0x06b6d4 : 0xfbbf24 
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(x, y, z);
      scene.add(marker);

      // Pulsing ring
      const ringGeo = new THREE.RingGeometry(0.02, 0.04, 16);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: 0x06b6d4, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y, z);
      ring.lookAt(0, 0, 0);
      scene.add(ring);
    });

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Point light
    const pointLight = new THREE.PointLight(0x06b6d4, 1, 100);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    containerRef.current.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      if (globeRef.current) {
        globeRef.current.rotation.y += 0.002;
        globeRef.current.rotation.y += mouseX * 0.001;
        globeRef.current.rotation.x += mouseY * 0.0005;
        globeRef.current.material.uniforms.time.value = time;
      }

      if (wireframe) {
        wireframe.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    };
    animate();
    setIsReady(true);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '60px 60px'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 3D Globe Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Stats overlay */}
      <div className="absolute top-6 left-6 space-y-3 pointer-events-none z-10">
        {[
          { label: 'Active Fleet', value: vehicles.length, color: 'cyan' },
          { label: 'Routes', value: routes.length, color: 'violet' },
          { label: 'Hubs', value: resources.length, color: 'fuchsia' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: isReady ? 1 : 0, x: isReady ? 0 : -30 }}
            transition={{ delay: idx * 0.15 }}
            className={`px-4 py-2.5 rounded-xl bg-gradient-to-r from-${stat.color}-500/20 to-${stat.color}-500/10 border border-${stat.color}-400/40 backdrop-blur-xl shadow-lg`}
          >
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</span>
              <span className="text-xs text-slate-300 uppercase tracking-widest">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : 20 }}
        className="absolute bottom-6 right-6 flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl z-10"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-cyan-300 text-xs font-mono">REAL-TIME TRACKING</span>
      </motion.div>

      {/* Corner brackets */}
      {[
        { corner: 'top-left', rotate: 0 },
        { corner: 'top-right', rotate: 90 },
        { corner: 'bottom-left', rotate: 270 },
        { corner: 'bottom-right', rotate: 180 },
      ].map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: isReady ? 0.6 : 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`absolute ${
            item.corner.includes('top') ? 'top-4' : 'bottom-4'
          } ${
            item.corner.includes('left') ? 'left-4' : 'right-4'
          } w-12 h-12 pointer-events-none`}
          style={{ transform: `rotate(${item.rotate}deg)` }}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <path
              d="M 0 8 L 0 0 L 8 0"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
            />
            <circle cx="0" cy="0" r="2" fill="#06b6d4" />
          </svg>
        </motion.div>
      ))}

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none"
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}