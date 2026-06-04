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
          class="detail-btn | fill-grey | mr-1"
          size="small"
          variant="outlined"
          @click.stop="handleClickBtn('goToDetail', (item?.raw ?? item)?.id)"
        >수정</v-btn>
        <v-btn
          class="detail-btn"
          size="small"
          variant="outlined"
          @click.stop="handleClickBtn('delete', (item?.raw ?? item)?.id)"
        >삭제</v-btn>
      </template>
    </data-table>
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
        v-html="dialog.text"/>
      </v-card-text>

      <template v-slot:actions>
        <div style="display: flex; width: 100%; gap: 8px;">
          <v-btn 
            v-if="!dialog.isOneBtn"
            class="thin-btn" 
            style="border-radius: 16px; flex: 1;" 
            variant="outlined" 
            @click="dialog.isActive = false" 
            :loading="isSubmitting"
          >취소</v-btn>
          <v-btn 
            class="active-thin-btn" 
            :style="`border-radius: 16px; flex: 1; ${dialog.isOneBtn ? 'width: 100%;' : ''}`" 
            variant="outlined" 
            @click="dialog.okButton" 
            :loading="isSubmitting">
            {{ dialog.okText }}
          </v-btn>
        </div>
      </template>
    </v-card>
  </v-dialog>

  <v-dialog
    v-if="CtgDialog.isActive && CtgDialog.mode === 'create'"
    v-model="CtgDialog.isActive" width="500px">
    <category-form-create
      @close="handleCloseCtgDialog"
    />
  </v-dialog>
  <v-dialog
    v-if="CtgDialog.isActive && CtgDialog.mode === 'detail'"
    v-model="CtgDialog.isActive" width="500px">
    <category-form-detail
      :category-id="CtgDialog.ctgId"
      @close="handleCloseCtgDialog"
    />
  </v-dialog>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, ref } from 'vue';
import Util from '@/common/Util.js';

import DataTable from '@/components/DataTable.vue';
import CategoryFormCreate from '@/pages/Category/CategoryFormCreate.vue';
import CategoryFormDetail from '@/pages/Category/CategoryFormDetail.vue';

import * as HttpHandler from '@/common/HttpHandler.js';

const emit = defineEmits([
  'show-right-btn',
]);

const util = Util.getInstance();

const search = ref({
  keyword: '',
});

const CtgDialog = ref({
  isActive: false,
  mode: 'create',
  ctgId: null,
});


const pageNation = ref({
  current: 1,
  limit: 20,
});

const totalCount = ref(0);
const isLoading = ref(false);
const isSubmitting = ref(false);

const dialog = ref({
  title: '',
  text: '',
  isActive: false,
  isOneBtn: false,
  okText: '확인',
  okButton() {},
});

const headerItems = [
  { text: '카테고리명', value: 'name' },
  { text: '등록일', value: 'cDate' },
  { text: '수정일', value: 'uDate' },
  { text: '액션', value: 'action' },
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

async function fetchDeleteCategory(value) {
  if (!value) {
    return;
  }

  dialog.value.isActive = false;
  isSubmitting.value = true;
  isLoading.value = true;

  try {
    const response = await HttpHandler.deleteCategory({ id: value });
    const statusCode = response?.status?.code;
    const isDeleted = response?.data?.deleted === true;

    if (statusCode !== 'S0000' || !isDeleted) {
      throw new Error(response?.status?.msg || '카테고리 삭제에 실패했습니다.');
    }

    await fetchListCategories();

    openDialog(
      '삭제 완료',
      '카테고리가 삭제되었습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
  } catch (error) {
    console.error('카테고리 삭제 실패:', error);
    openDialog(
      '삭제 실패',
      error?.message || '카테고리 삭제 중 오류가 발생했습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
  } finally {
    isSubmitting.value = false;
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
      CtgDialog.value.isActive = true;
      CtgDialog.value.mode = 'create';
      CtgDialog.value.ctgId = null;
      break;

    case 'goToDetail':
      CtgDialog.value.isActive = true;
      CtgDialog.value.mode = 'detail';
      CtgDialog.value.ctgId = value;
      break;

    case 'delete': 
      openDialog(
        '삭제 확인',
        '정말 이 카테고리를 삭제하시겠습니까?<br/>삭제 시 하위 카테고리도 함께 삭제됩니다.',
        () => {
          fetchDeleteCategory(value);
        },
        false,
        '삭제'
      );
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

function handleCloseCtgDialog() {
  CtgDialog.value.isActive = false;
  fetchListCategories();
}

function openDialog(title, text, onConfirm, isOneBtn, okText) {
  dialog.value.title = title;
  dialog.value.text = text;
  dialog.value.okButton = onConfirm;
  dialog.value.isActive = true;
  dialog.value.isOneBtn = isOneBtn || false;
  dialog.value.okText = okText || '확인';
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
    color: #ffffff !important;
    background-color: #4A5565 !important;
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