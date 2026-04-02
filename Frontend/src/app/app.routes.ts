import { Routes } from '@angular/router';
import { GuestGuard } from './core/guards/guest.guard';
import { AuthGuard } from './core/guards/auth.guard';
import { RootRedirectGuard } from './core/guards/root-redirect.guard';

import { LandingPage } from './features/landing-page/landing-page';
import { Pricing } from './features/pricing/pricing';
import { TemplateGallery } from './features/template-gallery/template-gallery';
import { PortfolioShowcase } from './features/templates-pages/portfolio-showcase/portfolio-showcase';
import { Product } from './features/product/product';
import { Tutorials } from './features/support/tutorials/tutorials';
import { Faqs } from './features/support/faqs/faqs';
import { Contact } from './features/support/contact/contact';

import { LoginComponent } from './features/auth/components/login/login';
import { RegisterComponent } from './features/auth/components/register/register';
import { EmailVerificationComponent } from './features/auth/components/email-verification/email-verification';
import { EmailVerificationRequiredComponent } from './features/auth/components/email-verification-required/email-verification-required';
import { ForgotPasswordComponent } from './features/auth/components/forgot-password/forgot-password';
import { LoginVerificationComponent } from './features/auth/components/login-verification/login-verification';
import { ResetPasswordComponent } from './features/auth/components/reset-password/reset-password';
import { BlogShowcase } from './features/templates-pages/blog-showcase/blog-showcase';
import { EcommerceShowcase } from './features/templates-pages/ecommerce-showcase/ecommerce-showcase';
import { AuthLayout } from './features/auth/components/auth-layout/auth-layout';

import { Dashboard } from './features/app/dashboard/dashboard';
import { Billing } from './features/app/dashboard/pages/billing/billing';
import { Home } from './features/app/dashboard/pages/home/home';
import { Projects } from './features/app/dashboard/pages/projects/projects';
import { ProjectsRouteLayout } from './features/app/dashboard/pages/projects/projects-route-layout/projects-route-layout';
import { ProjectWorkspaceLayout } from './features/app/dashboard/pages/projects/project-workspace-layout/project-workspace-layout';
import { ProjectRoutePlaceholder } from './features/app/dashboard/pages/projects/project-route-placeholder/project-route-placeholder';
import { DashboardStub } from './features/app/dashboard/pages/dashboard-stub/dashboard-stub';
import { Templates } from './features/app/dashboard/pages/templates/templates';
import { Settings } from './features/app/dashboard/pages/settings/settings';
import { SettingsProfile } from './features/app/dashboard/pages/settings/pages/profile/profile';
import { SettingsSecurity } from './features/app/dashboard/pages/settings/pages/security/security';
import { SettingsPreferences } from './features/app/dashboard/pages/settings/pages/preferences/preferences';
import { SettingsActivity } from './features/app/dashboard/pages/settings/pages/activity/activity';

export const routes: Routes = [
  { path: '', component: LandingPage, canActivate: [RootRedirectGuard] },
  { path: 'pricing', component: Pricing },
  { path: 'templates', component: TemplateGallery },
  { path: 'portfolio-website', component: PortfolioShowcase },
  { path: 'blog-website', component: BlogShowcase },
  { path: 'ecommerce-website', component: EcommerceShowcase },
  { path: 'product', component: Product },
  { path: 'tutorials', component: Tutorials },
  { path: 'faqs', component: Faqs },
  { path: 'contact', component: Contact },

  { path: 'dashboard', redirectTo: '/app/home', pathMatch: 'full' },

  {
    path: '',
    component: AuthLayout,
    children: [
      { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
      { path: 'login-verification', component: LoginVerificationComponent, canActivate: [GuestGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
      { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [GuestGuard] },
      { path: 'verify-email', component: EmailVerificationComponent },
      { path: 'verify-email-required', component: EmailVerificationRequiredComponent },
      { path: 'reset-password', component: ResetPasswordComponent }
    ]
  },

  {
    path: 'app',
    component: Dashboard,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: Home, data: { title: 'Home' } },
      {
        path: 'projects',
        component: ProjectsRouteLayout,
        data: { title: 'Projects' },
        children: [
          { path: '', component: Projects, data: { title: 'Projects' } },
          {
            path: ':projectId',
            component: ProjectWorkspaceLayout,
            data: { title: 'Project' },
            children: [
              { path: '', component: ProjectRoutePlaceholder, data: { title: 'Project' } },
              { path: 'overview', component: ProjectRoutePlaceholder, data: { title: 'Overview' } },
              { path: 'editor', component: ProjectRoutePlaceholder, data: { title: 'Editor' } },
              { path: 'pages', component: ProjectRoutePlaceholder, data: { title: 'Pages' } },
              { path: 'preview', component: ProjectRoutePlaceholder, data: { title: 'Preview' } },
              { path: 'deploy', component: ProjectRoutePlaceholder, data: { title: 'Deploy' } },
              { path: 'settings', component: ProjectRoutePlaceholder, data: { title: 'Settings' } },
              { path: 'media', component: ProjectRoutePlaceholder, data: { title: 'Media' } }
            ]
          }
        ]
      },
      { path: 'templates', component: Templates, data: { title: 'Templates' } },
      { path: 'profile', component: DashboardStub, data: { title: 'Profile' } },
      { path: 'billing', component: Billing, data: { title: 'Billing' } },
      {
        path: 'settings',
        component: Settings,
        data: { title: 'Settings' },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'profile' },
          { path: 'profile', component: SettingsProfile, data: { title: 'Profile' } },
          { path: 'security', component: SettingsSecurity, data: { title: 'Security' } },
          { path: 'preferences', component: SettingsPreferences, data: { title: 'Preferences' } },
          { path: 'activity', component: SettingsActivity, data: { title: 'Activity' } }
        ]
      }
    ]
  },

  { path: '**', redirectTo: '' }
];

