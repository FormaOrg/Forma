import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard-stub',
  standalone: true,
  templateUrl: './dashboard-stub.html',
  styleUrl: './dashboard-stub.css'
})
export class DashboardStub implements OnInit {
  private route = inject(ActivatedRoute);
  title = (this.route.snapshot.data['title'] as string) ?? 'Page';

  ngOnInit(): void {
    this.route.data.subscribe((d) => {
      this.title = (d['title'] as string) ?? 'Page';
    });
  }
}
