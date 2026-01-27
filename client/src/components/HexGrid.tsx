import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createHexagonShape } from "../three/hexagon-geometry";
import { getWorldPositionForHex, type HexPosition } from "../three/utils";
import { HEX_SIZE } from "../three/constants";

// --- Eternum-inspired color palette ---
const COLOR_PLAYER = new THREE.Color(0xf5a623);
const COLOR_HOVER_VALID = new THREE.Color(0x44cc44);

// Biome palette for visual variety
const BIOME_COLORS = [
  new THREE.Color(0x5a8c4a), // grassland
  new THREE.Color(0x4a7c59), // forest
  new THREE.Color(0x6b9a5a), // light meadow
  new THREE.Color(0x3d6b47), // dark forest
  new THREE.Color(0x7aaa5a), // bright grassland
  new THREE.Color(0x4e7a3e), // woodland
];

// Slightly brightened version for "adjacent" indication
const BIOME_ADJACENT = [
  new THREE.Color(0x7aac6a),
  new THREE.Color(0x6a9c79),
  new THREE.Color(0x8bba7a),
  new THREE.Color(0x5d8b67),
  new THREE.Color(0x9aca7a),
  new THREE.Color(0x6e9a5e),
];

const NEIGHBOR_DIST = Math.sqrt(3) * HEX_SIZE;
const NEIGHBOR_TOLERANCE = 2.0;

interface HexGridProps {
  width?: number;
  height?: number;
  playerPosition: HexPosition;
  onMove: (pos: HexPosition) => void;
}

function hexKey(pos: HexPosition): string {
  return `${pos.col},${pos.row}`;
}

/** Deterministic biome index from hex coordinates (matches Eternum's hash approach) */
function biomeIndex(hex: HexPosition): number {
  const hash = Math.sin(hex.col * 12.9898 + hex.row * 78.233) * 43758.5453;
  return Math.floor((hash - Math.floor(hash)) * BIOME_COLORS.length);
}

function isNeighbor(a: HexPosition, b: HexPosition): boolean {
  if (a.col === b.col && a.row === b.row) return false;
  const wa = getWorldPositionForHex(a);
  const wb = getWorldPositionForHex(b);
  const dist = Math.sqrt((wa.x - wb.x) ** 2 + (wa.z - wb.z) ** 2);
  return Math.abs(dist - NEIGHBOR_DIST) < NEIGHBOR_TOLERANCE;
}

export default function HexGrid({
  width = 10,
  height = 10,
  playerPosition,
  onMove,
}: HexGridProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const hexesRef = useRef<HexPosition[]>([]);
  const hoveredRef = useRef<number>(-1);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  // Update instance colors based on player position and hover
  const updateColors = useCallback(
    (hoverIndex: number) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const hexes = hexesRef.current;
      const playerKey = hexKey(playerPosition);

      for (let i = 0; i < hexes.length; i++) {
        const key = hexKey(hexes[i]);
        const bi = biomeIndex(hexes[i]);

        if (key === playerKey) {
          mesh.setColorAt(i, COLOR_PLAYER);
        } else if (isNeighbor(hexes[i], playerPosition)) {
          if (i === hoverIndex) {
            mesh.setColorAt(i, COLOR_HOVER_VALID);
          } else {
            mesh.setColorAt(i, BIOME_ADJACENT[bi]);
          }
        } else {
          mesh.setColorAt(i, BIOME_COLORS[bi]);
        }
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    [playerPosition]
  );

  // --- Scene setup (runs once) ---
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    if (container.clientWidth === 0 || container.clientHeight === 0) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3b2d5e);
    scene.fog = new THREE.Fog(0x3b2d5e, 200, 500);

    // Camera (Eternum uses FOV 45)
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    camera.position.set(0, 40, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 15;
    controls.maxDistance = 120;
    controls.panSpeed = 2.0;

    // --- Lighting ---
    // Hemisphere: warm sky + cool ground for natural outdoor feel
    const hemiLight = new THREE.HemisphereLight(0xb0c4de, 0x556b2f, 1.0);
    scene.add(hemiLight);

    // Warm directional sunlight
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.5);
    sunLight.position.set(-10, 25, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 80;
    sunLight.shadow.camera.bottom = -80;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.bias = -0.002;
    scene.add(sunLight);

    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // --- Build hex grid ---
    const hexagonShape = createHexagonShape(HEX_SIZE);
    const hexagonGeometry = new THREE.ShapeGeometry(hexagonShape);

    // White base color so instanceColor directly controls appearance
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      roughness: 0.7,
      metalness: 0.0,
    });

    const hexes: HexPosition[] = [];
    for (
      let row = -Math.floor(height / 2);
      row < Math.ceil(height / 2);
      row++
    ) {
      for (
        let col = -Math.floor(width / 2);
        col < Math.ceil(width / 2);
        col++
      ) {
        hexes.push({ col, row });
      }
    }
    hexesRef.current = hexes;

    // Main hex mesh
    const instancedMesh = new THREE.InstancedMesh(
      hexagonGeometry,
      material,
      hexes.length
    );
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    meshRef.current = instancedMesh;

    // Border/outline hex mesh (slightly larger, dark, sits just below)
    const borderShape = createHexagonShape(HEX_SIZE * 1.04);
    const borderGeometry = new THREE.ShapeGeometry(borderShape);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      flatShading: true,
      roughness: 1.0,
      metalness: 0.0,
    });
    const borderMesh = new THREE.InstancedMesh(
      borderGeometry,
      borderMaterial,
      hexes.length
    );
    borderMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    hexes.forEach((hex, index) => {
      const position = getWorldPositionForHex(hex);

      // Main hex
      dummy.position.set(position.x, 0.05, position.z);
      dummy.rotation.x = -Math.PI / 2;
      const rotationSeed =
        Math.sin(hex.col * 12.9898 + hex.row * 78.233) * 43758.5453;
      const rotationIndex = Math.floor(
        (rotationSeed - Math.floor(rotationSeed)) * 6
      );
      dummy.rotation.z = (rotationIndex * Math.PI) / 3;
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index, dummy.matrix);

      // Set initial biome color
      const bi = biomeIndex(hex);
      instancedMesh.setColorAt(index, BIOME_COLORS[bi]);

      // Border hex (slightly below, slightly larger)
      dummy.position.set(position.x, 0.0, position.z);
      dummy.updateMatrix();
      borderMesh.setMatrixAt(index, dummy.matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor)
      instancedMesh.instanceColor.needsUpdate = true;
    borderMesh.instanceMatrix.needsUpdate = true;

    scene.add(borderMesh);
    scene.add(instancedMesh);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(400, 400);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b1e2b,
      roughness: 0.9,
      metalness: 0.0,
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

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      hexagonGeometry.dispose();
      material.dispose();
      borderGeometry.dispose();
      borderMaterial.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      controls.dispose();
    };
  }, [width, height]);

  // Re-color when player moves
  useEffect(() => {
    updateColors(hoveredRef.current);
  }, [playerPosition, updateColors]);

  // Mouse interaction
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const camera = cameraRef.current;
      const mesh = meshRef.current;
      if (!camera || !mesh) return;

      raycaster.current.setFromCamera(pointer.current, camera);
      const intersects = raycaster.current.intersectObject(mesh);

      let newHover = -1;
      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const idx = intersects[0].instanceId;
        const hex = hexesRef.current[idx];
        if (hex && isNeighbor(hex, playerPosition)) {
          newHover = idx;
          container.style.cursor = "pointer";
        } else {
          container.style.cursor = "default";
        }
      } else {
        container.style.cursor = "default";
      }

      if (newHover !== hoveredRef.current) {
        hoveredRef.current = newHover;
        updateColors(newHover);
      }
    };

    const onClick = () => {
      const idx = hoveredRef.current;
      if (idx >= 0) {
        const hex = hexesRef.current[idx];
        if (hex) {
          onMove(hex);
        }
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("click", onClick);

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("click", onClick);
    };
  }, [playerPosition, onMove, updateColors]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    />
  );
}
