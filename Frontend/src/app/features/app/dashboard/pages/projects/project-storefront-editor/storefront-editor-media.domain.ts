import { ProjectCatalogProduct } from '../../../../../../core/models/project-catalog.model';

import { StorefrontMediaManagerAsset } from './project-storefront-media-manager';

type ProjectMediaAsset = {
  id: number;
  fileName: string;
  fileUrl: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  fileSize: number;
  uploadedAt: string;
};

export function describeStorefrontMediaAsset(
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT',
  fileSize: number,
  formatFileSize: (size: number) => string
): string {
  const label = type === 'IMAGE' ? 'Image' : type === 'VIDEO' ? 'Video' : 'Document';
  if (!fileSize) {
    return label;
  }

  return `${label} - ${formatFileSize(fileSize)}`;
}

export function buildStorefrontMediaManagerAssets(
  projectMedia: ProjectMediaAsset[],
  catalogProducts: ProjectCatalogProduct[],
  formatFileSize: (size: number) => string
): StorefrontMediaManagerAsset[] {
  const assets = new Map<string, StorefrontMediaManagerAsset>();

  for (const media of projectMedia) {
    assets.set(media.fileUrl, {
      id: media.id,
      name: media.fileName,
      url: media.fileUrl,
      type: media.type,
      fileSize: media.fileSize,
      uploadedAt: media.uploadedAt,
      sourceLabel: 'Site files',
      description: describeStorefrontMediaAsset(media.type, media.fileSize, formatFileSize),
      origin: 'PROJECT',
    });
  }

  for (const product of catalogProducts) {
    if (!product.imageUrl || assets.has(product.imageUrl)) {
      continue;
    }

    assets.set(product.imageUrl, {
      id: product.id * 1000,
      name: product.name,
      url: product.imageUrl,
      type: 'IMAGE',
      fileSize: 0,
      uploadedAt: product.updatedAt || product.createdAt,
      sourceLabel: 'Catalog',
      description: product.category || 'Product image',
      origin: 'CATALOG',
    });
  }

  return Array.from(assets.values());
}
