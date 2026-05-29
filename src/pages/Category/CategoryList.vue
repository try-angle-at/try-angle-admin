<template>
  <v-container fluid>
    <v-row no-gutters class="search-row | align-item-center | justify-space-between">
      <v-col cols="auto" class="align-item-center | d-flex">
        <v-text-field
          v-model="search.keyword"
          placeholder="카테고리명 검색"
          class="inputbox | mr-2"
          variant="outlined"
          density="compact"
          rounded="lg"
          bg-color="#ffffff"
          base-color="#4A5565"
          color="#E5E8EB"
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
        >카테고리 등록</v-btn>
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
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
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
  keyword: '',
});

const pageNation = ref({
  current: 1,
  limit: 20,
});

const totalCount = ref(0);
const isLoading = ref(false);

const headerItems = [
  { text: '카테고리명', value: 'name' },
  { text: '등록일', value: 'cDate' },
  { text: '수정일', value: 'uDate' },
  { text: '상세', value: 'action' },
];

const tableItems = ref([]);

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  fetchListCategories();
});

// ----- 함수 정의 ----- //

async function fetchListCategories() {
  isLoading.value = true;

  try {
    const response = await HttpHandler.listCategories({
      page: pageNation.value.current,
      limit: pageNation.value.limit,
    });

    const list = response?.data?.items || [];
    const total = response?.data?.total || 0;
    const maxPage = Math.max(1, Math.ceil(total / pageNation.value.limit));

    if (pageNation.value.current > maxPage) {
      pageNation.value.current = maxPage;
      await fetchListCategories();
      return;
    }

    let mappedRows = list.map((category = {}) => ({
      id: category.id,
      name: category.name || '-',
      cDate: util.formatUnixDateTime(category.cDate),
      uDate: util.formatUnixDateTime(category.uDate),
      action: '상세보기',
    }));

    const keyword = search.value.keyword.trim().toLowerCase();
    if (keyword) {
      mappedRows = mappedRows.filter((item) => String(item.name).toLowerCase().includes(keyword));
      totalCount.value = mappedRows.length;
    } else {
      totalCount.value = total;
    }

    tableItems.value = mappedRows;
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error);
    tableItems.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
}

function handleClickBtn(action, value) {
  switch (action) {
    case 'reset':
      search.value.keyword = '';
      pageNation.value.current = 1;
      fetchListCategories();
      break;

    case 'search':
      pageNation.value.current = 1;
      fetchListCategories();
      break;

    case 'goToCreate':
      navigateTo(router, '/category/create');
      break;

    case 'goToDetail':
      navigateTo(router, `/category/${value}`);
      break;

    default:
      console.error('알 수 없는 카테고리 액션 타입:', action);
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
  fetchListCategories();
}

function handleItemsPerPageChange(limit) {
  pageNation.value.limit = limit;
  pageNation.value.current = 1;
  fetchListCategories();
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
  width: 100px;
}

.outline-grey {
  border: 0.7px solid #4A5565;
  color: #4A5565;
}

.fill-grey {
  color: #ffffff;
  background-color: #4A5565;
}

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
</style>