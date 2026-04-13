import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { ProjectCatalogProduct } from '../../../../../../core/models/project-catalog.model';
import {
  ProjectStorefront,
  StorefrontHomepageDocument,
  StorefrontEditorManagedPage,
  StorefrontEditorSession,
  StorefrontEditorSnapshot,
  StorefrontEditorViewport,
  StorefrontHomepageSection,
} from '../../../../../../core/models/project-storefront.model';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectCatalogService } from '../../../../../../core/services/project-catalog.service';
import { ProjectStorefrontService } from '../../../../../../core/services/project-storefront.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { ProjectWorkspaceContextService } from '../../../../../../core/services/project-workspace-context.service';
import { PublicStorefrontService } from '../../../../../../core/services/public-storefront.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { UploadService } from '../../../../../../core/services/upload.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { AppIcon } from '../../../../../../shared/app/icons/app-icon';
import { StorefrontSectionType } from '../../../../../../core/models/project-storefront.model';
import {
  STOREFRONT_EDITOR_PAGE_DESIGN_CATEGORIES,
  STOREFRONT_EDITOR_PAGE_DESIGN_TEMPLATES,
  STOREFRONT_EDITOR_SECTION_LIBRARY_CATEGORIES,
  STOREFRONT_EDITOR_SECTION_LIBRARY_TEMPLATES,
} from './config/storefront-editor-feature-domains';
import {
  STOREFRONT_EDITOR_ADD_ELEMENTS_CATEGORIES,
  STOREFRONT_EDITOR_ADD_ELEMENTS_FEATURED_SHORTCUTS,
  STOREFRONT_EDITOR_ADD_ELEMENTS_LIBRARY_ITEMS,
  STOREFRONT_EDITOR_ADD_ELEMENTS_SUBCATEGORIES,
  StorefrontEditorAddElementsCategory,
  StorefrontEditorAddElementsLibraryItem,
  StorefrontEditorAddElementsSubcategoryOption,
  filterStorefrontEditorAddElementsLibraryItems,
} from './components/storefront-editor-component-library';
import {
  StorefrontEditorComponentNode,
  StorefrontEditorComponentType,
  StorefrontEditorButtonNode,
  StorefrontEditorContainerNode,
  StorefrontEditorImageNode,
  StorefrontEditorParagraphNode,
  StorefrontEditorProductFeedNode,
  StorefrontEditorTextNode,
  StorefrontEditorTextStylePreset,
  buildStorefrontEditorImageSourceMetadata,
  buildStorefrontEditorProductFeedProps,
  buildStorefrontEditorTextProps,
  createStorefrontEditorComponentNode,
  normalizeStorefrontEditorImageCropRect,
  resolveStorefrontEditorImageAspectRatio,
  resolveStorefrontEditorImageDisplayMode,
  resolveStorefrontEditorImageViewportBounds,
} from './components/storefront-editor-component.model';
import {
  ProjectStorefrontMediaManager,
  StorefrontMediaManagerAsset,
} from './components/media-manager/project-storefront-media-manager';
import { StorefrontEditorComponentHostComponent } from './components/storefront-editor-component-host.component';
import {
  buildStorefrontMediaManagerAssets,
  describeStorefrontMediaAsset,
} from './domains/storefront-editor-media.domain';
import {
  buildDefaultManagedPageDocument as buildDefaultManagedPageDocumentForEditor,
  buildDefaultManagedPages as buildDefaultManagedPagesForEditor,
  captureManagedPagesWithDraft as captureManagedPagesWithDraftForEditor,
  cloneStorefrontHomepageDocument,
  createUniqueManagedPageName,
  normalizeManagedPageDocument as normalizeManagedPageDocumentForEditor,
  normalizeManagedPages as normalizeManagedPagesForEditor,
  resolveManagedPageDocument as resolveManagedPageDocumentForEditor,
} from './domains/storefront-editor-pages.domain';
import {
  buildDefaultStorefrontHomepageDocument,
  buildStorefrontSection,
  createStorefrontSectionId,
  normalizeStorefrontData,
  normalizeStorefrontSection,
  normalizeStorefrontSectionType,
} from './domains/storefront-editor-storefront.domain';
import {
  clampStorefrontEditorZoom,
  formatStorefrontEditorRelativeTime,
} from './utils/storefront-editor-shared.utils';

type SectionInsertMode = 'append' | 'after-selected';
type EditorSidebarMode = 'structure' | 'page' | 'theme' | 'assets';
type PagesPanelLayoutMode = 'grid' | 'rows';
type ComponentSelectionBox = { x: number; y: number; width: number; height: number };
type StorefrontEditorLayerItem = {
  componentId: string;
  name: string;
  typeLabel: string;
  width: number;
  height: number;
  childCount: number;
  isVisible: boolean;
  isLocked: boolean;
};
type StorefrontEditorLayerStats = {
  total: number;
  hidden: number;
  locked: number;
};
type EditorSnapGuide = {
  orientation: 'vertical' | 'horizontal';
  offset: number;
  kind: 'grid' | 'alignment';
};
type RotationHandleCorner = 'nw' | 'ne' | 'se' | 'sw';
type ButtonToolbarMenu =
  | 'designs'
  | 'edit-text'
  | 'link'
  | 'customize-icon'
  | 'display-elements'
  | 'settings'
  | 'colors'
  | 'text'
  | 'borders'
  | 'corners'
  | 'shadow'
  | 'spacing'
  | null;
type ImageToolbarMenu = 'link' | 'settings' | 'opacity' | 'borders' | 'corners' | 'shadow' | null;
type ContainerToolbarMenu = 'designs' | 'background' | 'borders' | 'corners' | 'shadow' | 'opacity' | null;
type SectionToolbarMenu = 'layout' | 'background' | 'borders' | 'corners' | 'opacity' | null;
type ProductFeedToolbarMenu = 'designs' | 'settings' | 'color' | null;
type ProductFeedSettingsSection =
  | 'category'
  | 'settings'
  | 'layout'
  | 'design'
  | 'add-to-cart'
  | 'filters'
  | 'sorting';
type StorefrontEditorSectionLayoutPresetId =
  | 'none'
  | 'single'
  | 'two-columns'
  | 'two-rows'
  | 'three-columns'
  | 'three-rows'
  | 'grid-2x2'
  | 'sidebar-left'
  | 'sidebar-right';
type StorefrontEditorSectionLayoutPreset = {
  id: StorefrontEditorSectionLayoutPresetId;
  label: string;
  columns: number;
  rows: number;
  previewColumns: number;
  previewRows: number;
  cells: ReadonlyArray<{ column: number; row: number; columnSpan?: number; rowSpan?: number }>;
};
type StorefrontEditorSectionLayoutAssignment = {
  componentId: string;
  column: number;
  row: number;
};
type StorefrontEditorSectionLayoutTrackAxis = 'column' | 'row';
type StorefrontEditorSectionLayoutCellBounds = {
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
type StorefrontEditorButtonDesignPreset = {
  id: string;
  label: string;
  text: string;
  iconName?: StorefrontEditorButtonNode['props']['iconName'];
  patch: Partial<StorefrontEditorButtonNode['props']>;
};
type StorefrontEditorContainerDesignPreset = {
  id: string;
  label: string;
  previewLayout: StorefrontEditorContainerNode['props']['layout'];
  previewTone: 'airy' | 'outlined' | 'dark' | 'soft';
  patch: Partial<StorefrontEditorContainerNode['props']>;
};
type StorefrontEditorProductFeedDesignPreset = {
  id: StorefrontEditorProductFeedNode['props']['designPreset'];
  label: string;
  description: string;
  previewImageSrc: string;
  patch?: Partial<StorefrontEditorProductFeedNode['props']>;
};
type StorefrontEditorFontOption = {
  family: string;
  category: 'Sans' | 'Serif' | 'Display' | 'Mono' | 'Handwritten';
  description: string;
  preview: string;
};
type StorefrontEditorBrandKitPreset = {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  palette: string[];
  buttonPresetId: string;
  boxFill: string;
  boxBorder: string;
  lines: string[];
};
type StorefrontPageDesignTemplate = {
  id: string;
  name: string;
  description: string;
  category: StorefrontPageDesignCategory;
  accent: 'linen' | 'cobalt' | 'ink' | 'sand';
};

const STOREFRONT_EDITOR_TEXT_FONT_OPTIONS: ReadonlyArray<StorefrontEditorFontOption> = [
  { family: 'Inter', category: 'Sans', description: 'Neutral UI workhorse', preview: 'Shape clarity and rhythm' },
  { family: 'Poppins', category: 'Sans', description: 'Rounded geometric sans', preview: 'Bold headlines with warmth' },
  { family: 'Manrope', category: 'Sans', description: 'Modern high-legibility sans', preview: 'Confident product copy' },
  { family: 'DM Sans', category: 'Sans', description: 'Friendly editorial sans', preview: 'Readable, polished body text' },
  { family: 'Plus Jakarta Sans', category: 'Sans', description: 'Contemporary brand sans', preview: 'Sharp interfaces and hero lines' },
  { family: 'Space Grotesk', category: 'Sans', description: 'Expressive geometric sans', preview: 'Personality without chaos' },
  { family: 'Sora', category: 'Sans', description: 'Crisp digital-first sans', preview: 'Future-facing callouts' },
  { family: 'Outfit', category: 'Sans', description: 'Clean wide sans', preview: 'Balanced headlines and CTAs' },
  { family: 'Urbanist', category: 'Sans', description: 'Soft geometric sans', preview: 'Smooth contemporary layouts' },
  { family: 'Work Sans', category: 'Sans', description: 'Versatile grotesk family', preview: 'Clear messaging at any size' },
  { family: 'Libre Franklin', category: 'Sans', description: 'Newsroom-inspired sans', preview: 'Editorial tone with precision' },
  { family: 'IBM Plex Sans', category: 'Sans', description: 'Technical but approachable', preview: 'Systematic brand storytelling' },
  { family: 'Figtree', category: 'Sans', description: 'Modern rounded interface sans', preview: 'Soft structure with clarity' },
  { family: 'Nunito Sans', category: 'Sans', description: 'Friendly balanced sans', preview: 'Warm UI and readable body copy' },
  { family: 'Mulish', category: 'Sans', description: 'Clean minimal sans', preview: 'Quiet typography with range' },
  { family: 'Archivo', category: 'Sans', description: 'Sharp grotesk with presence', preview: 'Strong navigation and labels' },
  { family: 'Montserrat', category: 'Sans', description: 'Popular geometric sans', preview: 'Bold brand-led headings' },
  { family: 'Raleway', category: 'Sans', description: 'Elegant modern sans', preview: 'Light, spacious headlines' },
  { family: 'Karla', category: 'Sans', description: 'Humanist grotesk hybrid', preview: 'Practical copy with personality' },
  { family: 'Rubik', category: 'Sans', description: 'Rounded geometric sans', preview: 'Contemporary product storytelling' },
  { family: 'Hedvig Letters Serif', category: 'Serif', description: 'Friendly editorial serif', preview: 'Warm brand storytelling' },
  { family: 'Merriweather', category: 'Serif', description: 'Readable classic serif', preview: 'Long-form text with texture' },
  { family: 'Lora', category: 'Serif', description: 'Balanced contemporary serif', preview: 'Elegant paragraphs and intros' },
  { family: 'Cormorant Garamond', category: 'Serif', description: 'High-contrast editorial serif', preview: 'Luxurious section titles' },
  { family: 'Playfair Display', category: 'Serif', description: 'Fashion-forward serif', preview: 'Dramatic, polished headlines' },
  { family: 'DM Serif Display', category: 'Serif', description: 'Compact display serif', preview: 'Classic contrast with punch' },
  { family: 'Libre Baskerville', category: 'Serif', description: 'Bookish traditional serif', preview: 'Refined reading and heritage tone' },
  { family: 'Crimson Text', category: 'Serif', description: 'Literary old-style serif', preview: 'Text-first elegance and warmth' },
  { family: 'Cormorant Infant', category: 'Serif', description: 'Decorative editorial serif', preview: 'Stylized titles with softness' },
  { family: 'Bitter', category: 'Serif', description: 'Sturdy slab-influenced serif', preview: 'Authority in headings and body' },
  { family: 'Spectral', category: 'Serif', description: 'Versatile contemporary serif', preview: 'Smart editorial hierarchy' },
  { family: 'Bricolage Grotesque', category: 'Display', description: 'Playful variable grotesk', preview: 'Creative direction with edge' },
  { family: 'Syne', category: 'Display', description: 'Artful experimental display', preview: 'Unexpected but still usable' },
  { family: 'Fraunces', category: 'Display', description: 'Expressive soft-serif display', preview: 'Strong hero typography' },
  { family: 'Archivo Black', category: 'Display', description: 'Heavy compressed impact', preview: 'Posters, banners, statements' },
  { family: 'Bebas Neue', category: 'Display', description: 'Tall condensed display', preview: 'Launch headlines and labels' },
  { family: 'Oswald', category: 'Display', description: 'Condensed utility display', preview: 'Structured, emphatic headings' },
  { family: 'Abril Fatface', category: 'Display', description: 'High-drama Didone', preview: 'Editorial glamour in one line' },
  { family: 'Anton', category: 'Display', description: 'Massive condensed display', preview: 'Impactful hero statements' },
  { family: 'League Spartan', category: 'Display', description: 'Bold geometric display', preview: 'Direct modern campaign type' },
  { family: 'Alfa Slab One', category: 'Display', description: 'Chunky slab display', preview: 'Vintage punch and energy' },
  { family: 'Righteous', category: 'Display', description: 'Rounded retro display', preview: 'Distinctive headlines with flair' },
  { family: 'Unbounded', category: 'Display', description: 'Square contemporary display', preview: 'Experimental but controlled emphasis' },
  { family: 'Fira Mono', category: 'Mono', description: 'Readable monospaced text', preview: 'Code-like notes and labels' },
  { family: 'IBM Plex Mono', category: 'Mono', description: 'Technical mono with warmth', preview: 'Utility captions and specs' },
  { family: 'JetBrains Mono', category: 'Mono', description: 'Sharp modern mono', preview: 'Precise callouts and metadata' },
  { family: 'Space Mono', category: 'Mono', description: 'Retro-futurist mono', preview: 'Distinct utility styling' },
  { family: 'Source Code Pro', category: 'Mono', description: 'Classic coding mono', preview: 'Structured utility text' },
  { family: 'Inconsolata', category: 'Mono', description: 'Compact readable mono', preview: 'Technical labels with charm' },
  { family: 'Caveat', category: 'Handwritten', description: 'Loose handwritten accent', preview: 'Personal notes and signatures' },
  { family: 'Patrick Hand', category: 'Handwritten', description: 'Clean marker handwriting', preview: 'Friendly annotations' },
  { family: 'Shadows Into Light', category: 'Handwritten', description: 'Airy handwritten accent', preview: 'Casual highlights and notes' },
  { family: 'Permanent Marker', category: 'Handwritten', description: 'Bold marker script', preview: 'Expressive callouts and badges' },
];

const STOREFRONT_EDITOR_TEXT_FONT_STYLESHEET_HREF = [
  'https://fonts.googleapis.com/css2?display=swap',
  ...STOREFRONT_EDITOR_TEXT_FONT_OPTIONS.map(
    (font) => `family=${font.family.replace(/ /g, '+')}:wght@400;500;600;700`
  ),
].join('&');
const STOREFRONT_EDITOR_BRAND_KIT_PRESETS: ReadonlyArray<StorefrontEditorBrandKitPreset> = [
  {
    id: 'editorial-moss',
    name: 'Editorial Moss',
    description: 'Refined serif headings with grounded green neutrals.',
    headingFont: 'Hedvig Letters Serif',
    bodyFont: 'Fira Mono',
    palette: ['#0b2239', '#2f6f10', '#b7d58b', '#d8e0e8', '#c1ccd8'],
    buttonPresetId: 'valuation',
    boxFill: '#dbeafe',
    boxBorder: '#082237',
    lines: ['#b8d0ea', '#071a2e', '#b2d083'],
  },
  {
    id: 'modern-cobalt',
    name: 'Modern Cobalt',
    description: 'Bright interface tones and sharp sans typography.',
    headingFont: 'Sora',
    bodyFont: 'Inter',
    palette: ['#111827', '#355cff', '#e5ecff', '#dbeafe', '#f8fafc'],
    buttonPresetId: 'book-now',
    boxFill: '#e5ecff',
    boxBorder: '#355cff',
    lines: ['#355cff', '#111827', '#b8d0ea'],
  },
  {
    id: 'soft-linen',
    name: 'Soft Linen',
    description: 'Warm editorial neutrals with softer contrast.',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'DM Sans',
    palette: ['#1f2937', '#ffe066', '#ffefe5', '#f4f1ef', '#d8e0e8'],
    buttonPresetId: 'start-now',
    boxFill: '#ffefe5',
    boxBorder: '#1f2937',
    lines: ['#d8e0e8', '#1f2937', '#ffe066'],
  },
  {
    id: 'mono-utility',
    name: 'Mono Utility',
    description: 'Technical mono body with bold utility styling.',
    headingFont: 'League Spartan',
    bodyFont: 'IBM Plex Mono',
    palette: ['#020817', '#1f4d30', '#d9fb7c', '#e8f1fb', '#ffffff'],
    buttonPresetId: 'best-sellers',
    boxFill: '#e8f1fb',
    boxBorder: '#1f4d30',
    lines: ['#1f4d30', '#020817', '#d9fb7c'],
  },
];
type MediaManagerPurpose = 'general' | 'button-icon' | 'image-component';
type StorefrontPageDesignCategory = 'Business' | 'Store' | 'Info' | 'Policy';
type AddElementsBrowserGroup = {
  id: string;
  title: string;
  description: string;
  items: StorefrontEditorAddElementsLibraryItem[];
};
type SectionLibraryCategory =
  | 'Essentials'
  | 'Promotions'
  | 'Catalog'
  | 'Contact';
type SectionLibraryTemplate = {
  id: string;
  title: string;
  description: string;
  category: SectionLibraryCategory;
  type: StorefrontSectionType;
  layout: 'wide' | 'standard' | 'tall';
  accent: 'cobalt' | 'linen' | 'ink' | 'sand' | 'sky' | 'charcoal';
  props?: Record<string, unknown>;
};

@Component({
  selector: 'app-project-storefront-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIcon, ProjectStorefrontMediaManager, StorefrontEditorComponentHostComponent],
  templateUrl: './project-storefront-editor.html',
  styleUrl: './project-storefront-editor.css',
})
export class ProjectStorefrontEditor {
  private static readonly HISTORY_LIMIT = 20;
  private static readonly AUTOSAVE_DELAY_MS = 900;
  private static readonly ADD_ELEMENTS_PANEL_CLOSE_MS = 220;
  private static readonly ADD_ELEMENTS_LIBRARY_MODAL_CLOSE_MS = 180;
  private static readonly PAGES_MANAGER_CLOSE_MS = 180;
  private static readonly SECTION_LIBRARY_CLOSE_MS = 200;
  private static readonly SNAP_SPACING_STEPS = [4, 8, 16] as const;
  private static readonly SNAP_ALIGNMENT_THRESHOLD = 6;
  private static readonly SECTION_COMPONENTS_PROP_KEY = 'editorComponents';
  private static readonly SECTION_HEIGHT_PROP_KEY = 'editorHeight';
  private static readonly SECTION_TABLET_HEIGHT_PROP_KEY = 'editorTabletHeight';
  private static readonly SECTION_MOBILE_HEIGHT_PROP_KEY = 'editorMobileHeight';
  private static readonly SECTION_LABEL_PROP_KEY = 'editorLabel';
  private static readonly SECTION_BLANK_PROP_KEY = 'editorBlankSection';
  private static readonly SECTION_LAYOUT_PROP_KEY = 'editorLayoutPreset';
  private static readonly SECTION_LAYOUT_COLUMNS_PROP_KEY = 'editorLayoutColumns';
  private static readonly SECTION_LAYOUT_ROWS_PROP_KEY = 'editorLayoutRows';
  private static readonly SECTION_LAYOUT_COLUMN_SIZES_PROP_KEY = 'editorLayoutColumnSizes';
  private static readonly SECTION_LAYOUT_ROW_SIZES_PROP_KEY = 'editorLayoutRowSizes';
  private static readonly SECTION_LAYOUT_ASSIGNMENTS_PROP_KEY = 'editorLayoutAssignments';
  private static readonly SECTION_BACKGROUND_PROP_KEY = 'editorBackgroundColor';
  private static readonly SECTION_BORDER_WIDTH_PROP_KEY = 'editorBorderWidth';
  private static readonly SECTION_BORDER_STYLE_PROP_KEY = 'editorBorderStyle';
  private static readonly SECTION_BORDER_COLOR_PROP_KEY = 'editorBorderColor';
  private static readonly SECTION_RADIUS_PROP_KEY = 'editorRadius';
  private static readonly SECTION_SHADOW_PROP_KEY = 'editorShadow';
  private static readonly SECTION_OPACITY_PROP_KEY = 'editorOpacity';
  private static readonly SECTION_LAYOUT_PADDING_PX = 10;
  private static readonly SECTION_LAYOUT_GAP_PX = 10;
  private static readonly ROTATION_SNAP_ANGLES = [0, 90, 180, 270, 360] as const;
  private static readonly ROTATION_SNAP_THRESHOLD_DEGREES = 5;
  private static readonly SAVED_PARAGRAPH_COLORS_STORAGE_KEY = 'forma_saved_paragraph_colors';
  private static readonly SAVED_BUTTON_COLORS_STORAGE_KEY = 'forma_saved_button_colors';
  private static readonly SAVED_SECTION_BORDER_COLORS_STORAGE_KEY = 'forma_saved_section_border_colors';
  private static readonly ROTATION_CURSOR_HOTSPOT = 10;
  private static readonly ROTATION_CURSOR_SIZE = 20;
  private static readonly ROTATION_HANDLE_CURSOR_IMAGES: Record<RotationHandleCorner, string> = {
    nw: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKfSURBVFhH7ZU7aFRREIbP/c9/5p69WYiJyGIUtQlIrCxEfDXWSsTeIoKVYKkokeADFdTCB4hioZWWotgpdlaiCJJKCwNGU1gbtbgym73LeIwx2exa5YNb3DMz/z/nPuY4t0KXKechzekZqbElze0JlVmkXBHKmyKEzf+1iXYDkDvesyQ5U+T5zp43YQ1aJkHA26QvCXzLEQ4k8e5gRecjUo4CmPVAWaMcsbFUa0lYoYoh52JObic5BuAcgOtwuOjhp1yWldpELnKyyk81F83vtmVJx5EAXAPwCUD555WVWTZ3RZEvVV2quyis8YZ6fVUAb6iB9yjh8JMOz+Bwnll2GMC+vhhHCbxXc5LT+oQ6bsCai/e7CXzw3usuZ6KXE3mer7M5CoF7mkNysghh2MZS/QWxhQFhP4AfKiyU+41abY2NKyKyEcArfQUEX66OsWHjqf6C2MLc+x1Nc/gyhnDcxixCPp1rkE8ajUZhY6n+P6kK+1zfgAemVDgXOWVFFZsbEPTdT4w7l6U5S8IWE7ir5lHkgV3/W36KzVs0VXGN3KL/MYCvRVEMLiTadjSkOYvCCgTwZnOQeBm362lNV6lM1juXA/gM4PtgjGt7at7emoHkNt09yedpTEk1OiYVrhByTH87gmfSWEWq1RGVmFDOCuRqdQ/nJpoDJcsO6X2/yCahPA4hjPakAQCv9XcLDLda4peRZTqEdg25oQhgsvVBnu5JA8G5YZ3vums9z51zF7SBQmQvnHuUISsD8HCrc+xJA0pr5M42j1PnpvU00yk4N9vxYo9z3uanWh1jRWMIB+l9+yzXS8i39Xq93+alGsvGiscQjun3oI9dyI8DyZGb1nYNayKUS0K+q5Ejdj2t6TrWLCXN7RmpsZLmrLBcfgG/U6awxLbKxgAAAABJRU5ErkJggg==',
    ne: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKhSURBVFhH7ZZBiE1RGMe/8z//893zXm+mKfEQUVhYSGoKsVHKQkzKWshKspwyKcUoCoWoyU5TrOzsJjU7KykLNkxGocmaKF2dN3Omb05DY+Y9K796de/5vvP//9+5p3uuyH/+QL0IZU/PKI0tZW/XsWZBZCuBSYVe/icBrHnl/T4An733tUJv9TyANY8hHAfwDUBdMdy3tUw5f0VY4RjCeXpfA/geVc/Z2mKUWssiiyl5LS25c66G4KOIXBeRmxC5RPIkycENItXCCLOUmn9FFlFy2sF1AnRC5B9Qe/jaA+n6QwDvRnLnwggrCJEFGuQOJaeSOYGppupBde4AnTtB8ArJibRCOQyBsaY0V604hBUYqKqNSr6EQ+1FnhwTga23VDdVXi8C+JLCEHin4vfbnlJ/SViBVqs1QPJZehwAXoUQttl6Isa4NgYdTyEA/AjAEVsv9ZeEFdglwgA+Ssut0Elbs1SqI6knhai832trpf6SsAKJyvuREMJQvl+sJ4YwPPc43m/u6+vP46X2klkov5Df9SnDeHp/BPCeHbf9f40V+p1YrqV9A2AGkJ9BZH7PlP1dZz5dOry8H4ZHHYA7dryc03WyUUNkDUTSGTKzXiT2PMD8XzRQMDF7iHF3WUuUGsumFM5AcDk9BpKny1qm1FoWWSwAQ8rwOMa4Lt3TuVNpBQBczT0KHYvUGz0JQGB07kX0QkTonDs0F+B2x5x84D3TirztSYC02ZR8mkwJPGw1Goc714LRSD3r2TGfaYawvScBEu12u0ngeT6c5o7v6c5eAL+2qmqP7S+1lo0VbTcaq0m+yd8S4lznyA4IR21fqbFirHi/6haSn7J5g3rG1su5XcOaRMbBqNXrSvWCHS/ndB1rVlL29ozSOFH2/MfyC2eVpgMgU3wWAAAAAElFTkSuQmCC',
    se: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKhSURBVFhH7ZU9aBVBFIVnz5y5O+/lQUxEHiaiNgGJlYWIf421ErG3iGAlWCpKJPiDCmrhD4hioZWWotgpdlaiCJJKCwNGU1gbY7Fy83bDzRCTmPeeVT7YYufee86d2Z0Z59boMMUipDldIzW2pLkdx5rVyGEhPwrlqh1PazqGNenL80Ehv2TICu99EUM4aeNpbdtY8Uaj0SvkhyzLiuphq4kjNi/VWDVWdL9znsBrAIUHJtUczk3pO4CZ3PvdNj/VWhWV2A7nGIAnuuxw7mld5ACyTE0uR8qJsonp4NxQVxrIvZzzLZOJATcQc+/3lg1c03hguKv/A4B3XWkghDAilGe9Ilv1nVl2dG7Wzo1XOQK5IZQLXWkgheB5D18IOZrGKlKtVZMKKyRf6SchuTONKalGR6jE+2PcCOAXgG+bnMu7aloxP7XWDzmmsw/gHTue1qwIK1CR5ihVrF6v9wP4oQ3UyO1L1SzLvOMi/C0vijzW7UbggR23+SvCFo85lxEYDwgjVtDmKLnIWTXXU7DH9fRV46n2sljRZrNZF/K5Cgv5wsYsMYRTuu0AzLZ15NrC9TE2Cb4pj9G3IrLFxpVmrbZBKI/KU242IByy8VR/SWxhPYQhkhPl93xoY0qe54PRy2k938ucz+L9PpuT6i/LvDi5i+TU3FUKfOqJcQTAQWbZMThcosNLOPz2Xlcm0+12e3Ojsa4tc6UqjiLfq7tcDcpPkD5fA3CTjsPWWEl1V0wlkIuc0X3ssqzw8JNwuALgFoCLJEd1hQaciwttW6Sa/4QVqlGOl9frjN7nNrYYqdaqsaI5wmECP0lfCHjPORdsXEnrO4I1qOf5HpLT3rOIkPtdNbYsaCKEbUJ5HynX/1sDim0iJc3tGqmxkuas0S5/AKB7prDOJAedAAAAAElFTkSuQmCC',
    sw: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKoSURBVFhH7ZYxaFRBFEXf3Lnz/uyyCYLoqigKmsJCRAioaCMIFqJBsBYVKxFLQRGEGEFBBRWFYCcBrezsgpDOSgQLbTQYQSVYGxRk5X3zw2SiYbPZTZUDy+7/7859d2f+zqzIKovQ+ge5pmfkjVNybddJmxWql6MW7yLjYHo/H9M10iY16jkPtMS5Fsmv/arb03o+dtmk5gHheNXczb5Ivm/WautSXe7RMalpoyj2EfwBj5aHnwLQIvDRe2/vr5rNZj3V514dUZnVQ9hJctqTrUg9T8GIBWjUakcJPLHPSr7YJBJ7EoDkB+9pTR7bNYB71tQ5d0RECOC1RzkTIz0JEKm3FTpaXQO4US6Bc2fKeowbleFZAIZ6EiCH5Fl7FiAYzmsVuVfH5MZGQe4tZ0AwnteM3KNrVA3sYQMwDZGZmsj6njeumPuK5Z6A+7YMwftL6f18TNeZCyAyAMhvm4lGo7FmsQBz6RbRtE1qFMCH9L6lDGPp/f/pc1LdkqgMtvX19RP4ZLthDGHeUhipNoQwVHh/Zb6iwxCpQeH9fgC/bCMqVBc0qFDohGkC+HSPCNNa7t8WqUEAjpUhypnQsRjjhrReakIYAPDWoTzAXqbPjZH7t0VqoOIPVocTgO+F16sN1a2p5oQIvMhzuPLseLOmKLak9dy/LVKDutTXEhi1I9umuzwpyXGC1+ncKXXuUF31MIFJO8qVnKyRu5YVwEhDGJHcHcAHAD5XYWznhHPlq/ovYcuh5FQ1LvddEvMj/GWzSEFykORpiFwTkTsicguCLxbAZkjJm5U+9+yI+REWElUvAPhp+0cM4WJay72WRWpcUTA8KpcCmIkhnExr+fiuUTVQ6N3ZX8i3wvsDK9LcSAIME5gIIjtWrLmRNsvJtT0jb2zkmlVS/gAQwqYDxl3EgAAAAABJRU5ErkJggg==',
  };

private readonly route = inject(ActivatedRoute);
private readonly router = inject(Router);
private readonly destroyRef = inject(DestroyRef);
private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly projectCatalogService = inject(ProjectCatalogService);
  private readonly projectStorefrontService = inject(ProjectStorefrontService);
  private readonly projectWorkspaceContextService = inject(ProjectWorkspaceContextService);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly toastService = inject(ToastService);
  private readonly uploadService = inject(UploadService);

  readonly projectParamMap = toSignal(this.route.parent!.paramMap, {
    initialValue: this.route.parent!.snapshot.paramMap,
  });
  readonly projectId = computed(() => {
    const projectId = Number(this.projectParamMap()?.get('projectId') ?? '0');
    return Number.isFinite(projectId) && projectId > 0 ? projectId : 0;
  });

  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private addElementsPanelCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private addElementsLibraryModalCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private pagesPanelCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private managePagesCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private sectionLibraryCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private pageDesignPickerCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private suppressNextComponentClickSelectionId: string | null = null;
  private justFinishedComponentSelectionBox = false;
  private activeComponentDrag:
    | {
        sectionId: string;
        sourceContainerId: string | null;
        pointerOffsetX: number;
        pointerOffsetY: number;
        components: Array<{
          componentId: string;
          startX: number;
          startY: number;
          width: number;
          height: number;
        }>;
      }
    | null = null;
private activeComponentDragUndoSnapshot: StorefrontEditorSnapshot | null = null;
private activeSelectionDrag:
    | {
        sectionId: string;
        startX: number;
        startY: number;
      }
    | null = null;
private activeResize:
  | {
      sectionId: string;
      componentId: string;
      handle: string;
        startX: number;
        startY: number;
      startFrame: StorefrontEditorComponentNode['frame'];
      startRotation: number;
      preserveAspectRatio: boolean;
      startAspectRatio: number;
      contentBounds: { left: number; right: number; top: number; bottom: number } | null;
    }
  | null = null;
  private activeImageCrop:
    | {
        sectionId: string;
        componentId: string;
        mode: 'move' | 'resize';
        handle: string | null;
        startX: number;
        startY: number;
        startRotation: number;
        viewport: { x: number; y: number; width: number; height: number };
        startCrop: { x: number; y: number; width: number; height: number };
      }
    | null = null;
  private readonly pendingImageSourceMetadataKeys = new Set<string>();
  private activeRotation:
    | {
        sectionId: string;
        componentId: string;
        centerX: number;
        centerY: number;
        startAngle: number;
        startRotation: number;
        previousAngle: number;
        accumulatedAngle: number;
      }
    | null = null;
  private activeSectionResize:
      | {
          sectionId: string;
          startY: number;
          startHeight: number;
        }
      | null = null;
  private activeSectionLayoutResize:
    | {
        sectionId: string;
        axis: StorefrontEditorSectionLayoutTrackAxis;
        separatorIndex: number;
        startClientX: number;
        startClientY: number;
        startSizes: number[];
        availableSize: number;
      }
    | null = null;
  private activeAddElementsComponentDrag:
    | {
        itemId: string;
        pointerOffsetX: number;
        pointerOffsetY: number;
        width: number;
        height: number;
      }
    | null = null;
  private activeColorCanvasDrag = false;
  private activeColorHueDrag = false;
  private activeButtonColorCanvasDrag = false;
  private activeButtonColorHueDrag = false;
  private activeContainerBackgroundColorCanvasDrag = false;
  private activeContainerBackgroundColorHueDrag = false;
  private activeContainerBorderColorCanvasDrag = false;
  private activeContainerBorderColorHueDrag = false;
  private activeSectionBackgroundColorCanvasDrag = false;
  private activeSectionBackgroundColorHueDrag = false;
  private activeSectionBorderColorCanvasDrag = false;
  private activeSectionBorderColorHueDrag = false;
  private activeImageBorderColorCanvasDrag = false;
  private activeImageBorderColorHueDrag = false;
  private readonly rotationHandleCursorCache = new Map<string, string>();

  readonly project = signal<Project | null>(null);
  readonly storefront = signal<ProjectStorefront | null>(null);
  readonly workingStorefront = signal<ProjectStorefront | null>(null);
  readonly products = signal<ProjectCatalogProduct[]>([]);
  readonly selectedSectionId = signal<string | null>(null);
  readonly selectedComponentId = signal<string | null>(null);
  readonly selectedComponentIds = signal<string[]>([]);
  readonly isolatedGroupComponentId = signal<string | null>(null);
  readonly editorSession = signal<StorefrontEditorSession>(this.createDefaultEditorSession());
  readonly undoStack = signal<StorefrontEditorSnapshot[]>([]);
  readonly redoStack = signal<StorefrontEditorSnapshot[]>([]);
  readonly viewport = signal<StorefrontEditorViewport>('desktop');
  readonly sidebarCollapsed = signal(false);
  readonly sidebarMode = signal<EditorSidebarMode>('structure');
readonly isFormaMenuOpen = signal(false);
readonly isAccountMenuOpen = signal(false);
readonly isZoomMenuOpen = signal(false);
readonly isBrandKitPopupOpen = signal(false);
readonly isBrandKitCustomizerOpen = signal(false);
readonly activeBrandKitPresetId = signal<string | null>(null);
  readonly isAddElementsPanelOpen = signal(false);
  readonly isAddElementsPanelClosing = signal(false);
  readonly isAddElementsLibraryModalOpen = signal(false);
  readonly isAddElementsLibraryModalClosing = signal(false);
  readonly hoveredAddElementsLibraryItemId = signal<string | null>(null);
  readonly activeAddElementsCategory = signal<StorefrontEditorAddElementsCategory>('All');
  readonly activeAddElementsSubcategory = signal('all');
  readonly addElementsSearch = signal('');
  readonly draggedAddElementsItemId = signal<string | null>(null);
  readonly draggedAddElementsPreviewPosition = signal<{ left: number; top: number; width: number; height: number } | null>(
    null
  );
  readonly componentAttachSectionId = signal<string | null>(null);
  readonly componentAttachContainerTarget = signal<{ sectionId: string; containerId: string } | null>(null);
  readonly isPagesPanelOpen = signal(false);
  readonly isPagesPanelClosing = signal(false);
  readonly isManagePagesOpen = signal(false);
  readonly isManagePagesClosing = signal(false);
  readonly isLayersPopupOpen = signal(false);
  readonly isMediaManagerOpen = signal(false);
readonly pagesPanelLayout = signal<PagesPanelLayoutMode>('grid');
readonly pagesManagerSearch = signal('');
readonly isAddPageMenuOpen = signal(false);
readonly sectionAddMenuSectionId = signal<string | null>(null);
readonly sectionAddMenuPlacement = signal<'above' | 'below'>('below');
readonly isPageDesignPickerOpen = signal(false);
readonly isPageDesignPickerClosing = signal(false);
readonly activePageDesignCategory = signal<StorefrontPageDesignCategory>('Business');
readonly pageCardMenuId = signal<string | null>(null);
  readonly pageCardMenuTop = signal(0);
  readonly pageCardMenuLeft = signal(0);
  readonly sectionLibraryTargetId = signal<string | null>(null);
  readonly isSectionLibraryClosing = signal(false);
readonly activeSectionLibraryCategory = signal<SectionLibraryCategory>('Essentials');
  readonly canScrollAddElementsTabsLeft = signal(false);
  readonly canScrollAddElementsTabsRight = signal(false);
  readonly canScrollAddElementsSubmenuLeft = signal(false);
  readonly canScrollAddElementsSubmenuRight = signal(false);
readonly canScrollSectionLibraryTabsLeft = signal(false);
readonly canScrollSectionLibraryTabsRight = signal(false);
readonly canScrollPageDesignTabsLeft = signal(false);
readonly canScrollPageDesignTabsRight = signal(false);
  readonly sectionOptionsMenuId = signal<string | null>(null);
  readonly draggedSectionId = signal<string | null>(null);
  readonly draggedComponentId = signal<string | null>(null);
  readonly componentReorderTargetId = signal<string | null>(null);
  readonly isSelectingComponents = signal(false);
  readonly isResizingComponent = signal(false);
  readonly isRotatingComponent = signal(false);
  readonly isResizingSection = signal(false);
  readonly selectionBoxSectionId = signal<string | null>(null);
  readonly selectionBox = signal<ComponentSelectionBox>({ x: 0, y: 0, width: 0, height: 0 });
  readonly snapToGridEnabled = signal(true);
  readonly snapSpacingToken = signal<4 | 8 | 16>(8);
  readonly lockAspectRatioEnabled = signal(false);
  readonly activeSnapGuideSectionId = signal<string | null>(null);
  readonly activeSnapGuides = signal<EditorSnapGuide[]>([]);
  readonly isComponentContextMenuOpen = signal(false);
  readonly componentContextMenuPosition = signal({ x: 0, y: 0 });
  readonly componentContextMenuSubmenuDirection = signal<'left' | 'right'>('right');
  readonly componentContextArrangeSubmenuPosition = signal({ x: 0, y: 0 });
  readonly componentContextAlignSubmenuPosition = signal({ x: 0, y: 0 });
  readonly componentContextMenuSectionId = signal<string | null>(null);
  readonly componentContextMenuComponentId = signal<string | null>(null);
  readonly sectionContextMenuPosition = signal({ x: 0, y: 0 });
  readonly componentClipboard = signal<StorefrontEditorComponentNode[] | null>(null);
  readonly isEditingComponentName = signal(false);
  readonly editingComponentNameId = signal<string | null>(null);
  readonly editingComponentNameValue = signal('');
  readonly isEditingSectionName = signal(false);
  readonly editingSectionNameId = signal<string | null>(null);
  readonly editingSectionNameValue = signal('');
  readonly isEditingPageName = signal(false);
  readonly editingPageNameId = signal<string | null>(null);
  readonly editingPageNameValue = signal('');
  readonly isEditingComponentText = signal(false);
  readonly editingComponentTextId = signal<string | null>(null);
  readonly editingComponentTextValue = signal('');
readonly hoveredSectionId = signal<string | null>(null);
readonly hoveredSectionRailTop = signal(0);
readonly isSelectedSectionRailVisible = signal(false);
readonly hasPreviewStageScrollbar = signal(false);
  readonly previewStageScrollbarWidth = signal(0);
  readonly sectionClipboard = signal<StorefrontHomepageSection | null>(null);
  readonly zoomPercent = signal(120);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isAutosaving = signal(false);
  readonly isPublishing = signal(false);
  readonly isUnpublishing = signal(false);
  readonly isMediaUploading = signal(false);
  readonly mediaManagerPurpose = signal<MediaManagerPurpose>('general');
  readonly errorMessage = signal('');
  readonly mediaAssets = signal<StorefrontMediaManagerAsset[]>([]);

  readonly isEcommerceProject = computed(() => this.project()?.type === 'ECOMMERCE');
  readonly sections = computed(() => this.workingStorefront()?.draftHomepage.sections ?? []);
  readonly managedPages = computed(() => this.editorSession().managedPages ?? this.buildDefaultManagedPages());
  readonly selectedManagedPageId = computed(() => this.editorSession().selectedManagedPageId ?? 'home');
  readonly selectedManagedPage = computed(
    () => this.managedPages().find((page) => page.id === this.selectedManagedPageId()) ?? this.managedPages()[0] ?? null
  );
  readonly filteredManagedPages = computed(() => {
    const query = this.pagesManagerSearch().trim().toLowerCase();
    if (!query) {
      return this.managedPages();
    }

    return this.managedPages().filter((page) => page.name.toLowerCase().includes(query));
  });
  readonly pageSettingsSelected = computed(() => this.selectedSectionId() === null);
readonly selectedSection = computed<StorefrontHomepageSection | null>(
  () => this.sections().find((section) => section.id === this.selectedSectionId()) ?? null
);
readonly hasComponentSelection = computed(() => this.selectedComponentIds().length > 0);
  readonly selectedComponent = computed<StorefrontEditorComponentNode | null>(() => {
    const section = this.selectedSection();
    const componentId = this.selectedComponentId();
    if (!section || !componentId) {
      return null;
    }

    return this.readSectionComponents(section).find((component) => component.id === componentId) ?? null;
  });
  readonly selectedSectionComponents = computed(() => {
    const section = this.selectedSection();
    return section ? this.readSectionComponents(section) : [];
  });
  readonly selectedSectionLayerItems = computed<StorefrontEditorLayerItem[]>(() =>
    [...this.selectedSectionComponents()]
      .sort((left, right) => (right.zIndex ?? 0) - (left.zIndex ?? 0))
      .map((component) => ({
        componentId: component.id,
        name: this.componentDisplayName(component),
        typeLabel: this.componentTypeLabel(component),
        width: this.roundedComponentWidth(component),
        height: this.roundedComponentHeight(component),
        childCount: component.children.length,
        isVisible: component.isVisible,
        isLocked: component.isLocked,
      }))
  );
  readonly selectedSectionLayerStats = computed<StorefrontEditorLayerStats>(() => {
    const items = this.selectedSectionLayerItems();
    return {
      total: items.length,
      hidden: items.filter((item) => !item.isVisible).length,
      locked: items.filter((item) => item.isLocked).length,
    };
  });
  readonly activeLayerItem = computed<StorefrontEditorLayerItem | null>(() => {
    const items = this.selectedSectionLayerItems();
    const selectedId = this.selectedComponentId();
    return items.find((item) => item.componentId === selectedId) ?? items[0] ?? null;
  });
  readonly selectedComponents = computed(() => {
    const section = this.selectedSection();
    if (!section) {
      return [];
    }

    const selectedIds = new Set(this.selectedComponentIds());
    return this.readSectionComponents(section).filter((component) => selectedIds.has(component.id));
  });
  readonly selectedTextComponent = computed<StorefrontEditorTextNode | null>(() => {
    const component = this.selectedComponent();
    return component?.type === 'text' ? component : null;
  });
  readonly selectedImageComponent = computed<StorefrontEditorImageNode | null>(() => {
    const component = this.selectedComponent();
    return component?.type === 'image' ? component : null;
  });
  readonly selectedButtonComponent = computed<StorefrontEditorButtonNode | null>(() => {
    const component = this.selectedComponent();
    return component?.type === 'button' ? component : null;
  });
  readonly selectedContainerComponent = computed<StorefrontEditorContainerNode | null>(() => {
    const component = this.selectedComponent();
    return component?.type === 'container' ? component : null;
  });
  readonly selectedProductFeedComponent = computed<StorefrontEditorProductFeedNode | null>(() => {
    const component = this.selectedComponent();
    return component?.type === 'product-feed' ? component : null;
  });
  readonly isSectionToolbarVisible = computed(
    () => !this.isEditingComponentText() && this.selectedSection() !== null && !this.hasComponentSelection()
  );
readonly isParagraphToolbarVisible = computed(
    () => this.selectedComponentIds().length === 1 && this.selectedTextComponent() !== null
  );
  readonly isImageToolbarVisible = computed(
    () => !this.isEditingComponentText() && this.selectedComponentIds().length === 1 && this.selectedImageComponent() !== null
  );
  readonly isContainerToolbarVisible = computed(
    () => !this.isEditingComponentText() && this.selectedComponentIds().length === 1 && this.selectedContainerComponent() !== null
  );
  readonly isButtonToolbarVisible = computed(
    () => !this.isEditingComponentText() && this.selectedComponentIds().length === 1 && this.selectedButtonComponent() !== null
  );
  readonly isProductFeedToolbarVisible = computed(
    () => !this.isEditingComponentText() && this.selectedComponentIds().length === 1 && this.selectedProductFeedComponent() !== null
  );
  readonly canShowGroupAction = computed(
    () => this.selectedComponentIds().length >= 2 && !this.selectedComponentGroupId()
  );
  readonly canShowUngroupAction = computed(() => !!this.selectedComponentGroupId());
  readonly canShowAlignAction = computed(() => this.selectedComponentIds().length >= 2);
readonly activeTextToolbarMenu = signal<
  'style' | 'font-size' | 'font-family' | 'link' | 'alignment' | 'color' | 'typography' | 'highlight' | null
>(null);
  readonly activeColorPickerTab = signal<'brand' | 'custom'>('brand');
  readonly savedParagraphColors = signal<string[]>([]);
  readonly customPickerHue = signal(206);
  readonly customPickerSaturation = signal(74);
  readonly customPickerBrightness = signal(22);
  readonly textFontSearch = signal('');
  readonly textLinkPageId = signal<string>('home');
  readonly textLinkOpenMode = signal<'current' | 'new'>('current');
  readonly activeImageToolbarMenu = signal<ImageToolbarMenu>(null);
  readonly imageLinkPageId = signal<string>('home');
  readonly imageLinkOpenMode = signal<'current' | 'new'>('current');
  readonly isImageSettingsLinkPopupOpen = signal(false);
  readonly imageSettingsLinkPopupPlacement = signal<'below' | 'viewport-bottom'>('below');
  readonly imageSettingsLinkPopupViewportLeft = signal(12);
  readonly croppingImageComponentId = signal<string | null>(null);
  readonly isImageBorderColorPickerOpen = signal(false);
  readonly activeImageBorderColorTab = signal<'brand' | 'custom'>('brand');
  readonly isImageBorderStylePickerOpen = signal(false);
  readonly activeContainerToolbarMenu = signal<ContainerToolbarMenu>(null);
  readonly activeContainerBackgroundTab = signal<'brand' | 'custom'>('brand');
  readonly containerBackgroundCustomPickerHue = signal(0);
  readonly containerBackgroundCustomPickerSaturation = signal(0);
  readonly containerBackgroundCustomPickerBrightness = signal(100);
  readonly containerBackgroundCustomColorCanvasBackground = computed(
    () => `hsl(${this.containerBackgroundCustomPickerHue()} 100% 50%)`
  );
  readonly containerBackgroundCustomColorCanvasHandleLeft = computed(
    () => `${this.containerBackgroundCustomPickerSaturation()}%`
  );
  readonly containerBackgroundCustomColorCanvasHandleTop = computed(
    () => `${100 - this.containerBackgroundCustomPickerBrightness()}%`
  );
  readonly containerBackgroundCustomColorSpectrumHandleLeft = computed(
    () => `${(this.containerBackgroundCustomPickerHue() / 360) * 100}%`
  );
  readonly isContainerBorderColorPickerOpen = signal(false);
  readonly activeContainerBorderColorTab = signal<'brand' | 'custom'>('brand');
  readonly isContainerBorderStylePickerOpen = signal(false);
  readonly containerBorderCustomPickerHue = signal(224);
  readonly containerBorderCustomPickerSaturation = signal(71);
  readonly containerBorderCustomPickerBrightness = signal(11);
  readonly containerBorderCustomColorCanvasBackground = computed(
    () => `hsl(${this.containerBorderCustomPickerHue()} 100% 50%)`
  );
  readonly containerBorderCustomColorCanvasHandleLeft = computed(
    () => `${this.containerBorderCustomPickerSaturation()}%`
  );
  readonly containerBorderCustomColorCanvasHandleTop = computed(
    () => `${100 - this.containerBorderCustomPickerBrightness()}%`
  );
  readonly containerBorderCustomColorSpectrumHandleLeft = computed(
    () => `${(this.containerBorderCustomPickerHue() / 360) * 100}%`
  );
  readonly activeSectionToolbarMenu = signal<SectionToolbarMenu>(null);
  readonly activeSectionBackgroundTab = signal<'brand' | 'custom'>('brand');
  readonly isSectionBorderColorPickerOpen = signal(false);
  readonly activeSectionBorderColorTab = signal<'brand' | 'custom'>('brand');
  readonly isSectionBorderStylePickerOpen = signal(false);
  readonly activeButtonToolbarMenu = signal<ButtonToolbarMenu>(null);
  readonly activeProductFeedToolbarMenu = signal<ProductFeedToolbarMenu>(null);
  readonly activeProductFeedSettingsSection = signal<ProductFeedSettingsSection>('category');
  readonly activeButtonColorPickerTab = signal<'brand' | 'custom'>('brand');
  readonly savedButtonColors = signal<string[]>([]);
  readonly buttonCustomPickerHue = signal(228);
  readonly buttonCustomPickerSaturation = signal(72);
  readonly buttonCustomPickerBrightness = signal(96);
  readonly buttonEditTextValue = signal('');
  readonly buttonLinkValue = signal('');
  readonly productFeedTextColorValue = signal('#202124');
  readonly brandParagraphColors = computed(() => {
    const defaults = ['#ffffff', '#edf4fb', '#bcd1e7', '#091b2f', '#082237', '#2f6f10', '#b7d58b', '#d8e0e8', '#c1ccd8', 'transparent'];
    const merged = [...defaults, ...this.savedParagraphColors()];
    const unique: string[] = [];
    for (const color of merged) {
      const normalized = color.trim().toLowerCase();
      if (normalized && !unique.includes(normalized)) {
        unique.push(normalized);
      }
    }
    return unique.slice(0, 10);
  });
  readonly customColorCanvasBackground = computed(() => `hsl(${this.customPickerHue()} 100% 50%)`);
  readonly customColorCanvasHandleLeft = computed(() => `${this.customPickerSaturation()}%`);
  readonly customColorCanvasHandleTop = computed(() => `${100 - this.customPickerBrightness()}%`);
  readonly customColorSpectrumHandleLeft = computed(() => `${(this.customPickerHue() / 360) * 100}%`);
  readonly customColorHexValue = computed(() => {
    const color = this.selectedTextComponent()?.props.color ?? '#082237';
    return color.replace('#', '').toUpperCase();
  });
  readonly brandButtonColors = computed(() => {
    const defaults = ['#0f172a', '#355cff', '#1f4d30', '#ffe066', '#ffffff', '#f8fafc', '#111827', '#e5ecff', '#ffefe5', 'transparent'];
    const merged = [...defaults, ...this.savedButtonColors()];
    const unique: string[] = [];
    for (const color of merged) {
      const normalized = color.trim().toLowerCase();
      if (normalized && !unique.includes(normalized)) {
        unique.push(normalized);
      }
    }
    return unique.slice(0, 10);
  });
  readonly buttonCustomColorCanvasBackground = computed(() => `hsl(${this.buttonCustomPickerHue()} 100% 50%)`);
  readonly buttonCustomColorCanvasHandleLeft = computed(() => `${this.buttonCustomPickerSaturation()}%`);
  readonly buttonCustomColorCanvasHandleTop = computed(() => `${100 - this.buttonCustomPickerBrightness()}%`);
  readonly buttonCustomColorSpectrumHandleLeft = computed(() => `${(this.buttonCustomPickerHue() / 360) * 100}%`);
  readonly buttonCustomColorHexValue = computed(() => {
    const color = this.selectedButtonComponent()?.props.backgroundColor ?? '#355cff';
    return color.replace('#', '').toUpperCase();
  });
  readonly sectionBackgroundCustomPickerHue = signal(0);
  readonly sectionBackgroundCustomPickerSaturation = signal(0);
  readonly sectionBackgroundCustomPickerBrightness = signal(100);
  readonly sectionBackgroundCustomColorCanvasBackground = computed(
    () => `hsl(${this.sectionBackgroundCustomPickerHue()} 100% 50%)`
  );
  readonly sectionBackgroundCustomColorCanvasHandleLeft = computed(
    () => `${this.sectionBackgroundCustomPickerSaturation()}%`
  );
  readonly sectionBackgroundCustomColorCanvasHandleTop = computed(
    () => `${100 - this.sectionBackgroundCustomPickerBrightness()}%`
  );
  readonly sectionBackgroundCustomColorSpectrumHandleLeft = computed(
    () => `${(this.sectionBackgroundCustomPickerHue() / 360) * 100}%`
  );
  readonly sectionBackgroundHexValue = computed(() => {
    const color = this.sectionBackgroundColor(this.selectedSection()) ?? '#ffffff';
    return color.replace('#', '').toUpperCase();
  });
  readonly containerBackgroundHexValue = computed(() => {
    const color = this.containerBackgroundColor(this.selectedContainerComponent()) ?? '#ffffff';
    return color.replace('#', '').toUpperCase();
  });
  readonly brandSectionBackgroundColors = [
    '#ffffff',
    '#f8fafc',
    '#f4f1ef',
    '#e5ecff',
    '#ffefe5',
    '#d9fb7c',
    '#dbeafe',
    '#e9d5ff',
    '#355cff',
    '#111827',
  ];
  readonly savedSectionBorderColors = signal<string[]>([]);
  readonly sectionBorderCustomPickerHue = signal(224);
  readonly sectionBorderCustomPickerSaturation = signal(71);
  readonly sectionBorderCustomPickerBrightness = signal(11);
  readonly sectionBorderCustomColorCanvasBackground = computed(
    () => `hsl(${this.sectionBorderCustomPickerHue()} 100% 50%)`
  );
  readonly sectionBorderCustomColorCanvasHandleLeft = computed(
    () => `${this.sectionBorderCustomPickerSaturation()}%`
  );
  readonly sectionBorderCustomColorCanvasHandleTop = computed(
    () => `${100 - this.sectionBorderCustomPickerBrightness()}%`
  );
  readonly sectionBorderCustomColorSpectrumHandleLeft = computed(
    () => `${(this.sectionBorderCustomPickerHue() / 360) * 100}%`
  );
  readonly sectionBorderHexValue = computed(() => this.sectionBorderColor(this.selectedSection()).replace('#', '').toUpperCase());
  readonly containerBorderHexValue = computed(() => this.containerBorderColor(this.selectedContainerComponent()).replace('#', '').toUpperCase());
readonly brandSectionBorderColors = [
    '#ffffff',
    '#e8f1fb',
    '#b8d0ea',
    '#071a2e',
    '#0d2740',
    '#2f6f10',
    '#b2d083',
    '#d5e0ea',
    '#c0cad6',
    '#d62828',
  ];
  readonly brandKitPreviewPalette = computed(() => {
    const preset = this.activeBrandKitPreset();
    if (preset) {
      return preset.palette;
    }
    const palette = [
      ...this.brandButtonColors().slice(0, 2),
      ...this.brandParagraphColors().filter((color) => color !== 'transparent').slice(5, 8),
      ...this.brandSectionBorderColors.filter((color) => color !== 'transparent').slice(1, 3),
    ];
    const unique: string[] = [];
    for (const color of palette) {
      if (!unique.includes(color)) {
        unique.push(color);
      }
    }
    return unique.slice(0, 5);
  });
  readonly brandKitAccentPalette = computed(() => {
    const preset = this.activeBrandKitPreset();
    if (preset) {
      return preset.palette;
    }
    const palette = [
      ...this.brandParagraphColors().filter((color) => color !== 'transparent').slice(3, 8),
      ...this.brandSectionBackgroundColors.filter((color) => color !== 'transparent').slice(0, 4),
    ];
    const unique: string[] = [];
    for (const color of palette) {
      if (!unique.includes(color)) {
        unique.push(color);
      }
    }
    return unique.slice(0, 5);
  });
  readonly sectionBorderStyleOptions: ReadonlyArray<{ id: 'solid' | 'dashed' | 'dotted' | 'double'; label: string }> = [
    { id: 'solid', label: 'Solid' },
    { id: 'dashed', label: 'Dashed' },
    { id: 'dotted', label: 'Dotted' },
    { id: 'double', label: 'Double' },
  ];
  readonly imageDisplayModeOptions: ReadonlyArray<{ id: 'fill' | 'fit' | 'aspect'; label: string }> = [
    { id: 'fill', label: 'fill' },
    { id: 'fit', label: 'fit' },
    { id: 'aspect', label: 'by aspect ratio' },
  ];
  readonly imageBorderCustomPickerHue = signal(224);
  readonly imageBorderCustomPickerSaturation = signal(71);
  readonly imageBorderCustomPickerBrightness = signal(11);
  readonly imageBorderCustomColorCanvasBackground = computed(
    () => `hsl(${this.imageBorderCustomPickerHue()} 100% 50%)`
  );
  readonly imageBorderCustomColorCanvasHandleLeft = computed(
    () => `${this.imageBorderCustomPickerSaturation()}%`
  );
  readonly imageBorderCustomColorCanvasHandleTop = computed(
    () => `${100 - this.imageBorderCustomPickerBrightness()}%`
  );
  readonly imageBorderCustomColorSpectrumHandleLeft = computed(
    () => `${(this.imageBorderCustomPickerHue() / 360) * 100}%`
  );
  readonly imageBorderHexValue = computed(() => this.imageBorderColor(this.selectedImageComponent()).replace('#', '').toUpperCase());
  readonly paragraphFontOptions = STOREFRONT_EDITOR_TEXT_FONT_OPTIONS;
  readonly paragraphFontFamilies = this.paragraphFontOptions.map((font) => font.family);
  readonly brandKitPresets = STOREFRONT_EDITOR_BRAND_KIT_PRESETS;
  readonly activeBrandKitPreset = computed(
    () => this.brandKitPresets.find((preset) => preset.id === this.activeBrandKitPresetId()) ?? null
  );
  readonly brandKitHeadingFont = computed(
    () => this.activeBrandKitPreset()?.headingFont
      ?? this.paragraphFontOptions.find((font) => font.family === 'Hedvig Letters Serif')?.family
      ?? this.paragraphFontOptions.find((font) => font.category === 'Serif')?.family
      ?? this.paragraphFontFamilies[0]
  );
  readonly brandKitBodyFont = computed(
    () => this.activeBrandKitPreset()?.bodyFont
      ?? this.paragraphFontOptions.find((font) => font.family === 'Fira Mono')?.family
      ?? this.paragraphFontOptions.find((font) => font.category === 'Mono')?.family
      ?? this.paragraphFontFamilies[1]
      ?? this.paragraphFontFamilies[0]
  );
  readonly brandKitButtonPreset = computed(() => {
    const presetId = this.activeBrandKitPreset()?.buttonPresetId;
    if (!presetId) {
      return this.buttonDesignPresets[0] ?? null;
    }

    return this.buttonDesignPresets.find((preset) => preset.id === presetId) ?? this.buttonDesignPresets[0] ?? null;
  });
  readonly brandKitPrimaryButtonBackground = computed(
    () => this.brandKitButtonPreset()?.patch.backgroundColor ?? this.brandButtonColors()[0] ?? '#0f172a'
  );
  readonly brandKitPrimaryButtonText = computed(
    () => this.brandKitButtonPreset()?.patch.textColor ?? this.brandButtonColors()[4] ?? '#ffffff'
  );
  readonly brandKitSecondaryButtonBorder = computed(
    () => this.brandKitButtonPreset()?.patch.borderColor ?? this.brandButtonColors()[0] ?? '#0f172a'
  );
  readonly brandKitSecondaryButtonText = computed(
    () => this.brandKitButtonPreset()?.patch.textColor ?? this.brandButtonColors()[0] ?? '#0f172a'
  );
  readonly brandKitBoxFill = computed(
    () => this.activeBrandKitPreset()?.boxFill ?? this.brandSectionBackgroundColors[6]
  );
  readonly brandKitBoxBorder = computed(
    () => this.activeBrandKitPreset()?.boxBorder ?? this.brandSectionBorderColors[3]
  );
  readonly brandKitLineColors = computed(
    () => this.activeBrandKitPreset()?.lines ?? [
      this.brandSectionBorderColors[2],
      this.brandSectionBorderColors[3],
      this.brandSectionBorderColors[6],
    ]
  );
  readonly paragraphFontSizes = [12, 14, 16, 18, 24, 28, 32, 36, 42, 48, 52, 56, 60, 64, 72, 80, 88, 96, 104, 124, 144, 288];
  readonly textLineHeightOptions = [0.95, 1, 1.1, 1.2, 1.35, 1.5, 1.7, 2];
  readonly textLetterSpacingOptions = [-0.08, -0.04, -0.02, 0, 0.02, 0.04, 0.08, 0.12];
  readonly textHighlightColors = ['#fff3a3', '#c7f9cc', '#bfdbfe', '#fbcfe8', '#fecaca', '#e9d5ff', 'transparent'];
  readonly textStylePresets: ReadonlyArray<{ id: StorefrontEditorTextStylePreset; sampleSize: string }> = [
    { id: 'Heading 1', sampleSize: '180px' },
    { id: 'Heading 2', sampleSize: '64px' },
    { id: 'Heading 3', sampleSize: '48px' },
    { id: 'Heading 4', sampleSize: '34px' },
    { id: 'Heading 5', sampleSize: '24px' },
    { id: 'Heading 6', sampleSize: '18px' },
    { id: 'Paragraph 1', sampleSize: '24px' },
    { id: 'Paragraph 2', sampleSize: '18px' },
    { id: 'Paragraph 3', sampleSize: '14px' },
  ];
  readonly sectionLayoutPresets: ReadonlyArray<StorefrontEditorSectionLayoutPreset> = [
    { id: 'none', label: 'None', columns: 0, rows: 0, previewColumns: 1, previewRows: 1, cells: [] },
    {
      id: 'single',
      label: 'Single',
      columns: 1,
      rows: 1,
      previewColumns: 1,
      previewRows: 1,
      cells: [{ column: 1, row: 1 }],
    },
    {
      id: 'two-columns',
      label: 'Two columns',
      columns: 2,
      rows: 1,
      previewColumns: 2,
      previewRows: 1,
      cells: [{ column: 1, row: 1 }, { column: 2, row: 1 }],
    },
    {
      id: 'two-rows',
      label: 'Two rows',
      columns: 1,
      rows: 2,
      previewColumns: 1,
      previewRows: 2,
      cells: [{ column: 1, row: 1 }, { column: 1, row: 2 }],
    },
    {
      id: 'three-columns',
      label: 'Three columns',
      columns: 3,
      rows: 1,
      previewColumns: 3,
      previewRows: 1,
      cells: [{ column: 1, row: 1 }, { column: 2, row: 1 }, { column: 3, row: 1 }],
    },
    {
      id: 'three-rows',
      label: 'Three rows',
      columns: 1,
      rows: 3,
      previewColumns: 1,
      previewRows: 3,
      cells: [{ column: 1, row: 1 }, { column: 1, row: 2 }, { column: 1, row: 3 }],
    },
    {
      id: 'grid-2x2',
      label: 'Grid',
      columns: 2,
      rows: 2,
      previewColumns: 2,
      previewRows: 2,
      cells: [
        { column: 1, row: 1 },
        { column: 2, row: 1 },
        { column: 1, row: 2 },
        { column: 2, row: 2 },
      ],
    },
    {
      id: 'sidebar-left',
      label: 'Sidebar left',
      columns: 2,
      rows: 2,
      previewColumns: 2,
      previewRows: 2,
      cells: [
        { column: 1, row: 1, rowSpan: 2 },
        { column: 2, row: 1 },
        { column: 2, row: 2 },
      ],
    },
    {
      id: 'sidebar-right',
      label: 'Sidebar right',
      columns: 2,
      rows: 2,
      previewColumns: 2,
      previewRows: 2,
      cells: [
        { column: 1, row: 1 },
        { column: 1, row: 2 },
        { column: 2, row: 1, rowSpan: 2 },
      ],
    },
  ];
  readonly filteredTextFontOptions = computed(() => {
    const query = this.textFontSearch().trim().toLowerCase();
    if (!query) {
      return this.paragraphFontOptions;
    }

    return this.paragraphFontOptions.filter((font) =>
      font.family.toLowerCase().includes(query)
      || font.category.toLowerCase().includes(query)
      || font.description.toLowerCase().includes(query)
      || font.preview.toLowerCase().includes(query)
    );
  });
  readonly buttonTextPresets = ['Paragraph 1', 'Paragraph 2', 'Heading 4'] as const;
  readonly buttonFontFamilies = ['Fira Mono', 'Fira Sans', 'Poppins', 'Merriweather', 'Playfair Display', 'Space Grotesk'];
  readonly buttonFontSizes = [12, 13, 14, 15, 16, 18, 20, 24, 28, 32];
  readonly buttonFontWeights: ReadonlyArray<StorefrontEditorButtonNode['props']['fontWeight']> = [400, 500, 600, 700];
  readonly buttonIconChoices: ReadonlyArray<StorefrontEditorButtonNode['props']['iconName']> = [
    'external-link',
    'invite-plus',
    'sparkles',
    'package',
    'wand',
    'eye',
  ];
  readonly buttonDesignPresets: ReadonlyArray<StorefrontEditorButtonDesignPreset> = [
    {
      id: 'valuation',
      label: 'GET A VALUATION',
      text: 'Get a valuation',
      iconName: 'external-link',
      patch: {
        label: 'Get a valuation',
        backgroundColor: '#020817',
        textColor: '#ffffff',
        borderColor: '#020817',
        borderWidth: 0,
        borderStyle: 'none',
        radius: 18,
        shadow: 'none',
        showIcon: true,
        iconName: 'external-link',
        iconPosition: 'left',
        fontFamily: 'Fira Sans',
        fontWeight: 600,
      },
    },
    {
      id: 'learn-more',
      label: 'LEARN MORE',
      text: 'Learn more',
      iconName: 'external-link',
      patch: {
        label: 'Learn more',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        borderColor: '#0f172a',
        borderWidth: 0,
        borderStyle: 'none',
        radius: 8,
        shadow: 'none',
        showIcon: true,
        iconName: 'external-link',
        iconPosition: 'right',
        fontWeight: 700,
      },
    },
    {
      id: 'contact-plus',
      label: 'Contact Us',
      text: 'Contact Us',
      iconName: 'invite-plus',
      patch: {
        label: 'Contact Us',
        backgroundColor: '#2b5133',
        textColor: '#ffffff',
        borderColor: '#2b5133',
        borderWidth: 0,
        borderStyle: 'none',
        radius: 10,
        shadow: 'soft',
        showIcon: true,
        iconName: 'invite-plus',
        iconPosition: 'right',
      },
    },
    {
      id: 'best-sellers',
      label: 'Best Sellers',
      text: 'Best Sellers',
      iconName: 'external-link',
      patch: {
        label: 'Best Sellers',
        backgroundColor: '#d9fb7c',
        textColor: '#193117',
        borderColor: '#193117',
        borderWidth: 2,
        borderStyle: 'solid',
        radius: 10,
        shadow: 'none',
        showIcon: true,
        iconName: 'external-link',
        iconPosition: 'right',
        fontWeight: 500,
      },
    },
    {
      id: 'check-availability',
      label: 'Check Availability',
      text: 'Check availability',
      iconName: 'external-link',
      patch: {
        label: 'Check Availability',
        backgroundColor: '#ffffff',
        textColor: '#101828',
        borderColor: '#101828',
        borderWidth: 1,
        borderStyle: 'solid',
        radius: 999,
        shadow: 'none',
        showIcon: true,
        iconName: 'external-link',
        iconPosition: 'right',
        fontWeight: 400,
      },
    },
    {
      id: 'start-now',
      label: 'Start Now',
      text: 'Start Now',
      patch: {
        label: 'Start Now',
        backgroundColor: '#ffe066',
        textColor: '#18181b',
        borderColor: '#18181b',
        borderWidth: 4,
        borderStyle: 'solid',
        radius: 8,
        shadow: 'none',
        showIcon: false,
        fontFamily: 'Fira Sans',
        fontWeight: 500,
      },
    },
    {
      id: 'book-now',
      label: 'Book Now',
      text: 'Book Now',
      iconName: 'sparkles',
      patch: {
        label: 'Book Now',
        backgroundColor: '#355cff',
        textColor: '#ffffff',
        borderColor: '#355cff',
        borderWidth: 0,
        borderStyle: 'none',
        radius: 999,
        shadow: 'strong',
        showIcon: true,
        iconName: 'external-link',
        iconPosition: 'right',
        fontWeight: 500,
      },
    },
  ];
  readonly productFeedDesignPresets: ReadonlyArray<StorefrontEditorProductFeedDesignPreset> = [
    {
      id: 'grid-gallery',
      label: 'Grid gallery',
      description: 'Classic 4-column product grid with clean pricing.',
      previewImageSrc: 'assets/app/project/editor/grid gallery/default.png',
    },
    {
      id: 'filter-gallery',
      label: 'Filtered gallery',
      description: 'Sidebar filters, sort menu, and color swatches.',
      previewImageSrc: 'assets/app/project/editor/grid gallery/filtered.png',
    },
    {
      id: 'gallery-add-to-cart',
      label: 'Add to cart',
      description: 'Product cards with direct Add to Cart buttons.',
      previewImageSrc: 'assets/app/project/editor/grid gallery/add_to_cart.png',
    },
    {
      id: 'gallery-quick-add',
      label: 'Quick add overlay',
      description: 'Overlay plus actions and color swatches.',
      previewImageSrc: 'assets/app/project/editor/grid gallery/quick_add.png',
    },
    {
      id: 'gallery-minimal',
      label: 'Minimal gallery',
      description: 'Large rounded cards with extra whitespace.',
      previewImageSrc: 'assets/app/project/editor/grid gallery/minimal.png',
    },
  ];
  readonly containerDesignPresets: ReadonlyArray<StorefrontEditorContainerDesignPreset> = [
    {
      id: 'airy-stack',
      label: 'Airy stack',
      previewLayout: 'stack',
      previewTone: 'airy',
      patch: {
        layout: 'stack',
        gap: 18,
        padding: 26,
        backgroundColor: '#ffffff',
        borderColor: '#e7e3df',
        borderWidth: 1,
        borderStyle: 'solid',
        radius: 20,
        shadow: 'soft',
        opacity: 100,
      },
    },
    {
      id: 'outlined-panel',
      label: 'Outlined panel',
      previewLayout: 'stack',
      previewTone: 'outlined',
      patch: {
        layout: 'stack',
        gap: 16,
        padding: 22,
        backgroundColor: 'transparent',
        borderColor: '#111827',
        borderWidth: 2,
        borderStyle: 'solid',
        radius: 18,
        shadow: 'none',
        opacity: 100,
      },
    },
    {
      id: 'soft-row',
      label: 'Soft row',
      previewLayout: 'row',
      previewTone: 'soft',
      patch: {
        layout: 'row',
        gap: 14,
        padding: 20,
        backgroundColor: '#f8fafc',
        borderColor: '#dbe4f0',
        borderWidth: 1,
        borderStyle: 'solid',
        radius: 18,
        shadow: 'soft',
        opacity: 100,
      },
    },
    {
      id: 'dark-grid',
      label: 'Dark grid',
      previewLayout: 'grid',
      previewTone: 'dark',
      patch: {
        layout: 'grid',
        gap: 12,
        padding: 18,
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
        borderWidth: 0,
        borderStyle: 'none',
        radius: 20,
        shadow: 'medium',
        opacity: 100,
      },
    },
  ];
  readonly productFeedSettingsSections: ReadonlyArray<{ id: ProductFeedSettingsSection; label: string }> = [
    { id: 'category', label: 'Category' },
    { id: 'settings', label: 'Settings' },
    { id: 'layout', label: 'Layout' },
    { id: 'design', label: 'Design' },
    { id: 'add-to-cart', label: 'Add to Cart' },
    { id: 'filters', label: 'Filters' },
    { id: 'sorting', label: 'Sorting' },
  ];
  readonly productFeedCategories = computed(() => {
    const categories = this.products()
      .map((product) => (product.category ?? '').trim())
      .filter((category): category is string => category.length > 0);

    return ['all', ...categories.filter((category, index) => categories.indexOf(category) === index)];
  });
readonly buttonShadowOptions: ReadonlyArray<{ id: StorefrontEditorButtonNode['props']['shadow']; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'soft', label: 'Soft' },
  { id: 'medium', label: 'Medium' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'strong', label: 'Strong' },
];
  readonly selectedComponentGroupId = computed(() => {
      const selected = this.selectedComponent();
      return selected?.groupId ?? null;
    });
  readonly selectedComponentGroupComponents = computed(() => {
    const section = this.selectedSection();
    const groupId = this.selectedComponentGroupId();
    if (!section || !groupId) {
      return [] as StorefrontEditorComponentNode[];
    }

    return this.readSectionComponents(section).filter((component) => component.groupId === groupId);
  });
  readonly selectedComponentGroupBounds = computed(() => {
    const components = this.selectedComponentGroupComponents();
    if (!components.length) {
      return null as { x: number; y: number; width: number; height: number } | null;
    }

    const left = Math.min(...components.map((component) => this.getComponentFrame(component).x));
    const top = Math.min(...components.map((component) => this.getComponentFrame(component).y));
    const right = Math.max(
      ...components.map((component) => {
        const frame = this.getComponentFrame(component);
        return frame.x + frame.width;
      })
    );
    const bottom = Math.max(
      ...components.map((component) => {
        const frame = this.getComponentFrame(component);
        return frame.y + frame.height;
      })
    );

    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  readonly storeName = computed(
    () => this.workingStorefront()?.storeName ?? this.project()?.storeTitle ?? this.project()?.name ?? 'Storefront'
  );
  readonly projectDisplayName = computed(
    () => this.project()?.name?.trim() || this.storeName() || 'Project'
  );
  readonly previewDomain = computed(
    () => this.project()?.defaultDomain?.trim() || 'domain.forma.tn'
  );
  readonly hasUnsavedChanges = computed(() => {
    const original = this.storefront();
    const working = this.workingStorefront();
    if (!original || !working) {
      return false;
    }

    return this.serializePersistedState(original, this.normalizeEditorSession(original.editorSession)) !==
      this.serializePersistedState(working, this.buildPersistedEditorSession());
  });
  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);
  readonly featuredProductsPreview = computed(() => {
    const section = this.sections().find((item) => item.type === 'featured-products');
    if (!section) {
      return [];
    }

    const productIds = this.readNumberArrayProp(section, 'productIds');
    const maxItems = this.readNumberProp(section, 'maxItems', 4);

    return productIds
      .map((productId) => this.products().find((product) => product.id === productId))
      .filter((product): product is ProjectCatalogProduct => Boolean(product))
      .slice(0, maxItems);
  });
  readonly previewTitle = computed(() => this.workingStorefront()?.draftHomepage.seo.title || this.storeName());
  readonly selectedPageLabel = computed(() => this.selectedManagedPage()?.name || 'Home');
readonly hasFloatingUi = computed(
  () =>
    this.isFormaMenuOpen() ||
    this.isAccountMenuOpen() ||
    this.isBrandKitPopupOpen() ||
    this.isZoomMenuOpen() ||
      this.isAddPageMenuOpen() ||
      this.sectionAddMenuSectionId() !== null ||
      this.isAddElementsPanelVisible() ||
      this.isAddElementsLibraryModalVisible() ||
      this.isPagesPanelVisible() ||
      this.isManagePagesVisible() ||
      this.isAddElementsLibraryModalVisible() ||
      this.isPageDesignPickerVisible() ||
      this.isSectionLibraryVisible() ||
      this.isLayersPopupOpen() ||
      this.isMediaManagerOpen() ||
      this.isSectionLibraryOpen() ||
      this.sectionOptionsMenuId() !== null
  );
  readonly hasBlockingOverlay = computed(
    () =>
      this.isManagePagesVisible() ||
      this.isPageDesignPickerVisible() ||
      this.isSectionLibraryVisible() ||
      this.isMediaManagerOpen() ||
      this.isSectionLibraryOpen()
  );
  readonly isAddElementsPanelVisible = computed(
    () => this.isAddElementsPanelOpen() || this.isAddElementsPanelClosing()
  );
  readonly isAddElementsLibraryModalVisible = computed(
    () => this.isAddElementsLibraryModalOpen() || this.isAddElementsLibraryModalClosing()
  );
readonly isPagesPanelVisible = computed(() => this.isPagesPanelOpen() || this.isPagesPanelClosing());
readonly isManagePagesVisible = computed(() => this.isManagePagesOpen() || this.isManagePagesClosing());
readonly isPageDesignPickerVisible = computed(() => this.isPageDesignPickerOpen() || this.isPageDesignPickerClosing());
readonly isSectionLibraryOpen = computed(() => this.sectionLibraryTargetId() !== null);
  readonly isSectionLibraryVisible = computed(
    () => this.isSectionLibraryOpen() || this.isSectionLibraryClosing()
  );
  readonly currentUser = computed(() => this.authService.currentUser);
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return fullName || 'Forma user';
  });
  readonly currentUserEmail = computed(() => this.currentUser()?.email || '');
  readonly currentUserAvatar = computed(() => this.currentUser()?.avatarUrl || null);
  readonly currentUserInitial = computed(() => {
    const source = this.currentUser()?.firstName?.trim() || this.currentUserName();
    return source.charAt(0).toUpperCase() || 'F';
  });
  readonly autosaveTooltip = computed(() => {
    const updatedAt = this.storefront()?.updatedAt;
    if (this.isAutosaving()) {
      return 'Autosave is on. Saving changes...';
    }
    const relative = this.formatRelativeTime(updatedAt);

    if (relative) {
      return `Autosave is on. Last saved ${relative}.`;
    }

    return 'Autosave is on. Changes are saved automatically.';
  });
  readonly previewFrameWidth = computed(() => {
    const baseWidth = this.getViewportBaseWidth(this.viewport());
    return Math.round(baseWidth * (this.zoomPercent() / 100));
  });
  readonly previewStageWidth = computed(() => this.previewFrameWidth() + 4 + this.previewStageScrollbarWidth());
  readonly isCompactPreviewChrome = computed(() => this.previewFrameWidth() <= 780);
  readonly isNarrowPreviewChrome = computed(() => this.previewFrameWidth() <= 620);
  readonly isUltraNarrowPreviewChrome = computed(() => this.previewFrameWidth() <= 460);
  readonly availableSectionTypes: StorefrontSectionType[] = [
    'announcement-bar',
    'hero',
    'featured-products',
    'contact',
  ];
  readonly sectionLibraryCategories: SectionLibraryCategory[] = STOREFRONT_EDITOR_SECTION_LIBRARY_CATEGORIES;
  readonly sectionLibraryTemplates: SectionLibraryTemplate[] = STOREFRONT_EDITOR_SECTION_LIBRARY_TEMPLATES;
  readonly visibleSectionLibraryTemplates = computed(() =>
    this.sectionLibraryTemplates.filter((template) => template.category === this.activeSectionLibraryCategory())
  );
  readonly pageDesignTemplates: StorefrontPageDesignTemplate[] = STOREFRONT_EDITOR_PAGE_DESIGN_TEMPLATES;
  readonly pageDesignCategories: StorefrontPageDesignCategory[] = STOREFRONT_EDITOR_PAGE_DESIGN_CATEGORIES;
  readonly visiblePageDesignTemplates = computed(() =>
    this.pageDesignTemplates.filter((template) => template.category === this.activePageDesignCategory())
  );
  readonly addElementsCategories = STOREFRONT_EDITOR_ADD_ELEMENTS_CATEGORIES;
  readonly addElementsSubcategories = STOREFRONT_EDITOR_ADD_ELEMENTS_SUBCATEGORIES;
  readonly addElementsFeaturedShortcuts = STOREFRONT_EDITOR_ADD_ELEMENTS_FEATURED_SHORTCUTS;
  readonly addElementsLibraryItems = STOREFRONT_EDITOR_ADD_ELEMENTS_LIBRARY_ITEMS;
  readonly activeAddElementsSubcategories = computed(() =>
    this.getAddElementsSubcategories(this.activeAddElementsCategory())
  );
  readonly visibleAddElementsLibraryItems = computed(() => {
    return filterStorefrontEditorAddElementsLibraryItems(
      this.addElementsLibraryItems,
      this.activeAddElementsCategory(),
      this.activeAddElementsSubcategory(),
      this.addElementsSearch()
    );
  });
  readonly addElementsBrowserGroups = computed<AddElementsBrowserGroup[]>(() => {
    const items = this.visibleAddElementsLibraryItems();
    const category = this.activeAddElementsCategory();
    const hasSearch = this.addElementsSearch().trim().length > 0;

    if (!items.length) {
      return [];
    }

    if (category === 'All' && !hasSearch) {
      return [
        this.buildAddElementsBrowserGroup(
          'popular',
          'Popular',
          'Best building blocks for most storefront pages.',
          ['text', 'button', 'image', 'faq', 'contact-form', 'product-feed']
        ),
        this.buildAddElementsBrowserGroup(
          'text',
          'Text',
          'Copy, support content, and messaging blocks.',
          items.filter((item) => item.category === 'Text').map((item) => item.id)
        ),
        this.buildAddElementsBrowserGroup(
          'store',
          'Store',
          'Commerce-focused elements for products and selling.',
          items.filter((item) => item.category === 'Forma Store').map((item) => item.id)
        ),
        this.buildAddElementsBrowserGroup(
          'graphics',
          'Graphics',
          'Layout, decorative, and utility pieces.',
          items.filter((item) => item.category === 'Graphics').map((item) => item.id)
        ),
        this.buildAddElementsBrowserGroup(
          'editorial',
          'Editorial',
          'Content and story-driven elements.',
          items.filter((item) => item.category === 'Image' || item.category === 'Button').map((item) => item.id)
        ),
      ].filter((group) => group.items.length > 0);
    }

    if (category !== 'All') {
      const popularInCategory = items.filter((item) => this.isPopularAddElementsItem(item.id));
      const groups: AddElementsBrowserGroup[] = [];
      if (popularInCategory.length) {
        groups.push({
          id: `${category}-popular`,
          title: 'Top picks',
          description: 'The most useful choices in this category.',
          items: popularInCategory,
        });
      }
      groups.push({
        id: `${category}-results`,
        title: hasSearch ? 'Results' : category,
        description: hasSearch ? 'Matching elements for this search and filter.' : 'All available elements in this category.',
        items,
      });
      return groups;
    }

    return [
      {
        id: 'results',
        title: 'Results',
        description: 'Matching elements for the current search.',
        items,
      },
    ];
  });
  readonly activeAddElementsBrowserItem = computed<StorefrontEditorAddElementsLibraryItem | null>(() => {
    const items = this.visibleAddElementsLibraryItems();
    if (!items.length) {
      return null;
    }

    const hoveredId = this.hoveredAddElementsLibraryItemId();
    return items.find((item) => item.id === hoveredId) ?? items[0] ?? null;
  });

constructor() {
effect(() => {
  this.ensureParagraphFontStylesheetLoaded();
});

effect(() => {
  this.savedParagraphColors.set(this.readSavedParagraphColors());
});

effect(() => {
  this.savedButtonColors.set(this.readSavedButtonColors());
});

effect(() => {
  this.savedSectionBorderColors.set(this.readSavedSectionBorderColors());
});

effect(() => {
  const image = this.selectedImageComponent();
  const sectionId = this.selectedSectionId();
  if (!image) {
    this.activeImageToolbarMenu.set(null);
    this.isImageSettingsLinkPopupOpen.set(false);
    this.isImageBorderColorPickerOpen.set(false);
    this.isImageBorderStylePickerOpen.set(false);
    this.exitImageCropMode();
    return;
  }

  if (sectionId) {
    this.ensureImageSourceMetadata(sectionId, image);
  }

  if (this.croppingImageComponentId() && this.croppingImageComponentId() !== image.id) {
    this.exitImageCropMode();
  }

  this.syncManagedPageLinkSelection(
    image.props.href ?? '',
    image.props.openInNewTab ?? false,
    this.imageLinkPageId,
    this.imageLinkOpenMode
  );
});

effect(() => {
  if (!this.selectedButtonComponent()) {
    this.activeButtonToolbarMenu.set(null);
    return;
  }

  this.buttonEditTextValue.set(this.selectedButtonComponent()!.props.label);
  this.buttonLinkValue.set(this.selectedButtonComponent()!.props.href);
});

effect(() => {
  if (!this.selectedProductFeedComponent()) {
    this.activeProductFeedToolbarMenu.set(null);
    this.activeProductFeedSettingsSection.set('category');
    return;
  }

  this.productFeedTextColorValue.set(this.selectedProductFeedComponent()!.props.textColor);
});

 effect(() => {
   const selectedSectionId = this.selectedSectionId();
      if (!selectedSectionId) {
        this.isSelectedSectionRailVisible.set(false);
        return;
      }

      setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
    });

    this.destroyRef.onDestroy(() => {
      if (this.autosaveTimer) {
        clearTimeout(this.autosaveTimer);
      }
      if (this.addElementsPanelCloseTimer) {
        clearTimeout(this.addElementsPanelCloseTimer);
      }
      if (this.addElementsLibraryModalCloseTimer) {
        clearTimeout(this.addElementsLibraryModalCloseTimer);
      }
   if (this.sectionLibraryCloseTimer) {
     clearTimeout(this.sectionLibraryCloseTimer);
   }
   if (this.pageDesignPickerCloseTimer) {
     clearTimeout(this.pageDesignPickerCloseTimer);
   }
 });
    this.loadEditor();
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    this.updateAddElementsTabScrollState();
    this.updateAddElementsSubmenuScrollState();
    this.updateSectionLibraryTabScrollState();
    this.syncSectionAddMenuPlacement();
    this.syncImageSettingsLinkPopupPlacement();
    setTimeout(() => {
      this.updatePreviewStageScrollbarState();
      this.syncSelectedSectionRailPosition();
      this.refreshSectionLayoutAssignments();
      this.syncImageSettingsLinkPopupPlacement();
    }, 0);
  }

  @HostListener('window:keydown', ['$event'])
  handleZoomShortcuts(event: KeyboardEvent): void {
    if (this.isEditingComponentName() || this.isEditingComponentText() || this.isEditingSectionName()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelComponentNameEditing();
        this.cancelComponentTextEditing();
        this.cancelSectionNameEditing();
      }
      return;
    }

    if (event.key === 'Escape' && this.isComponentContextMenuOpen()) {
      event.preventDefault();
      this.closeComponentContextMenu();
      return;
    }

    if (event.key === 'Escape' && this.activeSectionToolbarMenu()) {
      event.preventDefault();
      this.activeSectionToolbarMenu.set(null);
      this.isSectionBorderColorPickerOpen.set(false);
      this.isSectionBorderStylePickerOpen.set(false);
      return;
    }

  if (event.key === 'Escape' && this.activeButtonToolbarMenu()) {
    event.preventDefault();
    this.activeButtonToolbarMenu.set(null);
    return;
  }

  if (event.key === 'Escape' && this.activeImageToolbarMenu()) {
    event.preventDefault();
    this.activeImageToolbarMenu.set(null);
    this.isImageSettingsLinkPopupOpen.set(false);
    this.isImageBorderColorPickerOpen.set(false);
    this.isImageBorderStylePickerOpen.set(false);
    return;
  }

  if (event.key === 'Escape' && this.activeContainerToolbarMenu()) {
    event.preventDefault();
    this.activeContainerToolbarMenu.set(null);
    this.isContainerBorderColorPickerOpen.set(false);
    this.isContainerBorderStylePickerOpen.set(false);
    return;
  }

  if (event.key === 'Escape' && this.activeProductFeedToolbarMenu()) {
    event.preventDefault();
    this.activeProductFeedToolbarMenu.set(null);
    return;
  }

if (event.key === 'Escape' && this.croppingImageComponentId()) {
  event.preventDefault();
  this.exitImageCropMode();
  return;
}

    if (event.key === 'Escape' && this.isMediaManagerOpen()) {
      event.preventDefault();
      this.closeMediaManager();
      return;
    }

    if (event.key === 'Escape' && this.isPagesPanelOpen()) {
      event.preventDefault();
      this.isPagesPanelOpen.set(false);
      return;
    }

    if (event.key === 'Escape' && this.sectionAddMenuSectionId()) {
      event.preventDefault();
      this.sectionAddMenuSectionId.set(null);
      return;
    }

    if (event.key === 'Escape' && this.isAddElementsLibraryModalVisible()) {
      event.preventDefault();
      this.closeAddElementsLibraryModal();
      return;
    }

    if (event.key === 'Escape' && this.isLayersPopupOpen()) {
      event.preventDefault();
      this.closeLayersPopup();
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedComponentIds().length) {
      event.preventDefault();
      this.deleteSelectedComponents();
      return;
    }

    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedSectionId() && !this.hasComponentSelection()) {
      event.preventDefault();
      this.removeSection(this.selectedSectionId()!);
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) && this.selectedComponentIds().length) {
      event.preventDefault();
      const distance = event.shiftKey ? this.getSnapStep() : 1;
      switch (event.key) {
        case 'ArrowUp':
          this.nudgeSelectedComponents(0, -distance);
          break;
        case 'ArrowDown':
          this.nudgeSelectedComponents(0, distance);
          break;
        case 'ArrowLeft':
          this.nudgeSelectedComponents(-distance, 0);
          break;
        case 'ArrowRight':
          this.nudgeSelectedComponents(distance, 0);
          break;
      }
      return;
    }

    const ctrl = event.ctrlKey || event.metaKey;
    if (!ctrl || event.altKey) {
      return;
    }

    if (!event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault();
      this.undo();
      return;
    }

    if ((event.shiftKey && (event.key === 'z' || event.key === 'Z')) || event.key === 'y' || event.key === 'Y') {
      event.preventDefault();
      this.redo();
      return;
    }

    if (event.key === 'c' || event.key === 'C') {
      if (this.selectedComponentIds().length) {
        event.preventDefault();
        this.copySelectedComponents();
      }
      return;
    }

    if (event.key === 'v' || event.key === 'V') {
      if (this.componentClipboard()) {
        event.preventDefault();
        this.pasteComponentFromClipboard();
      }
      return;
    }

    if (event.key === 'd' || event.key === 'D') {
      if (this.selectedComponentIds().length) {
        event.preventDefault();
        this.duplicateSelectedComponents();
      }
      return;
    }

    if ((event.key === 'g' || event.key === 'G') && event.shiftKey) {
      event.preventDefault();
      this.ungroupSelectedComponents();
      return;
    }

    if (event.key === 'g' || event.key === 'G') {
      event.preventDefault();
      this.groupSelectedComponents();
      return;
    }

    if (event.key === '+' || event.key === '=' || event.key === 'Add') {
      event.preventDefault();
      this.setZoom(this.zoomPercent() + 10);
      return;
    }

    if (event.key === '-' || event.key === '_' || event.key === 'Subtract') {
      event.preventDefault();
      this.setZoom(this.zoomPercent() - 10);
    }
  }

  @HostListener('document:mousedown', ['$event'])
  handleDocumentMouseDown(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      this.isFormaMenuOpen.set(false);
      this.isAccountMenuOpen.set(false);
      this.isBrandKitPopupOpen.set(false);
      this.isZoomMenuOpen.set(false);
      this.isAddPageMenuOpen.set(false);
   this.sectionAddMenuSectionId.set(null);
   this.sectionOptionsMenuId.set(null);
   this.pageCardMenuId.set(null);
   this.activeTextToolbarMenu.set(null);
   this.activeImageToolbarMenu.set(null);
   this.isImageSettingsLinkPopupOpen.set(false);
   this.isImageBorderColorPickerOpen.set(false);
   this.isImageBorderStylePickerOpen.set(false);
   this.activeContainerToolbarMenu.set(null);
   this.isContainerBorderColorPickerOpen.set(false);
   this.isContainerBorderStylePickerOpen.set(false);
   this.activeSectionToolbarMenu.set(null);
   this.isSectionBorderColorPickerOpen.set(false);
   this.isSectionBorderStylePickerOpen.set(false);
   this.activeButtonToolbarMenu.set(null);
   this.activeProductFeedToolbarMenu.set(null);
   this.closeComponentContextMenu();
   return;
 }

    if (this.isEditingComponentText() && !target.closest('.storefront-editor__preview-component-text-editor')) {
      this.finishEditingComponentText();
    }

    if ((this.isFormaMenuOpen() || this.isAccountMenuOpen() || this.isZoomMenuOpen()) &&
      !target.closest('.storefront-editor__floating-shell')) {
      this.isFormaMenuOpen.set(false);
      this.isAccountMenuOpen.set(false);
      this.isZoomMenuOpen.set(false);
    }

    if (this.isBrandKitPopupOpen()) {
      if (!target.closest('.storefront-editor__brand-kit-panel, .storefront-editor__topbar-brand-trigger')) {
        this.isBrandKitPopupOpen.set(false);
      }
    }

    if (this.isAddPageMenuOpen()) {
      if (!target.closest('.storefront-editor__add-page-menu, .storefront-editor__pages-primary')) {
        this.isAddPageMenuOpen.set(false);
      }
    }

    if (this.sectionAddMenuSectionId()) {
      if (!target.closest('.storefront-editor__add-page-menu--section, .storefront-editor__preview-section-add')) {
        this.sectionAddMenuSectionId.set(null);
      }
    }

    if (this.isPagesPanelOpen()) {
      if (!target.closest('.storefront-editor__pages-panel, .storefront-editor__page-trigger, .storefront-editor__page-card-menu--floating')) {
        this.closePagesPanel();
      }
    }

    if (this.isAddElementsPanelOpen() && !this.isLibraryComponentDragging()) {
      if (!target.closest('.storefront-editor__add-elements-panel, .storefront-editor__add-button')) {
        this.closeAddElementsPanel();
      }
    }

    if (this.sectionOptionsMenuId()) {
      if (!target.closest('.storefront-editor__preview-section-menu, .storefront-editor__preview-section-rail-more')) {
        this.sectionOptionsMenuId.set(null);
      }
    }

    if (this.pageCardMenuId()) {
      if (!target.closest('.storefront-editor__page-card-menu, .storefront-editor__page-card-more')) {
        this.pageCardMenuId.set(null);
      }
    }

if (this.activeTextToolbarMenu()) {
  if (!target.closest('.storefront-editor__context-toolbar-shell')) {
     this.activeTextToolbarMenu.set(null);
  }
}

if (this.activeImageToolbarMenu()) {
  if (
    !target.closest(
      '.storefront-editor__context-toolbar-shell, .storefront-editor__image-toolbar-side-panel, .storefront-editor__image-settings-link-shell'
    )
  ) {
    this.activeImageToolbarMenu.set(null);
    this.isImageSettingsLinkPopupOpen.set(false);
    this.isImageBorderColorPickerOpen.set(false);
    this.isImageBorderStylePickerOpen.set(false);
  }
}

if (this.isImageSettingsLinkPopupOpen()) {
  if (!target.closest('.storefront-editor__image-settings-link-shell')) {
    this.isImageSettingsLinkPopupOpen.set(false);
  }
}

if (this.isImageBorderColorPickerOpen()) {
  if (!target.closest('.storefront-editor__image-borders-color-panel, .storefront-editor__image-border-color-trigger')) {
    this.isImageBorderColorPickerOpen.set(false);
  }
}

if (this.isImageBorderStylePickerOpen()) {
  if (!target.closest('.storefront-editor__image-border-style-menu, .storefront-editor__image-border-style-trigger')) {
    this.isImageBorderStylePickerOpen.set(false);
  }
}

if (this.activeContainerToolbarMenu()) {
  if (
    !target.closest(
      '.storefront-editor__context-toolbar-shell, .storefront-editor__container-toolbar-designs-panel'
    )
  ) {
    this.activeContainerToolbarMenu.set(null);
    this.isContainerBorderColorPickerOpen.set(false);
    this.isContainerBorderStylePickerOpen.set(false);
  }
}

if (this.isContainerBorderColorPickerOpen()) {
  if (!target.closest('.storefront-editor__container-borders-color-panel, .storefront-editor__container-border-color-trigger')) {
    this.isContainerBorderColorPickerOpen.set(false);
  }
}

if (this.isContainerBorderStylePickerOpen()) {
  if (!target.closest('.storefront-editor__container-border-style-menu, .storefront-editor__container-border-style-trigger')) {
    this.isContainerBorderStylePickerOpen.set(false);
  }
}

if (this.activeSectionToolbarMenu()) {
  if (!target.closest('.storefront-editor__context-toolbar-shell')) {
    this.activeSectionToolbarMenu.set(null);
    this.isSectionBorderColorPickerOpen.set(false);
    this.isSectionBorderStylePickerOpen.set(false);
  }
}

if (this.isSectionBorderColorPickerOpen()) {
  if (!target.closest('.storefront-editor__section-borders-color-panel, .storefront-editor__section-border-color-trigger')) {
    this.isSectionBorderColorPickerOpen.set(false);
  }
}

if (this.isSectionBorderStylePickerOpen()) {
  if (!target.closest('.storefront-editor__section-border-style-menu, .storefront-editor__section-border-style-trigger')) {
    this.isSectionBorderStylePickerOpen.set(false);
  }
}

if (this.activeButtonToolbarMenu()) {
  if (
    !target.closest(
      '.storefront-editor__context-toolbar-shell, .storefront-editor__button-toolbar-designs-panel, .storefront-editor__button-toolbar-side-panel'
    )
  ) {
    this.activeButtonToolbarMenu.set(null);
  }
}

if (this.activeProductFeedToolbarMenu()) {
  if (
    !target.closest(
      '.storefront-editor__context-toolbar-shell, .storefront-editor__product-feed-toolbar-designs-panel, .storefront-editor__product-feed-toolbar-side-panel'
    )
  ) {
    this.activeProductFeedToolbarMenu.set(null);
  }
}

 if (this.isComponentContextMenuOpen()) {
   if (!target.closest('.storefront-editor__component-context-menu')) {
     this.closeComponentContextMenu();
      }
    }
  }

  @HostListener('document:mousemove', ['$event'])
  handleComponentPointerMove(event: MouseEvent): void {
    if (this.activeColorCanvasDrag) {
      event.preventDefault();
      this.updateCustomColorFromCanvasEvent(event);
      return;
    }

  if (this.activeColorHueDrag) {
    event.preventDefault();
    this.updateCustomColorFromHueEvent(event);
    return;
  }

  if (this.activeButtonColorCanvasDrag) {
    event.preventDefault();
    this.updateButtonCustomColorFromCanvasEvent(event);
    return;
  }

  if (this.activeButtonColorHueDrag) {
    event.preventDefault();
    this.updateButtonCustomColorFromHueEvent(event);
    return;
  }

  if (this.activeContainerBackgroundColorCanvasDrag) {
    event.preventDefault();
    this.updateContainerBackgroundColorFromCanvasEvent(event);
    return;
  }

  if (this.activeContainerBackgroundColorHueDrag) {
    event.preventDefault();
    this.updateContainerBackgroundColorFromHueEvent(event);
    return;
  }

  if (this.activeContainerBorderColorCanvasDrag) {
    event.preventDefault();
    this.updateContainerBorderColorFromCanvasEvent(event);
    return;
  }

  if (this.activeContainerBorderColorHueDrag) {
    event.preventDefault();
    this.updateContainerBorderColorFromHueEvent(event);
    return;
  }

  if (this.activeSectionBackgroundColorCanvasDrag) {
    event.preventDefault();
    this.updateSectionBackgroundColorFromCanvasEvent(event);
    return;
  }

  if (this.activeSectionBackgroundColorHueDrag) {
    event.preventDefault();
    this.updateSectionBackgroundColorFromHueEvent(event);
    return;
  }

  if (this.activeSectionBorderColorCanvasDrag) {
    event.preventDefault();
    this.updateSectionBorderColorFromCanvasEvent(event);
    return;
  }

  if (this.activeSectionBorderColorHueDrag) {
    event.preventDefault();
    this.updateSectionBorderColorFromHueEvent(event);
    return;
  }

  if (this.activeImageBorderColorCanvasDrag) {
    event.preventDefault();
    this.updateImageBorderColorFromCanvasEvent(event);
    return;
  }

  if (this.activeImageBorderColorHueDrag) {
    event.preventDefault();
    this.updateImageBorderColorFromHueEvent(event);
    return;
  }

    if (this.activeAddElementsComponentDrag) {
      event.preventDefault();
      this.updateAddElementsComponentDrag(event);
      return;
    }

    if (this.activeSectionResize) {
      event.preventDefault();
      this.updateResizingSection(event);
      return;
    }

    if (this.activeSectionLayoutResize) {
      event.preventDefault();
      this.updateSectionLayoutResize(event);
      return;
    }

    if (this.activeSelectionDrag) {
      event.preventDefault();
      this.updateComponentSelectionBox(event);
      return;
    }

    if (this.activeImageCrop) {
      event.preventDefault();
      this.updateImageCropInteraction(event);
      return;
    }

    if (this.activeResize) {
      event.preventDefault();
      this.updateResizingComponent(event);
      return;
    }

    if (this.activeRotation) {
      event.preventDefault();
      this.updateRotatingComponent(event);
      return;
    }

    if (!this.activeComponentDrag) {
      return;
    }

    event.preventDefault();

    const bounds = this.getDraggedComponentsBounds(this.activeComponentDrag.components);
    const draggedRect = {
      left: event.clientX - this.activeComponentDrag.pointerOffsetX,
      top: event.clientY - this.activeComponentDrag.pointerOffsetY,
      width: bounds.width,
      height: bounds.height,
    };
    const targetContainer = this.getSectionContentElementForDraggedBounds(
      draggedRect,
      this.activeComponentDrag.sectionId
    );
    if (targetContainer) {
      const targetSectionId = targetContainer.dataset['sectionContentId'] ?? null;
      if (targetSectionId && targetSectionId !== this.activeComponentDrag.sectionId) {
        this.moveDraggedComponentsToSection(this.activeComponentDrag.sectionId, targetSectionId);
        this.activeComponentDrag.sectionId = targetSectionId;
      }
    }

    const containerAttachTarget = this.getContainerDropTargetForDraggedBounds(
      draggedRect,
      this.activeComponentDrag.sectionId,
      this.activeComponentDrag.components.map((component) => component.componentId)
    );
    const hoveredSectionId =
      targetContainer?.dataset['sectionContentId'] ?? this.activeComponentDrag.sectionId;
    this.componentAttachContainerTarget.set(containerAttachTarget);
    this.componentAttachSectionId.set(
      this.activeComponentDrag.sourceContainerId && !containerAttachTarget
        ? hoveredSectionId
        : null
    );

    const container =
      targetContainer ??
      document.querySelector(
        `.storefront-editor__preview-section-content[data-section-content-id="${this.activeComponentDrag.sectionId}"]`
      );

    if (!(container instanceof HTMLElement)) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const anchorX = event.clientX - rect.left - this.activeComponentDrag.pointerOffsetX;
    const anchorY = event.clientY - rect.top - this.activeComponentDrag.pointerOffsetY;
    const previewVisibleHeight = this.getPreviewVisibleHeightForSection(container);
    const minAnchorX = -bounds.width + 20;
    const maxAnchorX = rect.width - 20;
    const minAnchorY = -bounds.height + 20;
    const maxAnchorY = previewVisibleHeight - bounds.height - 20;
    const snappedBounds = this.snapDraggedBoundsToConstraints(
      this.activeComponentDrag.sectionId,
      this.activeComponentDrag.components.map((component) => component.componentId),
      {
        x: Math.max(minAnchorX, Math.min(anchorX, maxAnchorX)),
        y: Math.max(minAnchorY, Math.min(anchorY, maxAnchorY)),
        width: bounds.width,
        height: bounds.height,
      },
      rect.width,
      previewVisibleHeight
    );
    const clampedAnchorX = Math.max(minAnchorX, Math.min(snappedBounds.x, maxAnchorX));
    const clampedAnchorY = Math.max(minAnchorY, Math.min(snappedBounds.y, maxAnchorY));
    this.setSnapGuides(this.activeComponentDrag.sectionId, snappedBounds.guides);

    this.updateSectionComponentFrames(
      this.activeComponentDrag.sectionId,
      this.activeComponentDrag.components.map((component) => ({
        componentId: component.componentId,
        x: clampedAnchorX + (component.startX - bounds.x),
        y: clampedAnchorY + (component.startY - bounds.y),
      })),
      rect.width,
      rect.height,
      previewVisibleHeight,
      { transient: true, syncRail: false }
    );
  }

  @HostListener('document:mouseup', ['$event'])
handleComponentPointerUp(event: MouseEvent): void {
  if (this.activeColorCanvasDrag || this.activeColorHueDrag) {
    this.activeColorCanvasDrag = false;
    this.activeColorHueDrag = false;
    return;
  }

  if (this.activeButtonColorCanvasDrag || this.activeButtonColorHueDrag) {
    this.activeButtonColorCanvasDrag = false;
    this.activeButtonColorHueDrag = false;
    return;
  }

  if (this.activeContainerBackgroundColorCanvasDrag || this.activeContainerBackgroundColorHueDrag) {
    this.activeContainerBackgroundColorCanvasDrag = false;
    this.activeContainerBackgroundColorHueDrag = false;
    return;
  }

  if (this.activeContainerBorderColorCanvasDrag || this.activeContainerBorderColorHueDrag) {
    this.activeContainerBorderColorCanvasDrag = false;
    this.activeContainerBorderColorHueDrag = false;
    return;
  }

  if (this.activeSectionBackgroundColorCanvasDrag || this.activeSectionBackgroundColorHueDrag) {
    this.activeSectionBackgroundColorCanvasDrag = false;
    this.activeSectionBackgroundColorHueDrag = false;
    return;
  }

if (this.activeSectionBorderColorCanvasDrag || this.activeSectionBorderColorHueDrag) {
  this.activeSectionBorderColorCanvasDrag = false;
  this.activeSectionBorderColorHueDrag = false;
  return;
}

if (this.activeImageBorderColorCanvasDrag || this.activeImageBorderColorHueDrag) {
  this.activeImageBorderColorCanvasDrag = false;
  this.activeImageBorderColorHueDrag = false;
  return;
}

  if (this.activeImageCrop) {
    this.activeImageCrop = null;
    return;
  }

  if (this.activeAddElementsComponentDrag) {
    this.finishAddElementsComponentDrag(event);
    return;
  }

  if (this.activeSectionLayoutResize) {
    this.activeSectionLayoutResize = null;
    return;
  }

  const dragUndoSnapshot = this.activeComponentDragUndoSnapshot;
  if (this.activeComponentDrag) {
    this.finalizeDraggedComponentsLayoutSnap();
    const draggedComponentIds = this.activeComponentDrag.components.map((component) => component.componentId);
    const draggedAttachRootIds = this.getContainerAttachRootComponentIds(
      this.activeComponentDrag.sectionId,
      draggedComponentIds
    );
    const attachTarget = this.componentAttachContainerTarget();
    if (attachTarget?.sectionId === this.activeComponentDrag.sectionId) {
      this.updateComponentContainerParentIds(
        this.activeComponentDrag.sectionId,
        draggedAttachRootIds,
        attachTarget.containerId,
        { selectedSectionId: this.activeComponentDrag.sectionId, syncRail: false, transient: true }
      );
    } else if (
      this.activeComponentDrag.sourceContainerId &&
      this.componentAttachSectionId() === this.activeComponentDrag.sectionId
    ) {
      this.updateComponentContainerParentIds(
        this.activeComponentDrag.sectionId,
        draggedAttachRootIds,
        null,
        { selectedSectionId: this.activeComponentDrag.sectionId, syncRail: false, transient: true }
      );
    }
    this.elevateDraggedComponentsAboveContainers(
      this.activeComponentDrag.sectionId,
      draggedComponentIds
    );
  }
  this.clearSnapGuides();

  if (dragUndoSnapshot) {
    const current = this.workingStorefront();
    if (current) {
      const afterSnapshot = this.createEditorSnapshot(current, this.selectedSectionId());
      if (JSON.stringify(afterSnapshot) !== JSON.stringify(dragUndoSnapshot)) {
        this.pushUndoSnapshot(dragUndoSnapshot);
      }
    }
  }

  this.activeComponentDragUndoSnapshot = null;
  this.activeComponentDrag = null;
    this.componentAttachContainerTarget.set(null);
    this.activeResize = null;
    this.activeRotation = null;
    this.activeSectionResize = null;
    this.isResizingComponent.set(false);
    this.isRotatingComponent.set(false);
    this.isResizingSection.set(false);
    this.componentAttachSectionId.set(null);
    this.finishComponentSelectionBox();
  }

  loadEditor(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Project not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectService
      .getProjectById(projectId)
      .pipe(
        switchMap((project) => {
          this.project.set(project);
          this.projectWorkspaceContextService.setProjectType(projectId, project.type);

          if (project.type !== 'ECOMMERCE') {
            return of({
              storefront: null,
              catalogProducts: [] as ProjectCatalogProduct[],
              projectMedia: [],
            });
          }

          return forkJoin({
            storefront: this.projectStorefrontService.getStorefront(projectId),
            catalogProducts: this.projectCatalogService.getCatalogPage(projectId, {}).pipe(
              switchMap((catalogPage) => of(catalogPage.products))
            ),
            projectMedia: this.projectService.getProjectMedia(projectId).pipe(catchError(() => of([]))),
          });
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ storefront, catalogProducts, projectMedia }) => {
          this.products.set(catalogProducts);
          this.mediaAssets.set(this.buildMediaManagerAssets(projectMedia, catalogProducts));

          if (!storefront) {
            this.storefront.set(null);
            this.workingStorefront.set(null);
            this.editorSession.set(this.createDefaultEditorSession());
            this.undoStack.set([]);
            this.redoStack.set([]);
            this.selectedSectionId.set(null);
            return;
          }

          const snapshot = this.normalizeStorefront(storefront);
          this.storefront.set(snapshot);
          this.workingStorefront.set(this.cloneStorefront(snapshot));
          const editorSession = this.normalizeEditorSession(snapshot.editorSession, snapshot.draftHomepage);
          this.editorSession.set(editorSession);
          this.loadSelectedManagedPageIntoWorkingStorefront(editorSession.selectedManagedPageId ?? 'home', editorSession.managedPages ?? []);
          this.undoStack.set([]);
          this.redoStack.set([]);
          this.selectedSectionId.set(editorSession.selectedSectionId);
          this.viewport.set(editorSession.viewport);
          this.zoomPercent.set(editorSession.zoomPercent);
          setTimeout(() => this.updatePreviewStageScrollbarState(), 0);
        },
        error: () => {
          this.project.set(null);
          this.storefront.set(null);
          this.workingStorefront.set(null);
            this.editorSession.set(this.createDefaultEditorSession());
            this.undoStack.set([]);
              this.redoStack.set([]);
              this.selectedComponentId.set(null);
              this.selectedComponentIds.set([]);
              this.isolatedGroupComponentId.set(null);
              this.products.set([]);
            this.errorMessage.set('Unable to load the storefront editor right now.');
        },
      });
  }

  selectPageSettings(): void {
    this.sidebarMode.set('page');
    this.selectedSectionId.set(null);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.activeSectionToolbarMenu.set(null);
    this.isSectionBorderColorPickerOpen.set(false);
    this.isSectionBorderStylePickerOpen.set(false);
    this.activeContainerToolbarMenu.set(null);
    this.isContainerBorderColorPickerOpen.set(false);
    this.isContainerBorderStylePickerOpen.set(false);
    this.syncEditorSessionState({ selectedSectionId: null });
  }

  selectSection(sectionId: string): void {
    if (this.isEditingComponentText()) {
      this.finishEditingComponentText();
    }
    this.sidebarMode.set('structure');
    this.selectedSectionId.set(sectionId);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.sectionOptionsMenuId.set(null);
    this.activeSectionToolbarMenu.set(null);
    this.isSectionBorderColorPickerOpen.set(false);
    this.isSectionBorderStylePickerOpen.set(false);
    this.activeTextToolbarMenu.set(null);
    this.activeContainerToolbarMenu.set(null);
    this.isContainerBorderColorPickerOpen.set(false);
    this.isContainerBorderStylePickerOpen.set(false);
    this.activeButtonToolbarMenu.set(null);
    this.activeProductFeedToolbarMenu.set(null);
    this.syncEditorSessionState({ selectedSectionId: sectionId });
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  clearSectionSelection(): void {
    this.selectedSectionId.set(null);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.sectionOptionsMenuId.set(null);
    this.activeSectionToolbarMenu.set(null);
    this.isSectionBorderColorPickerOpen.set(false);
    this.isSectionBorderStylePickerOpen.set(false);
    this.activeContainerToolbarMenu.set(null);
    this.isContainerBorderColorPickerOpen.set(false);
    this.isContainerBorderStylePickerOpen.set(false);
    this.syncEditorSessionState({ selectedSectionId: null });
  }

  setViewport(viewport: StorefrontEditorViewport): void {
    this.viewport.set(viewport);
    this.syncEditorSessionState({ viewport });
    setTimeout(() => {
      this.updatePreviewStageScrollbarState();
      this.refreshSectionLayoutAssignments();
    }, 0);
  }

  toggleSnapToGrid(): void {
    this.snapToGridEnabled.update((value) => !value);
    this.clearSnapGuides();
  }

  cycleSnapSpacingToken(): void {
    const steps = [...ProjectStorefrontEditor.SNAP_SPACING_STEPS];
    const currentIndex = steps.indexOf(this.snapSpacingToken());
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % steps.length : 1;
    this.snapSpacingToken.set(steps[nextIndex] ?? 8);
    this.clearSnapGuides();
  }

  toggleAspectRatioLock(): void {
    this.lockAspectRatioEnabled.update((value) => !value);
  }

  alignSelectedComponents(mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
    const section = this.selectedSection();
    if (!section) {
      return;
    }

    const selectedComponents = this.getSelectedRootComponentsForBatchAction(section);
    if (selectedComponents.length < 2) {
      return;
    }

    const bounds = this.getComponentBounds(selectedComponents);
    const dimensions = this.getSectionContentDimensions(section.id);
    const containerWidth = dimensions?.width ?? 99999;
    const containerHeight = dimensions?.height ?? 99999;

    const positions = selectedComponents.map((component) => {
        const frame = this.getComponentFrame(component);
        switch (mode) {
          case 'left':
            return { componentId: component.id, x: bounds.x, y: frame.y };
          case 'center':
            return { componentId: component.id, x: bounds.x + ((bounds.width - frame.width) / 2), y: frame.y };
          case 'right':
            return { componentId: component.id, x: bounds.x + bounds.width - frame.width, y: frame.y };
          case 'top':
            return { componentId: component.id, x: frame.x, y: bounds.y };
          case 'middle':
            return { componentId: component.id, x: frame.x, y: bounds.y + ((bounds.height - frame.height) / 2) };
          case 'bottom':
            return { componentId: component.id, x: frame.x, y: bounds.y + bounds.height - frame.height };
        }
      });

    this.updateSectionComponentFrames(
      section.id,
      this.expandPositionUpdatesForAttachedDescendants(section, positions),
      containerWidth,
      containerHeight
    );
    this.closeComponentContextMenu();
  }

  distributeSelectedComponents(axis: 'horizontal' | 'vertical'): void {
    const section = this.selectedSection();
    if (!section) {
      return;
    }

    const selectedComponents = this.getSelectedRootComponentsForBatchAction(section);
    if (selectedComponents.length < 3) {
      return;
    }

    const sortedComponents = [...selectedComponents].sort((left, right) => {
      const leftFrame = this.getComponentFrame(left);
      const rightFrame = this.getComponentFrame(right);
      return axis === 'horizontal' ? leftFrame.x - rightFrame.x : leftFrame.y - rightFrame.y;
    });
    const bounds = this.getComponentBounds(sortedComponents);
    const dimensions = this.getSectionContentDimensions(section.id);
    const containerWidth = dimensions?.width ?? 99999;
    const containerHeight = dimensions?.height ?? 99999;

    const totalSize = sortedComponents.reduce((sum, component) => {
      const frame = this.getComponentFrame(component);
      return sum + (axis === 'horizontal' ? frame.width : frame.height);
    }, 0);
    const availableGap = Math.max(0, (axis === 'horizontal' ? bounds.width : bounds.height) - totalSize);
    const gap = sortedComponents.length > 1 ? availableGap / (sortedComponents.length - 1) : 0;

    let cursor = axis === 'horizontal' ? bounds.x : bounds.y;
    const positions = sortedComponents.map((component) => {
      const frame = this.getComponentFrame(component);
      const position =
        axis === 'horizontal'
          ? { componentId: component.id, x: cursor, y: frame.y }
          : { componentId: component.id, x: frame.x, y: cursor };
      cursor += (axis === 'horizontal' ? frame.width : frame.height) + gap;
      return position;
    });

    this.updateSectionComponentFrames(
      section.id,
      this.expandPositionUpdatesForAttachedDescendants(section, positions),
      containerWidth,
      containerHeight
    );
    this.closeComponentContextMenu();
  }

  cycleSelectedContainerLayout(): void {
    const component = this.selectedContainerComponent();
    if (!component) {
      return;
    }

    const layouts: StorefrontEditorContainerNode['props']['layout'][] = ['stack', 'row', 'grid'];
    const currentIndex = layouts.indexOf(component.props.layout);
    const nextLayout = layouts[(currentIndex + 1) % layouts.length] ?? 'stack';
    this.updateSelectedContainerProps({ layout: nextLayout });
  }

  adjustSelectedContainerGap(delta: number): void {
    const component = this.selectedContainerComponent();
    if (!component) {
      return;
    }

    this.updateSelectedContainerProps({ gap: Math.max(0, component.props.gap + delta) });
  }

  adjustSelectedContainerPadding(delta: number): void {
    const component = this.selectedContainerComponent();
    if (!component) {
      return;
    }

    this.updateSelectedContainerProps({ padding: Math.max(0, component.props.padding + delta) });
  }

  cycleSelectedContainerJustify(): void {
    const component = this.selectedContainerComponent();
    if (!component) {
      return;
    }

    const options: StorefrontEditorContainerNode['props']['justify'][] = ['start', 'center', 'end', 'space-between'];
    const currentIndex = options.indexOf(component.props.justify);
    const next = options[(currentIndex + 1) % options.length] ?? 'start';
    this.updateSelectedContainerProps({ justify: next });
  }

  cycleSelectedContainerAlign(): void {
    const component = this.selectedContainerComponent();
    if (!component) {
      return;
    }

    const options: StorefrontEditorContainerNode['props']['align'][] = ['start', 'center', 'end', 'stretch'];
    const currentIndex = options.indexOf(component.props.align);
    const next = options[(currentIndex + 1) % options.length] ?? 'stretch';
    this.updateSelectedContainerProps({ align: next });
  }

  toggleSelectedContainerWrap(): void {
    const component = this.selectedContainerComponent();
    if (!component) {
      return;
    }

    this.updateSelectedContainerProps({ wrap: !component.props.wrap });
  }

  toggleFormaMenu(): void {
    const next = !this.isFormaMenuOpen();
    this.closeFloatingUi();
    this.isFormaMenuOpen.set(next);
  }

  toggleAccountMenu(): void {
    const next = !this.isAccountMenuOpen();
    this.closeFloatingUi();
    this.isAccountMenuOpen.set(next);
  }

  toggleZoomMenu(): void {
    const next = !this.isZoomMenuOpen();
    this.closeFloatingUi();
    this.isZoomMenuOpen.set(next);
  }

  toggleBrandKitPopup(): void {
    const next = !this.isBrandKitPopupOpen();
    this.closeFloatingUi();
    this.isBrandKitPopupOpen.set(next);
    this.isBrandKitCustomizerOpen.set(false);
  }

  openBrandKitCustomizer(): void {
    this.isBrandKitCustomizerOpen.set(true);
  }

  closeBrandKitCustomizer(): void {
    this.isBrandKitCustomizerOpen.set(false);
  }

  applyBrandKitPreset(presetId: string): void {
    this.activeBrandKitPresetId.set(presetId);
    this.isBrandKitCustomizerOpen.set(false);
    this.toastService.success('Brand kit preset applied.');
  }

  toggleAddElementsPanel(): void {
    if (this.isAddElementsPanelOpen() || this.isAddElementsPanelClosing()) {
      this.closeAddElementsPanel();
      return;
    }

    if (this.addElementsPanelCloseTimer) {
      clearTimeout(this.addElementsPanelCloseTimer);
      this.addElementsPanelCloseTimer = null;
    }

    this.closeFloatingUi();
    this.isAddElementsPanelClosing.set(false);
    this.isAddElementsPanelOpen.set(true);
    setTimeout(() => {
      this.updateAddElementsTabScrollState();
      this.updateAddElementsSubmenuScrollState();
    }, 0);
  }

  closeAddElementsPanel(): void {
    if (!this.isAddElementsPanelOpen() && !this.isAddElementsPanelClosing()) {
      return;
    }

    if (this.addElementsPanelCloseTimer) {
      clearTimeout(this.addElementsPanelCloseTimer);
    }

    this.isAddElementsPanelOpen.set(false);
    this.isAddElementsPanelClosing.set(true);
    this.addElementsPanelCloseTimer = setTimeout(() => {
      this.isAddElementsPanelClosing.set(false);
      this.canScrollAddElementsTabsLeft.set(false);
      this.canScrollAddElementsTabsRight.set(false);
      this.canScrollAddElementsSubmenuLeft.set(false);
      this.canScrollAddElementsSubmenuRight.set(false);
      this.addElementsPanelCloseTimer = null;
    }, ProjectStorefrontEditor.ADD_ELEMENTS_PANEL_CLOSE_MS);
  }

  closeAddElementsPanelImmediately(): void {
    if (this.addElementsPanelCloseTimer) {
      clearTimeout(this.addElementsPanelCloseTimer);
      this.addElementsPanelCloseTimer = null;
    }

    this.isAddElementsPanelOpen.set(false);
    this.isAddElementsPanelClosing.set(false);
    this.canScrollAddElementsTabsLeft.set(false);
    this.canScrollAddElementsTabsRight.set(false);
    this.canScrollAddElementsSubmenuLeft.set(false);
    this.canScrollAddElementsSubmenuRight.set(false);
  }

  openAddElementsLibraryModal(): void {
    if (this.addElementsLibraryModalCloseTimer) {
      clearTimeout(this.addElementsLibraryModalCloseTimer);
      this.addElementsLibraryModalCloseTimer = null;
    }

    this.closeAddElementsPanelImmediately();
    this.isFormaMenuOpen.set(false);
    this.isAccountMenuOpen.set(false);
    this.isZoomMenuOpen.set(false);
    this.closePagesPanel();
    this.closeManagePages();
    this.closePageDesignPicker();
    this.closeSectionLibrary();
    this.closeSectionOptionsMenu();
    this.isMediaManagerOpen.set(false);
    this.pageCardMenuId.set(null);
    this.isAddElementsLibraryModalClosing.set(false);
    this.isAddElementsLibraryModalOpen.set(true);
    this.hoveredAddElementsLibraryItemId.set(this.visibleAddElementsLibraryItems()[0]?.id ?? null);
    setTimeout(() => {
      this.updateAddElementsTabScrollState();
      this.updateAddElementsSubmenuScrollState();
    }, 0);
  }

  closeAddElementsLibraryModal(): void {
    if (!this.isAddElementsLibraryModalOpen() && !this.isAddElementsLibraryModalClosing()) {
      return;
    }

    if (this.addElementsLibraryModalCloseTimer) {
      clearTimeout(this.addElementsLibraryModalCloseTimer);
    }

    this.isAddElementsLibraryModalOpen.set(false);
    this.isAddElementsLibraryModalClosing.set(true);
    this.hoveredAddElementsLibraryItemId.set(null);
    this.addElementsLibraryModalCloseTimer = setTimeout(() => {
      this.isAddElementsLibraryModalClosing.set(false);
      this.addElementsLibraryModalCloseTimer = null;
    }, ProjectStorefrontEditor.ADD_ELEMENTS_LIBRARY_MODAL_CLOSE_MS);
  }

  toggleLayersPopup(): void {
    if (this.isLayersPopupOpen()) {
      this.closeLayersPopup();
      return;
    }

    this.closeFloatingUi();
    this.isLayersPopupOpen.set(true);
  }

  closeLayersPopup(): void {
    this.isLayersPopupOpen.set(false);
  }

  selectLayer(componentId: string, event?: Event): void {
    const sectionId = this.selectedSectionId();
    if (!sectionId) {
      return;
    }

    this.selectComponent(sectionId, componentId, event instanceof MouseEvent ? event : undefined);
  }

  toggleLayerVisibility(componentId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    const sectionId = this.selectedSectionId();
    if (!sectionId) {
      return;
    }

    const component = this.findSectionComponent(sectionId, componentId);
    if (!component) {
      return;
    }

    this.updateComponentNode(sectionId, componentId, (component) => ({
      ...component,
      isVisible: !component.isVisible,
    }));

    if (component.isVisible && this.selectedComponentIds().includes(componentId)) {
      const nextSelectedIds = this.selectedComponentIds().filter((id) => id !== componentId);
      this.selectedComponentIds.set(nextSelectedIds);
      this.selectedComponentId.set(nextSelectedIds[nextSelectedIds.length - 1] ?? null);

      if (this.croppingImageComponentId() === componentId) {
        this.exitImageCropMode();
      }
      if (this.editingComponentNameId() === componentId) {
        this.cancelComponentNameEditing();
      }
      if (this.editingComponentTextId() === componentId) {
        this.cancelComponentTextEditing();
      }
    }
  }

  toggleLayerLock(componentId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    const sectionId = this.selectedSectionId();
    if (!sectionId) {
      return;
    }

    this.updateComponentNode(sectionId, componentId, (component) => ({
      ...component,
      isLocked: !component.isLocked,
    }));
  }

  setActiveAddElementsCategory(category: StorefrontEditorAddElementsCategory): void {
    this.activeAddElementsCategory.set(category);
    this.activeAddElementsSubcategory.set(this.getDefaultAddElementsSubcategory(category));
    setTimeout(() => {
      this.updateAddElementsTabScrollState();
      this.updateAddElementsSubmenuScrollState();
    }, 0);
  }

  setActiveAddElementsSubcategory(subcategoryId: string): void {
    this.activeAddElementsSubcategory.set(subcategoryId);
    setTimeout(() => this.updateAddElementsSubmenuScrollState(), 0);
  }

  addElementsCountForCategory(category: StorefrontEditorAddElementsCategory): number {
    return filterStorefrontEditorAddElementsLibraryItems(
      this.addElementsLibraryItems,
      category,
      'all',
      ''
    ).length;
  }

  setHoveredAddElementsLibraryItem(itemId: string | null): void {
    this.hoveredAddElementsLibraryItemId.set(itemId);
  }

  addElementsQuickTag(item: StorefrontEditorAddElementsLibraryItem): string {
    switch (item.id) {
      case 'text':
        return 'Best for hero';
      case 'button':
        return 'Drive clicks';
      case 'image':
        return 'Visual anchor';
      case 'faq':
        return 'Support';
      case 'contact-form':
        return 'Lead capture';
      case 'product-feed':
        return 'Store';
      case 'social-links':
        return 'Footer';
      case 'spacer':
        return 'Layout';
      case 'icon':
        return 'Highlights';
      case 'container':
        return 'Structure';
      case 'graphic':
        return 'Decorative';
      case 'blog-feed':
        return 'Editorial';
      default:
        return item.category;
    }
  }

  addElementsPlacementHint(item: StorefrontEditorAddElementsLibraryItem): string {
    switch (item.id) {
      case 'text':
        return 'Great for hero intros, section headings, and landing page messaging.';
      case 'button':
        return 'Use in hero areas, promo sections, and product call-to-actions.';
      case 'image':
        return 'Best for banners, product storytelling, and visual breaks.';
      case 'faq':
        return 'Useful for shipping, returns, sizing, and support pages.';
      case 'contact-form':
        return 'Ideal for contact sections, wholesale requests, and support pages.';
      case 'product-feed':
        return 'Use in homepage highlights, collection previews, and featured rows.';
      case 'social-links':
        return 'Fits headers, contact areas, and footer link groups.';
      case 'spacer':
        return 'Helpful when sections feel cramped or need clearer separation.';
      case 'icon':
        return 'Works well in feature rows, contact details, and trust badges.';
      case 'container':
        return 'Useful for grouping custom layouts inside a section.';
      case 'graphic':
        return 'Adds visual rhythm without adding more copy.';
      case 'blog-feed':
        return 'Best for content hubs, editorial pages, and resource areas.';
      default:
        return item.description;
    }
  }

  private buildAddElementsBrowserGroup(
    id: string,
    title: string,
    description: string,
    itemIds: string[]
  ): AddElementsBrowserGroup {
    const items = itemIds
      .map((itemId) => this.visibleAddElementsLibraryItems().find((item) => item.id === itemId))
      .filter((item): item is StorefrontEditorAddElementsLibraryItem => Boolean(item));

    return { id, title, description, items };
  }

  private isPopularAddElementsItem(itemId: string): boolean {
    return ['text', 'button', 'image', 'faq', 'contact-form', 'product-feed'].includes(itemId);
  }

  scrollAddElementsTabs(direction: 'left' | 'right'): void {
    const tabs = this.getAddElementsTabsElement();
    if (!tabs) {
      return;
    }

    const delta = Math.max(180, Math.round(tabs.clientWidth * 0.55));
    tabs.scrollBy({
      left: direction === 'right' ? delta : -delta,
      behavior: 'smooth',
    });

    setTimeout(() => this.updateAddElementsTabScrollState(), 220);
  }

  updateAddElementsTabScrollState(): void {
    const tabs = this.getAddElementsTabsElement();
    if (!tabs) {
      this.canScrollAddElementsTabsLeft.set(false);
      this.canScrollAddElementsTabsRight.set(false);
      return;
    }

    const maxScrollLeft = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
    this.canScrollAddElementsTabsLeft.set(tabs.scrollLeft > 4);
    this.canScrollAddElementsTabsRight.set(tabs.scrollLeft < maxScrollLeft - 4);
  }

  scrollAddElementsSubmenu(direction: 'left' | 'right'): void {
    const submenu = this.getAddElementsSubmenuElement();
    if (!submenu) {
      return;
    }

    const delta = Math.max(180, Math.round(submenu.clientWidth * 0.55));
    submenu.scrollBy({
      left: direction === 'right' ? delta : -delta,
      behavior: 'smooth',
    });

    setTimeout(() => this.updateAddElementsSubmenuScrollState(), 220);
  }

  updateAddElementsSubmenuScrollState(): void {
    const submenu = this.getAddElementsSubmenuElement();
    if (!submenu) {
      this.canScrollAddElementsSubmenuLeft.set(false);
      this.canScrollAddElementsSubmenuRight.set(false);
      return;
    }

    const maxScrollLeft = Math.max(0, submenu.scrollWidth - submenu.clientWidth);
    this.canScrollAddElementsSubmenuLeft.set(submenu.scrollLeft > 4);
    this.canScrollAddElementsSubmenuRight.set(submenu.scrollLeft < maxScrollLeft - 4);
  }

  insertComponentFromLibrary(item: StorefrontEditorAddElementsLibraryItem): void {
    const selectedSection = this.selectedSection();
    if (!selectedSection) {
      this.toastService.info('Select a section first to add a component inside it.');
      return;
    }

    const nextComponent = this.buildLibraryComponentForSection(item, selectedSection.id);
    const layoutPlacement = this.resolveSectionLayoutPlacementForComponent(selectedSection.id, nextComponent);
    if (layoutPlacement) {
      Object.assign(nextComponent, this.writeComponentFrame(nextComponent, layoutPlacement.frame));
    }
    if (this.insertComponentIntoSelectedContainerIfPossible(selectedSection.id, nextComponent)) {
      this.closeAddElementsPanel();
      this.closeAddElementsLibraryModal();
      return;
    }
    this.insertComponentIntoSection(selectedSection.id, nextComponent, {
      syncRail: true,
      layoutAssignment: layoutPlacement?.assignment ?? null,
    });
    this.closeAddElementsPanel();
    this.closeAddElementsLibraryModal();
  }

  startAddElementsComponentDrag(item: StorefrontEditorAddElementsLibraryItem, event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const rect = target.getBoundingClientRect();
    this.closeAddElementsPanelImmediately();
    this.closeAddElementsLibraryModal();
    this.activeAddElementsComponentDrag = {
      itemId: item.id,
      pointerOffsetX: event.clientX - rect.left,
      pointerOffsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    this.draggedAddElementsItemId.set(item.id);
    this.draggedAddElementsPreviewPosition.set({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
    event.preventDefault();
  }

  endAddElementsComponentDrag(): void {
    this.activeAddElementsComponentDrag = null;
    this.draggedAddElementsItemId.set(null);
    this.draggedAddElementsPreviewPosition.set(null);
    this.componentAttachSectionId.set(null);
  }

  isLibraryComponentDragging(): boolean {
    return this.draggedAddElementsItemId() !== null;
  }

  enterLibraryComponentAttach(event: DragEvent, sectionId: string): void {
    this.allowLibraryComponentAttach(event, sectionId);
  }

  allowLibraryComponentAttach(event: DragEvent, sectionId: string): void {
    if (!this.draggedAddElementsItemId()) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.componentAttachSectionId.set(sectionId);
  }

  leaveLibraryComponentAttach(sectionId: string): void {
    if (this.componentAttachSectionId() === sectionId) {
      this.componentAttachSectionId.set(null);
    }
  }

  dropLibraryComponentIntoSection(event: DragEvent, sectionId: string): void {
    const itemId =
      this.draggedAddElementsItemId() ||
      event.dataTransfer?.getData('text/storefront-editor-component-library-item') ||
      null;
    if (!itemId) {
      return;
    }

    event.preventDefault();
    const item = this.addElementsLibraryItems.find((candidate) => candidate.id === itemId);
    if (!item) {
      this.endAddElementsComponentDrag();
      return;
    }

    const nextComponent = this.buildLibraryComponentForSection(item, sectionId);
    const nextFrame = this.getDropFrameFromEvent(sectionId, item.componentType, event) ?? this.getComponentFrame(nextComponent);
    Object.assign(nextComponent, this.writeComponentFrame(nextComponent, nextFrame));
    const layoutAssignment = this.resolveSectionLayoutAssignmentForFrame(
      sectionId,
      nextComponent.id,
      this.getComponentFrame(nextComponent)
    );
    this.insertComponentIntoSection(sectionId, nextComponent, {
      selectedSectionId: sectionId,
      syncRail: true,
      layoutAssignment,
    });
    this.endAddElementsComponentDrag();
  }

  selectComponent(sectionId: string, componentId: string, event?: MouseEvent): void {
    if (event?.type === 'click' && this.suppressNextComponentClickSelectionId === componentId) {
      this.suppressNextComponentClickSelectionId = null;
      event.stopPropagation();
      return;
    }

    event?.stopPropagation();
    if (this.isEditingComponentText() && this.editingComponentTextId() !== componentId) {
      this.finishEditingComponentText();
    }
    this.selectedSectionId.set(sectionId);
    this.activeSectionToolbarMenu.set(null);
    this.isSectionBorderColorPickerOpen.set(false);
    this.isSectionBorderStylePickerOpen.set(false);
    const isToggleSelection = Boolean(event?.ctrlKey || event?.metaKey);
    const currentIds = this.selectedComponentIds();
    if (isToggleSelection) {
      const alreadySelected = currentIds.includes(componentId);
      const nextIds = alreadySelected
        ? currentIds.filter((id) => id !== componentId)
        : [...currentIds, componentId];
      this.selectedComponentIds.set(nextIds);
      this.selectedComponentId.set(nextIds[nextIds.length - 1] ?? null);
    } else if (
      currentIds.length > 1 &&
      currentIds.includes(componentId)
    ) {
      this.selectedComponentId.set(componentId);
    } else {
      this.selectedComponentId.set(componentId);
      this.selectedComponentIds.set([componentId]);
    }

    if (!isToggleSelection) {
      this.isolatedGroupComponentId.set(null);
    }

    this.closeComponentContextMenu();
    this.sectionOptionsMenuId.set(null);
    this.syncEditorSessionState({ selectedSectionId: sectionId }, false);
  }

  isSectionActivelySelected(sectionId: string): boolean {
    return this.selectedSectionId() === sectionId && !this.hasComponentSelection();
  }

  beginComponentMove(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isImageCropModeForComponent(componentId)) {
      return;
    }

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    if (!section || !component || component.isLocked || !component.isVisible) {
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const sectionComponents = section ? this.readSectionComponents(section) : [];
    const selectedIds = new Set(this.selectedComponentIds());
    const dragComponents = sectionComponents.filter((item) => {
      if (component.groupId && this.isolatedGroupComponentId() !== component.id) {
        return item.groupId === component.groupId;
      }

      return selectedIds.has(item.id)
        ? selectedIds.has(componentId)
        : item.id === componentId;
    });
    const dragComponentIds = new Set((dragComponents.length ? dragComponents : [component]).map((item) => item.id));
    if (component.type === 'container') {
      this.getContainerAssociatedComponents(sectionComponents, component).forEach((item) => {
        dragComponentIds.add(item.id);
      });
    }
    const effectiveComponents = sectionComponents.filter((item) => dragComponentIds.has(item.id));
    const orderedComponents = [...effectiveComponents].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const dragBounds = this.getDraggedComponentsBounds(orderedComponents.map((item) => {
      const frame = this.getComponentFrame(item);
      return {
        startX: frame.x,
        startY: frame.y,
        width: frame.width,
        height: frame.height,
      };
    }));
    const container = target.closest('.storefront-editor__preview-section-content');
    const containerRect = container instanceof HTMLElement ? container.getBoundingClientRect() : target.getBoundingClientRect();
    this.activeComponentDrag = {
      sectionId,
      sourceContainerId: component.parentContainerId ?? null,
      pointerOffsetX: event.clientX - (containerRect.left + dragBounds.x),
      pointerOffsetY: event.clientY - (containerRect.top + dragBounds.y),
      components: orderedComponents.map((item) => {
        const frame = this.getComponentFrame(item);
        return {
          componentId: item.id,
          startX: frame.x,
          startY: frame.y,
          width: frame.width,
          height: frame.height,
        };
      }),
      };

    this.componentAttachContainerTarget.set(null);
    this.componentAttachSectionId.set(null);

    const storefront = this.workingStorefront();
    this.activeComponentDragUndoSnapshot = storefront
      ? this.createEditorSnapshot(storefront, this.selectedSectionId())
      : null;

    this.removeSectionLayoutAssignments(
      sectionId,
      orderedComponents.map((item) => item.id),
      { selectedSectionId: sectionId, syncRail: false, transient: true }
    );

    this.suppressNextComponentClickSelectionId = componentId;
    this.selectComponent(sectionId, componentId, event);
  }

  isolateGroupedComponent(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectComponent(sectionId, componentId, event);
    this.isolatedGroupComponentId.set(componentId);
  }

  startComponentReorder(componentId: string, event: DragEvent): void {
    this.draggedComponentId.set(componentId);
    event.dataTransfer?.setData('text/plain', componentId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  allowComponentDrop(event: DragEvent, targetComponentId: string): void {
    event.preventDefault();
    this.componentReorderTargetId.set(targetComponentId);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  clearComponentDropTarget(): void {
    this.componentReorderTargetId.set(null);
  }

  dropComponentReorder(event: DragEvent, targetComponentId: string): void {
    event.preventDefault();
    const draggedComponentId =
      this.draggedComponentId() || event.dataTransfer?.getData('text/plain') || null;
    const section = this.selectedSection();

    this.draggedComponentId.set(null);
    this.componentReorderTargetId.set(null);

    if (!section || !draggedComponentId || draggedComponentId === targetComponentId) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const components = [...this.readSectionComponents(item)].sort((left, right) => (right.zIndex ?? 0) - (left.zIndex ?? 0));
          const draggedIndex = components.findIndex((component) => component.id === draggedComponentId);
          const targetIndex = components.findIndex((component) => component.id === targetComponentId);
          if (draggedIndex < 0 || targetIndex < 0) {
            return item;
          }

          const [draggedComponent] = components.splice(draggedIndex, 1);
          const nextTargetIndex = components.findIndex((component) => component.id === targetComponentId);
          const insertionIndex = draggedIndex < targetIndex ? nextTargetIndex + 1 : nextTargetIndex;
          components.splice(insertionIndex, 0, draggedComponent);
          return this.writeSectionComponents(
            item,
            components.map((component, index, orderedComponents) => ({
              ...component,
              zIndex: orderedComponents.length - index,
            }))
          );
        }),
      },
    }), { syncRail: false });
  }

  endComponentReorder(): void {
    this.draggedComponentId.set(null);
    this.componentReorderTargetId.set(null);
  }

  removeSelectedComponent(): void {
    this.deleteSelectedComponents();
  }

  deleteSelectedComponents(): void {
    const section = this.selectedSection();
    const componentIds = this.selectedComponentIds();
    if (!section || !componentIds.length) {
      return;
    }

    const removableIds = new Set(
      this.getSelectedComponentsForBatchAction(section)
        .filter((component) => !component.isLocked)
        .map((component) => component.id)
    );
    if (!removableIds.size) {
      return;
    }
    this.applyStorefrontMutation((storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          return this.writeSectionComponents(
            item,
            this.readSectionComponents(item).filter((component) => !removableIds.has(component.id))
          );
        }),
      },
    }), { syncRail: false });

      this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
      this.closeComponentContextMenu();
  }

  copySelectedComponents(): void {
    const section = this.selectedSection();
    const selectedIds = new Set(this.selectedComponentIds());
    if (!section || !selectedIds.size) {
      return;
    }

    const componentsToCopy = this.getSelectedComponentsForBatchAction(section);
    if (!componentsToCopy.length) {
      return;
    }

    this.componentClipboard.set(
      JSON.parse(JSON.stringify(componentsToCopy)) as StorefrontEditorComponentNode[]
    );
    this.closeComponentContextMenu();
  }

  pasteComponentFromClipboard(sectionId = this.componentContextMenuSectionId() ?? this.selectedSectionId()): void {
    const clipboard = this.componentClipboard();
    if (!clipboard || !sectionId) {
      return;
    }

    const targetSection = this.sections().find((item) => item.id === sectionId);
    if (!targetSection) {
      return;
    }

    const maxZIndex = this.readSectionComponents(targetSection).reduce(
      (max, component) => Math.max(max, component.zIndex || 0),
      0
    );
    const rootSourceIds = this.getBatchRootSourceComponentIds(clipboard);
    const { clones, nextIds, componentIdMap } = this.cloneComponentsForBatchInsert(clipboard, maxZIndex + 1, 20);
    if (!clones.length) {
      return;
    }

    this.updateSectionComponents(sectionId, (components) => [...components, ...clones], {
      selectedSectionId: sectionId,
      syncRail: true,
    });
    const nextRootIds = rootSourceIds
      .map((sourceId) => componentIdMap.get(sourceId))
      .filter((id): id is string => Boolean(id));
    const selectionIds = nextRootIds.length ? nextRootIds : nextIds;
    this.selectedComponentId.set(selectionIds[selectionIds.length - 1] ?? null);
    this.selectedComponentIds.set(selectionIds);
    this.isolatedGroupComponentId.set(null);
    this.closeComponentContextMenu();
  }

  componentKindLabel(type: StorefrontEditorComponentType): string {
    switch (type) {
      case 'text':
        return 'Text';
      case 'heading':
        return 'Heading';
      case 'paragraph':
        return 'Paragraph';
      case 'image':
        return 'Image';
    case 'button':
      return 'Button';
    case 'icon':
      return 'Icon';
    case 'spacer':
      return 'Spacer';
    case 'social-links':
      return 'Social links';
    case 'faq':
      return 'FAQ';
    case 'contact-form':
      return 'Contact form';
    case 'container':
      return 'Container';
      case 'graphic':
        return 'Graphic';
      case 'product-feed':
        return 'Product feed';
      case 'blog-feed':
        return 'Blog feed';
      default:
        return 'Component';
    }
  }

  findAddElementsLibraryItem(itemId: string): StorefrontEditorAddElementsLibraryItem | null {
    return this.addElementsLibraryItems.find((item) => item.id === itemId) ?? null;
  }

  isComponentSelected(componentId: string): boolean {
    return this.selectedComponentIds().includes(componentId);
  }

  isComponentMultiSelected(componentId: string): boolean {
    const selectedIds = this.selectedComponentIds();
    return selectedIds.length > 1 && selectedIds.includes(componentId);
  }

  clearComponentSelection(sectionId?: string, event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.justFinishedComponentSelectionBox) {
      this.justFinishedComponentSelectionBox = false;
      return;
    }

    if (sectionId) {
      this.selectedSectionId.set(sectionId);
      this.syncEditorSessionState({ selectedSectionId: sectionId }, false);
    }
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.closeComponentContextMenu();
  }

  startComponentSelectionBox(sectionId: string, event: MouseEvent): void {
      const target = event.target;
      const currentTarget = event.currentTarget;
      if (!(currentTarget instanceof HTMLElement) || !(target instanceof HTMLElement)) {
        return;
      }

      if (
        target.closest('.storefront-editor__preview-component') ||
        target.closest('.storefront-editor__preview-section-chrome') ||
        target.closest('.storefront-editor__preview-section-attach-indicator')
      ) {
        return;
      }

    event.preventDefault();
    this.selectedSectionId.set(sectionId);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.closeComponentContextMenu();

    const previewCanvas = currentTarget.closest('.storefront-editor__preview-canvas');
    if (!(previewCanvas instanceof HTMLElement)) {
      return;
    }

    const rect = previewCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.activeSelectionDrag = {
      sectionId,
      startX: x,
      startY: y,
    };
    this.selectionBoxSectionId.set(sectionId);
    this.selectionBox.set({ x, y, width: 0, height: 0 });
    this.isSelectingComponents.set(true);
  }

  openComponentContextMenu(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectComponent(sectionId, componentId, event);
    this.componentContextMenuSectionId.set(sectionId);
    this.componentContextMenuComponentId.set(componentId);
    const preferredPosition = this.getPreferredContextMenuPosition(event.clientX, event.clientY);
    this.componentContextMenuPosition.set(
      this.getClampedFloatingPanelPosition(preferredPosition.x, preferredPosition.y, 220, 460)
    );
    this.updateComponentContextMenuSubmenuDirection(this.componentContextMenuPosition().x, 220);
    this.isComponentContextMenuOpen.set(true);
    this.syncFloatingPanelPosition(
      '.storefront-editor__component-context-menu',
      this.componentContextMenuPosition,
      preferredPosition.x,
      preferredPosition.y
    );
    window.requestAnimationFrame(() => {
      const panel = document.querySelector('.storefront-editor__component-context-menu');
      if (!(panel instanceof HTMLElement)) {
        return;
      }

      this.updateComponentContextMenuSubmenuDirection(this.componentContextMenuPosition().x, panel.offsetWidth);
    });
    this.sectionOptionsMenuId.set(null);
  }

  openSectionCanvasContextMenu(sectionId: string, event: MouseEvent): void {
    const target = event.target;
    const currentTarget = event.currentTarget;
    if (!(currentTarget instanceof HTMLElement)) {
      return;
    }

    if (target instanceof HTMLElement && target.closest('.storefront-editor__preview-component')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
      this.selectedSectionId.set(sectionId);
      this.selectedComponentId.set(null);
      this.selectedComponentIds.set([]);
      this.isolatedGroupComponentId.set(null);
      this.closeComponentContextMenu();
      const preferredPosition = this.getPreferredContextMenuPosition(event.clientX, event.clientY);
      this.openSectionOptionsAt(sectionId, preferredPosition.x, preferredPosition.y);
  }

  closeComponentContextMenu(): void {
    this.isComponentContextMenuOpen.set(false);
    this.componentContextMenuSubmenuDirection.set('right');
    this.componentContextArrangeSubmenuPosition.set({ x: 0, y: 0 });
    this.componentContextAlignSubmenuPosition.set({ x: 0, y: 0 });
    this.componentContextMenuSectionId.set(null);
    this.componentContextMenuComponentId.set(null);
  }

  updateComponentContextSubmenuPosition(
    group: HTMLElement,
    submenu: HTMLElement,
    kind: 'arrange' | 'align'
  ): void {
    window.requestAnimationFrame(() => {
      const viewportMargin = 12;
      const submenuGap = 10;
      const groupRect = group.getBoundingClientRect();
      const submenuWidth = submenu.offsetWidth;
      const submenuHeight = submenu.offsetHeight;

      const openRight =
        groupRect.right + submenuGap + submenuWidth <= window.innerWidth - viewportMargin;

      this.componentContextMenuSubmenuDirection.set(openRight ? 'right' : 'left');

      const nextX = openRight
        ? groupRect.right + submenuGap
        : Math.max(viewportMargin, groupRect.left - submenuGap - submenuWidth);

      let nextY = groupRect.top;
      if (nextY + submenuHeight > window.innerHeight - viewportMargin) {
        nextY = window.innerHeight - viewportMargin - submenuHeight;
      }
      if (nextY < viewportMargin) {
        nextY = viewportMargin;
      }

      const nextPosition = { x: nextX, y: nextY };
      if (kind === 'arrange') {
        this.componentContextArrangeSubmenuPosition.set(nextPosition);
      } else {
        this.componentContextAlignSubmenuPosition.set(nextPosition);
      }
    });
  }

  closeSectionOptionsMenu(): void {
    this.sectionOptionsMenuId.set(null);
  }

  groupSelectedComponents(): void {
    const section = this.selectedSection();
    const selectedIds = this.selectedComponentIds();
    if (!section || selectedIds.length < 2) {
      return;
    }

    const groupId = `component-group-${Date.now()}`;
    const selectedIdSet = new Set(selectedIds);
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const nextComponents = this.readSectionComponents(item).map((component) =>
            selectedIdSet.has(component.id) ? { ...component, groupId } : component
          );
          return this.writeSectionComponents(item, nextComponents);
        }),
      },
    }), { syncRail: false });

    this.closeComponentContextMenu();
  }

  ungroupSelectedComponents(): void {
    const section = this.selectedSection();
    const selectedIds = this.selectedComponentIds();
    if (!section || !selectedIds.length) {
      return;
    }

    const sectionComponents = this.readSectionComponents(section);
    const groupIds = new Set(
      sectionComponents
        .filter((component) => selectedIds.includes(component.id))
        .map((component) => component.groupId)
        .filter((groupId): groupId is string => Boolean(groupId))
    );
    if (!groupIds.size) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const nextComponents = this.readSectionComponents(item).map((component) =>
            component.groupId && groupIds.has(component.groupId)
              ? { ...component, groupId: undefined }
              : component
          );
          return this.writeSectionComponents(item, nextComponents);
        }),
      },
    }), { syncRail: false });

    this.closeComponentContextMenu();
  }

  duplicateSelectedComponents(): void {
    const section = this.selectedSection();
    const selectedIds = this.selectedComponentIds();
    if (!section || !selectedIds.length) {
      return;
    }

    const rootSourceIds = this.getSelectedRootComponentsForBatchAction(section).map((component) => component.id);
    const nextIds: string[] = [];
    const nextRootIds: string[] = [];
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const components = this.readSectionComponents(item);
          let nextZIndex = components.reduce((max, component) => Math.max(max, component.zIndex ?? 1), 0) + 1;
          const selectedComponents = this.getSelectedComponentsForBatchAction(item);
          const { clones, nextIds: duplicateIds, componentIdMap } = this.cloneComponentsForBatchInsert(
            selectedComponents,
            nextZIndex,
            24
          );
          nextIds.push(...duplicateIds);
          nextRootIds.push(
            ...rootSourceIds
              .map((sourceId) => componentIdMap.get(sourceId))
              .filter((id): id is string => Boolean(id))
          );

          return this.writeSectionComponents(item, [...components, ...clones]);
        }),
      },
    }), { syncRail: false });

    const selectionIds = nextRootIds.length ? nextRootIds : nextIds;
    this.selectedComponentIds.set(selectionIds);
    this.selectedComponentId.set(selectionIds[selectionIds.length - 1] ?? null);
    this.closeComponentContextMenu();
  }

  bringSelectedComponentsToFront(): void {
    this.reorderSelectedComponentDepth('front');
  }

  sendSelectedComponentsToBack(): void {
    this.reorderSelectedComponentDepth('back');
  }

  bringSelectedComponentsForward(): void {
    this.stepSelectedComponentDepth('forward');
  }

  sendSelectedComponentsBackward(): void {
    this.stepSelectedComponentDepth('backward');
  }

  beginComponentResize(sectionId: string, componentId: string, handle: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    if (!section || !component || component.isLocked || !component.isVisible) {
      return;
    }

    this.selectComponent(sectionId, componentId, event);
    this.removeSectionLayoutAssignments(sectionId, [componentId], { selectedSectionId: sectionId, syncRail: false });
    this.activeResize = {
      sectionId,
      componentId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startFrame: { ...this.getComponentFrame(component) },
      startRotation: component.rotation ?? 0,
      preserveAspectRatio: component.type === 'image' && /[ns]/.test(handle) && /[ew]/.test(handle),
      startAspectRatio: component.frame.width > 0 && component.frame.height > 0 ? component.frame.width / component.frame.height : 1,
      contentBounds: component.type === 'container' ? this.getContainerContentLocalBounds(section, component) : null,
    };
    this.isResizingComponent.set(true);
    this.closeComponentContextMenu();
  }

  beginComponentRotate(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    if (!component || component.isLocked || !component.isVisible || !(container instanceof HTMLElement)) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const frame = this.getComponentFrame(component);
    const centerX = rect.left + frame.x + frame.width / 2;
    const centerY = rect.top + frame.y + frame.height / 2;
    this.selectComponent(sectionId, componentId);
    this.activeRotation = {
      sectionId,
      componentId,
      centerX,
      centerY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI),
      startRotation: component.rotation ?? 0,
      previousAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI),
      accumulatedAngle: 0,
    };
    this.isRotatingComponent.set(true);
    this.closeComponentContextMenu();
  }

  startEditingComponentName(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    if (!component) {
      return;
    }

    this.selectComponent(sectionId, componentId);
    this.isEditingComponentName.set(true);
    this.editingComponentNameId.set(componentId);
    this.editingComponentNameValue.set(component.name || 'Untitled');
  }

  startEditingSectionName(sectionId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    this.selectSection(sectionId);
    this.isEditingSectionName.set(true);
    this.editingSectionNameId.set(sectionId);
    this.editingSectionNameValue.set(this.sectionLabel(section));
  }

  finishEditingSectionName(): void {
    const sectionId = this.editingSectionNameId();
    if (!sectionId) {
      this.cancelSectionNameEditing();
      return;
    }

    const nextName = this.editingSectionNameValue().trim() || 'Section';
    this.applyStorefrontMutation(
      (storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  props: {
                    ...section.props,
                    [ProjectStorefrontEditor.SECTION_LABEL_PROP_KEY]: nextName,
                  },
                }
              : section
          ),
        },
      }),
      { selectedSectionId: sectionId, syncRail: true }
    );
    this.cancelSectionNameEditing();
  }

  cancelSectionNameEditing(): void {
    this.isEditingSectionName.set(false);
    this.editingSectionNameId.set(null);
    this.editingSectionNameValue.set('');
  }

  onSectionNameInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.finishEditingSectionName();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSectionNameEditing();
    }
  }

  finishEditingComponentName(): void {
    const sectionId = this.selectedSectionId();
    const componentId = this.editingComponentNameId();
    if (!sectionId || !componentId) {
      this.cancelComponentNameEditing();
      return;
    }

    const nextName = this.editingComponentNameValue().trim() || 'Untitled';
    this.updateComponentNode(sectionId, componentId, (component) => ({ ...component, name: nextName }));
    this.cancelComponentNameEditing();
  }

  cancelComponentNameEditing(): void {
    this.isEditingComponentName.set(false);
    this.editingComponentNameId.set(null);
    this.editingComponentNameValue.set('');
  }

  onComponentNameInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.finishEditingComponentName();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelComponentNameEditing();
    }
  }

startEditingComponentText(sectionId: string, componentId: string, event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    if (!component || !this.canEditComponentText(component)) {
      return;
    }

    this.selectComponent(sectionId, componentId);
    this.isEditingComponentText.set(true);
    this.editingComponentTextId.set(componentId);
    this.editingComponentTextValue.set(this.readEditableComponentText(component));
    setTimeout(() => this.focusActiveTextEditor(), 0);
  }

handleComponentDoubleClick(sectionId: string, componentId: string, event: MouseEvent): void {
  const section = this.sections().find((item) => item.id === sectionId);
  const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
  if (!component || component.isLocked || !component.isVisible) {
    return;
  }

  if (component.groupId) {
    this.isolateGroupedComponent(sectionId, componentId, event);
    return;
  }

  if (component.type === 'image') {
    event.preventDefault();
    event.stopPropagation();
    this.selectComponent(sectionId, componentId, event);
    this.enterImageCropMode(componentId);
    return;
  }

  if (this.canEditComponentText(component)) {
    this.startEditingComponentText(sectionId, componentId, event);
  }
}

finishEditingComponentText(): void {
    const sectionId = this.selectedSectionId();
    const componentId = this.editingComponentTextId();
    if (!sectionId || !componentId) {
      this.cancelComponentTextEditing();
      return;
    }

    const nextValue = this.isEditingSelectedTextComponent()
      ? this.readActiveTextEditorHtml()
      : this.editingComponentTextValue();
    this.updateComponentNode(sectionId, componentId, (component) => this.writeEditableComponentText(component, nextValue));
    this.cancelComponentTextEditing();
  }

  cancelComponentTextEditing(): void {
    this.isEditingComponentText.set(false);
    this.editingComponentTextId.set(null);
    this.editingComponentTextValue.set('');
  }

  onRichTextEditorInput(event: Event): void {
    event.stopPropagation();
    const editor = event.target;
    if (editor instanceof HTMLElement) {
      this.editingComponentTextValue.set(editor.innerHTML);
    }
  }

  preserveRichTextEditing(event: MouseEvent): void {
    event.stopPropagation();
  }

  onComponentTextEditorBlur(event: FocusEvent): void {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) {
      this.editingComponentTextValue.set(target.value);
    } else if (target instanceof HTMLElement) {
      this.editingComponentTextValue.set(target.innerHTML);
    }

    setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && activeElement.closest('.storefront-editor__context-toolbar-shell')) {
        return;
      }

      this.finishEditingComponentText();
    }, 0);
  }

  onComponentTextInputKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.finishEditingComponentText();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.finishEditingComponentText();
    }
  }

  applyRichTextCommand(command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList'): void {
    if (!this.focusActiveTextEditor()) {
      return;
    }

    document.execCommand(command);
    this.syncEditingTextValueFromDom();
  }

  applyRichTextHighlight(color: string): void {
    if (!this.focusActiveTextEditor()) {
      return;
    }

    if (color === 'transparent') {
      document.execCommand('removeFormat');
    } else {
      document.execCommand('hiliteColor', false, color);
      document.execCommand('backColor', false, color);
    }
    this.syncEditingTextValueFromDom();
    this.activeTextToolbarMenu.set(null);
  }

  beginSectionResize(sectionId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const content = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    if (!(content instanceof HTMLElement)) {
      return;
    }

    this.selectSection(sectionId);
    this.activeSectionResize = {
      sectionId,
      startY: event.clientY,
      startHeight: content.getBoundingClientRect().height,
    };
    this.isResizingSection.set(true);
    this.closeComponentContextMenu();
  }

  togglePagesPanel(): void {
    if (this.isPagesPanelOpen()) {
      this.closePagesPanel();
      return;
    }

    if (this.pagesPanelCloseTimer) {
      clearTimeout(this.pagesPanelCloseTimer);
      this.pagesPanelCloseTimer = null;
    }

    this.closeFloatingUi();
    this.isPagesPanelClosing.set(false);
    this.isPagesPanelOpen.set(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scrollPagesPanelToActivePage());
    });
  }

  closePagesPanel(): void {
    if (!this.isPagesPanelVisible()) {
      return;
    }

    if (this.pagesPanelCloseTimer) {
      clearTimeout(this.pagesPanelCloseTimer);
    }

    this.isPagesPanelOpen.set(false);
    this.isPagesPanelClosing.set(true);
    this.pagesPanelCloseTimer = setTimeout(() => {
      this.isPagesPanelClosing.set(false);
      this.pagesPanelCloseTimer = null;
    }, ProjectStorefrontEditor.PAGES_MANAGER_CLOSE_MS);
  }

  openManagePages(): void {
    if (this.managePagesCloseTimer) {
      clearTimeout(this.managePagesCloseTimer);
      this.managePagesCloseTimer = null;
    }

  this.closeFloatingUi();
  this.pagesManagerSearch.set('');
  this.isAddPageMenuOpen.set(false);
  this.isPageDesignPickerOpen.set(false);
  this.isPageDesignPickerClosing.set(false);
  this.isManagePagesClosing.set(false);
  this.isManagePagesOpen.set(true);
}

  closeManagePages(): void {
    if (!this.isManagePagesVisible()) {
      return;
    }

    if (this.managePagesCloseTimer) {
      clearTimeout(this.managePagesCloseTimer);
    }

  this.isManagePagesOpen.set(false);
  this.isManagePagesClosing.set(true);
  this.isAddPageMenuOpen.set(false);
  this.isPageDesignPickerOpen.set(false);
  this.isPageDesignPickerClosing.set(false);
  this.pageCardMenuId.set(null);
    this.managePagesCloseTimer = setTimeout(() => {
      this.isManagePagesClosing.set(false);
      this.managePagesCloseTimer = null;
    }, ProjectStorefrontEditor.PAGES_MANAGER_CLOSE_MS);
  }

  openSectionLibrary(sectionId: string): void {
    if (this.sectionLibraryCloseTimer) {
      clearTimeout(this.sectionLibraryCloseTimer);
      this.sectionLibraryCloseTimer = null;
    }
    this.sectionAddMenuSectionId.set(null);
    this.isPagesPanelOpen.set(false);
    this.sectionOptionsMenuId.set(null);
  this.activeSectionLibraryCategory.set('Essentials');
    this.isSectionLibraryClosing.set(false);
    this.sectionLibraryTargetId.set(sectionId);
    setTimeout(() => this.updateSectionLibraryTabScrollState(), 0);
  }

  closeSectionLibrary(): void {
    if (!this.isSectionLibraryOpen() && !this.isSectionLibraryClosing()) {
      return;
    }

    if (this.sectionLibraryCloseTimer) {
      clearTimeout(this.sectionLibraryCloseTimer);
    }

    this.isSectionLibraryClosing.set(true);
    this.sectionLibraryCloseTimer = setTimeout(() => {
      this.sectionLibraryTargetId.set(null);
      this.isSectionLibraryClosing.set(false);
      this.canScrollSectionLibraryTabsLeft.set(false);
      this.canScrollSectionLibraryTabsRight.set(false);
      this.sectionLibraryCloseTimer = null;
    }, ProjectStorefrontEditor.SECTION_LIBRARY_CLOSE_MS);
  }

  setSectionLibraryCategory(category: SectionLibraryCategory): void {
    this.activeSectionLibraryCategory.set(category);
    setTimeout(() => this.updateSectionLibraryTabScrollState(), 0);
  }

  scrollSectionLibraryTabs(direction: 'left' | 'right'): void {
    const tabs = this.getSectionLibraryTabsElement();
    if (!tabs) {
      return;
    }

    const delta = Math.max(180, Math.round(tabs.clientWidth * 0.45));
    tabs.scrollBy({
      left: direction === 'right' ? delta : -delta,
      behavior: 'smooth',
    });

    setTimeout(() => this.updateSectionLibraryTabScrollState(), 220);
  }

  updateSectionLibraryTabScrollState(): void {
    const tabs = this.getSectionLibraryTabsElement();
    if (!tabs) {
      this.canScrollSectionLibraryTabsLeft.set(false);
      this.canScrollSectionLibraryTabsRight.set(false);
      return;
    }

    const maxScrollLeft = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
    this.canScrollSectionLibraryTabsLeft.set(tabs.scrollLeft > 4);
    this.canScrollSectionLibraryTabsRight.set(tabs.scrollLeft < maxScrollLeft - 4);
  }

  closeFloatingUi(): void {
    this.isFormaMenuOpen.set(false);
  this.isAccountMenuOpen.set(false);
  this.isBrandKitPopupOpen.set(false);
  this.isBrandKitCustomizerOpen.set(false);
  this.isZoomMenuOpen.set(false);
  this.isAddPageMenuOpen.set(false);
  this.sectionAddMenuSectionId.set(null);
  this.activeTextToolbarMenu.set(null);
  this.activeImageToolbarMenu.set(null);
  this.isImageSettingsLinkPopupOpen.set(false);
  this.isImageBorderColorPickerOpen.set(false);
  this.isImageBorderStylePickerOpen.set(false);
  this.activeContainerToolbarMenu.set(null);
  this.isContainerBorderColorPickerOpen.set(false);
  this.isContainerBorderStylePickerOpen.set(false);
  this.activeSectionToolbarMenu.set(null);
  this.isSectionBorderColorPickerOpen.set(false);
  this.isSectionBorderStylePickerOpen.set(false);
  this.activeButtonToolbarMenu.set(null);
  this.activeProductFeedToolbarMenu.set(null);
  this.closeAddElementsPanel();
    this.closeAddElementsLibraryModal();
    this.closePagesPanel();
    this.closeManagePages();
    this.closePageDesignPicker();
    this.closeLayersPopup();
    this.isMediaManagerOpen.set(false);
    this.pageCardMenuId.set(null);
    this.closeSectionLibrary();
    this.closeSectionOptionsMenu();
  }

  togglePageCardMenu(pageId: string, event?: MouseEvent): void {
    if (this.pageCardMenuId() === pageId) {
      this.pageCardMenuId.set(null);
      return;
    }

    const target = event?.currentTarget;
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      this.pageCardMenuTop.set(rect.top);
      this.pageCardMenuLeft.set(rect.right + 8);
    }

    this.pageCardMenuId.set(pageId);
  }

  toggleSectionOptions(sectionId: string, event?: MouseEvent): void {
    if (this.sectionOptionsMenuId() === sectionId) {
      this.closeSectionOptionsMenu();
      return;
    }

    const target = event?.currentTarget;
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      this.openSectionOptionsAt(sectionId, rect.right + 8, rect.top);
      return;
    }

    this.openSectionOptionsAt(sectionId, window.innerWidth / 2, window.innerHeight / 2);
  }

private openSectionOptionsAt(sectionId: string, x: number, y: number): void {
  this.sectionContextMenuPosition.set(
    this.getClampedFloatingPanelPosition(x, y, 232, this.isStableSectionId(sectionId) ? 76 : 340)
  );
  this.sectionOptionsMenuId.set(sectionId);
  this.syncFloatingPanelPosition(
    '.storefront-editor__preview-section-menu--floating',
    this.sectionContextMenuPosition,
      x,
      y
    );
  }

  private getPreferredContextMenuPosition(x: number, y: number): { x: number; y: number } {
    const offset = 8;
    return {
      x: x + offset,
      y: y + offset,
    };
  }

  private syncFloatingPanelPosition(
    selector: string,
    positionSignal: WritableSignal<{ x: number; y: number }>,
    preferredX: number,
    preferredY: number
  ): void {
    window.requestAnimationFrame(() => {
      const panel = document.querySelector(selector);
      if (!(panel instanceof HTMLElement)) {
        return;
      }

      positionSignal.set(
        this.getClampedFloatingPanelPosition(
          preferredX,
          preferredY,
          panel.offsetWidth,
          panel.offsetHeight
        )
      );

      if (selector === '.storefront-editor__component-context-menu') {
        this.updateComponentContextMenuSubmenuDirection(positionSignal().x, panel.offsetWidth);
      }
    });
  }

  private updateComponentContextMenuSubmenuDirection(menuX: number, menuWidth: number): void {
    const viewportMargin = 12;
    const submenuGap = 8;
    const estimatedSubmenuWidth = 248;
    const opensRightWithinViewport =
      menuX + menuWidth + submenuGap + estimatedSubmenuWidth <= window.innerWidth - viewportMargin;
    this.componentContextMenuSubmenuDirection.set(opensRightWithinViewport ? 'right' : 'left');
  }

  private getSectionAddMenuPlacement(anchorRect: DOMRect | null, menuHeight: number): 'above' | 'below' {
    if (!anchorRect) {
      return 'below';
    }

    const gap = 12;
    const viewportMargin = 12;
    const fitsBelow = anchorRect.bottom + gap + menuHeight <= window.innerHeight - viewportMargin;
    return fitsBelow ? 'below' : 'above';
  }

  private syncSectionAddMenuPlacement(sectionId?: string | null, anchorElement?: HTMLElement | null): void {
    const activeSectionId = sectionId ?? this.sectionAddMenuSectionId();
    if (!activeSectionId || this.sectionAddMenuSectionId() !== activeSectionId) {
      return;
    }

    const anchor =
      anchorElement ??
      (document.querySelector(
        `.storefront-editor__preview-section-add-wrap[data-section-id="${activeSectionId}"] .storefront-editor__preview-section-add`
      ) as HTMLElement | null);
    if (!anchor) {
      this.sectionAddMenuPlacement.set('below');
      return;
    }

    const menu = document.querySelector(
      `.storefront-editor__add-page-menu--section[data-section-id="${activeSectionId}"]`
    ) as HTMLElement | null;
    const menuHeight = menu?.getBoundingClientRect().height ?? 112;
    const anchorRect = anchor.getBoundingClientRect();

    this.sectionAddMenuPlacement.set(this.getSectionAddMenuPlacement(anchorRect, menuHeight));
  }

  private syncImageSettingsLinkPopupPlacement(anchorElement?: HTMLElement | null): void {
    if (!this.isImageSettingsLinkPopupOpen() && !anchorElement) {
      return;
    }

    const anchor =
      anchorElement ??
      (document.querySelector(
        '.storefront-editor__image-settings-link-shell .storefront-editor__image-settings-link-button'
      ) as HTMLElement | null);

    if (!anchor) {
      this.imageSettingsLinkPopupPlacement.set('below');
      this.imageSettingsLinkPopupViewportLeft.set(12);
      return;
    }

    const popup = document.querySelector(
      '.storefront-editor__image-settings-link-shell .storefront-editor__image-link-popup'
    ) as HTMLElement | null;
    const popupRect = popup?.getBoundingClientRect();
    const popupWidth = popupRect?.width ?? 292;
    const popupHeight = popupRect?.height ?? 420;
    const anchorRect = anchor.getBoundingClientRect();
    const gap = 8;
    const viewportMargin = 12;
    const availableBelow = window.innerHeight - anchorRect.bottom - gap - viewportMargin;
    const fitsBelow = availableBelow >= popupHeight;

    if (fitsBelow) {
      this.imageSettingsLinkPopupPlacement.set('below');
      this.imageSettingsLinkPopupViewportLeft.set(12);
      return;
    }

    const clampedPosition = this.getClampedFloatingPanelPosition(
      anchorRect.left,
      window.innerHeight - popupHeight - viewportMargin,
      popupWidth,
      popupHeight
    );
    this.imageSettingsLinkPopupPlacement.set('viewport-bottom');
    this.imageSettingsLinkPopupViewportLeft.set(clampedPosition.x);
  }

  private getClampedFloatingPanelPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;

    return {
      x: Math.max(margin, Math.min(x, viewportWidth - width - margin)),
      y: Math.max(margin, Math.min(y, viewportHeight - height - margin)),
    };
  }

syncSelectedSectionRailPosition(sectionElement?: HTMLElement | null): void {
  this.updatePreviewStageScrollbarState();

  const selectedSectionId = this.selectedSectionId();
  if (!selectedSectionId && !sectionElement) {
    this.isSelectedSectionRailVisible.set(false);
    return;
  }

  const shell =
    sectionElement ??
    (document.querySelector(
      `.storefront-editor__preview-section-shell[data-section-id="${selectedSectionId}"]`
    ) as HTMLElement | null);
  if (!shell) {
    this.isSelectedSectionRailVisible.set(false);
    return;
  }

  const previewStage = shell.closest('.storefront-editor__preview-stage') as HTMLElement | null;
  if (!previewStage) {
    this.isSelectedSectionRailVisible.set(false);
    return;
  }

  const shellRect = shell.getBoundingClientRect();
  const previewStageRect = previewStage.getBoundingClientRect();
  const isVisible = shellRect.bottom > previewStageRect.top && shellRect.top < previewStageRect.bottom;
  this.isSelectedSectionRailVisible.set(isVisible);
  if (!isVisible) {
    return;
  }

  const unclampedTop = shellRect.top - previewStageRect.top + shellRect.height / 2;
  const clampedTop = Math.min(
    Math.max(28, unclampedTop),
    Math.max(28, previewStageRect.height - 28)
  );
  this.hoveredSectionRailTop.set(clampedTop);
}

  setZoom(percent: number): void {
    const clamped = Math.min(200, Math.max(50, Math.round(percent)));
    this.zoomPercent.set(clamped);
    this.isZoomMenuOpen.set(false);
    this.syncEditorSessionState({ zoomPercent: clamped });
    setTimeout(() => {
      this.updatePreviewStageScrollbarState();
      this.refreshSectionLayoutAssignments();
    }, 0);
  }

  nudgeZoom(direction: 'in' | 'out'): void {
    const delta = direction === 'in' ? 10 : -10;
    this.setZoom(this.zoomPercent() + delta);
    this.isZoomMenuOpen.set(true);
  }

  fitPreviewToScreen(): void {
    this.zoomPercent.set(120);
    this.isZoomMenuOpen.set(false);
    this.syncEditorSessionState({ zoomPercent: 120 });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }

  setSidebarMode(mode: EditorSidebarMode): void {
    this.sidebarMode.set(mode);
      if (mode === 'page') {
        this.selectedSectionId.set(null);
        this.selectedComponentId.set(null);
        this.selectedComponentIds.set([]);
        this.isolatedGroupComponentId.set(null);
      }
  }

  navigateBackToProject(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    void this.router.navigate(['/app/projects', projectId, 'home']);
  }

  openPublicPreview(): void {
  const projectId = this.projectId();
  const workingStorefront = this.workingStorefront();
  const project = this.project();
  if (!projectId) {
    return;
  }

  if (workingStorefront && workingStorefront.draftHomepage) {
    const previewProducts = this.products()
      .filter(
        (product) =>
          product.status !== 'ARCHIVED' &&
          !!product.name?.trim() &&
          product.price != null &&
          Number(product.price) > 0
      )
      .map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        sku: product.sku ?? null,
        category: product.category ?? null,
        productType: product.productType ?? null,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        inventoryQuantity: product.inventoryQuantity ?? 0,
        imageUrl: product.imageUrl ?? null,
        tags: Array.isArray(product.tags) ? product.tags : [],
        createdAt: product.createdAt ?? null,
        updatedAt: product.updatedAt ?? null,
      }));

    this.publicStorefrontService.saveEditorPreviewSnapshot(projectId, {
      savedAt: new Date().toISOString(),
      storefront: {
        projectId,
        storeName:
          workingStorefront.storeName?.trim() ||
          project?.storeTitle?.trim() ||
          project?.name?.trim() ||
          'Storefront',
        themeKey: workingStorefront.themeKey ?? null,
        homepage: structuredClone(workingStorefront.draftHomepage),
        featuredProducts: this.featuredProductsPreview().map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description ?? null,
          sku: product.sku ?? null,
          category: product.category ?? null,
          productType: product.productType ?? null,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          inventoryQuantity: product.inventoryQuantity ?? 0,
          imageUrl: product.imageUrl ?? null,
          tags: Array.isArray(product.tags) ? product.tags : [],
          createdAt: product.createdAt ?? null,
          updatedAt: product.updatedAt ?? null,
        })),
      },
      products: previewProducts,
    });
  }

  window.open(`/store/${projectId}?preview=editor`, '_blank', 'noopener');
}

  updateSelectedParagraphFontFamily(value: string): void {
    this.updateSelectedParagraphProps({ fontFamily: value });
    this.activeTextToolbarMenu.set(null);
  }

  updateSelectedParagraphFontSize(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedParagraphProps({ fontSize: Math.max(10, Math.min(288, Math.round(parsed))) });
    this.activeTextToolbarMenu.set(null);
  }

  setSelectedParagraphAlignment(align: StorefrontEditorTextNode['props']['align']): void {
    this.updateSelectedParagraphProps({ align });
    this.activeTextToolbarMenu.set(null);
  }

  toggleSelectedParagraphBold(): void {
    const component = this.selectedTextComponent();
    if (!component) {
      return;
    }

    if (this.isEditingSelectedTextComponent()) {
      this.applyRichTextCommand('bold');
      return;
    }

    this.updateSelectedParagraphProps({
      fontWeight: component.props.fontWeight >= 600 ? 400 : 700,
    });
  }

  toggleSelectedParagraphItalic(): void {
    const component = this.selectedTextComponent();
    if (!component) {
      return;
    }

    if (this.isEditingSelectedTextComponent()) {
      this.applyRichTextCommand('italic');
      return;
    }

    this.updateSelectedParagraphProps({
      fontStyle: component.props.fontStyle === 'italic' ? 'normal' : 'italic',
    });
  }

  toggleSelectedParagraphUnderline(): void {
    const component = this.selectedTextComponent();
    if (!component) {
      return;
    }

    if (this.isEditingSelectedTextComponent()) {
      this.applyRichTextCommand('underline');
      return;
    }

    this.updateSelectedParagraphProps({
      textDecoration: component.props.textDecoration === 'underline' ? 'none' : 'underline',
    });
  }

  updateSelectedParagraphColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }
    if (normalized !== 'transparent') {
      this.syncCustomColorPickerFromHex(normalized);
    }
    this.updateSelectedParagraphProps({ color: normalized });
  }

  toggleTextToolbarMenu(
    menu: 'style' | 'font-size' | 'font-family' | 'link' | 'alignment' | 'color' | 'typography' | 'highlight'
  ): void {
    const next = this.activeTextToolbarMenu() === menu ? null : menu;
    this.activeTextToolbarMenu.set(next);
    if (next === 'font-family') {
      this.textFontSearch.set('');
    }
    if (next === 'color') {
      this.activeColorPickerTab.set('brand');
      this.syncCustomColorPickerFromHex(this.selectedTextComponent()?.props.color ?? '#082237');
    }
    if (next === 'link') {
      const component = this.selectedTextComponent();
      this.syncManagedPageLinkSelection(
        component?.props.href ?? '',
        component?.props.openInNewTab ?? false,
        this.textLinkPageId,
        this.textLinkOpenMode
      );
    }
  }

  setActiveColorPickerTab(tab: 'brand' | 'custom'): void {
    this.activeColorPickerTab.set(tab);
  }

  saveSelectedParagraphColor(): void {
    const color = this.selectedTextComponent()?.props.color;
    if (!color) {
      return;
    }

    const normalized = color.trim().toLowerCase();
    const next = [normalized, ...this.savedParagraphColors().filter((item) => item !== normalized)].slice(0, 12);
    this.savedParagraphColors.set(next);
    localStorage.setItem(ProjectStorefrontEditor.SAVED_PARAGRAPH_COLORS_STORAGE_KEY, JSON.stringify(next));
    this.activeColorPickerTab.set('brand');
  }

  applySavedParagraphColor(color: string): void {
    this.updateSelectedParagraphColor(color);
  }

  updateSelectedTextStyle(style: StorefrontEditorTextStylePreset): void {
    const component = this.selectedTextComponent();
    if (!component) {
      return;
    }

    this.updateSelectedParagraphProps(
      buildStorefrontEditorTextProps(style, {
        text: component.props.text,
        richTextHtml: component.props.richTextHtml,
        color: component.props.color,
        align: component.props.align,
        lineHeight: component.props.lineHeight,
        letterSpacing: component.props.letterSpacing,
        href: component.props.href,
        openInNewTab: component.props.openInNewTab,
        fontStyle: component.props.fontStyle,
        textDecoration: component.props.textDecoration,
      })
    );
    this.activeTextToolbarMenu.set(null);
  }

  updateTextFontSearch(value: string): void {
    this.textFontSearch.set(value);
  }

  setTextLinkPage(pageId: string): void {
    this.textLinkPageId.set(pageId);
  }

  setTextLinkOpenMode(mode: 'current' | 'new'): void {
    this.textLinkOpenMode.set(mode);
  }

  updateSelectedParagraphLineHeight(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedParagraphProps({ lineHeight: this.clamp(parsed, 0.8, 3) });
  }

  updateSelectedParagraphLetterSpacing(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedParagraphProps({ letterSpacing: this.clamp(parsed, -0.12, 0.24) });
  }

  toggleSelectedTextList(style: 'bullet' | 'number'): void {
    if (!this.isEditingSelectedTextComponent()) {
      this.startEditingSelectedTextComponent();
      setTimeout(() => {
        this.applyRichTextCommand(style === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList');
      }, 0);
      return;
    }

    this.applyRichTextCommand(style === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList');
  }

  saveSelectedTextLink(): void {
    const href = this.buildManagedPageHref(this.textLinkPageId());
    if (this.isEditingSelectedTextComponent()) {
      if (!this.focusActiveTextEditor()) {
        return;
      }

      document.execCommand('createLink', false, href);
      if (this.textLinkOpenMode() === 'new') {
        const selection = window.getSelection();
        const anchor = selection?.anchorNode instanceof Element
          ? selection.anchorNode.closest('a')
          : selection?.anchorNode?.parentElement?.closest('a');
        anchor?.setAttribute('target', '_blank');
        anchor?.setAttribute('rel', 'noreferrer noopener');
      }
      this.syncEditingTextValueFromDom();
      this.activeTextToolbarMenu.set(null);
      return;
    }

    this.updateSelectedParagraphProps({
      href,
      openInNewTab: this.textLinkOpenMode() === 'new',
    });
    this.activeTextToolbarMenu.set(null);
  }

  removeSelectedTextLink(): void {
    if (this.isEditingSelectedTextComponent()) {
      if (!this.focusActiveTextEditor()) {
        return;
      }

      document.execCommand('unlink');
      this.syncEditingTextValueFromDom();
      this.activeTextToolbarMenu.set(null);
      return;
    }

    this.updateSelectedParagraphProps({
      href: '',
      openInNewTab: false,
    });
    this.activeTextToolbarMenu.set(null);
  }

  toggleImageToolbarMenu(menu: Exclude<ImageToolbarMenu, null>): void {
    const next = this.activeImageToolbarMenu() === menu ? null : menu;
    this.activeImageToolbarMenu.set(next);

    if (next !== 'settings') {
      this.isImageSettingsLinkPopupOpen.set(false);
    }

    if (next !== 'borders') {
      this.isImageBorderColorPickerOpen.set(false);
      this.isImageBorderStylePickerOpen.set(false);
    }

    if (next === 'link' || next === 'settings') {
      const component = this.selectedImageComponent();
      this.syncManagedPageLinkSelection(
        component?.props.href ?? '',
        component?.props.openInNewTab ?? false,
        this.imageLinkPageId,
        this.imageLinkOpenMode
      );
    }
  }

  setImageLinkPage(pageId: string): void {
    this.imageLinkPageId.set(pageId);
  }

  setImageLinkOpenMode(mode: 'current' | 'new'): void {
    this.imageLinkOpenMode.set(mode);
  }

  saveSelectedImageLink(): void {
    const href = this.buildManagedPageHref(this.imageLinkPageId());
    this.updateSelectedImageProps({
      href,
      openInNewTab: this.imageLinkOpenMode() === 'new',
    });
    this.isImageSettingsLinkPopupOpen.set(false);
    this.activeImageToolbarMenu.set(null);
  }

  removeSelectedImageLink(): void {
    this.updateSelectedImageProps({
      href: '',
      openInNewTab: false,
    });
    this.isImageSettingsLinkPopupOpen.set(false);
    this.activeImageToolbarMenu.set(null);
  }

  closeImageLinkPopups(): void {
    this.isImageSettingsLinkPopupOpen.set(false);
    this.imageSettingsLinkPopupPlacement.set('below');
    if (this.activeImageToolbarMenu() === 'link') {
      this.activeImageToolbarMenu.set(null);
    }
  }

  toggleImageSettingsLinkPopup(event?: MouseEvent): void {
    const next = !this.isImageSettingsLinkPopupOpen();
    if (!next) {
      this.isImageSettingsLinkPopupOpen.set(false);
      this.imageSettingsLinkPopupPlacement.set('below');
      return;
    }

    const anchor =
      event?.currentTarget instanceof HTMLElement
        ? event.currentTarget
        : (document.querySelector(
            '.storefront-editor__image-settings-link-shell .storefront-editor__image-settings-link-button'
          ) as HTMLElement | null);

    this.syncImageSettingsLinkPopupPlacement(anchor);
    this.isImageSettingsLinkPopupOpen.set(next);

    const component = this.selectedImageComponent();
    this.syncManagedPageLinkSelection(
      component?.props.href ?? '',
      component?.props.openInNewTab ?? false,
      this.imageLinkPageId,
      this.imageLinkOpenMode
    );
    setTimeout(() => this.syncImageSettingsLinkPopupPlacement(anchor), 0);
  }

  openMediaManagerForSelectedImage(): void {
    this.closeFloatingUi();
    this.mediaManagerPurpose.set('image-component');
    this.isMediaManagerOpen.set(true);
  }

  toggleSelectedImageCropMode(): void {
    const component = this.selectedImageComponent();
    if (!component) {
      return;
    }

    const next = this.croppingImageComponentId() === component.id ? null : component.id;
    if (next) {
      this.activeImageCrop = null;
      this.activeImageToolbarMenu.set(null);
      this.isImageSettingsLinkPopupOpen.set(false);
      this.isImageBorderColorPickerOpen.set(false);
      this.isImageBorderStylePickerOpen.set(false);
      this.croppingImageComponentId.set(next);
      return;
    }

    this.exitImageCropMode();
  }

  enterImageCropMode(componentId: string): void {
    this.activeImageToolbarMenu.set(null);
    this.isImageSettingsLinkPopupOpen.set(false);
    this.isImageBorderColorPickerOpen.set(false);
    this.isImageBorderStylePickerOpen.set(false);
    this.activeImageCrop = null;
    const located = this.findImageComponentLocation(componentId);
    if (located) {
      this.prepareImageCropEditingState(located.sectionId, located.component);
    }
    this.croppingImageComponentId.set(componentId);
  }

  isImageCropModeForComponent(componentId: string): boolean {
    return this.croppingImageComponentId() === componentId;
  }

  componentVisualFrame(component: StorefrontEditorComponentNode): StorefrontEditorComponentNode['frame'] {
    if (component.type === 'image' && this.isImageCropModeForComponent(component.id)) {
      return this.resolveImageCropEditingFrame(component);
    }

    return component.frame;
  }

  beginImageCropMove(sectionId: string, componentId: string, event: MouseEvent): void {
    this.startImageCropInteraction(sectionId, componentId, 'move', null, event);
  }

  beginImageCropResize(sectionId: string, componentId: string, handle: string, event: MouseEvent): void {
    this.startImageCropInteraction(sectionId, componentId, 'resize', handle, event);
  }

  imageCropFrameStyle(component: StorefrontEditorComponentNode): Record<string, string> | null {
    if (component.type !== 'image') {
      return null;
    }

    const rect = this.resolveImageCropFrameRect(component);
    return {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
  }

  updateSelectedImageDisplayMode(value: 'fill' | 'fit' | 'aspect'): void {
    const objectFit = value === 'fill' ? 'cover' : 'contain';
    this.updateSelectedImageProps({
      displayMode: value,
      objectFit,
    });
  }

  updateSelectedImageOpacity(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedImageProps({ opacity: Math.max(0, Math.min(100, Math.round(parsed))) });
  }

  updateSelectedImageBorderColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    this.syncImageBorderColorPickerFromHex(normalized);
    this.rememberSectionBorderColor(normalized);
    this.updateSelectedImageProps({ borderColor: normalized });
  }

  updateSelectedImageBorderWidth(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedImageProps({
      borderWidth: Math.max(0, Math.min(12, Math.round(parsed))),
    });
  }

  updateSelectedImageBorderStyle(value: 'solid' | 'dashed' | 'dotted' | 'double'): void {
    const width = Math.max(this.imageBorderWidth(this.selectedImageComponent()), 1);
    this.updateSelectedImageProps({
      borderStyle: value,
      borderWidth: width,
    });
    this.isImageBorderStylePickerOpen.set(false);
  }

  updateSelectedImageRadius(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedImageProps({ radius: Math.max(0, Math.min(999, Math.round(parsed))) });
  }

updateSelectedImageShadow(value: StorefrontEditorButtonNode['props']['shadow']): void {
  this.updateSelectedImageProps({ shadow: value });
}

  private startImageCropInteraction(
    sectionId: string,
    componentId: string,
    mode: 'move' | 'resize',
    handle: string | null,
    event: MouseEvent
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const component = this.findImageComponent(sectionId, componentId);
    if (!component) {
      return;
    }

    this.selectComponent(sectionId, componentId);
    const viewport = this.resolveImageCropViewportRect(component, this.resolveImageCropEditingFrame(component));
    const crop = this.resolveNormalizedImageCropRect(component);
    this.activeImageCrop = {
      sectionId,
      componentId,
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: component.rotation ?? 0,
      viewport,
      startCrop: {
        x: crop.x * viewport.width,
        y: crop.y * viewport.height,
        width: crop.width * viewport.width,
        height: crop.height * viewport.height,
      },
    };
  }

  private updateImageCropInteraction(event: MouseEvent): void {
    if (!this.activeImageCrop) {
      return;
    }

    const interaction = this.activeImageCrop;
    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;
    const localDelta = this.rotateVectorToLocal(deltaX, deltaY, interaction.startRotation);
    const minWidth = Math.min(interaction.viewport.width, Math.max(36, interaction.viewport.width * 0.12));
    const minHeight = Math.min(interaction.viewport.height, Math.max(36, interaction.viewport.height * 0.12));
    let left = interaction.startCrop.x;
    let top = interaction.startCrop.y;
    let right = interaction.startCrop.x + interaction.startCrop.width;
    let bottom = interaction.startCrop.y + interaction.startCrop.height;

    if (interaction.mode === 'move') {
      const nextLeft = Math.max(0, Math.min(interaction.startCrop.x + localDelta.x, interaction.viewport.width - interaction.startCrop.width));
      const nextTop = Math.max(0, Math.min(interaction.startCrop.y + localDelta.y, interaction.viewport.height - interaction.startCrop.height));
      left = nextLeft;
      top = nextTop;
      right = nextLeft + interaction.startCrop.width;
      bottom = nextTop + interaction.startCrop.height;
    } else {
      if (interaction.handle?.includes('e')) {
        right = Math.max(left + minWidth, Math.min(interaction.viewport.width, right + localDelta.x));
      }
      if (interaction.handle?.includes('w')) {
        left = Math.min(right - minWidth, Math.max(0, left + localDelta.x));
      }
      if (interaction.handle?.includes('s')) {
        bottom = Math.max(top + minHeight, Math.min(interaction.viewport.height, bottom + localDelta.y));
      }
      if (interaction.handle?.includes('n')) {
        top = Math.min(bottom - minHeight, Math.max(0, top + localDelta.y));
      }
    }

    this.updateImageComponentProps(interaction.sectionId, interaction.componentId, {
      cropX: left / interaction.viewport.width,
      cropY: top / interaction.viewport.height,
      cropWidth: (right - left) / interaction.viewport.width,
      cropHeight: (bottom - top) / interaction.viewport.height,
    });
  }

  private findImageComponent(sectionId: string, componentId: string): StorefrontEditorImageNode | null {
    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    return component?.type === 'image' ? component : null;
  }

  private resolveImageCropFrameRect(component: StorefrontEditorImageNode): { x: number; y: number; width: number; height: number } {
    const viewport = this.resolveImageCropViewportRect(component, this.resolveImageCropEditingFrame(component));
    const crop = this.resolveNormalizedImageCropRect(component);
    return {
      x: viewport.x + crop.x * viewport.width,
      y: viewport.y + crop.y * viewport.height,
      width: crop.width * viewport.width,
      height: crop.height * viewport.height,
    };
  }

  private resolveNormalizedImageCropRect(component: StorefrontEditorImageNode): { x: number; y: number; width: number; height: number } {
    return normalizeStorefrontEditorImageCropRect(component.props);
  }

  private resolveImageCropViewportRect(
    component: StorefrontEditorImageNode,
    frame: StorefrontEditorComponentNode['frame'] = component.frame
  ): { x: number; y: number; width: number; height: number } {
    return resolveStorefrontEditorImageViewportBounds(component.props, frame.width, frame.height);
  }

  private resolveImageCropEditingFrame(component: StorefrontEditorImageNode): StorefrontEditorComponentNode['frame'] {
    const outerWidth = Math.max(component.props.cropOuterWidth ?? component.frame.width, component.frame.width);
    const outerHeight = Math.max(component.props.cropOuterHeight ?? component.frame.height, component.frame.height);
    const offsetX = Number.isFinite(component.props.cropOuterOffsetX) ? component.props.cropOuterOffsetX : 0;
    const offsetY = Number.isFinite(component.props.cropOuterOffsetY) ? component.props.cropOuterOffsetY : 0;
    return {
      x: component.frame.x + offsetX,
      y: component.frame.y + offsetY,
      width: outerWidth,
      height: outerHeight,
    };
  }

  private prepareImageCropEditingState(sectionId: string, component: StorefrontEditorImageNode): void {
    const crop = this.resolveNormalizedImageCropRect(component);
    const outerWidth = Math.max(component.props.cropOuterWidth ?? component.frame.width, component.frame.width);
    const outerHeight = Math.max(component.props.cropOuterHeight ?? component.frame.height, component.frame.height);
    const offsetX = Number(component.props.cropOuterOffsetX ?? 0);
    const offsetY = Number(component.props.cropOuterOffsetY ?? 0);
    const epsilon = 0.001;
    const isDefaultCrop =
      crop.x <= epsilon
      && crop.y <= epsilon
      && crop.width >= 1 - epsilon
      && crop.height >= 1 - epsilon;
    const hasStoredOuter =
      Math.abs(offsetX) > epsilon
      || Math.abs(offsetY) > epsilon
      || Math.abs(outerWidth - component.frame.width) > epsilon
      || Math.abs(outerHeight - component.frame.height) > epsilon;

    if (!isDefaultCrop || hasStoredOuter || resolveStorefrontEditorImageDisplayMode(component.props) !== 'fill') {
      return;
    }

    const frame = component.frame;
    const frameAspectRatio = frame.width > 0 && frame.height > 0 ? frame.width / frame.height : 1;
    const imageAspectRatio = resolveStorefrontEditorImageAspectRatio(component.props, frameAspectRatio);

    if (Math.abs(imageAspectRatio - frameAspectRatio) <= epsilon) {
      return;
    }

    let nextOuterOffsetX = 0;
    let nextOuterOffsetY = 0;
    let nextOuterWidth = frame.width;
    let nextOuterHeight = frame.height;
    let nextCropX = 0;
    let nextCropY = 0;
    let nextCropWidth = 1;
    let nextCropHeight = 1;

    if (imageAspectRatio > frameAspectRatio) {
      nextOuterWidth = frame.height * imageAspectRatio;
      nextOuterOffsetX = (frame.width - nextOuterWidth) / 2;
      nextCropX = -nextOuterOffsetX / nextOuterWidth;
      nextCropWidth = frame.width / nextOuterWidth;
    } else {
      nextOuterHeight = frame.width / imageAspectRatio;
      nextOuterOffsetY = (frame.height - nextOuterHeight) / 2;
      nextCropY = -nextOuterOffsetY / nextOuterHeight;
      nextCropHeight = frame.height / nextOuterHeight;
    }

    this.updateImageComponentProps(sectionId, component.id, {
      cropX: nextCropX,
      cropY: nextCropY,
      cropWidth: nextCropWidth,
      cropHeight: nextCropHeight,
      cropOuterOffsetX: nextOuterOffsetX,
      cropOuterOffsetY: nextOuterOffsetY,
      cropOuterWidth: nextOuterWidth,
      cropOuterHeight: nextOuterHeight,
    });
  }

  private exitImageCropMode(): void {
    const componentId = this.croppingImageComponentId();
    this.activeImageCrop = null;
    if (!componentId) {
      return;
    }

    const located = this.findImageComponentLocation(componentId);
    if (located) {
      this.commitImageCrop(located.sectionId, located.component);
    }
    this.croppingImageComponentId.set(null);
  }

  private commitImageCrop(sectionId: string, component: StorefrontEditorImageNode): void {
    const outerFrame = this.resolveImageCropEditingFrame(component);
    const cropRect = this.resolveImageCropFrameRect(component);
    const nextFrame = {
      x: outerFrame.x + cropRect.x,
      y: outerFrame.y + cropRect.y,
      width: cropRect.width,
      height: cropRect.height,
    };

    this.updateComponentNode(sectionId, component.id, (current) =>
      current.type === 'image'
        ? {
            ...current,
            frame: nextFrame,
            props: {
              ...current.props,
              cropOuterOffsetX: outerFrame.x - nextFrame.x,
              cropOuterOffsetY: outerFrame.y - nextFrame.y,
              cropOuterWidth: outerFrame.width,
              cropOuterHeight: outerFrame.height,
            },
          }
        : current
    );
  }

  private findImageComponentLocation(componentId: string): { sectionId: string; component: StorefrontEditorImageNode } | null {
    for (const section of this.sections()) {
      const component = this.readSectionComponents(section).find((item) => item.id === componentId);
      if (component?.type === 'image') {
        return {
          sectionId: section.id,
          component,
        };
      }
    }

    return null;
  }

  toggleImageBorderColorPicker(): void {
    const next = !this.isImageBorderColorPickerOpen();
    this.isImageBorderColorPickerOpen.set(next);
    if (next) {
      this.isImageBorderStylePickerOpen.set(false);
      this.activeImageBorderColorTab.set('brand');
      this.syncImageBorderColorPickerFromHex(this.imageBorderColor(this.selectedImageComponent()));
    }
  }

  setActiveImageBorderColorTab(tab: 'brand' | 'custom'): void {
    this.activeImageBorderColorTab.set(tab);
  }

  toggleImageBorderStylePicker(): void {
    const next = !this.isImageBorderStylePickerOpen();
    this.isImageBorderStylePickerOpen.set(next);
    if (next) {
      this.isImageBorderColorPickerOpen.set(false);
    }
  }

  startImageBorderColorCanvasDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeImageBorderColorCanvasDrag = true;
    this.updateImageBorderColorFromCanvasEvent(event);
  }

  startImageBorderHueDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeImageBorderColorHueDrag = true;
    this.updateImageBorderColorFromHueEvent(event);
  }

  updateImageBorderHex(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    this.updateSelectedImageBorderColor(normalized);
  }

  applySavedImageBorderColor(color: string): void {
    this.updateSelectedImageBorderColor(color);
  }

  textStylePreviewFontSize(style: StorefrontEditorTextStylePreset): number {
    return Math.min(buildStorefrontEditorTextProps(style).fontSize, 22);
  }

  startEditingSelectedTextComponent(): void {
    const sectionId = this.selectedSectionId();
    const component = this.selectedTextComponent();
    if (!sectionId || !component) {
      return;
    }

    this.isEditingComponentText.set(true);
    this.editingComponentTextId.set(component.id);
    this.editingComponentTextValue.set(this.readEditableComponentText(component));
    setTimeout(() => this.focusActiveTextEditor(), 0);
  }

  private buildManagedPageHref(pageId: string): string {
    if (pageId === 'home') {
      return '/';
    }

    const page = this.managedPages().find((item) => item.id === pageId);
    if (!page) {
      return '/';
    }

    const slug = page.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return slug ? `/${slug}` : '/';
  }

  private findManagedPageIdForHref(href: string): string {
    const normalizedHref = href.trim();
    if (!normalizedHref || normalizedHref === '/') {
      return 'home';
    }

    const match = this.managedPages().find((page) => this.buildManagedPageHref(page.id) === normalizedHref);
    return match?.id ?? 'home';
  }

  private syncManagedPageLinkSelection(
    href: string,
    openInNewTab: boolean,
    pageIdSignal: WritableSignal<string>,
    openModeSignal: WritableSignal<'current' | 'new'>
  ): void {
    pageIdSignal.set(this.findManagedPageIdForHref(href));
    openModeSignal.set(openInNewTab ? 'new' : 'current');
  }

  toggleContainerToolbarMenu(menu: Exclude<ContainerToolbarMenu, null>): void {
    const next = this.activeContainerToolbarMenu() === menu ? null : menu;
    this.activeContainerToolbarMenu.set(next);

    if (next !== 'borders') {
      this.isContainerBorderColorPickerOpen.set(false);
      this.isContainerBorderStylePickerOpen.set(false);
    }

    if (next === 'background') {
      this.activeContainerBackgroundTab.set('brand');
      this.syncContainerBackgroundColorPickerFromHex(this.containerBackgroundColor(this.selectedContainerComponent()) ?? '#ffffff');
    }
  }

  setActiveContainerBackgroundTab(tab: 'brand' | 'custom'): void {
    this.activeContainerBackgroundTab.set(tab);
  }

  applyContainerDesignPreset(preset: StorefrontEditorContainerDesignPreset): void {
    this.updateSelectedContainerProps(preset.patch);
    this.activeContainerToolbarMenu.set(null);
  }

  updateSelectedContainerBackgroundColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    if (normalized !== 'transparent') {
      this.syncContainerBackgroundColorPickerFromHex(normalized);
    }

    this.updateSelectedContainerProps({ backgroundColor: normalized });
  }

  updateSelectedContainerBorderColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    this.syncContainerBorderColorPickerFromHex(normalized);
    this.rememberSectionBorderColor(normalized);
    this.updateSelectedContainerProps({ borderColor: normalized });
  }

  updateSelectedContainerBorderWidth(value: string | number): void {
    const parsed = Number(value);
    const component = this.selectedContainerComponent();
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedContainerProps({
      borderWidth: Math.max(0, Math.min(12, Math.round(parsed))),
      borderStyle: component?.props.borderStyle === 'none' ? 'solid' : (component?.props.borderStyle ?? 'solid'),
    });
  }

  updateSelectedContainerBorderStyle(value: 'solid' | 'dashed' | 'dotted' | 'double'): void {
    const width = Math.max(this.containerBorderWidth(this.selectedContainerComponent()), 1);
    this.updateSelectedContainerProps({
      borderStyle: value,
      borderWidth: width,
    });
    this.isContainerBorderStylePickerOpen.set(false);
  }

  updateSelectedContainerRadius(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedContainerProps({ radius: Math.max(0, Math.min(999, Math.round(parsed))) });
  }

updateSelectedContainerShadow(value: StorefrontEditorButtonNode['props']['shadow']): void {
  this.updateSelectedContainerProps({ shadow: value });
}

  updateSelectedContainerOpacity(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedContainerProps({ opacity: Math.max(0, Math.min(100, Math.round(parsed))) });
  }

  startContainerBackgroundColorCanvasDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeContainerBackgroundColorCanvasDrag = true;
    this.updateContainerBackgroundColorFromCanvasEvent(event);
  }

  startContainerBackgroundHueDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeContainerBackgroundColorHueDrag = true;
    this.updateContainerBackgroundColorFromHueEvent(event);
  }

  updateContainerBackgroundHex(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    this.updateSelectedContainerBackgroundColor(normalized);
  }

  toggleContainerBorderColorPicker(): void {
    const next = !this.isContainerBorderColorPickerOpen();
    this.isContainerBorderColorPickerOpen.set(next);
    if (next) {
      this.isContainerBorderStylePickerOpen.set(false);
      this.activeContainerBorderColorTab.set('brand');
      this.syncContainerBorderColorPickerFromHex(this.containerBorderColor(this.selectedContainerComponent()));
    }
  }

  toggleContainerBorderStylePicker(): void {
    const next = !this.isContainerBorderStylePickerOpen();
    this.isContainerBorderStylePickerOpen.set(next);
    if (next) {
      this.isContainerBorderColorPickerOpen.set(false);
    }
  }

  setActiveContainerBorderColorTab(tab: 'brand' | 'custom'): void {
    this.activeContainerBorderColorTab.set(tab);
  }

  startContainerBorderColorCanvasDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeContainerBorderColorCanvasDrag = true;
    this.updateContainerBorderColorFromCanvasEvent(event);
  }

  startContainerBorderHueDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeContainerBorderColorHueDrag = true;
    this.updateContainerBorderColorFromHueEvent(event);
  }

  updateContainerBorderHex(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    this.updateSelectedContainerBorderColor(normalized);
  }

  applySavedContainerBorderColor(color: string): void {
    this.updateSelectedContainerBorderColor(color);
  }

  startCustomColorCanvasDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeColorCanvasDrag = true;
    this.updateCustomColorFromCanvasEvent(event);
  }

  startCustomColorHueDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeColorHueDrag = true;
    this.updateCustomColorFromHueEvent(event);
  }

  updateCustomColorHex(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }
    this.updateSelectedParagraphColor(normalized);
  }

  removeSavedParagraphColor(color: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = this.savedParagraphColors().filter((item) => item !== color);
    this.savedParagraphColors.set(next);
    localStorage.setItem(ProjectStorefrontEditor.SAVED_PARAGRAPH_COLORS_STORAGE_KEY, JSON.stringify(next));
  }

  toggleSectionToolbarMenu(menu: Exclude<SectionToolbarMenu, null>): void {
    const next = this.activeSectionToolbarMenu() === menu ? null : menu;
    this.sectionAddMenuSectionId.set(null);
    this.sectionOptionsMenuId.set(null);
    this.activeSectionToolbarMenu.set(next);
    if (next !== 'borders') {
      this.isSectionBorderColorPickerOpen.set(false);
      this.isSectionBorderStylePickerOpen.set(false);
    }

    if (next === 'background') {
      this.activeSectionBackgroundTab.set('brand');
      this.syncSectionBackgroundColorPickerFromHex(this.sectionBackgroundColor(this.selectedSection()) ?? '#ffffff');
    }
  }

  setActiveSectionBackgroundTab(tab: 'brand' | 'custom'): void {
    this.activeSectionBackgroundTab.set(tab);
  }

  applySelectedSectionLayoutPreset(presetId: StorefrontEditorSectionLayoutPresetId): void {
    const preset = this.getSectionLayoutPresetById(presetId);
    const sectionId = this.selectedSectionId();
    if (!sectionId) {
      return;
    }

    this.updateSectionLayoutStructure(sectionId, (section) => {
      const nextProps: Record<string, unknown> = {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_LAYOUT_PROP_KEY]: preset.id,
        [ProjectStorefrontEditor.SECTION_LAYOUT_COLUMNS_PROP_KEY]: preset.columns,
        [ProjectStorefrontEditor.SECTION_LAYOUT_ROWS_PROP_KEY]: preset.rows,
        [ProjectStorefrontEditor.SECTION_LAYOUT_COLUMN_SIZES_PROP_KEY]: this.getDefaultSectionLayoutTrackSizes(
          preset.id,
          'column',
          preset.columns
        ),
        [ProjectStorefrontEditor.SECTION_LAYOUT_ROW_SIZES_PROP_KEY]: this.getDefaultSectionLayoutTrackSizes(
          preset.id,
          'row',
          preset.rows
        ),
      };

      if (preset.id === 'none') {
        nextProps[ProjectStorefrontEditor.SECTION_LAYOUT_ASSIGNMENTS_PROP_KEY] = [];
      }

      return {
        ...section,
        props: nextProps,
      };
    });
  }

  adjustSelectedSectionLayoutColumns(delta: number): void {
    const section = this.selectedSection();
    if (!section || !this.sectionShowsLayoutControls(section)) {
      return;
    }

    const nextValue = Math.max(1, Math.min(6, this.sectionLayoutColumns(section) + delta));
    const sectionId = section.id;
    const presetId = this.sectionLayoutPresetId(section);
    this.updateSectionLayoutStructure(sectionId, (current) => ({
      ...current,
      props: {
        ...current.props,
        [ProjectStorefrontEditor.SECTION_LAYOUT_COLUMNS_PROP_KEY]: nextValue,
        [ProjectStorefrontEditor.SECTION_LAYOUT_COLUMN_SIZES_PROP_KEY]: this.getDefaultSectionLayoutTrackSizes(
          presetId,
          'column',
          nextValue
        ),
      },
    }));
  }

  adjustSelectedSectionLayoutRows(delta: number): void {
    const section = this.selectedSection();
    if (!section || !this.sectionShowsLayoutControls(section)) {
      return;
    }

    const nextValue = Math.max(1, Math.min(6, this.sectionLayoutRows(section) + delta));
    const sectionId = section.id;
    const presetId = this.sectionLayoutPresetId(section);
    this.updateSectionLayoutStructure(sectionId, (current) => ({
      ...current,
      props: {
        ...current.props,
        [ProjectStorefrontEditor.SECTION_LAYOUT_ROWS_PROP_KEY]: nextValue,
        [ProjectStorefrontEditor.SECTION_LAYOUT_ROW_SIZES_PROP_KEY]: this.getDefaultSectionLayoutTrackSizes(
          presetId,
          'row',
          nextValue
        ),
      },
    }));
  }

  beginSectionLayoutResize(
    sectionId: string,
    axis: StorefrontEditorSectionLayoutTrackAxis,
    separatorIndex: number,
    event: MouseEvent
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((candidate) => candidate.id === sectionId) ?? null;
    const dimensions = this.getSectionContentDimensions(sectionId);
    if (!section || !dimensions) {
      return;
    }

    const trackCount = axis === 'column' ? this.sectionLayoutColumns(section) : this.sectionLayoutRows(section);
    if (trackCount <= 1) {
      return;
    }

    const availableSize = Math.max(
      1,
      (axis === 'column' ? dimensions.width : dimensions.height) -
        (ProjectStorefrontEditor.SECTION_LAYOUT_PADDING_PX * 2) -
        (ProjectStorefrontEditor.SECTION_LAYOUT_GAP_PX * Math.max(0, trackCount - 1))
    );

    this.activeSectionLayoutResize = {
      sectionId,
      axis,
      separatorIndex,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startSizes:
        axis === 'column'
          ? [...this.sectionLayoutColumnTrackSizes(section)]
          : [...this.sectionLayoutRowTrackSizes(section)],
      availableSize,
    };
  }

  updateSelectedSectionBackgroundColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    if (normalized !== 'transparent') {
      this.syncSectionBackgroundColorPickerFromHex(normalized);
    }

    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_BACKGROUND_PROP_KEY]: normalized,
      },
    }));
  }

  startSectionBackgroundColorCanvasDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeSectionBackgroundColorCanvasDrag = true;
    this.updateSectionBackgroundColorFromCanvasEvent(event);
  }

  startSectionBackgroundHueDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeSectionBackgroundColorHueDrag = true;
    this.updateSectionBackgroundColorFromHueEvent(event);
  }

  updateSectionBackgroundHex(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    this.updateSelectedSectionBackgroundColor(normalized);
  }

  updateSelectedSectionBorderColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    this.syncSectionBorderColorPickerFromHex(normalized);
    this.rememberSectionBorderColor(normalized);
    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_BORDER_COLOR_PROP_KEY]: normalized,
      },
    }));
  }

  updateSelectedSectionBorderWidth(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const nextWidth = Math.max(0, Math.min(12, Math.round(parsed)));
    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_BORDER_WIDTH_PROP_KEY]: nextWidth,
        [ProjectStorefrontEditor.SECTION_BORDER_STYLE_PROP_KEY]: this.sectionBorderStyle(section),
      },
    }));
  }

  updateSelectedSectionBorderStyle(value: 'solid' | 'dashed' | 'dotted' | 'double'): void {
    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_BORDER_STYLE_PROP_KEY]: value,
        [ProjectStorefrontEditor.SECTION_BORDER_WIDTH_PROP_KEY]: Math.max(this.sectionBorderWidth(section), 1),
      },
    }));
    this.isSectionBorderStylePickerOpen.set(false);
  }

  updateSelectedSectionRadius(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_RADIUS_PROP_KEY]: Math.max(0, Math.min(999, Math.round(parsed))),
      },
    }));
  }

  updateSelectedSectionOpacity(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_OPACITY_PROP_KEY]: Math.max(0, Math.min(100, Math.round(parsed))),
      },
    }));
  }

  toggleSectionBorderColorPicker(): void {
    const next = !this.isSectionBorderColorPickerOpen();
    this.isSectionBorderColorPickerOpen.set(next);
    if (next) {
      this.isSectionBorderStylePickerOpen.set(false);
    }
    if (next) {
      this.activeSectionBorderColorTab.set('brand');
      this.syncSectionBorderColorPickerFromHex(this.sectionBorderColor(this.selectedSection()));
    }
  }

  toggleSectionBorderStylePicker(): void {
    const next = !this.isSectionBorderStylePickerOpen();
    this.isSectionBorderStylePickerOpen.set(next);
    if (next) {
      this.isSectionBorderColorPickerOpen.set(false);
    }
  }

  setActiveSectionBorderColorTab(tab: 'brand' | 'custom'): void {
    this.activeSectionBorderColorTab.set(tab);
  }

  startSectionBorderColorCanvasDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeSectionBorderColorCanvasDrag = true;
    this.updateSectionBorderColorFromCanvasEvent(event);
  }

  startSectionBorderHueDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeSectionBorderColorHueDrag = true;
    this.updateSectionBorderColorFromHueEvent(event);
  }

  updateSectionBorderHex(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    this.updateSelectedSectionBorderColor(normalized);
  }

applySavedSectionBorderColor(color: string): void {
  this.updateSelectedSectionBorderColor(color);
}

private updateImageBorderColorFromCanvasEvent(event: MouseEvent): void {
  const target = event.currentTarget instanceof HTMLElement
    ? event.currentTarget
    : document.querySelector('.storefront-editor__image-borders-color-canvas');
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
  const saturation = rect.width === 0 ? 0 : (x / rect.width) * 100;
  const brightness = rect.height === 0 ? 0 : 100 - (y / rect.height) * 100;

  this.imageBorderCustomPickerSaturation.set(Math.round(saturation));
  this.imageBorderCustomPickerBrightness.set(Math.round(brightness));

  const hex = this.hsvToHex(
    this.imageBorderCustomPickerHue(),
    this.imageBorderCustomPickerSaturation(),
    this.imageBorderCustomPickerBrightness()
  );
  this.updateSelectedImageBorderColor(hex);
}

private updateImageBorderColorFromHueEvent(event: MouseEvent): void {
  const target = event.currentTarget instanceof HTMLElement
    ? event.currentTarget
    : document.querySelector('.storefront-editor__image-borders-color-spectrum');
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const hue = rect.width === 0 ? 0 : (x / rect.width) * 360;
  this.imageBorderCustomPickerHue.set(Math.round(hue));

  const hex = this.hsvToHex(
    this.imageBorderCustomPickerHue(),
    this.imageBorderCustomPickerSaturation(),
    this.imageBorderCustomPickerBrightness()
  );
  this.updateSelectedImageBorderColor(hex);
}

private syncImageBorderColorPickerFromHex(color: string): void {
  const normalized = this.normalizeHexColor(color);
  if (!normalized || normalized === 'transparent') {
    return;
  }

  const { h, s, v } = this.hexToHsv(normalized);
  this.imageBorderCustomPickerHue.set(h);
  this.imageBorderCustomPickerSaturation.set(s);
  this.imageBorderCustomPickerBrightness.set(v);
}

toggleButtonToolbarMenu(menu: Exclude<ButtonToolbarMenu, null>): void {
  const next = this.activeButtonToolbarMenu() === menu ? null : menu;
  this.activeButtonToolbarMenu.set(next);

    if (next === 'edit-text') {
      this.buttonEditTextValue.set(this.selectedButtonComponent()?.props.label ?? '');
    }

    if (next === 'link' || next === 'settings') {
      this.buttonLinkValue.set(this.selectedButtonComponent()?.props.href ?? '');
    }

    if (next === 'colors') {
      this.activeButtonColorPickerTab.set('brand');
      this.syncButtonCustomColorPickerFromHex(this.selectedButtonComponent()?.props.backgroundColor ?? '#355cff');
    }
  }

  toggleProductFeedToolbarMenu(menu: Exclude<ProductFeedToolbarMenu, null>): void {
    const next = this.activeProductFeedToolbarMenu() === menu ? null : menu;
    this.activeProductFeedToolbarMenu.set(next);

    if (next === 'settings') {
      this.activeProductFeedSettingsSection.set('category');
    }

    if (next === 'color') {
      this.productFeedTextColorValue.set(this.selectedProductFeedComponent()?.props.textColor ?? '#202124');
    }
  }

  setActiveProductFeedSettingsSection(section: ProductFeedSettingsSection): void {
    this.activeProductFeedSettingsSection.set(section);
  }

  applyProductFeedDesignPreset(preset: StorefrontEditorProductFeedDesignPreset): void {
    const component = this.selectedProductFeedComponent();
    if (!component) {
      return;
    }

    this.updateSelectedProductFeedProps(
      buildStorefrontEditorProductFeedProps(preset.id, {
        category: component.props.category,
        textColor: component.props.textColor,
      })
    );
    this.activeProductFeedToolbarMenu.set(null);
  }

  setSelectedProductFeedCategory(category: string): void {
    this.updateSelectedProductFeedProps({ category });
  }

  updateSelectedProductFeedTextColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    this.productFeedTextColorValue.set(normalized);
    this.updateSelectedProductFeedProps({ textColor: normalized });
  }

  toggleSelectedProductFeedShowBadges(): void {
    const component = this.selectedProductFeedComponent();
    if (!component) {
      return;
    }

    this.updateSelectedProductFeedProps({ showBadges: !component.props.showBadges });
  }

  toggleSelectedProductFeedShowComparePrice(): void {
    const component = this.selectedProductFeedComponent();
    if (!component) {
      return;
    }

    this.updateSelectedProductFeedProps({ showCompareAtPrice: !component.props.showCompareAtPrice });
  }

  toggleSelectedProductFeedShowColorDots(): void {
    const component = this.selectedProductFeedComponent();
    if (!component) {
      return;
    }

    this.updateSelectedProductFeedProps({ showColorDots: !component.props.showColorDots });
  }

  toggleSelectedProductFeedShowFilters(): void {
    const component = this.selectedProductFeedComponent();
    if (!component) {
      return;
    }

    this.updateSelectedProductFeedProps({ showFilters: !component.props.showFilters });
  }

  toggleSelectedProductFeedShowSort(): void {
    const component = this.selectedProductFeedComponent();
    if (!component) {
      return;
    }

    this.updateSelectedProductFeedProps({ showSort: !component.props.showSort });
  }

  setSelectedProductFeedAddToCartMode(mode: StorefrontEditorProductFeedNode['props']['quickAddStyle']): void {
    this.updateSelectedProductFeedProps({
      quickAddStyle: mode,
      showAddToCart: mode !== 'none',
    });
  }

  updateSelectedProductFeedLimit(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedProductFeedProps({ limit: Math.max(1, Math.min(12, Math.round(parsed))) });
  }

  updateSelectedProductFeedColumns(value: string | number): void {
    const parsed = Number(value);
    const columns = parsed === 5 ? 5 : parsed === 4 ? 4 : 3;
    this.updateSelectedProductFeedProps({ columns });
  }

  openProjectCatalogManager(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    const url = this.router.serializeUrl(this.router.createUrlTree(['/app/projects', projectId, 'catalog']));
    window.open(url, '_blank', 'noopener');
  }

  updateSelectedButtonTextValue(value: string): void {
    this.buttonEditTextValue.set(value);
    this.updateSelectedButtonProps({ label: value });
  }

  updateSelectedButtonLinkValue(value: string): void {
    this.buttonLinkValue.set(value);
    this.updateSelectedButtonProps({ href: value });
  }

  updateSelectedButtonTextPreset(value: StorefrontEditorButtonNode['props']['textPreset']): void {
    const nextPatch: Partial<StorefrontEditorButtonNode['props']> = { textPreset: value };

    switch (value) {
      case 'Paragraph 1':
        nextPatch.fontFamily = 'Fira Sans';
        nextPatch.fontSize = 16;
        nextPatch.fontWeight = 500;
        break;
      case 'Heading 4':
        nextPatch.fontFamily = 'Poppins';
        nextPatch.fontSize = 18;
        nextPatch.fontWeight = 600;
        break;
      case 'Paragraph 2':
      default:
        nextPatch.fontFamily = 'Fira Mono';
        nextPatch.fontSize = 15;
        nextPatch.fontWeight = 500;
        break;
    }

    this.updateSelectedButtonProps(nextPatch);
  }

  updateSelectedButtonFontFamily(value: string): void {
    this.updateSelectedButtonProps({ fontFamily: value });
  }

  updateSelectedButtonFontSize(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedButtonProps({ fontSize: Math.max(10, Math.min(96, Math.round(parsed))) });
  }

  updateSelectedButtonFontWeight(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const nextWeight = [400, 500, 600, 700].includes(parsed) ? (parsed as 400 | 500 | 600 | 700) : 500;
    this.updateSelectedButtonProps({ fontWeight: nextWeight });
  }

  updateSelectedButtonTextColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    this.updateSelectedButtonProps({ textColor: normalized });
  }

  updateSelectedButtonBackgroundColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }
    if (normalized !== 'transparent') {
      this.syncButtonCustomColorPickerFromHex(normalized);
    }

    this.updateSelectedButtonProps({ backgroundColor: normalized });
  }

  updateSelectedButtonBorderStyle(value: StorefrontEditorButtonNode['props']['borderStyle']): void {
    this.updateSelectedButtonProps({
      borderStyle: value,
      borderWidth: value === 'none' ? 0 : Math.max(this.selectedButtonComponent()?.props.borderWidth ?? 1, 1),
    });
  }

  updateSelectedButtonBorderWidth(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedButtonProps({ borderWidth: Math.max(0, Math.min(12, Math.round(parsed))) });
  }

  updateSelectedButtonBorderColor(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    this.updateSelectedButtonProps({ borderColor: normalized });
  }

  updateSelectedButtonRadius(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedButtonProps({ radius: Math.max(0, Math.min(999, Math.round(parsed))) });
  }

updateSelectedButtonShadow(value: StorefrontEditorButtonNode['props']['shadow']): void {
  this.updateSelectedButtonProps({ shadow: value });
}

  updateSelectedButtonPadding(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.updateSelectedButtonProps({ padding: Math.max(6, Math.min(40, Math.round(parsed))) });
  }

  toggleSelectedButtonShowText(): void {
    const component = this.selectedButtonComponent();
    if (!component) {
      return;
    }

    if (component.props.showText && !component.props.showIcon) {
      return;
    }

    this.updateSelectedButtonProps({ showText: !component.props.showText });
  }

  toggleSelectedButtonShowIcon(): void {
    const component = this.selectedButtonComponent();
    if (!component) {
      return;
    }

    if (component.props.showIcon && !component.props.showText) {
      return;
    }

    this.updateSelectedButtonProps({ showIcon: !component.props.showIcon });
  }

  updateSelectedButtonIconName(value: StorefrontEditorButtonNode['props']['iconName']): void {
    this.updateSelectedButtonProps({ iconName: value, customIconSrc: null, showIcon: true });
  }

  updateSelectedButtonIconMotion(value: StorefrontEditorButtonNode['props']['iconMotion']): void {
    this.updateSelectedButtonProps({ iconMotion: value });
  }

  updateSelectedButtonCustomIcon(value: string | null): void {
    this.updateSelectedButtonProps({ customIconSrc: value, showIcon: true });
  }

  toggleSelectedButtonIconPosition(): void {
    const component = this.selectedButtonComponent();
    if (!component) {
      return;
    }

    this.updateSelectedButtonProps({
      iconPosition: component.props.iconPosition === 'left' ? 'right' : 'left',
      showIcon: true,
    });
  }

  applyButtonDesignPreset(preset: StorefrontEditorButtonDesignPreset): void {
    this.updateSelectedButtonProps(preset.patch);
    this.buttonEditTextValue.set(preset.patch.label ?? this.buttonEditTextValue());
  }

  setActiveButtonColorPickerTab(tab: 'brand' | 'custom'): void {
    this.activeButtonColorPickerTab.set(tab);
  }

  saveSelectedButtonColor(): void {
    const color = this.selectedButtonComponent()?.props.backgroundColor;
    if (!color) {
      return;
    }

    const normalized = color.trim().toLowerCase();
    const next = [normalized, ...this.savedButtonColors().filter((item) => item !== normalized)].slice(0, 12);
    this.savedButtonColors.set(next);
    localStorage.setItem(ProjectStorefrontEditor.SAVED_BUTTON_COLORS_STORAGE_KEY, JSON.stringify(next));
    this.activeButtonColorPickerTab.set('brand');
  }

  applySavedButtonColor(color: string): void {
    this.updateSelectedButtonBackgroundColor(color);
  }

  startButtonCustomColorCanvasDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeButtonColorCanvasDrag = true;
    this.updateButtonCustomColorFromCanvasEvent(event);
  }

  startButtonCustomColorHueDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeButtonColorHueDrag = true;
    this.updateButtonCustomColorFromHueEvent(event);
  }

  updateButtonCustomColorHex(value: string): void {
    const normalized = this.normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    this.updateSelectedButtonBackgroundColor(normalized);
  }

  removeSavedButtonColor(color: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = this.savedButtonColors().filter((item) => item !== color);
    this.savedButtonColors.set(next);
    localStorage.setItem(ProjectStorefrontEditor.SAVED_BUTTON_COLORS_STORAGE_KEY, JSON.stringify(next));
  }

  buttonDesignPreviewStyle(preset: StorefrontEditorButtonDesignPreset): Record<string, string> {
    const patch = preset.patch;
    const backgroundColor = patch.backgroundColor ?? '#0f172a';
    const textColor = patch.textColor ?? '#ffffff';
    const borderStyle = patch.borderStyle ?? 'none';
    const borderWidth = borderStyle === 'none' ? 0 : patch.borderWidth ?? 1;
    const borderColor = patch.borderColor ?? backgroundColor;
    const radius = patch.radius ?? 12;
    const fontFamily = patch.fontFamily ?? 'Fira Sans';
    const fontWeight = patch.fontWeight ?? 500;

    return {
      background: backgroundColor,
      color: textColor,
      borderStyle,
      borderWidth: `${borderWidth}px`,
      borderColor: borderStyle === 'none' ? 'transparent' : borderColor,
      borderRadius: `${radius}px`,
      fontFamily,
      fontWeight: String(fontWeight),
      boxShadow: this.getButtonShadowCssValue(patch.shadow ?? 'none'),
    };
  }

  containerDesignPreviewStyle(preset: StorefrontEditorContainerDesignPreset): Record<string, string> {
    const borderStyle = preset.patch.borderStyle ?? 'none';
    const borderWidth = borderStyle === 'none' ? 0 : preset.patch.borderWidth ?? 1;
    const backgroundColor = preset.patch.backgroundColor ?? 'transparent';

    return {
      background: backgroundColor === 'transparent' ? '#ffffff' : backgroundColor,
      borderStyle,
      borderWidth: `${borderWidth}px`,
      borderColor: borderWidth === 0 ? 'rgba(17, 24, 39, 0.08)' : (preset.patch.borderColor ?? '#111827'),
      borderRadius: `${preset.patch.radius ?? 0}px`,
      boxShadow: this.getButtonShadowCssValue(preset.patch.shadow ?? 'none'),
    };
  }

  sectionLayoutPreviewGridStyle(preset: StorefrontEditorSectionLayoutPreset): Record<string, string> {
    return {
      gridTemplateColumns: `repeat(${preset.previewColumns}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${preset.previewRows}, minmax(0, 1fr))`,
    };
  }

  sectionLayoutPreviewCellStyle(cell: { column: number; row: number; columnSpan?: number; rowSpan?: number }): Record<string, string> {
    return {
      gridColumn: `${cell.column} / span ${cell.columnSpan ?? 1}`,
      gridRow: `${cell.row} / span ${cell.rowSpan ?? 1}`,
    };
  }

  triggerPublishFromMenu(): void {
    this.closeFloatingUi();
    this.publishStorefront();
  }

  openAccountSettings(): void {
    this.closeFloatingUi();
    void this.router.navigate(['/app/settings/profile']);
  }

  openMediaManager(): void {
    this.closeFloatingUi();
    this.mediaManagerPurpose.set('general');
    this.isMediaManagerOpen.set(true);
  }

  openMediaManagerForButtonIcon(): void {
    this.closeFloatingUi();
    this.mediaManagerPurpose.set('button-icon');
    this.isMediaManagerOpen.set(true);
  }

  closeMediaManager(): void {
    this.isMediaManagerOpen.set(false);
    this.mediaManagerPurpose.set('general');
  }

  uploadMediaFromManager(files: FileList): void {
    const projectId = this.projectId();
    if (!projectId || !files.length || this.isMediaUploading()) {
      return;
    }

    const uploads = Array.from(files)
      .map((file) => ({ file, validation: this.uploadService.validateMedia(file) }))
      .filter(({ validation }) => validation.valid);

    const invalidUploads = Array.from(files).length - uploads.length;
    if (invalidUploads) {
      this.toastService.error('Some files were skipped because they are not supported image uploads.');
    }

    if (!uploads.length) {
      return;
    }

    this.isMediaUploading.set(true);
    forkJoin(uploads.map(({ file }) => this.uploadService.uploadProjectMedia(file, projectId)))
      .pipe(
        switchMap(() => this.projectService.getProjectMedia(projectId).pipe(catchError(() => of([])))),
        finalize(() => this.isMediaUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projectMedia) => {
          this.mediaAssets.set(this.buildMediaManagerAssets(projectMedia, this.products()));
          this.toastService.success(`${uploads.length} media file${uploads.length === 1 ? '' : 's'} uploaded.`);
        },
        error: () => this.toastService.error('Unable to upload media right now.'),
      });
  }

  confirmMediaSelection(asset: StorefrontMediaManagerAsset): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    if (asset.origin === 'PEXELS') {
      this.isMediaUploading.set(true);
      this.uploadService
        .importProjectMedia(projectId, {
          sourceUrl: asset.url,
          fileName: asset.name,
        })
        .pipe(
          switchMap(() => this.projectService.getProjectMedia(projectId).pipe(catchError(() => of([])))),
          finalize(() => this.isMediaUploading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (projectMedia) => {
            this.mediaAssets.set(this.buildMediaManagerAssets(projectMedia, this.products()));
            this.toastService.success(`${asset.name} imported to Site files.`);
          },
          error: () => this.toastService.error('Unable to import this Pexels photo right now.'),
        });
      return;
    }

  if (this.mediaManagerPurpose() === 'button-icon') {
    this.updateSelectedButtonCustomIcon(asset.url);
    this.toastService.success(`${asset.name} selected as button icon.`);
    this.closeMediaManager();
    return;
  }

if (this.mediaManagerPurpose() === 'image-component') {
  void this.applySelectedImageAsset(asset);
  return;
}

  this.toastService.success(`${asset.name} selected.`);
  this.closeMediaManager();
}

  deleteMediaFromManager(asset: StorefrontMediaManagerAsset): void {
    const projectId = this.projectId();
    if (!projectId || asset.origin !== 'PROJECT') {
      return;
    }

    this.isMediaUploading.set(true);
    this.projectService
      .deleteMedia(projectId, asset.id)
      .pipe(
        switchMap(() => this.projectService.getProjectMedia(projectId).pipe(catchError(() => of([])))),
        finalize(() => this.isMediaUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projectMedia) => {
          this.mediaAssets.set(this.buildMediaManagerAssets(projectMedia, this.products()));
          this.toastService.success(`${asset.name} removed from Site files.`);
        },
        error: () => this.toastService.error('Unable to remove this media asset right now.'),
      });
  }

  logout(): void {
    this.closeFloatingUi();
    this.authService.logout();
  }

  selectHomePage(): void {
    this.selectManagedPage('home');
  }

  selectManagedPage(pageId: string): void {
    this.pageCardMenuId.set(null);
    this.switchManagedPage(pageId);
    this.closePagesPanel();
    this.closeManagePages();
  }

  togglePagesLayout(): void {
    this.pagesPanelLayout.set(this.pagesPanelLayout() === 'grid' ? 'rows' : 'grid');
  }

toggleAddPageMenu(event?: MouseEvent): void {
  event?.stopPropagation();
  this.sectionAddMenuSectionId.set(null);
  this.isPageDesignPickerOpen.set(false);
  this.isPageDesignPickerClosing.set(false);
  this.isAddPageMenuOpen.update((open) => !open);
}

toggleSectionAddMenu(sectionId: string, event?: MouseEvent): void {
  event?.stopPropagation();
  const next = this.sectionAddMenuSectionId() === sectionId ? null : sectionId;
  const anchor = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  this.closeFloatingUi();
  this.sectionAddMenuPlacement.set(next ? this.getSectionAddMenuPlacement(anchor?.getBoundingClientRect() ?? null, 112) : 'below');
  this.sectionAddMenuSectionId.set(next);
}

  openPageDesignPicker(): void {
  if (this.pageDesignPickerCloseTimer) {
    clearTimeout(this.pageDesignPickerCloseTimer);
    this.pageDesignPickerCloseTimer = null;
  }
  if (this.managePagesCloseTimer) {
    clearTimeout(this.managePagesCloseTimer);
    this.managePagesCloseTimer = null;
  }
  this.isAddPageMenuOpen.set(false);
  this.isManagePagesOpen.set(false);
  this.isManagePagesClosing.set(false);
  this.pageCardMenuId.set(null);
  this.activePageDesignCategory.set('Business');
  this.isPageDesignPickerClosing.set(false);
  this.isPageDesignPickerOpen.set(true);
  setTimeout(() => this.updatePageDesignTabScrollState(), 0);
}

closePageDesignPicker(): void {
  if (!this.isPageDesignPickerOpen() && !this.isPageDesignPickerClosing()) {
    return;
  }

  if (this.pageDesignPickerCloseTimer) {
    clearTimeout(this.pageDesignPickerCloseTimer);
  }

  this.isPageDesignPickerOpen.set(false);
  this.isPageDesignPickerClosing.set(true);
  this.pageDesignPickerCloseTimer = setTimeout(() => {
    this.isPageDesignPickerClosing.set(false);
    this.canScrollPageDesignTabsLeft.set(false);
    this.canScrollPageDesignTabsRight.set(false);
    this.pageDesignPickerCloseTimer = null;
  }, ProjectStorefrontEditor.SECTION_LIBRARY_CLOSE_MS);
}

setPageDesignCategory(category: StorefrontPageDesignCategory): void {
  this.activePageDesignCategory.set(category);
  setTimeout(() => this.updatePageDesignTabScrollState(), 0);
}

scrollPageDesignTabs(direction: 'left' | 'right'): void {
  const tabs = this.getPageDesignTabsElement();
  if (!tabs) {
    return;
  }

  const delta = Math.max(180, Math.round(tabs.clientWidth * 0.45));
  tabs.scrollBy({
    left: direction === 'right' ? delta : -delta,
    behavior: 'smooth',
  });

  setTimeout(() => this.updatePageDesignTabScrollState(), 220);
}

updatePageDesignTabScrollState(): void {
  const tabs = this.getPageDesignTabsElement();
  if (!tabs) {
    this.canScrollPageDesignTabsLeft.set(false);
    this.canScrollPageDesignTabsRight.set(false);
    return;
  }

  const maxScrollLeft = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
  this.canScrollPageDesignTabsLeft.set(tabs.scrollLeft > 4);
  this.canScrollPageDesignTabsRight.set(tabs.scrollLeft < maxScrollLeft - 4);
}

  createBlankPage(): void {
    this.createManagedPage({
      kind: 'blank',
      name: 'New page',
      designId: null,
    });
  }

  createDesignedPage(template: StorefrontPageDesignTemplate): void {
    this.createManagedPage({
      kind: 'designed',
      name: template.name,
      designId: template.id,
    });
  }

  handleGeneratePageWithAi(): void {
    this.isAddPageMenuOpen.set(false);
    this.toastService.info('Generate with AI is coming soon.');
  }

  duplicateManagedPage(pageId: string): void {
    const page = this.managedPages().find((item) => item.id === pageId);
    if (!page) {
      return;
    }

    this.createManagedPage({
      kind: page.kind === 'home' ? 'designed' : page.kind,
      name: page.name,
      designId: page.designId,
      draftDocument: page.draftDocument ?? this.buildDefaultManagedPageDocument(page.name, page.kind, page.designId),
    });
  }

  renameManagedPage(pageId: string): void {
    const page = this.managedPages().find((item) => item.id === pageId);
    if (!page) {
      return;
    }
    this.isEditingPageName.set(true);
    this.editingPageNameId.set(pageId);
    this.editingPageNameValue.set(page.name);
    this.pageCardMenuId.set(null);
    setTimeout(() => {
      const input = document.querySelector(
        `.storefront-editor__page-name-input[data-page-name-input-id="${pageId}"]`
      );
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  setManagedPageAsHome(pageId: string): void {
    const pages = this.captureManagedPagesWithCurrentDraft();
    const target = pages.find((item) => item.id === pageId);
    if (!target || target.kind === 'home') {
      this.pageCardMenuId.set(null);
      return;
    }

    const nextPages = pages.map((page) => {
      if (page.id === pageId) {
        return {
          ...page,
          kind: 'home' as const,
        };
      }

      if (page.kind === 'home') {
        return {
          ...page,
          kind: page.designId ? ('designed' as const) : ('blank' as const),
        };
      }

      return page;
    });

    this.switchManagedPage(pageId, nextPages);
    this.pageCardMenuId.set(null);
  }

  isManagedPageHome(pageId: string): boolean {
    return this.managedPages().some((page) => page.id === pageId && page.kind === 'home');
  }

  deleteManagedPage(pageId: string): void {
    const pages = this.captureManagedPagesWithCurrentDraft();
    const target = pages.find((page) => page.id === pageId);
    if (!target || target.kind === 'home') {
      return;
    }

    const nextPages = pages.filter((page) => page.id !== pageId);
    const nextSelectedId = this.selectedManagedPageId() === pageId ? 'home' : this.selectedManagedPageId();
    this.switchManagedPage(nextSelectedId, nextPages);
    this.pageCardMenuId.set(null);
  }

  openManagedPageSeoSettings(): void {
    this.pageCardMenuId.set(null);
    this.toastService.info('SEO and accessibility settings are coming soon.');
  }

  openManagedPageSettings(): void {
    this.pageCardMenuId.set(null);
    this.toastService.info('Page settings are coming soon.');
  }

  finishEditingPageName(): void {
    const pageId = this.editingPageNameId();
    if (!pageId) {
      this.cancelPageNameEditing();
      return;
    }

    const nextName = this.editingPageNameValue().trim() || 'New page';
    const uniqueName = this.createUniquePageName(nextName, pageId);
    const nextPages = this.managedPages().map((page) =>
      page.id === pageId
        ? {
            ...page,
            name: uniqueName,
          }
        : page
    );

    this.updateEditorSessionPages(nextPages, this.selectedManagedPageId());
    this.cancelPageNameEditing();
  }

  cancelPageNameEditing(): void {
    this.isEditingPageName.set(false);
    this.editingPageNameId.set(null);
    this.editingPageNameValue.set('');
  }

  onPageNameInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.finishEditingPageName();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelPageNameEditing();
    }
  }

  updateStoreName(value: string): void {
    this.applyStorefrontMutation(
      (storefront) => ({ ...storefront, storeName: value }),
      { syncRail: false }
    );
  }

  updateSeoField(field: 'title' | 'description', value: string): void {
    this.applyStorefrontMutation(
      (storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          seo: {
            ...storefront.draftHomepage.seo,
            [field]: value,
          },
        },
      }),
      { syncRail: false }
    );
  }

  toggleSelectedSectionEnabled(enabled: boolean): void {
    this.updateSelectedSection((section) => ({ ...section, enabled }));
  }

  moveSelectedSection(direction: 'up' | 'down'): void {
    const selectedSectionId = this.selectedSectionId();
    if (!selectedSectionId) {
      return;
    }

    if (!this.canMoveSection(selectedSectionId, direction)) {
      return;
    }

    this.applyStorefrontMutation((storefront) => {
      const sections = [...storefront.draftHomepage.sections];
      const currentIndex = sections.findIndex((section) => section.id === selectedSectionId);
      if (currentIndex < 0) {
        return storefront;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sections.length) {
        return storefront;
      }

      const [section] = sections.splice(currentIndex, 1);
      sections.splice(targetIndex, 0, section);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { syncRail: true });
  }

  moveSection(sectionId: string, direction: 'up' | 'down'): void {
    this.selectedSectionId.set(sectionId);
    this.moveSelectedSection(direction);
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  startSectionDrag(event: DragEvent, sectionId: string): void {
    this.draggedSectionId.set(sectionId);
    this.selectedSectionId.set(sectionId);
    event.dataTransfer?.setData('text/plain', sectionId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  allowSectionDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  addSection(
    type: StorefrontSectionType,
    mode: SectionInsertMode = 'after-selected',
    props?: Record<string, unknown>
  ): void {
    let insertedId: string | null = null;
  this.applyStorefrontMutation((storefront) => {
      const section = this.createSection(type, props);
      insertedId = section.id;
      const sections = [...storefront.draftHomepage.sections];
      const insertAt = this.getSectionInsertIndex(sections, this.selectedSectionId(), mode);

      sections.splice(insertAt, 0, section);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: insertedId, syncRail: true });
  }

  createBlankSection(sectionId: string): void {
    this.sectionAddMenuSectionId.set(null);
    this.selectedSectionId.set(sectionId);

    let insertedId: string | null = null;
    this.applyStorefrontMutation((storefront) => {
      const section = this.createSection('hero');
      section.props = {
        ...section.props,
        eyebrow: '',
        title: '',
        description: '',
        primaryCtaLabel: '',
        primaryCtaHref: '',
        secondaryCtaLabel: '',
        secondaryCtaHref: '',
        [ProjectStorefrontEditor.SECTION_LABEL_PROP_KEY]: 'Blank section',
        [ProjectStorefrontEditor.SECTION_HEIGHT_PROP_KEY]: 280,
        [ProjectStorefrontEditor.SECTION_BLANK_PROP_KEY]: true,
      };
      insertedId = section.id;

      const sections = [...storefront.draftHomepage.sections];
      const insertAt = this.getSectionInsertIndex(sections, sectionId, 'after-selected');
      sections.splice(insertAt, 0, section);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: insertedId, syncRail: true });
  }

  addSectionFromLibrary(template: SectionLibraryTemplate): void {
    const targetSectionId = this.sectionLibraryTargetId();
    if (targetSectionId) {
      this.selectedSectionId.set(targetSectionId);
    }

    this.addSection(template.type, 'after-selected', template.props);
    this.closeSectionLibrary();
  }

  dropSection(event: DragEvent, targetSectionId: string): void {
    event.preventDefault();
    const draggedSectionId =
      this.draggedSectionId() || event.dataTransfer?.getData('text/plain') || null;
    this.draggedSectionId.set(null);

    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      return;
    }

    this.applyStorefrontMutation((storefront) => {
      const sections = [...storefront.draftHomepage.sections];
      const draggedIndex = sections.findIndex((section) => section.id === draggedSectionId);
      const targetIndex = sections.findIndex((section) => section.id === targetSectionId);
      if (draggedIndex < 0 || targetIndex < 0) {
        return storefront;
      }

      if (this.isStableSectionType(sections[draggedIndex].type)) {
        return storefront;
      }

      const [draggedSection] = sections.splice(draggedIndex, 1);
      const nextTargetIndex = sections.findIndex((section) => section.id === targetSectionId);
      if (nextTargetIndex < 0) {
        return storefront;
      }

      const targetSection = sections[nextTargetIndex];
      const insertAt =
        targetSection?.type === 'header' ? nextTargetIndex + 1 :
        targetSection?.type === 'footer' ? nextTargetIndex :
        nextTargetIndex;

      sections.splice(insertAt, 0, draggedSection);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: draggedSectionId, syncRail: true });
  }

  duplicateSection(sectionId: string): void {
    if (this.isStableSectionId(sectionId)) {
      return;
    }

    let duplicateId: string | null = null;
    this.applyStorefrontMutation((storefront) => {
      const sections = [...storefront.draftHomepage.sections];
      const index = sections.findIndex((section) => section.id === sectionId);
      if (index < 0) {
        return storefront;
      }

      const duplicate = {
        ...JSON.parse(JSON.stringify(sections[index])),
        id: this.createSectionId(sections[index].type),
      } as StorefrontHomepageSection;
      duplicateId = duplicate.id;

      sections.splice(index + 1, 0, duplicate);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: duplicateId, syncRail: true });
  }

  copySection(sectionId: string): void {
    const section = this.sections().find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    this.sectionClipboard.set(this.cloneSection(section));
  }

  cutSection(sectionId: string): void {
    const section = this.sections().find((item) => item.id === sectionId);
    if (!section || !this.canRemoveSection(sectionId)) {
      return;
    }

    this.sectionClipboard.set(this.cloneSection(section));
    this.removeSection(sectionId);
  }

  canPasteSection(sectionId?: string): boolean {
    const clipboardSection = this.sectionClipboard();
    if (!clipboardSection || this.isStableSectionType(clipboardSection.type)) {
      return false;
    }

    if (!sectionId) {
      return true;
    }

    return this.sections().some((section) => section.id === sectionId);
  }

  pasteSection(sectionId: string): void {
    const clipboardSection = this.sectionClipboard();
    if (!clipboardSection || this.isStableSectionType(clipboardSection.type)) {
      return;
    }

    let pastedId: string | null = null;
    this.applyStorefrontMutation((storefront) => {
      const sections = [...storefront.draftHomepage.sections];
      const targetIndex = sections.findIndex((section) => section.id === sectionId);
      if (targetIndex < 0) {
        return storefront;
      }

      const pastedSection = this.cloneSection(clipboardSection);
      pastedSection.id = this.createSectionId(pastedSection.type);
      pastedId = pastedSection.id;
      sections.splice(this.getSectionInsertIndex(sections, sectionId, 'after-selected'), 0, pastedSection);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: pastedId, syncRail: true });
  }

  removeSection(sectionId: string): void {
    if (!this.canRemoveSection(sectionId)) {
      return;
    }

    const nextSelected: string | null = null;
    this.applyStorefrontMutation((storefront) => {
      const sections = storefront.draftHomepage.sections;
      const index = sections.findIndex((section) => section.id === sectionId);
      if (index < 0) {
        return storefront;
      }

      const nextSections = sections.filter((section) => section.id !== sectionId);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: nextSections,
        },
      };
    }, { selectedSectionId: nextSelected, syncRail: true });
  }

  isStableSectionType(type: StorefrontSectionType): boolean {
    return type === 'header' || type === 'footer';
  }

  isStableSectionId(sectionId: string | null | undefined): boolean {
    if (!sectionId) {
      return false;
    }

    const section = this.sections().find((item) => item.id === sectionId);
    return !!section && this.isStableSectionType(section.type);
  }

  isFooterSection(section: StorefrontHomepageSection | null | undefined): boolean {
    return section?.type === 'footer';
  }

  private getSectionInsertIndex(
    sections: StorefrontHomepageSection[],
    targetSectionId: string | null,
    mode: SectionInsertMode
  ): number {
    const footerIndex = sections.findIndex((section) => section.type === 'footer');
    const appendIndex = footerIndex >= 0 ? footerIndex : sections.length;
    if (mode !== 'after-selected' || !targetSectionId) {
      return appendIndex;
    }

    const targetIndex = sections.findIndex((section) => section.id === targetSectionId);
    if (targetIndex < 0) {
      return appendIndex;
    }

    const targetSection = sections[targetIndex];
    if (targetSection.type === 'footer') {
      return targetIndex;
    }

    return targetIndex + 1;
  }

  toggleSectionEnabled(sectionId: string): void {
    this.applyStorefrontMutation((storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((section) =>
            section.id === sectionId ? { ...section, enabled: !section.enabled } : section
          ),
        },
      }),
      { syncRail: true }
    );
  }

  canMoveSection(sectionId: string, direction: 'up' | 'down'): boolean {
    const sections = this.sections();
    const index = sections.findIndex((section) => section.id === sectionId);
    if (index < 0) {
      return false;
    }

    const currentSection = sections[index];
    if (this.isStableSectionType(currentSection.type)) {
      return false;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) {
      return false;
    }

    return !this.isStableSectionType(sections[targetIndex].type);
  }

  canRemoveSection(sectionId: string | null = this.selectedSectionId()): boolean {
    if (!sectionId) {
      return false;
    }

    const section = this.sections().find((item) => item.id === sectionId);
    if (!section) {
      return false;
    }

    return !this.isStableSectionType(section.type);
  }

  updateSelectedStringProp(key: string, value: string): void {
    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [key]: value,
      },
    }));
  }

  updateSelectedNumberProp(key: string, value: string): void {
    const parsed = Number(value);
    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [key]: Number.isFinite(parsed) ? parsed : 0,
      },
    }));
  }

  toggleFeaturedProduct(productId: number, selected: boolean): void {
    this.updateSelectedSection((section) => {
      const currentProductIds = this.readNumberArrayProp(section, 'productIds');
      const nextProductIds = selected
        ? Array.from(new Set([...currentProductIds, productId]))
        : currentProductIds.filter((id) => id !== productId);

      return {
        ...section,
        props: {
          ...section.props,
          productIds: nextProductIds,
        },
      };
    });
  }

  isFeaturedProductSelected(productId: number): boolean {
    const section = this.selectedSection();
    return section ? this.readNumberArrayProp(section, 'productIds').includes(productId) : false;
  }

  undo(): void {
    const history = this.undoStack();
    const storefront = this.workingStorefront();
    if (!history.length || !storefront) {
      return;
    }

    const previous = history[history.length - 1];
    const current = this.createEditorSnapshot(storefront, this.selectedSectionId());
    this.undoStack.set(history.slice(0, -1));
    this.redoStack.update((stack) => [...stack, current].slice(-ProjectStorefrontEditor.HISTORY_LIMIT));
    this.applyEditorSnapshot(previous);
    this.scheduleAutosave();
  }

  redo(): void {
    const history = this.redoStack();
    const storefront = this.workingStorefront();
    if (!history.length || !storefront) {
      return;
    }

    const next = history[history.length - 1];
    const current = this.createEditorSnapshot(storefront, this.selectedSectionId());
    this.redoStack.set(history.slice(0, -1));
    this.undoStack.update((stack) => [...stack, current].slice(-ProjectStorefrontEditor.HISTORY_LIMIT));
    this.applyEditorSnapshot(next);
    this.scheduleAutosave();
  }

  saveDraft(): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.persistCurrentState({ reconcileEditor: false })
      .pipe(finalize(() => this.isSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Storefront draft saved.');
        },
        error: () => this.toastService.error('Unable to save the storefront draft right now.'),
      });
  }

  publishStorefront(): void {
    const projectId = this.projectId();
    if (!projectId || this.isPublishing()) {
      return;
    }

    this.isPublishing.set(true);
    this.persistCurrentState({ reconcileEditor: false })
      .pipe(
        switchMap(() => this.projectStorefrontService.publishStorefront(projectId)),
        finalize(() => this.isPublishing.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const snapshot = this.normalizeStorefront(response.storefront);
          this.applyPersistedStorefront(snapshot, { resetHistory: true });
          this.toastService.success(`Storefront published on ${this.previewDomain()}.`);
        },
        error: () => this.toastService.error('Unable to publish the storefront right now.'),
      });
  }

  unpublishStorefront(): void {
    const projectId = this.projectId();
    if (!projectId || this.isUnpublishing()) {
      return;
    }

    this.isUnpublishing.set(true);
    this.projectStorefrontService
      .unpublishStorefront(projectId)
      .pipe(finalize(() => this.isUnpublishing.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (storefront) => {
          const snapshot = this.normalizeStorefront(storefront);
          this.applyPersistedStorefront(snapshot, { resetHistory: false });
          this.toastService.success('Storefront unpublished.');
        },
        error: () => this.toastService.error('Unable to unpublish the storefront right now.'),
      });
  }

  sectionLabel(section: StorefrontHomepageSection): string {
    const customLabel = this.readStringProp(section, ProjectStorefrontEditor.SECTION_LABEL_PROP_KEY).trim();
    if (customLabel) {
      return customLabel;
    }

  switch (section.type) {
      case 'header':
        return 'Header';
      case 'announcement-bar':
        return 'Announcement Bar';
      case 'featured-products':
        return 'Featured Products';
      case 'contact':
        return 'Contact';
      case 'footer':
        return 'Footer';
      default:
        return 'Hero';
    }
  }

  sectionDescription(section: StorefrontHomepageSection): string {
  switch (section.type) {
      case 'header':
        return 'Editable site header';
      case 'announcement-bar':
        return this.readStringProp(section, 'text');
      case 'featured-products': {
        const count = this.readNumberArrayProp(section, 'productIds').length;
        return `${count} selected product${count === 1 ? '' : 's'}`;
      }
      case 'footer':
        return 'Editable site footer';
      case 'contact':
        return this.readStringProp(section, 'title') || this.readStringProp(section, 'email');
      default:
        return this.readStringProp(section, 'title');
    }
  }

  readSectionComponents(section: StorefrontHomepageSection | null): StorefrontEditorComponentNode[] {
    const value = (section?.props as Record<string, unknown> | undefined)?.[
      ProjectStorefrontEditor.SECTION_COMPONENTS_PROP_KEY
    ];

    return Array.isArray(value)
      ? (JSON.parse(JSON.stringify(value)) as StorefrontEditorComponentNode[]).map((component) =>
          this.normalizeResponsiveComponent(this.normalizeLegacyTextComponent(component))
        )
      : [];
  }

  private normalizeResponsiveComponent(component: StorefrontEditorComponentNode): StorefrontEditorComponentNode {
    const normalizeFrame = (
      frame: StorefrontEditorComponentNode['frame'] | null | undefined
    ): StorefrontEditorComponentNode['frame'] | null => {
      if (!frame) {
        return null;
      }

      return {
        x: Number.isFinite(frame.x) ? frame.x : 0,
        y: Number.isFinite(frame.y) ? frame.y : 0,
        width: Number.isFinite(frame.width) ? frame.width : 0,
        height: Number.isFinite(frame.height) ? frame.height : 0,
      };
    };

    const baseFrame = normalizeFrame(component.frame) ?? createStorefrontEditorComponentNode(component.type).frame;
    const tabletFrame = normalizeFrame(component.responsiveFrames?.['tablet']);
    const mobileFrame = normalizeFrame(component.responsiveFrames?.['mobile']);

    return {
      ...component,
      frame: baseFrame,
      responsiveFrames: tabletFrame || mobileFrame
        ? {
            ...(tabletFrame ? { tablet: tabletFrame } : {}),
            ...(mobileFrame ? { mobile: mobileFrame } : {}),
          }
        : undefined,
    };
  }

  private getViewportBaseWidth(viewport: StorefrontEditorViewport): number {
    switch (viewport) {
      case 'mobile':
        return 390;
      case 'tablet':
        return 820;
      default:
        return 1200;
    }
  }

  private getComponentFrame(
    component: StorefrontEditorComponentNode,
    viewport: StorefrontEditorViewport = this.viewport()
  ): StorefrontEditorComponentNode['frame'] {
    if (viewport === 'desktop') {
      return component.frame;
    }

    return component.responsiveFrames?.[viewport] ?? component.frame;
  }

  private writeComponentFrame(
    component: StorefrontEditorComponentNode,
    frame: StorefrontEditorComponentNode['frame'],
    viewport: StorefrontEditorViewport = this.viewport()
  ): StorefrontEditorComponentNode {
    if (viewport === 'desktop') {
      return {
        ...component,
        frame,
      };
    }

    return {
      ...component,
      responsiveFrames: {
        ...(component.responsiveFrames ?? {}),
        [viewport]: frame,
      },
    };
  }

  private getSectionHeightPropKey(viewport: StorefrontEditorViewport = this.viewport()): string {
    switch (viewport) {
      case 'mobile':
        return ProjectStorefrontEditor.SECTION_MOBILE_HEIGHT_PROP_KEY;
      case 'tablet':
        return ProjectStorefrontEditor.SECTION_TABLET_HEIGHT_PROP_KEY;
      default:
        return ProjectStorefrontEditor.SECTION_HEIGHT_PROP_KEY;
    }
  }

  private readViewportSectionHeight(section: StorefrontHomepageSection, viewport: StorefrontEditorViewport = this.viewport()): number {
    const viewportHeight = this.readNumberProp(section, this.getSectionHeightPropKey(viewport), 0);
    if (viewportHeight > 0) {
      return viewportHeight;
    }

    return this.readNumberProp(section, ProjectStorefrontEditor.SECTION_HEIGHT_PROP_KEY, 0);
  }

  readStringProp(section: StorefrontHomepageSection | null, key: string): string {
    const value = (section?.props as Record<string, unknown> | undefined)?.[key];
    return typeof value === 'string' ? value : '';
  }

  readBooleanProp(section: StorefrontHomepageSection | null, key: string): boolean {
    const value = (section?.props as Record<string, unknown> | undefined)?.[key];
    return value === true;
  }

  readNumberProp(section: StorefrontHomepageSection | null, key: string, fallback = 0): number {
    const value = (section?.props as Record<string, unknown> | undefined)?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  readNumberArrayProp(section: StorefrontHomepageSection | null, key: string): number[] {
    const value = (section?.props as Record<string, unknown> | undefined)?.[key];
    return Array.isArray(value)
      ? value.filter((item: unknown): item is number => typeof item === 'number')
      : [];
  }

  readSectionLayoutAssignments(section: StorefrontHomepageSection | null): StorefrontEditorSectionLayoutAssignment[] {
    const value = (section?.props as Record<string, unknown> | undefined)?.[
      ProjectStorefrontEditor.SECTION_LAYOUT_ASSIGNMENTS_PROP_KEY
    ];

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const record = item as Record<string, unknown>;
        const componentId = typeof record['componentId'] === 'string' ? record['componentId'] : '';
        const column = typeof record['column'] === 'number' ? Math.max(1, Math.round(record['column'])) : 1;
        const row = typeof record['row'] === 'number' ? Math.max(1, Math.round(record['row'])) : 1;
        if (!componentId) {
          return null;
        }

        return { componentId, column, row };
      })
      .filter((assignment): assignment is StorefrontEditorSectionLayoutAssignment => assignment !== null);
  }

  componentPreviewStyle(component: StorefrontEditorComponentNode): Record<string, string> {
    const frame = this.getComponentFrame(component);
    return {
      left: `${frame.x}px`,
      top: `${frame.y}px`,
      width: `${frame.width}px`,
      height: `${frame.height}px`,
    };
  }

  trackSection = (_: number, section: StorefrontHomepageSection): string => section.id;
  trackProduct = (_: number, product: ProjectCatalogProduct): number => product.id;

  sectionPreviewHeight(section: StorefrontHomepageSection): number | null {
    const height = this.readViewportSectionHeight(section);
    return height > 0 ? height : null;
  }

  isBlankSection(section: StorefrontHomepageSection | null): boolean {
    return this.readBooleanProp(section, ProjectStorefrontEditor.SECTION_BLANK_PROP_KEY);
  }

  sectionLayoutPresetId(section: StorefrontHomepageSection | null): StorefrontEditorSectionLayoutPresetId {
    const value = this.readStringProp(section, ProjectStorefrontEditor.SECTION_LAYOUT_PROP_KEY) as StorefrontEditorSectionLayoutPresetId;
    return this.sectionLayoutPresets.some((preset) => preset.id === value) ? value : 'none';
  }

  sectionLayoutColumns(section: StorefrontHomepageSection | null): number {
    const preset = this.getSectionLayoutPresetById(this.sectionLayoutPresetId(section));
    if (preset.id === 'none') {
      return 0;
    }

    return Math.max(1, this.readNumberProp(section, ProjectStorefrontEditor.SECTION_LAYOUT_COLUMNS_PROP_KEY, preset.columns));
  }

  sectionLayoutRows(section: StorefrontHomepageSection | null): number {
    const preset = this.getSectionLayoutPresetById(this.sectionLayoutPresetId(section));
    if (preset.id === 'none') {
      return 0;
    }

    return Math.max(1, this.readNumberProp(section, ProjectStorefrontEditor.SECTION_LAYOUT_ROWS_PROP_KEY, preset.rows));
  }

  sectionShowsLayoutControls(section: StorefrontHomepageSection | null): boolean {
    return this.sectionLayoutPresetId(section) !== 'none';
  }

  sectionLayoutColumnTrackSizes(section: StorefrontHomepageSection | null): number[] {
    const columns = this.sectionLayoutColumns(section);
    const presetId = this.sectionLayoutPresetId(section);
    return this.normalizeSectionLayoutTrackSizes(
      this.readNumberArrayProp(section, ProjectStorefrontEditor.SECTION_LAYOUT_COLUMN_SIZES_PROP_KEY),
      columns,
      this.getDefaultSectionLayoutTrackSizes(presetId, 'column', columns)
    );
  }

  sectionLayoutRowTrackSizes(section: StorefrontHomepageSection | null): number[] {
    const rows = this.sectionLayoutRows(section);
    const presetId = this.sectionLayoutPresetId(section);
    return this.normalizeSectionLayoutTrackSizes(
      this.readNumberArrayProp(section, ProjectStorefrontEditor.SECTION_LAYOUT_ROW_SIZES_PROP_KEY),
      rows,
      this.getDefaultSectionLayoutTrackSizes(presetId, 'row', rows)
    );
  }

  sectionLayoutVerticalGuides(section: StorefrontHomepageSection | null): number[] {
    const columns = this.sectionLayoutColumns(section);
    if (columns <= 1) {
      return [];
    }

    return Array.from({ length: columns - 1 }, (_, index) => ((index + 1) / columns) * 100);
  }

  sectionLayoutHorizontalGuides(section: StorefrontHomepageSection | null): number[] {
    const rows = this.sectionLayoutRows(section);
    if (rows <= 1) {
      return [];
    }

    return Array.from({ length: rows - 1 }, (_, index) => ((index + 1) / rows) * 100);
  }

  sectionShowsLayoutGuides(section: StorefrontHomepageSection | null): boolean {
    return this.sectionShowsLayoutControls(section) && (this.sectionLayoutColumns(section) > 1 || this.sectionLayoutRows(section) > 1);
  }

  sectionShowsLayoutOverlay(section: StorefrontHomepageSection | null): boolean {
    if (!this.sectionShowsLayoutGuides(section)) {
      return false;
    }

    const sectionId = section?.id ?? null;
    if (!sectionId) {
      return false;
    }

    return this.isSectionActivelySelected(sectionId) || this.sectionShowsLayoutWhileDragging(sectionId);
  }

  sectionShowsLayoutWhileDragging(sectionId: string | null): boolean {
    if (!sectionId) {
      return false;
    }

    if (this.isLibraryComponentDragging() && this.componentAttachSectionId() === sectionId) {
      return true;
    }

    return this.activeComponentDrag?.sectionId === sectionId;
  }

  sectionShowsLayoutResizers(section: StorefrontHomepageSection | null): boolean {
    const sectionId = section?.id ?? null;
    return !!sectionId && this.isSectionActivelySelected(sectionId) && this.sectionShowsLayoutGuides(section);
  }

  sectionLayoutOverlayStyle(section: StorefrontHomepageSection | null): Record<string, string> {
    const columnTrackSizes = this.sectionLayoutColumnTrackSizes(section);
    const rowTrackSizes = this.sectionLayoutRowTrackSizes(section);

    return {
      gridTemplateColumns: columnTrackSizes.length
        ? columnTrackSizes.map((size) => `${size}%`).join(' ')
        : 'minmax(0, 1fr)',
      gridTemplateRows: rowTrackSizes.length
        ? rowTrackSizes.map((size) => `${size}%`).join(' ')
        : 'minmax(0, 1fr)',
    };
  }

  sectionLayoutOverlayCells(
    section: StorefrontHomepageSection | null
  ): Array<{ column: number; row: number; columnSpan?: number; rowSpan?: number }> {
    const presetId = this.sectionLayoutPresetId(section);
    const columns = Math.max(1, this.sectionLayoutColumns(section));
    const rows = Math.max(1, this.sectionLayoutRows(section));

    if (presetId === 'none') {
      return [];
    }

    if (presetId === 'sidebar-left' && columns >= 2) {
      return [
        { column: 1, row: 1, rowSpan: rows },
        ...Array.from({ length: rows * (columns - 1) }, (_, index) => ({
          column: Math.floor(index / rows) + 2,
          row: (index % rows) + 1,
        })),
      ];
    }

    if (presetId === 'sidebar-right' && columns >= 2) {
      return [
        ...Array.from({ length: rows * (columns - 1) }, (_, index) => ({
          column: Math.floor(index / rows) + 1,
          row: (index % rows) + 1,
        })),
        { column: columns, row: 1, rowSpan: rows },
      ];
    }

    return Array.from({ length: rows * columns }, (_, index) => ({
      column: (index % columns) + 1,
      row: Math.floor(index / columns) + 1,
    }));
  }

  sectionLayoutVerticalSeparatorStyles(section: StorefrontHomepageSection | null): Array<Record<string, string>> {
    const sizes = this.sectionLayoutColumnTrackSizes(section);
    if (sizes.length <= 1) {
      return [];
    }

    const chrome = (ProjectStorefrontEditor.SECTION_LAYOUT_PADDING_PX * 2) +
      (ProjectStorefrontEditor.SECTION_LAYOUT_GAP_PX * (sizes.length - 1));
    let cumulative = 0;

    return sizes.slice(0, -1).map((size, index) => {
      cumulative += size / 100;
      const left = `calc(${ProjectStorefrontEditor.SECTION_LAYOUT_PADDING_PX + (ProjectStorefrontEditor.SECTION_LAYOUT_GAP_PX * index) + (ProjectStorefrontEditor.SECTION_LAYOUT_GAP_PX / 2)}px + (100% - ${chrome}px) * ${cumulative})`;
      return { left };
    });
  }

  sectionLayoutHorizontalSeparatorStyles(section: StorefrontHomepageSection | null): Array<Record<string, string>> {
    const sizes = this.sectionLayoutRowTrackSizes(section);
    if (sizes.length <= 1) {
      return [];
    }

    const chrome = (ProjectStorefrontEditor.SECTION_LAYOUT_PADDING_PX * 2) +
      (ProjectStorefrontEditor.SECTION_LAYOUT_GAP_PX * (sizes.length - 1));
    let cumulative = 0;

    return sizes.slice(0, -1).map((size, index) => {
      cumulative += size / 100;
      const top = `calc(${ProjectStorefrontEditor.SECTION_LAYOUT_PADDING_PX + (ProjectStorefrontEditor.SECTION_LAYOUT_GAP_PX * index) + (ProjectStorefrontEditor.SECTION_LAYOUT_GAP_PX / 2)}px + (100% - ${chrome}px) * ${cumulative})`;
      return { top };
    });
  }

  sectionBackgroundColor(section: StorefrontHomepageSection | null): string | null {
    const value = this.readStringProp(section, ProjectStorefrontEditor.SECTION_BACKGROUND_PROP_KEY);
    return this.normalizeHexColor(value);
  }

  sectionHasCustomBackground(section: StorefrontHomepageSection | null): boolean {
    return this.sectionBackgroundColor(section) !== null;
  }

  sectionBorderStyle(section: StorefrontHomepageSection | null): 'solid' | 'dashed' | 'dotted' | 'double' {
    const value = this.readStringProp(section, ProjectStorefrontEditor.SECTION_BORDER_STYLE_PROP_KEY);
    return value === 'dashed' || value === 'dotted' || value === 'double' ? value : 'solid';
  }

  sectionBorderWidth(section: StorefrontHomepageSection | null): number {
    return Math.max(0, this.readNumberProp(section, ProjectStorefrontEditor.SECTION_BORDER_WIDTH_PROP_KEY, 0));
  }

  sectionBorderColor(section: StorefrontHomepageSection | null): string {
    return this.normalizeHexColor(this.readStringProp(section, ProjectStorefrontEditor.SECTION_BORDER_COLOR_PROP_KEY)) ?? '#111827';
  }

  sectionRadius(section: StorefrontHomepageSection | null): number {
    return Math.max(0, this.readNumberProp(section, ProjectStorefrontEditor.SECTION_RADIUS_PROP_KEY, 0));
  }

  sectionShadow(section: StorefrontHomepageSection | null): StorefrontEditorButtonNode['props']['shadow'] {
    const value = this.readStringProp(section, ProjectStorefrontEditor.SECTION_SHADOW_PROP_KEY);
    return value === 'soft' || value === 'medium' || value === 'strong' ? value : 'none';
  }

  sectionOpacity(section: StorefrontHomepageSection | null): number {
    return Math.max(0, Math.min(100, this.readNumberProp(section, ProjectStorefrontEditor.SECTION_OPACITY_PROP_KEY, 100)));
  }

sectionSurfaceStyle(section: StorefrontHomepageSection | null): Record<string, string | null> {
  const borderStyle = this.sectionBorderStyle(section);
  const borderWidth = this.sectionBorderWidth(section);

  return {
      background: this.sectionBackgroundColor(section),
      borderColor: borderWidth === 0 ? 'transparent' : this.sectionBorderColor(section),
      borderStyle,
      borderWidth: `${borderWidth}px`,
      borderRadius: `${this.sectionRadius(section)}px`,
    opacity: `${this.sectionOpacity(section) / 100}`,
  };
}

containerBackgroundColor(component: StorefrontEditorContainerNode | null): string | null {
  return this.normalizeHexColor(component?.props.backgroundColor ?? '');
}

containerBorderStyle(component: StorefrontEditorContainerNode | null): 'solid' | 'dashed' | 'dotted' | 'double' {
  const value = component?.props.borderStyle;
  return value === 'dashed' || value === 'dotted' || value === 'double' ? value : 'solid';
}

containerBorderWidth(component: StorefrontEditorContainerNode | null): number {
  return Math.max(0, Math.min(12, Math.round(Number(component?.props.borderWidth ?? 0))));
}

containerBorderColor(component: StorefrontEditorContainerNode | null): string {
  return this.normalizeHexColor(component?.props.borderColor ?? '') ?? '#111827';
}

containerRadius(component: StorefrontEditorContainerNode | null): number {
  return Math.max(0, Math.min(999, Math.round(Number(component?.props.radius ?? 0))));
}

containerOpacity(component: StorefrontEditorContainerNode | null): number {
  return Math.max(0, Math.min(100, Math.round(Number(component?.props.opacity ?? 100))));
}

containerShadow(component: StorefrontEditorContainerNode | null): StorefrontEditorButtonNode['props']['shadow'] {
  const value = component?.props.shadow;
  return value === 'soft' || value === 'medium' || value === 'bottom' || value === 'strong' ? value : 'none';
}

imageDisplayMode(component: StorefrontEditorImageNode | null): 'fill' | 'fit' | 'aspect' {
  return component ? resolveStorefrontEditorImageDisplayMode(component.props) : 'fill';
}

imageBorderStyle(component: StorefrontEditorImageNode | null): 'solid' | 'dashed' | 'dotted' | 'double' {
  const value = component?.props.borderStyle;
  return value === 'dashed' || value === 'dotted' || value === 'double' ? value : 'solid';
}

imageBorderWidth(component: StorefrontEditorImageNode | null): number {
  return Math.max(0, Math.min(12, Math.round(Number(component?.props.borderWidth ?? 0))));
}

imageBorderColor(component: StorefrontEditorImageNode | null): string {
  return this.normalizeHexColor(component?.props.borderColor ?? '') ?? '#111827';
}

imageRadius(component: StorefrontEditorImageNode | null): number {
  return Math.max(0, Math.min(999, Math.round(Number(component?.props.radius ?? 0))));
}

imageOpacity(component: StorefrontEditorImageNode | null): number {
  return Math.max(0, Math.min(100, Math.round(Number(component?.props.opacity ?? 100))));
}

imageShadow(component: StorefrontEditorImageNode | null): StorefrontEditorButtonNode['props']['shadow'] {
  const value = component?.props.shadow;
  return value === 'soft' || value === 'medium' || value === 'bottom' || value === 'strong' ? value : 'none';
}

componentTypeLabel(component: StorefrontEditorComponentNode): string {
switch (component.type) {
    case 'text':
      return 'Text';
    case 'heading':
      return 'Heading';
      case 'paragraph':
        return 'Text';
      case 'image':
        return 'Image';
      case 'button':
        return 'Button';
      case 'icon':
        return 'Icon';
      case 'spacer':
        return 'Spacer';
      case 'social-links':
        return 'Social links';
      case 'faq':
        return 'FAQ';
      case 'contact-form':
        return 'Contact form';
      case 'container':
        return 'Container';
      case 'graphic':
        return 'Graphic';
      case 'product-feed':
        return 'Product Feed';
      case 'blog-feed':
        return 'Blog Feed';
      default:
        return 'Component';
    }
  }

  componentDisplayName(component: StorefrontEditorComponentNode): string {
    return component.name || 'Untitled';
  }

  roundedComponentWidth(component: StorefrontEditorComponentNode): number {
    return Math.max(0, Math.round(this.getComponentFrame(component).width));
  }

  roundedComponentHeight(component: StorefrontEditorComponentNode): number {
    return Math.max(0, Math.round(this.getComponentFrame(component).height));
  }

  isComponentBeingRotated(componentId: string): boolean {
    return this.isRotatingComponent() && this.activeRotation?.componentId === componentId;
  }

  displayComponentRotationAngle(rotation: number): number {
    return Math.round(((rotation % 360) + 360) % 360);
  }

  isComponentRotationFlipped(rotation: number): boolean {
    const normalized = ((rotation % 360) + 360) % 360;
    return normalized > 110 && normalized < 290;
  }

  getRotationHandleCursor(rotation: number, corner: RotationHandleCorner): string {
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const cacheKey = `${corner}:${normalizedRotation}`;
    const cached = this.rotationHandleCursorCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const size = ProjectStorefrontEditor.ROTATION_CURSOR_SIZE;
    const hotspot = ProjectStorefrontEditor.ROTATION_CURSOR_HOTSPOT;
    const imageHref = ProjectStorefrontEditor.ROTATION_HANDLE_CURSOR_IMAGES[corner];
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <image
          href="${imageHref}"
          x="0"
          y="0"
          width="${size}"
          height="${size}"
          transform="rotate(${normalizedRotation} ${size / 2} ${size / 2})"
        />
      </svg>
    `.replace(/\s+/g, ' ').trim();
    const cursor = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${hotspot} ${hotspot}, grab`;
    this.rotationHandleCursorCache.set(cacheKey, cursor);
    return cursor;
  }

  sectionTypeIcon(type: StorefrontSectionType): 'layout-grid' | 'package' | 'settings' {
  switch (type) {
    case 'header':
      return 'layout-grid';
    case 'featured-products':
      return 'package';
    case 'contact':
      return 'layout-grid';
    case 'footer':
      return 'settings';
      default:
        return 'layout-grid';
    }
  }

  sectionLibraryDescription(type: StorefrontSectionType): string {
    switch (type) {
      case 'header':
        return 'Keep a persistent top area for navigation, branding, and utility content.';
      case 'announcement-bar':
        return 'Highlight a quick message, notice, or promo banner.';
      case 'hero':
        return 'Lead with a headline, supporting copy, and primary actions.';
    case 'featured-products':
      return 'Feature selected catalog products in a curated section.';
    case 'contact':
      return 'Show customers how to reach you with email, phone, and location details.';
    case 'footer':
      return 'Keep a persistent bottom area for links, notes, and closing content.';
    }
  }

  sectionLibraryTypeLabel(type: StorefrontSectionType): string {
    switch (type) {
      case 'header':
        return 'Header';
      case 'announcement-bar':
        return 'Announcement';
    case 'featured-products':
      return 'Products';
    case 'contact':
      return 'Contact';
    case 'footer':
      return 'Footer';
      default:
        return 'Welcome';
    }
  }

private updateSelectedSection(
  updater: (section: StorefrontHomepageSection) => StorefrontHomepageSection
): void {
    const selectedSectionId = this.selectedSectionId();
    if (!selectedSectionId) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((section) =>
            section.id === selectedSectionId ? updater(section) : section
          ),
        },
      }),
      { syncRail: true }
    );
  }

  private cloneStorefront(storefront: ProjectStorefront): ProjectStorefront {
    return JSON.parse(JSON.stringify(storefront)) as ProjectStorefront;
  }

  private cloneSection(section: StorefrontHomepageSection): StorefrontHomepageSection {
    return JSON.parse(JSON.stringify(section)) as StorefrontHomepageSection;
  }

  private writeSectionComponents(
    section: StorefrontHomepageSection,
    components: StorefrontEditorComponentNode[]
  ): StorefrontHomepageSection {
    const componentIds = new Set(components.map((component) => component.id));
    const nextAssignments = this.readSectionLayoutAssignments(section).filter((assignment) =>
      componentIds.has(assignment.componentId)
    );

    return {
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_COMPONENTS_PROP_KEY]: components,
        [ProjectStorefrontEditor.SECTION_LAYOUT_ASSIGNMENTS_PROP_KEY]: nextAssignments,
      },
    };
  }

  private updateSectionComponentFrame(
    sectionId: string,
    componentId: string,
    nextX: number,
    nextY: number,
    containerWidth: number,
    containerHeight: number,
    maxVisibleHeight = containerHeight
  ): void {
    this.updateSectionComponentFrames(
      sectionId,
      [{ componentId, x: nextX, y: nextY }],
      containerWidth,
      containerHeight,
      maxVisibleHeight
    );
  }

  private updateSectionComponentFrames(
    sectionId: string,
    positions: Array<{ componentId: string; x: number; y: number }>,
    containerWidth: number,
    containerHeight: number,
    maxVisibleHeight = containerHeight,
    options: { transient?: boolean; syncRail?: boolean } = {}
  ): void {
    const positionsById = new Map(positions.map((position) => [position.componentId, position]));
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          const components = this.readSectionComponents(section).map((component) => {
            const nextPosition = positionsById.get(component.id);
            if (!nextPosition) {
              return component;
            }

            const frame = this.getComponentFrame(component);
            const minX = -frame.width + 20;
            const minY = -frame.height + 20;
            const maxX = containerWidth - 20;
            const maxY = maxVisibleHeight - 20;
            return this.writeComponentFrame(component, {
              ...frame,
              x: Math.max(minX, Math.min(nextPosition.x, maxX)),
              y: Math.max(minY, Math.min(nextPosition.y, maxY)),
            });
          });

          return this.writeSectionComponents(section, components);
        }),
      },
    }), { syncRail: false, ...options });
  }

  private updateComponentSelectionBox(event: MouseEvent): void {
    if (!this.activeSelectionDrag) {
      return;
    }

    const previewCanvas = document.querySelector('.storefront-editor__preview-canvas');
    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${this.activeSelectionDrag.sectionId}"]`
    );
    if (!(previewCanvas instanceof HTMLElement) || !(container instanceof HTMLElement)) {
      return;
    }

    const previewRect = previewCanvas.getBoundingClientRect();
    const sectionRect = container.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(event.clientX - previewRect.left, previewRect.width));
    const currentY = Math.max(0, Math.min(event.clientY - previewRect.top, previewRect.height));
    const width = currentX - this.activeSelectionDrag.startX;
    const height = currentY - this.activeSelectionDrag.startY;
    const nextBox = {
      x: width < 0 ? currentX : this.activeSelectionDrag.startX,
      y: height < 0 ? currentY : this.activeSelectionDrag.startY,
      width: Math.abs(width),
      height: Math.abs(height),
    };
    const sectionOffsetX = sectionRect.left - previewRect.left;
    const sectionOffsetY = sectionRect.top - previewRect.top;

    this.selectionBox.set(nextBox);
    const section = this.sections().find((item) => item.id === this.activeSelectionDrag?.sectionId) ?? null;
    const selectedIds = section
      ? this.readSectionComponents(section)
          .filter((component) => this.isComponentInsideSelectionBox(component, nextBox, sectionOffsetX, sectionOffsetY))
          .map((component) => component.id)
      : [];

    this.selectedComponentIds.set(selectedIds);
    this.selectedComponentId.set(selectedIds[selectedIds.length - 1] ?? null);
  }

  private finishComponentSelectionBox(): void {
      if (!this.activeSelectionDrag) {
        return;
      }

      const finishedBox = this.selectionBox();
      const wasDragging = finishedBox.width > 5 || finishedBox.height > 5;
      const hasSelection = this.selectedComponentIds().length > 0;
      this.activeSelectionDrag = null;
      this.isSelectingComponents.set(false);
      this.selectionBoxSectionId.set(null);
      this.selectionBox.set({ x: 0, y: 0, width: 0, height: 0 });
      this.justFinishedComponentSelectionBox = wasDragging && hasSelection;
    }

  private isComponentInsideSelectionBox(
    component: StorefrontEditorComponentNode,
    box: ComponentSelectionBox,
    offsetX = 0,
    offsetY = 0
  ): boolean {
    const frame = this.getComponentFrame(component);
    const componentLeft = offsetX + frame.x;
    const componentTop = offsetY + frame.y;
    const componentRight = componentLeft + frame.width;
    const componentBottom = componentTop + frame.height;
    const boxRight = box.x + box.width;
    const boxBottom = box.y + box.height;

    return !(
      componentRight < box.x ||
      componentLeft > boxRight ||
      componentBottom < box.y ||
      componentTop > boxBottom
    );
  }

  private getDraggedComponentsBounds(
    components: Array<{ startX: number; startY: number; width: number; height: number }>
  ): { x: number; y: number; width: number; height: number } {
    const left = Math.min(...components.map((component) => component.startX));
    const top = Math.min(...components.map((component) => component.startY));
    const right = Math.max(...components.map((component) => component.startX + component.width));
    const bottom = Math.max(...components.map((component) => component.startY + component.height));

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };
  }

  private getComponentBounds(
    components: StorefrontEditorComponentNode[]
  ): { x: number; y: number; width: number; height: number } {
    const frames = components.map((component) => this.getComponentFrame(component));
    const left = Math.min(...frames.map((frame) => frame.x));
    const top = Math.min(...frames.map((frame) => frame.y));
    const right = Math.max(...frames.map((frame) => frame.x + frame.width));
    const bottom = Math.max(...frames.map((frame) => frame.y + frame.height));

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };
  }

  private clearSnapGuides(): void {
    this.activeSnapGuideSectionId.set(null);
    this.activeSnapGuides.set([]);
  }

  private setSnapGuides(sectionId: string, guides: EditorSnapGuide[]): void {
    const uniqueGuides = guides.filter((guide, index, collection) =>
      collection.findIndex((candidate) => candidate.orientation === guide.orientation && Math.abs(candidate.offset - guide.offset) < 0.5) === index
    );

    this.activeSnapGuideSectionId.set(uniqueGuides.length ? sectionId : null);
    this.activeSnapGuides.set(uniqueGuides);
  }

  snapGuidesForSection(sectionId: string): EditorSnapGuide[] {
    return this.activeSnapGuideSectionId() === sectionId ? this.activeSnapGuides() : [];
  }

  trackSnapGuide = (_: number, guide: EditorSnapGuide): string =>
    `${guide.orientation}-${guide.kind}-${Math.round(guide.offset)}`;

private getSelectedRootComponentsForBatchAction(
  section: StorefrontHomepageSection
): StorefrontEditorComponentNode[] {
  const components = this.readSectionComponents(section);
  const selectedIds = new Set(this.selectedComponentIds());
  if (!selectedIds.size) {
    return [];
  }

    const selectedGroupId = this.selectedComponentGroupId();
    if (selectedGroupId && selectedIds.has(this.selectedComponentId() ?? '')) {
      return components.filter((component) => component.groupId === selectedGroupId);
    }

  return components.filter((component) => selectedIds.has(component.id));
}

private getSelectedComponentsForBatchAction(
  section: StorefrontHomepageSection
): StorefrontEditorComponentNode[] {
  const rootComponents = this.getSelectedRootComponentsForBatchAction(section);
  if (!rootComponents.length) {
    return [];
  }

  const expanded = new Map<string, StorefrontEditorComponentNode>();
  for (const component of rootComponents) {
    expanded.set(component.id, component);
    if (component.type === 'container') {
      for (const descendant of this.getContainerAssociatedComponentsDeep(section, component.id)) {
        expanded.set(descendant.id, descendant);
      }
    }
  }

  return this.sortComponentsForContainerBundle([...expanded.values()]);
}

private getContainerAssociatedComponentsDeep(
  section: StorefrontHomepageSection,
  containerId: string,
  visited = new Set<string>()
): StorefrontEditorComponentNode[] {
  if (visited.has(containerId)) {
    return [];
  }

  visited.add(containerId);
  const components = this.readSectionComponents(section);
  const directChildren = components.filter(
    (component) => component.id !== containerId && component.parentContainerId === containerId
  );
  const descendants = [...directChildren];

  for (const child of directChildren) {
    if (child.type === 'container') {
      descendants.push(...this.getContainerAssociatedComponentsDeep(section, child.id, visited));
    }
  }

  return descendants;
}

private sortComponentsForContainerBundle(
  components: StorefrontEditorComponentNode[]
): StorefrontEditorComponentNode[] {
  if (components.length <= 1) {
    return components;
  }

  const componentsById = new Map(components.map((component) => [component.id, component]));
  const childrenByParent = new Map<string, StorefrontEditorComponentNode[]>();

  for (const component of components) {
    const parentId = component.parentContainerId;
    if (!parentId || !componentsById.has(parentId)) {
      continue;
    }

    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(component);
    childrenByParent.set(parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((left, right) => (left.zIndex ?? 0) - (right.zIndex ?? 0));
  }

  const orderedByDepth = [...components].sort((left, right) => {
    const zIndexDelta = (left.zIndex ?? 0) - (right.zIndex ?? 0);
    if (zIndexDelta !== 0) {
      return zIndexDelta;
    }

    return left.id.localeCompare(right.id);
  });

  const result: StorefrontEditorComponentNode[] = [];
  const visited = new Set<string>();
  const appendComponent = (component: StorefrontEditorComponentNode): void => {
    if (visited.has(component.id)) {
      return;
    }

    visited.add(component.id);
    result.push(component);

    const children = childrenByParent.get(component.id) ?? [];
    for (const child of children) {
      appendComponent(child);
    }
  };

  for (const component of orderedByDepth) {
    if (component.parentContainerId && componentsById.has(component.parentContainerId)) {
      continue;
    }

    appendComponent(component);
  }

  for (const component of orderedByDepth) {
    appendComponent(component);
  }

  return result;
}

private expandPositionUpdatesForAttachedDescendants(
  section: StorefrontHomepageSection,
  rootPositions: Array<{ componentId: string; x: number; y: number }>
): Array<{ componentId: string; x: number; y: number }> {
  if (!rootPositions.length) {
    return [];
  }

  const components = this.readSectionComponents(section);
  const componentsById = new Map(components.map((component) => [component.id, component]));
  const childIdsByParent = new Map<string, string[]>();
  for (const component of components) {
    if (!component.parentContainerId) {
      continue;
    }

    const siblings = childIdsByParent.get(component.parentContainerId) ?? [];
    siblings.push(component.id);
    childIdsByParent.set(component.parentContainerId, siblings);
  }

  const expandedPositions = new Map<string, { componentId: string; x: number; y: number }>();
  const applyDelta = (componentId: string, deltaX: number, deltaY: number): void => {
    const component = componentsById.get(componentId);
    if (!component) {
      return;
    }

    const frame = this.getComponentFrame(component);
    expandedPositions.set(componentId, {
      componentId,
      x: frame.x + deltaX,
      y: frame.y + deltaY,
    });

    const childIds = childIdsByParent.get(componentId) ?? [];
    for (const childId of childIds) {
      applyDelta(childId, deltaX, deltaY);
    }
  };

  for (const rootPosition of rootPositions) {
    const component = componentsById.get(rootPosition.componentId);
    if (!component) {
      continue;
    }

    const frame = this.getComponentFrame(component);
    applyDelta(rootPosition.componentId, rootPosition.x - frame.x, rootPosition.y - frame.y);
  }

  return [...expandedPositions.values()];
}

  private getSnapStep(): number {
    return this.snapSpacingToken();
  }

  private roundToSnapStep(value: number): number {
    const step = this.getSnapStep();
    return Math.round(value / step) * step;
  }

  private getAlignmentTargets(
    sectionId: string,
    excludedComponentIds: readonly string[],
    containerWidth: number,
    containerHeight: number
  ): { vertical: number[]; horizontal: number[] } {
    const excludedIds = new Set(excludedComponentIds);
    const section = this.sections().find((item) => item.id === sectionId) ?? null;
    const vertical = [0, containerWidth / 2, containerWidth];
    const horizontal = [0, containerHeight / 2, containerHeight];

    if (!section) {
      return { vertical, horizontal };
    }

    this.readSectionComponents(section)
      .filter((component) => !excludedIds.has(component.id))
      .forEach((component) => {
        const frame = this.getComponentFrame(component);
        vertical.push(frame.x, frame.x + (frame.width / 2), frame.x + frame.width);
        horizontal.push(frame.y, frame.y + (frame.height / 2), frame.y + frame.height);
      });

    return { vertical, horizontal };
  }

  private findBestSnapOffset(
    candidates: Array<{ position: number; orientation: EditorSnapGuide['orientation'] }>,
    targets: readonly number[]
  ): { delta: number; guide: EditorSnapGuide } | null {
    let bestMatch: { delta: number; guide: EditorSnapGuide } | null = null;

    candidates.forEach((candidate) => {
      targets.forEach((target) => {
        const delta = target - candidate.position;
        if (Math.abs(delta) > ProjectStorefrontEditor.SNAP_ALIGNMENT_THRESHOLD) {
          return;
        }

        if (!bestMatch || Math.abs(delta) < Math.abs(bestMatch.delta)) {
          bestMatch = {
            delta,
            guide: {
              orientation: candidate.orientation,
              offset: target,
              kind: 'alignment',
            },
          };
        }
      });
    });

    return bestMatch;
  }

  private snapDraggedBoundsToConstraints(
    sectionId: string,
    movingComponentIds: readonly string[],
    bounds: { x: number; y: number; width: number; height: number },
    containerWidth: number,
    containerHeight: number
  ): { x: number; y: number; guides: EditorSnapGuide[] } {
    let nextX = bounds.x;
    let nextY = bounds.y;
    const guides: EditorSnapGuide[] = [];

    if (this.snapToGridEnabled()) {
      nextX = this.roundToSnapStep(nextX);
      nextY = this.roundToSnapStep(nextY);
      guides.push(
        { orientation: 'vertical', offset: nextX, kind: 'grid' },
        { orientation: 'horizontal', offset: nextY, kind: 'grid' }
      );
    }

    const targets = this.getAlignmentTargets(sectionId, movingComponentIds, containerWidth, containerHeight);
    const verticalSnap = this.findBestSnapOffset(
      [
        { position: nextX, orientation: 'vertical' },
        { position: nextX + (bounds.width / 2), orientation: 'vertical' },
        { position: nextX + bounds.width, orientation: 'vertical' },
      ],
      targets.vertical
    );
    if (verticalSnap) {
      nextX += verticalSnap.delta;
      guides.push(verticalSnap.guide);
    }

    const horizontalSnap = this.findBestSnapOffset(
      [
        { position: nextY, orientation: 'horizontal' },
        { position: nextY + (bounds.height / 2), orientation: 'horizontal' },
        { position: nextY + bounds.height, orientation: 'horizontal' },
      ],
      targets.horizontal
    );
    if (horizontalSnap) {
      nextY += horizontalSnap.delta;
      guides.push(horizontalSnap.guide);
    }

    return { x: nextX, y: nextY, guides };
  }

  private snapResizeFrameToGrid(
    frame: StorefrontEditorComponentNode['frame'],
    handle: string
  ): StorefrontEditorComponentNode['frame'] {
    if (!this.snapToGridEnabled()) {
      return frame;
    }

    const snappedWidth = Math.max(50, this.roundToSnapStep(frame.width));
    const snappedHeight = Math.max(50, this.roundToSnapStep(frame.height));
    let nextX = frame.x;
    let nextY = frame.y;

    if (handle.includes('w') && !handle.includes('e')) {
      nextX = frame.x + (frame.width - snappedWidth);
    } else {
      nextX = this.roundToSnapStep(frame.x);
    }

    if (handle.includes('n') && !handle.includes('s')) {
      nextY = frame.y + (frame.height - snappedHeight);
    } else {
      nextY = this.roundToSnapStep(frame.y);
    }

    return {
      x: nextX,
      y: nextY,
      width: snappedWidth,
      height: snappedHeight,
    };
  }

  private cloneComponentsForBatchInsert(
    sourceComponents: StorefrontEditorComponentNode[],
    startingZIndex: number,
    offset: number
  ): { clones: StorefrontEditorComponentNode[]; nextIds: string[]; componentIdMap: Map<string, string> } {
    const groupIdMap = new Map<string, string>();
    const componentIdMap = new Map<string, string>();
    const nextIds: string[] = [];
    let nextZIndex = startingZIndex;
    const batchSeed = Date.now();

    const clones = sourceComponents.map((component) => {
      const clone = JSON.parse(JSON.stringify(component)) as StorefrontEditorComponentNode;
      clone.id = createStorefrontEditorComponentNode(component.type).id;
      componentIdMap.set(component.id, clone.id);
      const frame = this.getComponentFrame(clone);
      Object.assign(clone, this.writeComponentFrame(clone, {
        ...frame,
        x: frame.x + offset,
        y: frame.y + offset,
      }));
      clone.zIndex = nextZIndex++;

      if (component.groupId) {
        if (!groupIdMap.has(component.groupId)) {
          groupIdMap.set(component.groupId, `component-group-${batchSeed}-${groupIdMap.size + 1}`);
        }
        clone.groupId = groupIdMap.get(component.groupId);
      } else {
        clone.groupId = undefined;
      }

      nextIds.push(clone.id);
      return clone;
    }).map((clone, index) => {
      const sourceComponent = sourceComponents[index];
      if (!sourceComponent) {
        return clone;
      }

      const nextParentContainerId = sourceComponent.parentContainerId
        ? componentIdMap.get(sourceComponent.parentContainerId) ?? sourceComponent.parentContainerId
        : sourceComponent.parentContainerId ?? null;

      return {
        ...clone,
        parentContainerId: nextParentContainerId,
      };
    });

    return { clones, nextIds, componentIdMap };
  }

  private getBatchRootSourceComponentIds(
    sourceComponents: readonly StorefrontEditorComponentNode[]
  ): string[] {
    const sourceIds = new Set(sourceComponents.map((component) => component.id));
    return sourceComponents
      .filter((component) => !component.parentContainerId || !sourceIds.has(component.parentContainerId))
      .map((component) => component.id);
  }

  private reorderSelectedComponentDepth(direction: 'front' | 'back'): void {
    const section = this.selectedSection();
    if (!section) {
      return;
    }

    const selectedIds = new Set(this.getSelectedComponentsForBatchAction(section).map((component) => component.id));
    if (!selectedIds.size) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
        if (item.id !== section.id) {
          return item;
        }

        const components = [...this.readSectionComponents(item)].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        const selected = this.sortComponentsForContainerBundle(
          components.filter((component) => selectedIds.has(component.id))
        );
        const rest = components.filter((component) => !selectedIds.has(component.id));
        const ordered = direction === 'front' ? [...rest, ...selected] : [...selected, ...rest];
        return this.writeSectionComponents(
          item,
          ordered.map((component, index) => ({
            ...component,
              zIndex: index + 1,
            }))
          );
        }),
      },
    }), { syncRail: false });

    this.closeComponentContextMenu();
  }

  private stepSelectedComponentDepth(direction: 'forward' | 'backward'): void {
    const section = this.selectedSection();
    if (!section) {
      return;
    }

    const selectedIds = new Set(this.getSelectedComponentsForBatchAction(section).map((component) => component.id));
    if (!selectedIds.size) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
        if (item.id !== section.id) {
          return item;
        }

        const components = [...this.readSectionComponents(item)].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        const selected = this.sortComponentsForContainerBundle(
          components.filter((component) => selectedIds.has(component.id))
        );
        const rest = components.filter((component) => !selectedIds.has(component.id));
        if (!selected.length || !rest.length) {
          return item;
        }

        const earliestSelectedIndex = components.findIndex((component) => selectedIds.has(component.id));
        const latestSelectedIndex = components.length - 1 - [...components].reverse().findIndex((component) => selectedIds.has(component.id));

        let ordered = components;
        if (direction === 'forward') {
          const nextUnselected = components
            .slice(latestSelectedIndex + 1)
            .find((component) => !selectedIds.has(component.id));
          if (!nextUnselected) {
            return item;
          }

          const insertionIndex = rest.findIndex((component) => component.id === nextUnselected.id) + 1;
          ordered = [...rest.slice(0, insertionIndex), ...selected, ...rest.slice(insertionIndex)];
        } else {
          const previousCandidates = components.slice(0, earliestSelectedIndex).filter((component) => !selectedIds.has(component.id));
          const previousUnselected = previousCandidates[previousCandidates.length - 1] ?? null;
          if (!previousUnselected) {
            return item;
          }

          const insertionIndex = rest.findIndex((component) => component.id === previousUnselected.id);
          ordered = [...rest.slice(0, insertionIndex), ...selected, ...rest.slice(insertionIndex)];
        }

        return this.writeSectionComponents(
          item,
          ordered.map((component, index) => ({ ...component, zIndex: index + 1 }))
        );
      }),
    },
  }), { syncRail: false });

    this.closeComponentContextMenu();
  }

  private updateResizingComponent(event: MouseEvent): void {
    if (!this.activeResize) {
      return;
    }

    const deltaX = event.clientX - this.activeResize.startX;
    const deltaY = event.clientY - this.activeResize.startY;
    const startFrame = this.activeResize.startFrame;
    const localDelta = this.rotateVectorToLocal(deltaX, deltaY, this.activeResize.startRotation);
    const halfWidth = startFrame.width / 2;
    const halfHeight = startFrame.height / 2;
    let left = -halfWidth;
    let right = halfWidth;
    let top = -halfHeight;
    let bottom = halfHeight;

    if (this.activeResize.handle.includes('e')) {
      right += localDelta.x;
    }
    if (this.activeResize.handle.includes('w')) {
      left += localDelta.x;
    }
    if (this.activeResize.handle.includes('s')) {
      bottom += localDelta.y;
    }
    if (this.activeResize.handle.includes('n')) {
      top += localDelta.y;
    }

    const aspectRatioLocked = !this.activeResize.preserveAspectRatio && (this.lockAspectRatioEnabled() || event.shiftKey);
    if (aspectRatioLocked && startFrame.height > 0) {
      const aspectRatio = startFrame.width / startFrame.height;
      const currentWidth = right - left;
      const currentHeight = bottom - top;

      if (this.activeResize.handle.length === 1 ? this.activeResize.handle === 'n' || this.activeResize.handle === 's' : Math.abs(localDelta.x) < Math.abs(localDelta.y)) {
        const adjustedWidth = currentHeight * aspectRatio;
        const widthDelta = adjustedWidth - currentWidth;
        left -= widthDelta / 2;
        right += widthDelta / 2;
      } else {
        const adjustedHeight = currentWidth / aspectRatio;
        const heightDelta = adjustedHeight - currentHeight;
        top -= heightDelta / 2;
        bottom += heightDelta / 2;
      }
    }

    const minSize = 50;
    if (this.activeResize.preserveAspectRatio) {
      const aspectRatio = Math.max(this.activeResize.startAspectRatio || 1, 0.01);
      const startWidth = Math.max(startFrame.width, 1);
      const startHeight = Math.max(startFrame.height, 1);
      const widthSign = this.activeResize.handle.includes('e') ? 1 : -1;
      const heightSign = this.activeResize.handle.includes('s') ? 1 : -1;
      const rawWidth = startWidth + widthSign * localDelta.x;
      const rawHeight = startHeight + heightSign * localDelta.y;
      const minScale = Math.max(minSize / startWidth, minSize / startHeight);
      const sizeDot = rawWidth * startWidth + rawHeight * startHeight;
      const sizeLength = startWidth * startWidth + startHeight * startHeight;
      const nextScale = Math.max(sizeDot / Math.max(sizeLength, 1), minScale);
      const nextWidth = Math.max(startWidth * nextScale, minSize);
      const nextHeight = Math.max(nextWidth / aspectRatio, minSize);

      if (this.activeResize.handle.includes('e')) {
        left = -halfWidth;
        right = left + nextWidth;
      } else {
        right = halfWidth;
        left = right - nextWidth;
      }

      if (this.activeResize.handle.includes('s')) {
        top = -halfHeight;
        bottom = top + nextHeight;
      } else {
        bottom = halfHeight;
        top = bottom - nextHeight;
      }
    }

    if (!this.activeResize.preserveAspectRatio) {
      if (right - left < minSize) {
        if (this.activeResize.handle.includes('w') && !this.activeResize.handle.includes('e')) {
          left = right - minSize;
        } else {
          right = left + minSize;
        }
      }
      if (bottom - top < minSize) {
        if (this.activeResize.handle.includes('n') && !this.activeResize.handle.includes('s')) {
          top = bottom - minSize;
        } else {
          bottom = top + minSize;
        }
      }
    }

    if (this.activeResize.contentBounds) {
      if (this.activeResize.handle.includes('w')) {
        left = Math.min(left, this.activeResize.contentBounds.left);
      }
      if (this.activeResize.handle.includes('e')) {
        right = Math.max(right, this.activeResize.contentBounds.right);
      }
      if (this.activeResize.handle.includes('n')) {
        top = Math.min(top, this.activeResize.contentBounds.top);
      }
      if (this.activeResize.handle.includes('s')) {
        bottom = Math.max(bottom, this.activeResize.contentBounds.bottom);
      }
    }

    const localCenterOffset = {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
    };
    const worldCenterOffset = this.rotateVectorToWorld(
      localCenterOffset.x,
      localCenterOffset.y,
      this.activeResize.startRotation
    );
    const startCenterX = startFrame.x + startFrame.width / 2;
    const startCenterY = startFrame.y + startFrame.height / 2;
    const nextWidth = right - left;
    const nextHeight = bottom - top;
    const nextCenterX = startCenterX + worldCenterOffset.x;
    const nextCenterY = startCenterY + worldCenterOffset.y;
    const nextFrame = {
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
      width: nextWidth,
      height: nextHeight,
    };
    const snappedFrame = this.snapResizeFrameToGrid(nextFrame, this.activeResize.handle);
    this.setSnapGuides(this.activeResize.sectionId, this.snapToGridEnabled()
      ? [
          { orientation: 'vertical', offset: snappedFrame.x, kind: 'grid' },
          { orientation: 'horizontal', offset: snappedFrame.y, kind: 'grid' },
        ]
      : []);

    this.updateSectionComponentTransform(this.activeResize.sectionId, this.activeResize.componentId, {
      frame: snappedFrame,
    });
  }

  private updateRotatingComponent(event: MouseEvent): void {
    if (!this.activeRotation) {
      return;
    }

    const currentAngle = Math.atan2(
      event.clientY - this.activeRotation.centerY,
      event.clientX - this.activeRotation.centerX
    ) * (180 / Math.PI);

    let frameDelta = currentAngle - this.activeRotation.previousAngle;
    if (frameDelta > 180) {
      frameDelta -= 360;
    }
    if (frameDelta < -180) {
      frameDelta += 360;
    }

    this.activeRotation.accumulatedAngle += frameDelta;
    this.activeRotation.previousAngle = currentAngle;
    const nextRotation = this.getSnappedComponentRotation(
      this.activeRotation.startRotation + this.activeRotation.accumulatedAngle
    );

    this.updateSectionComponentTransform(this.activeRotation.sectionId, this.activeRotation.componentId, {
      rotation: nextRotation,
    });
  }

  private updateSectionComponentTransform(
    sectionId: string,
    componentId: string,
    patch: Partial<Pick<StorefrontEditorComponentNode, 'rotation' | 'frame'>>
  ): void {
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          return this.writeSectionComponents(
            section,
            this.readSectionComponents(section).map((component) =>
              component.id === componentId
                ? (() => {
                    if (patch.frame !== undefined && component.type === 'image') {
                      const scaleX = component.frame.width > 0 ? patch.frame.width / component.frame.width : 1;
                      const scaleY = component.frame.height > 0 ? patch.frame.height / component.frame.height : 1;
                      const currentOuterWidth = Number(component.props.cropOuterWidth ?? component.frame.width);
                      const currentOuterHeight = Number(component.props.cropOuterHeight ?? component.frame.height);
                      const currentOffsetX = Number(component.props.cropOuterOffsetX ?? 0);
                      const currentOffsetY = Number(component.props.cropOuterOffsetY ?? 0);

                      const nextImageComponent: StorefrontEditorImageNode = {
                        ...component,
                        frame: patch.frame,
                        props: {
                          ...component.props,
                          cropOuterWidth: Math.max(patch.frame.width, currentOuterWidth * scaleX),
                          cropOuterHeight: Math.max(patch.frame.height, currentOuterHeight * scaleY),
                          cropOuterOffsetX: currentOffsetX * scaleX,
                          cropOuterOffsetY: currentOffsetY * scaleY,
                        },
                        ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
                      };
                      return nextImageComponent;
                    }

                    const nextComponent =
                      patch.frame !== undefined ? this.writeComponentFrame(component, patch.frame) : component;
                    return {
                      ...nextComponent,
                      ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
                    };
                  })()
                : component
            )
          );
        }),
      },
    }), { syncRail: false });
  }

  private normalizeComponentRotation(angle: number): number {
    let next = angle % 360;
    if (next === 360 || next === -360) {
      next = 0;
    }
    return next;
  }

  private getSnappedComponentRotation(angle: number): number {
    const normalized = this.normalizeComponentRotation(angle);
    const positiveNormalized = ((normalized % 360) + 360) % 360;
    const nearestSnap = ProjectStorefrontEditor.ROTATION_SNAP_ANGLES.reduce(
      (closest, candidate) => {
        const distance = Math.abs(candidate - positiveNormalized);
        if (!closest || distance < closest.distance) {
          return { angle: candidate, distance };
        }
        return closest;
      },
      null as { angle: number; distance: number } | null
    );

    if (
      nearestSnap &&
      nearestSnap.distance <= ProjectStorefrontEditor.ROTATION_SNAP_THRESHOLD_DEGREES
    ) {
      return nearestSnap.angle === 360 ? 0 : nearestSnap.angle;
    }

    return normalized;
  }

  private rotateVectorToLocal(deltaX: number, deltaY: number, rotation: number): { x: number; y: number } {
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      x: deltaX * cos + deltaY * sin,
      y: -deltaX * sin + deltaY * cos,
    };
  }

  private rotateVectorToWorld(deltaX: number, deltaY: number, rotation: number): { x: number; y: number } {
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      x: deltaX * cos - deltaY * sin,
      y: deltaX * sin + deltaY * cos,
    };
  }

  private nudgeSelectedComponents(deltaX: number, deltaY: number): void {
    const section = this.selectedSection();
    const selectedIds = new Set(this.selectedComponentIds());
    if (!section || !selectedIds.size) {
      return;
    }

    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${section.id}"]`
    );
    const containerWidth = container instanceof HTMLElement ? container.clientWidth : 99999;
    const containerHeight = container instanceof HTMLElement ? container.clientHeight : 99999;

    this.updateSectionComponents(section.id, (components) =>
      components.map((component) => {
        if (!selectedIds.has(component.id) || component.isLocked || !component.isVisible) {
          return component;
        }

        const frame = this.getComponentFrame(component);
        const maxX = Math.max(0, containerWidth - frame.width);
        const maxY = Math.max(0, containerHeight - frame.height);
        return this.writeComponentFrame(component, {
          ...frame,
          x: Math.max(0, Math.min(frame.x + deltaX, maxX)),
          y: Math.max(0, Math.min(frame.y + deltaY, maxY)),
        });
      })
    );
  }

  private findSectionComponent(sectionId: string, componentId: string): StorefrontEditorComponentNode | null {
    const section = this.sections().find((item) => item.id === sectionId);
    return section ? this.readSectionComponents(section).find((item) => item.id === componentId) ?? null : null;
  }

  private canEditComponentText(component: StorefrontEditorComponentNode): boolean {
    return component.type === 'text' || component.type === 'button';
  }

  private normalizeLegacyTextComponent(component: StorefrontEditorComponentNode): StorefrontEditorComponentNode {
    if (component.type === 'heading') {
      const textStyle = (`Heading ${component.props.level}` as StorefrontEditorTextStylePreset);
      return {
        ...component,
        type: 'text',
        name: 'Text',
        props: buildStorefrontEditorTextProps(textStyle, {
          text: component.props.text,
          align: component.props.align,
        }),
      } as StorefrontEditorTextNode;
    }

    if (component.type === 'paragraph') {
      return {
        ...component,
        type: 'text',
        name: 'Text',
        props: buildStorefrontEditorTextProps('Paragraph 2', {
          text: component.props.text,
          fontFamily: component.props.fontFamily,
          fontSize: component.props.fontSize,
          fontWeight: component.props.fontWeight,
          fontStyle: component.props.fontStyle,
          textDecoration: component.props.textDecoration,
          color: component.props.color,
          align: component.props.align,
        }),
      } as StorefrontEditorTextNode;
    }

    if (component.type === 'text') {
      const defaults = buildStorefrontEditorTextProps(component.props.textStyle ?? 'Paragraph 2');
      return {
        ...component,
        props: {
          ...defaults,
          ...component.props,
          richTextHtml: component.props.richTextHtml ?? '',
          lineHeight: component.props.lineHeight ?? defaults.lineHeight,
          letterSpacing: component.props.letterSpacing ?? defaults.letterSpacing,
        },
      };
    }

    return component;
  }

  private readEditableComponentText(component: StorefrontEditorComponentNode): string {
    switch (component.type) {
      case 'text':
        return component.props.richTextHtml || this.plainTextToRichTextHtml(component.props.text);
      case 'button':
        return component.props.label;
      default:
        return '';
    }
  }

  private writeEditableComponentText(
    component: StorefrontEditorComponentNode,
    value: string
  ): StorefrontEditorComponentNode {
    switch (component.type) {
      case 'text':
        return {
          ...component,
          props: {
            ...component.props,
            text: this.richTextHtmlToPlainText(value),
            richTextHtml: this.normalizeRichTextHtml(value),
          },
        };
      case 'button':
        return { ...component, props: { ...component.props, label: value } };
      default:
        return component;
    }
  }

private updateComponentNode(
  sectionId: string,
  componentId: string,
  updater: (component: StorefrontEditorComponentNode) => StorefrontEditorComponentNode,
  options: { selectedSectionId?: string | null; syncRail?: boolean; transient?: boolean; preview?: boolean } = {}
): void {
  this.updateSectionComponents(sectionId, (components) =>
    this.updateComponentTree(components, componentId, updater),
    options
  );
}

private updateComponentTree(
  components: StorefrontEditorComponentNode[],
  componentId: string,
  updater: (component: StorefrontEditorComponentNode) => StorefrontEditorComponentNode
): StorefrontEditorComponentNode[] {
  return components.map((component) => {
    if (component.id === componentId) {
      return updater(component);
    }

    if (!component.children.length) {
      return component;
    }

    return {
      ...component,
      children: this.updateComponentTree(component.children, componentId, updater),
    };
  });
}

  private updateSelectedParagraphProps(
    patch: Partial<StorefrontEditorTextNode['props']>
  ): void {
    const sectionId = this.selectedSectionId();
    const component = this.selectedTextComponent();
    if (!sectionId || !component) {
      return;
    }

    this.updateComponentNode(sectionId, component.id, (current) =>
      current.type === 'text'
        ? {
            ...current,
            props: {
              ...current.props,
              ...patch,
            },
          }
        : current
  );
}

private updateSelectedImageProps(
  patch: Partial<StorefrontEditorImageNode['props']>,
  options: { transient?: boolean; preview?: boolean } = {}
): void {
  const sectionId = this.selectedSectionId();
  const component = this.selectedImageComponent();
  if (!sectionId || !component) {
    return;
  }

this.updateImageComponentProps(sectionId, component.id, patch, options);
}

private ensureImageSourceMetadata(sectionId: string, component: StorefrontEditorImageNode): void {
  if (!component.props.src || this.hasImageSourceMetadata(component)) {
    return;
  }

  const requestKey = `${sectionId}:${component.id}:${component.props.src}`;
  if (this.pendingImageSourceMetadataKeys.has(requestKey)) {
    return;
  }

  this.pendingImageSourceMetadataKeys.add(requestKey);
  void this.resolveImageAssetDimensions(component.props.src)
    .then((dimensions) => {
      if (!dimensions) {
        return;
      }

      this.updateComponentNode(sectionId, component.id, (current) =>
        current.type === 'image'
          && current.props.src === component.props.src
          && !this.hasImageSourceMetadata(current)
          ? {
              ...current,
              props: {
                ...current.props,
                ...buildStorefrontEditorImageSourceMetadata(dimensions.width, dimensions.height),
              },
            }
          : current
      );
    })
    .finally(() => {
      this.pendingImageSourceMetadataKeys.delete(requestKey);
    });
}

private async applySelectedImageAsset(asset: StorefrontMediaManagerAsset): Promise<void> {
  const sectionId = this.selectedSectionId();
  const image = this.selectedImageComponent();
  if (!sectionId || !image) {
    return;
  }

  const dimensions = await this.resolveImageAssetDimensions(asset.url);
  const nextFrame = dimensions
    ? this.computeImageFrameForAspectRatio(image.frame, dimensions.width / Math.max(dimensions.height, 1))
    : image.frame;
  const nextSourceMetadata = dimensions
    ? buildStorefrontEditorImageSourceMetadata(dimensions.width, dimensions.height)
    : {
        sourceWidth: image.props.sourceWidth ?? null,
        sourceHeight: image.props.sourceHeight ?? null,
        aspectRatio: image.props.aspectRatio,
      };

  this.updateComponentNode(sectionId, image.id, (current) =>
    current.type === 'image'
      ? {
          ...current,
          frame: nextFrame,
          props: {
            ...current.props,
            src: asset.url,
            alt: asset.name,
            ...nextSourceMetadata,
            cropX: 0,
            cropY: 0,
            cropWidth: 1,
            cropHeight: 1,
            cropOuterOffsetX: 0,
            cropOuterOffsetY: 0,
            cropOuterWidth: nextFrame.width,
            cropOuterHeight: nextFrame.height,
          },
        }
      : current
  );
  this.toastService.success(`${asset.name} selected as image.`);
  this.closeMediaManager();
}

private async resolveImageAssetDimensions(url: string): Promise<{ width: number; height: number } | null> {
  return await new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (width > 0 && height > 0) {
        resolve({ width, height });
        return;
      }
      resolve(null);
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

private hasImageSourceMetadata(component: Pick<StorefrontEditorImageNode, 'props'>): boolean {
  const width = Number(component.props.sourceWidth ?? 0);
  const height = Number(component.props.sourceHeight ?? 0);
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

private computeImageFrameForAspectRatio(
  frame: StorefrontEditorComponentNode['frame'],
  aspectRatio: number
): StorefrontEditorComponentNode['frame'] {
  const safeAspectRatio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
  const area = Math.max(frame.width * frame.height, 50 * 50);
  const width = Math.max(50, Math.sqrt(area * safeAspectRatio));
  const height = Math.max(50, width / safeAspectRatio);

  return {
    x: frame.x + (frame.width - width) / 2,
    y: frame.y + (frame.height - height) / 2,
    width,
    height,
  };
}

private updateImageComponentProps(
  sectionId: string,
  componentId: string,
  patch: Partial<StorefrontEditorImageNode['props']>,
  options: { transient?: boolean; preview?: boolean } = {}
): void {
  this.updateComponentNode(sectionId, componentId, (current) =>
    current.type === 'image'
      ? {
          ...current,
          props: {
            ...current.props,
            ...patch,
          },
        }
      : current,
    options
  );
}

  private isEditingSelectedTextComponent(): boolean {
    return this.isEditingComponentText() && this.selectedTextComponent() !== null;
  }

private focusActiveTextEditor(): HTMLElement | null {
  const editor = this.getActiveTextEditorElement();
  if (!editor) {
    return null;
  }

  const desiredHtml = this.editingComponentTextValue();
  if (editor.innerHTML !== desiredHtml) {
    editor.innerHTML = desiredHtml;
    this.placeCaretAtEnd(editor);
  }

  editor.focus();
  return editor;
}

private getActiveTextEditorElement(): HTMLElement | null {
  const componentId = this.editingComponentTextId();
  if (!componentId) {
    return null;
  }

  const editor = document.querySelector(
    `.storefront-editor__preview-component-text-editor[data-component-id="${componentId}"]`
  );
  return editor instanceof HTMLElement ? editor : null;
}

private ensureParagraphFontStylesheetLoaded(): void {
  const existingLink = document.getElementById('forma-storefront-editor-google-fonts');
  if (existingLink instanceof HTMLLinkElement) {
    return;
  }

  const link = document.createElement('link');
  link.id = 'forma-storefront-editor-google-fonts';
  link.rel = 'stylesheet';
  link.href = STOREFRONT_EDITOR_TEXT_FONT_STYLESHEET_HREF;
  document.head.appendChild(link);
}

private readActiveTextEditorHtml(): string {
  const editor = this.getActiveTextEditorElement();
  return editor?.innerHTML ?? this.editingComponentTextValue();
}

  private syncEditingTextValueFromDom(): void {
    const editor = this.focusActiveTextEditor();
    if (!editor) {
      return;
    }

    this.editingComponentTextValue.set(editor.innerHTML);
  }

  private plainTextToRichTextHtml(value: string): string {
    return this.escapeHtml(value).replace(/\n/g, '<br>');
  }

  private richTextHtmlToPlainText(value: string): string {
    const element = document.createElement('div');
    element.innerHTML = value;
    return element.innerText.replace(/\r\n/g, '\n').trim();
  }

  private normalizeRichTextHtml(value: string): string {
    const html = value.trim();
    if (!html) {
      return '';
    }

    return html
      .replace(/<div><br><\/div>/gi, '<br>')
      .replace(/<p><br><\/p>/gi, '<br>');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private placeCaretAtEnd(editor: HTMLElement): void {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

private updateSelectedButtonProps(
  patch: Partial<StorefrontEditorButtonNode['props']>,
  options: { transient?: boolean; preview?: boolean } = {}
): void {
    const sectionId = this.selectedSectionId();
    const component = this.selectedButtonComponent();
    if (!sectionId || !component) {
      return;
    }

    this.updateComponentNode(sectionId, component.id, (current) =>
      current.type === 'button'
        ? {
            ...current,
            props: {
              ...current.props,
              ...patch,
            },
          }
        : current,
      options
  );
}

private updateSelectedContainerProps(
  patch: Partial<StorefrontEditorContainerNode['props']>,
  options: { transient?: boolean; preview?: boolean } = {}
): void {
  const sectionId = this.selectedSectionId();
  const component = this.selectedContainerComponent();
  if (!sectionId || !component) {
    return;
  }

  this.updateComponentNode(sectionId, component.id, (current) =>
    current.type === 'container'
      ? {
          ...current,
          props: {
            ...current.props,
            ...patch,
          },
        }
      : current,
    options
  );
}

private updateSelectedProductFeedProps(
  patch: Partial<StorefrontEditorProductFeedNode['props']>
): void {
  const sectionId = this.selectedSectionId();
  const component = this.selectedProductFeedComponent();
  if (!sectionId || !component) {
    return;
  }

  this.updateComponentNode(sectionId, component.id, (current) =>
    current.type === 'product-feed'
      ? {
          ...current,
          props: {
            ...current.props,
            ...patch,
          },
        }
      : current
  );
}

  private readSavedParagraphColors(): string[] {
    try {
      const raw = localStorage.getItem(ProjectStorefrontEditor.SAVED_PARAGRAPH_COLORS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 12)
      : [];
    } catch {
      return [];
    }
  }

  private readSavedButtonColors(): string[] {
    try {
      const raw = localStorage.getItem(ProjectStorefrontEditor.SAVED_BUTTON_COLORS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 12)
        : [];
    } catch {
      return [];
    }
  }

  private readSavedSectionBorderColors(): string[] {
    try {
      const raw = localStorage.getItem(ProjectStorefrontEditor.SAVED_SECTION_BORDER_COLORS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 12)
        : [];
    } catch {
      return [];
    }
  }

  private updateCustomColorFromCanvasEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__context-toolbar-color-canvas')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const saturation = this.clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = this.clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    this.customPickerSaturation.set(saturation);
    this.customPickerBrightness.set(brightness);
    this.commitCustomColorPicker();
  }

  private updateCustomColorFromHueEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__context-toolbar-color-spectrum')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ratio = this.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    this.customPickerHue.set(Math.round(ratio * 360));
    this.commitCustomColorPicker();
  }

  private commitCustomColorPicker(): void {
    const hex = this.hsvToHex(this.customPickerHue(), this.customPickerSaturation(), this.customPickerBrightness());
    this.updateSelectedParagraphProps({ color: hex });
  }

  private updateButtonCustomColorFromCanvasEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__button-color-canvas')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const saturation = this.clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = this.clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    this.buttonCustomPickerSaturation.set(saturation);
    this.buttonCustomPickerBrightness.set(brightness);
    this.commitButtonCustomColorPicker();
  }

  private updateButtonCustomColorFromHueEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__button-color-spectrum')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ratio = this.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    this.buttonCustomPickerHue.set(Math.round(ratio * 360));
    this.commitButtonCustomColorPicker();
  }

  private commitButtonCustomColorPicker(): void {
    const hex = this.hsvToHex(
      this.buttonCustomPickerHue(),
      this.buttonCustomPickerSaturation(),
      this.buttonCustomPickerBrightness()
    );
    this.updateSelectedButtonProps({ backgroundColor: hex });
  }

  private syncCustomColorPickerFromHex(color: string): void {
    const normalized = this.normalizeHexColor(color);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    const { h, s, v } = this.hexToHsv(normalized);
    this.customPickerHue.set(h);
    this.customPickerSaturation.set(s);
    this.customPickerBrightness.set(v);
  }

  private syncButtonCustomColorPickerFromHex(color: string): void {
    const normalized = this.normalizeHexColor(color);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    const { h, s, v } = this.hexToHsv(normalized);
    this.buttonCustomPickerHue.set(h);
    this.buttonCustomPickerSaturation.set(s);
    this.buttonCustomPickerBrightness.set(v);
  }

  private updateContainerBackgroundColorFromCanvasEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__container-background-color-canvas')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const saturation = this.clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = this.clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    this.containerBackgroundCustomPickerSaturation.set(saturation);
    this.containerBackgroundCustomPickerBrightness.set(brightness);
    this.commitContainerBackgroundColorPicker();
  }

  private updateContainerBackgroundColorFromHueEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__container-background-color-spectrum')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ratio = this.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    this.containerBackgroundCustomPickerHue.set(Math.round(ratio * 360));
    this.commitContainerBackgroundColorPicker();
  }

  private commitContainerBackgroundColorPicker(): void {
    const hex = this.hsvToHex(
      this.containerBackgroundCustomPickerHue(),
      this.containerBackgroundCustomPickerSaturation(),
      this.containerBackgroundCustomPickerBrightness()
    );
    this.updateSelectedContainerBackgroundColor(hex);
  }

  private syncContainerBackgroundColorPickerFromHex(color: string): void {
    const normalized = this.normalizeHexColor(color);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    const { h, s, v } = this.hexToHsv(normalized);
    this.containerBackgroundCustomPickerHue.set(h);
    this.containerBackgroundCustomPickerSaturation.set(s);
    this.containerBackgroundCustomPickerBrightness.set(v);
  }

  private updateContainerBorderColorFromCanvasEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__container-borders-color-canvas')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const saturation = this.clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = this.clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    this.containerBorderCustomPickerSaturation.set(saturation);
    this.containerBorderCustomPickerBrightness.set(brightness);
    this.commitContainerBorderColorPicker();
  }

  private updateContainerBorderColorFromHueEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__container-borders-color-spectrum')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ratio = this.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    this.containerBorderCustomPickerHue.set(Math.round(ratio * 360));
    this.commitContainerBorderColorPicker();
  }

  private commitContainerBorderColorPicker(): void {
    const hex = this.hsvToHex(
      this.containerBorderCustomPickerHue(),
      this.containerBorderCustomPickerSaturation(),
      this.containerBorderCustomPickerBrightness()
    );
    this.updateSelectedContainerBorderColor(hex);
  }

  private syncContainerBorderColorPickerFromHex(color: string): void {
    const normalized = this.normalizeHexColor(color);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    const { h, s, v } = this.hexToHsv(normalized);
    this.containerBorderCustomPickerHue.set(h);
    this.containerBorderCustomPickerSaturation.set(s);
    this.containerBorderCustomPickerBrightness.set(v);
  }

  private updateSectionBackgroundColorFromCanvasEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__section-background-color-canvas')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const saturation = this.clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = this.clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    this.sectionBackgroundCustomPickerSaturation.set(saturation);
    this.sectionBackgroundCustomPickerBrightness.set(brightness);
    this.commitSectionBackgroundColorPicker();
  }

  private updateSectionBackgroundColorFromHueEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__section-background-color-spectrum')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ratio = this.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    this.sectionBackgroundCustomPickerHue.set(Math.round(ratio * 360));
    this.commitSectionBackgroundColorPicker();
  }

  private commitSectionBackgroundColorPicker(): void {
    const hex = this.hsvToHex(
      this.sectionBackgroundCustomPickerHue(),
      this.sectionBackgroundCustomPickerSaturation(),
      this.sectionBackgroundCustomPickerBrightness()
    );
    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_BACKGROUND_PROP_KEY]: hex,
      },
    }));
  }

  private syncSectionBackgroundColorPickerFromHex(color: string): void {
    const normalized = this.normalizeHexColor(color);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    const { h, s, v } = this.hexToHsv(normalized);
    this.sectionBackgroundCustomPickerHue.set(h);
    this.sectionBackgroundCustomPickerSaturation.set(s);
    this.sectionBackgroundCustomPickerBrightness.set(v);
  }

  private updateSectionBorderColorFromCanvasEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__section-borders-color-canvas')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const saturation = this.clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = this.clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    this.sectionBorderCustomPickerSaturation.set(saturation);
    this.sectionBorderCustomPickerBrightness.set(brightness);
    this.commitSectionBorderColorPicker();
  }

  private updateSectionBorderColorFromHueEvent(event: MouseEvent): void {
    const element = event.target instanceof HTMLElement
      ? event.target.closest('.storefront-editor__section-borders-color-spectrum')
      : null;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ratio = this.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    this.sectionBorderCustomPickerHue.set(Math.round(ratio * 360));
    this.commitSectionBorderColorPicker();
  }

  private commitSectionBorderColorPicker(): void {
    const hex = this.hsvToHex(
      this.sectionBorderCustomPickerHue(),
      this.sectionBorderCustomPickerSaturation(),
      this.sectionBorderCustomPickerBrightness()
    );
    this.updateSelectedSectionBorderColor(hex);
  }

  private syncSectionBorderColorPickerFromHex(color: string): void {
    const normalized = this.normalizeHexColor(color);
    if (!normalized || normalized === 'transparent') {
      return;
    }

    const { h, s, v } = this.hexToHsv(normalized);
    this.sectionBorderCustomPickerHue.set(h);
    this.sectionBorderCustomPickerSaturation.set(s);
    this.sectionBorderCustomPickerBrightness.set(v);
  }

  private rememberSectionBorderColor(color: string): void {
    const normalized = color.trim().toLowerCase();
    const next = [normalized, ...this.savedSectionBorderColors().filter((item) => item !== normalized)].slice(0, 12);
    this.savedSectionBorderColors.set(next);
    localStorage.setItem(ProjectStorefrontEditor.SAVED_SECTION_BORDER_COLORS_STORAGE_KEY, JSON.stringify(next));
  }

  private getSectionLayoutPresetById(presetId: StorefrontEditorSectionLayoutPresetId): StorefrontEditorSectionLayoutPreset {
    return this.sectionLayoutPresets.find((preset) => preset.id === presetId) ?? this.sectionLayoutPresets[0];
  }

private getButtonShadowCssValue(shadow: StorefrontEditorButtonNode['props']['shadow']): string {
  switch (shadow) {
    case 'soft':
      return '2px -2px 14px rgba(15, 23, 42, 0.16)';
    case 'medium':
      return '-2px -2px 14px rgba(15, 23, 42, 0.16)';
    case 'bottom':
      return '0 10px 18px rgba(15, 23, 42, 0.18)';
    case 'strong':
      return '0 0 18px rgba(15, 23, 42, 0.28)';
    case 'none':
    default:
      return 'none';
  }
}

  private normalizeHexColor(value: string | null | undefined): string | null {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return null;
    }

    if (raw.toLowerCase() === 'transparent') {
      return 'transparent';
    }

    const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
    if (!/^#([0-9a-fA-F]{6})$/.test(prefixed)) {
      return null;
    }

    return prefixed.toLowerCase();
  }

  private hexToHsv(hex: string): { h: number; s: number; v: number } {
    const normalized = hex.replace('#', '');
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;

    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta) % 6;
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
      }
    }

    h = Math.round(h * 60);
    if (h < 0) {
      h += 360;
    }

    const s = max === 0 ? 0 : Math.round((delta / max) * 100);
    const v = Math.round(max * 100);

    return { h, s, v };
  }

  private hsvToHex(h: number, s: number, v: number): string {
    const saturation = this.clamp(s, 0, 100) / 100;
    const value = this.clamp(v, 0, 100) / 100;
    const c = value * saturation;
    const hueSegment = ((h % 360) + 360) % 360 / 60;
    const x = c * (1 - Math.abs((hueSegment % 2) - 1));
    const m = value - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (hueSegment >= 0 && hueSegment < 1) {
      r = c; g = x; b = 0;
    } else if (hueSegment < 2) {
      r = x; g = c; b = 0;
    } else if (hueSegment < 3) {
      r = 0; g = c; b = x;
    } else if (hueSegment < 4) {
      r = 0; g = x; b = c;
    } else if (hueSegment < 5) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    const toHex = (channel: number) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, '0');

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private normalizeSectionLayoutTrackSizes(values: number[], count: number, fallback: number[]): number[] {
    if (count <= 0) {
      return [];
    }

    const source =
      values.length === count && values.every((value) => Number.isFinite(value) && value > 0)
        ? values
        : fallback;
    const total = source.reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return Array.from({ length: count }, () => 100 / count);
    }

    let consumed = 0;
    return source.map((value, index) => {
      if (index === source.length - 1) {
        return Math.max(0, +(100 - consumed).toFixed(4));
      }

      const normalized = +((value / total) * 100).toFixed(4);
      consumed += normalized;
      return normalized;
    });
  }

  private getDefaultSectionLayoutTrackSizes(
    presetId: StorefrontEditorSectionLayoutPresetId,
    axis: StorefrontEditorSectionLayoutTrackAxis,
    count: number
  ): number[] {
    if (count <= 0) {
      return [];
    }

    if (axis === 'column' && count === 2) {
      if (presetId === 'sidebar-left') {
        return [34, 66];
      }

      if (presetId === 'sidebar-right') {
        return [66, 34];
      }
    }

    return Array.from({ length: count }, () => 100 / count);
  }

  private writeSectionLayoutAssignments(
    section: StorefrontHomepageSection,
    assignments: StorefrontEditorSectionLayoutAssignment[]
  ): StorefrontHomepageSection {
    const componentIds = new Set(this.readSectionComponents(section).map((component) => component.id));
    const uniqueAssignments = new Map<string, StorefrontEditorSectionLayoutAssignment>();

    for (const assignment of assignments) {
      if (!componentIds.has(assignment.componentId)) {
        continue;
      }

      uniqueAssignments.set(assignment.componentId, {
        componentId: assignment.componentId,
        column: Math.max(1, Math.round(assignment.column)),
        row: Math.max(1, Math.round(assignment.row)),
      });
    }

    return {
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_LAYOUT_ASSIGNMENTS_PROP_KEY]: Array.from(uniqueAssignments.values()),
      },
    };
  }

  private getSectionContentDimensions(sectionId: string): { width: number; height: number } | null {
    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    if (!(container instanceof HTMLElement)) {
      return null;
    }

    const rect = container.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  private getMinimumSectionResizeHeight(sectionId: string): number {
    const section = this.sections().find((item) => item.id === sectionId) ?? null;
    if (!section) {
      return 24;
    }

    const contentBottom = this.readSectionComponents(section).reduce((maxBottom, component) => {
      const frame = this.getComponentFrame(component);
      return Math.max(maxBottom, frame.y + frame.height);
    }, 0);

    return Math.max(24, Math.ceil(contentBottom));
  }

  private getSectionLayoutCellBounds(
    section: StorefrontHomepageSection | null,
    containerWidth: number,
    containerHeight: number
  ): StorefrontEditorSectionLayoutCellBounds[] {
    if (!section || !this.sectionShowsLayoutControls(section)) {
      return [];
    }

    const columns = Math.max(1, this.sectionLayoutColumns(section));
    const rows = Math.max(1, this.sectionLayoutRows(section));
    const cells = this.sectionLayoutOverlayCells(section);
    const padding = ProjectStorefrontEditor.SECTION_LAYOUT_PADDING_PX;
    const gap = ProjectStorefrontEditor.SECTION_LAYOUT_GAP_PX;
    const columnSizes = this.sectionLayoutColumnTrackSizes(section);
    const rowSizes = this.sectionLayoutRowTrackSizes(section);
    const innerWidth = Math.max(1, containerWidth - (padding * 2) - (gap * Math.max(0, columns - 1)));
    const innerHeight = Math.max(1, containerHeight - (padding * 2) - (gap * Math.max(0, rows - 1)));

    const columnWidths = this.scaleLayoutTracksToPixels(columnSizes, innerWidth);
    const rowHeights = this.scaleLayoutTracksToPixels(rowSizes, innerHeight);
    const columnOffsets = this.buildLayoutTrackOffsets(columnWidths, padding, gap);
    const rowOffsets = this.buildLayoutTrackOffsets(rowHeights, padding, gap);

    return cells.map((cell) => {
      const columnSpan = Math.max(1, cell.columnSpan ?? 1);
      const rowSpan = Math.max(1, cell.rowSpan ?? 1);
      const startColumnIndex = Math.max(0, Math.min(columns - 1, cell.column - 1));
      const startRowIndex = Math.max(0, Math.min(rows - 1, cell.row - 1));
      const width =
        columnWidths.slice(startColumnIndex, startColumnIndex + columnSpan).reduce((sum, value) => sum + value, 0) +
        (gap * Math.max(0, columnSpan - 1));
      const height =
        rowHeights.slice(startRowIndex, startRowIndex + rowSpan).reduce((sum, value) => sum + value, 0) +
        (gap * Math.max(0, rowSpan - 1));

      return {
        column: cell.column,
        row: cell.row,
        columnSpan,
        rowSpan,
        x: columnOffsets[startColumnIndex] ?? padding,
        y: rowOffsets[startRowIndex] ?? padding,
        width,
        height,
      };
    });
  }

  private scaleLayoutTracksToPixels(trackSizes: number[], totalSize: number): number[] {
    if (!trackSizes.length) {
      return [];
    }

    let consumed = 0;
    return trackSizes.map((size, index) => {
      if (index === trackSizes.length - 1) {
        return Math.max(0, totalSize - consumed);
      }

      const nextValue = Math.max(0, Math.round((size / 100) * totalSize));
      consumed += nextValue;
      return nextValue;
    });
  }

  private buildLayoutTrackOffsets(trackSizes: number[], padding: number, gap: number): number[] {
    let cursor = padding;
    return trackSizes.map((size) => {
      const offset = cursor;
      cursor += size + gap;
      return offset;
    });
  }

  private resolveSectionLayoutCellFromAssignment(
    section: StorefrontHomepageSection | null,
    assignment: StorefrontEditorSectionLayoutAssignment,
    cells: StorefrontEditorSectionLayoutCellBounds[]
  ): StorefrontEditorSectionLayoutCellBounds | null {
    if (!section || !cells.length) {
      return null;
    }

    const exactMatch = cells.find((cell) => cell.column === assignment.column && cell.row === assignment.row);
    if (exactMatch) {
      return exactMatch;
    }

    return (
      [...cells].sort((left, right) => {
        const leftDistance = Math.abs(left.column - assignment.column) + Math.abs(left.row - assignment.row);
        const rightDistance = Math.abs(right.column - assignment.column) + Math.abs(right.row - assignment.row);
        return leftDistance - rightDistance;
      })[0] ?? null
    );
  }

  private getSectionLayoutCellAtLocalPoint(
    cells: StorefrontEditorSectionLayoutCellBounds[],
    localX: number,
    localY: number
  ): StorefrontEditorSectionLayoutCellBounds | null {
    const containingCell = cells.find(
      (cell) =>
        localX >= cell.x &&
        localX <= cell.x + cell.width &&
        localY >= cell.y &&
        localY <= cell.y + cell.height
    );
    if (containingCell) {
      return containingCell;
    }

    return (
      [...cells].sort((left, right) => {
        const leftDistance = Math.hypot((left.x + left.width / 2) - localX, (left.y + left.height / 2) - localY);
        const rightDistance = Math.hypot((right.x + right.width / 2) - localX, (right.y + right.height / 2) - localY);
        return leftDistance - rightDistance;
      })[0] ?? null
    );
  }

  private getNextSectionLayoutInsertionCell(
    section: StorefrontHomepageSection | null,
    cells: StorefrontEditorSectionLayoutCellBounds[]
  ): StorefrontEditorSectionLayoutCellBounds | null {
    if (!section || !cells.length) {
      return null;
    }

    const occupiedCells = new Set(
      this.readSectionLayoutAssignments(section).map((assignment) => `${assignment.column}:${assignment.row}`)
    );

    return cells.find((cell) => !occupiedCells.has(`${cell.column}:${cell.row}`)) ?? cells[0] ?? null;
  }

  private getSnappedComponentFrameForLayoutCell(
    component: StorefrontEditorComponentNode,
    cell: StorefrontEditorSectionLayoutCellBounds
  ): StorefrontEditorComponentNode['frame'] {
    const frame = this.getComponentFrame(component);
    const inset = 16;
    const availableWidth = Math.max(60, cell.width - inset * 2);
    const availableHeight = Math.max(40, cell.height - inset * 2);
    let width = Math.min(frame.width, availableWidth);
    let height = Math.min(frame.height, availableHeight);

    if (component.type === 'product-feed' || component.type === 'image' || component.type === 'container') {
      width = availableWidth;
      height = availableHeight;
    } else if (component.type === 'text' || component.type === 'heading' || component.type === 'paragraph') {
      width = availableWidth;
    } else if (component.type === 'button') {
      width = Math.min(availableWidth, Math.max(frame.width, Math.min(availableWidth, 220)));
    }

    return {
      ...frame,
      x: Math.round(cell.x + ((cell.width - width) / 2)),
      y: Math.round(cell.y + ((cell.height - height) / 2)),
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  private applyLayoutAssignmentsToSectionGeometry(
    section: StorefrontHomepageSection,
    containerWidth: number,
    containerHeight: number
  ): StorefrontHomepageSection {
    if (!this.sectionShowsLayoutControls(section)) {
      return this.writeSectionLayoutAssignments(section, []);
    }

    const assignments = this.readSectionLayoutAssignments(section);
    if (!assignments.length) {
      return section;
    }

    const cellBounds = this.getSectionLayoutCellBounds(section, containerWidth, containerHeight);
    if (!cellBounds.length) {
      return section;
    }

    const componentIds = new Set(this.readSectionComponents(section).map((component) => component.id));
    const normalizedAssignments = assignments
      .filter((assignment) => componentIds.has(assignment.componentId))
      .map((assignment) => {
        const resolvedCell = this.resolveSectionLayoutCellFromAssignment(section, assignment, cellBounds);
        return resolvedCell
          ? {
              componentId: assignment.componentId,
              column: resolvedCell.column,
              row: resolvedCell.row,
            }
          : null;
      })
      .filter((assignment): assignment is StorefrontEditorSectionLayoutAssignment => assignment !== null);

    return this.writeSectionLayoutAssignments(section, normalizedAssignments);
  }

  private updateSectionLayoutStructure(
    sectionId: string,
    updater: (section: StorefrontHomepageSection) => StorefrontHomepageSection,
    options: { selectedSectionId?: string | null; syncRail?: boolean } = { syncRail: true }
  ): void {
    const dimensions = this.getSectionContentDimensions(sectionId);

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          let nextSection = updater(section);
          if (dimensions) {
            nextSection = this.applyLayoutAssignmentsToSectionGeometry(nextSection, dimensions.width, dimensions.height);
          }

          return nextSection;
        }),
      },
    }), { selectedSectionId: sectionId, ...options });
  }

  private removeSectionLayoutAssignments(
    sectionId: string,
    componentIds: string[],
    options: { selectedSectionId?: string | null; syncRail?: boolean; transient?: boolean } = {}
  ): void {
    if (!componentIds.length) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          return this.writeSectionLayoutAssignments(
            section,
            this.readSectionLayoutAssignments(section).filter((assignment) => !componentIds.includes(assignment.componentId))
          );
        }),
      },
    }), options);
  }

  private upsertSectionLayoutAssignments(
    sectionId: string,
    assignments: StorefrontEditorSectionLayoutAssignment[],
    options: { selectedSectionId?: string | null; syncRail?: boolean } = {}
  ): void {
    if (!assignments.length) {
      return;
    }

    const dimensions = this.getSectionContentDimensions(sectionId);
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          const nextAssignments = [
            ...this.readSectionLayoutAssignments(section).filter(
              (existingAssignment) => !assignments.some((assignment) => assignment.componentId === existingAssignment.componentId)
            ),
            ...assignments,
          ];
          let nextSection = this.writeSectionLayoutAssignments(section, nextAssignments);
          if (dimensions) {
            nextSection = this.applyLayoutAssignmentsToSectionGeometry(nextSection, dimensions.width, dimensions.height);
          }
          return nextSection;
        }),
      },
    }), { selectedSectionId: sectionId, ...options });
  }

  private refreshSectionLayoutAssignments(sectionIds?: string[]): void {
    const ids = new Set(sectionIds?.length ? sectionIds : this.sections().map((section) => section.id));
    const dimensionsBySectionId = new Map<string, { width: number; height: number }>();

    ids.forEach((sectionId) => {
      const dimensions = this.getSectionContentDimensions(sectionId);
      if (dimensions) {
        dimensionsBySectionId.set(sectionId, dimensions);
      }
    });

    if (!dimensionsBySectionId.size) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          const dimensions = dimensionsBySectionId.get(section.id);
          if (!dimensions || !this.readSectionLayoutAssignments(section).length || !this.sectionShowsLayoutControls(section)) {
            return section;
          }

          return this.applyLayoutAssignmentsToSectionGeometry(section, dimensions.width, dimensions.height);
        }),
      },
    }), { syncRail: false });
  }

private updateSectionComponents(
  sectionId: string,
  updater: (components: StorefrontEditorComponentNode[]) => StorefrontEditorComponentNode[],
  options: { selectedSectionId?: string | null; syncRail?: boolean; transient?: boolean; preview?: boolean } = {}
): void {
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) =>
          section.id === sectionId ? this.writeSectionComponents(section, updater(this.readSectionComponents(section))) : section
        ),
      },
    }), options);
  }

private insertComponentIntoSection(
  sectionId: string,
  component: StorefrontEditorComponentNode,
  options: {
    selectedSectionId?: string | null;
    syncRail?: boolean;
    layoutAssignment?: StorefrontEditorSectionLayoutAssignment | null;
  } = {}
): void {
  const minSectionHeight = this.getRequiredSectionHeightForComponent(sectionId, component);
  const { layoutAssignment, ...mutationOptions } = options;

  this.applyStorefrontMutation((storefront) => ({
    ...storefront,
    draftHomepage: {
      ...storefront.draftHomepage,
      sections: storefront.draftHomepage.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }
        
        let nextSection = this.writeSectionComponents(section, [...this.readSectionComponents(section), component]);
        if (layoutAssignment) {
          nextSection = this.writeSectionLayoutAssignments(nextSection, [
            ...this.readSectionLayoutAssignments(nextSection),
            layoutAssignment,
          ]);
        }

        const heightPropKey = this.getSectionHeightPropKey();
        const currentHeight = this.readViewportSectionHeight(section);
        if (minSectionHeight <= currentHeight) {
          return nextSection;
        }

        return {
          ...nextSection,
          props: {
            ...nextSection.props,
            [heightPropKey]: minSectionHeight,
          },
        };
      }),
    },
  }), mutationOptions);
  this.selectedComponentId.set(component.id);
this.selectedComponentIds.set([component.id]);
this.isolatedGroupComponentId.set(null);
}

private insertComponentIntoSelectedContainerIfPossible(
  sectionId: string,
  component: StorefrontEditorComponentNode
): boolean {
  const selectedContainer = this.selectedContainerComponent();
  if (!selectedContainer) {
    return false;
  }

  this.appendComponentToContainer(sectionId, selectedContainer.id, component);
  return true;
}

private appendComponentToContainer(
  sectionId: string,
  containerId: string,
  component: StorefrontEditorComponentNode
): void {
  const attachedComponent = {
    ...component,
    parentContainerId: containerId,
  };

  this.insertComponentIntoSection(sectionId, attachedComponent, {
    selectedSectionId: sectionId,
    syncRail: true,
  });
}

private getContainerAssociatedComponents(
  components: StorefrontEditorComponentNode[],
  container: StorefrontEditorContainerNode
): StorefrontEditorComponentNode[] {
  const descendants: StorefrontEditorComponentNode[] = [];
  const visited = new Set<string>([container.id]);

  const collectChildren = (parentId: string): void => {
    const directChildren = components.filter(
      (component) => component.id !== parentId && component.parentContainerId === parentId
    );

    for (const child of directChildren) {
      if (visited.has(child.id)) {
        continue;
      }

      visited.add(child.id);
      descendants.push(child);

      if (child.type === 'container') {
        collectChildren(child.id);
      }
    }
  };

  collectChildren(container.id);
  return descendants;
}

private updateComponentContainerParentIds(
  sectionId: string,
  componentIds: readonly string[],
  parentContainerId: string | null,
  options: { selectedSectionId?: string | null; syncRail?: boolean; transient?: boolean; preview?: boolean } = {}
): void {
  if (!componentIds.length) {
    return;
  }

  this.updateSectionComponents(
    sectionId,
    (components) => componentIds.reduce(
      (nextComponents, componentId) =>
        this.updateComponentTree(nextComponents, componentId, (component) => ({
          ...component,
          parentContainerId,
        })),
      components
    ),
    options
  );
}

private getContainerAttachRootComponentIds(
  sectionId: string,
  componentIds: readonly string[]
): string[] {
  if (!componentIds.length) {
    return [];
  }

  const section = this.sections().find((item) => item.id === sectionId);
  if (!section) {
    return [...componentIds];
  }

  const componentsById = new Map(
    this.readSectionComponents(section).map((component) => [component.id, component] as const)
  );
  const componentIdSet = new Set(componentIds);

  return componentIds.filter((componentId) => {
    const component = componentsById.get(componentId);
    if (!component?.parentContainerId) {
      return true;
    }

    return !componentIdSet.has(component.parentContainerId);
  });
}

private elevateDraggedComponentsAboveContainers(sectionId: string, componentIds: string[]): void {
  const section = this.sections().find((item) => item.id === sectionId);
  if (!section || !componentIds.length) {
    return;
  }

  const draggedIds = new Set(componentIds);
  const components = this.readSectionComponents(section);
  const containers = components.filter(
    (component): component is StorefrontEditorContainerNode => component.type === 'container'
  );
  const nextZIndexById = new Map<string, number>();

  componentIds
    .map((componentId) => components.find((component) => component.id === componentId) ?? null)
    .filter((component): component is StorefrontEditorComponentNode => component !== null)
    .sort((left, right) => (left.zIndex ?? 0) - (right.zIndex ?? 0))
    .forEach((component) => {
      const explicitParentContainer = component.parentContainerId
        ? containers.find((container) => container.id === component.parentContainerId) ?? null
        : null;
      const frame = this.getComponentFrame(component);
      const componentArea = Math.max(1, frame.width * frame.height);
      const containingContainer = explicitParentContainer ?? containers
        .filter((container) => {
          if (container.id === component.id || draggedIds.has(container.id)) {
            return false;
          }

          const containerFrame = this.getComponentFrame(container);
          const containerArea = containerFrame.width * containerFrame.height;
          return (
            containerArea > componentArea &&
            this.isPointInsideFrame(
              frame.x + frame.width / 2,
              frame.y + frame.height / 2,
              containerFrame
            )
          );
        })
        .sort((left, right) => {
          const leftFrame = this.getComponentFrame(left);
          const rightFrame = this.getComponentFrame(right);
          return leftFrame.width * leftFrame.height - rightFrame.width * rightFrame.height;
        })[0];

      if (!containingContainer) {
        return;
      }

      const containerZIndex = nextZIndexById.get(containingContainer.id) ?? containingContainer.zIndex ?? 1;
      const currentZIndex = nextZIndexById.get(component.id) ?? component.zIndex ?? 1;
      if (currentZIndex > containerZIndex) {
        return;
      }

      nextZIndexById.set(component.id, containerZIndex + 1);
    });

  if (!nextZIndexById.size) {
    return;
  }

  this.updateSectionComponents(
    sectionId,
    (currentComponents) =>
      currentComponents.map((component) =>
        nextZIndexById.has(component.id)
          ? { ...component, zIndex: nextZIndexById.get(component.id) ?? component.zIndex }
          : component
      ),
    { selectedSectionId: sectionId, syncRail: false, transient: true }
  );
}

private getContainerContentLocalBounds(
  section: StorefrontHomepageSection,
  container: StorefrontEditorContainerNode
): { left: number; right: number; top: number; bottom: number } | null {
  const associatedComponents = this.getContainerAssociatedComponents(this.readSectionComponents(section), container);
  if (!associatedComponents.length) {
    return null;
  }

  const containerFrame = this.getComponentFrame(container);
  const containerCenterX = containerFrame.x + containerFrame.width / 2;
  const containerCenterY = containerFrame.y + containerFrame.height / 2;
  const rotation = container.rotation ?? 0;
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  associatedComponents.forEach((component) => {
    const frame = this.getComponentFrame(component);
    const corners = [
      { x: frame.x, y: frame.y },
      { x: frame.x + frame.width, y: frame.y },
      { x: frame.x, y: frame.y + frame.height },
      { x: frame.x + frame.width, y: frame.y + frame.height },
    ];

    corners.forEach((corner) => {
      const local = this.rotateVectorToLocal(corner.x - containerCenterX, corner.y - containerCenterY, rotation);
      left = Math.min(left, local.x);
      right = Math.max(right, local.x);
      top = Math.min(top, local.y);
      bottom = Math.max(bottom, local.y);
    });
  });

  if (!Number.isFinite(left) || !Number.isFinite(right) || !Number.isFinite(top) || !Number.isFinite(bottom)) {
    return null;
  }

  return { left, right, top, bottom };
}

private isPointInsideFrame(
  x: number,
  y: number,
  frame: StorefrontEditorComponentNode['frame']
): boolean {
  return x >= frame.x && x <= frame.x + frame.width && y >= frame.y && y <= frame.y + frame.height;
}

private getContainerDropTargetAtPoint(
  clientX: number,
  clientY: number
): { sectionId: string; containerId: string } | null {
  const target = document.elementFromPoint(clientX, clientY);
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const containerContent = target.closest('[data-editor-container-id]');
  const sectionContent = target.closest('.storefront-editor__preview-section-content[data-section-content-id]');
  if (!(containerContent instanceof HTMLElement) || !(sectionContent instanceof HTMLElement)) {
    return null;
  }

  return {
    sectionId: sectionContent.dataset['sectionContentId'] ?? '',
    containerId: containerContent.dataset['editorContainerId'] ?? '',
  };
}

private getContainerDropTargetForDraggedBounds(
  draggedRect: { left: number; top: number; width: number; height: number },
  _fallbackSectionId: string,
  excludedComponentIds: string[] = []
): { sectionId: string; containerId: string } | null {
  const excludedIds = new Set(excludedComponentIds);
  const containers = Array.from(
    document.querySelectorAll('[data-editor-container-id]')
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);

  if (!containers.length) {
    return null;
  }

  const draggedCenterX = draggedRect.left + draggedRect.width / 2;
  const draggedCenterY = draggedRect.top + draggedRect.height / 2;

  const bestMatch = containers
    .map((container) => {
      const containerId = container.dataset['editorContainerId'] ?? '';
      const sectionId =
        container.closest('.storefront-editor__preview-section-content[data-section-content-id]')?.getAttribute('data-section-content-id') ??
        '';
      if (!containerId || !sectionId || excludedIds.has(containerId)) {
        return null;
      }

      const rect = container.getBoundingClientRect();
      const centerInside =
        draggedCenterX >= rect.left &&
        draggedCenterX <= rect.right &&
        draggedCenterY >= rect.top &&
        draggedCenterY <= rect.bottom;

      return {
        sectionId,
        containerId,
        centerInside,
        area: Math.max(1, rect.width * rect.height),
      };
    })
    .filter(
      (candidate): candidate is { sectionId: string; containerId: string; centerInside: boolean; area: number } =>
        candidate !== null && candidate.centerInside
    )
    .sort((left, right) => left.area - right.area)[0];

  if (bestMatch) {
    return { sectionId: bestMatch.sectionId, containerId: bestMatch.containerId };
  }

  return null;
}

private buildLibraryComponentForSection(
  item: StorefrontEditorAddElementsLibraryItem,
    sectionId: string,
    frameOverride?: StorefrontEditorComponentNode['frame']
  ): StorefrontEditorComponentNode {
    const section = this.sections().find((candidate) => candidate.id === sectionId) ?? null;
    const nextComponent = createStorefrontEditorComponentNode(item.componentType);
    const maxZIndex = section
      ? this.readSectionComponents(section).reduce((max, component) => Math.max(max, component.zIndex ?? 1), 0)
      : 0;
    nextComponent.zIndex = maxZIndex + 1;
    const initialFrame = frameOverride ?? this.getComponentFrame(nextComponent, 'desktop');
    if (frameOverride || this.viewport() !== 'desktop') {
      Object.assign(nextComponent, this.writeComponentFrame(nextComponent, initialFrame));
    }
  return nextComponent;
}

isContainerAttachTarget(sectionId: string, containerId: string): boolean {
  const target = this.componentAttachContainerTarget();
  return (
    !!this.activeComponentDrag &&
    target?.sectionId === sectionId &&
    target.containerId === containerId &&
    this.activeComponentDrag.sourceContainerId !== containerId
  );
}

isSectionAttachTarget(sectionId: string): boolean {
  const attachSectionId = this.componentAttachSectionId();
  return (
    attachSectionId === sectionId &&
    (this.isLibraryComponentDragging() ||
      (!!this.activeComponentDrag && !!this.activeComponentDrag.sourceContainerId))
  );
}

  private getDropFrameFromEvent(
    sectionId: string,
    componentType: StorefrontEditorAddElementsLibraryItem['componentType'],
    event: DragEvent
  ): StorefrontEditorComponentNode['frame'] | undefined {
    return this.getDropFrameFromClientPoint(sectionId, componentType, event.clientX, event.clientY);
  }

  private getDropFrameFromClientPoint(
    sectionId: string,
    componentType: StorefrontEditorAddElementsLibraryItem['componentType'],
    clientX: number,
    clientY: number
  ): StorefrontEditorComponentNode['frame'] | undefined {
    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    if (!(container instanceof HTMLElement)) {
      return undefined;
    }

    const next = createStorefrontEditorComponentNode(componentType);
    const rect = container.getBoundingClientRect();
    const previewVisibleHeight = this.getPreviewVisibleHeightForSection(container);
    const fittedFrame = this.fitDroppedComponentFrameToSection(container, this.getComponentFrame(next));
    const x = clientX - rect.left - fittedFrame.width / 2;
    const y = clientY - rect.top - fittedFrame.height / 2;

    return {
      ...fittedFrame,
      x: Math.max(0, Math.min(x, Math.max(0, rect.width - fittedFrame.width))),
      y: Math.max(0, Math.min(y, Math.max(0, previewVisibleHeight - fittedFrame.height))),
    };
  }

  private fitDroppedComponentFrameToSection(
    container: HTMLElement,
    frame: StorefrontEditorComponentNode['frame']
  ): StorefrontEditorComponentNode['frame'] {
    const rect = container.getBoundingClientRect();
    const inset = 20;
    const maxWidth = Math.max(48, rect.width - inset * 2);
    const scale = Math.min(1, maxWidth / frame.width);

    return {
      ...frame,
      width: Math.max(48, Math.round(frame.width * scale)),
      height: Math.max(
        48,
        Math.round(this.shouldPreserveDroppedHeight(frame) ? frame.height : frame.height * scale)
      ),
    };
  }

  private shouldPreserveDroppedHeight(frame: StorefrontEditorComponentNode['frame']): boolean {
    return frame.height >= 360;
  }

  private getRequiredSectionHeightForComponent(
    sectionId: string,
    component: StorefrontEditorComponentNode
  ): number {
    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    const currentHeight =
      container instanceof HTMLElement
        ? Math.max(container.getBoundingClientRect().height, container.scrollHeight)
        : 0;
    const frame = this.getComponentFrame(component);
    const componentBottom = frame.y + frame.height + 24;

    return Math.max(currentHeight, Math.ceil(componentBottom));
  }

  private resolveSectionLayoutPlacementForComponent(
    sectionId: string,
    component: StorefrontEditorComponentNode,
    clientX?: number,
    clientY?: number
  ): { frame: StorefrontEditorComponentNode['frame']; assignment: StorefrontEditorSectionLayoutAssignment } | null {
    const section = this.sections().find((candidate) => candidate.id === sectionId) ?? null;
    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    if (!section || !this.sectionShowsLayoutControls(section) || !(container instanceof HTMLElement)) {
      return null;
    }

    const rect = container.getBoundingClientRect();
    const cellBounds = this.getSectionLayoutCellBounds(section, rect.width, rect.height);
    if (!cellBounds.length) {
      return null;
    }

    const targetCell =
      typeof clientX === 'number' && typeof clientY === 'number'
        ? this.getSectionLayoutCellAtLocalPoint(cellBounds, clientX - rect.left, clientY - rect.top)
        : this.getNextSectionLayoutInsertionCell(section, cellBounds);
    if (!targetCell) {
      return null;
    }

    return {
      frame: this.getSnappedComponentFrameForLayoutCell(component, targetCell),
      assignment: {
        componentId: component.id,
        column: targetCell.column,
        row: targetCell.row,
      },
    };
  }

  private resolveSectionLayoutAssignmentForFrame(
    sectionId: string,
    componentId: string,
    frame: StorefrontEditorComponentNode['frame']
  ): StorefrontEditorSectionLayoutAssignment | null {
    const section = this.sections().find((candidate) => candidate.id === sectionId) ?? null;
    const dimensions = this.getSectionContentDimensions(sectionId);
    if (!section || !this.sectionShowsLayoutControls(section) || !dimensions) {
      return null;
    }

    const cellBounds = this.getSectionLayoutCellBounds(section, dimensions.width, dimensions.height);
    if (!cellBounds.length) {
      return null;
    }

    const cell = this.getSectionLayoutCellAtLocalPoint(
      cellBounds,
      frame.x + frame.width / 2,
      frame.y + frame.height / 2
    );
    if (!cell) {
      return null;
    }

    return {
      componentId,
      column: cell.column,
      row: cell.row,
    };
  }

  private getPreviewVisibleHeightForSection(container: HTMLElement): number {
    const previewCanvas = container.closest('.storefront-editor__preview-canvas');
    if (!(previewCanvas instanceof HTMLElement)) {
      return container.getBoundingClientRect().height;
    }

    const previewRect = previewCanvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const containerTopWithinPreview = containerRect.top - previewRect.top;
    return Math.max(containerRect.height, previewCanvas.scrollHeight - containerTopWithinPreview);
  }

  private updateAddElementsComponentDrag(event: MouseEvent): void {
    if (!this.activeAddElementsComponentDrag) {
      return;
    }

    const nextLeft = event.clientX - this.activeAddElementsComponentDrag.pointerOffsetX;
    const nextTop = event.clientY - this.activeAddElementsComponentDrag.pointerOffsetY;
    this.draggedAddElementsPreviewPosition.set({
      left: nextLeft,
      top: nextTop,
      width: this.activeAddElementsComponentDrag.width,
      height: this.activeAddElementsComponentDrag.height,
    });

    const hoveredSection = this.getSectionContentElementAtPoint(event.clientX, event.clientY);
    this.componentAttachSectionId.set(hoveredSection?.dataset['sectionContentId'] ?? null);
  }

  private finishAddElementsComponentDrag(event: MouseEvent): void {
    const activeDrag = this.activeAddElementsComponentDrag;
    if (!activeDrag) {
      return;
    }

    const targetContainer = this.getContainerDropTargetAtPoint(event.clientX, event.clientY);
    const targetSection =
      this.componentAttachSectionId() ??
      this.getSectionContentElementAtPoint(event.clientX, event.clientY)?.dataset['sectionContentId'] ??
      null;
    const item = this.addElementsLibraryItems.find((candidate) => candidate.id === activeDrag.itemId) ?? null;

    if (targetSection && item) {
      const nextComponent = this.buildLibraryComponentForSection(item, targetSection);
      if (targetContainer?.sectionId === targetSection) {
        this.appendComponentToContainer(targetSection, targetContainer.containerId, nextComponent);
        this.endAddElementsComponentDrag();
        return;
      }
      const nextFrame =
        this.getDropFrameFromClientPoint(targetSection, item.componentType, event.clientX, event.clientY) ??
        this.getComponentFrame(nextComponent);
      Object.assign(nextComponent, this.writeComponentFrame(nextComponent, nextFrame));
      const layoutAssignment = this.resolveSectionLayoutAssignmentForFrame(
        targetSection,
        nextComponent.id,
        this.getComponentFrame(nextComponent)
      );
      this.insertComponentIntoSection(targetSection, nextComponent, {
        selectedSectionId: targetSection,
        syncRail: true,
        layoutAssignment,
      });
    }

    this.endAddElementsComponentDrag();
  }

  private getSectionContentElementAtPoint(clientX: number, clientY: number): HTMLElement | null {
    const target = document.elementFromPoint(clientX, clientY);
    return target instanceof HTMLElement
      ? (target.closest('.storefront-editor__preview-section-content') as HTMLElement | null)
      : null;
  }

  private getSectionContentElementForDraggedBounds(
    draggedRect: { left: number; top: number; width: number; height: number },
    fallbackSectionId: string
  ): HTMLElement | null {
    const containers = Array.from(
      document.querySelectorAll('.storefront-editor__preview-section-content[data-section-content-id]')
    ).filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (!containers.length) {
      return null;
    }

    const draggedRight = draggedRect.left + draggedRect.width;
    const draggedBottom = draggedRect.top + draggedRect.height;
    const draggedArea = Math.max(1, draggedRect.width * draggedRect.height);
    const draggedCenterX = draggedRect.left + draggedRect.width / 2;
    const draggedCenterY = draggedRect.top + draggedRect.height / 2;

    const bestMatch = containers
      .map((container) => {
        const rect = container.getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(draggedRight, rect.right) - Math.max(draggedRect.left, rect.left));
        const overlapHeight = Math.max(0, Math.min(draggedBottom, rect.bottom) - Math.max(draggedRect.top, rect.top));
        const overlapArea = overlapWidth * overlapHeight;
        const overlapRatio = overlapArea / draggedArea;
        const centerInside =
          draggedCenterX >= rect.left &&
          draggedCenterX <= rect.right &&
          draggedCenterY >= rect.top &&
          draggedCenterY <= rect.bottom;

        return { container, centerInside, overlapRatio };
      })
      .filter((candidate) => candidate.centerInside || candidate.overlapRatio >= 0.5)
      .sort((left, right) => {
        if (left.centerInside !== right.centerInside) {
          return left.centerInside ? -1 : 1;
        }
        return right.overlapRatio - left.overlapRatio;
      })[0];

    if (bestMatch) {
      return bestMatch.container;
    }

    return (
      containers.find((container) => container.dataset['sectionContentId'] === fallbackSectionId) ??
      null
    );
  }

  private moveDraggedComponentsToSection(sourceSectionId: string, targetSectionId: string): void {
    if (!this.activeComponentDrag || sourceSectionId === targetSectionId) {
      return;
    }

    const draggedIds = new Set(this.activeComponentDrag.components.map((component) => component.componentId));

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: (() => {
          const sourceSection = storefront.draftHomepage.sections.find((section) => section.id === sourceSectionId);
          const targetSection = storefront.draftHomepage.sections.find((section) => section.id === targetSectionId);
          if (!sourceSection || !targetSection) {
            return storefront.draftHomepage.sections;
          }

          const sourceComponents = this.readSectionComponents(sourceSection);
          const movedComponents = sourceComponents.filter((component) => draggedIds.has(component.id));
          const targetComponents = this.readSectionComponents(targetSection);
          const baseZIndex = targetComponents.reduce((max, component) => Math.max(max, component.zIndex ?? 1), 0);
          const movedWithZ = movedComponents.map((component, index) => ({
            ...component,
            zIndex: baseZIndex + index + 1,
          }));

          return storefront.draftHomepage.sections.map((section) => {
          if (section.id === sourceSectionId) {
            return this.writeSectionLayoutAssignments(
              this.writeSectionComponents(
                section,
                sourceComponents.filter((component) => !draggedIds.has(component.id))
              ),
              this.readSectionLayoutAssignments(section).filter((assignment) => !draggedIds.has(assignment.componentId))
            );
          }

          if (section.id === targetSectionId) {
            return this.writeSectionLayoutAssignments(
              this.writeSectionComponents(section, [...targetComponents, ...movedWithZ]),
              this.readSectionLayoutAssignments(section).filter((assignment) => !draggedIds.has(assignment.componentId))
            );
          }

          return section;
          });
        })(),
      },
  }), { selectedSectionId: targetSectionId, syncRail: true, transient: true });

    this.selectedSectionId.set(targetSectionId);
    setTimeout(() => {
      const targetShell = document.querySelector(
        `.storefront-editor__preview-section-shell[data-section-id="${targetSectionId}"]`
      ) as HTMLElement | null;
      this.syncSelectedSectionRailPosition(targetShell);
    }, 0);
  }

  private updateResizingSection(event: MouseEvent): void {
    if (!this.activeSectionResize) {
      return;
    }

    const minHeight = this.getMinimumSectionResizeHeight(this.activeSectionResize.sectionId);
    const nextHeight = Math.max(
      minHeight,
      Math.round(this.activeSectionResize.startHeight + (event.clientY - this.activeSectionResize.startY))
    );
    const dimensions = this.getSectionContentDimensions(this.activeSectionResize.sectionId);
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) =>
          section.id === this.activeSectionResize!.sectionId
            ? (() => {
                let nextSection: StorefrontHomepageSection = {
                  ...section,
                  props: {
                    ...section.props,
                    [this.getSectionHeightPropKey()]: nextHeight,
                  },
                };
                if (dimensions) {
                  nextSection = this.applyLayoutAssignmentsToSectionGeometry(nextSection, dimensions.width, nextHeight);
                }
                return nextSection;
              })()
            : section
        ),
      },
    }), { selectedSectionId: this.activeSectionResize.sectionId, syncRail: true });
  }

  private updateSectionLayoutResize(event: MouseEvent): void {
    if (!this.activeSectionLayoutResize) {
      return;
    }

    const state = this.activeSectionLayoutResize;
    const deltaPx = state.axis === 'column'
      ? event.clientX - state.startClientX
      : event.clientY - state.startClientY;
    const deltaPercent = (deltaPx / Math.max(1, state.availableSize)) * 100;
    const nextSizes = [...state.startSizes];
    const minimumTrackPercent = (72 / Math.max(1, state.availableSize)) * 100;
    const leftIndex = state.separatorIndex;
    const rightIndex = state.separatorIndex + 1;
    const minimumLeftDelta = minimumTrackPercent - state.startSizes[leftIndex];
    const maximumLeftDelta = state.startSizes[rightIndex] - minimumTrackPercent;
    const clampedDelta = this.clamp(deltaPercent, minimumLeftDelta, maximumLeftDelta);

    nextSizes[leftIndex] = state.startSizes[leftIndex] + clampedDelta;
    nextSizes[rightIndex] = state.startSizes[rightIndex] - clampedDelta;

    this.updateSectionLayoutStructure(state.sectionId, (section) => ({
      ...section,
      props: {
        ...section.props,
        [state.axis === 'column'
          ? ProjectStorefrontEditor.SECTION_LAYOUT_COLUMN_SIZES_PROP_KEY
          : ProjectStorefrontEditor.SECTION_LAYOUT_ROW_SIZES_PROP_KEY]: nextSizes,
      },
    }), { syncRail: false });
  }

  private finalizeDraggedComponentsLayoutSnap(): void {
    if (!this.activeComponentDrag) {
      return;
    }

    const section = this.sections().find((item) => item.id === this.activeComponentDrag?.sectionId) ?? null;
    if (!section || !this.sectionShowsLayoutControls(section)) {
      return;
    }

    const dimensions = this.getSectionContentDimensions(section.id);
    if (!dimensions) {
      return;
    }

    const draggedIds = new Set(this.activeComponentDrag.components.map((component) => component.componentId));
    const components = this.readSectionComponents(section);
    const cellBounds = this.getSectionLayoutCellBounds(section, dimensions.width, dimensions.height);
    if (!cellBounds.length) {
      return;
    }

    const nextAssignments: StorefrontEditorSectionLayoutAssignment[] = [];
    const nextComponents = components.map((component) => {
      if (!draggedIds.has(component.id)) {
        return component;
      }

      const cell = this.getSectionLayoutCellAtLocalPoint(
        cellBounds,
        this.getComponentFrame(component).x + this.getComponentFrame(component).width / 2,
        this.getComponentFrame(component).y + this.getComponentFrame(component).height / 2
      );
      if (!cell) {
        return component;
      }

      nextAssignments.push({
        componentId: component.id,
        column: cell.column,
        row: cell.row,
      });

      return component;
    });

    if (!nextAssignments.length) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((currentSection) => {
          if (currentSection.id !== section.id) {
            return currentSection;
          }

          const existingAssignments = this.readSectionLayoutAssignments(currentSection).filter(
            (assignment) => !draggedIds.has(assignment.componentId)
          );
          return this.writeSectionLayoutAssignments(
            this.writeSectionComponents(currentSection, nextComponents),
            [...existingAssignments, ...nextAssignments]
          );
        }),
      },
    }), { selectedSectionId: section.id, syncRail: false, transient: true });
  }

  private createDefaultEditorSession(): StorefrontEditorSession {
    const defaultHomepage = this.buildDefaultHomepageDocument('Storefront');
    return {
      selectedSectionId: null,
      viewport: 'desktop',
      zoomPercent: 120,
      undoStack: [],
      redoStack: [],
      managedPages: this.buildDefaultManagedPages(defaultHomepage),
      selectedManagedPageId: 'home',
    };
  }

  private normalizeEditorSession(
    session: StorefrontEditorSession | null | undefined,
    homeDraftDocument?: StorefrontHomepageDocument | null
  ): StorefrontEditorSession {
    const fallbackHomeDraftDocument =
      homeDraftDocument ?? this.workingStorefront()?.draftHomepage ?? this.storefront()?.draftHomepage ?? null;
    const managedPages = this.normalizeManagedPages(session?.managedPages, fallbackHomeDraftDocument);
    return {
      selectedSectionId: null,
      viewport:
        session?.viewport === 'mobile' || session?.viewport === 'tablet'
          ? session.viewport
          : 'desktop',
      zoomPercent: this.clampZoom(session?.zoomPercent),
      undoStack: [],
      redoStack: [],
      managedPages,
      selectedManagedPageId:
        session?.selectedManagedPageId && managedPages.some((page) => page.id === session.selectedManagedPageId)
          ? session.selectedManagedPageId
          : 'home',
    };
  }

  private buildPersistedEditorSession(): StorefrontEditorSession {
    const managedPages = this.captureManagedPagesWithCurrentDraft();
    return {
      selectedSectionId: null,
      viewport: this.viewport(),
      zoomPercent: this.clampZoom(this.zoomPercent()),
      undoStack: [],
      redoStack: [],
      managedPages,
      selectedManagedPageId: this.selectedManagedPageId(),
    };
  }

  private createEditorSnapshot(
    storefront: ProjectStorefront,
    selectedSectionId: string | null
  ): StorefrontEditorSnapshot {
    const selectedManagedPageId = this.selectedManagedPageId();
    const managedPages = this.captureManagedPagesWithDraft(storefront, selectedManagedPageId);
    return {
      storeName: storefront.storeName,
      themeKey: storefront.themeKey,
      activePageKey: storefront.activePageKey,
      draftHomepage: JSON.parse(JSON.stringify(this.resolveManagedPageDocument(selectedManagedPageId, storefront, managedPages))) as ProjectStorefront['draftHomepage'],
      selectedSectionId,
      managedPages: JSON.parse(JSON.stringify(managedPages)) as StorefrontEditorManagedPage[],
      selectedManagedPageId,
    };
  }

  private applyEditorSnapshot(snapshot: StorefrontEditorSnapshot): void {
    const storefront = this.workingStorefront();
    if (!storefront) {
      return;
    }

    this.workingStorefront.set({
      ...storefront,
      storeName: snapshot.storeName,
      themeKey: snapshot.themeKey,
      activePageKey: snapshot.activePageKey,
      draftHomepage: JSON.parse(JSON.stringify(snapshot.draftHomepage)) as ProjectStorefront['draftHomepage'],
    });
      this.selectedSectionId.set(snapshot.selectedSectionId);
      this.selectedComponentId.set(null);
      this.selectedComponentIds.set([]);
      this.isolatedGroupComponentId.set(null);
      this.syncEditorSessionState(
        {
          selectedSectionId: snapshot.selectedSectionId,
          managedPages: this.normalizeManagedPages(snapshot.managedPages),
          selectedManagedPageId: snapshot.selectedManagedPageId ?? 'home',
        },
        false
      );
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  private pushUndoSnapshot(snapshot: StorefrontEditorSnapshot): void {
    this.undoStack.update((stack) => [...stack, snapshot].slice(-ProjectStorefrontEditor.HISTORY_LIMIT));
    this.redoStack.set([]);
  }

  private applyStorefrontMutation(
    mutator: (storefront: ProjectStorefront) => ProjectStorefront,
    options: { selectedSectionId?: string | null; syncRail?: boolean; transient?: boolean; preview?: boolean } = {}
  ): void {
    const current = this.workingStorefront();
    if (!current) {
      return;
    }

    if (options.preview) {
      const next = mutator(this.cloneStorefront(current));
      this.workingStorefront.set(next);
      if (options.selectedSectionId !== undefined) {
        this.selectedSectionId.set(options.selectedSectionId);
      }
      this.syncEditorSessionState({ selectedSectionId: this.selectedSectionId() }, false);

      if (options.syncRail) {
        setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
      }
      return;
    }

    const beforeSnapshot = this.createEditorSnapshot(current, this.selectedSectionId());
    const next = mutator(this.cloneStorefront(current));
    const nextSelectedSectionId =
      options.selectedSectionId !== undefined ? options.selectedSectionId : this.selectedSectionId();

    if (
      JSON.stringify(this.createEditorSnapshot(next, nextSelectedSectionId)) ===
      JSON.stringify(beforeSnapshot)
    ) {
      return;
    }

    if (!options.transient) {
      this.pushUndoSnapshot(beforeSnapshot);
    }
    this.workingStorefront.set(next);
    if (options.selectedSectionId !== undefined) {
      this.selectedSectionId.set(options.selectedSectionId);
    }
    this.syncEditorSessionState({ selectedSectionId: this.selectedSectionId() }, false);
    this.scheduleAutosave();

    if (options.syncRail) {
      setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
    }
  }

  private syncEditorSessionState(
    patch: Partial<
      Pick<
        StorefrontEditorSession,
        'selectedSectionId' | 'viewport' | 'zoomPercent' | 'managedPages' | 'selectedManagedPageId'
      >
    >,
    scheduleAutosave = true
  ): void {
    this.editorSession.update((session) => ({
      ...session,
      ...patch,
    }));

    if (scheduleAutosave) {
      this.scheduleAutosave();
    }
  }

  private scheduleAutosave(): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = setTimeout(() => {
      this.persistCurrentState({ reconcileEditor: false }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: () => this.toastService.error('Autosave failed.'),
      });
    }, ProjectStorefrontEditor.AUTOSAVE_DELAY_MS);
  }

  private persistCurrentState(options: { reconcileEditor: boolean }) {
    const storefront = this.workingStorefront();
    const projectId = this.projectId();
    if (!storefront || !projectId) {
      return of(null);
    }

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
    }

    this.isAutosaving.set(true);
    const managedPages = this.captureManagedPagesWithCurrentDraft();
    const persistedDraftHomepage = this.resolveManagedPageDocument('home', storefront, managedPages);
    return this.projectStorefrontService
      .updateStorefront(projectId, {
        storeName: storefront.storeName,
        themeKey: storefront.themeKey,
        activePageKey: storefront.activePageKey,
        draftHomepage: persistedDraftHomepage,
        editorSession: {
          ...this.buildPersistedEditorSession(),
          managedPages,
        },
      })
      .pipe(
        finalize(() => this.isAutosaving.set(false)),
        switchMap((savedStorefront) => {
          if (!savedStorefront) {
            return of(savedStorefront);
          }

          const snapshot = this.normalizeStorefront(savedStorefront);
          if (options.reconcileEditor) {
            this.applyPersistedStorefront(snapshot, { resetHistory: false });
          } else {
            this.storefront.set(snapshot);
          }
          return of(snapshot);
        })
      );
  }

  private applyPersistedStorefront(
    snapshot: ProjectStorefront,
    options: { resetHistory: boolean }
  ): void {
    this.storefront.set(snapshot);
    this.workingStorefront.set(this.cloneStorefront(snapshot));
    const editorSession = this.normalizeEditorSession(snapshot.editorSession, snapshot.draftHomepage);
    this.editorSession.set(editorSession);
    this.loadSelectedManagedPageIntoWorkingStorefront(editorSession.selectedManagedPageId ?? 'home', editorSession.managedPages ?? []);
      this.selectedSectionId.set(editorSession.selectedSectionId);
      this.selectedComponentId.set(null);
      this.selectedComponentIds.set([]);
      this.isolatedGroupComponentId.set(null);
      this.viewport.set(editorSession.viewport);
    this.zoomPercent.set(editorSession.zoomPercent);
    if (options.resetHistory) {
      this.undoStack.set([]);
      this.redoStack.set([]);
    }
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  private serializePersistedState(
    storefront: ProjectStorefront,
    editorSession: StorefrontEditorSession
  ): string {
    const managedPages = this.normalizeManagedPages(editorSession.managedPages, storefront.draftHomepage).map((page) =>
      page.id === editorSession.selectedManagedPageId
        ? {
            ...page,
            draftDocument: this.cloneHomepageDocument(storefront.draftHomepage),
          }
        : page
    );
    return JSON.stringify({
      storeName: storefront.storeName,
      themeKey: storefront.themeKey,
      activePageKey: storefront.activePageKey,
      draftHomepage: this.resolveManagedPageDocument('home', storefront, managedPages),
      editorSession: {
        selectedSectionId: editorSession.selectedSectionId,
        viewport: editorSession.viewport,
        zoomPercent: this.clampZoom(editorSession.zoomPercent),
        managedPages,
        selectedManagedPageId: editorSession.selectedManagedPageId,
      },
    });
  }

  private buildDefaultManagedPages(homeDraftDocument?: StorefrontHomepageDocument): StorefrontEditorManagedPage[] {
    return buildDefaultManagedPagesForEditor(homeDraftDocument, (storeName) =>
      this.buildDefaultHomepageDocument(storeName)
    );
  }

  private normalizeManagedPages(
    pages: StorefrontEditorSession['managedPages'] | StorefrontEditorSnapshot['managedPages'],
    homeDraftDocument?: StorefrontHomepageDocument | null
  ): StorefrontEditorManagedPage[] {
    return normalizeManagedPagesForEditor(pages, homeDraftDocument, {
      fallbackStoreName: this.resolveStorefrontFallbackName(),
      buildDefaultHomepageDocument: (storeName) => this.buildDefaultHomepageDocument(storeName),
      normalizeSection: (section, storeName) => this.normalizeSection(section, storeName),
    });
  }

  private cloneHomepageDocument(document: StorefrontHomepageDocument): StorefrontHomepageDocument {
    return cloneStorefrontHomepageDocument(document);
  }

  private resolveStorefrontFallbackName(): string {
    return (
      this.workingStorefront()?.storeName?.trim() ||
      this.storefront()?.storeName?.trim() ||
      this.project()?.storeTitle?.trim() ||
      this.project()?.name?.trim() ||
      'Storefront'
    );
  }

  private buildDefaultManagedPageDocument(
    pageName: string,
    kind: StorefrontEditorManagedPage['kind'],
    designId: string | null
  ): StorefrontHomepageDocument {
    return buildDefaultManagedPageDocumentForEditor(pageName, kind, designId, {
      fallbackStoreName: this.resolveStorefrontFallbackName(),
      buildDefaultHomepageDocument: (storeName) => this.buildDefaultHomepageDocument(storeName),
      normalizeSection: (section, storeName) => this.normalizeSection(section, storeName),
    });
  }

  private normalizeManagedPageDocument(
    document: unknown,
    pageName: string,
    kind: StorefrontEditorManagedPage['kind'],
    designId: string | null
  ): StorefrontHomepageDocument {
    return normalizeManagedPageDocumentForEditor(document, pageName, kind, designId, {
      fallbackStoreName: this.resolveStorefrontFallbackName(),
      buildDefaultHomepageDocument: (storeName) => this.buildDefaultHomepageDocument(storeName),
      normalizeSection: (section, storeName) => this.normalizeSection(section, storeName),
    });
  }

  private captureManagedPagesWithCurrentDraft(): StorefrontEditorManagedPage[] {
    const storefront = this.workingStorefront();
    return storefront ? this.captureManagedPagesWithDraft(storefront, this.selectedManagedPageId()) : this.normalizeManagedPages(this.managedPages());
  }

  private captureManagedPagesWithDraft(
    storefront: ProjectStorefront,
    selectedManagedPageId: string
  ): StorefrontEditorManagedPage[] {
    return captureManagedPagesWithDraftForEditor(
      storefront,
      selectedManagedPageId,
      this.managedPages(),
      {
        fallbackStoreName: this.resolveStorefrontFallbackName(),
        buildDefaultHomepageDocument: (storeName) => this.buildDefaultHomepageDocument(storeName),
        normalizeSection: (section, storeName) => this.normalizeSection(section, storeName),
      }
    );
  }

  private resolveManagedPageDocument(
    pageId: string,
    storefront: ProjectStorefront,
    managedPages: StorefrontEditorManagedPage[]
  ): StorefrontHomepageDocument {
    return resolveManagedPageDocumentForEditor(pageId, storefront, managedPages, {
      fallbackStoreName: this.resolveStorefrontFallbackName(),
      buildDefaultHomepageDocument: (storeName) => this.buildDefaultHomepageDocument(storeName),
      normalizeSection: (section, storeName) => this.normalizeSection(section, storeName),
    });
  }

  private updateEditorSessionPages(pages: StorefrontEditorManagedPage[], selectedManagedPageId: string): void {
    this.syncEditorSessionState(
      {
        managedPages: this.normalizeManagedPages(pages),
        selectedManagedPageId,
      },
      true
    );
  }

  private scrollPagesPanelToActivePage(): void {
    const panel = document.querySelector('.storefront-editor__pages-panel .storefront-editor__pages-section');
    const activeId = this.selectedManagedPageId();
    if (!(panel instanceof HTMLElement) || !activeId) {
      return;
    }

    const activeCard = panel.querySelector(`[data-managed-page-id="${activeId}"]`);
    if (!(activeCard instanceof HTMLElement)) {
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    const nextScrollTop =
      activeCard.offsetTop - panel.clientHeight / 2 + activeCard.offsetHeight / 2;

    if (cardRect.top < panelRect.top || cardRect.bottom > panelRect.bottom) {
      panel.scrollTo({
        top: Math.max(0, nextScrollTop),
        behavior: 'smooth',
      });
    }
  }

  private switchManagedPage(pageId: string, pages: StorefrontEditorManagedPage[] = this.captureManagedPagesWithCurrentDraft()): void {
    const storefront = this.workingStorefront();
    if (!storefront) {
      this.updateEditorSessionPages(pages, pageId);
      return;
    }

    const normalizedPages = this.normalizeManagedPages(pages, storefront.draftHomepage);
    const nextPage = normalizedPages.find((page) => page.id === pageId);
    if (!nextPage) {
      return;
    }

    const nextDocument = this.cloneHomepageDocument(
      nextPage.draftDocument ?? this.buildDefaultManagedPageDocument(nextPage.name, nextPage.kind, nextPage.designId)
    );

    this.workingStorefront.set({
      ...this.cloneStorefront(storefront),
      draftHomepage: nextDocument,
    });

    this.selectedSectionId.set(null);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.syncEditorSessionState(
      {
        selectedSectionId: null,
        managedPages: normalizedPages,
        selectedManagedPageId: pageId,
      },
      false
    );
    this.scheduleAutosave();
  }

  private loadSelectedManagedPageIntoWorkingStorefront(
    selectedManagedPageId: string,
    managedPages: StorefrontEditorManagedPage[]
  ): void {
    const storefront = this.workingStorefront();
    if (!storefront) {
      return;
    }

    const nextDocument = this.resolveManagedPageDocument(selectedManagedPageId, storefront, managedPages);
    this.workingStorefront.set({
      ...storefront,
      draftHomepage: nextDocument,
    });
  }

  private createManagedPage(config: {
    kind: 'blank' | 'designed';
    name: string;
    designId: string | null;
    draftDocument?: StorefrontHomepageDocument | null;
  }): void {
    const pageName = this.createUniquePageName(config.name);
    const nextPage: StorefrontEditorManagedPage = {
      id: `page-${Date.now()}`,
      name: pageName,
      kind: config.kind,
      designId: config.designId,
      draftDocument: this.cloneHomepageDocument(
        config.draftDocument ?? this.buildDefaultManagedPageDocument(pageName, config.kind, config.designId)
      ),
    };

  this.switchManagedPage(nextPage.id, [...this.captureManagedPagesWithCurrentDraft(), nextPage]);
  this.isAddPageMenuOpen.set(false);
  this.isPageDesignPickerOpen.set(false);
  this.isPageDesignPickerClosing.set(false);
}

  private createUniquePageName(baseName: string, ignorePageId: string | null = null): string {
    return createUniqueManagedPageName(baseName, this.managedPages(), ignorePageId);
  }

  private clampZoom(zoomPercent: number | null | undefined): number {
    return clampStorefrontEditorZoom(zoomPercent);
  }

  private updatePreviewStageScrollbarState(): void {
    const stage = document.querySelector('.storefront-editor__preview-stage') as HTMLElement | null;
    if (!stage) {
      this.hasPreviewStageScrollbar.set(false);
      this.previewStageScrollbarWidth.set(0);
      return;
    }

    const hasScrollbar = stage.scrollHeight > stage.clientHeight + 1;
    this.hasPreviewStageScrollbar.set(hasScrollbar);
    this.previewStageScrollbarWidth.set(hasScrollbar ? Math.max(0, stage.offsetWidth - stage.clientWidth) : 0);
  }

  private buildMediaManagerAssets(
    projectMedia: Array<{
      id: number;
      fileName: string;
      fileUrl: string;
      type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
      fileSize: number;
      uploadedAt: string;
    }>,
    catalogProducts: ProjectCatalogProduct[]
  ): StorefrontMediaManagerAsset[] {
    return buildStorefrontMediaManagerAssets(
      projectMedia,
      catalogProducts,
      (fileSize) => this.uploadService.formatFileSize(fileSize)
    );
  }

  private describeMediaAsset(type: 'IMAGE' | 'VIDEO' | 'DOCUMENT', fileSize: number): string {
    return describeStorefrontMediaAsset(type, fileSize, (size) => this.uploadService.formatFileSize(size));
  }

  private normalizeStorefront(storefront: ProjectStorefront): ProjectStorefront {
    return normalizeStorefrontData(storefront, {
      fallbackStoreName:
        storefront.storeName?.trim() ||
        this.project()?.storeTitle?.trim() ||
        this.project()?.name?.trim() ||
        'Storefront',
      normalizeEditorSession: (session, homeDraftDocument) =>
        this.normalizeEditorSession(session, homeDraftDocument),
    });
  }

  private buildDefaultHomepageDocument(storeName: string): ProjectStorefront['draftHomepage'] {
    return buildDefaultStorefrontHomepageDocument(storeName, (type, name) => this.buildSection(type, name));
  }

  private normalizeSection(
    section: Partial<StorefrontHomepageSection> | null | undefined,
    storeName: string
  ): StorefrontHomepageSection {
    return normalizeStorefrontSection(
      section,
      storeName,
      (type, name) => this.buildSection(type, name),
      (type) => this.normalizeSectionType(type),
      (type) => this.createSectionId(type)
    );
  }

  private normalizeSectionType(type: unknown): StorefrontSectionType {
    return normalizeStorefrontSectionType(type);
  }

  private buildSection(type: StorefrontSectionType, storeName: string): StorefrontHomepageSection {
    return buildStorefrontSection(type, storeName, (sectionType) => this.createSectionId(sectionType));
  }

private createSection(type: StorefrontSectionType, props?: Record<string, unknown>): StorefrontHomepageSection {
  const section = this.buildSection(type, this.storeName());
  if (!props) {
    return section;
  }

  return {
    ...section,
    props: {
      ...section.props,
      ...props,
    },
  };
}

  private createSectionId(type: StorefrontSectionType): string {
    return createStorefrontSectionId(type);
  }

  private formatRelativeTime(value: string | null | undefined): string | null {
    return formatStorefrontEditorRelativeTime(value);
  }

private getSectionLibraryTabsElement(): HTMLElement | null {
  return document.querySelector('.storefront-editor__section-library-tabs');
}

private getPageDesignTabsElement(): HTMLElement | null {
  return document.querySelector('.storefront-editor__page-design-tabs');
}

private getAddElementsTabsElement(): HTMLElement | null {
  return document.querySelector('.storefront-editor__add-elements-tabs-scroll');
}

private getAddElementsSubmenuElement(): HTMLElement | null {
  return document.querySelector('.storefront-editor__add-elements-submenu-scroll');
}

private getAddElementsSubcategories(
  category: StorefrontEditorAddElementsCategory
): readonly StorefrontEditorAddElementsSubcategoryOption[] {
  if (category === 'All') {
    return [];
  }

  return this.addElementsSubcategories[category] ?? [];
}

private getDefaultAddElementsSubcategory(category: StorefrontEditorAddElementsCategory): string {
  return this.getAddElementsSubcategories(category)[0]?.id ?? 'all';
}
}
