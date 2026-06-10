<template>
  <v-container fluid>
    <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
      <v-col class="title-font">
        <v-row no-gutters class="info-row | mb-1">
          <v-icon color="#6A7282" size="18" class="mr-1">mdi-account-outline</v-icon>
          <span class="info-text">{{ snapDetail.userName || '-' }}</span>
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
          v-if="snapDetail.snapUrl"
          :src="snapDetail.snapUrl"
          aspect-ratio="1"
          cover
        />
      </v-col>

      <v-col cols="7" class="pl-8 | pr-4">
        <v-row no-gutters justify="start">
          <v-label class="ml-1">레퍼런스 이미지</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
            <v-col cols="4" class="ref-preview-frame">
                <v-img
                    v-if="refImgDetail.imgUrl"
                    :src="refImgDetail.imgUrl"
                    cover
                />
                <v-row
                    v-else
                    no-gutters
                    class="align-item-center | justify-center"
                    style="height: 180px; color: #9CA3AF; font-size: 13px;"
                >
                    레퍼런스 이미지가 없습니다.
                </v-row>
          </v-col>
          <v-col cols="8" class="pl-4">
                <v-btn
                  @click.stop="handleClickBtn('goToRefImgDetail')"
                  variant="outlined"
                  size="small"
                  class="small-btn | outline-grey"
                  :disabled="!refImgDetail.id"
                >이미지 바로가기</v-btn>
          </v-col>
        </v-row>

        <v-row no-gutters justify="start" class="mt-5">
          <v-label class="ml-1">코멘트</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-textarea
            v-model="snapDetail.comment"
            class="inputbox"
            auto-grow rows="4" row-height="5" max-rows="6"
            :error-messages="errorMsg.comment"
            @update:model-value="errorMsg.comment = ''"
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1 | gap-16">
          <v-col>
            <v-row no-gutters justify="start">
              <v-label class="ml-1">성별</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-select
                v-model="snapDetail.gender"
                :items="genderOptions"
                item-title="label"
                item-value="value"
                class="inputbox"
                :error-messages="errorMsg.gender"
                @update:model-value="errorMsg.gender = ''"
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565"
              />
            </v-row>
          </v-col>

          <v-col>
            <v-row no-gutters justify="start">
              <v-label class="ml-1">조회수</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="viewCntInput"
                class="inputbox"
                readonly
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>
        </v-row>

        <v-row no-gutters justify="start" class="mt-1 | gap-16">
          <v-col>
            <v-row no-gutters justify="start">
              <v-label class="ml-1">키(cm)</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="userHInput"
                class="inputbox"
                readonly
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>
          <v-col>
            <v-row no-gutters justify="start">
              <v-label class="ml-1">몸무게(kg)</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="userWInput"
                class="inputbox"
                readonly
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>
        </v-row>

        <v-row no-gutters justify="start" class="mt-1">
          <v-label class="ml-1">세션 ID</v-label>
        </v-row>
        <v-row no-gutters justify="center" class="mt-1">
          <v-text-field
            v-model="snapDetail.sId"
            class="inputbox"
            readonly
            variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
          />
        </v-row>

        <v-row no-gutters justify="start" class="mt-1 | gap-16">
          <v-col>
            <v-row no-gutters justify="start">
              <v-label class="ml-1">상품 ID</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="prodIdInput"
                class="inputbox"
                :error-messages="errorMsg.prodId"
                @update:model-value="errorMsg.prodId = ''"
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>
          <v-col>
            <v-row no-gutters justify="start">
              <v-label class="ml-1">이미지 ID</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="imgIdInput"
                class="inputbox"
                :error-messages="errorMsg.imgId"
                @update:model-value="errorMsg.imgId = ''"
                variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
          </v-col>
        </v-row>

        <v-row no-gutters justify="start" class="mt-1 | gap-16">
          <v-col class="date-col">
            <v-row no-gutters justify="start">
              <v-label class="ml-1">생성일</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                v-model="snapDetail.cDate"
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
                v-model="snapDetail.uDate"
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

const route = useRoute();
const router = useRouter();
const util = Util.getInstance();
const imageBaseUrl = (import.meta.env.VITE_IMAGE_BASE_URL || '').replace(/\/$/, '');

const snapDetail = ref({
  id: null,
  userId: null,
  userName: '',
  prodId: null,
  imgId: null,
  sId: '',
  snapUrl: '',
  comment: '',
  gender: null,
  userH: null,
  userW: null,
  viewCnt: 0,
  cDate: '',
  uDate: '',
});

const refImgDetail = ref({
  id: null,
  imgUrl: '',
  title: '',
});

const genderOptions = ref([
  { label: '남성', value: 1 },
  { label: '여성', value: 2 },
]);

const errorMsg = ref({
  comment: '',
  gender: '',
  viewCnt: '',
  prodId: '',
  imgId: '',
});

const viewCntInput = ref('0');
const userHInput = ref('');
const userWInput = ref('');
const prodIdInput = ref('');
const imgIdInput = ref('');
const isSubmitting = ref(false);
const refImgFileName = computed(() => {
  const url = refImgDetail.value.imgUrl;
  if (!url) {
    return '';
  }

  const cleanedUrl = String(url).split('?')[0].split('#')[0];
  const parts = cleanedUrl.split('/').filter(Boolean);
  return parts[parts.length - 1] || cleanedUrl;
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
    name: '스냅 상세',
    activePath: '/snaps',
    backPath: '/snaps',
  });

  fetchSnapDetail();
});

watch(
  () => route.params.id,
  (nextId, prevId) => {
    if (nextId && nextId !== prevId) {
      fetchSnapDetail();
    }
  }
);

watch(viewCntInput, (value) => {
  const onlyNumber = String(value ?? '').replace(/[^0-9]/g, '');
  snapDetail.value.viewCnt = onlyNumber ? Number(onlyNumber) : 0;
});

watch(prodIdInput, (value) => {
  const onlyNumber = String(value ?? '').replace(/[^0-9]/g, '');
  snapDetail.value.prodId = onlyNumber ? Number(onlyNumber) : null;
});

watch(imgIdInput, (value) => {
  const onlyNumber = String(value ?? '').replace(/[^0-9]/g, '');
  snapDetail.value.imgId = onlyNumber ? Number(onlyNumber) : null;
  fetchRefImgDetail(snapDetail.value.imgId);
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

function extractSnapId() {
  const id = Number(route.params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapSnapDetail(detail = {}, fallback = {}) {
  return {
    id: detail.id ?? fallback.id ?? null,
    userId: detail.userId ?? fallback.userId ?? null,
    userName: detail.userName || fallback.userName || '',
    prodId: detail.prodId ?? fallback.prodId ?? null,
    imgId: detail.imgId ?? fallback.imgId ?? null,
    sId: detail.sId || fallback.sId || '',
    snapUrl: buildThumbnailUrl(detail.snapUrl) || fallback.snapUrl || '',
    comment: detail.comment || fallback.comment || '',
    gender: detail.gender ?? fallback.gender ?? null,
    userH: detail.userH ?? fallback.userH ?? null,
    userW: detail.userW ?? fallback.userW ?? null,
    viewCnt: detail.viewCnt ?? fallback.viewCnt ?? 0,
    cDate: util.formatUnixDateTime(detail.cDate || fallback.cDate),
    uDate: util.formatUnixDateTime(detail.uDate || fallback.uDate),
  };
}

function syncDerivedInputs() {
  viewCntInput.value = snapDetail.value.viewCnt !== null && snapDetail.value.viewCnt !== undefined
    ? String(snapDetail.value.viewCnt)
    : '0';
  prodIdInput.value = snapDetail.value.prodId !== null && snapDetail.value.prodId !== undefined
    ? String(snapDetail.value.prodId)
    : '';
  imgIdInput.value = snapDetail.value.imgId !== null && snapDetail.value.imgId !== undefined
    ? String(snapDetail.value.imgId)
    : '';
  userHInput.value = snapDetail.value.userH !== null && snapDetail.value.userH !== undefined
    ? String(snapDetail.value.userH)
    : '';
  userWInput.value = snapDetail.value.userW !== null && snapDetail.value.userW !== undefined
    ? String(snapDetail.value.userW)
    : '';
}

function validateSnapInput() {
  errorMsg.value = {
    comment: '',
    gender: '',
    viewCnt: '',
    prodId: '',
    imgId: '',
  };

  let isValid = true;
  if (!snapDetail.value.comment?.trim()) {
    errorMsg.value.comment = '코멘트를 입력해주세요.';
    isValid = false;
  }

  if (snapDetail.value.gender === null || snapDetail.value.gender === undefined) {
    errorMsg.value.gender = '성별을 선택해주세요.';
    isValid = false;
  }

  const prodId = normalizeNumber(snapDetail.value.prodId);
  if (prodId === null || prodId <= 0) {
    errorMsg.value.prodId = '상품 ID를 입력해주세요.';
    isValid = false;
  }

  const imgId = normalizeNumber(snapDetail.value.imgId);
  if (imgId === null || imgId <= 0) {
    errorMsg.value.imgId = '이미지 ID를 입력해주세요.';
    isValid = false;
  }

  return isValid;
}

async function fetchSnapDetail() {
  const snapId = extractSnapId();
  if (!snapId) {
    console.error('snapId가 없어 상세 데이터를 조회할 수 없습니다.');
    return;
  }

  try {
    const response = await HttpHandler.getSnap({ id: snapId });
    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '스냅 상세 조회에 실패했습니다.');
    }

    const detail = response?.data || {};
    snapDetail.value = mapSnapDetail(detail, snapDetail.value);
    syncDerivedInputs();
    fetchRefImgDetail(snapDetail.value.imgId);
  } catch (error) {
    console.error('스냅 상세 조회 실패:', error);
  }
}

async function fetchRefImgDetail(value) {
  const refImgId = Number(value);
  if (!Number.isFinite(refImgId) || refImgId <= 0) {
    refImgDetail.value = {
      id: null,
      imgUrl: '',
      title: '',
    };
    return;
  }

  try {
    const response = await HttpHandler.getReference({ id: refImgId });
    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '레퍼런스 이미지 조회에 실패했습니다.');
    }

    const detail = response?.data || {};
    refImgDetail.value = {
      id: detail.imgId ?? refImgId,
      imgUrl: buildThumbnailUrl(detail.imgUrl) || '',
      title: detail.title || '',
    };
  } catch (error) {
    console.error('레퍼런스 이미지 조회 실패:', error);
    refImgDetail.value = {
      id: null,
      imgUrl: '',
      title: '',
    };
  }
}

async function updateSnap() {
  const snapId = extractSnapId();
  if (!snapId) {
    openDialog(
      '수정 실패',
      '스냅 ID가 올바르지 않습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
    return;
  }

  if (!validateSnapInput() || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await HttpHandler.updateSnap({
      id: snapId,
      prodId: Number(snapDetail.value.prodId),
      imgId: Number(snapDetail.value.imgId),
      comment: snapDetail.value.comment?.trim() || '',
      viewCnt: Number(snapDetail.value.viewCnt),
      gender: Number(snapDetail.value.gender),
    });

    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '스냅 수정에 실패했습니다.');
    }

    const detail = response?.data || {};
    snapDetail.value = mapSnapDetail(detail, snapDetail.value);
    syncDerivedInputs();

    openDialog(
      '수정 완료',
      '스냅이 수정되었습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
  } catch (error) {
    console.error('스냅 수정 실패:', error);
    openDialog(
      '수정 실패',
      error?.message || '스냅 수정 중 오류가 발생했습니다.',
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

async function deleteSnap() {
  const snapId = extractSnapId();
  if (!snapId) {
    console.error('삭제할 스냅 ID가 유효하지 않습니다.');
    return;
  }

  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await HttpHandler.deleteSnap({ id: snapId });
    const statusCode = response?.status?.code;
    const isDeleted = response?.data?.deleted;

    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '스냅 삭제에 실패했습니다.');
    }

    if (isDeleted === false) {
      throw new Error(response?.status?.msg || '스냅 삭제에 실패했습니다.');
    }

    openDialog(
      '삭제 완료',
      '스냅이 삭제되었습니다.',
      () => {
        dialog.value.isActive = false;
        navigateTo(router, '/snaps');
      },
      true,
      '확인'
    );
  } catch (error) {
    console.error('스냅 삭제 실패:', error);
    openDialog(
      '삭제 실패',
      error?.message || '스냅 삭제 중 오류가 발생했습니다.',
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
          updateSnap();
        },
        false,
        '저장'
      );
      break;

    case 'delete':
      openDialog(
        '삭제 확인',
        '정말 이 스냅을 삭제하시겠습니까?',
        () => {
          dialog.value.isActive = false;
          deleteSnap();
        },
        false,
        '삭제'
      );
      break;

    case 'goToRefImgDetail':
      if (!refImgDetail.value.id) {
        return;
      }
      navigateTo(router, `/ref-images/${refImgDetail.value.id}`);
      break;

    default:
      console.error('알 수 없는 스냅 액션 타입:', action);
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

.img-frame {
  width: 100%;
  padding-top: 100%;
  position: relative;
  background-color: #ffffff;
  border: 0.7px solid #E5E8EB;
  border-radius: 8px;
}

.ref-preview-frame {
    border: 0.7px solid #E5E8EB;
    width: 100%;
    padding-top: 100%;
    border-radius: 8px;
    background-color: #ffffff;
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
