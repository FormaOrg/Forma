import { Routes } from '@angular/router';
import { GuestGuard } from './core/guards/guest.guard';

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
import { ResetPasswordComponent } from './features/auth/components/reset-password/reset-password';
import { BlogShowcase } from './features/templates-pages/blog-showcase/blog-showcase';
import { EcommerceShowcase } from './features/templates-pages/ecommerce-showcase/ecommerce-showcase';
import { AuthLayout } from './features/auth/components/auth-layout/auth-layout';

import { Dashboard } from './features/app/dashboard/dashboard';
import { Home } from './features/app/dashboard/pages/home/home';
import { DashboardStub } from './features/app/dashboard/pages/dashboard-stub/dashboard-stub';

export const routes: Routes = [
  { path: '', component: LandingPage },
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
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: Home, data: { title: 'Home' } },
      { path: 'projects', component: DashboardStub, data: { title: 'Projects' } },
      { path: 'templates', component: DashboardStub, data: { title: 'Templates' } },
      { path: 'profile', component: DashboardStub, data: { title: 'Profile' } },
      { path: 'billing', component: DashboardStub, data: { title: 'Billing' } },
      { path: 'settings', component: DashboardStub, data: { title: 'Settings' } }
    ]
  },

  { path: '**', redirectTo: '' }
];
// their code
