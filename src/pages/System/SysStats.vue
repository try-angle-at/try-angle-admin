<template>
  <v-container fluid>
    <!-- KPI 요약 카드 섹션 -->
    <v-row no-gutters class="justify-center | ml-4 | mr-4 | mt-6 | mb-4">
      <!-- ① 카테고리별 총 스냅샷 -->
      <v-col cols="12" sm="6" md="4" class="pr-2 | mb-4">
        <v-card class="kpi-card | pa-4" variant="outlined">
          <div class="kpi-title">카테고리별 총 스냅샷</div>
          <div class="kpi-value">452,190</div>
          <div class="kpi-change | change-positive">+5.2%</div>
        </v-card>
      </v-col>

      <!-- ② 평균 프레임 정체 시간 -->
      <v-col cols="12" sm="6" md="4" class="px-1 | mb-4">
        <v-card class="kpi-card | pa-4" variant="outlined">
          <div class="kpi-title">평균 프레임 정체 시간</div>
          <div class="kpi-value">4.2<span style="font-size: 18px">초</span></div>
          <div class="kpi-change | change-negative">-0.8s</div>
        </v-card>
      </v-col>

      <!-- ③ 촬영 승인(canCapture) 비율 -->
      <v-col cols="12" sm="6" md="4" class="pl-2 | mb-4">
        <v-card class="kpi-card | pa-4" variant="outlined">
          <div class="kpi-title">촬영 승인(canCapture) 비율</div>
          <div class="kpi-value">74.5%</div>
          <div class="kpi-change | change-positive">+3.2%</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 차트 섹션 -->
    <v-row no-gutters class="justify-center | ml-4 | mr-4 | mb-4">
      <!-- 차트 1: stuckSec 분포 (도넛 차트) -->
      <v-col cols="12" md="6" class="pr-2 | mb-4">
        <v-card elevation="1" variant="outlined">
          <v-card-title class="pa-4">프레임 정체 구간(stuckSec) 분포</v-card-title>
          <v-card-content class="chart-content">
            <div class="chart-wrapper">
              <canvas id="stuckSecChart"></canvas>
            </div>
          </v-card-content>
        </v-card>
      </v-col>

      <!-- 차트 2: 일별 세션 개수 (바 차트) -->
      <v-col cols="12" md="6" class="pl-2 | mb-4">
        <v-card elevation="1" variant="outlined">
          <v-card-title class="pa-4">일별 세션 개수</v-card-title>
          <v-card-content class="chart-content">
            <div class="chart-wrapper">
              <canvas id="dailySessionChart"></canvas>
            </div>
          </v-card-content>
        </v-card>
      </v-col>
    </v-row>

    <!-- 정체구간 탐지 상세 테이블 -->
    <v-row no-gutters class="justify-center | ml-4 | mr-4">
      <v-col cols="12">
        <v-row no-gutters class="mb-2">
          <v-col class="search-label">
            정체 감지 세션 (3초 이상)
            <span style="color: #2563EB; font-weight: 500;">{{ detailedTableItems.length }}</span>개
          </v-col>
        </v-row>

        <data-table
          :headers="detailedTableHeaders"
          :items="detailedTableItems"
          :loading="isLoading"
          :page="tablePageNation.current"
          :items-per-page="tablePageNation.limit"
          :server-mode="true"
          :total-items="detailedTableItems.length"
          @update:page="handleTablePageChange"
          @update:itemsPerPage="handleTableItemsPerPageChange"
        >
          <template #item.sId="{ item }">
            <button type="button" class="link-button">
              {{ shortenSessionId((item?.raw ?? item)?.sId) }}
            </button>
          </template>

          <template #item.canCapture="{ item }">
            <span
              :class="['status-tag', (item?.raw ?? item)?.canCapture === true ? 'status-tag--possible' : 'status-tag--impossible']"
            >
              {{ (item?.raw ?? item)?.canCapture === true ? '가능' : '불가' }}
            </span>
          </template>

          <template #item.stuckSec="{ item }">
            <span :class="{ 'stuck-sec-danger': (item?.raw ?? item)?.stuckSec >= 3 }">
              {{ formatStuckSec((item?.raw ?? item)?.stuckSec) }}
            </span>
          </template>
        </data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { navigateTo } from '@/common/RouterUtil.js';
import Util from '@/common/Util.js';
import DataTable from '@/components/DataTable.vue';
import * as HttpHandler from '@/common/HttpHandler.js';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController } from 'chart.js';
import { nextTick } from 'vue';

// Chart.js 등록
ChartJS.register(
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const emit = defineEmits(['show-right-btn']);
const router = useRouter();
const util = Util.getInstance();

// ----- 상태 관리 ----- //
const filterState = ref({
  category: 'person',
  period: 7,
});

const isLoading = ref(false);

const categoryItems = ref([
  { label: 'person', value: 'person' },
  { label: 'pose_a', value: 'pose_a' },
  { label: 'pose_b', value: 'pose_b' },
  { label: 'pose_c', value: 'pose_c' },
]);

const periodItems = ref([
  { label: '최근 7일', value: 7 },
  { label: '최근 30일', value: 30 },
  { label: '최근 90일', value: 90 },
  { label: '최근 1년', value: 365 },
]);

// 도넛 차트 인스턴스
let stuckSecChart = null;
let dailySessionChart = null;

// stuckSec 분포 데이터 (목 데이터)
const stuckSecDistribution = ref([
  { range: '1-2초 (단기)', percentage: 62, class: 'bar-short' },
  { range: '3-5초 (주의)', percentage: 28, class: 'bar-medium' },
  { range: '6초 이상 (정체)', percentage: 10, class: 'bar-long' },
]);

// 일별 세션 개수 통계 (목 데이터)
const dailySessionStats = ref([
  { date: '6월 18일', count: 245, percentage: 65 },
  { date: '6월 19일', count: 312, percentage: 83 },
  { date: '6월 20일', count: 278, percentage: 74 },
  { date: '6월 21일', count: 354, percentage: 94 },
  { date: '6월 22일', count: 376, percentage: 100 },
  { date: '6월 23일', count: 189, percentage: 50 },
]);

// 정체구간 탐지 상세 테이블 헤더
const detailedTableHeaders = [
  { text: '세션 ID', value: 'sId' },
  { text: '초(secSeq)', value: 'secSeq' },
  { text: '카테고리', value: 'category' },
  { text: '촬영 가능 여부', value: 'canCapture' },
  { text: '정체 시간(stuckSec)', value: 'stuckSec' },
  { text: '수집 프레임 수', value: 'frameCount' },
];

// 정체구간 탐지 상세 테이블 데이터 (목 데이터)
const detailedTableItems = ref([
  {
    sId: 'b6d7b46a1234567890abcdef',
    secSeq: 6,
    category: 'person',
    canCapture: false,
    stuckSec: 4.0,
    frameCount: 16,
  },
  {
    sId: 'a5c4e2f91112131415161718',
    secSeq: 8,
    category: 'person',
    canCapture: false,
    stuckSec: 5.2,
    frameCount: 22,
  },
  {
    sId: 'c7d9f1a2192021222324252627',
    secSeq: 5,
    category: 'person',
    canCapture: true,
    stuckSec: 3.8,
    frameCount: 18,
  },
  {
    sId: 'e3f5b8c4282930313233343536',
    secSeq: 10,
    category: 'person',
    canCapture: false,
    stuckSec: 6.1,
    frameCount: 25,
  },
  {
    sId: 'd6e8a3f1373839404142434445',
    secSeq: 7,
    category: 'person',
    canCapture: true,
    stuckSec: 4.5,
    frameCount: 19,
  },
]);

// 테이블 페이지네이션
const tablePageNation = ref({
  current: 1,
  limit: 20,
});

// ----- 라이프 사이클 ----- //
onMounted(async () => {
  emit('show-right-btn');
  // DOM이 완전히 렌더링될 때까지 기다린 후 차트 초기화
  await nextTick();
  setTimeout(() => {
    initStuckSecChart();
    initDailySessionChart();
  }, 300);
});

// ----- 함수 정의 ----- //
function initStuckSecChart() {
  const canvas = document.getElementById('stuckSecChart');
  if (!canvas) {
    console.error('stuckSecChart canvas element not found');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return;
  }
  
  if (stuckSecChart) {
    stuckSecChart.destroy();
  }

  stuckSecChart = new ChartJS(ctx, {
    type: 'doughnut',
    data: {
      labels: ['1-2초 (단기)', '3-5초 (주의)', '6초 이상 (정체)'],
      datasets: [
        {
          data: [62, 28, 10],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderColor: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 13,
            },
            color: '#6B7280',
            padding: 16,
            usePointStyle: true,
            pointStyle: 'rect',
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed}%`;
            },
          },
        },
      },
    },
  });
}

function initDailySessionChart() {
  const canvas = document.getElementById('dailySessionChart');
  if (!canvas) {
    console.error('dailySessionChart canvas element not found');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return;
  }
  
  if (dailySessionChart) {
    dailySessionChart.destroy();
  }

  // 날짜에서 월일만 추출 (예: 6월 18일 → 6/18)
  const dateLabels = dailySessionStats.value.map((item) => {
    const match = item.date.match(/(\d+)월\s+(\d+)일/);
    return match ? `${match[1]}/${match[2]}` : item.date;
  });

  const sessionCounts = dailySessionStats.value.map((item) => item.count);

  dailySessionChart = new ChartJS(ctx, {
    type: 'bar',
    data: {
      labels: dateLabels,
      datasets: [
        {
          label: '세션 개수',
          data: sessionCounts,
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: {
              size: 13,
            },
            color: '#6B7280',
            padding: 16,
            usePointStyle: true,
            pointStyle: 'rect',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 13,
            weight: 'bold',
          },
          bodyFont: {
            size: 12,
          },
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y}건`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 12,
            },
            color: '#6B7280',
            callback: function (value) {
              return value + '건';
            },
          },
          grid: {
            color: '#F3F4F6',
            drawBorder: false,
          },
        },
        x: {
          ticks: {
            font: {
              size: 12,
            },
            color: '#6B7280',
          },
          grid: {
            display: false,
            drawBorder: false,
          },
        },
      },
    },
  });
}

function handleSearch() {
  if (!filterState.value.category) {
    alert('포즈 카테고리는 필수 선택입니다.');
    return;
  }
  console.log('검색 조건:', filterState.value);
}

function shortenSessionId(id) {
  if (!id) {
    return '-';
  }
  const idStr = String(id);
  return idStr.slice(0, 5);
}

function formatStuckSec(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }
  return `${Number(value).toFixed(1)}초`;
}

function handleTablePageChange(newPage) {
  tablePageNation.value.current = newPage;
}

function handleTableItemsPerPageChange(newLimit) {
  tablePageNation.value.limit = newLimit;
  tablePageNation.value.current = 1;
}
</script>

<style scoped>
/* 필터 카드 스타일 (GroupList 참고) */
.filter-card {
  border-radius: 8px;
  border: 0.7px solid #E5E7EB;
  background: #FFFFFF;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #101828;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.gap-filter {
  gap: 16px;
}

.gap-2 {
  gap: 8px;
}

.d-flex {
  display: flex;
}

.align-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-start {
  justify-content: flex-start;
}

.justify-space-between {
  justify-content: space-between;
}

.ml-auto {
  margin-left: auto;
}

/* KPI 카드 스타일 */
.kpi-card {
  border-radius: 8px;
  border: 0.7px solid #E5E7EB;
  background: #FFFFFF;
  transition: box-shadow 0.2s ease;
}

.kpi-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.kpi-title {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 4px;
}

.kpi-change {
  font-size: 12px;
  font-weight: 500;
}

.change-positive {
  color: #10B981;
}

.change-negative {
  color: #EF4444;
}

/* 차트 스타일 */
.chart-container {
  padding: 16px 0;
}

.chart-content {
  padding: 24px 16px !important;
  display: flex;
  justify-content: center;
}

/* 차트 컨테이너 */
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 320px;
  min-height: 320px;
}

canvas {
  max-width: 100%;
  height: auto !important;
  width: 100% !important;
}

/* 일별 세션 통계 (레거시) */
.daily-stats-container {
  padding: 16px 0;
}

.daily-stat-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
  width: 80px;
  flex-shrink: 0;
  text-align: right;
  font-weight: 500;
}

.stat-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  height: 28px;
  background: #F3F4F6;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(to right, #3B82F6, #2563EB);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stat-text {
  position: absolute;
  right: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #1F2937;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
}

/* 라인 차트 스타일 */
.line-chart {
  position: relative;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.line-chart-placeholder {
  width: 100%;
  height: 150px;
  position: relative;
  border-left: 1px solid #D1D5DB;
  border-bottom: 1px solid #D1D5DB;
  margin-bottom: 16px;
}

.line-chart-axis-y {
  position: absolute;
  left: -30px;
  font-size: 11px;
  color: #9CA3AF;
}

.line-chart-axis-y:nth-child(1) {
  top: -6px;
}

.line-chart-axis-y:nth-child(3) {
  top: 50%;
  transform: translateY(-50%);
}

.line-chart-axis-y:nth-child(4) {
  bottom: -6px;
}

.line-chart-line {
  position: absolute;
  width: 60%;
  height: 2px;
  background: linear-gradient(to right, #3B82F6 60%, #EF4444 40%);
  top: 30%;
  left: 10%;
}

.line-chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: #6B7280;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-true {
  background: #3B82F6;
}

.legend-false {
  background: #EF4444;
}

/* 상태 태그 스타일 */
.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag--possible {
  background: #ECFDF3;
  color: #027A48;
}

.status-tag--impossible {
  background: #FEF2F2;
  color: #DC2626;
}

/* 정체 시간 위험 표시 */
.stuck-sec-danger {
  color: #DC2626;
  font-weight: 600;
}

/* 테이블 라벨 */
.search-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
  padding-left: 8px;
}

/* 링크 버튼 */
.link-button {
  background: none;
  border: none;
  color: #2563EB;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  font-size: 13px;
}

.link-button:hover {
  text-decoration: underline;
}

/* 버튼 스타일 */
.thin-btn {
  width: 80px;
  border-radius: 8px;
}

.fill-grey {
  color: #ffffff;
  background-color: #4A5565;
}

/* 유틸리티 클래스 */
.ml-4 {
  margin-left: 16px;
}

.pr-2 {
  padding-right: 8px;
}

.px-1 {
  padding-left: 4px;
  padding-right: 4px;
}

.pl-2 {
  padding-left: 8px;
}

.mt-6 {
  margin-top: 24px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.pa-4 {
  padding: 16px;
}

.ml-4 {
  margin-left: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.mr-2 {
  margin-right: 8px;
}

.mr-1 {
  margin-right: 4px;
}

/* 입력 필드 스타일 */
.inputbox :deep(.v-input__control) {
  width: 150px !important;
}

.inputbox :deep(.v-field__input) {
  color: #364153 !important;
  font-size: 13px !important;
}

.inputbox :deep(.v-field__input::placeholder) {
  color: #999 !important;
  font-size: 13px !important;
  opacity: 1;
}
</style>
