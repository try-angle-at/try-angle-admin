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
                  v-model="search.ctgId"
                  :items="categoryOptions"
                    item-title="label"
                    item-value="value"
                    placeholder="이미지 카테고리 검색" 
                    class="inputbox | mr-2"
                    variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                    hide-details
                />
                <v-select
                  v-model="search.domain"
                  :items="domainFilterOptions"
                    item-title="label"
                    item-value="value"
                    placeholder="도메인 (패션/미감)"
                    class="inputbox | mr-2"
                    variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                    hide-details
                />
                <v-select
                  v-model="search.tagCodes"
                  :items="tagOptions"
                    item-title="label"
                    item-value="value"
                    multiple
                    chips
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
              cols="12" sm="6" md="4" lg="2" xl="2" class="refimg-col | px-1 | pb-2"
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
                      v-for="d in item.domainList"
                      :key="d.value"
                      size="small"
                      variant="flat"
                      :color="d.color"
                      class="domain-chip"
                    ><v-icon start size="14">{{ d.icon }}</v-icon>{{ d.label }}</v-chip>
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
          <v-row no-gutters class="data-table-footer">
            <v-col class="data-table-footer__items-per-page">
              <v-col cols="auto" class="items-per-page-label">display</v-col>
              <v-select
                class="items-per-page-select"
                :model-value="pageNation.limit"
                :items="itemsPerPageOptions"
                density="compact"
                hide-details
                variant="outlined"
                @update:model-value="handleItemsPerPageUpdate"
              />
            </v-col>

            <v-pagination
              class="table-pagination"
              :model-value="pageNation.current"
              :length="paginationLength"
              :total-visible="5"
              density="comfortable"
              rounded="circle"
              active-color="#101828"
              color="#6B7280"
              prev-icon="mdi-chevron-left"
              next-icon="mdi-chevron-right"
              @update:model-value="handlePageUpdate"
            />
          </v-row>
        </v-row>

    </v-container>
</template>


<script setup>
// ----- 선언부 ----- //
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { navigateTo } from '@/common/RouterUtil.js';
import Util from '@/common/Util.js';

import * as HttpHandler from '@/common/HttpHandler.js';
import { REF_DOMAIN_OPTIONS, splitDomainCodes, domainMeta } from '@/common/refDomains.js';

const emit = defineEmits([
  'show-right-btn',
]);
const router = useRouter(); 
const util = Util.getInstance();
const imageBaseUrl = (import.meta.env.VITE_IMAGE_BASE_URL || '').replace(/\/$/, '');

const itemsPerPageOptions = [10, 20, 30, 40];

const domainFilterOptions = [{ label: '전체 도메인', value: null }, ...REF_DOMAIN_OPTIONS];

const search = ref({
  domain: null,
  keyword: '',
  ctgId: null,
  tagCodes: [],
});

const pageNation = ref({
  current: 1,
  limit: 40,
});

const totalCount = ref(0);
const isLoading = ref(false);

const categoryOptions = ref([
  { label: '전체 카테고리', value: null },
]);

const tagOptions = ref([
]);
const tagNameByCode = ref({});

const imgItems = ref([]);
const paginationLength = computed(() => {
  const perPage = Number(pageNation.value.limit) || 0;
  if (perPage <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(totalCount.value / perPage));
});

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  fetchListCategory();
  fetchTagCategory().finally(() => {
    fetchListReferences();
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

async function fetchListReferences() {
  isLoading.value = true;

  try {
    const keyword = search.value.keyword.trim();
    const response = await HttpHandler.listReferences({
      page: pageNation.value.current,
      limit: pageNation.value.limit,
      ctgId: search.value.ctgId,
      title: keyword || null,
      kwd: [
        ...(search.value.tagCodes || []),
        ...(search.value.domain ? [search.value.domain] : []),
      ],
    });

    const list = response?.data?.items || [];
    const total = response?.data?.total || 0;

    const mappedRows = list.map((reference = {}) => ({
      id: reference.imgId,
      userId: reference.user?.userId,
      nickname: reference.user?.nickname || '-',
      title: reference.title || '-',
      imgUrl: buildThumbnailUrl(reference.imgUrl),
      categoryId: reference.ctg?.ctgId,
      categoryName: reference.ctg?.ctgName || '-',
      domainList: splitDomainCodes(reference.kwd).domains.map(domainMeta).filter(Boolean),
      keywordList: splitDomainCodes(reference.kwd).rest.map((code) => tagNameByCode.value[code] || code),
      useCnt: reference.useCnt ?? 0,
      cDate: util.formatUnixDateTime(reference.cDate),
      uDate: util.formatUnixDateTime(reference.uDate),
    }));

    totalCount.value = total;
    imgItems.value = mappedRows;

  } catch (error) {
    console.error('레퍼런스 이미지 목록 조회 실패:', error);
    imgItems.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
}

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
    case 'reset':
      search.value.keyword = '';
      search.value.ctgId = null;
      search.value.tagCodes = [];
      search.value.domain = null;
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


function handlePageUpdate(value) {
  const nextPage = Number(value) || 1;
  handlePageChange(nextPage);
}

function handleItemsPerPageUpdate(value) {
  const normalizedValue = Number(value) || pageNation.value.limit;
  handleItemsPerPageChange(normalizedValue);
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

.data-table-footer {
  border-top: 1px solid #F3F4F6;
  background-color: #FFFFFF;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 12px;
  min-height: 56px;
}

.data-table-footer__items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 1;
  margin-left: 16px;
  justify-self: start;
}

.items-per-page-label {
  color: #6A7282;
  font-size: 14px;
  font-weight: 400;
}

.items-per-page-select {
  max-width: 100px;
}

.table-pagination {
  grid-column: 2;
  justify-self: center;
}

.table-pagination :deep(.v-btn) {
  box-shadow: none;
  min-width: 32px;
  font-weight: 400;
}

</style>