<template>
  <v-card class="viewer-card" style="padding: 24px 16px; border-radius: 24px;">
    <v-btn
      icon="mdi-close"
      variant="text"
      size="small"
      @click="emit('close')"
      class="close-btn"
    />

    <v-card-title>
      <v-row no-gutters class="align-center justify-center viewer-title">
        {{ props.title || 'AI 데이터 뷰어' }}
      </v-row>
    </v-card-title>

    <v-card-text class="viewer-body">
      <div class="viewer-layout">

        <!-- ── 왼쪽: 3D / 2D / IMG 패널 ── -->
        <section class="canvas-panel">

          <!-- Three.js 마운트 포인트 (항상 DOM에 존재, 탭으로 가려짐) -->
          <div ref="threeContainerRef" class="three-stage" />

          <!-- 탭 전환 버튼 -->
          <div class="tab-bar">
            <button
              v-for="tab in ['3D', '2D']"
              :key="tab"
              :class="['tab-btn', { active: activeTab === tab }]"
              @click="switchTab(tab)"
            >{{ tab }}</button>
          </div>

          <!-- 2D 스켈레톤 오버레이 -->
          <transition name="fade">
            <div v-if="activeTab === '2D'" class="overlay-panel">
              <div v-if="props.imagePath" class="image-overlay-wrap">
                <img
                  ref="imageRef"
                  :src="props.imagePath"
                  class="canvas-image-native"
                  alt="reference"
                  @load="handleImageLoad"
                />
                <canvas ref="overlayRef" class="overlay-canvas" />
              </div>
              <div v-else class="canvas-empty">이미지 없음</div>
            </div>
          </transition>

          <!-- HUD: 카메라 정보 -->
          <div class="canvas-card hud-top-left">
            <div class="hud-label">카메라 정보</div>
            <div class="hud-main">{{ displayLensMain }}</div>
            <div class="hud-sub">{{ displayLensSub }}</div>
            
            <!-- 신규 추가된 카메라 세부 속성 레이아웃 -->
            <div class="cam-detail-grid">
              <div class="cam-tag"><span>View</span><strong>{{ displayAngleVisual }}</strong></div>
              <div class="cam-tag"><span>Pitch</span><strong>{{ displayPitchCal }}°</strong></div>
              <div class="cam-tag"><span>Roll</span><strong>{{ displayRoll }}</strong></div>
              <div class="cam-tag"><span>Orient</span><strong>{{ displayOrientation }}</strong></div>
              <div class="cam-tag"><span>Viewpoint</span><strong>{{ displayPhotographer }}</strong></div>
              <div class="cam-tag"><span>Env</span><strong>{{ displayIndoorOutdoor }}</strong></div>
            </div>
            
            <div class="hud-model">{{ displayLensModel }}</div>
          </div>

          <!-- HUD: 피사체 정보 -->
          <div class="canvas-card hud-bottom-left">
            <div class="hud-label">피사체 정보</div>
            <div class="subject-main">{{ displayShotType }}</div>
            <div class="subject-line"><span>shot confidence</span><strong>{{ displayShotConf }}</strong></div>
            <div class="subject-line"><span>estimated distance</span><strong>{{ displayDistance }}</strong></div>
            <div class="subject-line"><span>shoulder ratio</span><strong>{{ displayShoulderRatio }}</strong></div>
            <div class="subject-line"><span>body type</span><strong>{{ displayBodyType }}</strong></div>
            <div class="subject-line"><span>nose position</span><strong>{{ displayNose }}</strong></div>
          </div>
        </section>

        <!-- ── 오른쪽: 메트릭 패널 ── -->
        <aside class="info-panel">
          <div class="panel-section dashboard-summary">
            <div class="section-label">Overall Review</div>
            <div class="summary-card">
              <div class="main-score">
                <span class="score-num">5.0</span>
                <span class="score-max">/ 5.0</span>
              </div>
              <div class="summary-meta">
                <div class="focus-badge">{{ props.aiData?.scores?.gfocus || 'FULL REVIEW' }}</div>
                <div class="aesthetic-row">
                  <span>Aesthetic Score</span>
                  <strong class="text-highlight">{{ props.aiData?.scores?.aesthetic || 4 }}.0</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-label">Global Quality</div>
            <div class="metrics-grid">
              <div class="metric-box">
                <div class="metric-info">
                  <span class="metric-name">조명 (Lighting)</span>
                  <span class="metric-val">{{ props.aiData?.scores?.global?.lighting || 5 }}</span>
                </div>
                <div class="metric-bar-track">
                  <div class="metric-bar-fill" :style="{ width: ((props.aiData?.scores?.global?.lighting || 5) / 5 * 100) + '%' }"></div>
                </div>
              </div>

              <div class="metric-box">
                <div class="metric-info">
                  <span class="metric-name">선명도 (Sharpness)</span>
                  <span class="metric-val">{{ props.aiData?.scores?.global?.sharpness || 5 }}</span>
                </div>
                <div class="metric-bar-track">
                  <div class="metric-bar-fill" :style="{ width: ((props.aiData?.scores?.global?.sharpness || 5) / 5 * 100) + '%' }"></div>
                </div>
              </div>

              <div class="metric-box">
                <div class="metric-info">
                  <span class="metric-name">구도 (Composition)</span>
                  <span class="metric-val text-four">{{ props.aiData?.scores?.global?.composition || 4 }}</span>
                </div>
                <div class="metric-bar-track">
                  <div class="metric-bar-fill fill-four" :style="{ width: ((props.aiData?.scores?.global?.composition || 4) / 5 * 100) + '%' }"></div>
                </div>
              </div>

              <div class="metric-box">
                <div class="metric-info">
                  <span class="metric-name">배경 깔끔도 (Background)</span>
                  <span class="metric-val text-four">{{ props.aiData?.scores?.global?.background_cleanliness || 4 }}</span>
                </div>
                <div class="metric-bar-track">
                  <div class="metric-bar-fill fill-four" :style="{ width: ((props.aiData?.scores?.global?.background_cleanliness || 4) / 5 * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-label">Garment Detail Analysis</div>
            <div class="garment-container">
              <div class="garment-column">
                <div class="garment-header top-style">TOP</div>
                <div class="garment-body">
                  <div class="garment-row"><span>Color</span><strong>{{ props.aiData?.scores?.topColor || 5 }}</strong></div>
                  <div class="garment-row"><span>Detail</span><strong>{{ props.aiData?.scores?.topDetail || 5 }}</strong></div>
                  <div class="garment-row"><span>Silhouette</span><strong>{{ props.aiData?.scores?.topSilhouette || 5 }}</strong></div>
                  <div class="garment-divider"></div>
                  <div class="garment-row total-row"><span>Overall</span><strong>{{ props.aiData?.scores?.topOverall || 5 }}</strong></div>
                </div>
              </div>

              <div class="garment-column">
                <div class="garment-header bot-style">BOTTOM</div>
                <div class="garment-body">
                  <div class="garment-row"><span>Color</span><strong>{{ props.aiData?.scores?.botColor || 5 }}</strong></div>
                  <div class="garment-row"><span>Detail</span><strong class="text-four">{{ props.aiData?.scores?.botDetail || 4 }}</strong></div>
                  <div class="garment-row"><span>Silhouette</span><strong>{{ props.aiData?.scores?.botSilhouette || 5 }}</strong></div>
                  <div class="garment-divider"></div>
                  <div class="garment-row total-row"><span>Overall</span><strong>{{ props.aiData?.scores?.botOverall || 5 }}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// ─────────── Props / Emits ───────────
const props = defineProps({
  aiDocs:    { type: String, default: '' },
  title:     { type: String, default: '' },
  imagePath: { type: String, default: '' },
});
const emit = defineEmits(['close']);

// ─────────── 탭 ───────────
const activeTab = ref('3D'); // '3D' | '2D'

function switchTab(tab) {
  activeTab.value = tab;
  if (tab === '2D') nextTick(() => drawSkeleton());
}

// ─────────── DOM refs ───────────
const threeContainerRef = ref(null);
const imageRef          = ref(null);
const overlayRef        = ref(null);

// ─────────── Three.js 씬 상태 (모듈 스코프 변수) ───────────
let renderer     = null;
let threeScene   = null;
let threeCamera  = null;
let controls     = null;
let animId       = null;
let skelGroup    = null;
let camMarker    = null;
let resizeObs    = null;
let threeReady   = false;

// ─────────── COCO-17 / DWPose-133 연결 ───────────
const COCO17 = [
  [0,1],[0,2],[1,3],[2,4],
  [5,6],[5,7],[7,9],[6,8],[8,10],
  [5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16],
];
const FOOT = [[15,17],[17,18],[15,19],[16,20],[20,21],[16,22]];
const HAND = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
];
const FACE = (() => {
  const c = [];
  for (let i = 23; i < 39; i++) c.push([i, i + 1]);
  for (let i = 40; i < 44; i++) c.push([i, i + 1]);
  for (let i = 45; i < 49; i++) c.push([i, i + 1]);
  for (let i = 50; i < 53; i++) c.push([i, i + 1]);
  for (let i = 54; i < 58; i++) c.push([i, i + 1]);
  c.push([53, 54]);
  for (let i = 59; i < 64; i++) c.push([i, i + 1]); c.push([64, 59]);
  for (let i = 65; i < 70; i++) c.push([i, i + 1]); c.push([70, 65]);
  for (let i = 71; i < 82; i++) c.push([i, i + 1]); c.push([82, 71]);
  for (let i = 83; i < 90; i++) c.push([i, i + 1]); c.push([90, 83]);
  return c;
})();
const L_HAND = HAND.map(([a, b]) => [91 + a,  91 + b]);
const R_HAND = HAND.map(([a, b]) => [112 + a, 112 + b]);

const GRP_HEX = { body: 0x00b7ff, foot: 0x34d399, face: 0xa78bfa, hand: 0xfb923c };
const GRP_CSS = { body: '#00B7FF', foot: '#34D399', face: '#A78BFA', hand: '#FB923C' };

const grpOf = i => (i <= 16 ? 'body' : i <= 22 ? 'foot' : i <= 90 ? 'face' : 'hand');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ─────────── aiDocs 파싱 ───────────
const decodeHex = h => { const v = parseInt(h, 16); return isFinite(v) ? v / 10000 : 0; };

const parsePoseKpHex = str => {
  const s = String(str || '').trim();
  if (!s) return [];
  const pts = [];
  const n = Math.floor(s.length / 12);
  for (let i = 0; i < n; i++) {
    const o = i * 12;
    pts.push({
      x: decodeHex(s.slice(o,     o + 4)),
      y: decodeHex(s.slice(o + 4, o + 8)),
      conf: decodeHex(s.slice(o + 8, o + 12)),
    });
  }
  return pts;
};

const parseKpt17 = v => {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 17)
    .map(it => (!Array.isArray(it) ? null : { x: Number(it[0]), y: Number(it[1]), conf: Number(it[2] ?? 1) }))
    .filter(it => it && isFinite(it.x) && isFinite(it.y));
};

const parseBboxHex = bh => {
  const v = String(bh || '').trim();
  if (v.length < 16) return null;
  return { x: decodeHex(v.slice(0, 4)), y: decodeHex(v.slice(4, 8)), w: decodeHex(v.slice(8, 12)), h: decodeHex(v.slice(12, 16)) };
};

const normalizeKpsIntoBbox = (pts, bbox) => {
  const oob = pts.some(p => p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1);
  if (!oob || !bbox) return pts;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rX = Math.max(maxX - minX, 1e-6), rY = Math.max(maxY - minY, 1e-6);
  return pts.map(p => ({
    x: clamp(bbox.x + ((p.x - minX) / rX) * bbox.w, 0, 1),
    y: clamp(bbox.y + ((p.y - minY) / rY) * bbox.h, 0, 1),
    conf: clamp(Number(p.conf ?? 0), 0, 1),
  }));
};

// ─────────── Computed: aiDoc 정규화 ───────────
const parsedAiDocs = computed(() => {
  if (!props.aiDocs) return null;
  try { return JSON.parse(props.aiDocs); } catch { return null; }
});

const aiDoc = computed(() => {
  const src = parsedAiDocs.value || {};
  if (src.pose || src.shot || src.size || src.camera) {
    return {
      pose:      src.pose      || {},
      shot:      src.shot      || {},
      size:      src.size      || {},
      camera:    src.camera    || {},
      scores:    src.scores    || {},
      framing:   src.framing   || {},
      garment:   src.garment   || {},
      quality:   src.quality   || {},
      distance:  src.distance  || {},
      geoCalib:  src.geoCalib  || {},
      poseGeom:  src.poseGeom  || {},
      bodyShape: src.bodyShape || {},
      _source:   src._source   || '',
      _signalCount: src._signalCount,
    };
  }
  const leg = src.refAnalysisOnly;
  const empty = { pose:{}, shot:{}, size:{}, camera:{}, scores:{}, framing:{}, garment:{}, quality:{}, distance:{}, geoCalib:{}, poseGeom:{}, bodyShape:{}, _source:'', _signalCount: undefined };
  if (!leg) return empty;
  const os = Number(leg?.framingResult?.overallScore);
  const rs = isFinite(os) ? (os <= 1 ? os * 5 : os) : undefined;
  return {
    pose:      { kp: leg?.poseKeypoints?.kp, bbox: leg?.BBox, kpt17: [] },
    shot:      { shotType: leg?.framingResult?.shotType, typeCanonical: leg?.framingResult?.shotType },
    size:      { w: leg?.refInput?.imageSize?.width, h: leg?.refInput?.imageSize?.height },
    camera:    { angleVisual: leg?.framingResult?.cameraAngle, pitchCal: leg?.framingResult?.cameraAngleValue, orientation: leg?.focalLengthInfo?.lensType, posture: leg?.distanceEstimation?.bodyTypeAssumption },
    scores:    { review: rs },
    framing:   { coverage: leg?.distanceEstimation?.shoulderRatio },
    garment:   {}, quality: {},
    distance:  { estimated: leg?.distanceEstimation?.estimatedDistanceM, focal: leg?.exifInfo?.focalLength, confidence: undefined },
    geoCalib:  { pitchDegrees: leg?.framingResult?.cameraAngleValue, focalLengthMM35eq: leg?.exifInfo?.focalLength35mm },
    poseGeom:  { bodyLeaning: leg?.distanceEstimation?.bodyTypeAssumption },
    bodyShape: {},
    _source:   leg?.exifInfo?.lensModel || '',
    _signalCount: undefined,
  };
});

const poseOverlay = computed(() => {
  const bbox    = parseBboxHex(aiDoc.value?.pose?.bbox);
  const fromHex = parsePoseKpHex(aiDoc.value?.pose?.kp);
  const from17  = parseKpt17(aiDoc.value?.pose?.kpt17);
  const points  = fromHex.length ? fromHex : from17;
  if (!points.length) return null;
  return { points: normalizeKpsIntoBbox(points, bbox), bbox };
});

// ─────────── Display computeds ───────────
const prettyAiDocs = computed(() =>
  parsedAiDocs.value ? JSON.stringify(parsedAiDocs.value, null, 2) : (props.aiDocs || '{}'));

const tf = (v, d = 2, fb = '—') => { const n = Number(v); return isFinite(n) ? n.toFixed(d) : fb; };

const displayLensMain      = computed(() => `${aiDoc.value?.geoCalib?.focalLengthMM35eq ?? '—'}mm eq · f/—`);
const displayLensSub       = computed(() => `${aiDoc.value?.distance?.focal ?? '—'}mm · ISO —`);
const displayLensModel     = computed(() => aiDoc.value?._source || 'Lens metadata unavailable');

// 신규 및 수정된 카메라 정보 매핑
const displayAngleVisual   = computed(() => String(aiDoc.value?.camera?.angleVisual || '—').toUpperCase());
const displayPitchCal      = computed(() => tf(aiDoc.value?.geoCalib?.pitchDegrees ?? aiDoc.value?.camera?.pitchCal, 1));
const displayRoll          = computed(() => aiDoc.value?.camera?.roll || '—');
const displayOrientation   = computed(() => aiDoc.value?.camera?.orientation || '—');
const displayPhotographer  = computed(() => aiDoc.value?.camera?.photographer || '—');
const displayIndoorOutdoor = computed(() => aiDoc.value?.camera?.indoorOutdoor || '—');

// 피사체 정보 연동 (피사체 자세 posture 반영)
const displayShotType      = computed(() => aiDoc.value?.shot?.shotType || aiDoc.value?.shot?.typeCanonical || '—');
const displayBodyType      = computed(() => aiDoc.value?.poseGeom?.bodyLeaning || aiDoc.value?.camera?.posture || '—');

// ─────────── 2D 스켈레톤 (Canvas) ───────────
const drawSkeleton = () => {
  const canvas = overlayRef.value;
  const image  = imageRef.value;
  const pose   = poseOverlay.value;
  if (!canvas || !image) return;

  const W = image.clientWidth, H = image.clientHeight;
  if (!W || !H) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = `${W}px`;
  canvas.style.height = `${H}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!pose?.points?.length) return;

  const pts = pose.points, thr = 0.05;

  if (pose.bbox) {
    ctx.save();
    ctx.strokeStyle = 'rgba(16,185,129,0.95)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(pose.bbox.x * W, pose.bbox.y * H, pose.bbox.w * W, pose.bbox.h * H);
    ctx.restore();
  }

  const drawConn = (conns, color, lw) => {
    conns.forEach(([si, ei]) => {
      const s = pts[si], e = pts[ei];
      if (!s || !e) return;
      const a = Math.min(s.conf ?? 0, e.conf ?? 0);
      ctx.globalAlpha = a < thr ? 0.08 : clamp(a, 0.2, 1);
      ctx.strokeStyle = color;
      ctx.lineWidth   = lw;
      ctx.beginPath();
      ctx.moveTo(s.x * W, s.y * H);
      ctx.lineTo(e.x * W, e.y * H);
      ctx.stroke();
    });
  };

  ctx.save();
  drawConn(COCO17, GRP_CSS.body, 2);
  drawConn(FOOT,   GRP_CSS.foot, 1.8);
  drawConn(FACE,   GRP_CSS.face, 1.0);
  drawConn(L_HAND, GRP_CSS.hand, 1.4);
  drawConn(R_HAND, GRP_CSS.hand, 1.4);
  ctx.restore();

  ctx.save();
  pts.forEach((p, i) => {
    const g = grpOf(i);
    const r = g === 'body' ? 3.5 : g === 'foot' ? 3 : 2;
    const a = Number(p.conf ?? 0);
    ctx.globalAlpha = a < thr ? 0.15 : clamp(a, 0.25, 1);
    ctx.fillStyle   = GRP_CSS[g];
    ctx.beginPath();
    ctx.arc(p.x * W, p.y * H, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

const handleImageLoad = () => drawSkeleton();

// ─────────── Three.js 초기화 ───────────
const initThree = () => {
  const container = threeContainerRef.value;
  if (!container) return;

  const W = container.clientWidth  || 600;
  const H = container.clientHeight || 600;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H);
  renderer.setClearColor(0xffffff, 1);
  container.appendChild(renderer.domElement);

  // Scene
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0xffffff);

  // 조명
  threeScene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 1.3));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4);
  dl.position.set(3, 5, 4);
  threeScene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xc8d8ff, 0.45);
  dl2.position.set(-4, 2, 2);
  threeScene.add(dl2);

  // 그리드
  threeScene.add(new THREE.GridHelper(10, 20, 0xd1d5db, 0xe5e7eb));

  threeCamera = new THREE.PerspectiveCamera(45, W / H, 0.05, 100);
  threeCamera.position.set(2.8, -1, 5.3);

  // OrbitControls
  controls = new OrbitControls(threeCamera, renderer.domElement);
  controls.enableDamping  = true;
  controls.dampingFactor  = 0.07;
  
  // 시선 타깃을 인물의 중심부(Y=0.85) 주변으로 고정
  controls.target.set(0, 0.85, 0);
  controls.update();

  threeReady = true;
  buildThreeScene();

  // 애니메이션 루프
  const animate = () => {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(threeScene, threeCamera);
  };
  animate();

  // 리사이즈
  resizeObs = new ResizeObserver(() => {
    if (!threeContainerRef.value || !renderer || !threeCamera) return;
    const nW = threeContainerRef.value.clientWidth;
    const nH = threeContainerRef.value.clientHeight;
    threeCamera.aspect = nW / nH;
    threeCamera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
  resizeObs.observe(container);
};

// ─────────── Three.js 씬 컨텐츠 빌드 ───────────
const buildThreeScene = () => {
  if (!threeReady || !threeScene) return;

  // 기존 오브젝트 정리
  if (camMarker?.userData?.shadowGroup) {
    const sg = camMarker.userData.shadowGroup;
    threeScene.remove(sg);
    sg.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose(); }
    });
  }
  [skelGroup, camMarker].forEach(obj => {
    if (!obj) return;
    threeScene.remove(obj);
    obj.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
  });
  skelGroup = null;
  camMarker = null;

  skelGroup = new THREE.Group();

  const pose = poseOverlay.value;

  if (pose?.points?.length) {
    // ── aiDoc에서 촬영 파라미터 추출 ──
    const pitchDeg  = Number(aiDoc.value?.geoCalib?.pitchDegrees ?? aiDoc.value?.camera?.pitchCal ?? 0);
    const distM     = Number(aiDoc.value?.distance?.estimated ?? 2.5);
    const focalMm35 = Number(aiDoc.value?.geoCalib?.focalLengthMM35eq ?? 50);
    const imgW      = Number(aiDoc.value?.size?.w ?? 720);
    const imgH      = Number(aiDoc.value?.size?.h ?? 960);
    const aspect    = imgW / imgH;

    // 35mm 기준 수직 화각 → 장면 실제 크기(m)
    const fovVRad = 2 * Math.atan(18 / Math.max(focalMm35, 10));
    const d       = isFinite(distM) && distM > 0.1 ? distM : 2.5;
    const sceneH  = 2 * d * Math.tan(fovVRad / 2);
    const sceneW  = sceneH * aspect;

    // pitch 보정 → Y 시프트
    const pitchRad     = pitchDeg * Math.PI / 180;
    const centerYShift = d * Math.tan(pitchRad);

    const pts = pose.points;

    // 정규화 kp → 3D 월드 좌표 (z=0 평면 언프로젝션)
    const kp3d = pts.map(p => ({
      wx:   (p.x - 0.5) * sceneW,
      wy:   -(p.y - 0.5) * sceneH + centerYShift,
      conf: p.conf,
    }));

    // ── 연결선 그리기 ──
    const drawConns = (conns, grp) => {
      conns.forEach(([si, ei]) => {
        const s = kp3d[si], e = kp3d[ei];
        if (!s || !e) return;
        const alpha = Math.min(s.conf ?? 0, e.conf ?? 0);
        if (alpha < 0.05) return;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(s.wx, s.wy, 0),
          new THREE.Vector3(e.wx, e.wy, 0),
        ]);
        const mat = new THREE.LineBasicMaterial({
          color: GRP_HEX[grp] ?? 0x00b7ff,
          transparent: true,
          opacity: clamp(alpha, 0.25, 1.0),
        });
        skelGroup.add(new THREE.Line(geo, mat));
      });
    };

    drawConns(COCO17, 'body');
    drawConns(FOOT,   'foot');
    drawConns(FACE,   'face');
    drawConns(L_HAND, 'hand');
    drawConns(R_HAND, 'hand');

    // ── 관절 구 ──
    pts.forEach((p, i) => {
      if ((p.conf ?? 0) < 0.08) return;
      const g = grpOf(i);
      const r = g === 'body' ? 0.020 : g === 'foot' ? 0.015 : 0.008;
      const mat = new THREE.MeshStandardMaterial({
        color:            GRP_HEX[g],
        emissive:         GRP_HEX[g],
        emissiveIntensity: 0.2,
        roughness:         0.4,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
      mesh.position.set(kp3d[i].wx, kp3d[i].wy, 0);
      skelGroup.add(mesh);
    });

    // ── bbox 점선 사각형 ──
    if (pose.bbox) {
      const bb   = pose.bbox;
      const bx1  = (bb.x          - 0.5) * sceneW;
      const bx2  = (bb.x + bb.w   - 0.5) * sceneW;
      const by1  = -(bb.y          - 0.5) * sceneH + centerYShift;
      const by2  = -(bb.y + bb.h   - 0.5) * sceneH + centerYShift;
      const geo  = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(bx1, by1, 0),
        new THREE.Vector3(bx2, by1, 0),
        new THREE.Vector3(bx2, by2, 0),
        new THREE.Vector3(bx1, by2, 0),
        new THREE.Vector3(bx1, by1, 0),
      ]);
      const bmat = new THREE.LineDashedMaterial({ color: 0x10b981, dashSize: 0.04, gapSize: 0.03, opacity: 0.7, transparent: true });
      const bl   = new THREE.Line(geo, bmat);
      bl.computeLineDistances();
      skelGroup.add(bl);
    }

    // ── Y 오프셋: 발 부분이 바닥(y=0)에 오도록 ──
    const validYs = kp3d.filter(k => k.conf > 0.05).map(k => k.wy);
    if (validYs.length) {
      skelGroup.position.y = -Math.min(...validYs);
    }

  } else {
    // 키포인트 없음 — 플레이스홀더 와이어프레임
    const mat  = new THREE.MeshStandardMaterial({ color: 0xd1d5db, wireframe: true });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12), mat);
    mesh.position.set(0, 0.85, 0);
    skelGroup.add(mesh);
  }

  threeScene.add(skelGroup);

  // ─────────────────────────────────────────────────
  //  카메라 리그 — geoCalib 4개 값 완전 반영
  //  · pitchDegrees : 카메라가 아래를 내려다보는 각도
  //  · rollDegrees  : 카메라 바디 기울기
  //  · focalLengthMM35eq : frustum 시야각 계산
  //  · distance.estimated : Z 위치 (인물까지 거리)
  // ─────────────────────────────────────────────────
  const gc         = aiDoc.value?.geoCalib ?? {};
  const pitchDeg   = Number(gc.pitchDegrees   ?? aiDoc.value?.camera?.pitchCal ?? 0);
  const rollDeg    = Number(gc.rollDegrees    ?? 0);
  const focalMm35  = Number(gc.focalLengthMM35eq ?? 50);
  const distM      = Number(aiDoc.value?.distance?.estimated ?? 2.5);
  const imgW       = Number(aiDoc.value?.size?.w ?? 720);
  const imgH       = Number(aiDoc.value?.size?.h ?? 960);
  const imgAspect  = imgW / imgH;

  // 카메라 높이: 피사체 중심(H/2 ≈ 0.85m) + 거리×tan(pitch)
  const pitchRad  = pitchDeg * Math.PI / 180;
  const rollRad   = rollDeg  * Math.PI / 180;
  const subjMidY  = 0.85; // 인물 Y 중심(바닥 기준)
  const camZ      = clamp(distM, 1.0, 6.0);
  const camY      = clamp(subjMidY - camZ * Math.tan(pitchRad), 0.3, 3.5);

  // 수직/수평 화각
  const fovVDeg  = (2 * Math.atan(18 / Math.max(focalMm35, 10))) * 180 / Math.PI;
  const fovVRad  = fovVDeg * Math.PI / 180;

  camMarker = new THREE.Group();

  // ── 1. 카메라 바디 (검정 박스) ──
  const bodyGeo = new THREE.BoxGeometry(0.18, 0.12, 0.09);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5, metalness: 0.4 });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  camMarker.add(bodyMesh);

  // ── 2. 렌즈 (앞면 원기둥, 빨간 링) ──
  const lensBodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 20);
  const lensBodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.6 });
  const lensBody    = new THREE.Mesh(lensBodyGeo, lensBodyMat);
  lensBody.rotation.x = Math.PI / 2;
  lensBody.position.set(0, 0, -0.075); // 카메라 앞면(-Z)
  camMarker.add(lensBody);

  // 렌즈 앞 빨간 링
  const ringGeo = new THREE.TorusGeometry(0.042, 0.006, 10, 32);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.6 });
  const ring    = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0, -0.105);
  camMarker.add(ring);

  // ── 3. 핫슈(상단 작은 돌기) ──
  const shoeGeo = new THREE.BoxGeometry(0.08, 0.02, 0.03);
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
  const shoe    = new THREE.Mesh(shoeGeo, shoeMat);
  shoe.position.set(0, 0.07, 0);
  camMarker.add(shoe);

  // ── 4. Frustum 라인 (시야각 시각화) ──
  // 카메라 로컬 좌표계에서 -Z 방향으로 frustum 꼭짓점 계산
  const fLen   = clamp(camZ * 0.85, 0.8, 3.5); // frustum 길이(인물 가까이까지)
  const halfH  = fLen * Math.tan(fovVRad / 2);
  const halfW  = halfH * imgAspect;

  // frustum 4 꼭짓점 (카메라 로컬 -Z 방향)
  const ftl = new THREE.Vector3(-halfW,  halfH, -fLen);
  const ftr = new THREE.Vector3( halfW,  halfH, -fLen);
  const fbl = new THREE.Vector3(-halfW, -halfH, -fLen);
  const fbr = new THREE.Vector3( halfW, -halfH, -fLen);
  const org = new THREE.Vector3(0, 0, 0);

  const frustumPts = [
    // 4 코너 레이
    org.clone(), ftl.clone(),
    org.clone(), ftr.clone(),
    org.clone(), fbl.clone(),
    org.clone(), fbr.clone(),
    // 원거리 사각형
    ftl.clone(), ftr.clone(),
    ftr.clone(), fbr.clone(),
    fbr.clone(), fbl.clone(),
    fbl.clone(), ftl.clone(),
  ];
  const frustumGeo = new THREE.BufferGeometry().setFromPoints(frustumPts);
  const frustumMat = new THREE.LineBasicMaterial({ color: 0xff6b6b, opacity: 0.55, transparent: true });
  camMarker.add(new THREE.LineSegments(frustumGeo, frustumMat));

  // ── 5. 광축 점선 (렌즈 → 인물 방향) ──
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -camZ * 0.95),
  ]);
  const axisMat = new THREE.LineDashedMaterial({ color: 0xff9900, dashSize: 0.08, gapSize: 0.05, opacity: 0.7, transparent: true });
  const axisLine = new THREE.Line(axisGeo, axisMat);
  axisLine.computeLineDistances();
  camMarker.add(axisLine);

  // ── 6. 카메라 리그 배치 & 회전 ──
  camMarker.position.set(0, camY, camZ);

  // 회전 순서: YXZ (yaw→pitch→roll)
  const lookPitch = -Math.atan2(camY - subjMidY, camZ); 
  camMarker.rotation.order = 'YXZ';

  // 0으로 변경하여 카메라가 원래의 -Z 방향(인물이 있는 곳)을 바라보도록 합니다.
  camMarker.rotation.y     = 0;          
  camMarker.rotation.x     = lookPitch;        
  camMarker.rotation.z     = rollRad;          

  threeScene.add(camMarker);

  // ── 7. 바닥 그림자 투영선 & 원 — camMarker 로컬 좌표 기준으로 추가 ──
  // (camMarker.position = (0, camY, camZ) 이므로 로컬 Y는 0이 바닥)
  const shadowGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),           // 카메라 위치 (로컬 원점)
    new THREE.Vector3(0, -camY + 0.002, 0), // 바닥(Y=0 월드)
  ]);
  const shadowMat  = new THREE.LineDashedMaterial({ color: 0xaaaaaa, dashSize: 0.05, gapSize: 0.04, opacity: 0.5, transparent: true });
  const shadowLine = new THREE.Line(shadowGeo, shadowMat);
  shadowLine.computeLineDistances();
  // shadowLine은 회전 영향 받지 않아야 하므로 별도 그룹(회전 없음)으로 분리
  const shadowGroup = new THREE.Group();
  shadowGroup.position.copy(camMarker.position);
  shadowGroup.add(shadowLine);

  const circleGeo = new THREE.RingGeometry(0.09, 0.12, 32);
  const circleMat = new THREE.MeshBasicMaterial({ color: 0xff6b6b, opacity: 0.35, transparent: true, side: THREE.DoubleSide });
  const circle    = new THREE.Mesh(circleGeo, circleMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(0, -camY + 0.002, 0);
  shadowGroup.add(circle);

  // shadowGroup도 camMarker 와 같이 cleanup 되도록 camMarker의 userData에 참조 저장
  camMarker.userData.shadowGroup = shadowGroup;
  threeScene.add(shadowGroup);

  // OrbitControls 타깃: 스켈레톤과 카메라 중간
  if (controls) {
    const skelMidY = skelGroup.position.y + 0.6;
    controls.target.set(0, clamp(skelMidY, 0.3, 2.0), 0);
    controls.update();
  }
};

// ─────────── 라이프사이클 ───────────
onMounted(async () => {
  await nextTick();
  initThree();
  window.addEventListener('resize', drawSkeleton);
});

onBeforeUnmount(() => {
  if (animId)    cancelAnimationFrame(animId);
  if (resizeObs) resizeObs.disconnect();
  if (controls)  controls.dispose();
  if (renderer)  renderer.dispose();
  window.removeEventListener('resize', drawSkeleton);
});

watch(
  () => [props.imagePath, props.aiDocs],
  async () => {
    await nextTick();
    if (activeTab.value !== '3D') drawSkeleton();
    buildThreeScene();
  },
  { immediate: true },
);
</script>

<style scoped>
/* ─── 카드 전체 ─── */
.close-btn {
  position: absolute;
  top: 12px; right: 12px;
  color: #6B7280; z-index: 20;
}

.viewer-card {
  display: flex;
  flex-direction: column;
  height: min(88vh, 920px);
}

.viewer-body {
  flex: 1;
  min-height: 0;
  /* v-card-text 기본 패딩 제거 */
  padding: 8px !important;
}

.viewer-title {
  color: #364153;
  font-size: 18px; font-weight: 700; letter-spacing: -0.2px;
}

/* ─── 2-column 레이아웃 ─── */
.viewer-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  height: 100%;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
}

/* ─── 왼쪽: 캔버스 패널 ─── */
.canvas-panel {
  position: relative;
  overflow: hidden;
  background: #ffffff;
  /* flexbox로 three-stage가 100% 높이를 가져가도록 */
  display: flex;
  flex-direction: column;
}

/* Three.js 마운트 div — 항상 풀사이즈 */
.three-stage {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: block;
}
.three-stage :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

/* 탭 */
.tab-bar {
  position: absolute;
  top: 12px; right: 12px;
  display: flex; gap: 4px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(6px);
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 3px;
}

.tab-btn {
  font-size: 11px; font-weight: 600;
  padding: 4px 10px;
  border: none; border-radius: 6px;
  background: transparent; color: #6B7280;
  cursor: pointer;
  transition: background .15s, color .15s;
  line-height: 1.4;
}
.tab-btn.active  { background: #111827; color: #ffffff; }
.tab-btn:hover:not(.active) { background: #F3F4F6; color: #374151; }

/* 2D / IMG 오버레이 */
.overlay-panel {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 24px;
  overflow: hidden;
}

.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

.image-overlay-wrap {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
  line-height: 0;
}

.canvas-image-native {
  display: block;
  max-width: 100%;
  max-height: calc(min(88vh, 920px) - 140px);
  object-fit: contain;
}

.overlay-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.canvas-empty { font-size: 13px; color: #6A7282; }

/* HUD 카드 */
.canvas-card {
  position: absolute;
  z-index: 8;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 10px 12px;
  backdrop-filter: blur(8px);
  pointer-events: none;
}
.hud-top-left    { top: 16px;    left: 16px; }
.hud-bottom-left { bottom: 16px; left: 16px; }

.hud-label  { font-size: 10px; color: #6A7282; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .05em; }
.hud-main   { font-size: 14px; font-weight: 600; color: #111827; }
.hud-sub    { font-size: 12px; color: #4B5563; }
.hud-model  { font-size: 11px; color: #6A7282; margin-top: 4px; }

.subject-main { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 5px; }
.subject-line {
  display: flex; justify-content: space-between; gap: 10px;
  font-size: 11px; color: #6A7282; margin-bottom: 3px;
}
.subject-line strong { color: #1F2937; font-weight: 600; }

/* ─── 오른쪽 패널 ─── */
.right-panel {
  background: #ffffff;
  border-left: 1px solid #E5E7EB;
  overflow-y: auto;
}

.panel-section {
  padding: 14px;
  border-bottom: 1px solid #E5E7EB;
}

.panel-section--json {
  display: flex;
  flex-direction: column;
}

.section-label {
  font-size: 11px; color: #6A7282;
  margin-bottom: 10px;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.score-row   { display: flex; align-items: flex-end; gap: 10px; margin-bottom: 8px; }
.score-big   { font-size: 30px; font-weight: 700; color: #111827; line-height: 1; }
.score-meta  { font-size: 11px; color: #6A7282; }
.score-track { width: 100%; height: 4px; border-radius: 999px; background: #E5E7EB; overflow: hidden; }
.score-fill  { height: 100%; background: linear-gradient(90deg, #4B5563, #111827); transition: width .4s; }

.metric { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; color: #4B5563; margin-bottom: 8px; }
.metric strong { color: #111827; font-weight: 600; text-align: right; }

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
}

.json-box {
  flex: 1;
  margin: 0;
  overflow: auto;
  padding: 10px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: #F9FAFB;
  color: #1F2937;
  font-size: 11px;
  line-height: 1.45;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 인포그래픽 대시보드 스타일 */
.dashboard-summary {
  background: #F9FAFB;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.main-score {
  display: flex;
  align-items: baseline;
}

.score-num {
  font-size: 36px;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.score-max {
  font-size: 14px;
  color: #9CA3AF;
  margin-left: 4px;
}

.summary-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.focus-badge {
  font-size: 10px;
  font-weight: 700;
  background: #111827;
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.aesthetic-row {
  font-size: 12px;
  color: #4B5563;
  display: flex;
  gap: 6px;
}

.text-highlight {
  color: #111827;
  font-weight: 600;
}

/* 글로벌 메트릭스 */
.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.metric-val {
  font-weight: 700;
  color: #111827;
}

.metric-val.text-four {
  color: #6B7280;
}

.metric-bar-track {
  width: 100%;
  height: 6px;
  background: #F3F4F6;
  border-radius: 999px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  background: #111827;
  border-radius: 999px;
  transition: width 0.5s ease-out;
}

.metric-bar-fill.fill-four {
  background: #9CA3AF;
}

/* 상하의 비교 패널 */
.garment-container {
  display: flex;
  gap: 12px;
}

.garment-column {
  flex: 1;
  background: #F9FAFB;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  overflow: hidden;
}

.garment-header {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  padding: 6px 0;
  letter-spacing: 0.05em;
}

.garment-header.top-style {
  background: #F3F4F6;
  color: #111827;
  border-bottom: 1px solid #E5E7EB;
}

.garment-header.bot-style {
  background: #E5E7EB;
  color: #374151;
  border-bottom: 1px solid #D1D5DB;
}

.garment-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.garment-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #4B5563;
}

.garment-row strong {
  color: #111827;
}

.garment-row strong.text-four {
  color: #6B7280;
}

.garment-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 4px 0;
}

.garment-row.total-row {
  font-weight: 700;
  color: #111827;
  font-size: 12px;
}

/* JSON 뷰어 축소 스타일 */
.json-viewer {
  max-height: 120px;
  font-size: 10px;
  background: #F3F4F6;
  padding: 8px;
  border-radius: 8px;
  overflow-y: auto;
  color: #4B5563;
}

/* 카메라 정보 세부 레이아웃 추가 */
.cam-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 12px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(229, 231, 235, 0.7);
}

.cam-tag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}

.cam-tag span {
  color: #6A7282;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.cam-tag strong {
  color: #111827;
  font-weight: 600;
}
</style>