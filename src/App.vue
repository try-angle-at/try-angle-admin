<template>
  <v-app class="background">
    <v-navigation-drawer
      v-if="shouldShowSideNav"
      app
      width="280"
      color="#FFFFFF"
      class="side-nav-drawer"
    >
      <v-col cols="auto" class="pl-5 | side-nav-header">
        <v-img
          src="@/assets/title.png"
          alt="Fooding Logo"
          contain width="200"
          @click="handleClickBtn('goToHome')"
        />
      </v-col>

      <v-divider />

      <v-list nav density="comfortable" class="side-nav-list">
        <SideNavItem
          v-for="page in pageList"
          :key="page.path || page.name"
          :item="page"
          :current-path="route.path"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar 
      app color="#FFFFFF" flat
      v-if="showTopNav"
    >


      <v-row no-gutters class="justify-space-between | align-center | header-container">
        <!-- Parent 타이틀 표시 -->
        <template v-if="!showLeftBtn">
          <v-col cols="auto" class="pl-5">
            <span class="app-title-left">{{ currentPageCfg.name }}</span>
          </v-col>

          <v-col cols="auto" class="pr-2">
            <v-btn
              icon="$cus-profile" 
              variant="outlined" density="comfortable" rounded="circle"
              class="profileIcon"
              @click="handleClickBtn('goToMypage')"
            ></v-btn>
          </v-col>
        </template>

        <!-- Child 타이틀 표시 -->
        <template v-else>
          <!-- 왼쪽 버튼 영역 -->
          <v-col cols="auto" class="pl-2">
            <v-btn
              v-if="showLeftBtn"
              icon="mdi-chevron-left" 
              variant="text" density="comfortable"
              @click="handleClickBtn('goToBack')"
            ></v-btn>
            <div v-else style="width: 40px;"></div>
            <span class="app-title-left">{{ currentPageCfg.name }}</span>
          </v-col>

          <v-col cols="auto" class="pr-2">
            <v-btn
              icon="$cus-profile" 
              variant="outlined" density="comfortable" rounded="circle"
              class="profileIcon"
              @click="handleClickBtn('goToMypage')"
            ></v-btn>
          </v-col>
        </template>
      </v-row>



    </v-app-bar>

    <v-main>
      <router-view
        @hide-top-appbar="hideTopNav"
        @hide-side-appbar="hideSideNav"
        @show-left-btn="showLeftNavBtn"
      ></router-view>
    </v-main>

  </v-app>

  <!-- 다이얼로그 -->
  <v-dialog v-model="dialog.isActive" width="400px">
    <v-card style="padding: 24px 16px; border-radius: 24px;">
      <v-btn 
        icon="mdi-close" variant="text" size="small"
        v-if="!dialog.isOneBtn"
        @click="dialog.isActive = false"
        style="position: absolute; top: 12px; right: 12px; color: #6B7280; z-index: 10;"
      />

      <v-card-title>
        <v-row no-gutters class="align-center | justify-center">
          <v-icon size="64" color="#2B7FFF" icon="$cus-complete-icon"/>
        </v-row>
        <v-row no-gutters class="align-center | justify-center | mt-3"
          style="color: #101828; font-size: 20px; font-weight: 400; letter-spacing: -0.45px;"
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
          <v-btn class="active-btn" style="border-radius: 16px;" variant="outlined" @click="dialog.okButton" :loading="isSubmitting">{{ dialog.okText }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, ref, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { navigateTo, goBack } from '@/common/RouterUtil.js';
import SideNavItem from '@/components/SideNavItem.vue';

// 라우터 인스턴스 가져오기
const router = useRouter();
const route = useRoute(); // (추가) 현재 라우트 정보 가져오기

// 네비게이션 표시 상태
const showTopNav = ref(true);
const showSideNav = ref(true);

const showLeftBtn = ref(false);
const publicPages = ['/login', '/register'];

// 페이지별 네비게이션 설정
const pageList = ref([
  {
    name: '데이터 관리',
    child: [
      {
        page: 'RealtimeList',
        name: '실시간 로그 데이터 목록',
        path: '/dashboard/realtime-list',
      },
      {
        page: 'TagList',
        name: '태그 관리',
        path: '/tag',
      },
      {
        page: 'CategoryList',
        name: '카테고리 관리',
        path: '/category',
      },
    ],
  },
  {
    name: '컨텐츠 관리',
    child: [
      {
        page: 'RefImgList',
        name: '레퍼런스 이미지 관리',
        path: '/ref-images',
      },
      {
        page: 'ProdList',
        name: '상품 관리',
        path: '/products',
      },
      {
        page: 'SnapList',
        name: '후기 사진 관리',
        path: '/snaps',
      },
    ],
  },
]);

// 현재 페이지 설정 계산
const currentPageCfg = computed(() => {
  const matchedPage = findPageByPath(pageList.value, route.path);

  return matchedPage || {
    name: '',
  };
});

const shouldShowSideNav = computed(() => {
  return showSideNav.value && !publicPages.includes(route.path) && pageList.value.length > 0;
});

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
  console.log(import.meta.env)
  
  checkLogin();
});

watch(
  () => route.path, // 현재 경로(path)를 감시
  () => {
    showTopNav.value = true;
    showSideNav.value = true;
    showLeftBtn.value = false;
  }
);

// ----- 함수 정의 ----- //

// 로그인 체크
function checkLogin() {
  const user = localStorage.getItem('user');
  const accessToken = localStorage.getItem('accessToken');
  const isPublicPage = publicPages.includes(route.path);

  if ((!user || !accessToken) && !isPublicPage) {
    console.log('로그인 정보 없음 - 로그인 페이지로 이동');
    navigateTo(router, '/login');
  }
}

// 상단 앱 바 숨기기
function hideTopNav() {
  showTopNav.value = false;
}

// 하단 앱 바 숨기기
function hideSideNav() {
  showSideNav.value = false;
}

function showLeftNavBtn() {
  showLeftBtn.value = true;
}

function findPageByPath(pages, targetPath) {
  for (const page of pages) {
    if (page.path === targetPath) {
      return page;
    }

    if (page.child?.length) {
      const matchedChild = findPageByPath(page.child, targetPath);

      if (matchedChild) {
        return matchedChild;
      }
    }
  }

  return null;
}

// 메뉴 클릭 핸들러
function handleMenuClick(action) {
  console.log('Menu Clicked:', action);
  isFabOpen.value = false; // 클릭 후 닫기
  
  // 액션에 따른 라우팅 처리 예시
  switch (action) {
    case 'create':
      navigateTo(router, '/group/create');
      break;

    case 'profile':
      navigateTo(router, '/user');
      break;

    case 'userGroup':
      navigateTo(router, '/group/user');
      break;

    case 'UserReview':
      navigateTo(router, '/review');
      break;
  }
}

// 버튼 클릭 이벤트 핸들러
function handleClickBtn(action) {
  switch (action) {
    case 'goToHome':
      navigateTo(router, '/');
      break;

    case 'goToMypage':
      navigateTo(router, '/user');
      break;

    case 'goToBack':
      goBack(router);
      break;

    default:
      console.error('알 수 없는 인증 액션 타입:', action);
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
.side-nav-drawer {
  border-right: 1px solid #e5e7eb;
}

.side-nav-header {
  height: 64px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  cursor: pointer;
}

.side-nav-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* 네비게이션 바 스타일 */
.app-title-left {
  font-size: 18px;
  font-weight: 700;
  color: #364153;
  letter-spacing: -0.2px;
}

.profileIcon {
  background-color: #F3F4F6;
  color: #364153;
  border: 0px;
}

.floating-btn {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  width: 56px !important;
  height: 56px !important;
  border-radius: 50% !important;
  z-index: 100;
}

</style>
