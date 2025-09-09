import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as marked from 'marked';
import DOMPurify from 'dompurify';

interface EditorCommand {
  command: string;
  value?: string;
  icon?: string;
  tooltip?: string;
}

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
          <button (click)="exportAsDOCX()" title="Export DOCX">
            DOCX
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
             (dragover)="onDragOver($event)">
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
          @{{user}}
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

    /* Fullscreen Mode */
    :host-context(.fullscreen) .av-editor-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }

    :host-context(.fullscreen) .av-editor {
      height: calc(100vh - 120px);
      max-height: none;
    }
  `]
})
export class TextEditorAvComponent implements OnInit, OnDestroy {
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

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.sanitizedContent = this.sanitizer.sanitize(1, this.content) || '';
    this.updateStats();
    
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }

    if (this.showLineNumbers) {
      this.updateLineNumbers();
    }

    // Load saved content from localStorage
    this.loadFromLocalStorage();

    // Add keyboard shortcuts
    this.addKeyboardShortcuts();
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

  execCommand(command: string, value?: string) {
    document.execCommand(command, false, value);
    this.onContentChange();
  }

  isFormatActive(format: string): boolean {
    return document.queryCommandState(format);
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
    const url = prompt('Enter URL:');
    if (url) {
      this.execCommand('createLink', url);
    }
  }

  insertImage() {
    const url = prompt('Enter image URL:');
    if (url) {
      this.execCommand('insertImage', url);
      setTimeout(() => {
        const images = this.editorElement.nativeElement.querySelectorAll('img');
        images.forEach((img: HTMLImageElement) => {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
        });
      }, 100);
    }
  }

  insertVideo() {
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
    this.showCodeLanguageSelector = true;
    const code = prompt('Enter your code:');
    if (code) {
      const highlighted = Prism.highlight(code, Prism.languages[this.selectedCodeLanguage], this.selectedCodeLanguage);
      const codeBlock = `<pre><code class="language-${this.selectedCodeLanguage}">${highlighted}</code></pre><br>`;
      this.execCommand('insertHTML', codeBlock);
      this.showCodeLanguageSelector = false;
    }
  }

  applyCodeLanguage() {
    // Language will be applied when inserting code
  }

  insertChecklist() {
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
    const content = this.editorElement.nativeElement.innerHTML;
    this.content = content;
    this.contentChange.emit(content);
    this.updateStats();
    
    if (this.showLineNumbers) {
      this.updateLineNumbers();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
    }
  }

  onKeyDown(event: KeyboardEvent) {
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

      // Check for # hashtags
      if (text.includes('#')) {
        const lastHashIndex = text.lastIndexOf('#');
        const hashtagText = text.substring(lastHashIndex);
        
        if (hashtagText.match(/#\w+/)) {
          const hashtag = hashtagText.match(/#\w+/)?.[0];
          if (hashtag) {
            // Auto-style hashtags
            const html = this.editorElement.nativeElement.innerHTML;
            const styledHtml = html.replace(
              new RegExp(`(${hashtag})(?![^<]*>)`, 'g'),
              `<span style="color: #28a745; font-weight: bold;">$1</span>`
            );
            if (html !== styledHtml) {
              this.editorElement.nativeElement.innerHTML = styledHtml;
              // Restore cursor position
              this.restoreCursorPosition();
            }
          }
        }
      }
    }

    this.updateCursorPosition();
  }

  onSelectionChange() {
    this.updateCursorPosition();
  }

  onDrop(event: DragEvent) {
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

  restoreCursorPosition() {
    // Complex cursor restoration logic
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(this.editorElement.nativeElement);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  updateStats() {
    const text = this.editorElement?.nativeElement?.innerText || '';
    this.charCount = text.length;
    this.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.lineCount = text.split('\n').length;
  }

  updateLineNumbers() {
    this.lineNumbers = Array.from({ length: this.lineCount + 10 }, (_, i) => i + 1);
  }

  updateCursorPosition() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = this.editorElement.nativeElement.innerText;
      const position = range.startOffset;
      
      const lines = text.substring(0, position).split('\n');
      this.cursorLine = lines.length;
      this.cursorColumn = lines[lines.length - 1].length + 1;
    }
  }

  newDocument() {
    if (confirm('Create new document? Unsaved changes will be lost.')) {
      this.editorElement.nativeElement.innerHTML = '';
      this.content = '';
      this.contentChange.emit('');
      this.updateStats();
    }
  }

  saveToLocal() {
    const content = this.editorElement.nativeElement.innerHTML;
    localStorage.setItem('av-editor-content', content);
    localStorage.setItem('av-editor-saved-time', new Date().toISOString());
    this.autoSaveStatus = 'Saved at ' + new Date().toLocaleTimeString();
    this.save.emit(content);
    
    setTimeout(() => {
      this.autoSaveStatus = '';
    }, 3000);
  }

  loadFromLocal() {
    const savedContent = localStorage.getItem('av-editor-content');
    if (savedContent) {
      this.editorElement.nativeElement.innerHTML = savedContent;
      this.content = savedContent;
      this.contentChange.emit(savedContent);
      this.updateStats();
      this.load.emit();
    }
  }

  loadFromLocalStorage() {
    const savedContent = localStorage.getItem('av-editor-content');
    if (savedContent && !this.content) {
      this.content = savedContent;
      this.sanitizedContent = this.sanitizer.sanitize(1, savedContent) || '';
    }
  }

  startAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      this.saveToLocal();
    }, this.autoSaveInterval);
  }

  exportAsHTML() {
    const content = this.editorElement.nativeElement.innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    saveAs(blob, 'document.html');
  }

  exportAsPDF() {
    const element = this.editorElement.nativeElement;
    
    html2canvas(element).then((canvas: { toDataURL: (arg0: string) => any; height: number; width: number; }) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('document.pdf');
    });
  }

  exportAsMarkdown() {
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
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
      .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_match: any, content: string) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_match: any, content: string) => {
        let counter = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
          return `${counter++}. $1\n`;
        });
      })
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, '');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    saveAs(blob, 'document.md');
  }

  exportAsDOCX() {
    const content = this.editorElement.nativeElement.innerHTML;
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'></head>
      <body>${content}</body>
      </html>`;
    
    const blob = new Blob(['\ufeff', preHtml], {
      type: 'application/msword'
    });
    
    saveAs(blob, 'document.docx');
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
    const container = this.editorElement.nativeElement.closest('.av-editor-container');
    if (container) {
      container.style.setProperty('--bg-color', theme.background);
      container.style.setProperty('--text-color', theme.text);
      container.style.setProperty('--border-color', theme.border);
      container.style.setProperty('--active-bg', theme.primary);
    }
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    const container = this.editorElement.nativeElement.closest('.av-editor-container');
    
    if (this.isFullscreen) {
      container?.classList.add('fullscreen');
      document.body.classList.add('fullscreen');
    } else {
      container?.classList.remove('fullscreen');
      document.body.classList.remove('fullscreen');
    }
  }

  addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'p':
            if (e.shiftKey) {
              e.preventDefault();
              this.exportAsPDF();
            }
            break;
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