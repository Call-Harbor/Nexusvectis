import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function FuturisticMap2D({ vehicles = [], routes = [], resources = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Main globe with detailed shader
    const globeGeo = new THREE.SphereGeometry(1, 128, 128);
    const globeMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { 
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1024, 512) }
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
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        bool isLand(float lat, float lon) {
          // North America
          if (lon > -170.0 && lon < -50.0 && lat > 15.0 && lat < 72.0) {
            if (lon > -100.0 && lon < -80.0 && lat > 25.0 && lat < 48.0) return true; // USA East
            if (lon > -125.0 && lon < -100.0 && lat > 30.0 && lat < 50.0) return true; // USA West
            if (lon > -95.0 && lon < -75.0 && lat > 18.0 && lat < 32.0) return true; // Mexico
            if (lon > -165.0 && lon < -130.0 && lat > 55.0 && lat < 70.0) return true; // Alaska
          }
          // South America
          if (lon > -82.0 && lon < -34.0 && lat > -56.0 && lat < 13.0) {
            if (lon > -80.0 && lon < -35.0 && lat > -35.0 && lat < 12.0) return true;
          }
          // Europe
          if (lon > -10.0 && lon < 40.0 && lat > 36.0 && lat < 71.0) {
            if (lat > 40.0 || lon > 0.0) return true; // Most of Europe
          }
          // Africa
          if (lon > -18.0 && lon < 52.0 && lat > -35.0 && lat < 38.0) {
            if (lat < 35.0) return true; // Most of Africa
          }
          // Asia
          if (lon > 40.0 && lon < 180.0 && lat > -10.0 && lat < 75.0) {
            if (lon > 50.0 && lat > 10.0) return true; // Asia mainland
            if (lon > 100.0 && lat > -10.0 && lat < 25.0) return true; // Southeast Asia
          }
          // Australia
          if (lon > 113.0 && lon < 154.0 && lat > -44.0 && lat < -10.0) return true;
          return false;
        }
        
        void main() {
          float lon = (vUv.x - 0.5) * 360.0;
          float lat = (0.5 - vUv.y) * 180.0;
          
          // Fresnel glow - stronger effect
          vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.0);
          
          // Fine grid lines
          float gridLat = smoothstep(0.98, 1.0, fract(vUv.y * 20.0));
          float gridLon = smoothstep(0.98, 1.0, fract(vUv.x * 40.0));
          float grid = max(gridLat, gridLon);
          
          // Continents with noise detail
          bool land = isLand(lat, lon);
          float landNoise = random(vUv * 100.0) * 0.15;
          float landBrightness = land ? (0.6 + landNoise) : 0.0;
          
          // Dot pattern for city lights
          float dots = 0.0;
          if (land && random(floor(vUv * 200.0)) > 0.97) {
            dots = 0.3;
          }
          
          // Vibrant cyan/blue palette
          vec3 brightCyan = vec3(0.0, 1.0, 1.0);
          vec3 deepBlue = vec3(0.0, 0.4, 1.0);
          vec3 electricBlue = vec3(0.2, 0.8, 1.0);
          
          // Dynamic color mixing
          vec3 baseColor = mix(deepBlue, brightCyan, fresnel * 0.7);
          baseColor = mix(baseColor, electricBlue, vUv.y * 0.3);
          
          // Pulsing animation
          float pulse = sin(time * 0.8) * 0.15 + 1.0;
          
          // Combine all elements
          vec3 finalColor = baseColor * pulse;
          finalColor += vec3(grid * 0.4);
          finalColor += vec3(landBrightness * brightCyan);
          finalColor += vec3(dots) * brightCyan * 2.0;
          
          float alpha = 0.3 + fresnel * 0.6 + grid * 0.2 + landBrightness * 0.3;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    });
    
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Intense outer glow
    const glowGeo = new THREE.SphereGeometry(1.18, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
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
          float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          float pulse = sin(time * 0.5) * 0.3 + 0.7;
          vec3 glowColor = vec3(0.0, 0.9, 1.0);
          gl_FragColor = vec4(glowColor, intensity * 0.7 * pulse);
        }
      `
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // Bright orbital rings
    const createRing = (radius, thickness, tilt, color, opacity) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, thickness, 16, 100),
        new THREE.MeshBasicMaterial({ 
          color, 
          transparent: true, 
          opacity,
          blending: THREE.AdditiveBlending
        })
      );
      ring.rotation.x = Math.PI / 2 + tilt;
      return ring;
    };

    const ring1 = createRing(1.3, 0.008, 0.25, 0x00ffff, 0.5);
    const ring2 = createRing(1.5, 0.006, -0.2, 0x0099ff, 0.4);
    const ring3 = createRing(1.7, 0.005, 0.15, 0x0066ff, 0.3);
    scene.add(ring1, ring2, ring3);

    // Bright particles
    const particleCount = 400;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.7 + Math.random() * 1.0;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      
      colors[i * 3] = 0.0;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      colors[i * 3 + 2] = 1.0;
    }
    
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.025,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Bright vehicle markers
    vehicles.forEach(v => {
      const phi = (90 - v.latitude) * Math.PI / 180;
      const theta = (v.longitude + 180) * Math.PI / 180;
      const x = 1.06 * Math.sin(phi) * Math.cos(theta);
      const y = 1.06 * Math.cos(phi);
      const z = 1.06 * Math.sin(phi) * Math.sin(theta);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 16, 16),
        new THREE.MeshBasicMaterial({ 
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 2
        })
      );
      marker.position.set(x, y, z);
      scene.add(marker);

      const light = new THREE.PointLight(0x00ffff, 1, 0.3);
      light.position.set(x, y, z);
      scene.add(light);
    });

    // Bright lighting
    scene.add(new THREE.AmbientLight(0x0088ff, 0.6));
    const key1 = new THREE.PointLight(0x00ddff, 2, 100);
    key1.position.set(3, 3, 3);
    scene.add(key1);
    
    const key2 = new THREE.PointLight(0x0099ff, 1.5, 100);
    key2.position.set(-3, 2, 2);
    scene.add(key2);

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e) => {
      if (!containerRef.current) return;
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
      globe.rotation.x = mouseY * 0.15;
      globe.material.uniforms.time.value = time;
      
      glowMesh.rotation.y += 0.0015;
      glowMesh.material.uniforms.time.value = time;
      
      ring1.rotation.z += 0.001;
      ring2.rotation.z -= 0.0015;
      ring3.rotation.z += 0.0008;
      
      particles.rotation.y += 0.0005;

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
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [vehicles]);

  return <div ref={containerRef} className="w-full h-full" />;
}