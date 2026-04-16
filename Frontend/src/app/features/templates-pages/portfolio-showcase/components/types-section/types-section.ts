import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LinkButton } from "../../../../../shared/components/link-button/link-button";

type PortfolioTag = {
    label: string;
    url: string;
    width: string;
};

@Component({
  selector: 'app-types-section',
  imports: [RouterLink, LinkButton],
  templateUrl: './types-section.html',
  styleUrl: './types-section.css',
})
export class TypesSection {
  readonly tags = signal<PortfolioTag[]>([
      { label: 'Architecture Portfolio', url: '/templates/architecture', width: "300px" },
      { label: 'Photography Portfolio', url: '/templates/photography', width: "px" },
      { label: 'Illustration Portfolio', url: '/templates/illustration', width: "px" },
      { label: 'Interior Design Portfolio', url: '/templates/interior-design', width: "px" },
      { label: 'Model Portfolio', url: '/templates/model', width: "px" },
      { label: 'Art Portfolio', url: '/templates/art', width: "px" },
      { label: 'Music Portfolio', url: '/templates/music', width: "px" },
      { label: 'Video Portfolio', url: '/templates/video', width: "px" },
      { label: 'Graphic Design Portfolio', url: '/templates/graphic-design', width: "px" },
  ]);
}
