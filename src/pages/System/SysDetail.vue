<template>
    <v-container fluid class="sys-detail pa-0" style="height: 100%; overflow: hidden;">
        <v-row no-gutters style="height: 100%;">

            <!-- 좌측 패널: 레퍼런스 이미지 + 스켈레톤 -->
<v-col cols="3" class="ref-panel | d-flex | flex-column" style="border-right: 1px solid #E5E8EB; overflow: hidden;">
    <v-row no-gutters class="align-center | px-4 | py-3" style="max-height: 60px; height: 60px; border-bottom: 1px solid #E5E8EB; flex-shrink: 0;">
        <v-icon size="18" color="#4A5565" class="mr-2">mdi-image-outline</v-icon>
        <span class="header-id-text">ID: {{ refImgDetail.id || session.imgId }}</span>
    </v-row>

    <v-row v-if="isRefLoading" no-gutters class="flex-grow-1 | align-center | justify-center | flex-column">
        <v-progress-circular indeterminate color="#3B82F6" size="36" width="3" />
        <span class="info-text mt-3 text-secondary">데이터를 불러오는 중입니다...</span>
    </v-row>

    <template v-else-if="refImgDetail.imgUrl">
        <v-row no-gutters class="ref-img-canvas | pa-4 | justify-center | align-center" style="flex-shrink: 0;">
            <div class="canvas-fixed-box">
                <div class="image-overlay-wrap">
                    <img
                        ref="imageRef"
                        :src="refImgDetail.imgUrl"
                        class="canvas-image-native"
                        style="opacity: 0.4;"
                        alt="reference"
                        @load="handleImageLoad"
                    />
                    <canvas ref="overlayRef" class="overlay-canvas" />
                </div>
            </div>
        </v-row>

        <div class="info-detail-container | px-4 | pb-4 | flex-grow-1 | overflow-y-auto" style="scrollbar-width: thin;">
            
            <div v-if="refImgDetail.title" class="info-title-block | mb-3">
                <span class="ref-img-title">{{ refImgDetail.title }}</span>
            </div>

            <div v-if="refImgDetail.ctgName || (refImgDetail.kwd && refImgDetail.kwd.length)" class="chip-group-block | mb-4">
                <v-chip v-if="refImgDetail.ctgName" size="small" class="category-chip | mr-1 | mb-1">
                    {{ refImgDetail.ctgName }}
                </v-chip>
                <v-chip
                    v-for="tag in refImgDetail.kwd"
                    :key="tag"
                    size="small"
                    variant="outlined"
                    class="tag-chip | mr-1 | mb-1"
                >
                    # {{ tag }}
                </v-chip>
            </div>
        </div>
    </template>

    <v-row v-else no-gutters class="flex-grow-1 | align-center | justify-center | flex-column">
        <v-icon size="42" color="#9CA3AF">mdi-image-off-outline</v-icon>
        <span class="info-text mt-3 text-secondary font-weight-medium">등록된 이미지 정보가 없습니다.</span>
    </v-row>
</v-col>

            <!-- 중앙 + 우측 메인 영역 -->
            <v-col cols="9" class="d-flex | flex-column" style="overflow: hidden;">

                <!-- 상단 헤더 -->
                <v-row no-gutters class="align-item-center | justify-end" style="max-height: 60px; height: 60px; border-bottom: 1px solid #E5E8EB; flex-shrink: 0;">
                    <v-chip
                        :color="statusColor"
                        variant="tonal"
                        size="small"
                        class="mr-3"
                    >{{ statusLabel }}</v-chip>
                    <v-btn
                        @click="fetchSessionDetail"
                        variant="outlined"
                        class="thin-btn | outline-grey | btn-width | mr-2"
                    >새로고침</v-btn>
                </v-row>

                <!-- 로딩 -->
                <v-row v-if="isSessionLoading" no-gutters class="align-center | justify-center | flex-grow-1">
                    <v-progress-circular indeterminate color="#6A7282" />
                </v-row>

                <!-- 스냅샷 없음 -->
                <v-row v-else-if="!snapshots.length" no-gutters class="flex-column | align-center | justify-center | flex-grow-1">
                    <v-icon size="40" color="#4A5565">mdi-chart-line-variant</v-icon>
                    <span class="info-text mt-2">스냅샷 데이터가 없습니다</span>
                </v-row>

                <!-- 본문: 중앙(라이브 pose 캔버스 + 차트) / 우측(메트릭 패널) -->
                <v-row v-else no-gutters class="flex-grow-1" style="min-height: 0; overflow: hidden;">

                    <!-- 중앙: 실시간 pose 캔버스 + 타임라인 차트 -->
                    <v-col cols="8" class="d-flex | flex-column central-panel" style="border-right: 1px solid #E5E8EB; overflow: hidden;">
                        <!-- 캔버스 -->
                        <div class="pose-stage-wrapper px-3 pb-3" style="min-height: 0;">
                            <div class="pose-stage">
                                <div class="pose-stage-inner">
                                    <!-- Three.js 마운트 포인트 (항상 DOM에 존재, 탭으로 가려짐) -->
                                    <div ref="threeContainerRef" class="three-stage" v-show="liveTab === '3D'" />

                                    <canvas v-show="liveTab === '2D'" ref="liveCanvasRef" class="live-pose-canvas" />
                                    <div v-if="liveTab === '2D' && !currentSnapshotHasPose" class="pose-empty-overlay">
                                        <v-icon size="28" color="#9AA3AF">mdi-account-question-outline</v-icon>
                                        <span class="info-text mt-1">키포인트 없음</span>
                                    </div>
                                </div>

                                <!-- 탭 전환 버튼 (2D / 3D) -->
                                <div class="tab-bar">
                                    <button
                                        v-for="tab in ['3D', '2D']"
                                        :key="tab"
                                        :class="['tab-btn', { active: liveTab === tab }]"
                                        @click="switchLiveTab(tab)"
                                    >{{ tab }}</button>
                                </div>

                                <!-- HUD: 현재 프레임 카메라 정보 -->
                                <div class="pose-hud | pose-hud-tl">
                                    <div class="pose-hud-label">FRAME</div>
                                    <div class="pose-hud-main">#{{ currentSnapshot?.fseq ?? '—' }}</div>
                                    <div class="pose-hud-sub">{{ currentFrameTime }}</div>
                                </div>
                                <div class="pose-hud | pose-hud-tr">
                                    <v-row no-gutters class="align-item-center" style="gap: 4px; flex-wrap: wrap;">
                                        <v-chip
                                            v-for="grp in skeletonGroups"
                                            :key="grp.key"
                                            size="x-small"
                                            variant="outlined"
                                            :style="{ borderColor: grp.color, color: grp.color, fontSize: '10px' }"
                                        >{{ grp.label }}</v-chip>
                                    </v-row>
                                </div>
                                <div class="pose-hud | pose-hud-bl">
                                    <div class="pose-hud-row"><span>phase</span><strong>{{ currentSnapshot?.category || '—' }}</strong></div>
                                    <div class="pose-hud-row"><span>gate</span><strong>G{{ currentSnapshot?.gate ?? '—' }}</strong></div>
                                </div>
                                <div v-if="currentSnapshot?.feedback" class="pose-feedback">{{ currentSnapshot.feedback }}</div>
                            </div>
                        </div>

                        <!-- 슬라이더: 시점 선택 -->
                        <div class="pose-controls px-3 pb-3" style="flex-shrink: 0;">
                            <v-row no-gutters class="align-item-center |" style="gap: 10px;">
                                <v-btn
                                    icon
                                    size="small"
                                    variant="outlined"
                                    class="play-btn"
                                    :class="{ 'play-btn--on': isPlaying }"
                                    @click="togglePlay"
                                >
                                    <v-icon size="16">{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                                </v-btn>
                                <v-slider
                                    v-model="scrubIndex"
                                    :min="0"
                                    :max="Math.max(0, snapshots.length - 1)"
                                    :step="1"
                                    hide-details
                                    color="#364153"
                                    track-color="#E5E8EB"
                                    thumb-size="12"
                                    density="compact"
                                    class="scrub-slider"
                                    @update:model-value="onScrub"
                                    @start="isPlaying = false"
                                />
                                <span class="info-text scrub-count">{{ scrubIndex + 1 }} / {{ snapshots.length }}</span>
                            </v-row>
                        </div>

                        <!-- 하단: score 추이 차트 -->
                        <div class="chart-section px-5 pb-4" style="flex-shrink: 0;">
                            <div class="chart-header align-item-center | justify-space-between | mb-2" style="max-height: 60px;">
                                <v-row no-gutters class="align-item-center">
                                    <v-icon size="15" color="#6A7282" class="mr-1">mdi-chart-line</v-icon>
                                    <span class="info-text">실시간 AI 분석 추이</span>
                                </v-row>
                                <v-row no-gutters cols="auto" style="gap: 6px;">
                                    <v-btn
                                        v-for="metric in availableMetrics"
                                        :key="metric.key"
                                        size="x-small"
                                        :variant="activeMetrics.includes(metric.key) ? 'outlined' : 'text'"
                                        class="small-btn"
                                        :class="activeMetrics.includes(metric.key) ? 'outline-grey' : ''"
                                        @click="toggleMetric(metric.key)"
                                    >{{ metric.label }}</v-btn>
                                </v-row>
                            </div>
                            <div class="chart-wrap chart-fill">
                                <canvas ref="chartCanvas" />
                            </div>
                        </div>
                    </v-col>

                    <!-- 우측: 메트릭 패널 -->
                    <v-col cols="4" class="d-flex | flex-column | metric-panel" style="overflow-y: auto; scrollbar-width: thin;">

                        <!-- 세션 정보 -->
                         
                        <div class="rsec">
                            <div class="rsh">세션 정보</div>
                            <div class="drow"><span class="dk">세션 ID</span><span class="dv">{{ session.id || '—' }}</span></div>
                            <div class="drow"><span class="dk">사용자</span><span class="dv">{{ session.userName || '—' }}</span></div>
                            <div class="drow"><span class="dk">플랫폼</span><span class="dv">{{ platformLabel }}</span></div>
                            <div class="drow"><span class="dk">시작 시각</span><span class="dv">{{ session.sDate || '—' }}</span></div>
                            <div class="drow"><span class="dk">세션 길이</span><span class="dv">{{ sessionDuration }}</span></div>
                        </div>

                        <!-- 현재 시점 AI 결과 -->
                        <div class="rsec">
                            <div class="rsh">AI 판정 결과 (현재 시점)</div>
                            <v-row no-gutters class="align-item-center | justify-space-between | mb-2">
                                <span class="metric-score-num" :style="{ color: scoreColor(currentSnapshot?.score) }">{{ currentSnapshot?.score ?? '—' }}</span>
                                <v-chip
                                    size="x-small"
                                    :color="currentSnapshot?.passed ? '#16A34A' : '#9AA3AF'"
                                    variant="tonal"
                                >{{ currentSnapshot?.passed ? 'PASSED' : 'NOT PASSED' }}</v-chip>
                            </v-row>
                            <div class="drow"><span class="dk">category</span><span class="dv">{{ currentSnapshot?.category || '—' }}</span></div>
                            <div class="drow"><span class="dk">progress</span><span class="dv">{{ currentProgressPct }}</span></div>
                            <div class="drow"><span class="dk">action</span><span class="dv">{{ currentSnapshot?.action || '—' }}</span></div>
                            <div class="drow"><span class="dk">axis</span><span class="dv">{{ currentSnapshot?.axis || '—' }}</span></div>
                        </div>

                        <!-- 카메라 / 자세 정보 -->
                        <div class="rsec">
                            <div class="rsh">카메라 · 자세 정보</div>
                            <div class="drow"><span class="dk">orientation</span><span class="dv">{{ currentSnapshot?.orientation || '—' }}</span></div>
                            <div class="drow"><span class="dk">head state</span><span class="dv">{{ currentSnapshot?.headState || '—' }}</span></div>
                            <div class="drow"><span class="dk">pitch</span><span class="dv">{{ fmt(currentSnapshot?.pitchDeg, 1) }}°</span></div>
                            <div class="drow"><span class="dk">roll</span><span class="dv">{{ fmt(currentSnapshot?.rollDeg, 1) }}°</span></div>
                            <div class="drow"><span class="dk">zoom</span><span class="dv">{{ fmt(currentSnapshot?.zoomFactor, 2) }}x</span></div>
                            <div class="drow"><span class="dk">focal (35mm eq)</span><span class="dv">{{ fmt(currentSnapshot?.focalMm35eq, 1) }}mm</span></div>
                            <div class="drow"><span class="dk">aspect ratio</span><span class="dv">{{ currentSnapshot?.aspectRatio || '—' }}</span></div>
                            <div class="drow"><span class="dk">torso distance</span><span class="dv">{{ fmt(currentSnapshot?.torsoDistM, 2) }}m</span></div>
                            <div class="drow"><span class="dk">body height frac</span><span class="dv">{{ fmt(currentSnapshot?.bodyHeightFrac, 2) }}</span></div>
                            <div class="drow"><span class="dk">face visible kp</span><span class="dv">{{ currentSnapshot?.faceVis ?? '—' }}/68</span></div>
                        </div>

                        <!-- 피드백 메시지 / reason -->
                        <div class="rsec">
                            <div class="rsh">피드백</div>
                            <div class="feedback-box">{{ currentSnapshot?.feedback || '피드백 없음' }}</div>
                            <div v-if="currentSnapshot?.reason" class="reason-box">{{ currentSnapshot.reason }}</div>
                        </div>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>
    </v-container>

    <!-- 다이얼로그 -->
    <v-dialog v-model="dialog.isActive" width="400px">
        <v-card style="padding: 16px; border-radius: 24px;">
            <v-btn
                icon="mdi-close" variant="text" size="small"
                v-if="!dialog.isOneBtn"
                @click="dialog.isActive = false"
                style="position: absolute; top: 12px; right: 12px; color: #6B7280; z-index: 10;"
            />
            <v-card-title>
                <v-row no-gutters class="align-center | justify-center | mt-3"
                    style="color: #364153; font-size: 18px; font-weight: 700; letter-spacing: -0.2px;"
                >
                    {{ dialog.title }}
                </v-row>
            </v-card-title>
            <v-card-text style="padding: 0px; margin-bottom: 12px;">
                <v-row no-gutters
                    style="justify-content: center; text-align: center; color: #6A7282; font-size: 14px; font-weight: 400; letter-spacing: -0.15px;"
                    v-html="dialog.text"
                />
            </v-card-text>
            <template v-slot:actions>
                <div style="display: flex; width: 100%; gap: 8px;">
                    <v-btn
                        v-if="!dialog.isOneBtn"
                        class="thin-btn"
                        style="border-radius: 16px; flex: 1;"
                        variant="outlined"
                        @click="dialog.isActive = false"
                    >취소</v-btn>
                    <v-btn
                        class="active-thin-btn"
                        :style="`border-radius: 16px; flex: 1; ${dialog.isOneBtn ? 'width: 100%;' : ''}`"
                        variant="outlined"
                        @click="dialog.okButton"
                    >{{ dialog.okText }}</v-btn>
                </div>
            </template>
        </v-card>
    </v-dialog>
</template>


<script setup>
// ----- 선언부 ----- //
import { computed, onBeforeUnmount, onMounted, ref, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Util from '@/common/Util.js';
import * as HttpHandler from '@/common/HttpHandler.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const props = defineProps({
    sessionId: {
        type: [Number, String],
        required: true,
    },
});

const emit = defineEmits([
    'show-right-btn',
    'set-page-cfg',
    'show-left-btn',
]);

const router = useRouter();
const route  = useRoute();
const util   = Util.getInstance();

const resolvedSessionId = computed(() => props.sessionId || route.params.id || route.query.id);

const session = ref({
    id: '',
    userId: null,
    userName: '',
    imgId: null,
    sDate: '',
    eDate: '',
    device: {
        platform: '',
        appVersion: '',
    },
    sStat: null,
    cDate: '',
    uDate: '',
});

const snapshots = ref([]);

const refImgDetail = ref({
    id: null,
    title: '',
    desc: '',
    ctgId: null,
    ctgName: null,
    kwd: [],
    imgUrl: '',
    aiDoc: null,
    cDate: '',
    uDate: '',
});

const isSessionLoading = ref(false);
const isRefLoading     = ref(false);


const statusOptions = ref([]);

// ----- 스켈레톤 관련 ----- //
const imageRef   = ref(null);
const overlayRef = ref(null);
const activeTab  = ref('SKL'); // 항상 SKL

// COCO-17 연결 (RefImgAiDocs 동일)
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

const GRP_CSS = { body: '#00B7FF', foot: '#34D399', face: '#A78BFA', hand: '#FB923C' };
const GRP_HEX = { body: 0x00b7ff, foot: 0x34d399, face: 0xa78bfa, hand: 0xfb923c };
const grpOf   = i => (i <= 16 ? 'body' : i <= 22 ? 'foot' : i <= 90 ? 'face' : 'hand');
const clamp   = (v, a, b) => Math.min(b, Math.max(a, v));

// ----- 라이브 pose 3D 패널 관련 ----- //
const liveTab           = ref('2D'); // '2D' | '3D'
const threeContainerRef = ref(null);

let renderer3d   = null;
let threeScene   = null;
let threeCamera  = null;
let controls3d   = null;
let animId3d     = null;
let skelGroup3d  = null;
let camMarker3d  = null;
let resizeObs3d  = null;
let threeReady   = false;

const skeletonGroups = [
    { key: 'body', label: 'Body',  color: GRP_CSS.body },
    { key: 'foot', label: 'Foot',  color: GRP_CSS.foot },
    { key: 'face', label: 'Face',  color: GRP_CSS.face },
    { key: 'hand', label: 'Hand',  color: GRP_CSS.hand },
];

// ----- 차트 관련 ----- //
const chartCanvas   = ref(null);
let   chartInstance = null;

// realtime-sample.json: snapshots[].res = { score, passed, category, feedback, metadata: { progress, ... } }
const availableMetrics = [
    { key: 'score',    label: 'score'    },
    { key: 'progress', label: 'progress' },
];
const activeMetrics = ref(['score', 'progress']);

// ----- 라이브 pose 캔버스 / 시점 선택(슬라이드) ----- //
const liveCanvasRef = ref(null);
const scrubIndex    = ref(0);   // 현재 선택된 snapshot index
const isPlaying     = ref(false);
let   playTimer     = null;
const PLAY_INTERVAL_MS = 33; // 초당 프레임에 맞춘 재생 간격 (~30fps 배치 기준)

const dialog = ref({
    title: '',
    text: '',
    isActive: false,
    isOneBtn: false,
    okText: '확인',
    okButton() {},
});

// ----- computed ----- //
// ----- computed ----- //
const statusLabel = computed(() => {
    // API로 불러온 동적 옵션에서 현재 세션 상태와 일치하는 값을 찾음
    const option = statusOptions.value.find(opt => opt.value === session.value.sStat);
    return option ? option.label : '알 수 없음';
});

const statusColor = computed(() => {
    // API 응답에 색상 정보가 없으므로 기존 하드코딩된 색상 맵핑 유지
    const map = { 0: '#6A7282', 1: '#4A5565', 2: '#364153', 9: '#E53E3E' };
    return map[session.value.sStat] ?? '#6A7282';
});

const platformLabel = computed(() => {
    const platform   = session.value.device?.platform?.toUpperCase() || '—';
    const appVersion = session.value.device?.appVersion;
    return appVersion ? `${platform}  v${appVersion}` : platform;
});

const sessionDuration = computed(() => {
    const sDate = session.value.sDate;
    const eDate = session.value.eDate;
    if (!sDate || !eDate) {
        return '—';
    }
    const sec = Number(eDate) - Number(sDate);
    if (sec < 60) {
        return `${sec}초`;
    }
    return `${Math.floor(sec / 60)}분 ${sec % 60}초`;
});

const snapshotTableItems = computed(() =>
    snapshots.value.map((s, i) => ({
        idx:         i + 1,
        ts:          s.ts ? util.formatUnixDateTime(s.ts) : '—',
        score:       s.score ?? null,
        category:    s.category || '—',
        passedLabel: s.passed ? 'PASS' : '—',
    }))
);

// aiDoc → 키포인트 파싱 (RefImgAiDocs 동일 로직)
const decodeHex = h => {
    const v = parseInt(h, 16);
    return isFinite(v) ? v / 10000 : 0;
};

const parsePoseKpHex = str => {
    const s = String(str || '').trim();
    if (!s) return [];
    const pts = [];
    const n = Math.floor(s.length / 12);
    for (let i = 0; i < n; i++) {
        const o = i * 12;
        pts.push({
            x:    decodeHex(s.slice(o,      o + 4)),
            y:    decodeHex(s.slice(o + 4,  o + 8)),
            conf: decodeHex(s.slice(o + 8,  o + 12)),
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
    return {
        x: decodeHex(v.slice(0, 4)),
        y: decodeHex(v.slice(4, 8)),
        w: decodeHex(v.slice(8, 12)),
        h: decodeHex(v.slice(12, 16)),
    };
};

const normalizeKpsIntoBbox = (pts, bbox) => {
    const oob = pts.some(p => p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1);
    if (!oob || !bbox) return pts;
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rX = Math.max(maxX - minX, 1e-6), rY = Math.max(maxY - minY, 1e-6);
    return pts.map(p => ({
        x:    clamp(bbox.x + ((p.x - minX) / rX) * bbox.w, 0, 1),
        y:    clamp(bbox.y + ((p.y - minY) / rY) * bbox.h, 0, 1),
        conf: clamp(Number(p.conf ?? 0), 0, 1),
    }));
};

const poseOverlay = computed(() => {
    const pose    = refImgDetail.value.aiDoc?.pose;
    if (!pose) return null;
    const bbox    = parseBboxHex(pose.bbox);
    const fromHex = parsePoseKpHex(pose.kp);
    const from17  = parseKpt17(pose.kpt17);
    const points  = fromHex.length ? fromHex : from17;
    if (!points.length) return null;
    return { points: normalizeKpsIntoBbox(points, bbox), bbox };
});

// ----- 현재 선택 시점(슬라이드 위치)의 스냅샷 ----- //
const currentSnapshot = computed(() => snapshots.value[scrubIndex.value] || null);

// cur.kp(133pt hex) + cur.bbox(hex) → 라이브 pose 캔버스용 keypoint
const livePoseOverlay = computed(() => {
    const s = currentSnapshot.value;
    if (!s) return null;
    const bbox    = parseBboxHex(s.bboxHex);
    const fromHex = parsePoseKpHex(s.kpHex);
    if (!fromHex.length) return null;
    return { points: normalizeKpsIntoBbox(fromHex, bbox), bbox };
});

const currentSnapshotHasPose = computed(() => !!livePoseOverlay.value?.points?.length);

const fmt = (v, d = 1, fb = '—') => {
    const n = Number(v);
    return isFinite(n) ? n.toFixed(d) : fb;
};

const currentFrameTime = computed(() => {
    const ts = currentSnapshot.value?.ts;
    return ts ? util.formatUnixDateTime(ts) : '—';
});

const currentFaceVis = computed(() => {
    const v = currentSnapshot.value?.faceVis;
    return v == null ? '—' : `${v}/68`;
});

const currentProgressPct = computed(() => {
    const p = currentSnapshot.value?.progress;
    return p == null ? '—' : `${Math.round(p * 100)}%`;
});

const avgScore = computed(() => {
    if (!snapshots.value.length) return '—';
    const scores = snapshots.value.map(s => Number(s.score)).filter(isFinite);
    if (!scores.length) return '—';
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg.toFixed(1);
});

const passedRate = computed(() => {
    if (!snapshots.value.length) return '—';
    const passedCount = snapshots.value.filter(s => s.passed).length;
    return `${((passedCount / snapshots.value.length) * 100).toFixed(1)}%`;
});

const updatePageCfg = () => {
    emit('set-page-cfg', {
        name: `세션 상세 : ${session.value.id || '—'}`,
        activePath: '/sessions',
        backPath: '/sessions',
    });
};

// ----- 라이프 사이클 ----- //
onMounted(() => {
    emit('show-right-btn');
    emit('show-left-btn');

    // 1. LocalStorage에서 넘어온 데이터 즉시 바인딩 (UI 깜빡임 최소화)
    const saved = localStorage.getItem('sessionDetail');
    if (saved) {
        try {
            const parsedSession = JSON.parse(saved);
            session.value = { ...session.value, ...parsedSession };
            
            if (session.value.imgId) {
                fetchRefImgDetail(session.value.imgId);
            }
        } catch (e) {
            console.error('localStorage 데이터 파싱 실패', e);
        }
    }

    updatePageCfg();

    // 상태 라벨 옵션 먼저 조회 후 세션 상세 정보 조회
    fetchStatusLabelOption().then(() => {
        fetchSessionDetail();
    });
    
    window.addEventListener('resize', drawSkeleton);
    window.addEventListener('resize', drawLiveSkeleton);
    window.addEventListener('resize', handleThreeResize);
});

onBeforeUnmount(() => {
    if (chartInstance) {
        chartInstance.destroy();
    }
    stopPlay();
    disposeThree3d();
    window.removeEventListener('resize', drawSkeleton);
    window.removeEventListener('resize', drawLiveSkeleton);
    window.removeEventListener('resize', handleThreeResize);
});

watch(activeMetrics, () => {
    nextTick(renderChart);
}, { deep: true });

watch(
    () => refImgDetail.value.aiDoc,
    () => {
        nextTick(drawSkeleton);
    },
);

// 슬라이드로 시점이 바뀔 때마다 라이브 pose 캔버스(2D) 또는 3D 씬 다시 그리기
watch(scrubIndex, () => {
    if (liveTab.value === '3D') {
        nextTick(buildThreeScene3d);
    } else {
        nextTick(drawLiveSkeleton);
    }
    syncChartNeedle();
});

// snapshots가 새로 로드되면 가장 최근(마지막) 시점으로 초기화
watch(snapshots, (list) => {
    stopPlay();
    scrubIndex.value = list.length ? list.length - 1 : 0;
    nextTick(() => {
        if (liveTab.value === '3D') {
            buildThreeScene3d();
        } else {
            drawLiveSkeleton();
        }
    });
});

// ----- 함수 정의 ----- //
async function fetchStatusLabelOption() {
  try {
    const response = await HttpHandler.listTags({
      page: 1,
      parentCode: 'SYS_STAT_ROOT',
      tagName: null,
    });

    const statusItems = response?.data?.items || [];
    const uniqueStatusOptions = new Map();

    statusItems.forEach((status = {}) => {
      const codeSuffix = Number(String(status.code || '').split('_').pop());
      const value = Number.isNaN(codeSuffix) ? status.code : codeSuffix;

      if (value === undefined || value === null || uniqueStatusOptions.has(value)) {
        return;
      }

      uniqueStatusOptions.set(value, {
        value,
        label: status.tagName || status.code || String(value),
      });
    });

    statusOptions.value = [
      { label: '알 수 없음', value: null }, // 상세 페이지에서 굳이 필요하지 않다면 이 줄은 삭제해도 좋습니다.
      ...Array.from(uniqueStatusOptions.values()),
    ];
  } catch (error) {
    console.error('세션 상태 옵션 조회 실패:', error);
    statusOptions.value = [{ label: '알 수 없음', value: null }];
  }
}

async function fetchSessionDetail() {
    if (!resolvedSessionId.value) {
        console.error('sessionId가 없어 세션 데이터를 조회할 수 없습니다.');
        return;
    }

    isSessionLoading.value = true;

    try {
        const response = await HttpHandler.getSessionDetail({
            id: resolvedSessionId.value,
        });

        const statusCode = response?.status?.code;
        if (statusCode && statusCode !== 'S0000') {
            throw new Error(response?.status?.msg || '세션 상세 조회에 실패했습니다.');
        }

        const data = response?.data || {};

        // ── session 정보 매핑 (data.session) ──
        session.value = {
            id:        data.session?.id        || '',
            userId:    data.session?.userId    ?? null,
            userName:  data.session?.userName  || '',
            imgId:     data.session?.imgId     ?? null,
            sDate:     util.formatUnixDateTime(data.session?.sDate),
            eDate:     util.formatUnixDateTime(data.session?.eDate),
            device: {
                platform:   data.session?.device?.platform   || '',
                appVersion: data.session?.device?.appVersion || '',
            },
            sStat: data.session?.sStat ?? null,
            cDate: util.formatUnixDateTime(data.session?.cDate),
            uDate: util.formatUnixDateTime(data.session?.uDate),
        };

        // ── snapshots 정보 매핑 (data.snapshots[]) ──
        // 봉투: { tid, fseq, gate, offsetMs, cur: {...}, res: { score, passed, category, feedback, metadata } }
        const rawSnapshots = Array.isArray(data.snapshots) ? data.snapshots : [];

        snapshots.value = rawSnapshots.map((f) => {
            const cur  = f.cur ?? {};
            const res  = f.res ?? {};
            const meta = res.metadata ?? {};

            return {
                // ── 봉투/머리 ──
                ts:       f.tid ?? null,
                fseq:     f.fseq ?? null,
                offsetMs: f.offsetMs ?? null,
                gate:     f.gate ?? null,
                phase:    f.phase ?? null,
                pidx:     f.pidx ?? null,

                // ── cur (카메라/자세 메타) ──
                size:           cur.size ?? null,
                aspectRatio:    cur.aspectRatio ?? null,
                zoomFactor:     cur.zoomFactor ?? null,
                focalMm35eq:    cur.focalMm35eq ?? null,
                torsoDistM:     cur.torsoDistM ?? null,
                torsoLength:    cur.torsoLength ?? null,
                bodyHeightFrac: cur.bodyHeightFrac ?? null,
                pitchDeg:       cur.pitchDeg ?? null,
                rollDeg:        cur.rollDeg ?? null,
                centroid:       cur.centroid ?? null,
                faceVis:        cur.faceVis ?? null,
                mirror:         cur.mirror ?? null,
                orientation:    cur.orientation ?? null,
                headState:      cur.headState ?? null,
                angleLabel:     cur.angleLabel ?? null,

                // pose 시각화용 raw hex (kp: 133pt keypoint, bboxHex: 인물 bbox)
                kpHex:   cur.kp ?? null,
                pvHex:   cur.pv ?? null,
                bboxHex: cur.bbox ?? null,

                // ── res (AI 판정 결과) ──
                score:    res.score    ?? null,
                passed:   res.passed   ?? false,
                category: res.category ?? null,
                feedback: res.feedback ?? null,
                axis:     meta.axis     ?? null,
                action:   meta.action   ?? null,
                reason:   meta.reason   ?? null,
                progress: meta.progress ?? null,
                stuckSec: meta.stuckSec ?? null,
                canCapture: meta.canCapture ?? false,
            };
        });

        updatePageCfg();
        await nextTick();
        renderChart();
    } catch (error) {
        console.error('세션 상세 조회 실패:', error);
        openDialog(
            '조회 실패',
            error?.message || '세션 정보를 불러오는 중 오류가 발생했습니다.',
            () => { dialog.value.isActive = false; },
            true,
            '확인'
        );
    } finally {
        isSessionLoading.value = false;
    }
}

async function fetchRefImgDetail(imgId) {
    if (!imgId) {
        console.error('imgId가 없어 레퍼런스 이미지를 조회할 수 없습니다.');
        return;
    }

    isRefLoading.value = true;

    try {
        const response = await HttpHandler.getReference({
            id: imgId,
        });

        const statusCode = response?.status?.code;
        if (statusCode && statusCode !== 'S0000') {
            throw new Error(response?.status?.msg || '레퍼런스 이미지 조회에 실패했습니다.');
        }

        const detail = response?.data || {};

        refImgDetail.value = {
            id:      detail.imgId  ?? null,
            title:   detail.title  || '',
            desc:    detail.desc   || '',
            ctgId:   detail.ctg?.ctgId   ?? null,
            ctgName: detail.ctg?.ctgName || null,
            kwd: Array.isArray(detail.kwd)
                ? detail.kwd.map((code) => String(code || '').trim()).filter(Boolean)
                : [],
            imgUrl: detail.imgUrl || '',
            aiDoc:  detail.aiDoc  ?? null,
            cDate:  util.formatUnixDateTime(detail.cDate),
            uDate:  util.formatUnixDateTime(detail.uDate),
        };
    } catch (error) {
        console.error('레퍼런스 이미지 조회 실패:', error);
    } finally {
        isRefLoading.value = false;
    }
}

// ----- 스켈레톤 그리기 (RefImgAiDocs 동일 로직) ----- //
function drawSkeleton() {
    const canvas = overlayRef.value;
    const image  = imageRef.value;
    const pose   = poseOverlay.value;

    if (!canvas || !image) return;

    const W = image.clientWidth;
    const H = image.clientHeight;
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

    const pts = pose.points;
    const thr = 0.05;

    // bbox 점선 사각형
    if (pose.bbox) {
        ctx.save();
        ctx.strokeStyle = 'rgba(16,185,129,0.95)';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(pose.bbox.x * W, pose.bbox.y * H, pose.bbox.w * W, pose.bbox.h * H);
        ctx.restore();
    }

    // 연결선 그리기
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

    // 관절 점
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
}

function clearSkeleton() {
    const canvas = overlayRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function handleImageLoad() {
    drawSkeleton();
}

// 모바일 화면 크기 배경 그리기
function drawMobileScreenBg(ctx, W, H) {
    // 모바일 기본 비율 (9:16 - 세로 모드)
    const mobileAspectRatio = 9 / 16;
    
    // 캔버스에 맞게 모바일 크기 계산
    let mobileW, mobileH;
    const canvasAspectRatio = W / H;
    
    if (canvasAspectRatio > mobileAspectRatio) {
        // 캔버스가 가로로 넓으면 높이 기준으로 계산
        mobileH = H * 0.95;
        mobileW = mobileH * mobileAspectRatio;
    } else {
        // 캔버스가 세로로 길면 너비 기준으로 계산
        mobileW = W * 0.95;
        mobileH = mobileW / mobileAspectRatio;
    }
    
    // 캔버스 중앙에 정렬
    const offsetX = (W - mobileW) / 2;
    const offsetY = (H - mobileH) / 2;
    
    // 모바일 화면 영역 - 반투명 배경
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#9CA3AF';
    ctx.fillRect(offsetX, offsetY, mobileW, mobileH);
    ctx.restore();
    
    // 모바일 화면 영역 - 테두리
    ctx.save();
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(offsetX, offsetY, mobileW, mobileH);
    ctx.restore();
}

function drawLiveSkeleton() {
    const canvas = liveCanvasRef.value;
    if (!canvas) return;

    const wrap = canvas.parentElement;
    const W = wrap?.clientWidth  || 0;
    const H = wrap?.clientHeight || 0;
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

    const pose = livePoseOverlay.value;
    
    // 모바일 화면 배경 그리기
    drawMobileScreenBg(ctx, W, H);
    
    if (!pose?.points?.length) return;

    const pts = pose.points;
    const thr = 0.05;

    // bbox 점선 사각형
    if (pose.bbox) {
        ctx.save();
        ctx.strokeStyle = 'rgba(16,185,129,0.9)';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(pose.bbox.x * W, pose.bbox.y * H, pose.bbox.w * W, pose.bbox.h * H);
        ctx.restore();
    }

    // 연결선 그리기 (COCO17 + FOOT + FACE + HAND, RefImgAiDocs/SysDetail 레퍼런스 동일 로직)
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
    drawConn(COCO17, GRP_CSS.body, 2.4);
    drawConn(FOOT,   GRP_CSS.foot, 1.8);
    drawConn(FACE,   GRP_CSS.face, 1.0);
    drawConn(L_HAND, GRP_CSS.hand, 1.4);
    drawConn(R_HAND, GRP_CSS.hand, 1.4);
    ctx.restore();

    // 관절 점
    ctx.save();
    pts.forEach((p, i) => {
        const g = grpOf(i);
        const r = g === 'body' ? 4 : g === 'foot' ? 3.2 : 2.2;
        const a = Number(p.conf ?? 0);
        ctx.globalAlpha = a < thr ? 0.15 : clamp(a, 0.25, 1);
        ctx.fillStyle   = GRP_CSS[g];
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function switchLiveTab(tab) {
    liveTab.value = tab;
    if (tab === '2D') {
        nextTick(drawLiveSkeleton);
    } else {
        nextTick(() => {
            if (!threeReady) {
                initThree3d();
            } else {
                // 컨테이너가 v-show로 가려져 있다가 다시 보일 때 사이즈 갱신
                handleThreeResize();
            }
            buildThreeScene3d();
        });
    }
}

// ----- Three.js 초기화 (RefImgAiDocs 동일 로직 — 라이브 snapshot 기준) ----- //
function initThree3d() {
    const container = threeContainerRef.value;
    if (!container) return;

    const W = container.clientWidth  || 600;
    const H = container.clientHeight || 600;

    renderer3d = new THREE.WebGLRenderer({ antialias: true });
    renderer3d.setPixelRatio(window.devicePixelRatio || 1);
    renderer3d.setSize(W, H);
    renderer3d.setClearColor(0xffffff, 1);
    container.appendChild(renderer3d.domElement);

    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0xffffff);

    threeScene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 1.3));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4);
    dl.position.set(3, 5, 4);
    threeScene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xc8d8ff, 0.45);
    dl2.position.set(-4, 2, 2);
    threeScene.add(dl2);

    threeScene.add(new THREE.GridHelper(10, 20, 0xd1d5db, 0xe5e7eb));

    threeCamera = new THREE.PerspectiveCamera(45, W / H, 0.05, 100);
    threeCamera.position.set(2.8, -1, 5.3);

    controls3d = new OrbitControls(threeCamera, renderer3d.domElement);
    controls3d.enableDamping = true;
    controls3d.dampingFactor = 0.07;
    controls3d.target.set(0, 0.85, 0);
    controls3d.update();

    threeReady = true;

    const animate = () => {
        animId3d = requestAnimationFrame(animate);
        controls3d.update();
        renderer3d.render(threeScene, threeCamera);
    };
    animate();

    resizeObs3d = new ResizeObserver(() => handleThreeResize());
    resizeObs3d.observe(container);
}

function handleThreeResize() {
    if (!threeContainerRef.value || !renderer3d || !threeCamera) return;
    const nW = threeContainerRef.value.clientWidth;
    const nH = threeContainerRef.value.clientHeight;
    if (!nW || !nH) return;
    threeCamera.aspect = nW / nH;
    threeCamera.updateProjectionMatrix();
    renderer3d.setSize(nW, nH);
}

// 현재 선택된(scrub) 시점의 snapshot 기준으로 3D 씬 구성
function buildThreeScene3d() {
    if (!threeReady || !threeScene) return;

    // 기존 오브젝트 정리
    if (camMarker3d?.userData?.shadowGroup) {
        const sg = camMarker3d.userData.shadowGroup;
        threeScene.remove(sg);
        sg.traverse(o => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose(); }
        });
    }
    [skelGroup3d, camMarker3d].forEach(obj => {
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
    skelGroup3d = null;
    camMarker3d = null;

    skelGroup3d = new THREE.Group();

    const snap = currentSnapshot.value;
    const pose = livePoseOverlay.value;

    if (pose?.points?.length) {
        const pitchDeg  = Number(snap?.pitchDeg ?? 0);
        const distM     = Number(snap?.torsoDistM ?? 2.5);
        const focalMm35 = Number(snap?.focalMm35eq ?? 50);
        const imgW      = Number(snap?.size?.w ?? 720);
        const imgH      = Number(snap?.size?.h ?? 960);
        const aspect    = imgW / imgH;

        const fovVRad = 2 * Math.atan(18 / Math.max(focalMm35, 10));
        const d       = isFinite(distM) && distM > 0.1 ? distM : 2.5;
        const sceneH  = 2 * d * Math.tan(fovVRad / 2);
        const sceneW  = sceneH * aspect;

        const pitchRad     = pitchDeg * Math.PI / 180;
        const centerYShift = d * Math.tan(pitchRad);

        const pts = pose.points;

        const kp3d = pts.map(p => ({
            wx:   (p.x - 0.5) * sceneW,
            wy:   -(p.y - 0.5) * sceneH + centerYShift,
            conf: p.conf,
        }));

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
                skelGroup3d.add(new THREE.Line(geo, mat));
            });
        };

        drawConns(COCO17, 'body');
        drawConns(FOOT,   'foot');
        drawConns(FACE,   'face');
        drawConns(L_HAND, 'hand');
        drawConns(R_HAND, 'hand');

        pts.forEach((p, i) => {
            if ((p.conf ?? 0) < 0.08) return;
            const g = grpOf(i);
            const r = g === 'body' ? 0.020 : g === 'foot' ? 0.015 : 0.008;
            const mat = new THREE.MeshStandardMaterial({
                color:             GRP_HEX[g],
                emissive:          GRP_HEX[g],
                emissiveIntensity: 0.2,
                roughness:         0.4,
            });
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
            mesh.position.set(kp3d[i].wx, kp3d[i].wy, 0);
            skelGroup3d.add(mesh);
        });

        if (pose.bbox) {
            const bb  = pose.bbox;
            const bx1 = (bb.x        - 0.5) * sceneW;
            const bx2 = (bb.x + bb.w - 0.5) * sceneW;
            const by1 = -(bb.y        - 0.5) * sceneH + centerYShift;
            const by2 = -(bb.y + bb.h - 0.5) * sceneH + centerYShift;
            const geo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(bx1, by1, 0),
                new THREE.Vector3(bx2, by1, 0),
                new THREE.Vector3(bx2, by2, 0),
                new THREE.Vector3(bx1, by2, 0),
                new THREE.Vector3(bx1, by1, 0),
            ]);
            const bmat = new THREE.LineDashedMaterial({ color: 0x10b981, dashSize: 0.04, gapSize: 0.03, opacity: 0.7, transparent: true });
            const bl   = new THREE.Line(geo, bmat);
            bl.computeLineDistances();
            skelGroup3d.add(bl);
        }

        const validYs = kp3d.filter(k => k.conf > 0.05).map(k => k.wy);
        if (validYs.length) {
            skelGroup3d.position.y = -Math.min(...validYs);
        }
    } else {
        const mat  = new THREE.MeshStandardMaterial({ color: 0xd1d5db, wireframe: true });
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12), mat);
        mesh.position.set(0, 0.85, 0);
        skelGroup3d.add(mesh);
    }

    threeScene.add(skelGroup3d);

    // ── 카메라 리그 ──
    const pitchDeg  = Number(snap?.pitchDeg ?? 0);
    const rollDeg   = Number(snap?.rollDeg ?? 0);
    const focalMm35 = Number(snap?.focalMm35eq ?? 50);
    const distM     = Number(snap?.torsoDistM ?? 2.5);
    const imgW      = Number(snap?.size?.w ?? 720);
    const imgH      = Number(snap?.size?.h ?? 960);
    const imgAspect = imgW / imgH;

    const pitchRad = pitchDeg * Math.PI / 180;
    const rollRad  = rollDeg  * Math.PI / 180;
    const subjMidY = 0.85;
    const camZ     = clamp(distM, 1.0, 6.0);
    const camY     = clamp(subjMidY - camZ * Math.tan(pitchRad), 0.3, 3.5);

    const fovVDeg = (2 * Math.atan(18 / Math.max(focalMm35, 10))) * 180 / Math.PI;
    const fovVRad = fovVDeg * Math.PI / 180;

    camMarker3d = new THREE.Group();

    const bodyGeo  = new THREE.BoxGeometry(0.18, 0.12, 0.09);
    const bodyMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5, metalness: 0.4 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    camMarker3d.add(bodyMesh);

    const lensBodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 20);
    const lensBodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.6 });
    const lensBody    = new THREE.Mesh(lensBodyGeo, lensBodyMat);
    lensBody.rotation.x = Math.PI / 2;
    lensBody.position.set(0, 0, -0.075);
    camMarker3d.add(lensBody);

    const ringGeo = new THREE.TorusGeometry(0.042, 0.006, 10, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.6 });
    const ring    = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0, -0.105);
    camMarker3d.add(ring);

    const shoeGeo = new THREE.BoxGeometry(0.08, 0.02, 0.03);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
    const shoe    = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, 0.07, 0);
    camMarker3d.add(shoe);

    const fLen  = clamp(camZ * 0.85, 0.8, 3.5);
    const halfH = fLen * Math.tan(fovVRad / 2);
    const halfW = halfH * imgAspect;

    const ftl = new THREE.Vector3(-halfW,  halfH, -fLen);
    const ftr = new THREE.Vector3( halfW,  halfH, -fLen);
    const fbl = new THREE.Vector3(-halfW, -halfH, -fLen);
    const fbr = new THREE.Vector3( halfW, -halfH, -fLen);
    const org = new THREE.Vector3(0, 0, 0);

    const frustumPts = [
        org.clone(), ftl.clone(),
        org.clone(), ftr.clone(),
        org.clone(), fbl.clone(),
        org.clone(), fbr.clone(),
        ftl.clone(), ftr.clone(),
        ftr.clone(), fbr.clone(),
        fbr.clone(), fbl.clone(),
        fbl.clone(), ftl.clone(),
    ];
    const frustumGeo = new THREE.BufferGeometry().setFromPoints(frustumPts);
    const frustumMat = new THREE.LineBasicMaterial({ color: 0xff6b6b, opacity: 0.55, transparent: true });
    camMarker3d.add(new THREE.LineSegments(frustumGeo, frustumMat));

    const axisGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -camZ * 0.95),
    ]);
    const axisMat  = new THREE.LineDashedMaterial({ color: 0xff9900, dashSize: 0.08, gapSize: 0.05, opacity: 0.7, transparent: true });
    const axisLine = new THREE.Line(axisGeo, axisMat);
    axisLine.computeLineDistances();
    camMarker3d.add(axisLine);

    camMarker3d.position.set(0, camY, camZ);

    const lookPitch = -Math.atan2(camY - subjMidY, camZ);
    camMarker3d.rotation.order = 'YXZ';
    camMarker3d.rotation.y = 0;
    camMarker3d.rotation.x = lookPitch;
    camMarker3d.rotation.z = rollRad;

    threeScene.add(camMarker3d);

    const shadowGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -camY + 0.002, 0),
    ]);
    const shadowMat  = new THREE.LineDashedMaterial({ color: 0xaaaaaa, dashSize: 0.05, gapSize: 0.04, opacity: 0.5, transparent: true });
    const shadowLine = new THREE.Line(shadowGeo, shadowMat);
    shadowLine.computeLineDistances();
    const shadowGroup = new THREE.Group();
    shadowGroup.position.copy(camMarker3d.position);
    shadowGroup.add(shadowLine);

    const circleGeo = new THREE.RingGeometry(0.09, 0.12, 32);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0xff6b6b, opacity: 0.35, transparent: true, side: THREE.DoubleSide });
    const circle    = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(0, -camY + 0.002, 0);
    shadowGroup.add(circle);

    camMarker3d.userData.shadowGroup = shadowGroup;
    threeScene.add(shadowGroup);
}

function disposeThree3d() {
    if (animId3d) cancelAnimationFrame(animId3d);
    if (resizeObs3d) resizeObs3d.disconnect();
    if (controls3d) controls3d.dispose();
    if (renderer3d) renderer3d.dispose();
    animId3d = null;
    resizeObs3d = null;
    controls3d = null;
    renderer3d = null;
    threeScene = null;
    threeCamera = null;
    skelGroup3d = null;
    camMarker3d = null;
    threeReady = false;
}


const chartNeedlePlugin = {
    id: 'scrubNeedle',
    afterDraw(chart) {
        const idx = scrubIndex.value;
        const meta = chart.getDatasetMeta(0);
        const point = meta?.data?.[idx];
        if (!point) return;
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.strokeStyle = '#FF6129';
        ctx.lineWidth   = 1.3;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(point.x, chartArea.top);
        ctx.lineTo(point.x, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
    },
};

async function renderChart() {
    if (!snapshots.value.length || !chartCanvas.value) {
        return;
    }

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    const colorMap = {
        score:    '#364153',
        progress: '#9AA3AF',
    };

    const labels = snapshots.value.map((s, i) =>
        s.ts ? util.formatUnixDateTime(s.ts) : `#${i + 1}`
    );

    // progress는 0~1 스케일이므로 score(0~100)와 같은 축에서 보기 위해 100배 스케일
    const valueOf = (s, key) => {
        if (key === 'progress') {
            return s.progress == null ? null : Math.round(s.progress * 100);
        }
        return s[key] ?? null;
    };

    // 항상 score 와 progress를 모두 노출합니다 (토글 버튼은 UI에 남기되, 차트 데이터는 항상 포함)
    const datasets = availableMetrics.map((m) => ({
        label:            m.label,
        data:             snapshots.value.map((s) => valueOf(s, m.key)),
        borderColor:      colorMap[m.key],
        backgroundColor:  colorMap[m.key] + '22',
        fill:             true,
        tension:          0.35,
        pointRadius:      0,
        pointHoverRadius: 5,
        borderWidth:      1.6,
    }));

    chartInstance = new Chart(chartCanvas.value, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            animation:           false,
            interaction: { mode: 'index', intersect: false },
            onClick: (evt, elements, chart) => {
                const points = chart.getElementsAtEventForMode(evt, 'index', { intersect: false }, true);
                if (points.length) {
                    isPlaying.value = false;
                    scrubIndex.value = points[0].index;
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels:  { color: '#4A5565', font: { size: 11 }, boxWidth: 12 },
                },
                tooltip: {
                    backgroundColor: '#ffffff',
                    borderColor:     '#E5E8EB',
                    borderWidth:     1,
                    titleColor:      '#364153',
                    bodyColor:       '#6A7282',
                },
            },
            scales: {
                x: {
                    ticks: { color: '#6A7282', font: { size: 10 }, maxTicksLimit: 8 },
                    grid:  { color: '#E5E8EB' },
                },
                y: {
                    min:   0,
                    max:   100,
                    ticks: { color: '#6A7282', font: { size: 10 }, stepSize: 20 },
                    grid:  { color: '#E5E8EB' },
                },
            },
        },
        plugins: [chartNeedlePlugin],
    });

    syncChartNeedle();
}

function syncChartNeedle() {
    if (chartInstance) {
        chartInstance.draw();
    }
}

function toggleMetric(key) {
    const idx = activeMetrics.value.indexOf(key);
    if (idx === -1) {
        activeMetrics.value.push(key);
    } else {
        activeMetrics.value.splice(idx, 1);
    }
}

// ----- 슬라이드(시점 선택) + 재생 ----- //
function onScrub(value) {
    scrubIndex.value = Number(value) || 0;
}

function togglePlay() {
    if (isPlaying.value) {
        stopPlay();
        return;
    }
    // 마지막 프레임에서 재생을 누르면 처음부터 다시 재생
    if (scrubIndex.value >= snapshots.value.length - 1) {
        scrubIndex.value = 0;
    }
    isPlaying.value = true;
    playTimer = setInterval(() => {
        if (scrubIndex.value >= snapshots.value.length - 1) {
            stopPlay();
            return;
        }
        scrubIndex.value += 1;
    }, PLAY_INTERVAL_MS);
}

function stopPlay() {
    isPlaying.value = false;
    if (playTimer) {
        clearInterval(playTimer);
        playTimer = null;
    }
}

function scoreColor(score) {
    if (score == null) {
        return '#E5E8EB';
    }
    if (score >= 80) {
        return '#364153';
    }
    if (score >= 50) {
        return '#6A7282';
    }
    return '#9AA3AF';
}

function openDialog(title, text, onConfirm, isOneBtn, okText) {
    dialog.value.title    = title;
    dialog.value.text     = text;
    dialog.value.okButton = onConfirm;
    dialog.value.isActive = true;
    dialog.value.isOneBtn = isOneBtn || false;
    dialog.value.okText   = okText   || '확인';
}
</script>


<style scoped>
.ref-img-canvas {
  background-color: #F3F4F6; /* 대비감을 위해 외부 배경은 옅은 그레이 */
  width: 100%;
}

.ref-img-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.align-item-center {
    align-items: center;
}

.btn-width {
    width: 100px;
}

.outline-grey {
    border: 0.7px solid #4A5565;
    color: #4A5565;
}

.fill-grey {
    color: #ffffff !important;
    background-color: #4A5565 !important;
}

.small-btn {
    padding: 4px 8px;
    align-items: center;
    border-radius: 8px;
    border: 0.7px solid #4A5565;
    color: #4A5565;
    letter-spacing: -0.15px;
    font-family: Pretendard;
    font-size: 12px;
    font-weight: 500;
}

.thin-btn {
    border-radius: 8px;
    font-family: Pretendard;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.15px;
}

.active-thin-btn {
    border-radius: 8px;
    font-family: Pretendard;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.15px;
    color: #ffffff !important;
    background-color: #4A5565 !important;
}

.title-font {
    color: #364153;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.2px;
    font-family: Pretendard;
}

.info-row {
    align-items: center;
}

.info-text {
    color: #6A7282;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: -0.15px;
    font-family: Pretendard;
}

/* 이미지 + 스켈레톤 오버레이 */
.image-overlay-wrap {
    position: relative;
    display: inline-block;
    width: 100%;
    line-height: 0;
    background-color: transparent;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.canvas-image-native {
    display: block;
    width: 100%;
    object-fit: contain;
    border: 0.7px solid #E5E8EB;
    border-radius: 8px;
    background-color: transparent;
}

.overlay-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: 8px;
    background-color: transparent;
    background-color: transparent;
}


.ref-panel {
    background-color: transparent;
}

.category-chip {
    background-color: transparent;
    border: 0.7px solid #FFE0D4;
    color: #FF6129;
    font-size: 10px;
}

.tag-chip {
    background-color: transparent;
    color: #4A5565;
    font-size: 10px;
}

.chart-wrap {
    position: relative;
    height: 160px;
    background-color: transparent;
    border: 0.7px solid #E5E8EB;
    border-radius: 8px;
    padding: 10px 12px;
}

.central-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.pose-stage-wrapper {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.pose-stage {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    background-color: transparent;
    border: 0.7px solid #E5E8EB;
    border-radius: 12px;
    overflow: hidden;
}

.pose-stage-inner {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: transparent;
}

/* Three.js 마운트 div — pose-stage-inner 풀사이즈 */
.three-stage {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
}
.three-stage :deep(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
}

/* 2D / 3D 탭 */
.tab-bar {
    position: absolute;
    bottom: 10px; right: 10px;
    display: flex; gap: 4px;
    z-index: 10;
    background: rgba(10, 10, 14, 0.72);
    backdrop-filter: blur(6px);
    border: 0.7px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 3px;
}

.tab-btn {
    font-size: 11px; font-weight: 600;
    padding: 4px 10px;
    border: none; border-radius: 6px;
    background: transparent; color: #9AA3AF;
    cursor: pointer;
    transition: background .15s, color .15s;
    line-height: 1.4;
}
.tab-btn.active  { background: #ffffff; color: #111827; }
.tab-btn:hover:not(.active) { background: rgba(255, 255, 255, 0.12); color: #ffffff; }

.live-pose-canvas {
    display: block;
    width: 100%;
    height: 100%;
}

.pose-empty-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.pose-empty-overlay .info-text {
    color: #9AA3AF;
}

.pose-hud {
    position: absolute;
    z-index: 5;
    background: rgba(10, 10, 14, 0.72);
    border: 0.7px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 6px 10px;
    backdrop-filter: blur(6px);
    pointer-events: none;
}

.pose-hud-tl { top: 10px; left: 10px; }
.pose-hud-tr { top: 10px; right: 10px; }
.pose-hud-bl { bottom: 10px; left: 10px; }

.pose-hud-label {
    font-size: 9px;
    letter-spacing: 0.08em;
    color: #9AA3AF;
    font-family: ui-monospace, monospace;
}

.pose-hud-main {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    font-family: ui-monospace, monospace;
}

.pose-hud-sub {
    font-size: 10px;
    color: #9AA3AF;
    font-family: ui-monospace, monospace;
}

.pose-hud-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 10px;
    font-family: ui-monospace, monospace;
}

.pose-hud-row span { color: #9AA3AF; }
.pose-hud-row strong { color: #ffffff; font-weight: 600; }

.pose-feedback {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    max-width: 80%;
    background: rgba(10, 10, 14, 0.78);
    border: 0.7px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    padding: 6px 14px;
    color: #ffffff;
    font-size: 11px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── 슬라이더 / 재생 버튼 ── */
.play-btn {
    border-color: #4A5565 !important;
    color: #4A5565 !important;
    flex-shrink: 0;
}

.play-btn--on {
    border-color: #364153 !important;
    background-color: transparent !important;
    color: #364153 !important;
}

.scrub-slider {
    flex: 1 1 auto;
}

.scrub-count {
    flex-shrink: 0;
    min-width: 56px;
    text-align: right;
    font-family: ui-monospace, monospace;
}

/* ── 우측 메트릭 패널 ── */
.metric-panel {
    background-color: #F3F4F6;
}

.metric-panel .rsec {
    padding: 14px 16px;
    border-bottom: 1px solid #E5E8EB;
}

.rsh {
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6A7282;
    margin-bottom: 10px;
    font-family: Pretendard;
}

.metric-score-num {
    font-size: 28px;
    font-weight: 800;
    font-family: ui-monospace, monospace;
    line-height: 1;
}

.drow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.drow:last-child {
    margin-bottom: 0;
}

.dk {
    font-size: 11px;
    color: #6A7282;
    font-family: Pretendard;
}

.dv {
    font-size: 12px;
    color: #364153;
    font-weight: 500;
    font-family: ui-monospace, monospace;
    text-align: right;
}

.feedback-box {
    font-size: 12px;
    color: #364153;
    background-color: transparent;
    border: 0.7px solid #E5E8EB;
    border-radius: 8px;
    padding: 10px 12px;
    line-height: 1.5;
}

.reason-box {
    margin-top: 8px;
    font-size: 10px;
    color: #9AA3AF;
    font-family: ui-monospace, monospace;
    line-height: 1.5;
    word-break: break-all;
}

.score-bar {
    height: 6px;
    border-radius: 3px;
    min-width: 4px;
    max-width: 80px;
}

.snapshot-tbl {
    background: transparent !important;
}

.snapshot-tbl :deep(.v-data-table__td) {
    font-size: 12px !important;
    color: #6A7282 !important;
    border-bottom: 0.7px solid #E5E8EB !important;
}

.snapshot-tbl :deep(.v-data-table__th) {
    font-size: 11px !important;
    color: #4A5565 !important;
    border-bottom: 0.7px solid #E5E8EB !important;
    background: transparent !important;
}

.inputbox :deep(.v-field__input) {
    color: #364153 !important;
    font-size: 14px !important;
}

.inputbox :deep(.v-field__input::placeholder) {
    color: #364153 !important;
    font-size: 14px !important;
    opacity: 1;
}

:deep(.v-label) {
    color: #4A5565;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
}

.gap-16 {
    column-gap: 16px;
}
</style>