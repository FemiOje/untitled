import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createHexagonShape } from "../three/hexagon-geometry";
import { getWorldPositionForHex, type HexPosition } from "../three/utils";
import { HEX_SIZE } from "../three/constants";

interface HexGridProps {
  width?: number;
  height?: number;
}

export default function HexGrid({ width = 10, height = 10 }: HexGridProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      console.warn("HexGrid container not found");
      return;
    }

    // Ensure the container has dimensions
    const container = mountRef.current;
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn("HexGrid container has no dimensions");
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87a0b1);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Create hexagon geometry
    const hexagonShape = createHexagonShape(HEX_SIZE);
    const hexagonGeometry = new THREE.ShapeGeometry(hexagonShape);
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      flatShading: true,
    });

    // Create grid of hexagons using InstancedMesh for efficiency
    const hexes: HexPosition[] = [];
    for (let row = -Math.floor(height / 2); row < Math.ceil(height / 2); row++) {
      for (let col = -Math.floor(width / 2); col < Math.ceil(width / 2); col++) {
        hexes.push({ col, row });
      }
    }

    const instanceCount = hexes.length;
    const instancedMesh = new THREE.InstancedMesh(hexagonGeometry, material, instanceCount);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    // Set positions for each hex instance
    const dummy = new THREE.Object3D();
    hexes.forEach((hex, index) => {
      const position = getWorldPositionForHex(hex);
      dummy.position.set(position.x, 0, position.z);
      dummy.rotation.x = -Math.PI / 2; // Rotate to lay flat
      
      // Optional: Add slight random rotation for visual variety
      const rotationSeed = Math.sin(hex.col * 12.9898 + hex.row * 78.233) * 43758.5453;
      const rotationIndex = Math.floor((rotationSeed - Math.floor(rotationSeed)) * 6);
      dummy.rotation.z = (rotationIndex * Math.PI) / 3;
      
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index, dummy.matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4a3a,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      hexagonGeometry.dispose();
      material.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      controls.dispose();
    };
  }, [width, height]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: "100%", 
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0
      }} 
    />
  );
}
