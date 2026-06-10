<template>
  <v-container fluid>
    <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
      <v-col class="title-font">
        <v-row no-gutters class="info-row | mb-1">
          <v-icon color="#6A7282" size="18" class="mr-1">mdi-account-outline</v-icon>
          <span class="info-text">{{ prodDetail.userName || '-' }}</span>
        </v-row>
      </v-col>
      <v-col cols="auto" class="justify-end">
        <v-btn
          @click="handleClickBtn('delete')"
          variant="outlined"
          class="thin-btn | outline-grey | btn-width | mr-2"
        >삭제</v-btn>
        <v-btn
          @click="handleClickBtn('update')"
          variant="outlined"
          class="thin-btn | fill-grey | btn-width"
        >수정</v-btn>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col cols="5" class="img-frame">
        <v-img
          v-if="prodDetail.thumbUrl"
          :src="prodDetail.thumbUrl"
          aspect-ratio="1"
          cover
        />
      </v-col>

      <v-col cols="7" class="pl-8 | pr-4">
        <v-row no-gutters justify="start">
          <v-label class="ml-1">상품명</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            v-model="prodDetail.name"
            class="inputbox"
            :error-messages="errorMsg.name"
            @update:model-value="errorMsg.name = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">브랜드</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            v-model="prodDetail.brand"
            class="inputbox"
            :error-messages="errorMsg.brand"
            @update:model-value="errorMsg.brand = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">가격</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            v-model="priceInput"
            class="inputbox"
            :error-messages="errorMsg.price"
            @update:model-value="errorMsg.price = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">썸네일</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            :model-value="imageFileName"
            class="inputbox"
            readonly
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">상태</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-select
            v-model="prodDetail.pStat"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            class="inputbox"
            :error-messages="errorMsg.pStat"
            @update:model-value="errorMsg.pStat = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1 | gap-16">
          <v-col class="date-col">
            <v-row no-gutters justify="start">
              <v-label class="ml-1">생성일</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="prodDetail.cDate"
                class="inputbox"
                readonly
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>
          <v-col class="date-col">
            <v-row no-gutters justify="start">
              <v-label class="ml-1">수정일</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="prodDetail.uDate"
                class="inputbox"
                readonly
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>

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

      <template #actions>
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
            :loading="isSubmitting"
          >{{ dialog.okText }}</v-btn>
        </div>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
// ----- 선언부 ----- //
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { navigateTo } from '@/common/RouterUtil.js';
import Util from '@/common/Util.js';

import * as HttpHandler from '@/common/HttpHandler.js';

const emit = defineEmits([
  'show-right-btn',
  'set-page-cfg',
  'show-left-btn',
]);

const router = useRouter();
const route = useRoute();
const util = Util.getInstance();
const imageBaseUrl = (import.meta.env.VITE_IMAGE_BASE_URL || '').replace(/\/$/, '');

const prodDetail = ref({
  id: null,
  userName: '',
  name: '',
  brand: '',
  price: null,
  thumbUrl: '',
  pStat: null,
  cDate: '',
  uDate: '',
});

const priceInput = ref('');
const isSubmitting = ref(false);

const imageFileName = computed(() => {
  const url = prodDetail.value.thumbUrl;
  if (!url) {
    return '';
  }

  const cleanedUrl = String(url).split('?')[0].split('#')[0];
  const parts = cleanedUrl.split('/').filter(Boolean);
  return parts[parts.length - 1] || cleanedUrl;
});

const statusOptions = ref([]);
const errorMsg = ref({
  name: '',
  brand: '',
  price: '',
  pStat: '',
});

const dialog = ref({
  title: '',
  text: '',
  isActive: false,
  isOneBtn: false,
  okText: '확인',
  okButton() {},
});

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  emit('show-left-btn');
  emit('set-page-cfg', {
    name: '상품 상세',
    activePath: '/products',
    backPath: '/products',
  });

  fetchStatusLabelOption().finally(() => {
    fetchProductDetail();
  });
});

watch(
  () => route.params.id,
  (nextId, prevId) => {
    if (nextId && nextId !== prevId) {
      fetchProductDetail();
    }
  }
);

watch(priceInput, (value) => {
  const onlyNumber = String(value ?? '').replace(/[^0-9]/g, '');
  prodDetail.value.price = onlyNumber ? Number(onlyNumber) : null;
});

// ----- 함수 정의 ----- //
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

function extractProductId() {
  const id = Number(route.params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function validateProductInput() {
  errorMsg.value = {
    name: '',
    brand: '',
    price: '',
    pStat: '',
  };

  let isValid = true;

  if (!prodDetail.value.name?.trim()) {
    errorMsg.value.name = '상품명을 입력해주세요.';
    isValid = false;
  }

  if (!prodDetail.value.brand?.trim()) {
    errorMsg.value.brand = '브랜드를 입력해주세요.';
    isValid = false;
  }

  if (prodDetail.value.price === null || Number.isNaN(Number(prodDetail.value.price))) {
    errorMsg.value.price = '가격을 입력해주세요.';
    isValid = false;
  }

  if (prodDetail.value.pStat === null || prodDetail.value.pStat === undefined) {
    errorMsg.value.pStat = '상태를 선택해주세요.';
    isValid = false;
  }

  return isValid;
}

function mapProductDetail(detail = {}, fallback = {}) {
  return {
    id: detail.id ?? fallback.id ?? null,
    userName: detail.userName || fallback.userName || '',
    name: detail.name || fallback.name || '',
    brand: detail.brand || fallback.brand || '',
    price: detail.price ?? fallback.price ?? null,
    thumbUrl: buildThumbnailUrl(detail.thumbUrl) || fallback.thumbUrl || '',
    pStat: detail.pStat ?? fallback.pStat ?? null,
    cDate: util.formatUnixDateTime(detail.cDate || fallback.cDate),
    uDate: util.formatUnixDateTime(detail.uDate || fallback.uDate),
  };
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

    statusOptions.value = [...Array.from(uniqueStatusOptions.values())];
  } catch (error) {
    console.error('상품 상태 옵션 조회 실패:', error);
    statusOptions.value = [];
  }
}

async function fetchProductDetail() {
  const productId = extractProductId();
  if (!productId) {
    console.error('productId가 없어 상세 데이터를 조회할 수 없습니다.');
    return;
  }

  try {
    const response = await HttpHandler.getProduct({ id: productId });
    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '상품 상세 조회에 실패했습니다.');
    }

    const detail = response?.data || {};
    prodDetail.value = mapProductDetail(detail, prodDetail.value);
    priceInput.value = prodDetail.value.price !== null && prodDetail.value.price !== undefined
      ? String(prodDetail.value.price)
      : '';
  } catch (error) {
    console.error('상품 상세 조회 실패:', error);
  }
}

async function updateProduct() {
  const productId = extractProductId();
  if (!productId) {
    openDialog(
      '수정 실패',
      '상품 ID가 올바르지 않습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
    return;
  }

  if (!validateProductInput() || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await HttpHandler.updateProduct({
      id: productId,
      name: prodDetail.value.name?.trim() || '',
      brand: prodDetail.value.brand?.trim() || '',
      price: Number(prodDetail.value.price),
      thumbUrl: prodDetail.value.thumbUrl || null,
      pStat: prodDetail.value.pStat,
    });

    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '상품 수정에 실패했습니다.');
    }

    const detail = response?.data || {};
    prodDetail.value = mapProductDetail(detail, prodDetail.value);
    priceInput.value = prodDetail.value.price !== null && prodDetail.value.price !== undefined
      ? String(prodDetail.value.price)
      : '';

    openDialog(
      '수정 완료',
      '상품이 수정되었습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
  } catch (error) {
    console.error('상품 수정 실패:', error);
    openDialog(
      '수정 실패',
      error?.message || '상품 수정 중 오류가 발생했습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteProduct() {
  const productId = extractProductId();
  if (!productId) {
    console.error('삭제할 상품 ID가 유효하지 않습니다.');
    return;
  }

  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await HttpHandler.deleteProduct({ id: productId });
    const statusCode = response?.status?.code;
    const isDeleted = response?.data?.deleted;

    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '상품 삭제에 실패했습니다.');
    }

    if (isDeleted === false) {
      throw new Error(response?.status?.msg || '상품 삭제에 실패했습니다.');
    }

    openDialog(
      '삭제 완료',
      '상품이 삭제되었습니다.',
      () => {
        dialog.value.isActive = false;
        navigateTo(router, '/products');
      },
      true,
      '확인'
    );
  } catch (error) {
    console.error('상품 삭제 실패:', error);
    openDialog(
      '삭제 실패',
      error?.message || '상품 삭제 중 오류가 발생했습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
  } finally {
    isSubmitting.value = false;
  }
}

function handleClickBtn(action) {
  switch (action) {
    case 'update':
      openDialog(
        '수정 확인',
        '현재 내용을 저장하시겠습니까?',
        () => {
          dialog.value.isActive = false;
          updateProduct();
        },
        false,
        '저장'
      );
      break;

    case 'delete':
      openDialog(
        '삭제 확인',
        '정말 이 상품을 삭제하시겠습니까?',
        () => {
          dialog.value.isActive = false;
          deleteProduct();
        },
        false,
        '삭제'
      );
      break;

    default:
      console.error('알 수 없는 액션 타입:', action);
  }
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

.img-frame {
  width: 100%;
  padding-top: 100%;
  position: relative;
  background-color: #ffffff;
  border: 0.7px solid #E5E8EB;
  border-radius: 8px;
}

.inputbox :deep(.v-field__input) {
  color: #364153 !important;
  font-size: 14px !important;
}

.inputbox :deep(.v-input__details .v-messages__message) {
  color: #E53E3E !important;
  padding-top: 0px !important;
  height: 20px !important;
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

:deep(.v-label) {
  color: #4A5565;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
}

.gap-16 {
  column-gap: 16px;
}

.date-col {
  flex: 1 1 0;
}
</style>