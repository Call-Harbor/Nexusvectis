import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";

export default function FuturisticMap2D({ vehicles = [], routes = [], resources = [] }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const particlesRef = useRef([]);
  const ringsRef = useRef([]);
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
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe sphere with holographic shader
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        // Simplified continent shapes
        bool isLand(vec2 uv) {
          // Europe/Africa
          if (uv.x > 0.45 && uv.x < 0.65 && uv.y > 0.35 && uv.y < 0.7) return true;
          // Americas
          if (uv.x > 0.15 && uv.x < 0.35 && uv.y > 0.25 && uv.y < 0.75) return true;
          // Asia
          if (uv.x > 0.65 && uv.x < 0.9 && uv.y > 0.35 && uv.y < 0.65) return true;
          return false;
        }
        
        void main() {
          vec3 cyan = vec3(0.0, 0.9, 1.0);
          vec3 blue = vec3(0.0, 0.5, 1.0);
          vec3 violet = vec3(0.6, 0.4, 1.0);
          
          // Fresnel rim lighting
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          
          // Latitude/longitude grid
          float lat = step(0.97, fract(vUv.y * 12.0));
          float lng = step(0.97, fract(vUv.x * 24.0));
          float grid = max(lat, lng);
          
          // Landmasses
          float land = isLand(vUv) ? 0.4 : 0.0;
          
          // Base color gradient
          vec3 baseColor = mix(cyan, blue, vUv.y);
          baseColor = mix(baseColor, violet, fresnel * 0.4);
          
          // Pulse
          float pulse = sin(time * 0.6) * 0.1 + 0.9;
          
          // Combine everything
          float alpha = 0.15 + fresnel * 0.6 + grid * 0.25 + land;
          
          gl_FragColor = vec4(baseColor * pulse, alpha * 0.8);
        }
      `
    });
    
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    globeRef.current = globe;

    // Outer glow sphere
    const glowGeo = new THREE.SphereGeometry(1.15, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = sin(time * 0.5) * 0.2 + 0.8;
          gl_FragColor = vec4(0.0, 0.8, 1.0, intensity * 0.6 * pulse);
        }
      `
    });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowSphere);

    // Orbital rings
    const createOrbitalRing = (radius, thickness, tilt, speed) => {
      const ringGeo = new THREE.TorusGeometry(radius, thickness, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + tilt;
      ring.userData.rotationSpeed = speed;
      ringsRef.current.push(ring);
      return ring;
    };

    scene.add(createOrbitalRing(1.3, 0.01, 0.2, 0.001));
    scene.add(createOrbitalRing(1.5, 0.008, -0.3, -0.0015));
    scene.add(createOrbitalRing(1.7, 0.006, 0.1, 0.002));

    // Floating particles around globe
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 1.8 + Math.random() * 1.2;
      
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.cos(phi);
      particlePositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      particleVelocities.push({
        theta: Math.random() * 0.002,
        phi: Math.random() * 0.001
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.03,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = { mesh: particles, velocities: particleVelocities };

    // Data nodes with light beams
    const markerGeo = new THREE.SphereGeometry(0.025, 16, 16);
    const beamGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.4, 8);
    
    vehicles.forEach((vehicle, idx) => {
      const phi = (90 - vehicle.latitude) * Math.PI / 180;
      const theta = (vehicle.longitude + 180) * Math.PI / 180;
      const x = 1.08 * Math.sin(phi) * Math.cos(theta);
      const y = 1.08 * Math.cos(phi);
      const z = 1.08 * Math.sin(phi) * Math.sin(theta);

      // Glowing marker
      const markerMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 2
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(x, y, z);
      scene.add(marker);

      // Light beam from marker
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.3
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(x * 0.8, y * 0.8, z * 0.8);
      beam.lookAt(x, y, z);
      scene.add(beam);

      // Point light for glow effect
      const pointLight = new THREE.PointLight(0x00ffff, 0.5, 0.3);
      pointLight.position.set(x, y, z);
      scene.add(pointLight);
    });

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x0088ff, 0.3);
    scene.add(ambientLight);

    // Key lights
    const keyLight1 = new THREE.PointLight(0x00e5ff, 2, 100);
    keyLight1.position.set(3, 3, 3);
    scene.add(keyLight1);

    const keyLight2 = new THREE.PointLight(0x0088ff, 1.5, 100);
    keyLight2.position.set(-3, -2, 2);
    scene.add(keyLight2);

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

      // Rotate globe
      if (globeRef.current) {
        globeRef.current.rotation.y += 0.003;
        globeRef.current.rotation.y += mouseX * 0.002;
        globeRef.current.rotation.x += mouseY * 0.001;
        globeRef.current.material.uniforms.time.value = time;
      }

      // Rotate glow sphere
      if (glowSphere) {
        glowSphere.rotation.y += 0.002;
        glowSphere.material.uniforms.time.value = time;
      }

      // Rotate orbital rings
      ringsRef.current.forEach(ring => {
        ring.rotation.z += ring.userData.rotationSpeed;
      });

      // Animate particles
      if (particlesRef.current.mesh) {
        const positions = particlesRef.current.mesh.geometry.attributes.position.array;
        const velocities = particlesRef.current.velocities;
        
        for (let i = 0; i < particleCount; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          const radius = Math.sqrt(x * x + y * y + z * z);
          let theta = Math.atan2(z, x) + velocities[i].theta;
          let phi = Math.acos(y / radius) + velocities[i].phi;
          
          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.cos(phi);
          positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }
        
        particlesRef.current.mesh.geometry.attributes.position.needsUpdate = true;
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
    <div className="relative w-full h-full">
      {/* 3D Globe Container */}
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}