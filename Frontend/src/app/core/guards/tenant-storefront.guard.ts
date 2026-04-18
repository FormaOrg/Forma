import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { map } from 'rxjs/operators';

import { PublicProjectDomainService } from '../services/public-project-domain.service';

export const tenantStorefrontCanMatch: CanMatchFn = () => {
  const publicProjectDomainService = inject(PublicProjectDomainService);

  return publicProjectDomainService.resolveCurrentHost().pipe(
    map((project) => project?.type === 'ECOMMERCE')
  );
};
