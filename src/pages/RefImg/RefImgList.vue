<template>
    <v-container fluid>
        <v-row no-gutters class="search-row | align-item-center | justify-space-between">
            <v-col cols="auto" class="align-item-center | d-flex">
                <v-text-field
                    v-model="search.keyword"
                    placeholder="이미지 검색" 
                    class="inputbox | mr-2"
                    variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                    hide-details
                />
                <v-select
                    v-model="search.status"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    placeholder="이미지 카테고리 검색" 
                    class="inputbox | mr-2"
                    variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                    hide-details
                />
                <v-select
                    v-model="search.status"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    placeholder="이미지 태그 검색" 
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
                >이미지 등록</v-btn>
            </v-col>
        </v-row>

        <v-row class="gallery-row | ma-2" no-gutters>
          <v-col
            v-if="isLoading"
            cols="12"
            class="py-10"
          >
            <v-row justify="center">
              <v-progress-circular indeterminate color="#4A5565" />
            </v-row>
          </v-col>

          <v-col
            v-else-if="imgItems.length === 0"
            cols="12"
          >
            <v-card class="empty-card" variant="outlined">
              <v-card-text class="empty-text">표시할 레퍼런스 이미지가 없습니다.</v-card-text>
            </v-card>
          </v-col>

          <template v-else>
            <v-col
              v-for="item in imgItems"
              :key="item.id" 
              cols="12" sm="6" md="4" lg="2" xl="2" class="px-1 | pb-2"
            >
              <v-card
                class="gallery-card"
                variant="outlined"
                @click="handleClickBtn('goToDetail', item.id)"
              >
                <v-img
                  :src="item.imgUrl"
                  height="240"
                  cover
                  class="gallery-image"
                >
                  <template #placeholder>
                    <div class="image-placeholder">이미지 로딩 중</div>
                  </template>
                </v-img>

                <v-card-text class="pa-4">
                  <v-row no-gutters class="info-row | mb-1">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-account-outline</v-icon>
                    <span class="info-text">{{ item.nickname }}</span>
                  </v-row>

                  <v-row no-gutters class="align-center | justify-space-between | mb-2">
                    <v-col cols="auto">
                      <div class="card-title">{{ item.title }}</div>
                    </v-col>
                    <v-col cols="auto">
                      <div class="use-count">
                        <v-icon size="18" class="mr-1">mdi-camera-outline</v-icon>
                        <span>{{ item.useCnt }}</span>
                      </div>
                    </v-col>
                  </v-row>

                  <v-row no-gutters class="mb-3 | ga-1">
                    <v-chip size="small" variant="flat" class="category-chip">
                      {{ item.categoryName }}
                    </v-chip>
                    <v-chip
                      v-for="keyword in item.keywordList"
                      :key="keyword"
                      size="small"
                      variant="outlined"
                      class="tag-chip"
                    >{{ keyword }}</v-chip>
                  </v-row>


                  <v-row no-gutters class="info-row mb-1">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-clock-time-four-outline</v-icon>
                    <span class="info-text">등록 {{ item.cDate }}</span>
                  </v-row>
                  <v-row no-gutters class="info-row">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-update</v-icon>
                    <span class="info-text">수정 {{ item.uDate }}</span>
                  </v-row>
                </v-card-text>
              </v-card>

            </v-col>
          </template>
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
  limit: 10,
});

const totalCount = ref(0);
const isLoading = ref(false);

const statusOptions = [
  { label: '전체 상태', value: null },
  { label: '노출', value: 1 },
  { label: '숨김', value: 0 },
];

const imgItems = ref([]);

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  fetchListReferences();
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

async function fetchListReferences() {
  isLoading.value = true;

  try {
    const response = await HttpHandler.listReferences({
      page: pageNation.value.current,
      limit: pageNation.value.limit,
    });

    const list = response?.data?.items || [];
    const total = response?.data?.total || 0;

    let mappedRows = list.map((reference = {}) => ({
      id: reference.imgId,
      userId: reference.user?.userId,
      nickname: reference.user?.nickname || '-',
      title: reference.title || '-',
      imgUrl: buildThumbnailUrl(reference.imgUrl),
      categoryId: reference.ctg?.ctgId,
      categoryName: reference.ctg?.ctgName || '-',
      keywordList: Array.isArray(reference.kwd) ? reference.kwd : [],
      useCnt: reference.useCnt ?? 0,
      cDate: util.formatUnixDateTime(reference.cDate),
      uDate: util.formatUnixDateTime(reference.uDate),
    }));

    const keyword = search.value.keyword.trim().toLowerCase();
    if (keyword) {
      mappedRows = mappedRows.filter((item) => String(item.title).toLowerCase().includes(keyword));
      totalCount.value = mappedRows.length;
    } else {
      totalCount.value = total;
    }

    imgItems.value = mappedRows;

  } catch (error) {
    console.error('레퍼런스 이미지 목록 조회 실패:', error);
    imgItems.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
}

function handleClickBtn(action, value) {
  switch (action) {
    case 'reset':
      search.value.keyword = '';
      search.value.status = null;
      pageNation.value.current = 1;
      fetchListReferences();
      break;

    case 'search':
      pageNation.value.current = 1;
      fetchListReferences();
      break;

    case 'goToCreate':
      navigateTo(router, '/ref-images/create');
      break;

    case 'goToDetail':
      navigateTo(router, `/ref-images/${value}`);
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
  fetchListReferences();
}

function handleItemsPerPageChange(limit) {
  pageNation.value.limit = limit;
  pageNation.value.current = 1;
  fetchListReferences();
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

  .gallery-row {
    margin-left: -8px;
    margin-right: -8px;
  }

  .gallery-card {
    height: 100%;
    overflow: hidden;
    cursor: pointer;
    border-radius: 12px;
    border: 1px solid #E5E7EB;
    background-color: #FFFFFF;
  }

  .gallery-image {
    background-color: #F3F4F6;
  }

  .image-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6A7282;
    font-size: 14px;
    background-color: #F9FAFB;
  }

  .empty-card {
    border-radius: 12px;
    border: 0.7px solid #E5E7EB;
    background-color: #FFFFFF;
  }

  .empty-text {
    padding: 48px 16px;
    text-align: center;
    color: #6A7282;
    font-size: 14px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #364153;
    line-height: 1.5;
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

  .use-count {
    display: flex;
    align-items: center;
    color: #6A7282;
    font-size: 13px;
  }

  .info-row {
    align-items: center;
  }

  .info-text {
    color: #6A7282;
    font-size: 13px;
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