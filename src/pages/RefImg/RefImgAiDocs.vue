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
      <v-row no-gutters class="align-center | justify-center | viewer-title">
        {{ props.title || 'AI 데이터 뷰어' }}
      </v-row>
    </v-card-title>

    <v-card-text class="viewer-body">
      <div class="viewer-layout">
        <section class="canvas-panel">
          <div v-if="props.imagePath" class="canvas-stage">
            <div class="image-overlay-wrap">
              <img
                ref="imageRef"
                :src="props.imagePath"
                class="canvas-image-native"
                alt="reference"
                @load="handleImageLoad"
              />
              <canvas ref="overlayRef" class="overlay-canvas" />
            </div>
          </div>
          <div v-else class="canvas-empty">이미지 없음</div>

          <div class="canvas-card" style="top: 16px; left: 16px;">
            <v-label>lens info</v-label>
            <div class="hud-main">{{ displayLensMain }}</div>
            <div class="hud-sub">{{ displayLensSub }}</div>
            <div class="hud-model">{{ displayLensModel }}</div>
          </div>

          <div class="canvas-card" style="left: 16px; bottom: 16px;">
            <v-label>피사체 정보</v-label>
            <div class="subject-main">{{ displayShotType }}</div>
            <div class="subject-line"><span>shot confidence</span><strong>{{ displayShotConf }}</strong></div>
            <div class="subject-line"><span>estimated distance</span><strong>{{ displayDistance }}</strong></div>
            <div class="subject-line"><span>shoulder ratio</span><strong>{{ displayShoulderRatio }}</strong></div>
            <div class="subject-line"><span>body type</span><strong>{{ displayBodyType }}</strong></div>
            <div class="subject-line"><span>nose position</span><strong>{{ displayNose }}</strong></div>
          </div>
        </section>

        <aside class="right-panel">
          <v-row no-gutters class="panel-section">
            <v-col cols="12">
              <v-label>분석 점수</v-label>
            </v-col>
            <div class="score-row">
              <div class="score-big">{{ displayOverallScore }}</div>
              <div class="score-meta">overall score</div>
            </div>
            <div class="score-track">
              <div class="score-fill" :style="{ width: scorePercent }" />
            </div>
          </v-row>

          <v-row no-gutters class="panel-section">
            <v-col cols="12">
              <v-label>카메라</v-label>
            </v-col>
            <div class="metric"><span>camera angle</span><strong>{{ displayCamAngle }}</strong></div>
            <div class="metric"><span>focal type</span><strong>{{ displayLensType }}</strong></div>
            <div class="metric"><span>image size</span><strong>{{ displayImageSize }}</strong></div>
            <div class="metric"><span>bbox</span><strong class="mono">{{ displayBbox }}</strong></div>
          </v-row>

          <v-row no-gutters class="panel-section">
            <v-col cols="12">
              <v-label>AI 원본 데이터 JSON</v-label>
            </v-col>
            <pre class="json-box">{{ prettyAiDocs }}</pre>
          </v-row>

          
        </aside>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  aiDocs: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  imagePath: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close']);

const imageRef = ref(null);
const overlayRef = ref(null);

const COCO17_CONNECTIONS = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
];

const FOOT_CONNECTIONS = [
  [15, 17], [17, 18], [15, 19], [16, 20], [20, 21], [16, 22],
];

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
];

const FACE_CONNECTIONS = (() => {
  const connections = [];
  for (let i = 23; i < 39; i += 1) connections.push([i, i + 1]);
  for (let i = 40; i < 44; i += 1) connections.push([i, i + 1]);
  for (let i = 45; i < 49; i += 1) connections.push([i, i + 1]);
  for (let i = 50; i < 53; i += 1) connections.push([i, i + 1]);
  for (let i = 54; i < 58; i += 1) connections.push([i, i + 1]);
  connections.push([53, 54]);
  for (let i = 59; i < 64; i += 1) connections.push([i, i + 1]);
  connections.push([64, 59]);
  for (let i = 65; i < 70; i += 1) connections.push([i, i + 1]);
  connections.push([70, 65]);
  for (let i = 71; i < 82; i += 1) connections.push([i, i + 1]);
  connections.push([82, 71]);
  for (let i = 83; i < 90; i += 1) connections.push([i, i + 1]);
  connections.push([90, 83]);
  return connections;
})();

const LEFT_HAND_CONNECTIONS = HAND_CONNECTIONS.map(([a, b]) => [91 + a, 91 + b]);
const RIGHT_HAND_CONNECTIONS = HAND_CONNECTIONS.map(([a, b]) => [112 + a, 112 + b]);

const GROUP_COLORS = {
  body: '#00B7FF',
  foot: '#34D399',
  face: '#A78BFA',
  hand: '#FB923C',
};

const decodeHex = (hex) => {
  const value = Number.parseInt(hex, 16);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value / 10000;
};

const parsePoseKpHex = (hexString) => {
  const sanitized = String(hexString || '').trim();
  if (!sanitized) {
    return [];
  }

  const points = [];
  const pointCount = Math.floor(sanitized.length / 12);
  for (let i = 0; i < pointCount; i += 1) {
    const offset = i * 12;
    const x = decodeHex(sanitized.slice(offset, offset + 4));
    const y = decodeHex(sanitized.slice(offset + 4, offset + 8));
    const conf = decodeHex(sanitized.slice(offset + 8, offset + 12));
    points.push({ x, y, conf });
  }

  return points;
};

const parseKpt17 = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 17)
    .map((item) => {
      if (!Array.isArray(item)) {
        return null;
      }

      return {
        x: Number(item[0]),
        y: Number(item[1]),
        conf: Number(item[2] ?? 1),
      };
    })
    .filter((item) => item && Number.isFinite(item.x) && Number.isFinite(item.y));
};

const parseBboxHex = (bboxHex) => {
  const value = String(bboxHex || '').trim();
  if (value.length < 16) {
    return null;
  }

  return {
    x: decodeHex(value.slice(0, 4)),
    y: decodeHex(value.slice(4, 8)),
    w: decodeHex(value.slice(8, 12)),
    h: decodeHex(value.slice(12, 16)),
  };
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getGroupByIndex = (index) => {
  if (index <= 16) return 'body';
  if (index <= 22) return 'foot';
  if (index <= 90) return 'face';
  return 'hand';
};

const normalizeKpsIntoBbox = (points, bbox) => {
  const hasOutOfRange = points.some((point) => (
    point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1
  ));

  if (!hasOutOfRange || !bbox) {
    return points;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = Math.max(maxX - minX, 1e-6);
  const rangeY = Math.max(maxY - minY, 1e-6);

  return points.map((point) => ({
    x: clamp(bbox.x + ((point.x - minX) / rangeX) * bbox.w, 0, 1),
    y: clamp(bbox.y + ((point.y - minY) / rangeY) * bbox.h, 0, 1),
    conf: clamp(Number(point.conf ?? 0), 0, 1),
  }));
};

const parsedAiDocs = computed(() => {
  if (!props.aiDocs) {
    return null;
  }

  try {
    return JSON.parse(props.aiDocs);
  } catch (error) {
    return null;
  }
});

const aiDoc = computed(() => {
  const source = parsedAiDocs.value || {};

  if (source.pose || source.shot || source.size || source.camera) {
    return {
      pose: source.pose || {},
      shot: source.shot || {},
      size: source.size || {},
      camera: source.camera || {},
      scores: source.scores || {},
      framing: source.framing || {},
      garment: source.garment || {},
      quality: source.quality || {},
      distance: source.distance || {},
      geoCalib: source.geoCalib || {},
      poseGeom: source.poseGeom || {},
      bodyShape: source.bodyShape || {},
      _source: source._source || '',
      _signalCount: source._signalCount,
    };
  }

  const legacy = source.refAnalysisOnly;
  if (!legacy) {
    return {
      pose: {},
      shot: {},
      size: {},
      camera: {},
      scores: {},
      framing: {},
      garment: {},
      quality: {},
      distance: {},
      geoCalib: {},
      poseGeom: {},
      bodyShape: {},
      _source: '',
      _signalCount: undefined,
    };
  }

  const overallScore = Number(legacy?.framingResult?.overallScore);
  const reviewScore = Number.isFinite(overallScore)
    ? (overallScore <= 1 ? overallScore * 5 : overallScore)
    : undefined;

  return {
    pose: {
      kp: legacy?.poseKeypoints?.kp,
      bbox: legacy?.BBox,
      kpt17: [],
    },
    shot: {
      shotType: legacy?.framingResult?.shotType,
      typeCanonical: legacy?.framingResult?.shotType,
    },
    size: {
      w: legacy?.refInput?.imageSize?.width,
      h: legacy?.refInput?.imageSize?.height,
    },
    camera: {
      angleVisual: legacy?.framingResult?.cameraAngle,
      pitchCal: legacy?.framingResult?.cameraAngleValue,
      orientation: legacy?.focalLengthInfo?.lensType,
      posture: legacy?.distanceEstimation?.bodyTypeAssumption,
    },
    scores: {
      review: reviewScore,
    },
    framing: {
      coverage: legacy?.distanceEstimation?.shoulderRatio,
    },
    garment: {},
    quality: {},
    distance: {
      estimated: legacy?.distanceEstimation?.estimatedDistanceM,
      focal: legacy?.exifInfo?.focalLength,
      confidence: undefined,
    },
    geoCalib: {
      pitchDegrees: legacy?.framingResult?.cameraAngleValue,
      focalLengthMM35eq: legacy?.exifInfo?.focalLength35mm,
    },
    poseGeom: {
      bodyLeaning: legacy?.distanceEstimation?.bodyTypeAssumption,
    },
    bodyShape: {},
    _source: legacy?.exifInfo?.lensModel || '',
    _signalCount: undefined,
  };
});

const poseOverlay = computed(() => {
  const bbox = parseBboxHex(aiDoc.value?.pose?.bbox);
  const fromKpt17 = parseKpt17(aiDoc.value?.pose?.kpt17);
  const fromHex = parsePoseKpHex(aiDoc.value?.pose?.kp);
    const points = fromHex.length ? fromHex : fromKpt17;

    if (!points.length) {
      return null;
    }

    return {
      points: normalizeKpsIntoBbox(points, bbox),
      bbox,
    };
});

const prettyAiDocs = computed(() => {
  if (parsedAiDocs.value) {
    return JSON.stringify(parsedAiDocs.value, null, 2);
  }

  if (props.aiDocs) {
    return props.aiDocs;
  }

  return '{}';
});

const toFixed = (value, digits = 2, fallback = '—') => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : fallback;
};

const displayLensMain = computed(() => {
  return `${aiDoc.value?.geoCalib?.focalLengthMM35eq ?? '—'}mm eq · f/—`;
});

const displayLensSub = computed(() => {
  return `${aiDoc.value?.distance?.focal ?? '—'}mm · ISO —`;
});

const displayLensModel = computed(() => aiDoc.value?._source || 'Lens metadata unavailable');
const displayShotType = computed(() => aiDoc.value?.shot?.shotType || aiDoc.value?.shot?.typeCanonical || '—');
const displayShotConf = computed(() => {
  const confText = String(aiDoc.value?.distance?.confidence || '').toLowerCase();
  const confidenceMap = { high: 0.9, medium: 0.6, low: 0.3 };
  return toFixed(confidenceMap[confText], 2);
});
const displayDistance = computed(() => `${toFixed(aiDoc.value?.distance?.estimated, 2)} m`);
const displayShoulderRatio = computed(() => toFixed(aiDoc.value?.framing?.coverage, 3));
const displayBodyType = computed(() => aiDoc.value?.poseGeom?.bodyLeaning || aiDoc.value?.camera?.posture || '—');
const displayCamAngle = computed(() => {
  const angle = toFixed(aiDoc.value?.geoCalib?.pitchDegrees ?? aiDoc.value?.camera?.pitchCal, 1);
  const label = aiDoc.value?.camera?.angleVisual || '—';
  return `${label} · ${angle}°`;
});
const displayLensType = computed(() => aiDoc.value?.camera?.orientation || '—');
const displayImageSize = computed(() => {
  const width = aiDoc.value?.size?.w;
  const height = aiDoc.value?.size?.h;
  if (!width || !height) {
    return '—';
  }
  return `${width} x ${height}`;
});
const displayBbox = computed(() => aiDoc.value?.pose?.bbox || '—');
const displayNose = computed(() => {
  const nosePoint = Array.isArray(aiDoc.value?.pose?.kpt17) ? aiDoc.value.pose.kpt17[0] : null;
  if (!Array.isArray(nosePoint)) {
    return 'x — · y —';
  }

  return `x ${toFixed(nosePoint[0], 3)} · y ${toFixed(nosePoint[1], 3)}`;
});
const displayOverallScore = computed(() => toFixed(aiDoc.value?.scores?.review, 2));
const scorePercent = computed(() => {
  const score = Number(aiDoc.value?.scores?.review);
  if (!Number.isFinite(score)) {
    return '0%';
  }

  const normalized = score > 1 ? score / 5 : score;
  return `${Math.max(0, Math.min(100, normalized * 100)).toFixed(0)}%`;
});

const drawSkeleton = () => {
  const canvas = overlayRef.value;
  const image = imageRef.value;
  const pose = poseOverlay.value;
  if (!canvas || !image) {
    return;
  }

  const width = image.clientWidth;
  const height = image.clientHeight;
  if (!width || !height) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  if (!pose?.points?.length) {
    return;
  }

  const points = pose.points;
  const threshold = 0.05;

  if (pose.bbox) {
    context.save();
    context.strokeStyle = 'rgba(16, 185, 129, 0.95)';
    context.lineWidth = 1.5;
    context.setLineDash([6, 4]);
    context.strokeRect(
      pose.bbox.x * width,
      pose.bbox.y * height,
      pose.bbox.w * width,
      pose.bbox.h * height,
    );
    context.restore();
  }

  const drawConnections = (connections, color, widthValue) => {
    connections.forEach(([startIdx, endIdx]) => {
      const start = points[startIdx];
      const end = points[endIdx];
      if (!start || !end) {
        return;
      }

      const lineAlpha = Math.min(start.conf ?? 0, end.conf ?? 0);
      context.globalAlpha = lineAlpha < threshold ? 0.08 : clamp(lineAlpha, 0.2, 1);
      context.strokeStyle = color;
      context.lineWidth = widthValue;
      context.beginPath();
      context.moveTo(start.x * width, start.y * height);
      context.lineTo(end.x * width, end.y * height);
      context.stroke();
    });
  };

  context.save();
  drawConnections(COCO17_CONNECTIONS, GROUP_COLORS.body, 2);
  drawConnections(FOOT_CONNECTIONS, GROUP_COLORS.foot, 1.8);
  drawConnections(FACE_CONNECTIONS, GROUP_COLORS.face, 1.0);
  drawConnections(LEFT_HAND_CONNECTIONS, GROUP_COLORS.hand, 1.4);
  drawConnections(RIGHT_HAND_CONNECTIONS, GROUP_COLORS.hand, 1.4);
  context.restore();

  context.save();
  points.forEach((point, index) => {
    const group = getGroupByIndex(index);
    const radius = group === 'body' ? 3.5 : (group === 'foot' ? 3 : 2);
    const alpha = Number(point.conf ?? 0);
    context.globalAlpha = alpha < threshold ? 0.15 : clamp(alpha, 0.25, 1);
    context.fillStyle = GROUP_COLORS[group];
    context.beginPath();
    context.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
};

const handleImageLoad = () => {
  drawSkeleton();
};

const handleResize = () => {
  drawSkeleton();
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

watch(
  () => [props.imagePath, props.aiDocs],
  async () => {
    await nextTick();
    drawSkeleton();
  },
  { immediate: true },
);
</script>

<style scoped>
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #6B7280;
  z-index: 20;
}

.viewer-card {
  display: flex;
  flex-direction: column;
  height: min(88vh, 920px);
}

.viewer-body {
  flex: 1;
  min-height: 0;
}

.viewer-title {
  color: #364153;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.viewer-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  height: 100%;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
}

.canvas-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  background-color: #FFFFFF;
  background-image:
    linear-gradient(#E5E7EB 1px, transparent 1px),
    linear-gradient(90deg, #E5E7EB 1px, transparent 1px);
  background-size: 48px 48px;
  padding: 24px;
}

.canvas-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.image-overlay-wrap {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
  line-height: 0;
}

.canvas-image-native {
  display: block;
  width: auto;
  max-width: 100%;
  max-height: 100%;
}

.overlay-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.canvas-empty {
  font-size: 13px;
  color: #6A7282;
}

.canvas-card {
  background: rgba(255, 255, 255, 0.92);
  position: absolute;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 10px 12px;
  backdrop-filter: blur(8px);
}

.hud-label {
  font-size: 10px;
  color: #6A7282;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.hud-main {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.hud-sub {
  font-size: 12px;
  color: #4B5563;
}

.hud-model {
  font-size: 11px;
  color: #6A7282;
  margin-top: 4px;
}

.subject-main {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
}

.subject-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: #6A7282;
  margin-bottom: 3px;
}

.subject-line strong {
  color: #1F2937;
  font-weight: 600;
}

.right-panel {
  background: #FFFFFF;
  border-left: 1px solid #E5E7EB;
  overflow-y: auto;
}

.panel-section {
  padding: 14px;
  border-bottom: 1px solid #E5E7EB;
}

.section-head {
  font-size: 11px;
  color: #6A7282;
  margin-bottom: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.score-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 8px;
}

.score-big {
  font-size: 30px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.score-meta {
  font-size: 11px;
  color: #6A7282;
}

.score-track {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: #E5E7EB;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #4B5563, #111827);
}

.metric {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: #4B5563;
  margin-bottom: 8px;
}

.metric strong {
  color: #111827;
  font-weight: 600;
  text-align: right;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
}

.json-box {
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
</style>