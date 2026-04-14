import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "../components/layout/AdminLayout.vue";
import AppLayout from "../components/layout/AppLayout.vue";
import LoginView from "../views/LoginView.vue";
import AdminUsersView from "../views/admin/AdminUsersView.vue";
import AdminMaterialsView from "../views/admin/AdminMaterialsView.vue";
import AdminMachinesView from "../views/admin/AdminMachinesView.vue";
import AdminToolingView from "../views/admin/AdminToolingView.vue";
import AdminOptionsView from "../views/admin/AdminOptionsView.vue";
import RecommendationView from "../views/app/RecommendationView.vue";
import QuotesView from "../views/app/QuotesView.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: LoginView, meta: { guestOnly: true } },
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, role: "admin" },
    children: [
      { path: "users", component: AdminUsersView },
      { path: "materials", component: AdminMaterialsView },
      { path: "machines", component: AdminMachinesView },
      { path: "tooling", component: AdminToolingView },
      { path: "options", component: AdminOptionsView }
    ]
  },
  {
    path: "/app",
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "recommendation", component: RecommendationView },
      { path: "quotes", component: QuotesView }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const token = localStorage.getItem("spb_token");
  const user = JSON.parse(localStorage.getItem("spb_user") || "null");

  if (to.meta.requiresAuth && !token) {
    return "/login";
  }

  if (to.meta.guestOnly && token) {
    return user?.role === "admin" ? "/admin/users" : "/app/recommendation";
  }

  if (to.meta.role && user?.role !== to.meta.role) {
    return user?.role === "admin" ? "/admin/users" : "/app/recommendation";
  }

  return true;
});

export default router;
