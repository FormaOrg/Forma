import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-project-workspace-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './project-workspace-layout.html',
  styleUrl: './project-workspace-layout.css'
})
export class ProjectWorkspaceLayout {}
