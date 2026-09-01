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
      <!-- 레퍼런스 이미지 업로드 영역 -->
      <v-col cols="5">
        <div
          class="img-frame"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
        >
          <v-img
            v-if="refImgPreviewUrl"
            :src="refImgPreviewUrl"
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

        <input
          ref="jsonFileInputRef"
          type="file"
          accept="application/json,.json"
          style="display: none;"
          @change="handleJsonFileChange"
        />

        <v-row no-gutters class="mt-2 | justify-center">
          <span class="hint-text">JPG, PNG, WEBP · 최대 10MB</span>
        </v-row>
        <v-row v-if="errorMsg.imgUrl" no-gutters class="mt-1 | justify-center">
          <span class="error-text">{{ errorMsg.imgUrl }}</span>
        </v-row>
      </v-col>

      <!-- 입력 필드 영역 -->
      <v-col cols="7" class="pl-8 | pr-4">
        <v-row no-gutters justify="start">
          <v-label class="ml-1">카테고리 <span class="required-mark">*</span></v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-select
            v-model="refImgForm.ctgId"
            :items="categoryOptions"
            item-title="label"
            item-value="value"
            placeholder="카테고리를 선택해주세요"
            class="inputbox"
            :error-messages="errorMsg.ctgId"
            @update:model-value="errorMsg.ctgId = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">제목 <span class="required-mark">*</span></v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            v-model="refImgForm.title"
            placeholder="제목을 입력해주세요"
            class="inputbox"
            :error-messages="errorMsg.title"
            @update:model-value="errorMsg.title = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">이미지 파일</v-label>
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

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">설명</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-textarea
            v-model="refImgForm.desc"
            placeholder="이미지 설명을 입력해주세요"
            class="inputbox"
            auto-grow rows="3" row-height="5" max-rows="5"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">도메인 (패션/미감)</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
            <v-select
              v-model="domainCodes"
              :items="REF_DOMAIN_OPTIONS"
              item-title="label"
              item-value="value"
              multiple
              chips
              closable-chips
              placeholder="이 레퍼런스가 속한 도메인 선택"
              class="inputbox"
              variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
            >
              <template #chip="{ item, props }">
                <v-chip v-bind="props" :color="item.raw.color" variant="flat" size="small">
                  <v-icon start size="14">{{ item.raw.icon }}</v-icon>{{ item.raw.label }}
                </v-chip>
              </template>
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :title="null">
                  <v-list-item-title>
                    <v-icon size="16" :color="item.raw.color" class="mr-1">{{ item.raw.icon }}</v-icon>
                    {{ item.raw.label }}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">이미지 태그</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
            <v-select
              v-model="kwdTags"
              :items="tagOptions"
              item-title="label"
              item-value="value"
              multiple
              chips
              placeholder="이미지 태그" 
              class="inputbox"
              variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
            />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1 | gap-16">
          <v-col>
            <v-row no-gutters justify="start">
              <v-label class="ml-1">노출 가중치</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="expWeightInput"
                placeholder="0"
                class="inputbox"
                :error-messages="errorMsg.expWeight"
                @update:model-value="errorMsg.expWeight = ''"
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>

          <v-col>
            <v-row no-gutters justify="start">
              <v-label class="ml-1">우선순위</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="priInput"
                placeholder="0"
                class="inputbox"
                :error-messages="errorMsg.pri"
                @update:model-value="errorMsg.pri = ''"
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">AI 문서 (JSON)</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-textarea
            v-model="aiDocInput"
            placeholder='{"key": "value"}'
            class="inputbox"
            :error-messages="errorMsg.aiDoc"
            @update:model-value="errorMsg.aiDoc = ''"
            auto-grow rows="3" row-height="5" max-rows="6"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          >
            <template #append-inner>
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-upload"
                color="#4A5565"
                @click.stop="triggerJsonFileInput"
              />
            </template>
          </v-textarea>
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
import { REF_DOMAIN_OPTIONS, splitDomainCodes } from '@/common/refDomains.js';
import { TAG_SELECT_ITEMS, TAG_LABEL_BY_CODE } from '@/common/tagCatalog.js';

const emit = defineEmits([
  'show-right-btn',
  'set-page-cfg',
  'show-left-btn',
]);

const router = useRouter();

// 폼 데이터
const refImgForm = ref({
  ctgId: null,
  imgUrl: '',   // fileKey (서버 저장 경로)
  title: '',
  desc: '',
  kwd: [],
  aiDoc: null,
  expWeight: 0,
  pri: 0,
});

// 도메인(DOMAIN_*)과 일반 태그를 같은 kwd 배열 위에서 나눠 편집한다 —
// 저장/전송 코드는 refImgForm.kwd 하나만 보면 되므로 무변경.
const domainCodes = computed({
  get: () => splitDomainCodes(refImgForm.value.kwd).domains,
  set: (vals) => {
    const { rest } = splitDomainCodes(refImgForm.value.kwd);
    refImgForm.value.kwd = [...(vals || []), ...rest];
  },
});
const kwdTags = computed({
  get: () => splitDomainCodes(refImgForm.value.kwd).rest,
  set: (vals) => {
    const { domains } = splitDomainCodes(refImgForm.value.kwd);
    refImgForm.value.kwd = [...domains, ...(vals || [])];
  },
});

const expWeightInput = ref('0');
const priInput = ref('0');
const aiDocInput = ref('');
const isSubmitting = ref(false);
const isUploading = ref(false);

// 파일 업로드 관련
const fileInputRef = ref(null);
const jsonFileInputRef = ref(null);
const refImgPreviewUrl = ref('');   // 로컬 미리보기 URL
const uploadedFileName = ref('');   // 업로드된 파일명 표시용

const categoryOptions = ref([]);
const tagOptions = ref([]);
const tagNameByCode = ref({});

const errorMsg = ref({
  ctgId: '',
  imgUrl: '',
  title: '',
  expWeight: '',
  pri: '',
  aiDoc: '',
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
    name: '레퍼런스 이미지 등록',
    activePath: '/ref-images',
    backPath: '/ref-images',
  });

  fetchCategoryOptions();
  fetchTagCategory();
});

onUnmounted(() => {
  // 로컬 미리보기 URL 메모리 해제
  if (refImgPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(refImgPreviewUrl.value);
  }
});

// expWeightInput → refImgForm.expWeight 동기화 (숫자만 허용)
watch(expWeightInput, (value) => {
  const onlyNumber = String(value ?? '').replace(/[^0-9]/g, '');
  expWeightInput.value = onlyNumber;
  refImgForm.value.expWeight = onlyNumber ? Number(onlyNumber) : 0;
});

// priInput → refImgForm.pri 동기화 (숫자만 허용)
watch(priInput, (value) => {
  const onlyNumber = String(value ?? '').replace(/[^0-9]/g, '');
  priInput.value = onlyNumber;
  refImgForm.value.pri = onlyNumber ? Number(onlyNumber) : 0;
});

// ----- 함수 정의 ----- //
function triggerFileInput() {
  fileInputRef.value?.click();
}

function triggerJsonFileInput() {
  jsonFileInputRef.value?.click();
}

function handleJsonFileChange(event) {
  const file = event.target?.files?.[0];
  if (file) {
    processJsonFile(file);
  }
  // input value 초기화 (같은 파일 재선택 허용)
  if (jsonFileInputRef.value) {
    jsonFileInputRef.value.value = '';
  }
}

function processJsonFile(file) {
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    openDialog('업로드 실패', 'JSON 파일만 업로드할 수 있습니다.', () => {
      dialog.value.isActive = false;
    }, true, '확인');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result;
      // 파싱 후 재직렬화하여 포맷 정규화
      const parsed = JSON.parse(text);
      aiDocInput.value = JSON.stringify(parsed, null, 2);
      errorMsg.value.aiDoc = '';
    } catch {
      errorMsg.value.aiDoc = '올바른 JSON 형식의 파일이 아닙니다.';
    }
  };
  reader.onerror = () => {
    errorMsg.value.aiDoc = 'JSON 파일을 읽는 중 오류가 발생했습니다.';
  };
  reader.readAsText(file);
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
  if (refImgPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(refImgPreviewUrl.value);
  }
  refImgPreviewUrl.value = URL.createObjectURL(file);
  uploadedFileName.value = file.name;
  errorMsg.value.imgUrl = '';

  // 서버 업로드
  await uploadRefImg(file);
}

async function uploadRefImg(file) {
  isUploading.value = true;

  try {
    const response = await HttpHandler.uploadFile({
      file,
      type: 'refImg',
    });

    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '이미지 업로드에 실패했습니다.');
    }

    // fileKey를 imgUrl로 사용
    const fileKey = response?.data?.fileKey;
    if (!fileKey) {
      throw new Error('업로드 응답에서 fileKey를 찾을 수 없습니다.');
    }

    refImgForm.value.imgUrl = fileKey;
  } catch (error) {
    console.error('레퍼런스 이미지 업로드 실패:', error);
    refImgPreviewUrl.value = '';
    uploadedFileName.value = '';
    refImgForm.value.imgUrl = '';
    errorMsg.value.imgUrl = error?.message || '이미지 업로드 중 오류가 발생했습니다.';
  } finally {
    isUploading.value = false;
  }
}

async function fetchCategoryOptions() {
  try {
    const response = await HttpHandler.listCategories({ page: 1 });

    const categoryItems = response?.data?.items || [];
    categoryOptions.value = categoryItems.map((ctg = {}) => ({
      value: ctg.id,
      label: ctg.name || String(ctg.id),
    }));
  } catch (error) {
    console.error('카테고리 옵션 조회 실패:', error);
    categoryOptions.value = [];
  }
}

function applyStaticTagCatalog() {
  // 서버 태그 API(/tag/*) 미구현 상태의 정적 분류 카탈로그 (tagCatalog.js)
  tagOptions.value = [...TAG_SELECT_ITEMS];
  if (typeof tagNameByCode !== 'undefined') {
    tagNameByCode.value = { ...TAG_LABEL_BY_CODE };
  }
}

async function fetchTagCategory() {
  try {
    const [moodTagResponse, clothTagResponse, shotTagResponse] = await Promise.all([
      HttpHandler.listTags({
        page: 0,
        parentCode: 'MOOD_ROOT',
        tagName: null,
      }),
      HttpHandler.listTags({
        page: 0,
        parentCode: 'CLOTH_ROOT',
        tagName: null,
      }),
      HttpHandler.listTags({
        page: 0,
        parentCode: 'SHOT_ROOT',
        tagName: null,
      }),
    ]);

    const moodTagItems = moodTagResponse?.data?.items || [];
    const clothTagItems = clothTagResponse?.data?.items || [];
    const shotTagItems = shotTagResponse?.data?.items || [];
    const tagItems = [...moodTagItems, ...clothTagItems, ...shotTagItems];
    const uniqueTags = new Map();

    tagItems.forEach((tag = {}) => {
      const code = tag.code;
      if (!code || uniqueTags.has(code)) {
        return;
      }

      uniqueTags.set(code, {
        value: code,
        label: tag.tagName || code,
      });
    });

    if (uniqueTags.size === 0) {
      applyStaticTagCatalog();
      return;
    }

    tagOptions.value = [...Array.from(uniqueTags.values())];
    tagNameByCode.value = Array.from(uniqueTags.values()).reduce((acc, tag) => {
      acc[tag.value] = tag.label;
      return acc;
    }, {});
  } catch (error) {
    // 태그 API 미구현(404) — 정적 카탈로그로 폴백
    applyStaticTagCatalog();
  }
}

function validateRefImgInput() {
  errorMsg.value = {
    ctgId: '',
    imgUrl: '',
    title: '',
    expWeight: '',
    pri: '',
    aiDoc: '',
  };

  let isValid = true;

  if (refImgForm.value.ctgId === null || refImgForm.value.ctgId === undefined) {
    errorMsg.value.ctgId = '카테고리를 선택해주세요.';
    isValid = false;
  }

  if (!refImgForm.value.title?.trim()) {
    errorMsg.value.title = '제목을 입력해주세요.';
    isValid = false;
  }

  if (aiDocInput.value.trim()) {
    try {
      JSON.parse(aiDocInput.value.trim());
    } catch {
      errorMsg.value.aiDoc = 'AI 문서는 올바른 JSON 형식이어야 합니다.';
      isValid = false;
    }
  }

  return isValid;
}

async function createRefImg() {
  if (!validateRefImgInput() || isSubmitting.value) {
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
    // aiDoc: 입력된 JSON 문자열을 그대로 전달 (string 형태)
    const aiDocValue = aiDocInput.value.trim() ? aiDocInput.value.trim() : null;

    const response = await HttpHandler.createReference({
      ctgId: refImgForm.value.ctgId,
      imgUrl: refImgForm.value.imgUrl || null,
      title: refImgForm.value.title.trim(),
      desc: refImgForm.value.desc?.trim() || null,
      kwd: refImgForm.value.kwd.length > 0 ? refImgForm.value.kwd : null,
      aiDoc: aiDocValue,
      expWeight: refImgForm.value.expWeight,
      pri: refImgForm.value.pri,
    });

    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '레퍼런스 이미지 등록에 실패했습니다.');
    }

    const createdId = response?.data?.id ?? response?.data?.imgId;

    openDialog('등록 완료', '레퍼런스 이미지가 등록되었습니다.', () => {
      dialog.value.isActive = false;
      if (createdId) {
        navigateTo(router, `/ref-images/${createdId}`);
      } else {
        navigateTo(router, '/ref-images');
      }
    }, true, '확인');
  } catch (error) {
    console.error('레퍼런스 이미지 등록 실패:', error);
    openDialog('등록 실패', error?.message || '레퍼런스 이미지 등록 중 오류가 발생했습니다.', () => {
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
        '입력하신 내용으로 레퍼런스 이미지를 등록하시겠습니까?',
        () => {
          dialog.value.isActive = false;
          createRefImg();
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
          navigateTo(router, '/ref-images');
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
  border: 1.5px solid #C0C8D4;
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

.gap-16 {
  column-gap: 16px;
}
</style>