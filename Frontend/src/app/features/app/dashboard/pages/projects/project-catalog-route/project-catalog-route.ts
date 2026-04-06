import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap } from 'rxjs';

import { ProjectCatalogProduct } from '../../../../../../core/models/project-catalog.model';
import { ProjectStorefront, StorefrontHomepageDocument } from '../../../../../../core/models/project-storefront.model';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectCatalogService } from '../../../../../../core/services/project-catalog.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { ProjectStorefrontService } from '../../../../../../core/services/project-storefront.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { UploadService } from '../../../../../../core/services/upload.service';
import { AppIcon } from '../../../../../../shared/app/icons/app-icon';

type Viewport = 'desktop' | 'tablet' | 'mobile';
type LeftTab = 'layers' | 'sections' | 'elements' | 'media';
type SectionPreset = 'header' | 'hero' | 'features' | 'cta' | 'products' | 'testimonials' | 'faq' | 'footer';
type ElementType = 'text' | 'image' | 'button' | 'icon' | 'divider' | 'container' | 'product' | 'gallery';
type Align = 'left' | 'center' | 'right';

type Selection =
  | { kind: 'page' }
  | { kind: 'section'; sectionId: string }
  | { kind: 'element'; sectionId: string; elementId: string };

interface Spacing { top: number; right: number; bottom: number; left: number; }
interface Typography { size: number; weight: 400 | 500 | 600 | 700 | 800; align: Align; }
interface BoxStyle {
  color: string;
  background: string;
  radius: number;
  width: number;
  padding: Spacing;
  marginTop: number;
  marginBottom: number;
  typography: Typography;
}
interface SectionStyle {
  background: string;
  color: string;
  maxWidth: number;
  columns: number;
  gap: number;
  padding: Spacing;
}

interface BaseElement { id: string; type: ElementType; name: string; style: BoxStyle; }
interface TextElement extends BaseElement { type: 'text'; content: string; tag: 'p' | 'h1' | 'h2' | 'h3'; }
interface ImageElement extends BaseElement { type: 'image'; src: string; alt: string; fit: 'cover' | 'contain'; height: number; }
interface ButtonElement extends BaseElement { type: 'button'; label: string; href: string; variant: 'solid' | 'outline'; }
interface IconElement extends BaseElement { type: 'icon'; icon: string; size: number; }
interface DividerElement extends BaseElement { type: 'divider'; thickness: number; }
interface ContainerElement extends BaseElement { type: 'container'; title: string; body: string; direction: 'row' | 'column'; }
interface ProductElement extends BaseElement { type: 'product'; productId: number | null; showDescription: boolean; showPrice: boolean; ctaLabel: string; }
interface GalleryElement extends BaseElement { type: 'gallery'; imageUrls: string[]; columns: number; height: number; }

type BuilderElement = TextElement | ImageElement | ButtonElement | IconElement | DividerElement | ContainerElement | ProductElement | GalleryElement;
interface BuilderSection { id: string; preset: SectionPreset; name: string; style: SectionStyle; elements: BuilderElement[]; }
interface BuilderPage { version: number; pageKey: 'home'; seo: StorefrontHomepageDocument['seo']; sections: BuilderSection[]; }
interface MediaAsset { id: string; url: string; label: string; }

@Component({
  selector: 'app-project-catalog-route',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIcon],
  templateUrl: './project-catalog-route.html',
  styleUrl: './project-catalog-route.css',
})
export class ProjectCatalogRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectService = inject(ProjectService);
  private readonly catalogService = inject(ProjectCatalogService);
  private readonly storefrontService = inject(ProjectStorefrontService);
  private readonly uploadService = inject(UploadService);
  private readonly toastService = inject(ToastService);

  private autosaveTimeout?: number;
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  readonly projectId = toSignal(this.route.parent!.paramMap.pipe(map((p) => Number(p.get('projectId') ?? '0'))), {
    initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0'),
  });

  readonly project = signal<Project | null>(null);
  readonly storefront = signal<ProjectStorefront | null>(null);
  readonly page = signal<BuilderPage | null>(null);
  readonly products = signal<ProjectCatalogProduct[]>([]);
  readonly media = signal<MediaAsset[]>([]);
  readonly selection = signal<Selection>({ kind: 'page' });
  readonly leftTab = signal<LeftTab>('layers');
  readonly viewport = signal<Viewport>('desktop');
  readonly previewMode = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isUploading = signal(false);
  readonly hasAutosavePending = signal(false);
  readonly lastSavedAt = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly storeName = signal('Forma Atelier');
  readonly savedSnapshot = signal('');

  readonly sectionOptions = [
    { type: 'header', label: 'Header', description: 'Top navigation and brand area.' },
    { type: 'hero', label: 'Hero', description: 'Headline, image and CTA.' },
    { type: 'features', label: 'Features', description: 'Benefit-driven content grid.' },
    { type: 'cta', label: 'CTA', description: 'Focused conversion section.' },
    { type: 'products', label: 'Products', description: 'Feature real catalog products.' },
    { type: 'testimonials', label: 'Testimonials', description: 'Customer proof and quotes.' },
    { type: 'faq', label: 'FAQ', description: 'Common questions and answers.' },
    { type: 'footer', label: 'Footer', description: 'Close with links and contact.' },
  ] as const;

  readonly elementOptions = [
    { type: 'text', label: 'Text', description: 'Paragraphs and headings.' },
    { type: 'image', label: 'Image', description: 'Upload or replace visuals.' },
    { type: 'button', label: 'Button', description: 'Clickable call to action.' },
    { type: 'icon', label: 'Icon', description: 'Small decorative or numeric badge.' },
    { type: 'divider', label: 'Divider', description: 'Visual separator.' },
    { type: 'container', label: 'Container', description: 'Flexible content block.' },
    { type: 'product', label: 'Product', description: 'Live product card.' },
    { type: 'gallery', label: 'Gallery', description: 'Responsive image gallery.' },
  ] as const;

  readonly sections = computed(() => this.page()?.sections ?? []);
  readonly selectedSection = computed(() => {
    const selected = this.selection();
    if (selected.kind === 'page') return null;
    return this.sections().find((section) => section.id === selected.sectionId) ?? null;
  });
  readonly selectedElement = computed(() => {
    const selected = this.selection();
    if (selected.kind !== 'element') return null;
    return this.selectedSection()?.elements.find((element) => element.id === selected.elementId) ?? null;
  });
  readonly hasUnsavedChanges = computed(() => this.serialize(this.page()) !== this.savedSnapshot());
  readonly canUndo = computed(() => this.undoStack.length > 0);
  readonly canRedo = computed(() => this.redoStack.length > 0);
  readonly canvasWidth = computed(() => this.viewport() === 'mobile' ? '390px' : this.viewport() === 'tablet' ? '820px' : '100%');

  constructor() { this.load(); }

  load(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Project not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.projectService.getProjectById(projectId).pipe(
      switchMap((project) => {
        this.project.set(project);
        this.storeName.set(project.storeTitle?.trim() || project.name);
        return forkJoin({
          storefront: this.storefrontService.getStorefront(projectId),
          products: this.catalogService.getCatalogPage(projectId, {}).pipe(map((page) => page.products)),
        });
      }),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ storefront, products }) => {
        this.storefront.set(storefront);
        this.products.set(products);
        const page = this.normalizePage(storefront.draftHomepage, storefront, products);
        this.page.set(page);
        this.savedSnapshot.set(this.serialize(page));
        this.lastSavedAt.set(storefront.updatedAt);
        this.media.set(this.collectMedia(page));
        this.selection.set(page.sections[0] ? { kind: 'section', sectionId: page.sections[0].id } : { kind: 'page' });
        this.undoStack = [];
        this.redoStack = [];
      },
      error: (error) => {
        this.errorMessage.set(this.readErrorMessage(error, 'Unable to open the editor right now.'));
      },
    });
  }

  goBack(): void { void this.router.navigate(['/app/projects', this.projectId(), 'home']); }
  setLeftTab(tab: LeftTab): void { this.leftTab.set(tab); }
  setViewport(viewport: Viewport): void { this.viewport.set(viewport); }
  togglePreview(): void { this.previewMode.update((value) => !value); }
  selectPage(): void { this.selection.set({ kind: 'page' }); }
  selectSection(sectionId: string): void { this.selection.set({ kind: 'section', sectionId }); this.leftTab.set('layers'); }
  selectElement(sectionId: string, elementId: string): void { this.selection.set({ kind: 'element', sectionId, elementId }); this.leftTab.set('layers'); }

  addSection(preset: SectionPreset): void {
    this.mutatePage((page) => {
      const section = this.createSection(preset);
      const selected = this.selection();
      const index = selected.kind === 'page' ? page.sections.length - 1 : page.sections.findIndex((item) => item.id === selected.sectionId);
      page.sections.splice(index + 1, 0, section);
      this.selection.set({ kind: 'section', sectionId: section.id });
    });
  }

  duplicateSection(sectionId: string): void {
    this.mutatePage((page) => {
      const index = page.sections.findIndex((section) => section.id === sectionId);
      if (index < 0) return;
      const copy = this.clone(page.sections[index]);
      copy.id = this.id('section');
      copy.name = `${copy.name} Copy`;
      copy.elements = copy.elements.map((element) => ({ ...this.rekeyElement(element) }));
      page.sections.splice(index + 1, 0, copy);
      this.selection.set({ kind: 'section', sectionId: copy.id });
    });
  }

  deleteSection(sectionId: string): void {
    this.mutatePage((page) => {
      if (page.sections.length <= 1) return;
      const index = page.sections.findIndex((section) => section.id === sectionId);
      if (index < 0) return;
      page.sections.splice(index, 1);
      const next = page.sections[index] ?? page.sections[index - 1];
      this.selection.set(next ? { kind: 'section', sectionId: next.id } : { kind: 'page' });
    });
  }

  moveSection(sectionId: string, direction: 'up' | 'down'): void {
    this.mutatePage((page) => {
      const index = page.sections.findIndex((section) => section.id === sectionId);
      const target = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= page.sections.length) return;
      const [section] = page.sections.splice(index, 1);
      page.sections.splice(target, 0, section);
    });
  }

  addElement(type: ElementType): void {
    const section = this.selectedSection() ?? this.sections()[0];
    if (!section) {
      this.toastService.error('Add or select a section first.');
      return;
    }
    this.mutatePage((page) => {
      const target = page.sections.find((item) => item.id === section.id);
      if (!target) return;
      const element = this.createElement(type);
      target.elements.push(element);
      this.selection.set({ kind: 'element', sectionId: target.id, elementId: element.id });
    });
  }

  duplicateElement(sectionId: string, elementId: string): void {
    this.mutatePage((page) => {
      const section = page.sections.find((item) => item.id === sectionId);
      const index = section?.elements.findIndex((item) => item.id === elementId) ?? -1;
      if (!section || index < 0) return;
      const copy = this.rekeyElement(this.clone(section.elements[index]));
      copy.name = `${copy.name} Copy`;
      section.elements.splice(index + 1, 0, copy);
      this.selection.set({ kind: 'element', sectionId, elementId: copy.id });
    });
  }

  deleteElement(sectionId: string, elementId: string): void {
    this.mutatePage((page) => {
      const section = page.sections.find((item) => item.id === sectionId);
      const index = section?.elements.findIndex((item) => item.id === elementId) ?? -1;
      if (!section || index < 0) return;
      section.elements.splice(index, 1);
      this.selection.set({ kind: 'section', sectionId });
    });
  }

  moveElement(sectionId: string, elementId: string, direction: 'up' | 'down'): void {
    this.mutatePage((page) => {
      const section = page.sections.find((item) => item.id === sectionId);
      const index = section?.elements.findIndex((item) => item.id === elementId) ?? -1;
      const target = direction === 'up' ? index - 1 : index + 1;
      if (!section || index < 0 || target < 0 || target >= section.elements.length) return;
      const [element] = section.elements.splice(index, 1);
      section.elements.splice(target, 0, element);
    });
  }

  updateStoreName(value: string): void { this.storeName.set(value); this.mutatePage((page) => page.seo.title = value); }
  updateSeo(field: 'title' | 'description', value: string): void { this.mutatePage((page) => page.seo[field] = value); }
  updateSectionName(value: string): void { this.mutateSelectedSection((section) => section.name = value); }
  updateSectionStyle<K extends keyof SectionStyle>(key: K, value: SectionStyle[K]): void { this.mutateSelectedSection((section) => section.style[key] = value); }
  updateSectionPadding(side: keyof Spacing, value: number): void { this.mutateSelectedSection((section) => section.style.padding[side] = Math.max(0, value)); }
  updateElementStyle<K extends keyof BoxStyle>(key: K, value: BoxStyle[K]): void { this.mutateSelectedElement((element) => element.style[key] = value); }
  updateElementPadding(side: keyof Spacing, value: number): void { this.mutateSelectedElement((element) => element.style.padding[side] = Math.max(0, value)); }
  updateElementTypography<K extends keyof Typography>(key: K, value: Typography[K]): void { this.mutateSelectedElement((element) => element.style.typography[key] = value); }
  updateTypographyWeight(value: number): void { this.updateElementTypography('weight', (value === 400 || value === 500 || value === 600 || value === 700 || value === 800 ? value : 500) as Typography['weight']); }

  updateTextTag(value: TextElement['tag']): void { this.mutateSelectedElement((element) => { if (element.type === 'text') element.tag = value; }); }
  updateTextContent(value: string): void { this.mutateSelectedElement((element) => { if (element.type === 'text') element.content = value; }); }
  updateButton(field: 'label' | 'href' | 'variant', value: string): void { this.mutateSelectedElement((element) => { if (element.type === 'button') { if (field === 'variant') element.variant = value === 'outline' ? 'outline' : 'solid'; else element[field] = value as never; } }); }
  updateImage(field: 'src' | 'alt' | 'fit', value: string): void { this.mutateSelectedElement((element) => { if (element.type === 'image') { if (field === 'fit') element.fit = value === 'contain' ? 'contain' : 'cover'; else element[field] = value as never; } }); }
  updateImageHeight(value: number): void { this.mutateSelectedElement((element) => { if (element.type === 'image') element.height = Math.max(140, value); }); }
  updateIcon(field: 'icon', value: string): void { this.mutateSelectedElement((element) => { if (element.type === 'icon') element.icon = value; }); }
  updateIconSize(value: number): void { this.mutateSelectedElement((element) => { if (element.type === 'icon') element.size = Math.max(18, value); }); }
  updateDivider(value: number): void { this.mutateSelectedElement((element) => { if (element.type === 'divider') element.thickness = Math.max(1, value); }); }
  updateContainer(field: 'title' | 'body' | 'direction', value: string): void { this.mutateSelectedElement((element) => { if (element.type === 'container') { if (field === 'direction') element.direction = value === 'row' ? 'row' : 'column'; else element[field] = value as never; } }); }
  updateProduct(field: 'productId' | 'ctaLabel', value: string): void { this.mutateSelectedElement((element) => { if (element.type === 'product') { if (field === 'productId') { const id = Number(value); element.productId = Number.isFinite(id) && id > 0 ? id : null; } else element.ctaLabel = value; } }); }
  toggleProduct(field: 'showDescription' | 'showPrice', value: boolean): void { this.mutateSelectedElement((element) => { if (element.type === 'product') element[field] = value; }); }
  updateGallery(field: 'columns' | 'height', value: number): void { this.mutateSelectedElement((element) => { if (element.type === 'gallery') element[field] = Math.max(field === 'columns' ? 1 : 140, value); }); }
  updateGalleryUrls(value: string): void { this.mutateSelectedElement((element) => { if (element.type === 'gallery') element.imageUrls = value.split("`n").map((item) => item.trim()).filter(Boolean); }); }

  applyMedia(url: string): void {
    this.mutateSelectedElement((element) => {
      if (element.type === 'image') element.src = url;
      if (element.type === 'gallery' && !element.imageUrls.includes(url)) element.imageUrls.push(url);
    });
  }

  removeSelectedImage(): void { this.mutateSelectedElement((element) => { if (element.type === 'image') element.src = ''; }); }
  removeGalleryImage(url: string): void { this.mutateSelectedElement((element) => { if (element.type === 'gallery') element.imageUrls = element.imageUrls.filter((item) => item !== url); }); }

  uploadMedia(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file || !this.projectId()) return;
    const validation = this.uploadService.validateMedia(file);
    if (!validation.valid) { this.toastService.error(validation.error ?? 'Invalid media.'); input.value = ''; return; }
    this.isUploading.set(true);
    this.uploadService.uploadProjectMedia(file, this.projectId()).pipe(
      finalize(() => { this.isUploading.set(false); input.value = ''; }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.media.update((items) => [{ id: this.id('media'), url: response.url, label: file.name }, ...items.filter((item) => item.url !== response.url)]);
        if (this.selectedElement()?.type === 'image' || this.selectedElement()?.type === 'gallery') this.applyMedia(response.url);
        this.toastService.success('Media uploaded.');
      },
      error: (error) => this.toastService.error(this.readErrorMessage(error, 'Unable to upload media right now.')),
    });
  }

  saveNow(): void { this.persist(false); }

  undo(): void {
    const previous = this.undoStack.pop();
    const current = this.serialize(this.page());
    if (!previous || !current) return;
    this.redoStack.push(current);
    this.page.set(JSON.parse(previous) as BuilderPage);
    this.syncAfterRestore();
  }

  redo(): void {
    const next = this.redoStack.pop();
    const current = this.serialize(this.page());
    if (!next || !current) return;
    this.undoStack.push(current);
    this.page.set(JSON.parse(next) as BuilderPage);
    this.syncAfterRestore();
  }

  trackSection = (_: number, section: BuilderSection): string => section.id;
  trackElement = (_: number, element: BuilderElement): string => element.id;
  trackMedia = (_: number, item: MediaAsset): string => item.id;
  trackProduct = (_: number, product: ProjectCatalogProduct): number => product.id;

  isSectionSelected(sectionId: string): boolean {
    const selected = this.selection();
    return selected.kind === 'section' && selected.sectionId === sectionId;
  }

  isElementSelected(elementId: string): boolean {
    const selected = this.selection();
    return selected.kind === 'element' && selected.elementId === elementId;
  }

  canMoveSection(sectionId: string, direction: 'up' | 'down'): boolean {
    const index = this.sections().findIndex((section) => section.id === sectionId);
    return direction === 'up' ? index > 0 : index >= 0 && index < this.sections().length - 1;
  }

  canMoveElement(sectionId: string, elementId: string, direction: 'up' | 'down'): boolean {
    const section = this.sections().find((item) => item.id === sectionId);
    const index = section?.elements.findIndex((item) => item.id === elementId) ?? -1;
    return direction === 'up' ? index > 0 : index >= 0 && index < (section?.elements.length ?? 0) - 1;
  }

  sectionStyle(section: BuilderSection): Record<string, string> {
    return {
      '--section-bg': section.style.background,
      '--section-color': section.style.color,
      '--section-max-width': `${section.style.maxWidth}px`,
      '--section-columns': `repeat(${Math.max(1, section.style.columns)}, minmax(0, 1fr))`,
      '--section-gap': `${section.style.gap}px`,
      '--section-padding-top': `${section.style.padding.top}px`,
      '--section-padding-right': `${section.style.padding.right}px`,
      '--section-padding-bottom': `${section.style.padding.bottom}px`,
      '--section-padding-left': `${section.style.padding.left}px`,
    };
  }

  elementStyle(element: BuilderElement): Record<string, string> {
    return {
      '--element-color': element.style.color,
      '--element-bg': element.style.background,
      '--element-radius': `${element.style.radius}px`,
      '--element-width': `${element.style.width}%`,
      '--element-padding-top': `${element.style.padding.top}px`,
      '--element-padding-right': `${element.style.padding.right}px`,
      '--element-padding-bottom': `${element.style.padding.bottom}px`,
      '--element-padding-left': `${element.style.padding.left}px`,
      '--element-margin-top': `${element.style.marginTop}px`,
      '--element-margin-bottom': `${element.style.marginBottom}px`,
      '--element-font-size': `${element.style.typography.size}px`,
      '--element-font-weight': `${element.style.typography.weight}`,
      '--element-align': element.style.typography.align,
    };
  }

  productFor(element: ProductElement): ProjectCatalogProduct | null {
    return element.productId ? this.products().find((product) => product.id === element.productId) ?? null : null;
  }

  onCanvasTextInput(event: Event, sectionId: string, elementId: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.mutatePage((page) => {
      const section = page.sections.find((item) => item.id === sectionId);
      const element = section?.elements.find((item) => item.id === elementId);
      if (element?.type === 'text') element.content = value.trim() || 'Text';
    });
  }

  onCanvasButtonInput(event: Event, sectionId: string, elementId: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.mutatePage((page) => {
      const section = page.sections.find((item) => item.id === sectionId);
      const element = section?.elements.find((item) => item.id === elementId);
      if (element?.type === 'button') element.label = value.trim() || 'Button';
    });
  }

  @HostListener('document:keydown.control.z', ['$event'])
  @HostListener('document:keydown.meta.z', ['$event'])
  onUndoHotkey(event: Event): void { (event as KeyboardEvent).preventDefault(); this.undo(); }

  @HostListener('document:keydown.control.y', ['$event'])
  @HostListener('document:keydown.meta.shift.z', ['$event'])
  onRedoHotkey(event: Event): void { (event as KeyboardEvent).preventDefault(); this.redo(); }

  private persist(isAutosave: boolean): void {
    const storefront = this.storefront();
    const page = this.page();
    if (!storefront || !page || !this.projectId() || this.isSaving()) return;
    if (this.serialize(page) === this.savedSnapshot()) { this.hasAutosavePending.set(false); return; }

    this.isSaving.set(true);
    this.hasAutosavePending.set(false);
    this.storefrontService.updateStorefront(this.projectId(), {
      storeName: this.storeName(),
      themeKey: storefront.themeKey,
      activePageKey: storefront.activePageKey,
      draftHomepage: page as unknown as StorefrontHomepageDocument,
    }).pipe(
      finalize(() => this.isSaving.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (saved) => {
        this.storefront.set(saved);
        const page = this.normalizePage(saved.draftHomepage, saved, this.products());
        this.page.set(page);
        this.savedSnapshot.set(this.serialize(page));
        this.lastSavedAt.set(saved.updatedAt ?? new Date().toISOString());
        this.media.set(this.collectMedia(page));
        this.ensureSelection();
        if (!isAutosave) this.toastService.success('Page saved.');
      },
      error: (error) => this.toastService.error(this.readErrorMessage(error, 'Unable to save the page right now.')),
    });
  }

  private scheduleAutosave(): void {
    window.clearTimeout(this.autosaveTimeout);
    if (!this.hasUnsavedChanges()) { this.hasAutosavePending.set(false); return; }
    this.hasAutosavePending.set(true);
    this.autosaveTimeout = window.setTimeout(() => this.persist(true), 900);
  }

  private mutatePage(mutator: (page: BuilderPage) => void): void {
    const current = this.page();
    if (!current) return;
    const before = this.serialize(current);
    const draft = this.clone(current);
    mutator(draft);
    const after = this.serialize(draft);
    if (!before || before === after) return;
    this.undoStack.push(before);
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.redoStack = [];
    this.page.set(draft);
    this.media.set(this.collectMedia(draft));
    this.ensureSelection();
    this.scheduleAutosave();
  }

  private mutateSelectedSection(mutator: (section: BuilderSection) => void): void {
    const selected = this.selection();
    if (selected.kind === 'page') return;
    this.mutatePage((page) => {
      const section = page.sections.find((item) => item.id === selected.sectionId);
      if (section) mutator(section);
    });
  }

  private mutateSelectedElement(mutator: (element: BuilderElement) => void): void {
    const selected = this.selection();
    if (selected.kind !== 'element') return;
    this.mutatePage((page) => {
      const section = page.sections.find((item) => item.id === selected.sectionId);
      const element = section?.elements.find((item) => item.id === selected.elementId);
      if (element) mutator(element);
    });
  }

  private syncAfterRestore(): void {
    this.media.set(this.collectMedia(this.page()));
    this.ensureSelection();
    this.hasAutosavePending.set(this.hasUnsavedChanges());
  }

  private ensureSelection(): void {
    const page = this.page();
    const selected = this.selection();
    if (!page) return;
    if (selected.kind === 'page') return;
    const section = page.sections.find((item) => item.id === selected.sectionId);
    if (!section) {
      this.selection.set(page.sections[0] ? { kind: 'section', sectionId: page.sections[0].id } : { kind: 'page' });
      return;
    }
    if (selected.kind === 'element' && !section.elements.some((item) => item.id === selected.elementId)) {
      this.selection.set({ kind: 'section', sectionId: section.id });
    }
  }

  private normalizePage(homepage: StorefrontHomepageDocument | null | undefined, storefront: ProjectStorefront, products: ProjectCatalogProduct[]): BuilderPage {
    const sections = Array.isArray(homepage?.sections) ? homepage.sections as unknown[] : [];
    const first = sections[0] as Record<string, unknown> | undefined;
    if (first && Array.isArray(first['elements'])) {
      return {
        version: Number(homepage?.version ?? 2) || 2,
        pageKey: 'home',
        seo: {
          title: homepage?.seo?.title || storefront.storeName || this.project()?.name || 'Homepage',
          description: homepage?.seo?.description || this.project()?.metaDescription || '',
        },
        sections: sections.map((section) => this.normalizeSection(section)),
      };
    }
    return this.starterPage(products, storefront);
  }

  private normalizeSection(value: unknown): BuilderSection {
    const raw = value as Record<string, unknown>;
    return {
      id: this.readString(raw['id']) || this.id('section'),
      preset: this.normalizePreset(this.readString(raw['preset'])),
      name: this.readString(raw['name']) || 'Section',
      style: this.normalizeSectionStyle(raw['style']),
      elements: Array.isArray(raw['elements']) ? raw['elements'].map((element) => this.normalizeElement(element)) : [],
    };
  }

  private normalizeElement(value: unknown): BuilderElement {
    const raw = value as Record<string, unknown>;
    const type = this.normalizeElementType(this.readString(raw['type']));
    const base: BaseElement = {
      id: this.readString(raw['id']) || this.id('element'),
      type,
      name: this.readString(raw['name']) || this.elementOptions.find((item) => item.type === type)?.label || 'Element',
      style: this.normalizeBoxStyle(raw['style']),
    };
    switch (type) {
      case 'image': return { ...base, type, src: this.readString(raw['src']), alt: this.readString(raw['alt']) || 'Image', fit: this.readString(raw['fit']) === 'contain' ? 'contain' : 'cover', height: this.readNumber(raw['height'], 300) };
      case 'button': return { ...base, type, label: this.readString(raw['label']) || 'Button', href: this.readString(raw['href']) || '#', variant: this.readString(raw['variant']) === 'outline' ? 'outline' : 'solid' };
      case 'icon': return { ...base, type, icon: this.readString(raw['icon']) || '?', size: this.readNumber(raw['size'], 32) };
      case 'divider': return { ...base, type, thickness: this.readNumber(raw['thickness'], 1) };
      case 'container': return { ...base, type, title: this.readString(raw['title']) || 'Container', body: this.readString(raw['body']) || 'Use this block for grouped content.', direction: this.readString(raw['direction']) === 'row' ? 'row' : 'column' };
      case 'product': return { ...base, type, productId: this.readNullableNumber(raw['productId']), showDescription: this.readBoolean(raw['showDescription'], true), showPrice: this.readBoolean(raw['showPrice'], true), ctaLabel: this.readString(raw['ctaLabel']) || 'View product' };
      case 'gallery': return { ...base, type, imageUrls: Array.isArray(raw['imageUrls']) ? raw['imageUrls'].map((item) => this.readString(item)).filter(Boolean) : [], columns: this.readNumber(raw['columns'], 3), height: this.readNumber(raw['height'], 220) };
      case 'text':
      default: return { ...base, type: 'text', content: this.readString(raw['content']) || 'Text block', tag: this.normalizeTag(this.readString(raw['tag'])) };
    }
  }

  private starterPage(products: ProjectCatalogProduct[], storefront?: ProjectStorefront): BuilderPage {
    const brand = storefront?.storeName || this.project()?.storeTitle || this.project()?.name || 'Forma Atelier';
    return {
      version: 2,
      pageKey: 'home',
      seo: { title: brand, description: this.project()?.metaDescription || 'Editable storefront built section by section.' },
      sections: [
        { id: this.id('section'), preset: 'header', name: 'Header', style: this.sectionStyleDefaults('#fff9f1', '#1f1726', 1), elements: [this.makeText(brand, 'h2'), this.makeContainer('Explore the site', 'Shop, stories, and studio contact links.', 'row')] },
        { id: this.id('section'), preset: 'hero', name: 'Hero', style: this.sectionStyleDefaults('#f2e5d1', '#1f1726', 2), elements: [this.makeText('Crafted goods for slower routines.', 'h1'), this.makeText('Use the canvas to edit this copy, replace the image, and tune spacing from the inspector.', 'p'), this.makeButton('Shop collection', '#products', 'solid'), this.makeImage('https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80', 'Editorial still life')] },
        { id: this.id('section'), preset: 'products', name: 'Products', style: this.sectionStyleDefaults('#fffdf8', '#1f1726', 3), elements: [this.makeText('Best sellers', 'h2'), ...products.slice(0, 3).map((product) => this.makeProduct(product.id))] },
        { id: this.id('section'), preset: 'footer', name: 'Footer', style: this.sectionStyleDefaults('#1f1726', '#f6eee1', 2), elements: [this.makeText(`${brand}\nhello@formaatelier.com`, 'p'), this.makeContainer('Visit the studio', '14 Rue des Artisans, Paris\nMon-Sat 10:00-19:00', 'column')] },
      ],
    };
  }

  private createSection(preset: SectionPreset): BuilderSection {
    switch (preset) {
      case 'header': return { id: this.id('section'), preset, name: 'Header', style: this.sectionStyleDefaults('#fff9f1', '#1f1726', 1), elements: [this.makeText(this.storeName(), 'h2'), this.makeContainer('Navigation', 'Home, Shop, Contact', 'row')] };
      case 'features': return { id: this.id('section'), preset, name: 'Features', style: this.sectionStyleDefaults('#fffdf8', '#1f1726', 3), elements: [this.makeText('Why it stands out', 'h2'), this.makeIcon('01'), this.makeText('Premium materials and a thoughtful finish.', 'p'), this.makeIcon('02'), this.makeText('Flexible layouts for seasonal campaigns.', 'p')] };
      case 'cta': return { id: this.id('section'), preset, name: 'CTA', style: this.sectionStyleDefaults('#d9674e', '#fff8f2', 1), elements: [this.makeText('Ready to launch the next collection?', 'h2'), this.makeButton('Start a campaign', '#', 'solid')] };
      case 'products': return { id: this.id('section'), preset, name: 'Products', style: this.sectionStyleDefaults('#fffdf8', '#1f1726', 3), elements: [this.makeText('Selected products', 'h2'), ...this.products().slice(0, 3).map((product) => this.makeProduct(product.id))] };
      case 'testimonials': return { id: this.id('section'), preset, name: 'Testimonials', style: this.sectionStyleDefaults('#f7eee3', '#1f1726', 3), elements: [this.makeText('Loved by design-led brands.', 'h2'), this.makeText('"We can update the homepage in minutes."', 'p'), this.makeText('"Mobile preview is finally accurate."', 'p')] };
      case 'faq': return { id: this.id('section'), preset, name: 'FAQ', style: this.sectionStyleDefaults('#fffdf8', '#1f1726', 1), elements: [this.makeText('Frequently asked questions', 'h2'), this.makeDivider(), this.makeText('How fast can we update the page?\nImmediately inside the editor.', 'p')] };
      case 'footer': return { id: this.id('section'), preset, name: 'Footer', style: this.sectionStyleDefaults('#1f1726', '#f6eee1', 2), elements: [this.makeText(`${this.storeName()}\nBuilt for quick edits.`, 'p'), this.makeContainer('Contact', 'Email, showroom, and support links.', 'column')] };
      case 'hero':
      default: return { id: this.id('section'), preset: 'hero', name: 'Hero', style: this.sectionStyleDefaults('#f2e5d1', '#1f1726', 2), elements: [this.makeText('Write a stronger headline here.', 'h1'), this.makeButton('Primary action', '#', 'solid'), this.makeImage('', 'Hero image')] };
    }
  }

  private createElement(type: ElementType): BuilderElement {
    switch (type) {
      case 'image': return this.makeImage('', 'Image');
      case 'button': return this.makeButton('Button label', '#', 'solid');
      case 'icon': return this.makeIcon('?');
      case 'divider': return this.makeDivider();
      case 'container': return this.makeContainer('Container title', 'Add grouped content here.', 'column');
      case 'product': return this.makeProduct(this.products()[0]?.id ?? null);
      case 'gallery': return this.makeGallery(this.media().slice(0, 3).map((item) => item.url));
      case 'text':
      default: return this.makeText('Add your text here.', 'p');
    }
  }

  private makeText(content: string, tag: TextElement['tag']): TextElement { return { id: this.id('element'), type: 'text', name: tag === 'h1' ? 'Headline' : 'Text', content, tag, style: this.boxStyleDefaults() }; }
  private makeImage(src: string, alt: string): ImageElement { return { id: this.id('element'), type: 'image', name: 'Image', src, alt, fit: 'cover', height: 320, style: { ...this.boxStyleDefaults(), background: '#eadbc6', radius: 22 } }; }
  private makeButton(label: string, href: string, variant: 'solid' | 'outline'): ButtonElement { return { id: this.id('element'), type: 'button', name: 'Button', label, href, variant, style: { ...this.boxStyleDefaults(), background: variant === 'solid' ? '#1f1726' : 'transparent', color: variant === 'solid' ? '#fff9f1' : '#1f1726', radius: 999, padding: { top: 14, right: 22, bottom: 14, left: 22 }, typography: { size: 15, weight: 700, align: 'center' } } }; }
  private makeIcon(icon: string): IconElement { return { id: this.id('element'), type: 'icon', name: 'Icon', icon, size: 34, style: { ...this.boxStyleDefaults(), background: '#f3e7d5', radius: 999, padding: { top: 10, right: 10, bottom: 10, left: 10 } } }; }
  private makeDivider(): DividerElement { return { id: this.id('element'), type: 'divider', name: 'Divider', thickness: 1, style: { ...this.boxStyleDefaults(), background: '#d9ccb9' } }; }
  private makeContainer(title: string, body: string, direction: 'row' | 'column'): ContainerElement { return { id: this.id('element'), type: 'container', name: 'Container', title, body, direction, style: { ...this.boxStyleDefaults(), background: '#fff7ed', radius: 20, padding: { top: 18, right: 18, bottom: 18, left: 18 } } }; }
  private makeProduct(productId: number | null): ProductElement { return { id: this.id('element'), type: 'product', name: 'Product', productId, showDescription: true, showPrice: true, ctaLabel: 'View product', style: { ...this.boxStyleDefaults(), background: '#fff9f1', radius: 22, padding: { top: 18, right: 18, bottom: 18, left: 18 } } }; }
  private makeGallery(imageUrls: string[]): GalleryElement { return { id: this.id('element'), type: 'gallery', name: 'Gallery', imageUrls, columns: 3, height: 220, style: this.boxStyleDefaults() }; }

  private collectMedia(page: BuilderPage | null): MediaAsset[] {
    if (!page) return [];
    const map = new Map<string, MediaAsset>();
    for (const section of page.sections) {
      for (const element of section.elements) {
        if (element.type === 'image' && element.src) map.set(element.src, { id: this.id('media'), url: element.src, label: element.alt || 'Image' });
        if (element.type === 'gallery') element.imageUrls.forEach((url) => map.set(url, { id: this.id('media'), url, label: 'Gallery image' }));
      }
    }
    return Array.from(map.values());
  }

  private sectionStyleDefaults(background: string, color: string, columns: number): SectionStyle { return { background, color, maxWidth: 1180, columns, gap: 20, padding: { top: 36, right: 36, bottom: 36, left: 36 } }; }
  private boxStyleDefaults(): BoxStyle { return { color: '#1f1726', background: 'transparent', radius: 0, width: 100, padding: { top: 0, right: 0, bottom: 0, left: 0 }, marginTop: 0, marginBottom: 0, typography: { size: 16, weight: 500, align: 'left' } }; }
  private normalizeSectionStyle(value: unknown): SectionStyle { const raw = value as Record<string, unknown>; return { background: this.readString(raw?.['background']) || '#fffdf8', color: this.readString(raw?.['color']) || '#1f1726', maxWidth: this.readNumber(raw?.['maxWidth'], 1180), columns: this.readNumber(raw?.['columns'], 1), gap: this.readNumber(raw?.['gap'], 20), padding: this.normalizeSpacing(raw?.['padding'], 36) }; }
  private normalizeBoxStyle(value: unknown): BoxStyle { const raw = value as Record<string, unknown>; return { color: this.readString(raw?.['color']) || '#1f1726', background: this.readString(raw?.['background']) || 'transparent', radius: this.readNumber(raw?.['radius'], 0), width: this.readNumber(raw?.['width'], 100), padding: this.normalizeSpacing(raw?.['padding'], 0), marginTop: this.readNumber(raw?.['marginTop'], 0), marginBottom: this.readNumber(raw?.['marginBottom'], 0), typography: this.normalizeTypography(raw?.['typography']) }; }
  private normalizeSpacing(value: unknown, fallback: number): Spacing { const raw = value as Record<string, unknown>; return { top: this.readNumber(raw?.['top'], fallback), right: this.readNumber(raw?.['right'], fallback), bottom: this.readNumber(raw?.['bottom'], fallback), left: this.readNumber(raw?.['left'], fallback) }; }
  private normalizeTypography(value: unknown): Typography { const raw = value as Record<string, unknown>; const weight = this.readNumber(raw?.['weight'], 500) as Typography['weight']; return { size: this.readNumber(raw?.['size'], 16), weight: [400, 500, 600, 700, 800].includes(weight) ? weight : 500, align: this.normalizeAlign(this.readString(raw?.['align'])) }; }
  private normalizePreset(value: string): SectionPreset { return this.sectionOptions.some((item) => item.type === value) ? value as SectionPreset : 'hero'; }
  private normalizeElementType(value: string): ElementType { return this.elementOptions.some((item) => item.type === value) ? value as ElementType : 'text'; }
  private normalizeTag(value: string): TextElement['tag'] { return value === 'h1' || value === 'h2' || value === 'h3' ? value : 'p'; }
  private normalizeAlign(value: string): Align { return value === 'center' || value === 'right' ? value : 'left'; }
  private rekeyElement<T extends BuilderElement>(element: T): T { element.id = this.id('element'); return element; }
  private id(prefix: string): string { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; }
  private serialize(value: BuilderPage | null): string { return value ? JSON.stringify(value) : ''; }
  private clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
  private readString(value: unknown): string { return typeof value === 'string' ? value : ''; }
  private readNumber(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
  private readNullableNumber(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
  private readBoolean(value: unknown, fallback: boolean): boolean { return typeof value === 'boolean' ? value : fallback; }
  private readErrorMessage(error: unknown, fallback: string): string { if (typeof error === 'object' && error && 'error' in error) { const payload = (error as { error?: unknown }).error; if (typeof payload === 'object' && payload && 'message' in payload) { const message = (payload as { message?: unknown }).message; if (typeof message === 'string' && message.trim()) return message; } } return fallback; }
}

