import { Routes } from '@angular/router';
import { LandingPage } from './features/landing-page/landing-page';
import { Pricing } from './features/pricing/pricing';

export const routes: Routes = [
    {path:"", component:LandingPage},
    {path:"pricing", component:Pricing}
];
