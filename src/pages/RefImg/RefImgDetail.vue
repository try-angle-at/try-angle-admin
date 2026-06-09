<template>
    <v-container fluid>
        <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
            <v-col class="title-font">
              <v-row no-gutters class="info-row | mb-1">
                <v-icon color="#6A7282" size="18" class="mr-1">mdi-account-outline</v-icon>
                <span class="info-text">{{ refImgDetail.nickname }}</span>
              </v-row>
            </v-col>
            <v-col cols="auto" class="justify-end">
                <v-btn
                  @click="handleClickBtn('delete')"
                  variant="outlined"
                  class="thin-btn | outline-grey | btn-width | mr-2"
                >삭제</v-btn>
                <v-btn
                  @click="handleClickBtn('edit')"
                  variant="outlined"
                  class="thin-btn | fill-grey | btn-width"
                >수정</v-btn>

            </v-col>
        </v-row>

        <v-row no-gutters>
          <v-col cols="5" class="img-frame">
            <v-img
              v-if="refImgDetail.imgUrl"
              :src="refImgDetail.imgUrl"
              aspect-ratio="1"
            />
          </v-col>
          <v-col cols="7" class="pl-8 | pr-4">
            <v-row no-gutters justify="start">
              <v-label class="ml-1">제목</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-text-field
                  v-model="refImgDetail.title"
                  class="inputbox"
                  :error-messages="errorMsg.title"
                  @update:model-value="errorMsg.title = ''"  
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>
            <v-row no-gutters justify="start" class="mt-1">
              <v-label class="ml-1">설명</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-textarea
                  v-model="refImgDetail.desc"
                  class="inputbox"
                  auto-grow rows="5" row-height="5" max-rows="5"
                  :error-messages="errorMsg.desc"
                  @update:model-value="errorMsg.desc = ''"  
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
              />
            </v-row>

            <v-row no-gutters justify="start" class="mt-1">
              <v-label class="ml-1">이미지</v-label>
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
              <v-label class="ml-1">카테고리</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
                <v-select
                  v-model="refImgDetail.ctgId"
                  :items="categoryOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="이미지 카테고리 선택" 
                  class="inputbox"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                />
            </v-row>

            <v-row no-gutters justify="start" class="mt-1">
              <v-label class="ml-1">이미지 태그</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
                <v-select
                  v-model="refImgDetail.kwd"
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

            <v-row no-gutters justify="start" class="mt-1">
              <v-label class="ml-1">AI 정보</v-label>
            </v-row>
            <v-row no-gutters justify="center" class="mt-1">
              <v-col>
                <v-textarea
                  :model-value="aiDocText"
                  class="inputbox"
                  readonly
                  auto-grow rows="5" max-rows="7"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                >
                  <template #append-inner>
                    <v-btn
                      @click.stop="handleClickBtn('downloadAiDoc')"
                      variant="outlined"
                      size="small"
                      class="small-btn | outline-grey"
                    >다운로드</v-btn>
                  </template>
                </v-textarea>
              </v-col>
              
              <v-col cols="auto" class="pl-2 | align-item-center">
                <v-btn
                  @click="handleClickBtn('viewAiDoc')"
                  variant="outlined" 
                  class="small-btn | fill-grey"
                >데이터 뷰어</v-btn>
              </v-col>
            </v-row>

            <v-row no-gutters justify="start" class="mt-1 | gap-16">
              <v-col class="date-col">
                <v-row no-gutters justify="start">
                  <v-label class="ml-1">가중치</v-label>
                </v-row>
                <v-row no-gutters justify="center" class="mt-1">
                  <v-text-field
                      v-model="refImgDetail.expWeight"
                      class="inputbox"
                      variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  />  
                </v-row>
              </v-col>
              <v-col class="date-col">
                <v-row no-gutters justify="start">
                  <v-label class="ml-1">우선순위</v-label>
                </v-row>
                <v-row no-gutters justify="center" class="mt-1">
                  <v-text-field
                      v-model="refImgDetail.pri"
                      class="inputbox"
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
                      v-model="refImgDetail.cDate"
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
                      v-model="refImgDetail.uDate"
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
</template>


<script setup>
// ----- 선언부 ----- //
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { navigateTo } from '@/common/RouterUtil.js';
import Util from '@/common/Util.js';

import * as HttpHandler from '@/common/HttpHandler.js';

const props = defineProps({
  refImgId: {
    type: [Number, String],
    required: true,
  },
});

const emit = defineEmits([
  'show-right-btn',
  'set-page-cfg',
  'show-left-btn'
]);

const router = useRouter(); 
const util = Util.getInstance();
const imageBaseUrl = (import.meta.env.VITE_IMAGE_BASE_URL || '').replace(/\/$/, '');

const refImgDetail = ref({
  id: null,
  nickname: '',
  useCnt: null,
  expWeight: null,
  pri: null,
  title: '',
  desc: '',
  ctgId: null,
  ctgName: null,
  kwd: [],
  imgUrl: '',
  cDate: '',
  uDate: '',
});

const aiDoc = ref(null);

const imageFileName = computed(() => {
  const url = refImgDetail.value.imgUrl;
  if (!url) {
    return '';
  }

  const cleanedUrl = String(url).split('?')[0].split('#')[0];
  const parts = cleanedUrl.split('/').filter(Boolean);
  return parts[parts.length - 1] || cleanedUrl;
});
const aiDocText = computed(() => {
  if (!aiDoc.value) {
    return '';
  }

  try {
    return JSON.stringify(aiDoc.value, null, 2);
  } catch (error) {
    return String(aiDoc.value);
  }
});

const errorMsg = ref({
  expWeight: '',
  pri: '',
  title: '',
  desc: '',
  ctgName: '',
  kwd: [],
  imgUrl: '',
});

const categoryOptions = ref([]);
const tagOptions = ref([]);
const tagNameByCode = ref({});

const dialog = ref({
  title: '',
  text: '',
  isActive: false,
  isOneBtn: false,
  okText: '확인',
  okButton() {}
});

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  emit('show-left-btn');
  emit('set-page-cfg', {
    name: '레퍼런스 이미지 상세',
    activePath: '/ref-images',
    backPath: '/ref-images',
  });

  fetchListCategory();
  fetchTagCategory().finally(() => {
    fetchRefImgDetail();
  });
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

async function fetchRefImgDetail() {
  if (!props.refImgId) {
    console.error('refImgId가 없어 상세 데이터를 조회할 수 없습니다.');
    return;
  }

  try {
    const response = await HttpHandler.getReference({
      id: props.refImgId,
    });

    const statusCode = response?.status?.code;
    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '레퍼런스 상세 조회에 실패했습니다.');
    }

    const detail = response?.data || {};

    refImgDetail.value = {
      id: detail.imgId ?? null,
      nickname: detail.user?.nickname || '',
      useCnt: detail.useCnt ?? 0,
      expWeight: detail.expWeight ?? null,
      pri: detail.pri ?? null,
      title: detail.title || '',
      desc: detail.desc || '',
      ctgId: detail.ctg?.ctgId ?? null,
      ctgName: detail.ctg?.ctgName || null,
      kwd: Array.isArray(detail.kwd)
        ? detail.kwd
            .map((code) => String(code || '').trim())
            .filter(Boolean)
        : [],
      imgUrl: buildThumbnailUrl(detail.imgUrl),
      cDate: util.formatUnixDateTime(detail.cDate),
      uDate: util.formatUnixDateTime(detail.uDate),
    };

    aiDoc.value = detail.aiDoc ?? null;
  } catch (error) {
    console.error('레퍼런스 상세 조회 실패:', error);
  }
}

async function fetchListCategory() {
  try {
    const categoryResponse = await HttpHandler.listCategories({ page: 0 });
    const categoryItems = categoryResponse?.data?.items || [];

    const uniqueCategories = new Map();
    categoryItems.forEach((category = {}) => {
      const id = category.id ?? category.ctgId;
      if (id === undefined || id === null || uniqueCategories.has(id)) {
        return;
      }

      uniqueCategories.set(id, {
        value: id,
        label: category.name || category.ctgName || String(id),
      });
    });

    categoryOptions.value = [
      ...Array.from(uniqueCategories.values()),
    ];
  } catch (error) {
    console.error('카테고리 옵션 조회 실패:', error);
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

    tagOptions.value = [
      ...Array.from(uniqueTags.values()),
    ];
  } catch (error) {
    console.error('태그 옵션 조회 실패:', error);
    tagNameByCode.value = {};
  }
}


function handleClickBtn(action, value) {
  switch (action) {
    case 'edit':
      navigateTo(router, '/ref-images/create');
      break;
    case 'delete': 
      {
        const targetRefId = refImgDetail.value.id ?? props.refImgId;
      openDialog(
        '삭제 확인',
        '정말 이 레퍼런스 이미지를 삭제하시겠습니까?',
        () => {
          dialog.value.isActive = false;
          fetchDeleteRefImg(targetRefId);
        },
        false,
        '삭제'
      );
      }
      break;

    case 'downloadAiDoc':
      downloadAiDoc();
      break;

    case 'viewAiDoc':
      viewAiDoc();
      break;

    default:
      console.error('알 수 없는 인증 액션 타입:', action);
  }
}

async function fetchDeleteRefImg(value) {
  const refId = Number(value);
  if (!refId) {
    console.error('삭제할 레퍼런스 이미지 ID가 유효하지 않습니다.');
    return;
  }

  try {
    const response = await HttpHandler.deleteReference({ id: refId });
    const statusCode = response?.status?.code;
    const isDeleted = response?.data?.deleted;

    if (statusCode && statusCode !== 'S0000') {
      throw new Error(response?.status?.msg || '레퍼런스 이미지 삭제에 실패했습니다.');
    }

    if (isDeleted === false) {
      throw new Error(response?.status?.msg || '레퍼런스 이미지 삭제에 실패했습니다.');
    }

    openDialog(
      '삭제 완료',
      '레퍼런스 이미지가 삭제되었습니다.',
      () => {
        dialog.value.isActive = false;
        navigateTo(router, '/ref-images');
      },
      true,
      '확인'
    );
  } catch (error) {
    console.error('레퍼런스 이미지 삭제 실패:', error);
    openDialog(
      '삭제 실패',
      error?.message || '레퍼런스 이미지 삭제 중 오류가 발생했습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
  }
}

function downloadAiDoc() {
  if (!aiDoc.value) {
    return;
  }

  const blob = new Blob([aiDocText.value], { type: 'application/json;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `ref-ai-doc-${refImgDetail.value.id || 'detail'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

function viewAiDoc() {
  if (!aiDoc.value) {
    return;
  }

  const newWindow = window.open('', '_blank');
  if (!newWindow) {
    return;
  }

  const escaped = aiDocText.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  newWindow.document.write(`<pre>${escaped}</pre>`);
  newWindow.document.close();
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

/* .inputbox :deep(.v-input__details) {
  padding-top: 4px !important;
} */
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

.category-chip {
  background-color: #FFF4F0;
  border: 0.7px solid #FFE0D4;
  color: #FF6129;
  font-size: 10px;
}

.tag-chip {
  background-color: #F3F4F6;
  color: #4A5565;
  font-size: 10px;
}

.gap-16 {
  column-gap: 16px;
}

.date-col {
  flex: 1 1 0;
}

</style>