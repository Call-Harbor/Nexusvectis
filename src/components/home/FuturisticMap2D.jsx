import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function FuturisticMap2D({ vehicles = [], routes = [], resources = [] }) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create globe with real continents
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        bool isLand(float lat, float lon) {
          // North America
          if (lon > -170.0 && lon < -50.0 && lat > 15.0 && lat < 70.0) return true;
          // South America
          if (lon > -80.0 && lon < -35.0 && lat > -55.0 && lat < 12.0) return true;
          // Europe
          if (lon > -10.0 && lon < 40.0 && lat > 35.0 && lat < 70.0) return true;
          // Africa
          if (lon > -20.0 && lon < 50.0 && lat > -35.0 && lat < 37.0) return true;
          // Asia
          if (lon > 40.0 && lon < 150.0 && lat > 0.0 && lat < 70.0) return true;
          // Australia
          if (lon > 110.0 && lon < 155.0 && lat > -45.0 && lat < -10.0) return true;
          return false;
        }
        
        void main() {
          // Convert UV to lat/lon
          float lon = (vUv.x - 0.5) * 360.0;
          float lat = (0.5 - vUv.y) * 180.0;
          
          // Fresnel glow
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          
          // Grid lines
          float gridLat = step(0.98, fract(vUv.y * 18.0));
          float gridLon = step(0.98, fract(vUv.x * 36.0));
          float grid = max(gridLat, gridLon);
          
          // Land detection
          bool land = isLand(lat, lon);
          float landBrightness = land ? 0.5 : 0.0;
          
          // Colors
          vec3 cyan = vec3(0.0, 0.9, 1.0);
          vec3 blue = vec3(0.0, 0.6, 1.0);
          
          vec3 color = mix(blue, cyan, fresnel);
          
          float pulse = sin(time * 0.5) * 0.15 + 0.85;
          float alpha = 0.2 + fresnel * 0.5 + grid * 0.3 + landBrightness;
          
          gl_FragColor = vec4(color * pulse, alpha);
        }
      `
    });
    
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);
    globeRef.current = globe;

    // Outer glow
    const glowGeo = new THREE.SphereGeometry(1.12, 32, 32);
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
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = sin(time * 0.4) * 0.2 + 0.8;
          gl_FragColor = vec4(0.0, 0.7, 1.0, intensity * 0.4 * pulse);
        }
      `
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // Orbital rings
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.006, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 })
    );
    ring1.rotation.x = Math.PI / 2 + 0.3;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.005, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x0099ff, transparent: true, opacity: 0.25 })
    );
    ring2.rotation.x = Math.PI / 2 - 0.2;
    scene.add(ring2);

    // Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.6 + Math.random() * 0.8;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00ddff,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);

    // Vehicle markers
    vehicles.forEach(v => {
      const phi = (90 - v.latitude) * Math.PI / 180;
      const theta = (v.longitude + 180) * Math.PI / 180;
      const x = 1.05 * Math.sin(phi) * Math.cos(theta);
      const y = 1.05 * Math.cos(phi);
      const z = 1.05 * Math.sin(phi) * Math.sin(theta);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
      );
      marker.position.set(x, y, z);
      scene.add(marker);

      const light = new THREE.PointLight(0x00ffff, 0.5, 0.2);
      light.position.set(x, y, z);
      scene.add(light);
    });

    // Lights
    scene.add(new THREE.AmbientLight(0x0066ff, 0.4));
    const keyLight = new THREE.PointLight(0x00aaff, 1.5, 100);
    keyLight.position.set(2, 2, 2);
    scene.add(keyLight);

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      globe.rotation.y += 0.002 + mouseX * 0.001;
      globe.rotation.x += mouseY * 0.0005;
      globe.material.uniforms.time.value = time;
      
      glowMesh.rotation.y += 0.0015;
      glowMesh.material.uniforms.time.value = time;
      
      ring1.rotation.z += 0.0008;
      ring2.rotation.z -= 0.0012;
      
      particlesMesh.rotation.y += 0.0003;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [vehicles]);

  return <div ref={containerRef} className="w-full h-full" />;
}