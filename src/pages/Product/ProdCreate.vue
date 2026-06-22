<template>
  <v-container fluid>
    <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
      <v-col class="title-font" />
      <v-col cols="auto" class="justify-end">
        <v-btn
          @click="handleClickBtn('cancel')"
          variant="outlined"
          class="thin-btn | outline-grey | btn-width | mr-2"
        >취소</v-btn>
        <v-btn
          @click="handleClickBtn('create')"
          variant="outlined"
          class="thin-btn | fill-grey | btn-width"
          :loading="isSubmitting"
        >등록</v-btn>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <!-- 썸네일 이미지 영역 -->
      <v-col cols="5">
        <div
          class="img-frame"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
        >
          <v-img
            v-if="thumbPreviewUrl"
            :src="thumbPreviewUrl"
            aspect-ratio="1"
            cover
            class="img-preview"
          />
          <div v-else class="img-placeholder">
            <v-icon size="48" color="#C0C8D4">mdi-image-plus-outline</v-icon>
            <span class="placeholder-text">이미지를 클릭하거나<br>드래그하여 업로드</span>
          </div>

          <!-- 업로드 중 오버레이 -->
          <div v-if="isUploading" class="upload-overlay">
            <v-progress-circular indeterminate color="#ffffff" size="32" />
          </div>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none;"
          @change="handleFileChange"
        />

        <v-row no-gutters class="mt-2 | justify-center">
          <span class="hint-text">JPG, PNG, WEBP · 최대 10MB</span>
        </v-row>
        <v-row v-if="errorMsg.thumbUrl" no-gutters class="mt-1 | justify-center">
          <span class="error-text">{{ errorMsg.thumbUrl }}</span>
        </v-row>
      </v-col>

      <!-- 입력 필드 영역 -->
      <v-col cols="7" class="pl-8 | pr-4">
        <v-row no-gutters justify="start">
          <v-label class="ml-1">상품명 <span class="required-mark">*</span></v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            v-model="prodForm.name"
            placeholder="상품명을 입력해주세요"
            class="inputbox"
            :error-messages="errorMsg.name"
            @update:model-value="errorMsg.name = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">브랜드 <span class="required-mark">*</span></v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            v-model="prodForm.brand"
            placeholder="브랜드를 입력해주세요"
            class="inputbox"
            :error-messages="errorMsg.brand"
            @update:model-value="errorMsg.brand = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">가격 <span class="required-mark">*</span></v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            v-model="priceInput"
            placeholder="가격을 입력해주세요"
            class="inputbox"
            :error-messages="errorMsg.price"
            @update:model-value="errorMsg.price = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">상태 <span class="required-mark">*</span></v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-select
            v-model="prodForm.pStat"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            placeholder="상태를 선택해주세요"
            class="inputbox"
            :error-messages="errorMsg.pStat"
            @update:model-value="errorMsg.pStat = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">썸네일</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            :model-value="uploadedFileName"
            class="inputbox"
            placeholder="이미지를 업로드해주세요"
            readonly
            variant="outlined" density="compact" rounded="lg" bg-color="#F9FAFB" base-color="#4A5565" color="#E5E8EB"
          >
            <template #append-inner>
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-upload"
                color="#4A5565"
                @click.stop="triggerFileInput"
              />
            </template>
          </v-text-field>
        </v-row>
      </v-col>
    </v-row>
  </v-container>

  <!-- 확인 다이얼로그 -->
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { navigateTo } from '@/common/RouterUtil.js';

import * as HttpHandler from '@/common/HttpHandler.js';

const emit = defineEmits([
  'show-right-btn',
  'set-page-cfg',
  'show-left-btn',
]);

const router = useRouter();

// 폼 데이터
const prodForm = ref({
  name: '',
  brand: '',
  price: null,
  thumbUrl: '',   // fileKey (서버 저장 경로)
  pStat: null,
});

const priceInput = ref('');
const isSubmitting = ref(false);
const isUploading = ref(false);

// 파일 업로드 관련
const fileInputRef = ref(null);
const thumbPreviewUrl = ref('');   // 로컬 미리보기 URL
const uploadedFileName = ref('');  // 업로드된 파일명 표시용

const statusOptions = ref([]);

const errorMsg = ref({
  name: '',
  brand: '',
  price: '',
  pStat: '',
  thumbUrl: '',
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
    name: '상품 등록',
    activePath: '/products',
    backPath: '/products',
  });

  fetchStatusLabelOption();
});

onUnmounted(() => {
  // 로컬 미리보기 URL 메모리 해제
  if (thumbPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(thumbPreviewUrl.value);
  }
});

// priceInput → prodForm.price 동기화 (숫자만 허용)
watch(priceInput, (value) => {
  const onlyNumber = String(value ?? '').replace(/[^0-9]/g, '');
  priceInput.value = onlyNumber; // 숫자 외 문자 즉시 제거
  prodForm.value.price = onlyNumber ? Number(onlyNumber) : null;
});

// ----- 함수 정의 ----- //
function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileDrop(event) {
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    processImageFile(file);
  }
}

function handleFileChange(event) {
  const file = event.target?.files?.[0];
  if (file) {
    processImageFile(file);
  }
  // input value 초기화 (같은 파일 재선택 허용)
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

async function processImageFile(file) {
  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    openDialog('업로드 실패', '이미지 파일만 업로드할 수 있습니다.', () => {
      dialog.value.isActive = false;
    }, true, '확인');
    return;
  }

  // 파일 크기 검증 (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    openDialog('업로드 실패', '파일 크기는 10MB 이하여야 합니다.', () => {
      dialog.value.isActive = false;
    }, true, '확인');
    return;
  }

  // 로컬 미리보기 URL 생성
  if (thumbPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(thumbPreviewUrl.value);
  }
  thumbPreviewUrl.value = URL.createObjectURL(file);
  uploadedFileName.value = file.name;
  errorMsg.value.thumbUrl = '';

  // 서버 업로드
  await uploadThumbnail(file);
}

async function uploadThumbnail(file) {
  isUploading.value = true;

  try {
    const response = await HttpHandler.uploadFile({
      file,
      type: 'prod',
    });

    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '이미지 업로드에 실패했습니다.');
    }

    // fileKey를 thumbUrl로 사용
    const fileKey = response?.data?.fileKey;
    if (!fileKey) {
      throw new Error('업로드 응답에서 fileKey를 찾을 수 없습니다.');
    }

    prodForm.value.thumbUrl = fileKey;
  } catch (error) {
    console.error('썸네일 업로드 실패:', error);
    thumbPreviewUrl.value = '';
    uploadedFileName.value = '';
    prodForm.value.thumbUrl = '';
    errorMsg.value.thumbUrl = error?.message || '이미지 업로드 중 오류가 발생했습니다.';
  } finally {
    isUploading.value = false;
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

    statusOptions.value = [...Array.from(uniqueStatusOptions.values())];
  } catch (error) {
    console.error('상품 상태 옵션 조회 실패:', error);
    statusOptions.value = [];
  }
}

function validateProductInput() {
  errorMsg.value = {
    name: '',
    brand: '',
    price: '',
    pStat: '',
    thumbUrl: '',
  };

  let isValid = true;

  if (!prodForm.value.name?.trim()) {
    errorMsg.value.name = '상품명을 입력해주세요.';
    isValid = false;
  }

  if (!prodForm.value.brand?.trim()) {
    errorMsg.value.brand = '브랜드를 입력해주세요.';
    isValid = false;
  }

  if (prodForm.value.price === null || Number.isNaN(Number(prodForm.value.price))) {
    errorMsg.value.price = '가격을 입력해주세요.';
    isValid = false;
  }

  if (prodForm.value.pStat === null || prodForm.value.pStat === undefined) {
    errorMsg.value.pStat = '상태를 선택해주세요.';
    isValid = false;
  }

  return isValid;
}

async function createProduct() {
  if (!validateProductInput() || isSubmitting.value) {
    return;
  }

  if (isUploading.value) {
    openDialog('잠시만요', '이미지 업로드가 완료될 때까지 기다려주세요.', () => {
      dialog.value.isActive = false;
    }, true, '확인');
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await HttpHandler.createProduct({
      name: prodForm.value.name.trim(),
      brand: prodForm.value.brand.trim(),
      price: Number(prodForm.value.price),
      thumbUrl: prodForm.value.thumbUrl || null,
      pStat: prodForm.value.pStat,
    });

    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '상품 등록에 실패했습니다.');
    }

    const createdId = response?.data?.id;

    openDialog('등록 완료', '상품이 등록되었습니다.', () => {
      dialog.value.isActive = false;
      if (createdId) {
        navigateTo(router, `/products/${createdId}`);
      } else {
        navigateTo(router, '/products');
      }
    }, true, '확인');
  } catch (error) {
    console.error('상품 등록 실패:', error);
    openDialog('등록 실패', error?.message || '상품 등록 중 오류가 발생했습니다.', () => {
      dialog.value.isActive = false;
    }, true, '확인');
  } finally {
    isSubmitting.value = false;
  }
}

function handleClickBtn(action) {
  switch (action) {
    case 'create':
      openDialog(
        '등록 확인',
        '입력하신 내용으로 상품을 등록하시겠습니까?',
        () => {
          dialog.value.isActive = false;
          createProduct();
        },
        false,
        '등록'
      );
      break;

    case 'cancel':
      openDialog(
        '등록 취소',
        '입력하신 내용이 저장되지 않습니다.<br>취소하시겠습니까?',
        () => {
          dialog.value.isActive = false;
          navigateTo(router, '/products');
        },
        false,
        '취소'
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

/* 이미지 업로드 영역 */
.img-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #F9FAFB;
  border: 1.5px dashed #C0C8D4;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;
}

.img-frame:hover {
  border-color: #4A5565;
}

.img-preview {
  width: 100%;
  height: 100%;
}

.img-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.placeholder-text {
  color: #9CA3AF;
  font-size: 13px;
  font-weight: 400;
  text-align: center;
  line-height: 1.5;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hint-text {
  color: #9CA3AF;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: -0.1px;
}

.error-text {
  color: #E53E3E;
  font-size: 12px;
}

.required-mark {
  color: #E53E3E;
  margin-left: 2px;
}

/* 인풋 필드 공통 */
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
  color: #9CA3AF !important;
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
</style>