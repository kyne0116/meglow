import { createRouter, createWebHistory } from 'vue-router';
import { useAdminSessionStore } from '../stores/session';

const AdminLayout = () => import('../layouts/AdminLayout.vue');
const DashboardPage = () => import('../pages/dashboard/DashboardPage.vue');
const LoginPage = () => import('../pages/login/LoginPage.vue');
const TextbooksPage = () => import('../pages/textbooks/TextbooksPage.vue');
const KnowledgePointsPage = () => import('../pages/knowledge-points/KnowledgePointsPage.vue');
const ContentItemsPage = () => import('../pages/content-items/ContentItemsPage.vue');
const AuditLogsPage = () => import('../pages/audit-logs/AuditLogsPage.vue');
const AdminUsersPage = () => import('../pages/admin-users/AdminUsersPage.vue');

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { public: true },
    },
    {
      path: '/',
      component: AdminLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardPage,
        },
        {
          path: 'textbooks',
          name: 'textbooks',
          component: TextbooksPage,
        },
        {
          path: 'knowledge-points',
          name: 'knowledge-points',
          component: KnowledgePointsPage,
        },
        {
          path: 'content-items',
          name: 'content-items',
          component: ContentItemsPage,
        },
        {
          path: 'admin-users',
          name: 'admin-users',
          component: AdminUsersPage,
          meta: { roles: ['SUPER_ADMIN'] },
        },
        {
          path: 'audit-logs',
          name: 'audit-logs',
          component: AuditLogsPage,
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const session = useAdminSessionStore();

  if (!session.initialized) {
    await session.bootstrap();
  }

  if (to.meta.public) {
    if (session.isAuthenticated) {
      return { name: 'dashboard' };
    }
    return true;
  }

  if (!session.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  const allowedRoles = Array.isArray(to.meta.roles) ? to.meta.roles : [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.profile?.role ?? '')) {
    return { name: 'dashboard' };
  }

  return true;
});
