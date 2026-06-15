<template>
    <v-container fluid class="sys-detail pa-0" style="height: 100vh; overflow: hidden;">
        <v-row no-gutters style="height: 100%;">

            <!-- 좌측 패널: 레퍼런스 이미지 + 스켈레톤 -->
            <v-col cols="3" class="ref-panel | d-flex | flex-column" style="border-right: 1px solid #E5E8EB; overflow: hidden;">
                <v-row no-gutters class="align-item-center | px-4 | py-3" style="border-bottom: 1px solid #E5E8EB; flex-shrink: 0;">
                    <v-icon size="16" color="#6A7282" class="mr-1">mdi-image-outline</v-icon>
                    <span class="info-text">Reference Image</span>
                </v-row>

                <!-- 로딩 -->
                <v-row v-if="isRefLoading" no-gutters class="flex-grow-1 | align-center | justify-center | flex-column">
                    <v-progress-circular indeterminate color="#6A7282" size="32" />
                    <span class="info-text mt-2">불러오는 중...</span>
                </v-row>

                <!-- 레퍼런스 이미지 + 스켈레톤 오버레이 -->
                <template v-else-if="refImgDetail.imgUrl">
                    <!-- 이미지 + canvas 오버레이 -->
                    <v-row no-gutters class="px-4 | pt-3 | pb-2" style="flex-shrink: 0;">
                        <div class="image-overlay-wrap">
                            <img
                                ref="imageRef"
                                :src="refImgDetail.imgUrl"
                                class="canvas-image-native"
                                style="opacity: 0.35;"
                                alt="reference"
                                @load="handleImageLoad"
                            />
                            <canvas ref="overlayRef" class="overlay-canvas" />

                        </div>
                    </v-row>

                    <!-- 메타 정보 -->
                    <v-row no-gutters class="px-4 | flex-grow-1 | overflow-y-auto | flex-column" style="scrollbar-width: thin;">
                        <v-row no-gutters class="info-row | mt-2">
                            <v-icon color="#6A7282" size="14" class="mr-1">mdi-pound</v-icon>
                            <span class="info-text">#{{ refImgDetail.id || session.imgId }}</span>
                        </v-row>

                        <v-row v-if="refImgDetail.title" no-gutters class="info-row | mt-1">
                            <span class="info-text">{{ refImgDetail.title }}</span>
                        </v-row>

                        <v-row v-if="refImgDetail.ctgName" no-gutters class="mt-2">
                            <v-chip size="x-small" class="category-chip">{{ refImgDetail.ctgName }}</v-chip>
                        </v-row>

                        <v-row v-if="refImgDetail.kwd && refImgDetail.kwd.length" no-gutters class="mt-2" style="gap: 4px; flex-wrap: wrap;">
                            <v-chip
                                v-for="tag in refImgDetail.kwd"
                                :key="tag"
                                size="x-small"
                                class="tag-chip"
                            >{{ tag }}</v-chip>
                        </v-row>

                        <!-- 스켈레톤 탭일 때 키포인트 신뢰도 요약 -->
                        <template v-if="poseOverlay">
                            <v-row no-gutters class="mt-3" style="border-top: 0.7px solid #E5E8EB; padding-top: 8px;">
                                <v-row no-gutters class="info-row | mb-1">
                                    <v-icon color="#6A7282" size="13" class="mr-1">mdi-human</v-icon>
                                    <span class="info-text">키포인트 {{ poseOverlay.points.length }}개</span>
                                </v-row>
                                <v-row no-gutters style="gap: 4px; flex-wrap: wrap;">
                                    <v-chip
                                        v-for="grp in skeletonGroups"
                                        :key="grp.key"
                                        size="x-small"
                                        variant="outlined"
                                        :style="{ borderColor: grp.color, color: grp.color, fontSize: '10px' }"
                                    >{{ grp.label }}</v-chip>
                                </v-row>
                            </v-row>
                        </template>

                        <v-row v-if="refImgDetail.cDate" no-gutters class="info-row | mt-3">
                            <v-icon color="#6A7282" size="14" class="mr-1">mdi-calendar-outline</v-icon>
                            <span class="info-text">{{ refImgDetail.cDate }}</span>
                        </v-row>
                    </v-row>
                </template>

                <!-- 데이터 없음 -->
                <v-row v-else no-gutters class="flex-grow-1 | align-center | justify-center | flex-column">
                    <v-icon size="36" color="#4A5565">mdi-image-off-outline</v-icon>
                    <span class="info-text mt-2">이미지 정보 없음</span>
                </v-row>
            </v-col>

            <!-- 우측 메인 영역 -->
            <v-col cols="9" class="d-flex | flex-column" style="overflow: hidden;">

                <!-- 상단 헤더 -->
                <v-row no-gutters class="align-item-center | justify-space-between | px-6 | py-3" style="border-bottom: 1px solid #E5E8EB; flex-shrink: 0;">
                    <v-col class="d-flex | align-item-center">
                        <v-btn icon variant="text" size="small" @click="$router.back()" class="mr-2">
                            <v-icon color="#6A7282">mdi-arrow-left</v-icon>
                        </v-btn>
                        <v-row no-gutters class="flex-column">
                            <span class="title-font">세션 상세</span>
                            <span class="info-text" style="font-family: monospace;">{{ session.id || '—' }}</span>
                        </v-row>
                    </v-col>
                    <v-col cols="auto" class="d-flex | align-item-center">
                        <v-chip
                            :color="statusColor"
                            variant="tonal"
                            size="small"
                            class="mr-3"
                        >{{ statusLabel }}</v-chip>
                        <v-btn
                            @click="fetchSessionDetail"
                            variant="outlined"
                            class="thin-btn | outline-grey | btn-width"
                        >새로고침</v-btn>
                    </v-col>
                </v-row>

                <!-- 세션 고정 정보 카드 행 -->
                <v-row no-gutters class="px-6 | py-4 | gap-16" style="flex-shrink: 0; border-bottom: 1px solid #E5E8EB;">
                    <v-col>
                        <v-row no-gutters justify="start">
                            <v-label class="ml-1">사용자</v-label>
                        </v-row>
                        <v-row no-gutters justify="center" class="mt-1">
                            <v-text-field
                                :model-value="session.userName || '—'"
                                class="inputbox"
                                readonly
                                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                            />
                        </v-row>
                    </v-col>
                    <v-col>
                        <v-row no-gutters justify="start">
                            <v-label class="ml-1">플랫폼</v-label>
                        </v-row>
                        <v-row no-gutters justify="center" class="mt-1">
                            <v-text-field
                                :model-value="platformLabel"
                                class="inputbox"
                                readonly
                                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                            />
                        </v-row>
                    </v-col>
                    <v-col>
                        <v-row no-gutters justify="start">
                            <v-label class="ml-1">시작 시각</v-label>
                        </v-row>
                        <v-row no-gutters justify="center" class="mt-1">
                            <v-text-field
                                :model-value="session.sDate || '—'"
                                class="inputbox"
                                readonly
                                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                            />
                        </v-row>
                    </v-col>
                    <v-col>
                        <v-row no-gutters justify="start">
                            <v-label class="ml-1">세션 길이</v-label>
                        </v-row>
                        <v-row no-gutters justify="center" class="mt-1">
                            <v-text-field
                                :model-value="sessionDuration"
                                class="inputbox"
                                readonly
                                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                            />
                        </v-row>
                    </v-col>
                </v-row>

                <!-- 그래프 영역 -->
                <v-row no-gutters class="flex-column | flex-grow-1 | px-6 | pt-4 | pb-2" style="overflow-y: auto; min-height: 0;">

                    <v-row no-gutters class="align-item-center | justify-space-between | mb-3">
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
                    </v-row>

                    <!-- 로딩 -->
                    <v-row v-if="isSessionLoading" no-gutters class="align-center | justify-center" style="height: 300px;">
                        <v-progress-circular indeterminate color="#6A7282" />
                    </v-row>

                    <!-- 스냅샷 없음 -->
                    <v-row v-else-if="!snapshots.length" no-gutters class="flex-column | align-center | justify-center" style="height: 300px;">
                        <v-icon size="40" color="#4A5565">mdi-chart-line-variant</v-icon>
                        <span class="info-text mt-2">스냅샷 데이터가 없습니다</span>
                    </v-row>

                    <!-- 차트 -->
                    <v-row v-else no-gutters class="chart-wrap">
                        <canvas ref="chartCanvas" style="width: 100%; height: 100%;" />
                    </v-row>

                    <!-- 스냅샷 테이블 -->
                    <v-row v-if="snapshots.length" no-gutters class="flex-column | mt-4">
                        <v-row no-gutters class="align-item-center | mb-2">
                            <v-icon size="13" color="#6A7282" class="mr-1">mdi-table</v-icon>
                            <span class="info-text">스냅샷 목록 ({{ snapshots.length }}개)</span>
                        </v-row>
                        <v-data-table
                            :headers="snapshotHeaders"
                            :items="snapshotTableItems"
                            density="compact"
                            :items-per-page="5"
                            class="snapshot-tbl"
                            hide-default-footer
                        >
                            <template #item.score="{ item }">
                                <v-row no-gutters class="align-item-center" style="gap: 6px;">
                                    <div
                                        class="score-bar"
                                        :style="{ width: (item.score ?? 0) + '%', background: scoreColor(item.score) }"
                                    />
                                    <span class="info-text">{{ item.score ?? '—' }}</span>
                                </v-row>
                            </template>
                            <template #item.ts="{ item }">
                                <span class="info-text" style="font-family: monospace;">{{ item.ts }}</span>
                            </template>
                        </v-data-table>
                    </v-row>
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
const grpOf   = i => (i <= 16 ? 'body' : i <= 22 ? 'foot' : i <= 90 ? 'face' : 'hand');
const clamp   = (v, a, b) => Math.min(b, Math.max(a, v));

const skeletonGroups = [
    { key: 'body', label: 'Body',  color: GRP_CSS.body },
    { key: 'foot', label: 'Foot',  color: GRP_CSS.foot },
    { key: 'face', label: 'Face',  color: GRP_CSS.face },
    { key: 'hand', label: 'Hand',  color: GRP_CSS.hand },
];

// ----- 차트 관련 ----- //
const chartCanvas   = ref(null);
let   chartInstance = null;

const availableMetrics = [
    { key: 'score',       label: '종합 점수' },
    { key: 'poseScore',   label: '포즈'      },
    { key: 'angleScore',  label: '앵글'      },
    { key: 'compScore',   label: '구도'      },
];
const activeMetrics = ref(['score', 'poseScore']);

const snapshotHeaders = [
    { title: '#',         key: 'idx',        width: '40px'  },
    { title: '시각',      key: 'ts',         width: '120px' },
    { title: '종합 점수', key: 'score'                      },
    { title: '포즈',      key: 'poseScore'                  },
    { title: '앵글',      key: 'angleScore'                 },
    { title: '구도',      key: 'compScore'                  },
];

const dialog = ref({
    title: '',
    text: '',
    isActive: false,
    isOneBtn: false,
    okText: '확인',
    okButton() {},
});

// ----- computed ----- //
const statusLabel = computed(() => {
    const map = { 0: '대기', 1: '진행중', 2: '완료', 9: '오류' };
    return map[session.value.sStat] ?? '알 수 없음';
});

const statusColor = computed(() => {
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
        idx:        i + 1,
        ts:         s.ts ? util.formatUnixDateTime(s.ts) : '—',
        score:      s.score      ?? s.aiResult?.score      ?? null,
        poseScore:  s.poseScore  ?? s.aiResult?.poseScore  ?? null,
        angleScore: s.angleScore ?? s.aiResult?.angleScore ?? null,
        compScore:  s.compScore  ?? s.aiResult?.compScore  ?? null,
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

// ----- 라이프 사이클 ----- //
onMounted(() => {
    emit('show-right-btn');
    emit('show-left-btn');
    emit('set-page-cfg', {
        name: '세션 상세',
        activePath: '/sessions',
        backPath: '/sessions',
    });

    fetchSessionDetail();
    window.addEventListener('resize', drawSkeleton);
});

onBeforeUnmount(() => {
    if (chartInstance) {
        chartInstance.destroy();
    }
    window.removeEventListener('resize', drawSkeleton);
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

// ----- 함수 정의 ----- //
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

        snapshots.value = Array.isArray(data.snapshots) ? data.snapshots : [];

        if (session.value.imgId) {
            fetchRefImgDetail(session.value.imgId);
        }

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
        score:      '#4A5565',
        poseScore:  '#364153',
        angleScore: '#6A7282',
        compScore:  '#9AA3AF',
    };

    const labels = snapshots.value.map((s, i) =>
        s.ts ? util.formatUnixDateTime(s.ts) : `#${i + 1}`
    );

    const datasets = availableMetrics
        .filter((m) => activeMetrics.value.includes(m.key))
        .map((m) => ({
            label:            m.label,
            data:             snapshots.value.map((s) => s[m.key] ?? s.aiResult?.[m.key] ?? null),
            borderColor:      colorMap[m.key],
            backgroundColor:  colorMap[m.key] + '22',
            fill:             true,
            tension:          0.4,
            pointRadius:      3,
            pointHoverRadius: 6,
            borderWidth:      2,
        }));

    chartInstance = new Chart(chartCanvas.value, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
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
                    ticks: { color: '#6A7282', font: { size: 10 } },
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
    });
}

function toggleMetric(key) {
    const idx = activeMetrics.value.indexOf(key);
    if (idx === -1) {
        activeMetrics.value.push(key);
    } else {
        activeMetrics.value.splice(idx, 1);
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
}

.canvas-image-native {
    display: block;
    width: 100%;
    object-fit: contain;
    border: 0.7px solid #E5E8EB;
    border-radius: 8px;
    background-color: #ffffff;
}

.overlay-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: 8px;
}


.ref-panel {
    background-color: #fafafa;
}

.category-chip {
    background-color: #FFF4F0;
    border: 0.7px solid #FFE0D4;
    color: #FF6129;
    font-size: 10px;
}

.tag-chip {
    background-color: #F3F4F6;
    color: #4A5565;
    font-size: 10px;
}

.chart-wrap {
    position: relative;
    height: 300px;
    background-color: #ffffff;
    border: 0.7px solid #E5E8EB;
    border-radius: 8px;
    padding: 12px;
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