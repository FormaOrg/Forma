import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AppIcon } from '../../../../../../../../shared/app/icons/app-icon';
import { PexelsPhoto, PexelsPhotoService } from '../../../../../../../../core/services/pexels-photo.service';

export interface StorefrontMediaManagerAsset {
  id: number;
  name: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  fileSize: number;
  uploadedAt: string | null;
  sourceLabel: string;
  description: string;
  origin: 'PROJECT' | 'CATALOG' | 'PEXELS';
}

interface MediaBoard {
  id: string;
  title: string;
  description: string;
  assetIds: number[];
}

type MediaFilter = 'ALL' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
type MediaSort = 'NEWEST' | 'OLDEST' | 'NAME';
type MediaViewMode = 'grid' | 'list';
type MediaSidebarSection =
  | 'home'
  | 'site-files'
  | 'boards'
  | 'trash'
  | 'forma-media'
  | 'pexels';

@Component({
  selector: 'app-project-storefront-media-manager',
  standalone: true,
  imports: [CommonModule, AppIcon],
  templateUrl: './project-storefront-media-manager.html',
  styleUrl: './project-storefront-media-manager.css',
})
export class ProjectStorefrontMediaManager implements OnChanges {
  readonly storageLimitBytes = 400 * 1024 * 1024;
  private readonly pexelsPhotoService = inject(PexelsPhotoService);
  private pexelsSearchTimer: ReturnType<typeof setTimeout> | null = null;

  @Input({ required: true }) assets: StorefrontMediaManagerAsset[] = [];
  @Input() isUploading = false;

  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly filesSelected = new EventEmitter<FileList>();
  @Output() readonly confirmSelection = new EventEmitter<StorefrontMediaManagerAsset>();
  @Output() readonly deleteAsset = new EventEmitter<StorefrontMediaManagerAsset>();

  readonly manageLinks: Array<{ id: MediaSidebarSection; label: string }> = [
    { id: 'site-files', label: 'Site files' },
    { id: 'boards', label: 'Boards' },
    { id: 'trash', label: 'Trash' },
  ];

  readonly discoverLinks: Array<{ id: MediaSidebarSection; label: string }> = [
    { id: 'forma-media', label: 'Forma media' },
    { id: 'pexels', label: 'Pexels' },
  ];

  activeSection: MediaSidebarSection = 'site-files';
  searchTerm = '';
  filter: MediaFilter = 'ALL';
  sort: MediaSort = 'NEWEST';
  viewMode: MediaViewMode = 'grid';
  selectedAssetId: number | null = null;
  isFilterMenuOpen = false;
  isSortMenuOpen = false;
  isStockLoading = false;
  stockError = '';
  stockAssets: StorefrontMediaManagerAsset[] = [];
  trashedAssetIds = new Set<number>();
  selectedBoardId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ('assets' in changes) {
      const nextSelected = this.assets.some((asset) => asset.id === this.selectedAssetId)
        ? this.selectedAssetId
        : this.assets[0]?.id ?? null;
      this.selectedAssetId = nextSelected;
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isFilterMenuOpen || this.isSortMenuOpen) {
      this.isFilterMenuOpen = false;
      this.isSortMenuOpen = false;
      return;
    }
    this.close.emit();
  }

  @HostListener('document:mousedown', ['$event'])
  handleDocumentMouseDown(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      this.isFilterMenuOpen = false;
      this.isSortMenuOpen = false;
      return;
    }

    if (!target.closest('.media-manager__toolbar-dropdown')) {
      this.isFilterMenuOpen = false;
      this.isSortMenuOpen = false;
    }
  }

  get visibleAssets(): StorefrontMediaManagerAsset[] {
    const query = this.searchTerm.trim().toLowerCase();
    const sourceAssets = this.assetsForActiveSection;

    return [...sourceAssets]
      .filter((asset) => this.filter === 'ALL' || asset.type === this.filter)
      .filter((asset) => {
        if (!query) {
          return true;
        }

        return [asset.name, asset.description, asset.sourceLabel].some((value) =>
          value.toLowerCase().includes(query)
        );
      })
      .sort((left, right) => {
        if (this.sort === 'NAME') {
          return left.name.localeCompare(right.name);
        }

        const leftTime = left.uploadedAt ? new Date(left.uploadedAt).getTime() : 0;
        const rightTime = right.uploadedAt ? new Date(right.uploadedAt).getTime() : 0;
        return this.sort === 'OLDEST' ? leftTime - rightTime : rightTime - leftTime;
      });
  }

  get selectedAsset(): StorefrontMediaManagerAsset | null {
    const sourceAssets = this.assetsForActiveSection;
    return sourceAssets.find((asset) => asset.id === this.selectedAssetId) ?? null;
  }

  get totalAssetCount(): number {
    return this.assetsForActiveSection.length;
  }

  get imageAssetCount(): number {
    const sourceAssets = this.assetsForActiveSection;
    return sourceAssets.filter((asset) => asset.type === 'IMAGE').length;
  }

  get recentUploads(): StorefrontMediaManagerAsset[] {
    const sourceAssets = this.assetsForActiveSection;
    return [...sourceAssets]
      .sort((left, right) => {
        const leftTime = left.uploadedAt ? new Date(left.uploadedAt).getTime() : 0;
        const rightTime = right.uploadedAt ? new Date(right.uploadedAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 4);
  }

  get totalStorageLabel(): string {
    const totalBytes = this.assets.reduce((sum, asset) => sum + asset.fileSize, 0);
    return this.formatFileSize(totalBytes);
  }

  get storageUsedBytes(): number {
    return this.assets.reduce((sum, asset) => sum + asset.fileSize, 0);
  }

  get storageUsedPercent(): number {
    if (!this.storageLimitBytes) {
      return 0;
    }

    return Math.min(100, (this.storageUsedBytes / this.storageLimitBytes) * 100);
  }

  get storageUsageLabel(): string {
    return `${this.formatFileSize(this.storageUsedBytes)} used of ${this.formatFileSize(this.storageLimitBytes)}`;
  }

  get boards(): MediaBoard[] {
    const activeAssets = this.assets.filter((asset) => !this.trashedAssetIds.has(asset.id));
    const recent = [...activeAssets]
      .sort((left, right) => {
        const leftTime = left.uploadedAt ? new Date(left.uploadedAt).getTime() : 0;
        const rightTime = right.uploadedAt ? new Date(right.uploadedAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 8)
      .map((asset) => asset.id);
    const catalog = activeAssets
      .filter((asset) => asset.sourceLabel.toLowerCase().includes('catalog'))
      .map((asset) => asset.id);
    const documents = activeAssets
      .filter((asset) => asset.type === 'DOCUMENT')
      .map((asset) => asset.id);

    return [
      {
        id: 'recent',
        title: 'Recent shots',
        description: 'Fresh uploads ready to reuse in your storefront.',
        assetIds: recent,
      },
      {
        id: 'catalog',
        title: 'Catalog picks',
        description: 'Product and catalog visuals already connected to the shop.',
        assetIds: catalog,
      },
      {
        id: 'documents',
        title: 'Reference files',
        description: 'Documents and supporting assets kept together.',
        assetIds: documents,
      },
    ].filter((board) => board.assetIds.length > 0);
  }

  get selectedBoard(): MediaBoard | null {
    return this.boards.find((board) => board.id === this.selectedBoardId) ?? this.boards[0] ?? null;
  }

  get trashCount(): number {
    return this.trashedAssetIds.size;
  }

  get canTrashSelectedAsset(): boolean {
    return !!this.selectedAsset && this.selectedAsset.origin === 'PROJECT' && this.activeSection !== 'trash';
  }

  get canRestoreSelectedAsset(): boolean {
    return !!this.selectedAsset && this.activeSection === 'trash';
  }

  get confirmLabel(): string {
    return this.activeSection === 'pexels' ? 'Import to site files' : 'Select asset';
  }

  private get assetsForActiveSection(): StorefrontMediaManagerAsset[] {
    if (this.activeSection === 'pexels') {
      return this.stockAssets;
    }

    if (this.activeSection === 'trash') {
      return this.assets.filter((asset) => this.trashedAssetIds.has(asset.id));
    }

    if (this.activeSection === 'boards') {
      const board = this.selectedBoard;
      if (!board) {
        return [];
      }

      return this.assets.filter(
        (asset) => !this.trashedAssetIds.has(asset.id) && board.assetIds.includes(asset.id)
      );
    }

    return this.assets.filter((asset) => !this.trashedAssetIds.has(asset.id));
  }

  get filterLabel(): string {
    switch (this.filter) {
      case 'IMAGE':
        return 'Images';
      case 'VIDEO':
        return 'Videos';
      case 'DOCUMENT':
        return 'Documents';
      default:
        return 'All';
    }
  }

  get sortLabel(): string {
    switch (this.sort) {
      case 'OLDEST':
        return 'Oldest';
      case 'NAME':
        return 'Name';
      default:
        return 'Newest';
    }
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  selectSection(section: MediaSidebarSection): void {
    this.activeSection = section;
    this.searchTerm = '';
    this.selectedBoardId = section === 'boards' ? this.boards[0]?.id ?? null : null;
    if (section === 'pexels') {
      this.loadPexelsPhotos();
    }
  }

  selectAsset(assetId: number): void {
    this.selectedAssetId = assetId;
  }

  setFilter(filter: MediaFilter): void {
    this.filter = filter;
    this.isFilterMenuOpen = false;
  }

  setSort(sort: MediaSort): void {
    this.sort = sort;
    this.isSortMenuOpen = false;
  }

  setViewMode(viewMode: MediaViewMode): void {
    this.viewMode = viewMode;
  }

  selectBoard(boardId: string): void {
    this.selectedBoardId = boardId;
    this.selectedAssetId = this.selectedBoard?.assetIds[0] ?? null;
  }

  toggleFilterMenu(): void {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
    this.isSortMenuOpen = false;
  }

  toggleSortMenu(): void {
    this.isSortMenuOpen = !this.isSortMenuOpen;
    this.isFilterMenuOpen = false;
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.files?.length) {
      return;
    }

    this.filesSelected.emit(input.files);
    input.value = '';
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;

    if (this.activeSection !== 'pexels') {
      return;
    }

    if (this.pexelsSearchTimer) {
      clearTimeout(this.pexelsSearchTimer);
    }

    this.pexelsSearchTimer = setTimeout(() => this.loadPexelsPhotos(), 260);
  }

  confirm(): void {
    const selectedAsset = this.selectedAsset;
    if (!selectedAsset) {
      return;
    }

    this.confirmSelection.emit(selectedAsset);
  }

  copySelectedAssetUrl(): void {
    const selectedAsset = this.selectedAsset;
    if (!selectedAsset || !navigator.clipboard) {
      return;
    }

    void navigator.clipboard.writeText(selectedAsset.url);
  }

  openSelectedAsset(): void {
    const selectedAsset = this.selectedAsset;
    if (!selectedAsset) {
      return;
    }

    window.open(selectedAsset.url, '_blank', 'noopener');
  }

  moveSelectedAssetToTrash(): void {
    const selectedAsset = this.selectedAsset;
    if (!selectedAsset || selectedAsset.origin !== 'PROJECT') {
      return;
    }
    this.deleteAsset.emit(selectedAsset);
  }

  restoreSelectedAsset(): void {
    const selectedAsset = this.selectedAsset;
    if (!selectedAsset) {
      return;
    }

    this.trashedAssetIds.delete(selectedAsset.id);
    this.selectedAssetId = this.visibleAssets.find((asset) => asset.id !== selectedAsset.id)?.id ?? null;
  }

  formatFileSize(bytes: number): string {
    if (!bytes) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** index;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
  }

  formatDate(value: string | null): string {
    if (!value) {
      return 'Recently added';
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  }

  trackAsset = (_: number, asset: StorefrontMediaManagerAsset): number => asset.id;
  trackLink = (_: number, link: { id: MediaSidebarSection; label: string }): string => link.id;
  trackBoard = (_: number, board: MediaBoard): string => board.id;

  private loadPexelsPhotos(): void {
    if (!this.pexelsPhotoService.hasApiKey()) {
      this.stockAssets = [];
      this.stockError = 'Add a Pexels API key in the environment config to browse free stock photos here.';
      return;
    }

    this.isStockLoading = true;
    this.stockError = '';

    const request = this.searchTerm.trim()
      ? this.pexelsPhotoService.searchPhotos(this.searchTerm.trim())
      : this.pexelsPhotoService.getCuratedPhotos();

    request.pipe(finalize(() => (this.isStockLoading = false))).subscribe({
      next: (photos) => {
        this.stockAssets = photos.map((photo) => this.mapPexelsPhoto(photo));
        if (!this.stockAssets.length) {
          this.stockError = this.searchTerm.trim()
            ? 'No Pexels photos matched this search.'
            : 'No Pexels photos are available right now.';
        }
        this.selectedAssetId = this.stockAssets[0]?.id ?? this.selectedAssetId;
      },
      error: () => {
        this.stockAssets = [];
        this.stockError = 'Unable to load Pexels photos right now.';
      },
    });
  }

  private mapPexelsPhoto(photo: PexelsPhoto): StorefrontMediaManagerAsset {
    return {
      id: photo.id,
      name: photo.alt || `Pexels photo ${photo.id}`,
      url: photo.src.large,
      type: 'IMAGE',
      fileSize: 0,
      uploadedAt: null,
      sourceLabel: `Photo by ${photo.photographer} on Pexels`,
      description: 'Free stock photo',
      origin: 'PEXELS',
    };
  }
}
