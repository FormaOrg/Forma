// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard }  from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { LoginComponent }                      from './features/auth/components/login/login';
import { RegisterComponent }                   from './features/auth/components/register/register';
import { EmailVerificationComponent }          from './features/auth/components/email-verification/email-verification';
import { EmailVerificationRequiredComponent }  from './features/auth/components/email-verification-required/email-verification-required';
import { ForgotPasswordComponent }             from './features/auth/components/forgot-password/forgot-password';
import { ResetPasswordComponent }              from './features/auth/components/reset-password/reset-password';
import { Home } from './features/home/home';
import { LandingPage } from './features/landing-page/landing-page';

export const routes: Routes = [

  // ── Root redirect ──────────────────────────────────────
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ── Guest-only (redirect away if already logged in) ────
  { path: 'login',           component: LoginComponent,           canActivate: [GuestGuard] },
  { path: 'register',        component: RegisterComponent,        canActivate: [GuestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent,  canActivate: [GuestGuard] },

  // ── Public — no auth needed ────────────────────────────
  { path: 'verify-email',          component: EmailVerificationComponent },
  { path: 'verify-email-required', component: EmailVerificationRequiredComponent },
  { path: 'reset-password',        component: ResetPasswordComponent },

  // ── Protected (must be logged in + verified) ───────────
  { path: 'home', component: Home, canActivate: [AuthGuard] },

    { path: 'landing', component: LandingPage},

  // ── Wildcard ───────────────────────────────────────────
  { path: '**', redirectTo: 'login' }
];