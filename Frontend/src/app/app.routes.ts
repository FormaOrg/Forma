import { Routes } from '@angular/router';
import { LandingPage } from './features/landing-page/landing-page';
import { Pricing } from './features/pricing/pricing';
import { TemplateGallery } from './features/template-gallery/template-gallery';
import { PortfolioShowcase } from './features/templates-pages/portfolio-showcase/portfolio-showcase';
import { Product } from './features/product/product';
import { Tutorials } from './features/support/tutorials/tutorials';
import { Faqs } from './features/support/faqs/faqs';
import { Contact } from './features/support/contact/contact';



export const routes: Routes = [
    {path:"", component:LandingPage},
    {path:"pricing", component:Pricing},
    {path:"templates", component:TemplateGallery},
    {path:"portfolio-website", component:PortfolioShowcase},
    {path:"product", component:Product},
    {path:"tutorials", component:Tutorials},
    {path:"faqs", component:Faqs},
    {path:"contact", component:Contact}
];