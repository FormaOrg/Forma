import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BuilderElement {
  id: string;
  type: string;
  name: string;
  icon: string;
  description: string;
  content?: string;
  styles?: any;
}

interface DroppedElement extends BuilderElement {
  position: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  customName?: string; // User-assigned label (defaults to "Untitled")
  groupId?: string; // For grouping elements
  // Text & Container styling
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  display?: 'block' | 'flex' | 'grid';
  gap?: number;
  flexDirection?: 'row' | 'column';
  gridColumns?: number;
  gridRows?: number;
  padding?: number;
  backgroundColor?: string;
  borderRadius?: number; // Uniform border radius for all corners
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
  customBorderRadius?: boolean; // Toggle for individual corner control
  rotation?: number; // Rotation in degrees (0-360)
}

interface ElementGroup {
  id: string;
  elementIds: string[];
  name: string;
}

@Component({
  selector: 'app-root',
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  Math = Math;
  // Available elements to drag
  availableElements: BuilderElement[] = [
    {
      id: 'heading',
      type: 'heading',
      name: 'Heading',
      icon: '📝',
      description: 'H1-H6 headings'
    },
    {
      id: 'text',
      type: 'text',
      name: 'Text Block',
      icon: '📄',
      description: 'Paragraph text'
    },
    {
      id: 'button',
      type: 'button',
      name: 'Button',
      icon: '🔘',
      description: 'Call-to-action button'
    },
    {
      id: 'image',
      type: 'image',
      name: 'Image',
      icon: '🖼️',
      description: 'Image placeholder'
    },
    {
      id: 'container',
      type: 'container',
      name: 'Container',
      icon: '📦',
      description: 'Section container'
    },
    {
      id: 'navbar',
      type: 'navbar',
      name: 'Navigation Bar',
      icon: '🧭',
      description: 'Top navigation'
    },
    {
      id: 'hero',
      type: 'hero',
      name: 'Hero Section',
      icon: '🎯',
      description: 'Large hero banner'
    },
    {
      id: 'card',
      type: 'card',
      name: 'Card',
      icon: '🎴',
      description: 'Content card'
    },
    {
      id: 'form',
      type: 'form',
      name: 'Form',
      icon: '📋',
      description: 'Input form'
    },
    {
      id: 'grid',
      type: 'grid',
      name: 'Grid Layout',
      icon: '⚡',
      description: '2-4 column grid'
    }
  ];

  // Elements dropped on canvas
  canvasElements: DroppedElement[] = [];

  // Track dragging state
  isDragging = false;
  selectedElement: DroppedElement | null = null;
  selectedElements: DroppedElement[] = []; // Multi-select for grouping
  
  // Groups
  groups: ElementGroup[] = [];
  
  // Track element dragging on canvas
  isDraggingElement = false;
  draggedElement: DroppedElement | null = null;
  dragOffset = { x: 0, y: 0 };
  initialDraggedElementPos = { x: 0, y: 0 };
  initialSelectedPositions: Map<string, { x: number; y: number }> = new Map();

  // Auto-scroll during drag
  autoScrollInterval: any = null;
  autoScrollSpeed = 0;
  isAutoScrollingDown = false;

  // Context menu
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuElement: DroppedElement | null = null;

  // Clipboard for copy/paste
  clipboard: DroppedElement | null = null;

  // Undo/Redo system
  history: DroppedElement[][] = [];
  historyIndex: number = -1;
  maxHistorySize: number = 50;

  // Resize
  isResizing = false;
  resizeHandle: string = '';
  resizeStartSize = { width: 0, height: 0 };
  resizeStartPos = { x: 0, y: 0 };
  resizeStartElementPos = { x: 0, y: 0 };

  // Rotation
  isRotating = false;
  rotationStartAngle = 0;
  rotationStartRotation = 0;
  rotationPreviousAngle = 0;
  rotationAccumulatedAngle = 0;

  // Selection Box for multi-select
  isSelecting = false;
  justFinishedSelecting = false;
  selectionStartPos = { x: 0, y: 0 };
  selectionBox = { x: 0, y: 0, width: 0, height: 0 };

  // Preview mode
  isPreviewMode = false;

  // Canvas dimensions
  canvasWidth = 1200;
  canvasHeight = 800;

  // Zoom (Simple toggle: 50% or 100%)
  zoom: number = 1; // 1 = 100%, 0.5 = 50%


  // Text editing
  isEditingText = false;
  editingElement: DroppedElement | null = null;
  editingText: string = '';

  // Element name editing
  isEditingName = false;
  editingNameElement: DroppedElement | null = null;
  editingNameValue: string = '';

  // Properties panel
  showPropertiesPanel = false;
  propertiesPanelPosition = { x: 0, y: 0 };
  propertiesPanelOnLeft = false;

  // Available fonts
  availableFonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
    'Palatino'
  ];
  
  // Font size presets
  fontSizePresets = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96];


  constructor() {
    // Close context menu on click outside
    document.addEventListener('click', () => {
      this.contextMenuVisible = false;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event);
    });
  }

  // Handle keyboard shortcuts
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Don't trigger shortcuts if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const ctrl = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd (Mac)

    // Ctrl+Z - Undo
    if (ctrl && !event.shiftKey && event.key === 'z') {
      event.preventDefault();
      this.undo();
      return;
    }

    // Ctrl+Shift+Z or Ctrl+Y - Redo
    if ((ctrl && event.shiftKey && event.key === 'z') || (ctrl && event.key === 'y')) {
      event.preventDefault();
      this.redo();
      return;
    }

    // Ctrl+C - Copy
    if (ctrl && event.key === 'c') {
      if (this.selectedElement) {
        event.preventDefault();
        this.clipboard = { ...this.selectedElement };
      }
    }

    // Ctrl+V - Paste
    if (ctrl && event.key === 'v') {
      if (this.clipboard) {
        event.preventDefault();
        const elWidth  = this.clipboard.size?.width  || 200;
        const elHeight = this.clipboard.size?.height || 100;
        let newX = this.clipboard.position.x + 20;
        let newY = this.clipboard.position.y + 20;
        newX = Math.min(newX, this.canvasWidth - elWidth);
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        const newElement: DroppedElement = {
          ...this.clipboard,
          id: `${this.clipboard.type}-${Date.now()}`,
          position: { x: newX, y: newY },
          zIndex: Math.max(...this.canvasElements.map(el => el.zIndex || 0), -1) + 1
        };
        this.canvasElements.push(newElement);
        this.selectedElement = newElement;
        this.saveToHistory();
      }
    }

    // Ctrl+D - Duplicate
    if (ctrl && event.key === 'd') {
      if (this.selectedElement) {
        event.preventDefault();
        const elWidth  = this.selectedElement.size?.width  || 200;
        const elHeight = this.selectedElement.size?.height || 100;
        let newX = this.selectedElement.position.x + 20;
        let newY = this.selectedElement.position.y + 20;
        newX = Math.min(newX, this.canvasWidth - elWidth);
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        const newElement: DroppedElement = {
          ...this.selectedElement,
          id: `${this.selectedElement.type}-${Date.now()}`,
          position: { x: newX, y: newY },
          zIndex: Math.max(...this.canvasElements.map(el => el.zIndex || 0), -1) + 1
        };
        this.canvasElements.push(newElement);
        this.selectedElement = newElement;
        this.saveToHistory();
      }
    }

    // Ctrl+G - Group selected elements
    if (ctrl && event.key === 'g') {
      if (this.selectedElements.length > 1) {
        event.preventDefault();
        this.createGroup();
      }
    }

    // Ctrl+Shift+G - Ungroup
    if (ctrl && event.shiftKey && event.key === 'G') {
      if (this.selectedElement && this.selectedElement.groupId) {
        event.preventDefault();
        this.ungroupElement(this.selectedElement);
      }
    }

    // Delete or Backspace - Delete element
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedElements.length > 1) {
        event.preventDefault();
        this.deleteSelectedElements();
      } else if (this.selectedElement) {
        event.preventDefault();
        this.deleteElement(this.selectedElement);
      }
    }

    // Arrow keys - Move selected element(s)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      if (this.selectedElement) {
        event.preventDefault();
        
        const moveDistance = event.shiftKey ? 10 : 1; // Shift = 10px, normal = 1px
        let deltaX = 0;
        let deltaY = 0;
        
        switch(event.key) {
          case 'ArrowUp':    deltaY = -moveDistance; break;
          case 'ArrowDown':  deltaY = moveDistance; break;
          case 'ArrowLeft':  deltaX = -moveDistance; break;
          case 'ArrowRight': deltaX = moveDistance; break;
        }
        
        // Move all selected elements or grouped elements
        const elementsToMove: DroppedElement[] = [];
        
        if (this.selectedElement.groupId) {
          // If grouped, move all group members
          elementsToMove.push(...this.canvasElements.filter(el => el.groupId === this.selectedElement!.groupId));
        } else if (this.selectedElements.length > 1) {
          // If multi-selected, move all selected elements
          elementsToMove.push(...this.selectedElements);
        } else {
          // Single element
          elementsToMove.push(this.selectedElement);
        }
        
        // Calculate boundaries for all elements being moved
        let minX = Infinity, maxX = -Infinity, minY = Infinity;
        
        elementsToMove.forEach(el => {
          const newX = el.position.x + deltaX;
          const newY = el.position.y + deltaY;
          const elWidth = el.size?.width || 0;
          
          minX = Math.min(minX, newX);
          maxX = Math.max(maxX, newX + elWidth);
          minY = Math.min(minY, newY);
        });
        
        // Constrain to canvas boundaries
        let constrainedDeltaX = deltaX;
        let constrainedDeltaY = deltaY;
        
        if (minX < 0) constrainedDeltaX = deltaX - minX; // Left boundary
        if (maxX > this.canvasWidth) constrainedDeltaX = deltaX - (maxX - this.canvasWidth); // Right boundary
        if (minY < 0) constrainedDeltaY = deltaY - minY; // Top boundary
        
        // Apply constrained movement to all elements
        elementsToMove.forEach(el => {
          el.position.x += constrainedDeltaX;
          el.position.y += constrainedDeltaY;
        });
        
        // Update canvas height if needed
        this.updateCanvasHeight();
      }
    }
  }

  // Handle drop on canvas
  onCanvasDrop(event: any): void {
    event.preventDefault();
    
    const elementData = event.dataTransfer.getData('element');
    if (!elementData) return;

    const element: BuilderElement = JSON.parse(elementData);
    
    // Get canvas-container rect (the white area)
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    
    // Calculate position accounting for zoom
    const x = (event.clientX - rect.left) / this.zoom;
    const y = (event.clientY - rect.top) / this.zoom;
    
    const droppedElement: DroppedElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      position: { x, y },
      content: this.getDefaultContent(element.type),
      size: this.getDefaultSize(element.type),
      zIndex: this.canvasElements.length,
      customName: 'Untitled'
    };

    this.canvasElements.push(droppedElement);
    
    // Auto-select the newly dropped element
    this.selectedElement = droppedElement;
    this.selectedElements = [droppedElement];
    
    // Update canvas height after dropping element
    this.updateCanvasHeight();
    
    // Save to history
    this.saveToHistory();
  }

  onDragStart(event: DragEvent, element: BuilderElement): void {
    this.isDragging = true;
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('element', JSON.stringify(element));
  }

  onDragEnd(): void {
    this.isDragging = false;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  // Click on canvas background to deselect
  onCanvasClick(event: MouseEvent): void {
    // Don't clear selection if we just finished a selection box drag
    if (this.justFinishedSelecting) {
      this.justFinishedSelecting = false;
      return;
    }
    
    const target = event.target as HTMLElement;
    // Deselect if clicking on canvas-overlay or canvas-container (white body)
    if (target.classList.contains('canvas-overlay') || 
        target.classList.contains('canvas-container')) {
      this.selectedElement = null;
      this.selectedElements = [];
      // Close properties panel when clicking outside
      this.closePropertiesPanel();
    }
  }

  // Start selection box when mouse down on canvas
  onCanvasMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Only start selection if clicking on empty area (canvas-overlay or canvas-container, not on elements)
    if (!target.classList.contains('canvas-overlay') && !target.classList.contains('canvas-container')) {
      return;
    }

    const overlay = document.querySelector('.canvas-overlay') as HTMLElement;
    const container = document.querySelector('.canvas-container') as HTMLElement;
    if (!overlay || !container) return;

    const containerRect = container.getBoundingClientRect();
    
    // Calculate position in canvas coordinates (accounting for zoom and scroll)
    const canvasX = (event.clientX - containerRect.left + overlay.scrollLeft) / this.zoom;
    const canvasY = (event.clientY - containerRect.top + overlay.scrollTop) / this.zoom;
    
    this.isSelecting = true;
    this.selectionStartPos = {
      x: canvasX,
      y: canvasY
    };
    
    this.selectionBox = {
      x: canvasX,
      y: canvasY,
      width: 0,
      height: 0
    };

    document.addEventListener('mousemove', this.onSelectionMouseMove);
    document.addEventListener('mouseup', this.onSelectionMouseUp);
  }

  onSelectionMouseMove = (event: MouseEvent): void => {
    if (!this.isSelecting) return;

    const overlay = document.querySelector('.canvas-overlay') as HTMLElement;
    const container = document.querySelector('.canvas-container') as HTMLElement;
    if (!overlay || !container) return;

    const containerRect = container.getBoundingClientRect();
    
    // Calculate current position in canvas coordinates (accounting for zoom and scroll)
    const currentX = (event.clientX - containerRect.left + overlay.scrollLeft) / this.zoom;
    const currentY = (event.clientY - containerRect.top + overlay.scrollTop) / this.zoom;

    // Calculate selection box dimensions
    const width = currentX - this.selectionStartPos.x;
    const height = currentY - this.selectionStartPos.y;

    this.selectionBox = {
      x: width < 0 ? currentX : this.selectionStartPos.x,
      y: height < 0 ? currentY : this.selectionStartPos.y,
      width: Math.abs(width),
      height: Math.abs(height)
    };

    // Find elements within selection box
    this.selectedElements = this.canvasElements.filter(element => {
      return this.isElementInSelectionBox(element);
    });

    // Update main selection
    if (this.selectedElements.length > 0) {
      this.selectedElement = this.selectedElements[this.selectedElements.length - 1];
    }
  }

  onSelectionMouseUp = (): void => {
    this.isSelecting = false;
    
    // Only prevent click from clearing if there was actual dragging (selection box > 5px)
    const wasDragging = this.selectionBox.width > 5 || this.selectionBox.height > 5;
    
    if (wasDragging && this.selectedElements.length > 0) {
      // Set flag to prevent onCanvasClick from clearing the selection
      this.justFinishedSelecting = true;
    } else if (!wasDragging) {
      // If just a click (no drag), don't prevent the click event
      // This allows clicking empty space to clear selection
      this.justFinishedSelecting = false;
    }
    
    document.removeEventListener('mousemove', this.onSelectionMouseMove);
    document.removeEventListener('mouseup', this.onSelectionMouseUp);
  }

  // Check if element intersects with selection box
  isElementInSelectionBox(element: DroppedElement): boolean {
    const elementRight = element.position.x + (element.size?.width || 0);
    const elementBottom = element.position.y + (element.size?.height || 0);
    const boxRight = this.selectionBox.x + this.selectionBox.width;
    const boxBottom = this.selectionBox.y + this.selectionBox.height;

    return !(
      element.position.x > boxRight ||
      elementRight < this.selectionBox.x ||
      element.position.y > boxBottom ||
      elementBottom < this.selectionBox.y
    );
  }

  selectElement(element: DroppedElement, event?: MouseEvent): void {
    // Check if Ctrl/Cmd is pressed for multi-select
    if (event && (event.ctrlKey || event.metaKey)) {
      event.stopPropagation();
      
      // Toggle element in multi-select
      const index = this.selectedElements.findIndex(el => el.id === element.id);
      if (index > -1) {
        this.selectedElements.splice(index, 1);
      } else {
        this.selectedElements.push(element);
      }
      
      // Update single selection to last selected
      this.selectedElement = this.selectedElements.length > 0 
        ? this.selectedElements[this.selectedElements.length - 1] 
        : null;
    } else {
      // Check if this element is part of a multi-selection
      const isPartOfMultiSelection = this.selectedElements.length > 1 && 
                                     this.selectedElements.some(el => el.id === element.id);
      
      if (isPartOfMultiSelection) {
        // Preserve multi-selection on single click
        // Set this as the main selected element but keep the multi-selection
        this.selectedElement = element;
        if (event) event.stopPropagation();
      } else {
        // Normal single select
        this.selectedElement = element;
        this.selectedElements = [element];
      }
    }
  }

  deleteElement(element: DroppedElement): void {
    const index = this.canvasElements.indexOf(element);
    if (index > -1) {
      this.canvasElements.splice(index, 1);
    }
    if (this.selectedElement === element) {
      this.selectedElement = null;
    }
    // If the deleted element is the one being edited, close panel and exit editing
    if (this.editingElement === element) {
      this.isEditingText = false;
      this.editingElement = null;
      this.showPropertiesPanel = false;
    }
    // Remove from multi-selection
    this.selectedElements = this.selectedElements.filter(el => el.id !== element.id);
    
    // Update canvas height after deletion
    this.updateCanvasHeight();
    
    // Save to history
    this.saveToHistory();
  }

  // Delete all selected elements
  deleteSelectedElements(): void {
    if (this.selectedElements.length === 0) return;
    
    // If the element being edited is among those being deleted, close panel
    if (this.editingElement && this.selectedElements.some(el => el.id === this.editingElement!.id)) {
      this.isEditingText = false;
      this.editingElement = null;
      this.showPropertiesPanel = false;
    }

    // Remove all selected elements
    this.selectedElements.forEach(element => {
      const index = this.canvasElements.indexOf(element);
      if (index > -1) {
        this.canvasElements.splice(index, 1);
      }
    });
    
    this.selectedElement = null;
    this.selectedElements = [];
    
    // Update canvas height after deletion
    this.updateCanvasHeight();
  }

  clearCanvas(): void {
    this.canvasElements = [];
    this.selectedElement = null;
  }

  private getDefaultContent(type: string): string {
    const contentMap: { [key: string]: string } = {
      heading: 'Your Heading Here',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      button: 'Click Me',
      image: 'https://via.placeholder.com/300x200',
      navbar: 'Navigation',
      hero: 'Hero Section',
      card: 'Card Content',
      form: 'Form',
      container: 'Container',
      grid: 'Grid Layout'
    };
    return contentMap[type] || 'Element';
  }

  private getDefaultSize(type: string): { width: number; height: number } {
    const sizeMap: { [key: string]: { width: number; height: number } } = {
      heading: { width: 300, height: 60 },
      text: { width: 400, height: 100 },
      button: { width: 150, height: 50 },
      image: { width: 300, height: 200 },
      navbar: { width: 600, height: 60 },
      hero: { width: 700, height: 400 },
      card: { width: 300, height: 200 },
      form: { width: 350, height: 150 },
      container: { width: 500, height: 300 },
      grid: { width: 600, height: 200 }
    };
    return sizeMap[type] || { width: 200, height: 100 };
  }

  // Context Menu on canvas background
  // Context Menu
  onContextMenu(event: MouseEvent, element: DroppedElement): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenuVisible = true;
    this.contextMenuElement = element;
    this.selectedElement = element;
    
    // Use setTimeout to position after menu is rendered
    setTimeout(() => {
      this.positionContextMenu(event);
    }, 0);
  }

  onCanvasContextMenu(event: MouseEvent): void {
    // Check if we clicked on an element (if so, element's handler will take over)
    const target = event.target as HTMLElement;
    if (target.classList.contains('canvas-element') || target.closest('.canvas-element')) {
      return; // Let element's context menu handle it
    }

    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenuVisible = true;
    this.contextMenuElement = null; // No element selected
    
    // Use setTimeout to position after menu is rendered
    setTimeout(() => {
      this.positionContextMenu(event);
    }, 0);
  }

  positionContextMenu(event: MouseEvent): void {
    const menu = document.querySelector('.context-menu') as HTMLElement;
    if (!menu) return;
    
    const menuRect = menu.getBoundingClientRect();
    
    // Menu is position:fixed so coords are relative to the viewport.
    let x = event.clientX;
    let y = event.clientY;
    
    // Flip horizontally if not enough room to the right
    if (x + menuRect.width > window.innerWidth) {
      x = x - menuRect.width;
    }
    
    // Flip vertically if not enough room below
    if (y + menuRect.height > window.innerHeight) {
      y = y - menuRect.height;
    }
    
    // Clamp to viewport edges
    x = Math.max(0, Math.min(x, window.innerWidth  - menuRect.width));
    y = Math.max(0, Math.min(y, window.innerHeight - menuRect.height));
    
    this.contextMenuPosition = { x, y };
  }

  closeContextMenu(): void {
    this.contextMenuVisible = false;
    this.contextMenuElement = null;
  }

  // Layers - Bring Forward (move up one layer)
  bringForward(): void {
    if (!this.contextMenuElement) return;
    
    const currentZ = this.contextMenuElement.zIndex || 0;
    
    // Find the element directly above this one
    const elementsAbove = this.canvasElements
      .filter(el => (el.zIndex || 0) > currentZ)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    if (elementsAbove.length > 0) {
      // Swap z-index with the element directly above
      const elementAbove = elementsAbove[0];
      const tempZ = elementAbove.zIndex || 0;
      elementAbove.zIndex = currentZ;
      this.contextMenuElement.zIndex = tempZ;
    }
    
    this.closeContextMenu();
  }

  // Layers - Send Backward (move down one layer)
  sendBackward(): void {
    if (!this.contextMenuElement) return;
    
    const currentZ = this.contextMenuElement.zIndex || 0;
    
    // Find the element directly below this one
    const elementsBelow = this.canvasElements
      .filter(el => (el.zIndex || 0) < currentZ)
      .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    
    if (elementsBelow.length > 0) {
      // Swap z-index with the element directly below
      const elementBelow = elementsBelow[0];
      const tempZ = elementBelow.zIndex || 0;
      elementBelow.zIndex = currentZ;
      this.contextMenuElement.zIndex = tempZ;
    }
    
    this.closeContextMenu();
  }

  // Layers - Bring to Front (top of all elements)
  bringToFront(): void {
    if (!this.contextMenuElement) return;
    
    const maxZIndex = Math.max(...this.canvasElements.map(el => el.zIndex || 0), -1);
    this.contextMenuElement.zIndex = maxZIndex + 1;
    this.closeContextMenu();
  }

  // Layers - Send to Back (bottom of all elements)
  sendToBack(): void {
    if (!this.contextMenuElement) return;
    
    // Normalize all z-indexes first to ensure proper ordering
    this.normalizeZIndexes();
    
    // Get all z-indexes
    const allZIndexes = this.canvasElements.map(el => el.zIndex || 0);
    const minZIndex = Math.min(...allZIndexes);
    
    // Set element to be below minimum
    this.contextMenuElement.zIndex = minZIndex - 1;
    
    // Normalize again to keep indexes clean
    this.normalizeZIndexes();
    
    this.closeContextMenu();
  }

  // Normalize z-indexes to sequential values starting from 0
  normalizeZIndexes(): void {
    // Sort elements by current z-index
    const sorted = [...this.canvasElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    // Reassign sequential z-indexes
    sorted.forEach((element, index) => {
      element.zIndex = index;
    });
  }

  // Copy
  copyElement(): void {
    if (this.selectedElements.length > 1) {
      // Copy all selected elements
      this.clipboard = this.selectedElements[0]; // Store first for simple paste
      console.log(`Copied ${this.selectedElements.length} elements`);
    } else if (this.contextMenuElement) {
      this.clipboard = { ...this.contextMenuElement };
    }
    this.closeContextMenu();
  }

  // Paste
  pasteElement(): void {
    if (!this.clipboard) return;
    
    const elWidth  = this.clipboard.size?.width  || 200;
    const elHeight = this.clipboard.size?.height || 100;
    
    let pasteX = this.clipboard.position.x + 20;
    let pasteY = this.clipboard.position.y + 20;
    
    // If context menu was opened on canvas background (not on element)
    if (!this.contextMenuElement) {
      const canvas = document.querySelector('.canvas-container');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        pasteX = (this.contextMenuPosition.x - rect.left) / this.zoom;
        pasteY = (this.contextMenuPosition.y - rect.top)  / this.zoom;
      }
    }
    
    // Clamp so the pasted element stays inside the canvas
    pasteX = Math.min(pasteX, this.canvasWidth - elWidth);
    pasteX = Math.max(0, pasteX);
    pasteY = Math.max(0, pasteY);
    
    const newElement: DroppedElement = {
      ...this.clipboard,
      id: `${this.clipboard.type}-${Date.now()}`,
      position: { x: pasteX, y: pasteY },
      zIndex: Math.max(...this.canvasElements.map(el => el.zIndex || 0), -1) + 1
    };
    
    this.canvasElements.push(newElement);
    this.selectedElement = newElement;
    this.closeContextMenu();
    
    // Update canvas height after pasting
    this.updateCanvasHeight();
  }

  // Duplicate (Copy + Paste in one action)
  duplicateElement(): void {
    if (!this.contextMenuElement) return;
    
    const elWidth  = this.contextMenuElement.size?.width  || 200;
    const elHeight = this.contextMenuElement.size?.height || 100;
    
    // Offset by 20px but clamp so the duplicate stays inside the canvas
    let newX = this.contextMenuElement.position.x + 20;
    let newY = this.contextMenuElement.position.y + 20;
    newX = Math.min(newX, this.canvasWidth - elWidth);
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    
    const newElement: DroppedElement = {
      ...this.contextMenuElement,
      id: `${this.contextMenuElement.type}-${Date.now()}`,
      position: { x: newX, y: newY },
      zIndex: Math.max(...this.canvasElements.map(el => el.zIndex || 0)) + 1
    };
    
    this.canvasElements.push(newElement);
    this.selectedElement = newElement;
    this.closeContextMenu();
    
    // Update canvas height after duplicating
    this.updateCanvasHeight();
  }

  // Delete from context menu
  deleteElementFromContext(): void {
    if (!this.contextMenuElement) return;
    
    this.deleteElement(this.contextMenuElement);
    this.closeContextMenu();
  }

  // Resize handles
  onResizeStart(event: MouseEvent, element: DroppedElement, handle: string): void {
    event.stopPropagation();
    event.preventDefault();
    
    this.isResizing = true;
    this.draggedElement = element;
    this.resizeHandle = handle;
    
    this.resizeStartSize = {
      width: element.size?.width || 200,
      height: element.size?.height || 100
    };
    
    this.resizeStartPos = {
      x: event.clientX,
      y: event.clientY
    };
    
    this.resizeStartElementPos = {
      x: element.position.x,
      y: element.position.y
    };
    
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  onResizeMove = (event: MouseEvent): void => {
    if (!this.isResizing || !this.draggedElement || !this.draggedElement.size) return;
    
    // Account for zoom level
    const deltaX = (event.clientX - this.resizeStartPos.x) / this.zoom;
    const deltaY = (event.clientY - this.resizeStartPos.y) / this.zoom;
    
    const newSize = { ...this.draggedElement.size };
    const newPos = { ...this.resizeStartElementPos };
    
    switch (this.resizeHandle) {
      case 'se': // Southeast (bottom-right)
        newSize.width = Math.max(50, this.resizeStartSize.width + deltaX);
        newSize.height = Math.max(50, this.resizeStartSize.height + deltaY);
        break;
      case 'sw': // Southwest (bottom-left)
        newSize.width = Math.max(50, this.resizeStartSize.width - deltaX);
        newSize.height = Math.max(50, this.resizeStartSize.height + deltaY);
        newPos.x = this.resizeStartElementPos.x + (this.resizeStartSize.width - newSize.width);
        break;
      case 'ne': // Northeast (top-right)
        newSize.width = Math.max(50, this.resizeStartSize.width + deltaX);
        newSize.height = Math.max(50, this.resizeStartSize.height - deltaY);
        newPos.y = this.resizeStartElementPos.y + (this.resizeStartSize.height - newSize.height);
        break;
      case 'nw': // Northwest (top-left)
        newSize.width = Math.max(50, this.resizeStartSize.width - deltaX);
        newSize.height = Math.max(50, this.resizeStartSize.height - deltaY);
        newPos.x = this.resizeStartElementPos.x + (this.resizeStartSize.width - newSize.width);
        newPos.y = this.resizeStartElementPos.y + (this.resizeStartSize.height - newSize.height);
        break;
      case 'e': // East (right)
        newSize.width = Math.max(50, this.resizeStartSize.width + deltaX);
        break;
      case 'w': // West (left)
        newSize.width = Math.max(50, this.resizeStartSize.width - deltaX);
        newPos.x = this.resizeStartElementPos.x + (this.resizeStartSize.width - newSize.width);
        break;
      case 's': // South (bottom)
        newSize.height = Math.max(50, this.resizeStartSize.height + deltaY);
        break;
      case 'n': // North (top)
        newSize.height = Math.max(50, this.resizeStartSize.height - deltaY);
        newPos.y = this.resizeStartElementPos.y + (this.resizeStartSize.height - newSize.height);
        break;
    }
    
    // Constrain to canvas boundaries
    // Ensure element stays within left boundary
    if (newPos.x < 0) {
      newSize.width = newSize.width + newPos.x;
      newPos.x = 0;
    }
    
    // Ensure element stays within top boundary
    if (newPos.y < 0) {
      newSize.height = newSize.height + newPos.y;
      newPos.y = 0;
    }
    
    // Ensure element stays within right boundary
    if (newPos.x + newSize.width > this.canvasWidth) {
      newSize.width = this.canvasWidth - newPos.x;
    }
    
    // Maintain minimum size
    newSize.width = Math.max(50, newSize.width);
    newSize.height = Math.max(50, newSize.height);
    
    this.draggedElement.size = newSize;
    this.draggedElement.position = newPos;
  }

  onResizeEnd = (): void => {
    this.isResizing = false;
    this.resizeHandle = '';
    
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
    
    // Update canvas height after resize
    this.updateCanvasHeight();
    
    // Save to history
    this.saveToHistory();
  }

  // ========== Rotation Handle Methods ==========
  onRotateStart(event: MouseEvent, element: DroppedElement): void {
    event.stopPropagation();
    event.preventDefault();

    this.isRotating = true;
    this.draggedElement = element;
    this.rotationStartRotation = element.rotation || 0;

    // Calculate the initial angle from element center to mouse position
    // Use the same logical-center calculation as onRotateMove so both
    // reference the exact same point from the very first frame.
    const container = document.querySelector('.canvas-container') as HTMLElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const centerX = containerRect.left + (element.position.x + (element.size?.width || 0) / 2) * this.zoom;
    const centerY = containerRect.top  + (element.position.y + (element.size?.height || 0) / 2) * this.zoom;

    this.rotationStartAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);
    // Store as the "previous" angle so the first onRotateMove frame has a matching reference
    this.rotationAccumulatedAngle = 0;
    this.rotationPreviousAngle = this.rotationStartAngle;

    document.addEventListener('mousemove', this.onRotateMove);
    document.addEventListener('mouseup', this.onRotateEnd);
  }

  onRotateMove = (event: MouseEvent): void => {
    if (!this.isRotating || !this.draggedElement) return;

    const container = document.querySelector('.canvas-container') as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    // Logical center in viewport pixels — identical calculation to onRotateStart
    const elementCenterX = containerRect.left + (this.draggedElement.position.x + (this.draggedElement.size?.width || 0) / 2) * this.zoom;
    const elementCenterY = containerRect.top  + (this.draggedElement.position.y + (this.draggedElement.size?.height || 0) / 2) * this.zoom;

    const currentAngle = Math.atan2(event.clientY - elementCenterY, event.clientX - elementCenterX) * (180 / Math.PI);

    // Per-frame delta
    let frameDelta = currentAngle - this.rotationPreviousAngle;

    // Correct for atan2 wraparound at ±180°
    if (frameDelta > 180)  frameDelta -= 360;
    if (frameDelta < -180) frameDelta += 360;

    this.rotationAccumulatedAngle += frameDelta;
    this.rotationPreviousAngle = currentAngle;

    let newRotation = this.rotationStartRotation + this.rotationAccumulatedAngle;
    newRotation = this.normalizeRotation(newRotation);

    this.draggedElement.rotation = Math.round(newRotation);
  }

  onRotateEnd = (): void => {
    this.isRotating = false;
    this.draggedElement = null;

    document.removeEventListener('mousemove', this.onRotateMove);
    document.removeEventListener('mouseup', this.onRotateEnd);

    // Save to history
    this.saveToHistory();
  }

  // Normalize rotation to stay between -360 and 360
  normalizeRotation(angle: number): number {
    // Wrap angle to -360 to 360 range
    while (angle > 360) angle -= 360;
    while (angle < -360) angle += 360;
    
    // Convert to 0-360 or -360-0 range (wrap at boundaries)
    if (angle === 360) angle = 0;
    if (angle === -360) angle = 0;
    
    return angle;
  }

  isRotationFlipped(rotation: number): boolean {
    // Normalize to 0-360 range (converts negative angles to positive)
    const normalized = ((rotation % 360) + 360) % 360;
    
    // Flipped range: 110° to 290°
    return normalized > 110 && normalized < 290;
  }

  // Create group from selected elements
  createGroup(): void {
    if (this.selectedElements.length < 2) {
      alert('Please select at least 2 elements to create a group (Ctrl+Click)');
      return;
    }
    
    const groupId = `group-${Date.now()}`;
    const groupName = `Group ${this.groups.length + 1}`;
    
    // Assign group ID to all selected elements
    this.selectedElements.forEach(element => {
      element.groupId = groupId;
    });
    
    // Create group object
    const group: ElementGroup = {
      id: groupId,
      elementIds: this.selectedElements.map(el => el.id),
      name: groupName
    };
    
    this.groups.push(group);
    
    console.log(`Created ${groupName} with ${this.selectedElements.length} elements`);
    
    // Keep only one element selected
    this.selectedElement = this.selectedElements[0];
    this.selectedElements = [this.selectedElement];
  }

  // Ungroup element
  ungroupElement(element: DroppedElement): void {
    if (!element.groupId) return;
    
    const groupId = element.groupId;
    
    // Remove group ID from all elements in this group
    this.canvasElements.forEach(el => {
      if (el.groupId === groupId) {
        delete el.groupId;
      }
    });
    
    // Remove group from groups array
    this.groups = this.groups.filter(g => g.id !== groupId);
    
    console.log('Group ungrouped');
  }

  // Get all elements in the same group
  getGroupElements(element: DroppedElement): DroppedElement[] {
    if (!element.groupId) return [element];
    
    return this.canvasElements.filter(el => el.groupId === element.groupId);
  }

  // Check if element is in multi-selection
  isMultiSelected(element: DroppedElement): boolean {
    return this.selectedElements.length > 1 && 
           this.selectedElements.some(el => el.id === element.id);
  }

  // Open preview mode
  openPreview(): void {
    this.isPreviewMode = true;
    this.selectedElement = null;
    this.selectedElements = [];
  }

  // Close preview mode
  closePreview(): void {
    this.isPreviewMode = false;
  }

  // Export canvas as JSON and download
  exportProject(): void {
    const projectData = {
      elements: this.canvasElements,
      groups: this.groups,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    // Create blob and download
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `website-builder-project-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log('Project saved successfully!');
  }

  // Handle file upload
  onFileUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const projectData = JSON.parse(e.target.result);
        this.loadProject(projectData);
        console.log('Project loaded successfully!');
      } catch (error) {
        console.error('Error loading project:', error);
        alert('Failed to load project file. Please make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be loaded again
    event.target.value = '';
  }

  // Load project from JSON
  loadProject(projectData: any): void {
    if (projectData.elements && Array.isArray(projectData.elements)) {
      this.canvasElements = projectData.elements;
      this.groups = projectData.groups || [];
      this.selectedElement = null;
      this.selectedElements = [];
      this.clipboard = null;
      console.log(`Loaded ${this.canvasElements.length} elements and ${this.groups.length} groups from project`);
    } else {
      console.error('Invalid project data format');
      alert('Invalid project file format');
    }
  }

  // Handle dragging elements on canvas
  onElementMouseDown(event: MouseEvent, element: DroppedElement): void {
    // If we are currently editing text in this element, do not start a drag
    if (this.isEditingText && this.editingElement === element) {
      return;
    }

    event.stopPropagation();
    this.isDraggingElement = true;
    this.draggedElement = element;
    
    // Only update selectedElement if not part of existing multi-selection
    // This preserves multi-selection when dragging
    if (this.selectedElements.length <= 1 || !this.selectedElements.some(el => el.id === element.id)) {
      this.selectedElement = element;
    }
    
    // Store initial position of dragged element
    this.initialDraggedElementPos = { x: element.position.x, y: element.position.y };
    
    // Store initial positions of all selected elements for multi-select drag
    this.initialSelectedPositions.clear();
    
    // If element is in a group, store positions of all group members
    if (element.groupId) {
      const groupElements = this.getGroupElements(element);
      groupElements.forEach(el => {
        this.initialSelectedPositions.set(el.id, { x: el.position.x, y: el.position.y });
      });
    }
    // If multi-selected, store positions of all selected elements
    else if (this.selectedElements.length > 1 && this.selectedElements.some(el => el.id === element.id)) {
      this.selectedElements.forEach(el => {
        this.initialSelectedPositions.set(el.id, { x: el.position.x, y: el.position.y });
      });
    }
    
    // Get canvas container to account for zoom
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;
    
    const containerRect = canvasContainer.getBoundingClientRect();
    
    // Calculate offset accounting for zoom
    const mouseXInContainer = (event.clientX - containerRect.left) / this.zoom;
    const mouseYInContainer = (event.clientY - containerRect.top) / this.zoom;
    
    this.dragOffset = {
      x: mouseXInContainer - element.position.x,
      y: mouseYInContainer - element.position.y
    };
    
    // Add mouse move and up listeners
    document.addEventListener('mousemove', this.onElementMouseMove);
    document.addEventListener('mouseup', this.onElementMouseUp);
  }

  onElementMouseMove = (event: MouseEvent): void => {
    if (!this.isDraggingElement || !this.draggedElement) return;
    
    const canvasContainer = document.querySelector('.canvas-container');
    const overlay = document.querySelector('.canvas-overlay') as HTMLElement;
    if (!canvasContainer || !overlay) return;
    
    const containerRect = canvasContainer.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas container, accounting for zoom
    const mouseXInContainer = (event.clientX - containerRect.left) / this.zoom;
    const mouseYInContainer = (event.clientY - containerRect.top) / this.zoom;
    
    // Calculate new position
    let newX = mouseXInContainer - this.dragOffset.x;
    let newY = mouseYInContainer - this.dragOffset.y;
    
    // Constrain to canvas boundaries
    const elementWidth = this.draggedElement.size?.width || 0;
    const elementHeight = this.draggedElement.size?.height || 0;
    
    // For multi-select, we need to check the bounds of all selected elements
    if ((this.selectedElements.length > 1 && this.draggedElement && this.selectedElements.some(el => el.id === this.draggedElement!.id)) ||
        (this.draggedElement && this.draggedElement.groupId)) {
      // Calculate the bounding box of all selected/grouped elements
      const elementsToCheck = this.draggedElement.groupId 
        ? this.getGroupElements(this.draggedElement)
        : this.selectedElements;
      
      // Calculate delta first (before constraining)
      const deltaX = newX - this.initialDraggedElementPos.x;
      const deltaY = newY - this.initialDraggedElementPos.y;
      
      // Find the furthest points of the selection
      let minX = Infinity, maxX = -Infinity, minY = Infinity;
      
      elementsToCheck.forEach(el => {
        const initialPos = this.initialSelectedPositions.get(el.id);
        if (initialPos) {
          const newElX = initialPos.x + deltaX;
          const newElY = initialPos.y + deltaY;
          const elWidth = el.size?.width || 0;
          
          minX = Math.min(minX, newElX);
          maxX = Math.max(maxX, newElX + elWidth);
          minY = Math.min(minY, newElY);
        }
      });
      
      // Constrain the delta based on the group bounds
      let constrainedDeltaX = deltaX;
      let constrainedDeltaY = deltaY;
      
      if (minX < 0) {
        constrainedDeltaX = deltaX - minX; // Shift right
      }
      if (maxX > this.canvasWidth) {
        constrainedDeltaX = deltaX - (maxX - this.canvasWidth); // Shift left
      }
      if (minY < 0) {
        constrainedDeltaY = deltaY - minY; // Shift down
      }
      
      // Apply constrained delta to get new position for dragged element
      newX = this.initialDraggedElementPos.x + constrainedDeltaX;
      newY = this.initialDraggedElementPos.y + constrainedDeltaY;
    } else {
      // Single element - simple boundary constraint
      newX = Math.max(0, Math.min(newX, this.canvasWidth - elementWidth));
      newY = Math.max(0, newY);
    }
    
    // Update position
    this.draggedElement.position = { x: newX, y: newY };
    
    // Calculate delta from INITIAL position (not current position)
    const deltaX = newX - this.initialDraggedElementPos.x;
    const deltaY = newY - this.initialDraggedElementPos.y;
    
    // If element is in a group, move all group members
    if (this.draggedElement.groupId) {
      const groupElements = this.getGroupElements(this.draggedElement);
      groupElements.forEach(el => {
        if (el.id !== this.draggedElement!.id) {
          const initialPos = this.initialSelectedPositions.get(el.id);
          if (initialPos) {
            el.position = {
              x: initialPos.x + deltaX,
              y: initialPos.y + deltaY
            };
          }
        }
      });
    }
    // If multi-selected (not grouped), move all selected elements together
    else if (this.selectedElements.length > 1 && this.selectedElements.some(el => el.id === this.draggedElement!.id)) {
      this.selectedElements.forEach(el => {
        if (el.id !== this.draggedElement!.id) {
          const initialPos = this.initialSelectedPositions.get(el.id);
          if (initialPos) {
            el.position = {
              x: initialPos.x + deltaX,
              y: initialPos.y + deltaY
            };
          }
        }
      });
    }
    
    // Expand canvas if element goes beyond current canvas height
    const elementBottom = newY + elementHeight;
    if (elementBottom > this.canvasHeight) {
      this.canvasHeight = elementBottom + 100; // Add 100px padding below element
    }
    
    // Auto-scroll logic
    const scrollThreshold = 50; // pixels from edge to trigger scroll
    const maxScrollSpeed = 10; // max pixels per frame
    
    const mouseY = event.clientY - overlayRect.top;
    const mouseX = event.clientX - overlayRect.left;
    const viewportHeight = overlay.clientHeight;
    const viewportWidth = overlay.clientWidth;
    
    let shouldAutoScroll = false;
    
    // Check if near bottom edge
    if (mouseY > viewportHeight - scrollThreshold) {
      shouldAutoScroll = true;
      this.isAutoScrollingDown = true;
      const distance = mouseY - (viewportHeight - scrollThreshold);
      this.autoScrollSpeed = Math.min(maxScrollSpeed, (distance / scrollThreshold) * maxScrollSpeed);
    }
    // Check if near top edge
    else if (mouseY < scrollThreshold) {
      shouldAutoScroll = true;
      this.isAutoScrollingDown = false;
      const distance = scrollThreshold - mouseY;
      this.autoScrollSpeed = -Math.min(maxScrollSpeed, (distance / scrollThreshold) * maxScrollSpeed);
    }
    
    // Start or update auto-scroll interval
    if (shouldAutoScroll) {
      if (!this.autoScrollInterval) {
        this.autoScrollInterval = setInterval(() => {
          // If scrolling down, expand canvas continuously
          if (this.isAutoScrollingDown) {
            const currentScrollableHeight = overlay.scrollHeight;
            const currentScroll = overlay.scrollTop + viewportHeight;
            if (currentScroll >= currentScrollableHeight - 100) {
              this.canvasHeight += 50; // Keep expanding
            }
          }
          // Scroll
          overlay.scrollTop += this.autoScrollSpeed;
        }, 16); // ~60fps
      }
    } else {
      // Stop auto-scroll
      if (this.autoScrollInterval) {
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = null;
        this.autoScrollSpeed = 0;
        this.isAutoScrollingDown = false;
      }
    }
  }

  onElementMouseUp = (): void => {
    this.isDraggingElement = false;
    this.draggedElement = null;
    
    // Stop auto-scroll
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    
    // Remove listeners
    document.removeEventListener('mousemove', this.onElementMouseMove);
    document.removeEventListener('mouseup', this.onElementMouseUp);
    
    // Update canvas height after drag
    this.updateCanvasHeight();
    
    // Save to history
    this.saveToHistory();
  }

  // Calculate dynamic canvas height based on elements
  calculateCanvasHeight(): number {
    if (this.canvasElements.length === 0) {
      return 800; // Minimum height
    }
    
    // Find the lowest point of any element
    const lowestPoint = Math.max(
      ...this.canvasElements.map(el => 
        el.position.y + (el.size?.height || 0)
      ),
      800 // Minimum height
    );
    
    // Return the lowest point without extra padding
    return lowestPoint;
  }

  // Update canvas height (called after drag/resize)
  updateCanvasHeight(): void {
    this.canvasHeight = this.calculateCanvasHeight();
  }

  // ========== Zoom Functions ==========
  // ========== Figma-Style Zoom Functions ==========
  
  // Simple zoom toggle between 50% and 100%
  toggleZoom(): void {
    this.zoom = this.zoom === 1 ? 0.5 : 1;
  }

  getZoomPercentage(): string {
    return Math.round(this.zoom * 100) + '%';
  }

  // Undo/Redo system
  saveToHistory(): void {
    // Remove any history after current index (when user made changes after undo)
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Deep clone the current state
    const snapshot = JSON.parse(JSON.stringify(this.canvasElements));
    this.history.push(snapshot);
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.canvasElements = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedElement = null;
      this.selectedElements = [];
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.canvasElements = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedElement = null;
      this.selectedElements = [];
    }
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }


  getCanvasWrapperWidth(): number {
    return this.canvasWidth * this.zoom;
  }

  getCanvasWrapperHeight(): number {
    return this.canvasHeight * this.zoom;
  }

  // ========== Element Name Editing ==========
  startEditingName(event: MouseEvent, element: DroppedElement): void {
    event.stopPropagation();
    event.preventDefault();
    this.isEditingName = true;
    this.editingNameElement = element;
    this.editingNameValue = element.customName || 'Untitled';
    setTimeout(() => {
      const input = document.querySelector('.element-name-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  finishEditingName(): void {
    if (this.editingNameElement) {
      const trimmed = this.editingNameValue.trim();
      this.editingNameElement.customName = trimmed.length > 0 ? trimmed : 'Untitled';
      this.saveToHistory();
    }
    this.isEditingName = false;
    this.editingNameElement = null;
    this.editingNameValue = '';
  }

  onNameInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.finishEditingName();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      // Revert
      this.isEditingName = false;
      this.editingNameElement = null;
      this.editingNameValue = '';
    }
  }

  // ========== Text Editing Functions ==========
  onElementDoubleClick(event: MouseEvent, element: DroppedElement): void {
    event.stopPropagation();
    event.preventDefault();
    
    // Clear multi-selection on double-click
    this.selectedElement = element;
    this.selectedElements = [element];
    
    // Allow editing for text, heading, and container elements
    if (element.type === 'text' || element.type === 'heading' || element.type === 'container') {
      this.isEditingText = true;
      this.editingElement = element;
      this.editingText = element.content || '';

      // Initialize style defaults for all editable elements
      if (!element.backgroundColor) element.backgroundColor = 'transparent';
      if (!element.borderRadius && element.borderRadius !== 0) element.borderRadius = 0;
      if (!element.size) element.size = this.getDefaultSize(element.type);
      if (!element.customBorderRadius) element.customBorderRadius = false;
      if (!element.rotation && element.rotation !== 0) element.rotation = 0;

      // Initialize text-specific properties for text and heading
      if (element.type === 'text' || element.type === 'heading') {
        if (!element.fontSize) element.fontSize = element.type === 'heading' ? 32 : 16;
        if (!element.fontFamily) element.fontFamily = 'Arial';
        if (!element.textColor) element.textColor = element.type === 'heading' ? '#0f172a' : '#475569';
        if (!element.textAlign) element.textAlign = 'left';
        if (!element.verticalAlign) element.verticalAlign = 'top';
      }
      
      // Show properties panel
      this.openPropertiesPanel(element, event);

      // Focus the content textarea in the right panel after Angular renders it (only for text elements)
      if (element.type === 'text' || element.type === 'heading') {
        setTimeout(() => {
          const textarea = document.querySelector('.content-textarea') as HTMLTextAreaElement;
          if (textarea) {
            textarea.focus();
            // Place cursor at end
            const len = textarea.value.length;
            textarea.setSelectionRange(len, len);
          }
        }, 50);
      }
    }
  }

  // Called on every keystroke in the textarea — keeps element.content in sync live
  onEditingTextChange(): void {
    if (this.editingElement) {
      this.editingElement.content = this.editingText;
    }
  }

  // ========== Properties Panel Functions ==========
  openPropertiesPanel(element: DroppedElement, event: MouseEvent): void {
    this.showPropertiesPanel = true;
    this.editingElement = element;
  }

  closePropertiesPanel(): void {
    this.showPropertiesPanel = false;
    this.isEditingText = false;
    this.editingElement = null;
  }

  // Update text property
  updateTextProperty(property: keyof DroppedElement, value: any): void {
    if (this.editingElement) {
      // Normalize rotation values to -360 to 360 range
      if (property === 'rotation' && typeof value === 'number') {
        value = this.normalizeRotation(value);
      }
      (this.editingElement as any)[property] = value;
    }
  }

  // Set custom font size with validation
  setCustomFontSize(size: number): void {
    if (this.editingElement && size >= 10 && size <= 100) {
      this.editingElement.fontSize = size;
    }
  }

  // Toggle between uniform and custom border radius
  toggleCustomBorderRadius(): void {
    if (this.editingElement) {
      this.editingElement.customBorderRadius = !this.editingElement.customBorderRadius;
      
      if (this.editingElement.customBorderRadius) {
        // Switch to custom mode - initialize all corners with current uniform value
        const currentRadius = this.editingElement.borderRadius || 0;
        this.editingElement.borderRadiusTopLeft = currentRadius;
        this.editingElement.borderRadiusTopRight = currentRadius;
        this.editingElement.borderRadiusBottomLeft = currentRadius;
        this.editingElement.borderRadiusBottomRight = currentRadius;
      } else {
        // Switch back to uniform mode - use top-left as the uniform value
        this.editingElement.borderRadius = this.editingElement.borderRadiusTopLeft || 0;
      }
    }
  }

  // Get the border-radius CSS value based on mode
  getBorderRadiusStyle(element: DroppedElement): string {
    if (element.customBorderRadius) {
      const tl = element.borderRadiusTopLeft || 0;
      const tr = element.borderRadiusTopRight || 0;
      const br = element.borderRadiusBottomRight || 0;
      const bl = element.borderRadiusBottomLeft || 0;
      return `${tl}px ${tr}px ${br}px ${bl}px`;
    } else {
      return `${element.borderRadius || 0}px`;
    }
  }
}