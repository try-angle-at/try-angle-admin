<template>
    <v-container fluid>
        <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
            <v-col class="search-label">
            총 <span style="color: #2563EB; font-weight: 500;">{{ totalCount }}</span>개
            </v-col>
            <v-col cols="auto" class="justify-end">
                <v-btn
                    @click="handleClickBtn('goToCreate')"
                    variant="outlined"
                    class="active-thin-btn | btn-width"
                >등록</v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>


<script setup>
// ----- 선언부 ----- //
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { navigateTo } from '@/common/RouterUtil.js';
import Util from '@/common/Util.js';

import * as HttpHandler from '@/common/HttpHandler.js';

const emit = defineEmits([
  'show-right-btn',
  'set-page-cfg',
  'show-left-btn'
]);

const router = useRouter(); 
const util = Util.getInstance();
const imageBaseUrl = (import.meta.env.VITE_IMAGE_BASE_URL || '').replace(/\/$/, '');

const categoryOptions = ref([
  { label: '전체 카테고리', value: null },
]);
const tagOptions = ref([]);
const tagNameByCode = ref({});

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  emit('show-left-btn');
  emit('set-page-cfg', {
    name: '레퍼런스 이미지 등록',
    activePath: '/ref-images',
    backPath: '/ref-images',
  });

  fetchListCategory();
  fetchTagCategory().finally(() => {
    fetchListReferences();
  });
});

// ----- 함수 정의 ----- //
async function fetchListCategory() {
  try {
    const categoryResponse = await HttpHandler.listCategories({ page: 0 });
    const categoryItems = categoryResponse?.data?.items || [];

    const uniqueCategories = new Map();
    categoryItems.forEach((category = {}) => {
      const id = category.id;
      if (id === undefined || id === null || uniqueCategories.has(id)) {
        return;
      }

      uniqueCategories.set(id, {
        value: id,
        label: category.name || String(id),
      });
    });

    categoryOptions.value = [
      { label: '전체 카테고리', value: null },
      ...Array.from(uniqueCategories.values()),
    ];
  } catch (error) {
    console.error('카테고리 옵션 조회 실패:', error);
    categoryOptions.value = [{ label: '전체 카테고리', value: null }];
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

    tagNameByCode.value = Array.from(uniqueTags.values()).reduce((acc, tag) => {
      acc[tag.value] = tag.label;
      return acc;
    }, {});
  } catch (error) {
    console.error('태그 옵션 조회 실패:', error);
    tagNameByCode.value = {};
  }
}


function handleClickBtn(action, value) {
  switch (action) {
    case 'goToCreate':
      navigateTo(router, '/ref-images/create');
      break;

    default:
      console.error('알 수 없는 인증 액션 타입:', action);
  }
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

</style>