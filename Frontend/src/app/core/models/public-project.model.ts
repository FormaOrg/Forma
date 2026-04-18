import { ProjectType } from './project.model';

export interface ResolvedPublicProject {
  projectId: number;
  defaultDomain: string;
  type: ProjectType;
  published: boolean;
}
