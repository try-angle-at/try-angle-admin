<template>
    <v-container fluid>
        <v-row no-gutters class="search-row | align-item-center | justify-space-between">
            <v-col cols="auto" class="align-item-center | d-flex | justify-start">
              <v-text-field
                  v-model="search.userId"
                  placeholder="사용자 ID"
                  class="inputbox | mr-2"
                  type="number"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
              <v-text-field
                  v-model="search.imgId"
                  placeholder="이미지 ID"
                  class="inputbox | mr-2"
                  type="number"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
              <v-select
                  v-model="search.sStat"
                  :items="statusItems"
                  item-title="label"
                  item-value="value"
                  placeholder="세션 상태"
                  class="inputbox | mr-2"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
              <v-text-field
                  v-model="search.sDateStr"
                  placeholder="시작일 (YYYY-MM-DD)"
                  class="datebox | mr-2"
                  type="date"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
              <v-text-field
                  v-model="search.eDateStr"
                  placeholder="종료일 (YYYY-MM-DD)"
                  class="datebox"
                  type="date"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
            </v-col>
            <v-col cols="auto" class="align-item-center | d-flex | mt-3">
              <v-select
                  v-model="search.category"
                  :items="categoryItems"
                  item-title="label"
                  item-value="value"
                  placeholder="촬영 단계 (category)"
                  class="inputbox | mr-2"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
              <v-text-field
                  v-model="search.feedback"
                  placeholder="피드백 문구 키워드"
                  class="inputbox | mr-2"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
              <v-text-field
                  v-model="search.minStuckSec"
                  placeholder="최소 정체 시간 (초)"
                  class="inputbox | mr-2"
                  type="number"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
              <v-select
                  v-model="search.canCapture"
                  :items="canCapItems"
                  item-title="label"
                  item-value="value"
                  placeholder="자동촬영 여부"
                  class="inputbox"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
              />
            </v-col>
            <v-col cols="auto" class="align-item-center">
                <v-btn
                    @click="handleClickBtn('reset')"
                    variant="outlined"
                    class="thin-btn | outline-grey | btn-width | mr-2"
                >초기화</v-btn>
                <v-btn
                    @click="handleClickBtn('search')"
                    variant="outlined"
                    class="thin-btn | fill-grey | btn-width"
                >검색</v-btn>
            </v-col>
        </v-row>

        <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
            <v-col class="search-label">
            총 <span style="color: #2563EB; font-weight: 500;">{{ totalCount }}</span>개
            </v-col>
        </v-row>

        <data-table
            :headers="headerItems"
            :items="tableItems"
            :loading="isLoading"
            :page="pageNation.current"
            :items-per-page="pageNation.limit"
          :server-mode="true"
          :total-items="totalCount"
            @update:page="handlePageChange"
            @update:itemsPerPage="handleItemsPerPageChange"
            @rowClick="handleRowClick"
        > 

          <template #item.id="{ item }">
            <button
              type="button"
              class="link-button"
              @click.stop="handleClickBtn('goToDetail', item?.raw ?? item)"
            >{{ (item?.raw ?? item)?.id ?? '-' }}</button>
          </template>

          <template #item.imgId="{ item }">
            <button
              type="button"
              class="link-button"
              @click.stop="handleClickBtn('goToRefImgDetail', (item?.raw ?? item)?.imgId)"
            >{{ (item?.raw ?? item)?.imgId ?? '-' }}</button>
          </template>

          <template #item.device="{ item }">
            <span>{{ (item?.raw ?? item)?.device || '-' }}</span>
          </template>

          <template #item.sStat="{ item }">
            <span
              v-if="(item?.raw ?? item)?.sStat !== undefined && (item?.raw ?? item)?.sStat !== null && (item?.raw ?? item)?.sStat !== '-'"
              class="status-tag"
            >{{ getStatusLabel((item?.raw ?? item)?.sStat) }}</span>
            <span v-else>-</span>
          </template>
        
          <template #item.action="{ item }">
            <v-btn
              class="detail-btn"
              size="small"
              variant="outlined"
              @click.stop="handleClickBtn('goToDetail', item?.raw ?? item)"
            >상세보기</v-btn>
          </template>

        </data-table>

    </v-container>
</template>


<script setup>
// ----- 선언부 ----- //
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { navigateTo } from '@/common/RouterUtil.js';
import Util from '@/common/Util.js';

import DataTable from '@/components/DataTable.vue';

import * as HttpHandler from '@/common/HttpHandler.js';

const emit = defineEmits([
  'show-right-btn',
]);
const router = useRouter(); 
const util = Util.getInstance();

const search = ref({
    userId:      null,
    imgId:       null,
    sStat:       null,
    sDateStr:    '',    // date input용 문자열 → Unix 변환 후 전송
    eDateStr:    '',
    // [신규] 스냅샷 비즈니스 지표 필터
    category:    null,
    feedback:    '',
    minStuckSec: null,
    canCapture:  null,
});

const pageNation = ref({
  current: 1,
  limit: 20,
});

const totalCount = ref(0);
const isLoading = ref(false);
const statusItems = ref([
  { label: '전체 상태', value: null },
]);
const canCapItems = ref([
  { label: '전체', value: null },
  { label: '가능', value: 'true' },
  { label: '불가', value: 'false' },
]);
const categoryItems = ref([
  { label: '전체 단계', value: null },
  { label: 'person', value: 'person' },
  { label: 'framing_shot', value: 'framing_shot' },
]);

const headerItems = [
  { text: '세션 ID', value: 'id' },
  { text: '사용자명', value: 'userName' },
  { text: '이미지 ID', value: 'imgId' },
  { text: '시작일시', value: 'sDate' },
  { text: '종료일시', value: 'eDate' },
  { text: '디바이스', value: 'device' },
  { text: '세션 상태', value: 'sStat' },
  { text: '등록일', value: 'cDate' },
  { text: '수정일', value: 'uDate' },
  { text: '상세', value: 'action' },
];


const tableItems = ref([]);

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  fetchStatusLabelOption();
  fetchListSessions();
});

// ----- 함수 정의 ----- //
function getStatusLabel(value) {
  const matchedOption = statusItems.value.find((option) => option.value === value || option.value === String(value));
  return matchedOption?.label || '-';
}

async function fetchListSessions() {
    isLoading.value = true;
    try {
        const s = search.value;

        const response = await HttpHandler.listSessions({
            page:  pageNation.value.current,
            limit: pageNation.value.limit,

            // 기본 필터
            userId: s.userId  ? Number(s.userId)  : null,
            imgId:  s.imgId   ? Number(s.imgId)   : null,
            sStat:  s.sStat   !== null ? Number(s.sStat) : null,
            sDate: (s.sDateStr && s.sDateStr.trim()) ? Math.floor(new Date(s.sDateStr).getTime() / 1000) : null,
            eDate: (s.eDateStr && s.eDateStr.trim()) ? Math.floor(new Date(s.eDateStr + 'T23:59:59').getTime() / 1000) : null,

            // [신규] 스냅샷 비즈니스 지표 필터
            category:    s.category    || null,
            feedback:    s.feedback    || null,
            minStuckSec: s.minStuckSec !== null && s.minStuckSec !== '' ? Number(s.minStuckSec) : null,
            canCapture:  s.canCapture  || null,
        });

        const list  = response?.data?.items || [];
        const total = response?.data?.total || 0;

        tableItems.value = list.map((item = {}) => ({
            id:       item.id,
            userId:   item.userId,
            userName: item.userName || '-',
            imgId:    item.imgId,
            sStat:    item.sStat,
            sDate:    util.formatUnixDateTime(item.sDate),
            eDate:    item.eDate ? util.formatUnixDateTime(item.eDate) : '-',
            device:   item.device ? `${item.device.platform ?? '-'} / ${item.device.appVersion ?? '-'}` : '-',
            cDate:    util.formatUnixDateTime(item.cDate),
            uDate:    util.formatUnixDateTime(item.uDate),
        }));

        totalCount.value = total;

    } catch (error) {
        console.error('세션 목록 조회 실패:', error);
        tableItems.value = [];
        totalCount.value = 0;
    } finally {
        isLoading.value = false;
    }
}

async function fetchStatusLabelOption() {
  try {
    const response = await HttpHandler.listTags({
      page: 1,
      parentCode: 'SYS_STAT_ROOT',
      tagName: null,
    });

    const rawItems = response?.data?.items || [];
    const uniqueStatusOptions = new Map();

    rawItems.forEach((status = {}) => {
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

    statusItems.value = [
      { label: '전체 상태', value: null },
      ...Array.from(uniqueStatusOptions.values()),
    ];
  } catch (error) {
    console.error('세션 상태 옵션 조회 실패:', error);
    statusItems.value = [{ label: '전체 상태', value: null }];
  }
}

function handleClickBtn(action, value) {
  switch (action) {
    case 'reset':
      search.value = {
          userId: null, imgId: null, sStat: null,
          sDateStr: '', eDateStr: '',
          category: null, feedback: '', minStuckSec: null, canCapture: null,
      };
      pageNation.value.current = 1;
      fetchListSessions();
      break;

    case 'search':
      pageNation.value.current = 1;
      fetchListSessions();
      break;

case 'goToDetail':
      // value로 넘어온 row 데이터를 localStorage에 저장합니다.
      if (value && value.id) {
        localStorage.setItem('sessionDetail', JSON.stringify(value));
        navigateTo(router, `/system/${value.id}`);
      }
      break;

    case 'goToRefImgDetail':
      if (!value || value === '-' || Number.isNaN(Number(value))) {
        return;
      }
      navigateTo(router, `/ref-images/${value}`);
      break;
    default:
      console.error('알 수 없는 세션 액션 타입:', action);
  }
}

function handleRowClick({ item }) {
  const row = item?.raw ?? item;
  if (!row?.id) {
    return;
  }
  // row 전체를 넘깁니다.
  handleClickBtn('goToDetail', row);
}

function handlePageChange(nextPage) {
  pageNation.value.current = nextPage;
  fetchListSessions();
}

function handleItemsPerPageChange(limit) {
  pageNation.value.limit = limit;
  pageNation.value.current = 1;
  fetchListSessions();
}
</script> 

<style scoped>
.align-item-center {
  align-items: center;
}

.search-row {
    padding: 16px;
    border-radius: 10px;
    border: 0.7px solid #E5E7EB;
    background: #FFF;
}
.search-label {
    color: #4A5565;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.15px;
}

.btn-width {    
    width: 80px;
}
.outline-grey {
    border: 0.7px solid #4A5565;
    color: #4A5565;
}
.fill-grey {
    color: #ffffff;
    background-color: #4A5565;
}

/* .inputbox :deep(.v-input__details) {
  padding-top: 4px !important;
} */
.inputbox :deep(.v-input__control) {
    width: 240px !important;
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

.inputbox :deep(.v-icon) {
    color: #4A5565 !important;
    opacity: 1;
}

.detail-btn {
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

.link-button {
  color: #2563EB;
  cursor: pointer;
  text-decoration: underline;
}

.link-button:disabled {
  color: #9CA3AF;
  cursor: default;
  text-decoration: none;
}

.status-tag {
  display: flex;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  width: fit-content;
  border-radius: 100px;
  background: #E6F0FF;
  color: #2B7FFF;
  font-family: Pretendard;
  font-size: 12px;
  font-weight: 500;
}
</style>