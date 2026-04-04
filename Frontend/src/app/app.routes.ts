import { Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { RootRedirectGuard } from './core/guards/root-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [RootRedirectGuard],
    loadComponent: () => import('./features/landing-page/landing-page').then((m) => m.LandingPage)
  },
  {
    path: 'pricing',
    loadComponent: () => import('./features/pricing/pricing').then((m) => m.Pricing)
  },
  {
    path: 'templates',
    loadComponent: () => import('./features/template-gallery/template-gallery').then((m) => m.TemplateGallery)
  },
  {
    path: 'portfolio-website',
    loadComponent: () => import('./features/templates-pages/portfolio-showcase/portfolio-showcase').then((m) => m.PortfolioShowcase)
  },
  {
    path: 'blog-website',
    loadComponent: () => import('./features/templates-pages/blog-showcase/blog-showcase').then((m) => m.BlogShowcase)
  },
  {
    path: 'ecommerce-website',
    loadComponent: () => import('./features/templates-pages/ecommerce-showcase/ecommerce-showcase').then((m) => m.EcommerceShowcase)
  },
  {
    path: 'product',
    loadComponent: () => import('./features/product/product').then((m) => m.Product)
  },
  {
    path: 'tutorials',
    loadComponent: () => import('./features/support/tutorials/tutorials').then((m) => m.Tutorials)
  },
  {
    path: 'faqs',
    loadComponent: () => import('./features/support/faqs/faqs').then((m) => m.Faqs)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/support/contact/contact').then((m) => m.Contact)
  },

  { path: 'dashboard', redirectTo: '/app/home', pathMatch: 'full' },

  {
    path: '',
    loadComponent: () => import('./features/auth/components/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        canActivate: [GuestGuard],
        loadComponent: () => import('./features/auth/components/login/login').then((m) => m.LoginComponent)
      },
      {
        path: 'login-verification',
        canActivate: [GuestGuard],
        loadComponent: () => import('./features/auth/components/login-verification/login-verification').then((m) => m.LoginVerificationComponent)
      },
      {
        path: 'register',
        canActivate: [GuestGuard],
        loadComponent: () => import('./features/auth/components/register/register').then((m) => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        canActivate: [GuestGuard],
        loadComponent: () => import('./features/auth/components/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent)
      },
      {
        path: 'verify-email',
        loadComponent: () => import('./features/auth/components/email-verification/email-verification').then((m) => m.EmailVerificationComponent)
      },
      {
        path: 'verify-email-required',
        loadComponent: () => import('./features/auth/components/email-verification-required/email-verification-required').then((m) => m.EmailVerificationRequiredComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/components/reset-password/reset-password').then((m) => m.ResetPasswordComponent)
      }
    ]
  },

  {
    path: 'app',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadComponent: () => import('./features/app/dashboard/dashboard').then((m) => m.Dashboard),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        data: { title: 'Home' },
        loadComponent: () => import('./features/app/dashboard/pages/home/home').then((m) => m.Home)
      },
      {
        path: 'create-project',
        data: { title: 'Create Project', immersive: true },
        loadComponent: () => import('./features/app/dashboard/pages/project-creation/project-creation').then((m) => m.ProjectCreation)
      },
      {
        path: 'projects',
        data: { title: 'Projects' },
        loadComponent: () => import('./features/app/dashboard/pages/projects/projects-route-layout/projects-route-layout').then((m) => m.ProjectsRouteLayout),
        children: [
          {
            path: '',
            data: { title: 'Projects' },
            loadComponent: () => import('./features/app/dashboard/pages/projects/projects').then((m) => m.Projects)
          },
          {
            path: ':projectId',
            data: { title: 'Setup' },
            loadComponent: () => import('./features/app/dashboard/pages/projects/project-workspace-layout/project-workspace-layout').then((m) => m.ProjectWorkspaceLayout),
            children: [
              {
                path: '',
                data: { title: 'Setup' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-route-placeholder/project-route-placeholder').then((m) => m.ProjectRoutePlaceholder)
              },
              {
                path: 'home',
                data: { title: 'Home' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-home-route/project-home-route').then((m) => m.ProjectHomeRoute)
              },
              {
                path: 'sales',
                data: { title: 'Sales' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-sales-route/project-sales-route').then((m) => m.ProjectSalesRoute)
              },
              {
                path: 'catalog',
                data: { title: 'Catalog' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-catalog-route/project-catalog-route').then((m) => m.ProjectCatalogRoute)
              },
              {
                path: 'customers',
                data: { title: 'Customers' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-customers-route/project-customers-route').then((m) => m.ProjectCustomersRoute)
              },
              {
                path: 'analytics',
                data: { title: 'Analytics' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-route-placeholder/project-route-placeholder').then((m) => m.ProjectRoutePlaceholder)
              },
              {
                path: 'help',
                data: { title: 'Help' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-route-placeholder/project-route-placeholder').then((m) => m.ProjectRoutePlaceholder)
              },
              {
                path: 'editor',
                data: { title: 'Editor' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-route-placeholder/project-route-placeholder').then((m) => m.ProjectRoutePlaceholder)
              },
              {
                path: 'settings',
                data: { title: 'Settings' },
                loadComponent: () => import('./features/app/dashboard/pages/projects/project-route-placeholder/project-route-placeholder').then((m) => m.ProjectRoutePlaceholder)
              },
              { path: 'overview', redirectTo: 'home', pathMatch: 'full' },
              { path: 'deploy', redirectTo: 'sales', pathMatch: 'full' },
              { path: 'pages', redirectTo: 'catalog', pathMatch: 'full' },
              { path: 'media', redirectTo: 'customers', pathMatch: 'full' },
              { path: 'preview', redirectTo: 'analytics', pathMatch: 'full' }
            ]
          }
        ]
      },
      {
        path: 'templates',
        data: { title: 'Templates' },
        loadComponent: () => import('./features/app/dashboard/pages/templates/templates').then((m) => m.Templates)
      },
      {
        path: 'profile',
        data: { title: 'Profile' },
        loadComponent: () => import('./features/app/dashboard/pages/dashboard-stub/dashboard-stub').then((m) => m.DashboardStub)
      },
      {
        path: 'billing',
        data: { title: 'Billing' },
        loadComponent: () => import('./features/app/dashboard/pages/billing/billing').then((m) => m.Billing)
      },
      {
        path: 'settings',
        data: { title: 'Settings' },
        loadComponent: () => import('./features/app/dashboard/pages/settings/settings').then((m) => m.Settings),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'profile' },
          {
            path: 'profile',
            data: { title: 'Profile' },
            loadComponent: () => import('./features/app/dashboard/pages/settings/pages/profile/profile').then((m) => m.SettingsProfile)
          },
          {
            path: 'security',
            data: { title: 'Security' },
            loadComponent: () => import('./features/app/dashboard/pages/settings/pages/security/security').then((m) => m.SettingsSecurity)
          },
          {
            path: 'preferences',
            data: { title: 'Preferences' },
            loadComponent: () => import('./features/app/dashboard/pages/settings/pages/preferences/preferences').then((m) => m.SettingsPreferences)
          },
          {
            path: 'activity',
            data: { title: 'Activity' },
            loadComponent: () => import('./features/app/dashboard/pages/settings/pages/activity/activity').then((m) => m.SettingsActivity)
          }
        ]
      }
    ]
  },

  { path: '**', redirectTo: '' }
];

