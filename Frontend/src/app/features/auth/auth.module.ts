
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './components/login/login';  // ← ENLEVER .ts
import { RegisterComponent } from './components/register/register';  // ← ENLEVER .ts

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    AuthRoutingModule,
    LoginComponent,
    RegisterComponent
  ]
})
export class AuthModule { }
