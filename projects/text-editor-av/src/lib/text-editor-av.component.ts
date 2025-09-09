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
          <button (click)="execCommand('bold')" [class.active]="isFormatActive('bold')" title="Bold">
            <strong>B</strong>
          </button>
          <button (click)="execCommand('italic')" [class.active]="isFormatActive('italic')" title="Italic">
            <em>I</em>
          </button>
          <button (click)="execCommand('underline')" [class.active]="isFormatActive('underline')" title="Underline">
            <u>U</u>
          </button>
          <button (click)="execCommand('strikethrough')" [class.active]="isFormatActive('strikeThrough')" title="Strikethrough">
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
          <button (click)="insertChecklist()" title="Checklist">
            <i class="icon">☑</i>
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
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
          </select>
        </div>

        <!-- Font Controls -->
        <div class="toolbar-group">
          <select (change)="changeFontFamily($event)" class="font-select">
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier New">Courier</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans</option>
            <option value="Consolas">Consolas</option>
          </select>
          <input type="number" 
                 [(ngModel)]="fontSize" 
                 (change)="changeFontSize()"
                 min="8" max="72" 
                 class="font-size-input"
                 title="Font Size">
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
          <button (click)="insertVideo()" title="Insert Video">
            <i class="icon">🎬</i>
          </button>
          <button (click)="insertTable()" title="Insert Table">
            <i class="icon">⊞</i>
          </button>
          <button (click)="insertCodeBlock()" title="Code Block">
            <i class="icon">&lt;/&gt;</i>
          </button>
          <button (click)="toggleEmojiPicker()" title="Emoji">
            <i class="icon">😊</i>
          </button>
          <button (click)="insertHorizontalRule()" title="Horizontal Line">
            <i class="icon">─</i>
          </button>
        </div>

        <!-- Export Options -->
        <div class="toolbar-group">
          <button (click)="exportAsHTML()" title="Export HTML">
            HTML
          </button>
          <button (click)="exportAsPDF()" title="Export PDF">
            PDF
          </button>
          <button (click)="exportAsMarkdown()" title="Export Markdown">
            MD
          </button>
          <button (click)="exportAsText()" title="Export Text">
            TXT
          </button>
        </div>

        <!-- Theme Switcher -->
        <div class="toolbar-group">
          <select (change)="changeTheme($event)" class="theme-select">
            <option *ngFor="let theme of themes" [value]="theme.name">
              {{theme.name}}
            </option>
          </select>
        </div>

        <!-- View Controls -->
        <div class="toolbar-group">
          <button (click)="toggleFullscreen()" title="Fullscreen">
            <i class="icon">⛶</i>
          </button>
          <button (click)="execCommand('undo')" title="Undo">
            <i class="icon">↶</i>
          </button>
          <button (click)="execCommand('redo')" title="Redo">
            <i class="icon">↷</i>
          </button>
        </div>
      </div>

      <!-- Emoji Picker -->
      <div class="emoji-picker-container" *ngIf="showEmojiPicker">
        <div class="emoji-picker">
          <div class="emoji-categories">
            <button *ngFor="let category of emojiCategories" 
                    (click)="selectedEmojiCategory = category"
                    [class.active]="selectedEmojiCategory === category">
              {{category.icon}}
            </button>
          </div>
          <div class="emoji-grid">
            <span *ngFor="let emoji of getEmojisForCategory()" 
                  (click)="insertEmoji(emoji)"
                  class="emoji-item">
              {{emoji}}
            </span>
          </div>
        </div>
      </div>

      <!-- Editor Area -->
      <div class="av-editor-wrapper">
        <!-- Line Numbers (optional) -->
        <div class="line-numbers" *ngIf="showLineNumbers">
          <div *ngFor="let line of lineNumbers" class="line-number">{{line}}</div>
        </div>

        <!-- Main Editor -->
        <div #editor
             class="av-editor"
             contenteditable="true"
             (input)="onContentChange()"
             (paste)="onPaste($event)"
             (keydown)="onKeyDown($event)"
             (keyup)="onKeyUp($event)"
             (mouseup)="onSelectionChange()"
             [innerHTML]="sanitizedContent"
             [style.min-height]="minHeight"
             [style.max-height]="maxHeight"
             (drop)="onDrop($event)"
             (dragover)="onDragOver($event)"
             [attr.placeholder]="placeholder">
        </div>
      </div>

      <!-- Status Bar -->
      <div class="av-statusbar" *ngIf="showStatusBar">
        <span>Words: {{wordCount}}</span>
        <span>Characters: {{charCount}}</span>
        <span>Lines: {{lineCount}}</span>
        <span class="auto-save-status" *ngIf="autoSaveEnabled">
          {{autoSaveStatus}}
        </span>
        <span class="cursor-position">Ln {{cursorLine}}, Col {{cursorColumn}}</span>
      </div>

      <!-- Mention Suggestions -->
      <div class="mention-suggestions" *ngIf="showMentions" [style.top]="mentionPosition.top" [style.left]="mentionPosition.left">
        <div *ngFor="let user of filteredUsers" 
             (click)="insertMention(user)"
             class="mention-item">
          {{ '@' + user }}
        </div>
      </div>

      <!-- Code Language Selector -->
      <div class="code-language-selector" *ngIf="showCodeLanguageSelector">
        <select [(ngModel)]="selectedCodeLanguage" (change)="applyCodeLanguage()">
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
          <option value="sql">SQL</option>
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="bash">Bash</option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .av-editor-container {
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-color, #fff);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    /* Toolbar Styles */
    .av-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px;
      background: var(--toolbar-bg, #f8f9fa);
      border-bottom: 1px solid var(--border-color, #ddd);
    }

    .toolbar-group {
      display: flex;
      gap: 4px;
      padding: 0 8px;
      border-right: 1px solid var(--border-color, #ddd);
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
      background: var(--hover-bg, #e9ecef);
      border-color: var(--border-color, #ddd);
    }

    .av-toolbar button.active {
      background: var(--active-bg, #007bff);
      color: white;
    }

    .av-toolbar select {
      padding: 4px 8px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }

    .font-size-input {
      width: 50px;
      padding: 4px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
    }

    .color-picker {
      width: 32px;
      height: 32px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      cursor: pointer;
    }

    /* Editor Styles */
    .av-editor-wrapper {
      display: flex;
      position: relative;
    }

    .line-numbers {
      width: 40px;
      padding: 12px 8px;
      background: var(--line-numbers-bg, #f8f9fa);
      border-right: 1px solid var(--border-color, #ddd);
      text-align: right;
      color: #6c757d;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      line-height: 1.5;
      user-select: none;
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
      background: var(--editor-bg, white);
      color: var(--text-color, #333);
    }

    .av-editor:focus {
      outline: none;
    }

    .av-editor:empty:before {
      content: attr(placeholder);
      color: #999;
      pointer-events: none;
      position: absolute;
    }

    /* Code Block Styles */
    .av-editor pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 10px 0;
    }

    .av-editor code {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      background: rgba(0,0,0,0.05);
      padding: 2px 4px;
      border-radius: 3px;
    }

    /* Table Styles */
    .av-editor table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
    }

    .av-editor table td,
    .av-editor table th {
      border: 1px solid var(--border-color, #ddd);
      padding: 8px;
    }

    .av-editor table th {
      background: var(--toolbar-bg, #f8f9fa);
      font-weight: bold;
    }

    /* Checklist Styles */
    .checklist-item {
      display: flex;
      align-items: center;
      margin: 5px 0;
    }

    .checklist-item input[type="checkbox"] {
      margin-right: 8px;
    }

    /* Status Bar */
    .av-statusbar {
      display: flex;
      gap: 20px;
      padding: 8px 12px;
      background: var(--statusbar-bg, #f8f9fa);
      border-top: 1px solid var(--border-color, #ddd);
      font-size: 12px;
      color: #6c757d;
    }

    .auto-save-status {
      color: #28a745;
      font-weight: 500;
    }

    .cursor-position {
      margin-left: auto;
    }

    /* Emoji Picker */
    .emoji-picker-container {
      position: absolute;
      top: 50px;
      right: 10px;
      z-index: 1000;
      background: white;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 10px;
      width: 320px;
      max-height: 300px;
      overflow-y: auto;
    }

    .emoji-categories {
      display: flex;
      gap: 5px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color, #ddd);
    }

    .emoji-categories button {
      padding: 5px 10px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 20px;
      border-radius: 4px;
    }

    .emoji-categories button:hover,
    .emoji-categories button.active {
      background: var(--hover-bg, #e9ecef);
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 5px;
      max-height: 200px;
      overflow-y: auto;
    }

    .emoji-item {
      padding: 5px;
      text-align: center;
      cursor: pointer;
      font-size: 20px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .emoji-item:hover {
      background: var(--hover-bg, #e9ecef);
    }

    /* Mention Suggestions */
    .mention-suggestions {
      position: absolute;
      background: white;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
    }

    .mention-item {
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .mention-item:hover {
      background: var(--hover-bg, #e9ecef);
    }

    /* Code Language Selector */
    .code-language-selector {
      position: absolute;
      top: 50px;
      right: 10px;
      z-index: 100;
      background: white;
      padding: 10px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Themes */
    [data-theme="dark"] {
      --bg-color: #1e1e1e;
      --text-color: #e0e0e0;
      --toolbar-bg: #2d2d2d;
      --border-color: #404040;
      --hover-bg: #3a3a3a;
      --active-bg: #0d7377;
      --editor-bg: #252525;
      --statusbar-bg: #2d2d2d;
      --line-numbers-bg: #1a1a1a;
    }

    [data-theme="blue"] {
      --bg-color: #f0f8ff;
      --text-color: #001f3f;
      --toolbar-bg: #e6f2ff;
      --border-color: #b3d9ff;
      --hover-bg: #cce5ff;
      --active-bg: #0066cc;
      --editor-bg: #f8fcff;
    }

    [data-theme="green"] {
      --bg-color: #f0fdf4;
      --text-color: #14532d;
      --toolbar-bg: #dcfce7;
      --border-color: #86efac;
      --hover-bg: #bbf7d0;
      --active-bg: #16a34a;
      --editor-bg: #f8fffa;
    }

    /* Fullscreen Mode */
    .av-editor-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }

    .av-editor-container.fullscreen .av-editor {
      height: calc(100vh - 120px);
      max-height: none;
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
        border-bottom: 1px solid var(--border-color, #ddd);
        padding: 5px;
      }

      .emoji-picker-container {
        width: 280px;
      }

      .emoji-grid {
        grid-template-columns: repeat(6, 1fr);
      }
    }

    /* Print Styles */
    @media print {
      .av-toolbar,
      .av-statusbar,
      .line-numbers {
        display: none !important;
      }

      .av-editor {
        border: none;
        box-shadow: none;
      }
    }

    /* Animations */
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .auto-save-status {
      animation: pulse 2s ease-in-out;
    }
  `]
})
export class TextEditorAvComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editor', { static: false }) editorElement!: ElementRef;

  @Input() content: string = '';
  @Input() minHeight: string = '400px';
  @Input() maxHeight: string = '600px';
  @Input() autoSaveEnabled: boolean = true;
  @Input() autoSaveInterval: number = 5000;
  @Input() showLineNumbers: boolean = false;
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
  cursorLine: number = 1;
  cursorColumn: number = 1;
  autoSaveStatus: string = '';
  lineNumbers: number[] = [];
  fontSize: number = 16;

  // Emoji Picker
  showEmojiPicker: boolean = false;
  selectedEmojiCategory: any;
  emojiCategories = [
    { name: 'smileys', icon: '😀', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'] },
    { name: 'animals', icon: '🐶', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺'] },
    { name: 'food', icon: '🍎', emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀'] },
    { name: 'activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️'] },
    { name: 'travel', icon: '🚗', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃'] },
    { name: 'objects', icon: '💡', emojis: ['💡', '🔦', '🏮', '🪔', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️'] },
    { name: 'symbols', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'] }
  ];

  // Mentions
  showMentions: boolean = false;
  mentionPosition: { top: string, left: string } = { top: '0', left: '0' };
  filteredUsers: string[] = [];
  allUsers: string[] = ['john_doe', 'jane_smith', 'bob_wilson', 'alice_cooper', 'charlie_brown', 'diana_prince', 'edward_norton', 'fiona_apple'];
  currentMentionSearch: string = '';

  // Code Block
  showCodeLanguageSelector: boolean = false;
  selectedCodeLanguage: string = 'javascript';

  // Themes
  themes: Theme[] = [
    { name: 'light', primary: '#007bff', secondary: '#6c757d', background: '#ffffff', text: '#333333', border: '#dddddd' },
    { name: 'dark', primary: '#0d7377', secondary: '#495057', background: '#1e1e1e', text: '#e0e0e0', border: '#404040' },
    { name: 'blue', primary: '#0066cc', secondary: '#4d94ff', background: '#f0f8ff', text: '#001f3f', border: '#b3d9ff' },
    { name: 'green', primary: '#16a34a', secondary: '#22c55e', background: '#f0fdf4', text: '#14532d', border: '#86efac' }
  ];
  currentTheme: Theme = this.themes[0];

  private autoSaveTimer: any;
  private isFullscreen: boolean = false;
  private isBrowser: boolean;

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Initialize content
    this.sanitizedContent = this.sanitizer.sanitize(1, this.content) || '';
    
    // Initialize emoji category
    this.selectedEmojiCategory = this.emojiCategories[0];

    // Initialize line numbers if needed
    if (this.showLineNumbers) {
      this.updateLineNumbers();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.editorElement?.nativeElement) {
        // Set initial content if any
        if (this.content) {
          this.editorElement.nativeElement.innerHTML = this.content;
        }
        
        this.updateStats();
        
        // Load saved content from localStorage if browser
        if (this.isBrowser) {
          this.loadFromLocalStorage();
          
          // Start autosave if enabled
          if (this.autoSaveEnabled) {
            this.startAutoSave();
          }

          // Add keyboard shortcuts
          this.addKeyboardShortcuts();
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

  isFormatActive(format: string): boolean {
    if (!this.isBrowser) return false;
    
    try {
      return document.queryCommandState(format);
    } catch {
      return false;
    }
  }

  formatBlock(event: any) {
    const value = event.target.value;
    if (value) {
      this.execCommand('formatBlock', value);
      event.target.value = '';
    }
  }

  changeFontFamily(event: any) {
    this.execCommand('fontName', event.target.value);
  }

  changeFontSize() {
    if (!this.isBrowser) return;
    
    this.execCommand('fontSize', '7');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = range.startContainer.parentElement;
      if (span && span.tagName === 'SPAN') {
        span.style.fontSize = this.fontSize + 'px';
      }
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

  insertVideo() {
    if (!this.isBrowser) return;
    
    const url = prompt('Enter video URL (YouTube/Vimeo):');
    if (url) {
      let embedUrl = '';

      // YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId[1]}`;
        }
      }
      // Vimeo
      else if (url.includes('vimeo.com')) {
        const videoId = url.match(/vimeo\.com\/(\d+)/);
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId[1]}`;
        }
      }

      if (embedUrl) {
        const iframe = `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
        this.execCommand('insertHTML', iframe);
      }
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

  insertCodeBlock() {
    if (!this.isBrowser) return;
    
    this.showCodeLanguageSelector = true;
    const code = prompt('Enter your code:');
    if (code) {
      const codeBlock = `<pre style="background: #2d2d2d; color: #f8f8f2; padding: 12px; border-radius: 4px; overflow-x: auto;"><code class="language-${this.selectedCodeLanguage}">${this.escapeHtml(code)}</code></pre><br>`;
      this.execCommand('insertHTML', codeBlock);
      this.showCodeLanguageSelector = false;
    }
  }

  escapeHtml(text: string): string {
    const map: any = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  applyCodeLanguage() {
    // Language will be applied when inserting code
  }

  insertChecklist() {
    if (!this.isBrowser) return;
    
    const items = prompt('Enter checklist items (comma separated):');
    if (items) {
      const itemList = items.split(',');
      let checklist = '<div class="checklist">';
      itemList.forEach(item => {
        checklist += `<div class="checklist-item"><input type="checkbox"> <span>${item.trim()}</span></div>`;
      });
      checklist += '</div><br>';
      this.execCommand('insertHTML', checklist);
    }
  }

  insertHorizontalRule() {
    this.execCommand('insertHorizontalRule');
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker && !this.selectedEmojiCategory) {
      this.selectedEmojiCategory = this.emojiCategories[0];
    }
  }

  getEmojisForCategory(): string[] {
    return this.selectedEmojiCategory ? this.selectedEmojiCategory.emojis : [];
  }

  insertEmoji(emoji: string) {
    this.execCommand('insertText', emoji);
    this.showEmojiPicker = false;
  }

  insertMention(user: string) {
    const mention = `@${user} `;
    this.execCommand('insertHTML', `<span class="mention" style="color: #007bff; font-weight: bold;">@${user}</span>&nbsp;`);
    this.showMentions = false;
    this.currentMentionSearch = '';
  }

  onContentChange() {
    if (!this.editorElement?.nativeElement) return;
    
    const content = this.editorElement.nativeElement.innerHTML;
    this.content = content;
    this.contentChange.emit(content);
    this.updateStats();

    if (this.showLineNumbers) {
      this.updateLineNumbers();
    }
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

  onKeyUp(event: KeyboardEvent) {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = range.startContainer.textContent || '';

      // Check for @ mentions
      if (text.includes('@')) {
        const lastAtIndex = text.lastIndexOf('@');
        const searchText = text.substring(lastAtIndex + 1);
        
        if (searchText.length > 0 && !searchText.includes(' ')) {
          this.currentMentionSearch = searchText;
          this.filteredUsers = this.allUsers.filter(user => 
            user.toLowerCase().includes(searchText.toLowerCase())
          );
          
          if (this.filteredUsers.length > 0) {
            this.showMentions = true;
            this.updateMentionPosition();
          }
        } else {
          this.showMentions = false;
        }
      } else {
        this.showMentions = false;
      }
    }

    this.updateCursorPosition();
  }

  onSelectionChange() {
    this.updateCursorPosition();
  }

  onDrop(event: DragEvent) {
    if (!this.isBrowser) return;
    
    event.preventDefault();
    const files = event.dataTransfer?.files;

    if (files && files.length > 0) {
      const file = files[0];
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          this.execCommand('insertImage', url);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  updateMentionPosition() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = this.editorElement.nativeElement.getBoundingClientRect();

      this.mentionPosition = {
        top: (rect.bottom - editorRect.top + 5) + 'px',
        left: (rect.left - editorRect.left) + 'px'
      };
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

  updateLineNumbers() {
    this.lineNumbers = Array.from({ length: Math.max(this.lineCount + 10, 30) }, (_, i) => i + 1);
  }

  updateCursorPosition() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = this.editorElement.nativeElement.innerText || '';
      const position = range.startOffset;

      const lines = text.substring(0, position).split('\n');
      this.cursorLine = lines.length;
      this.cursorColumn = lines[lines.length - 1].length + 1;
    }
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
      console.error('Failed to save:', error);
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
      console.error('Failed to load:', error);
    }
  }

  loadFromLocalStorage() {
    if (!this.isBrowser) return;
    
    try {
      const savedContent = localStorage.getItem('av-editor-content');
      if (savedContent && !this.content && this.editorElement?.nativeElement) {
        this.editorElement.nativeElement.innerHTML = savedContent;
        this.content = savedContent;
        this.updateStats();
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

  exportAsHTML() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    const content = this.editorElement.nativeElement.innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    this.downloadFile(blob, 'document.html');
  }

  exportAsPDF() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    // For PDF export, you would need to install jspdf and html2canvas
    // npm install jspdf html2canvas
    alert('PDF export requires jspdf and html2canvas libraries. Please install them first.');
  }

  exportAsMarkdown() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    const html = this.editorElement.nativeElement.innerHTML;
    // Simple HTML to Markdown conversion
    let markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, '');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    this.downloadFile(blob, 'document.md');
  }

  exportAsText() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    const text = this.editorElement.nativeElement.innerText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    this.downloadFile(blob, 'document.txt');
  }

  downloadFile(blob: Blob, filename: string) {
    if (!this.isBrowser) return;
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  changeTheme(event: any) {
    const themeName = event.target.value;
    const theme = this.themes.find(t => t.name === themeName);
    if (theme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
    }
  }

  applyTheme(theme: Theme) {
    if (!this.editorElement?.nativeElement) return;
    
    const container = this.editorElement.nativeElement.closest('.av-editor-container');
    if (container) {
      container.style.setProperty('--bg-color', theme.background);
      container.style.setProperty('--text-color', theme.text);
      container.style.setProperty('--border-color', theme.border);
      container.style.setProperty('--active-bg', theme.primary);
    }
  }

  toggleFullscreen() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    this.isFullscreen = !this.isFullscreen;
    const container = this.editorElement.nativeElement.closest('.av-editor-container');

    if (this.isFullscreen) {
      container?.classList.add('fullscreen');
    } else {
      container?.classList.remove('fullscreen');
    }
  }

  addKeyboardShortcuts() {
    if (!this.isBrowser) return;
    
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'e':
            if (e.shiftKey) {
              e.preventDefault();
              this.toggleEmojiPicker();
            }
            break;
          case 'f':
            if (e.shiftKey) {
              e.preventDefault();
              this.toggleFullscreen();
            }
            break;
        }
      }
    });
  }
}