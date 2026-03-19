import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-product',
  imports: [
    Header,
    Footer
  ],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class Product {

}
