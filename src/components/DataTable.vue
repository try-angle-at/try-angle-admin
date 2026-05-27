<template>
    <v-data-table
      class="data-table"
      :headers="normalizedHeaders"
      :items="items"
      :item-value="itemKey"
      :items-per-page="internalItemsPerPage"
      :page="internalPage"
      :sort-by="internalSortBy"
      :search="internalSearch"
      :loading="loading"
      :loading-text="loadingText"
      :hover="hover"
      :fixed-header="fixedHeader"
      :height="height"
      :density="density"
      :show-select="showSelect"
      :return-object="returnObject"
      :no-data-text="emptyText"
      @update:page="handlePageUpdate"
      @update:items-per-page="handleItemsPerPageUpdate"
      @update:sort-by="handleSortByUpdate"
      @click:row="handleClickRow"
    >
      <template v-for="slotName in forwardedSlotNames" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </v-data-table>
</template>

<script setup>
// ----- 선언부 ----- //
import { computed, ref, useSlots, watch } from "vue";

const props = defineProps({
  headers: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemKey: {
    type: String,
    default: "id",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: "데이터를 불러오는 중입니다.",
  },
  emptyText: {
    type: String,
    default: "표시할 데이터가 없습니다.",
  },
  search: {
    type: String,
    default: "",
  },
  page: {
    type: Number,
    default: 1,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  sortBy: {
    type: Array,
    default: () => [],
  },
  density: {
    type: String,
    default: "comfortable",
  },
  hover: {
    type: Boolean,
    default: true,
  },
  fixedHeader: {
    type: Boolean,
    default: false,
  },
  height: {
    type: [String, Number],
    default: undefined,
  },
  showSelect: {
    type: Boolean,
    default: false,
  },
  returnObject: {
    type: Boolean,
    default: false,
  },
  showToolbar: {
    type: Boolean,
    default: true,
  },
  searchable: {
    type: Boolean,
    default: true,
  },
  searchPlaceholder: {
    type: String,
    default: "검색어를 입력하세요",
  },
  showRefresh: {
    type: Boolean,
    default: false,
  },
  refreshLabel: {
    type: String,
    default: "새로고침",
  },
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "update:search",
  "update:page",
  "update:itemsPerPage",
  "update:sortBy",
  "sortChange",
  "refresh",
  "rowClick",
]);

const slots = useSlots();
const forwardedSlotNames = computed(() => {
  return Object.keys(slots).filter((name) => name !== "toolbar-actions");
});

const normalizedHeaders = computed(() => {
  return (props.headers || []).map((header) => ({
    ...header,
    title: header.title ?? header.text ?? "",
    key: header.key ?? header.value ?? "",
  }));
});

const internalSearch = ref(props.search);
const internalPage = ref(props.page);
const internalItemsPerPage = ref(props.itemsPerPage);
const internalSortBy = ref(props.sortBy);

watch(() => props.search, (value) => {
  internalSearch.value = value;
});

watch(() => props.page, (value) => {
  internalPage.value = value;
});

watch(() => props.itemsPerPage, (value) => {
  internalItemsPerPage.value = value;
});

watch(() => props.sortBy, (value) => {
  internalSortBy.value = value;
});

function handleSearchUpdate(value) {
  internalSearch.value = value || "";
  emit("update:search", internalSearch.value);
}

function handlePageUpdate(value) {
  internalPage.value = value;
  emit("update:page", value);
}

function handleItemsPerPageUpdate(value) {
  internalItemsPerPage.value = value;
  emit("update:itemsPerPage", value);
}

function handleSortByUpdate(value) {
  const firstSort = Array.isArray(value) && value.length > 0 ? value[0] : null;
  const sortKey = firstSort?.key || null;
  const sortOrder = firstSort?.order || null;

  // 헤더 화살표 UI 전환(asc/desc)이 보이도록 내부 상태는 유지
  internalSortBy.value = value;
  emit("update:sortBy", value);
  emit("sortChange", {
    key: sortKey,
    order: sortOrder,
  });
}

function handleClickRow(event, item) {
  emit("rowClick", { event, item });
}

</script>

<style scoped>
.data-table {
  width: 100%;
  border: 1px solid #E5E7EB;
  background-color: #FFFFFF;
  overflow: hidden;
}

.data-table :deep(thead th) {
  background-color: #F9FAFB;
  color: #4B5563;
  font-size: 13px;
  font-weight: 700;
}

.data-table :deep(tbody td) {
  font-size: 14px;
  color: #111827;
  border-bottom: 1px solid #F3F4F6;
}

.data-table :deep(.v-data-table-footer) {
  border-top: 1px solid #F3F4F6;
  background-color: #FFFFFF;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 12px;
  min-height: 56px;
}

.data-table :deep(.v-data-table-footer__items-per-page) {
  grid-column: 1;
  justify-self: start;
}

.data-table :deep(.v-data-table-footer__pagination) {
  grid-column: 2;
  justify-self: center;
}

.data-table :deep(.v-data-table-footer__info) {
  grid-column: 3;
  justify-self: end;
}

@media (max-width: 768px) {
  .data-table :deep(.v-data-table-footer) {
    grid-template-columns: 1fr;
    row-gap: 8px;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .data-table :deep(.v-data-table-footer__items-per-page),
  .data-table :deep(.v-data-table-footer__pagination),
  .data-table :deep(.v-data-table-footer__info) {
    grid-column: 1;
    justify-self: center;
  }

  .data-table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-field {
    width: 100%;
  }
}
</style>