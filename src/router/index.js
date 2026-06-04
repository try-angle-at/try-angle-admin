import { createRouter, createWebHistory } from 'vue-router';

/* INFO rule
 * path
    1. camelCase 로 작성
    2. 파일 path와 동일하게 작성 예) folder1/folder2/my-file
 * name
    1. 파일명 작성 -> PascalCase 사용.
 * component
    1. 파일 path 작성
 */

const routes = [
  {
    path: '/',
    redirect: '/ref-images'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import(/* webpackChunkName: "home" */ "@/pages/Home.vue")
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ "@/pages/Auth/Login.vue")
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import(/* webpackChunkName: "register" */ "@/pages/Auth/Register.vue")
  },
  {
    path: '/user',
    name: 'UserMenu',
    component: () => import(/* webpackChunkName: "user-menu" */ "@/pages/Auth/UserMenu.vue")
  },
  {
    path: '/ref-images',
    name: 'RefImgList',
    component: () => import(/* webpackChunkName: "ref-img-list" */ "@/pages/RefImg/RefImgList.vue")
  },
  {
    path: '/ref-images/create',
    name: 'RefImgCreate',
    component: () => import(/* webpackChunkName: "ref-img-create" */ "@/pages/RefImg/RefImgCreate.vue")
  },
  {
    path: '/ref-images/:id',
    name: 'RefImgDetail',
    props: (route) => ({ refImgId: route.params.id }),
    component: () => import(/* webpackChunkName: "ref-img-detail" */ "@/pages/RefImg/RefImgDetail.vue")
  },
  {
    path: '/products',
    name: 'ProdList',
    component: () => import(/* webpackChunkName: "prod-list" */ "@/pages/Product/ProdList.vue")
  },
  {
    path: '/products/:id',
    name: 'ProdDetail',
    component: () => import(/* webpackChunkName: "prod-detail" */ "@/pages/Product/ProdDetail.vue")
  },
  {
    path: '/products/create',
    name: 'ProdForm',
    component: () => import(/* webpackChunkName: "prod-form" */ "@/pages/Product/ProdForm.vue")
  },
  {
    path: '/snaps',
    name: 'SnapList',
    component: () => import(/* webpackChunkName: "snap-list" */ "@/pages/Snap/SnapList.vue")
  },
  {
    path: '/snaps/:id',
    name: 'SnapDetail',
    component: () => import(/* webpackChunkName: "snap-detail" */ "@/pages/Snap/SnapDetail.vue")
  },
  {
    path: '/tag',
    name: 'TagList',
    component: () => import(/* webpackChunkName: "tag-list" */ "@/pages/Tag/TagList.vue")
  },
  {
    path: '/category',
    name: 'CategoryList',
    component: () => import(/* webpackChunkName: "category-list" */ "@/pages/Category/CategoryList.vue")
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
export { routes }