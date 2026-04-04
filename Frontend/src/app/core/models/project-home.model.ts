export interface ProjectHomeMetric {
  label: string;
  value: string;
  helper: string;
}

export interface ProjectHomeActivity {
  title: string;
  description: string;
  occurredAt: string;
  route: string;
}

export interface ProjectHomeAction {
  title: string;
  description: string;
  route: string;
  actionLabel: string;
}

export interface ProjectHomePage {
  projectId: number;
  projectName: string;
  ownerName: string;
  projectStatus: string;
  published: boolean;
  projectType: string;
  creationMethod: string;
  metrics: ProjectHomeMetric[];
  recentActivities: ProjectHomeActivity[];
  suggestedActions: ProjectHomeAction[];
}
