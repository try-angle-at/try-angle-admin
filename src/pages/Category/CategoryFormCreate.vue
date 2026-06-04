<template>
  <v-card style="padding: 24px 16px; border-radius: 24px;">
    <v-btn
      icon="mdi-close"
      variant="text"
      size="small"
      @click="emit('close')"
      style="position: absolute; top: 12px; right: 12px; color: #6B7280; z-index: 10;"
    />

    <v-card-title>
      <v-row no-gutters class="align-center | justify-center | mt-3 | app-title-text">
        신규 카테고리 생성
      </v-row>
    </v-card-title>

    <v-card-text style="padding: 0px 8px;">
      <v-row no-gutters justify="start" class="mt-1">
        <v-label class="ml-1">카테고리명</v-label>
      </v-row>
      <v-row no-gutters justify="center" class="mt-1">
        <v-text-field
          v-model="form.name"
          placeholder="카테고리명을 입력해주세요"
          class="inputbox | mr-2"
          :error-messages="errorMsg.name"
          @update:model-value="errorMsg.name = ''"
          variant="outlined"
          density="compact"
          rounded="lg"
          bg-color="#ffffff"
          base-color="#4A5565"
          color="#E5E8EB"
        />
      </v-row>
    </v-card-text>

    <template #actions>
      <div class="action-btn-wrap">
        <v-btn
          class="thin-btn"
          style="border-radius: 16px; flex: 1;"
          variant="outlined"
          @click="emit('close')"
          :loading="isSubmitting"
        >취소</v-btn>
        <v-btn
          class="active-thin-btn"
          style="border-radius: 16px; flex: 1;"
          variant="outlined"
          @click="handleClickBtn('create')"
          :loading="isSubmitting"
        >확인</v-btn>
      </div>
    </template>
  </v-card>

  <v-dialog v-model="dialog.isActive" width="400px">
    <v-card style="padding: 24px 16px; border-radius: 24px;">
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        v-if="!dialog.isOneBtn"
        @click="dialog.isActive = false"
        style="position: absolute; top: 12px; right: 12px; color: #6B7280; z-index: 10;"
      />

      <v-card-title>
        <v-row
          no-gutters
          class="align-center | justify-center | mt-3"
          style="color: #364153; font-size: 18px; font-weight: 700; letter-spacing: -0.2px;"
        >
          {{ dialog.title }}
        </v-row>
      </v-card-title>

      <v-card-text style="padding: 0px; margin-bottom: 12px;">
        <v-row
          no-gutters
          style="justify-content: center; text-align: center; color: #6A7282; font-size: 14px; font-weight: 400; letter-spacing: -0.15px;"
          v-html="dialog.text"
        />
      </v-card-text>

      <template #actions>
        <v-btn
          class="active-thin-btn"
          style="border-radius: 16px;"
          variant="outlined"
          @click="dialog.okButton"
          :loading="isSubmitting"
        >{{ dialog.okText }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
// ----- 선언부 ----- //
import { ref } from 'vue';
import * as HttpHandler from '@/common/HttpHandler.js';
import Util from '@/common/Util.js';

const emit = defineEmits([
  'close',
]);

const util = Util.getInstance();
const isSubmitting = ref(false);

const form = ref({
  name: '',
});

const errorMsg = ref({
  name: '',
});

const dialog = ref({
  title: '',
  text: '',
  isActive: false,
  isOneBtn: false,
  okText: '확인',
  okButton() {},
});

// ----- 함수 정의 ----- //
function handleClickBtn(action) {
  switch (action) {
    case 'create':
      createCategory();
      break;

    default:
      console.error('알 수 없는 카테고리 액션 타입:', action);
  }
}

function resetErrorMsg() {
  errorMsg.value = {
    name: '',
  };
}

function validateForm() {
  resetErrorMsg();

  const name = form.value.name?.trim() || '';

  if (!name) {
    errorMsg.value.name = '카테고리명을 입력해주세요.';
  } else if (!util.ValidKorEng(name)) {
    errorMsg.value.name = '카테고리명은 한글/영문/공백만 입력 가능합니다.';
  }

  return !errorMsg.value.name;
}

function getCurrentUserId() {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    const parsedUser = JSON.parse(rawUser);
    return parsedUser?.userId ?? parsedUser?.id ?? parsedUser?.data?.id ?? null;
  } catch (error) {
    console.error('사용자 정보 파싱 실패:', error);
    return null;
  }
}

async function createCategory() {
  if (isSubmitting.value) {
    return;
  }

  if (!validateForm()) {
    return;
  }

  const userId = getCurrentUserId();
  if (!userId) {
    openDialog(
      '생성 실패',
      '로그인 사용자 정보를 찾을 수 없습니다.<br/>다시 로그인 후 시도해주세요.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await HttpHandler.createCategory({
      userId,
      name: form.value.name.trim(),
    });

    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '카테고리 생성에 실패했습니다.');
    }

    openDialog(
      '생성 완료',
      '카테고리가 생성되었습니다.',
      () => {
        dialog.value.isActive = false;
        emit('close');
      },
      true,
      '확인'
    );
  } catch (error) {
    console.error('카테고리 생성 실패:', error);
    openDialog(
      '생성 실패',
      error?.message || '카테고리 생성 중 오류가 발생했습니다.',
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
.app-title-text {
  font-size: 18px;
  font-weight: 700;
  color: #364153;
  letter-spacing: -0.2px;
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

.action-btn-wrap {
  display: flex;
  width: 100%;
  gap: 8px;
}
</style>