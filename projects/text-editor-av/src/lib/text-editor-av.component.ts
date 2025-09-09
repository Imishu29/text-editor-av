import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Theme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
}

@Component({
  selector: 'av-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="av-editor-container" [attr.data-theme]="currentTheme.name">
      <!-- Toolbar -->
      <div class="av-toolbar" *ngIf="!hideToolbar">
        <!-- File Operations -->
        <div class="toolbar-group">
          <button (click)="newDocument()" title="New Document">
            <i class="icon">📄</i>
          </button>
          <button (click)="saveToLocal()" title="Save">
            <i class="icon">💾</i>
          </button>
          <button (click)="loadFromLocal()" title="Load">
            <i class="icon">📂</i>
          </button>
        </div>

        <!-- Basic Formatting -->
        <div class="toolbar-group">
          <button (click)="execCommand('bold')" title="Bold">
            <strong>B</strong>
          </button>
          <button (click)="execCommand('italic')" title="Italic">
            <em>I</em>
          </button>
          <button (click)="execCommand('underline')" title="Underline">
            <u>U</u>
          </button>
          <button (click)="execCommand('strikethrough')" title="Strikethrough">
            <s>S</s>
          </button>
        </div>

        <!-- Text Alignment -->
        <div class="toolbar-group">
          <button (click)="execCommand('justifyLeft')" title="Align Left">
            <i class="icon">↤</i>
          </button>
          <button (click)="execCommand('justifyCenter')" title="Align Center">
            <i class="icon">↔</i>
          </button>
          <button (click)="execCommand('justifyRight')" title="Align Right">
            <i class="icon">↦</i>
          </button>
          <button (click)="execCommand('justifyFull')" title="Justify">
            <i class="icon">☰</i>
          </button>
        </div>

        <!-- Lists -->
        <div class="toolbar-group">
          <button (click)="execCommand('insertOrderedList')" title="Numbered List">
            <i class="icon">1.</i>
          </button>
          <button (click)="execCommand('insertUnorderedList')" title="Bullet List">
            <i class="icon">•</i>
          </button>
        </div>

        <!-- Headings -->
        <div class="toolbar-group">
          <select (change)="formatBlock($event)" class="heading-select">
            <option value="">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>
        </div>

        <!-- Colors -->
        <div class="toolbar-group">
          <input type="color" 
                 (change)="changeTextColor($event)" 
                 title="Text Color"
                 class="color-picker">
          <input type="color" 
                 (change)="changeBackgroundColor($event)" 
                 title="Background Color"
                 class="color-picker">
        </div>

        <!-- Media & Special -->
        <div class="toolbar-group">
          <button (click)="insertLink()" title="Insert Link">
            <i class="icon">🔗</i>
          </button>
          <button (click)="insertImage()" title="Insert Image">
            <i class="icon">🖼️</i>
          </button>
          <button (click)="insertTable()" title="Insert Table">
            <i class="icon">⊞</i>
          </button>
          <button (click)="insertHorizontalRule()" title="Horizontal Line">
            <i class="icon">─</i>
          </button>
        </div>

        <!-- View Controls -->
        <div class="toolbar-group">
          <button (click)="execCommand('undo')" title="Undo">
            <i class="icon">↶</i>
          </button>
          <button (click)="execCommand('redo')" title="Redo">
            <i class="icon">↷</i>
          </button>
        </div>
      </div>

      <!-- Editor Area -->
      <div class="av-editor-wrapper">
        <!-- Main Editor -->
        <div #editor
             class="av-editor"
             contenteditable="true"
             (input)="onContentChange()"
             (paste)="onPaste($event)"
             (keydown)="onKeyDown($event)"
             [innerHTML]="sanitizedContent"
             [style.min-height]="minHeight"
             [style.max-height]="maxHeight">
        </div>
      </div>

      <!-- Status Bar -->
      <div class="av-statusbar" *ngIf="showStatusBar">
        <span>Words: {{wordCount}}</span>
        <span>Characters: {{charCount}}</span>
        <span>Lines: {{lineCount}}</span>
        <span class="auto-save-status" *ngIf="autoSaveEnabled && autoSaveStatus">
          {{autoSaveStatus}}
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .av-editor-container {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    /* Toolbar Styles */
    .av-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
    }

    .toolbar-group {
      display: flex;
      gap: 4px;
      padding: 0 8px;
      border-right: 1px solid #ddd;
    }

    .toolbar-group:last-child {
      border-right: none;
    }

    .av-toolbar button {
      padding: 6px 10px;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
      font-size: 14px;
      min-width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .av-toolbar button:hover {
      background: #e9ecef;
      border-color: #ddd;
    }

    .av-toolbar button.active {
      background: #007bff;
      color: white;
    }

    .av-toolbar select {
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }

    .color-picker {
      width: 32px;
      height: 32px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
    }

    /* Editor Styles */
    .av-editor-wrapper {
      display: flex;
      position: relative;
    }

    .av-editor {
      flex: 1;
      min-height: 400px;
      padding: 12px;
      font-size: 16px;
      line-height: 1.6;
      outline: none;
      overflow-y: auto;
      word-wrap: break-word;
      background: white;
      color: #333;
    }

    .av-editor:focus {
      outline: none;
    }

    .av-editor:empty:before {
      content: attr(placeholder);
      color: #999;
      pointer-events: none;
    }

    /* Table Styles */
    .av-editor table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
    }

    .av-editor table td,
    .av-editor table th {
      border: 1px solid #ddd;
      padding: 8px;
    }

    .av-editor table th {
      background: #f8f9fa;
      font-weight: bold;
    }

    /* Status Bar */
    .av-statusbar {
      display: flex;
      gap: 20px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #6c757d;
    }

    .auto-save-status {
      color: #28a745;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .av-toolbar {
        flex-direction: column;
      }

      .toolbar-group {
        width: 100%;
        justify-content: flex-start;
        border-right: none;
        border-bottom: 1px solid #ddd;
        padding: 5px;
      }

      .toolbar-group:last-child {
        border-bottom: none;
      }
    }

    /* Print Styles */
    @media print {
      .av-toolbar,
      .av-statusbar {
        display: none !important;
      }

      .av-editor {
        border: none;
        box-shadow: none;
      }
    }
  `]
})
export class TextEditorAvComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editor', { static: false }) editorElement!: ElementRef;

  @Input() content: string = '';
  @Input() minHeight: string = '400px';
  @Input() maxHeight: string = '600px';
  @Input() autoSaveEnabled: boolean = false; // Disabled by default
  @Input() autoSaveInterval: number = 5000;
  @Input() showStatusBar: boolean = true;
  @Input() hideToolbar: boolean = false;
  @Input() placeholder: string = 'Start typing...';

  @Output() contentChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<string>();
  @Output() load = new EventEmitter<void>();

  sanitizedContent: SafeHtml = '';
  wordCount: number = 0;
  charCount: number = 0;
  lineCount: number = 1;
  autoSaveStatus: string = '';

  // Themes
  themes: Theme[] = [
    { name: 'light', primary: '#007bff', secondary: '#6c757d', background: '#ffffff', text: '#333333', border: '#dddddd' }
  ];
  currentTheme: Theme = this.themes[0];

  private autoSaveTimer: any;
  private isBrowser: boolean;

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Only initialize content, no localStorage access here
    this.sanitizedContent = this.sanitizer.sanitize(1, this.content) || '';
  }

  ngAfterViewInit() {
    // DOM operations after view is ready
    setTimeout(() => {
      if (this.editorElement?.nativeElement) {
        if (this.content) {
          this.editorElement.nativeElement.innerHTML = this.content;
        }
        this.updateStats();

        // Only start autosave if enabled and in browser
        if (this.autoSaveEnabled && this.isBrowser) {
          this.startAutoSave();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

  execCommand(command: string, value?: string) {
    if (!this.isBrowser) return;
    
    document.execCommand(command, false, value);
    this.onContentChange();
  }

  formatBlock(event: any) {
    const value = event.target.value;
    if (value) {
      this.execCommand('formatBlock', value);
      event.target.value = '';
    }
  }

  changeTextColor(event: any) {
    this.execCommand('foreColor', event.target.value);
  }

  changeBackgroundColor(event: any) {
    this.execCommand('hiliteColor', event.target.value);
  }

  insertLink() {
    if (!this.isBrowser) return;
    
    const url = prompt('Enter URL:');
    if (url) {
      this.execCommand('createLink', url);
    }
  }

  insertImage() {
    if (!this.isBrowser) return;
    
    const url = prompt('Enter image URL:');
    if (url) {
      this.execCommand('insertImage', url);
      setTimeout(() => {
        if (this.editorElement?.nativeElement) {
          const images = this.editorElement.nativeElement.querySelectorAll('img');
          images.forEach((img: HTMLImageElement) => {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
          });
        }
      }, 100);
    }
  }

  insertTable() {
    if (!this.isBrowser) return;
    
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');

    if (rows && cols) {
      let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
      
      // Header row
      table += '<tr>';
      for (let j = 0; j < parseInt(cols); j++) {
        table += `<th style="padding: 8px; background: #f0f0f0;">Header ${j + 1}</th>`;
      }
      table += '</tr>';
      
      // Data rows
      for (let i = 1; i < parseInt(rows); i++) {
        table += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          table += '<td style="padding: 8px;">Cell</td>';
        }
        table += '</tr>';
      }
      table += '</table><br>';
      
      this.execCommand('insertHTML', table);
    }
  }

  insertHorizontalRule() {
    this.execCommand('insertHorizontalRule');
  }

  onContentChange() {
    if (!this.editorElement?.nativeElement) return;
    
    const content = this.editorElement.nativeElement.innerHTML;
    this.content = content;
    this.contentChange.emit(content);
    this.updateStats();
  }

  onPaste(event: ClipboardEvent) {
    if (!this.isBrowser) return;
    
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.isBrowser) return;
    
    // Handle tab key
    if (event.key === 'Tab') {
      event.preventDefault();
      this.execCommand('insertText', '    ');
    }

    // Handle shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch(event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          this.saveToLocal();
          break;
        case 'b':
          event.preventDefault();
          this.execCommand('bold');
          break;
        case 'i':
          event.preventDefault();
          this.execCommand('italic');
          break;
        case 'u':
          event.preventDefault();
          this.execCommand('underline');
          break;
      }
    }
  }

  updateStats() {
    if (!this.editorElement?.nativeElement) {
      this.charCount = 0;
      this.wordCount = 0;
      this.lineCount = 1;
      return;
    }
    
    const text = this.editorElement.nativeElement.innerText || '';
    this.charCount = text.length;
    this.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.lineCount = text.split('\n').length || 1;
  }

  newDocument() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    if (confirm('Create new document? Unsaved changes will be lost.')) {
      this.editorElement.nativeElement.innerHTML = '';
      this.content = '';
      this.contentChange.emit('');
      this.updateStats();
    }
  }

  saveToLocal() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    try {
      const content = this.editorElement.nativeElement.innerHTML;
      localStorage.setItem('av-editor-content', content);
      localStorage.setItem('av-editor-saved-time', new Date().toISOString());
      this.autoSaveStatus = 'Saved at ' + new Date().toLocaleTimeString();
      this.save.emit(content);

      setTimeout(() => {
        this.autoSaveStatus = '';
      }, 3000);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  loadFromLocal() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    try {
      const savedContent = localStorage.getItem('av-editor-content');
      if (savedContent) {
        this.editorElement.nativeElement.innerHTML = savedContent;
        this.content = savedContent;
        this.contentChange.emit(savedContent);
        this.updateStats();
        this.load.emit();
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  startAutoSave() {
    if (!this.isBrowser) return;
    
    this.autoSaveTimer = setInterval(() => {
      this.saveToLocal();
    }, this.autoSaveInterval);
  }
}