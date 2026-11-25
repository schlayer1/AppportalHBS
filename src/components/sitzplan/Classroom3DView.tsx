import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FixtureItem, RoomLayout, TableItem } from '../../types/sitzplanTypes';
import { buildSeatGraph } from './sitzplanEngine';

export type View3DMode = 'orbit' | 'teacher' | 'seat';

interface Classroom3DViewProps {
  room: RoomLayout;
  assignment: Record<string, string>;
  students: Array<{ id: string; name: string }>;
  view: View3DMode;
  focusSeat: string | null;
}

const SCALE = 0.01; // 100 px = 1 m

function makeBox(
  w: number,
  h: number,
  d: number,
  color: string,
  roughness = 0.7,
  metalness = 0
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildFixture3D(f: FixtureItem): THREE.Group {
  const g = new THREE.Group();
  g.position.set(f.x * SCALE, 0, f.y * SCALE);
  g.rotation.y = (-f.rot * Math.PI) / 180;

  const w = f.w * SCALE;
  const d = Math.max(f.h * SCALE, 0.04);

  switch (f.kind) {
    case 'board': {
      const frame = makeBox(w + 0.08, 1.24, 0.05, '#9aa0a3', 0.4, 0.5);
      frame.position.set(0, 1.4, 0);
      const surface = makeBox(w, 1.12, 0.02, '#1B4D3E', 0.95);
      surface.position.set(0, 1.4, 0.03);
      const tray = makeBox(w, 0.03, 0.1, '#9aa0a3', 0.4, 0.5);
      tray.position.set(0, 0.82, 0.08);
      const sponge = makeBox(0.12, 0.04, 0.06, '#F39200');
      sponge.position.set(-w * 0.3, 0.85, 0.08);
      g.add(frame, surface, tray, sponge);
      [0.1, 0.16, 0.2].forEach((cx) => {
        const chalk = makeBox(0.05, 0.012, 0.012, '#f5f5f0');
        chalk.position.set(cx, 0.845, 0.09);
        g.add(chalk);
      });
      break;
    }
    case 'window': {
      const frame = makeBox(w, 1.3, 0.08, '#f4f1ea');
      frame.position.set(0, 1.55, 0);
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(0.1, w - 0.08), 1.2, 0.02),
        new THREE.MeshStandardMaterial({
          color: '#cfe6f2',
          roughness: 0.05,
          transparent: true,
          opacity: 0.55,
        })
      );
      glass.position.set(0, 1.55, 0.02);
      const mullionV = makeBox(0.04, 1.2, 0.03, '#f4f1ea');
      mullionV.position.set(0, 1.55, 0.04);
      const mullionH = makeBox(Math.max(0.1, w - 0.08), 0.04, 0.03, '#f4f1ea');
      mullionH.position.set(0, 1.55, 0.04);
      const sill = makeBox(w, 0.04, 0.2, '#e8e2d6');
      sill.position.set(0, 0.88, 0.1);
      g.add(frame, glass, mullionV, mullionH, sill);
      break;
    }
    case 'door': {
      const frame = makeBox(w + 0.1, 2.08, 0.06, '#e8e2d6');
      frame.position.set(0, 1.02, 0);
      const leaf = makeBox(Math.max(0.1, w - 0.04), 2, 0.04, '#a07a54', 0.6);
      leaf.position.set(0, 1, 0.03);
      const handle = makeBox(0.12, 0.025, 0.03, '#c9ccce', 0.3, 0.8);
      handle.position.set(w * 0.35, 1, 0.07);
      g.add(frame, leaf, handle);
      break;
    }
    case 'desk': {
      const top = makeBox(w, 0.04, d, '#a8805a');
      top.position.set(0, 0.74, 0);
      const drawers = makeBox(0.38, 0.72, Math.max(0.1, d - 0.04), '#b99470');
      drawers.position.set(-w / 2 + 0.2, 0.36, 0);
      const book = makeBox(0.3, 0.04, 0.22, '#e9e4da');
      book.position.set(w * 0.15, 0.78, 0);
      g.add(top, drawers, book);
      [-1, 1].forEach((side) => {
        const leg = makeBox(0.04, 0.72, 0.04, '#5d6366', 0.4, 0.6);
        leg.position.set(w / 2 - 0.04, 0.36, side * (d / 2 - 0.04));
        g.add(leg);
      });
      break;
    }
    case 'cabinet': {
      const body = makeBox(w, 1.65, d, '#c8a274');
      body.position.set(0, 0.825, 0);
      g.add(body);
      break;
    }
    case 'sink': {
      const basin = makeBox(w, 0.85, d, '#f1f5f9', 0.3);
      basin.position.set(0, 0.425, 0);
      const tap = makeBox(0.04, 0.2, 0.08, '#94a3b8', 0.2, 0.8);
      tap.position.set(0, 0.92, -d * 0.3);
      g.add(basin, tap);
      break;
    }
    case 'carpet': {
      const rug = makeBox(w, 0.015, d, '#00A896', 0.95);
      rug.position.set(0, 0.008, 0);
      g.add(rug);
      break;
    }
    case 'bin': {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(w / 2, w / 2.4, 0.4, 20, 1, true),
        new THREE.MeshStandardMaterial({ color: '#0B7BA7', side: THREE.DoubleSide })
      );
      mesh.position.set(0, 0.2, 0);
      mesh.castShadow = true;
      g.add(mesh);
      break;
    }
    case 'stool': {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(w / 2, w / 2, 0.4, 20),
        new THREE.MeshStandardMaterial({ color: '#d9a35f' })
      );
      base.position.set(0, 0.2, 0);
      base.castShadow = true;
      g.add(base);
      break;
    }
    case 'readingTable': {
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(w / 2, w / 2, 0.04, 28),
        new THREE.MeshStandardMaterial({ color: '#c8a274' })
      );
      top.position.set(0, 0.54, 0);
      top.castShadow = true;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.52, 10),
        new THREE.MeshStandardMaterial({ color: '#5d6366', metalness: 0.6 })
      );
      post.position.set(0, 0.27, 0);
      g.add(top, post);
      break;
    }
    case 'bookshelf': {
      const body = makeBox(w, 1.5, d, '#9b7653');
      body.position.set(0, 0.75, 0);
      g.add(body);
      const colors = ['#0B7BA7', '#00A896', '#F39200', '#5f8a76', '#7a5c8f'];
      const cols = Math.max(2, Math.floor(w / 0.07) - 1);
      [0.12, 0.6, 1.08].forEach((shelfY, si) => {
        for (let bi = 0; bi < cols; bi++) {
          const book = makeBox(
            0.045,
            0.25 + ((bi * 7 + si) % 3) * 0.03,
            Math.max(0.08, d - 0.08),
            colors[(bi + si * 2) % colors.length]
          );
          book.position.set(-w / 2 + 0.06 + bi * 0.06, shelfY + 0.15, 0.02);
          g.add(book);
        }
      });
      break;
    }
    case 'bench': {
      const seat = makeBox(w, 0.12, d, '#a9705a', 0.9);
      seat.position.set(0, 0.3, 0);
      g.add(seat);
      [-1, 1].forEach((side) => {
        const leg = makeBox(0.06, 0.24, Math.max(0.08, d - 0.04), '#7a5440');
        leg.position.set(side * (w / 2 - 0.05), 0.12, 0);
        g.add(leg);
      });
      break;
    }
  }
  return g;
}

function buildTable3D(t: TableItem): THREE.Group {
  const g = new THREE.Group();
  g.position.set(t.x * SCALE, 0, t.y * SCALE);
  g.rotation.y = (-t.rot * Math.PI) / 180;
  const w = t.w * SCALE;
  const d = t.h * SCALE;

  const top = makeBox(w, 0.03, d, '#c8a274', 0.55);
  top.position.set(0, 0.74, 0);
  const apron = makeBox(Math.max(0.1, w - 0.04), 0.02, Math.max(0.1, d - 0.04), '#e9e4da');
  apron.position.set(0, 0.72, 0);
  g.add(top, apron);

  const legMat = new THREE.MeshStandardMaterial({ color: '#5d6366', metalness: 0.7, roughness: 0.35 });
  const legGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.72, 8);
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx * (w / 2 - 0.04), 0.36, lz * (d / 2 - 0.04));
    leg.castShadow = true;
    g.add(leg);
  });

  return g;
}

function buildChair3D(color: string): THREE.Group {
  const g = new THREE.Group();
  const seat = makeBox(0.38, 0.03, 0.36, color, 0.6);
  seat.position.set(0, 0.44, 0);
  g.add(seat);

  const legMat = new THREE.MeshStandardMaterial({ color: '#5d6366', metalness: 0.7, roughness: 0.35 });
  const legGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.44, 6);
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx * 0.17, 0.22, lz * 0.16);
    leg.castShadow = true;
    g.add(leg);
  });

  const postGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.36, 6);
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(postGeo, legMat);
    post.position.set(side * 0.17, 0.62, 0.17);
    g.add(post);
  });

  const back = makeBox(0.38, 0.16, 0.025, color, 0.6);
  back.position.set(0, 0.72, 0.18);
  back.rotation.x = -0.12;
  g.add(back);

  return g;
}

interface LabelPos {
  id: string;
  name: string;
  x: number;
  y: number;
  visible: boolean;
  focused: boolean;
}

export const Classroom3DView: React.FC<Classroom3DViewProps> = ({
  room,
  assignment,
  students,
  view,
  focusSeat,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [labels, setLabels] = useState<LabelPos[]>([]);

  const graph = useMemo(() => buildSeatGraph(room), [room]);
  const tableMap = useMemo(() => new Map(room.tables.map((t) => [t.id, t])), [room.tables]);
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const u = room.w * SCALE;
    const d = room.h * SCALE;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F3EFE6');
    scene.fog = new THREE.Fog('#F3EFE6', 14, 30);

    const camera = new THREE.PerspectiveCamera(
      view === 'orbit' ? 50 : 65,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.05,
      100
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const hemi = new THREE.HemisphereLight('#fff6e8', '#a8957a', 0.7);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight('#fff1dc', 1.45);
    dir.position.set(u + 3, 7, d * 0.3);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -12;
    dir.shadow.camera.right = 12;
    dir.shadow.camera.top = 12;
    dir.shadow.camera.bottom = -12;
    scene.add(dir);

    // Floor & Grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(u, d),
      new THREE.MeshStandardMaterial({ color: '#d6c09b', roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(u / 2, 0, d / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(
      Math.max(u, d),
      Math.round(Math.max(u, d) / 0.5),
      '#c4ac85',
      '#c4ac85'
    );
    grid.position.set(u / 2, 0.002, d / 2);
    scene.add(grid);

    // Walls
    const isFirstPerson = view !== 'orbit';
    const frontWall = makeBox(u + 0.2, 3, 0.1, '#efe8da', 0.95);
    frontWall.position.set(u / 2, 1.5, -0.05);
    frontWall.castShadow = false;
    const leftWall = makeBox(0.1, 3, d, '#ebe3d3', 0.95);
    leftWall.position.set(-0.05, 1.5, d / 2);
    leftWall.castShadow = false;
    const rightWall = makeBox(0.1, isFirstPerson ? 3 : 1, d, '#ebe3d3', 0.95);
    rightWall.position.set(u + 0.05, isFirstPerson ? 1.5 : 0.5, d / 2);
    rightWall.castShadow = false;
    scene.add(frontWall, leftWall, rightWall);

    if (isFirstPerson) {
      const backWall = makeBox(u + 0.2, 3, 0.1, '#efe8da', 0.95);
      backWall.position.set(u / 2, 1.5, d + 0.05);
      backWall.castShadow = false;
      scene.add(backWall);
    }

    // Fixtures & Tables
    room.fixtures.forEach((f) => scene.add(buildFixture3D(f)));
    room.tables.forEach((t) => scene.add(buildTable3D(t)));

    // Chairs & Label anchors
    const labelAnchors: Array<{ id: string; name: string; pos: THREE.Vector3; focused: boolean }> = [];
    graph.seats.forEach((seat) => {
      const studId = assignment[seat.id];
      const name = studId ? studentMap.get(studId) : undefined;
      const isFocused = seat.id === focusSeat;
      const color = isFocused ? '#F39200' : name ? '#0B7BA7' : '#b5b5b5';
      const chair = buildChair3D(color);
      const t = tableMap.get(seat.tableId);
      const rotY = t ? Math.atan2(seat.x - t.x, seat.y - t.y) : 0;
      chair.position.set(seat.x * SCALE, 0, seat.y * SCALE);
      chair.rotation.y = rotY;
      scene.add(chair);

      const hideSelfLabel = isFirstPerson && view === 'seat' && isFocused;
      if (name && !hideSelfLabel) {
        labelAnchors.push({
          id: seat.id,
          name,
          pos: new THREE.Vector3(seat.x * SCALE, isFirstPerson ? 0.95 : 1.05, seat.y * SCALE),
          focused: isFocused,
        });
      }
    });

    // Camera & controls setup
    const board = room.fixtures.find((f) => f.kind === 'board');
    const boardTarget = new THREE.Vector3(
      board ? board.x * SCALE : u / 2,
      1.3,
      board ? board.y * SCALE : 0
    );

    let orbitControls: OrbitControls | null = null;
    const lookState = { yaw: 0, pitch: 0, fov: 65 };
    const pointers = new Map<number, { x: number; y: number }>();
    let lastDrag: { x: number; y: number } | null = null;
    let lastPinchDist = 0;

    if (view === 'orbit') {
      camera.position.set(u / 2, Math.max(u, d) * 0.85, d * 1.3);
      orbitControls = new OrbitControls(camera, renderer.domElement);
      orbitControls.target.set(u / 2, 0, d / 2);
      orbitControls.maxPolarAngle = Math.PI / 2.1;
      orbitControls.enableDamping = true;
      orbitControls.minDistance = 2;
      orbitControls.maxDistance = 25;
      orbitControls.update();
    } else {
      let eye: THREE.Vector3;
      let look: THREE.Vector3;
      const seatTarget = focusSeat ? graph.seats.find((s) => s.id === focusSeat) : undefined;
      if (view === 'seat' && seatTarget) {
        const t = tableMap.get(seatTarget.tableId);
        const angle = t ? Math.atan2(seatTarget.x - t.x, seatTarget.y - t.y) : 0;
        eye = new THREE.Vector3(
          seatTarget.x * SCALE + Math.sin(angle) * 0.08,
          1.12,
          seatTarget.y * SCALE + Math.cos(angle) * 0.08
        );
        look = boardTarget.clone();
      } else {
        const desk = room.fixtures.find((f) => f.kind === 'desk');
        eye = board
          ? new THREE.Vector3(boardTarget.x, 1.65, boardTarget.z + 0.35)
          : desk
            ? new THREE.Vector3(desk.x * SCALE, 1.65, desk.y * SCALE)
            : new THREE.Vector3(u / 2, 1.65, 0.6);
        look = new THREE.Vector3(u / 2, 0.75, d * 0.6);
      }
      camera.position.copy(eye);
      const dirVec = look.clone().sub(eye);
      lookState.yaw = Math.atan2(-dirVec.x, -dirVec.z);
      lookState.pitch = Math.atan2(dirVec.y, Math.hypot(dirVec.x, dirVec.z));
      camera.rotation.set(lookState.pitch, lookState.yaw, 0, 'YXZ');
    }

    const dom = renderer.domElement;
    dom.style.touchAction = 'none';

    const onDown = (e: PointerEvent) => {
      if (view === 'orbit') return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      lastDrag = { x: e.clientX, y: e.clientY };
      dom.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (view === 'orbit' || !pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinchDist) {
          lookState.fov = Math.max(30, Math.min(85, lookState.fov - (dist - lastPinchDist) * 0.1));
        }
        lastPinchDist = dist;
        return;
      }
      if (!lastDrag) return;
      const sens = (lookState.fov / 65) * 0.005;
      lookState.yaw += (e.clientX - lastDrag.x) * sens;
      lookState.pitch = Math.max(-1.2, Math.min(1.2, lookState.pitch + (e.clientY - lastDrag.y) * sens));
      lastDrag = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      lastPinchDist = 0;
      lastDrag = [...pointers.values()][0] ?? null;
    };
    const onWheel = (e: WheelEvent) => {
      if (view === 'orbit') return;
      e.preventDefault();
      lookState.fov = Math.max(30, Math.min(85, lookState.fov + e.deltaY * 0.03));
    };

    if (isFirstPerson) {
      dom.addEventListener('pointerdown', onDown);
      dom.addEventListener('pointermove', onMove);
      dom.addEventListener('pointerup', onUp);
      dom.addEventListener('pointercancel', onUp);
      dom.addEventListener('wheel', onWheel, { passive: false });
    }

    const onResize = () => {
      if (!container) return;
      const cw = Math.max(1, container.clientWidth);
      const ch = Math.max(1, container.clientHeight);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    let rafId = 0;
    const projVec = new THREE.Vector3();
    const renderLoop = () => {
      rafId = requestAnimationFrame(renderLoop);
      if (orbitControls) {
        orbitControls.update();
      } else {
        camera.rotation.set(lookState.pitch, lookState.yaw, 0, 'YXZ');
        if (Math.abs(camera.fov - lookState.fov) > 0.01) {
          camera.fov = lookState.fov;
          camera.updateProjectionMatrix();
        }
      }
      renderer.render(scene, camera);

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const nextLabels: LabelPos[] = labelAnchors.map((la) => {
        projVec.copy(la.pos).project(camera);
        return {
          id: la.id,
          name: la.name,
          x: (projVec.x * 0.5 + 0.5) * cw,
          y: (-projVec.y * 0.5 + 0.5) * ch,
          visible: projVec.z >= -1 && projVec.z <= 1,
          focused: la.focused,
        };
      });
      setLabels(nextLabels);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      orbitControls?.dispose();
      if (isFirstPerson) {
        dom.removeEventListener('pointerdown', onDown);
        dom.removeEventListener('pointermove', onMove);
        dom.removeEventListener('pointerup', onUp);
        dom.removeEventListener('pointercancel', onUp);
        dom.removeEventListener('wheel', onWheel);
      }
      renderer.dispose();
    };
  }, [room, assignment, view, focusSeat, graph, tableMap, studentMap]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#F3EFE6] border border-hbs-slate-border">
      <div
        ref={mountRef}
        className={`h-full w-full ${view !== 'orbit' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      />
      {/* Projected Student Name Badges */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {labels.map(
          (l) =>
            l.visible && (
              <div
                key={l.id}
                style={{ left: l.x, top: l.y }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-bold shadow-sm transition-colors ${
                  l.focused
                    ? 'bg-hbs-amber text-white ring-2 ring-white'
                    : 'bg-white/95 text-hbs-slate-dark border border-hbs-slate-border/80'
                }`}
              >
                {l.name}
              </div>
            )
        )}
      </div>
      {view !== 'orbit' && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/95 border border-hbs-slate-border px-3.5 py-1.5 text-xs font-semibold text-hbs-slate-dark shadow-md">
          Ziehen zum Umschauen · Scrollen / zwei Finger zum Zoomen
        </div>
      )}
    </div>
  );
};
