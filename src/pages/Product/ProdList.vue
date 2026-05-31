<template>
    <v-container fluid>
        <v-row no-gutters class="search-row | align-item-center | justify-space-between">
            <v-col cols="auto" class="align-item-center | d-flex">
                <v-text-field
                    v-model="search.keyword"
                    placeholder="상품명 검색" 
                    class="inputbox | mr-2"
                    variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                    hide-details
                />
                <v-select
                    v-model="search.status"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    placeholder="상품명 상태" 
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
            <v-col cols="auto" class="justify-end">
                <v-btn
                    @click="handleClickBtn('goToCreate')"
                    variant="outlined"
                    class="active-thin-btn | btn-width"
                >상품 등록</v-btn>
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

          <template #item.thumbUrl="{ item }">
            <v-img
              v-if="(item?.raw ?? item)?.thumbUrl"
              :src="(item?.raw ?? item)?.thumbUrl"
              width="64"
              height="64"
              cover
              class="thumb-img"
            />
            <span v-else>-</span>
          </template>

          <template #item.pStat="{ item }">
            <span
              v-if="(item?.raw ?? item)?.pStat !== undefined && (item?.raw ?? item)?.pStat !== null && (item?.raw ?? item)?.pStat !== '-'"
              class="status-tag"
            >{{ getStatusLabel((item?.raw ?? item)?.pStat) }}</span>
            <span v-else>-</span>
          </template>
        
          <template #item.action="{ item }">
            <v-btn
              class="detail-btn"
              size="small"
              variant="outlined"
              @click.stop="handleClickBtn('goToDetail', (item?.raw ?? item)?.id)"
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
const imageBaseUrl = (import.meta.env.VITE_IMAGE_BASE_URL || '').replace(/\/$/, '');

const search = ref({
  keyword: '',
  status: null,
});

const pageNation = ref({
  current: 1,
  limit: 20,
});

const totalCount = ref(0);
const isLoading = ref(false);

const statusOptions = ref([
  { label: '전체 상태', value: null },
]);

const headerItems = [
  { text: '썸네일', value: 'thumbUrl' },
  { text: '브랜드', value: 'brand' },
  { text: '상품명', value: 'name' },
  { text: '가격', value: 'price' },
  { text: '상태', value: 'pStat' },
  { text: '등록자', value: 'userId' },
  { text: '등록일', value: 'cDate' },
  { text: '수정일', value: 'uDate' },
  { text: '상세', value: 'action' },
];

const tableItems = ref([]);

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  fetchStatusLabelOption();
  fetchListProducts();
});

// ----- 함수 정의 ----- //
function getStatusLabel(value) {
  const matchedOption = statusOptions.value.find((option) => option.value === value || option.value === String(value));
  return matchedOption?.label || '-';
}

function buildThumbnailUrl(path) {
  if (!path) {
    return null;
  }

  const normalizedPath = String(path).trim();
  if (!normalizedPath) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  const relativePath = normalizedPath.replace(/^\/+/, '');
  return imageBaseUrl ? `${imageBaseUrl}/${relativePath}` : `/${relativePath}`;
}

async function fetchListProducts() {
  isLoading.value = true;

  try {
    const keyword = search.value.keyword.trim();
    const response = await HttpHandler.listProducts({
      page: pageNation.value.current,
      limit: pageNation.value.limit,
      name: keyword || null,
      pStat: search.value.status,
    });

    const list = response?.data?.items || [];
    const total = response?.data?.total || 0;

    const mappedRows = list.map((product = {}) => ({
      id: product.id,
      userId: product.userName || product.userId || '-',
      name: product.name || '-',
      brand: product.brand || '-',
      price: typeof product.price === 'number' ? product.price.toLocaleString() : product.price,
      thumbUrl: buildThumbnailUrl(product.thumbUrl),
      pStat: product.pStat,
      cDate: util.formatUnixDate(product.cDate),
      uDate: util.formatUnixDate(product.uDate),
      action: '상세보기',
    }));

    totalCount.value = total;
    tableItems.value = mappedRows;

  } catch (error) {
    console.error('상품 목록 조회 실패:', error);
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
      parentCode: 'PROD_STAT_ROOT',
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
      { label: '전체 상태', value: null },
      ...Array.from(uniqueStatusOptions.values()),
    ];
  } catch (error) {
    console.error('상품 상태 옵션 조회 실패:', error);
    statusOptions.value = [{ label: '전체 상태', value: null }];
  }
}

function handleClickBtn(action, value) {
  switch (action) {
    case 'reset':
      search.value.keyword = '';
      search.value.status = null;
      pageNation.value.current = 1;
      fetchListProducts();
      break;

    case 'search':
      pageNation.value.current = 1;
      fetchListProducts();
      break;

    case 'goToCreate':
      navigateTo(router, '/products/create');
      break;

    case 'goToDetail':
      navigateTo(router, `/products/${value}`);
      break;
    default:
      console.error('알 수 없는 인증 액션 타입:', action);
  }
}

function handleRowClick({ item }) {
  const row = item?.raw ?? item;
  if (!row?.id) {
    return;
  }

  handleClickBtn('goToDetail', row.id);
}

function handlePageChange(nextPage) {
  pageNation.value.current = nextPage;
  fetchListProducts();
}

function handleItemsPerPageChange(limit) {
  pageNation.value.limit = limit;
  pageNation.value.current = 1;
  fetchListProducts();
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

.thumb-img {
    border-radius: 8px; 
    border: 0.7px solid #E5E7EB;
    background-color: #F9FAFB;
    margin: 4px;
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