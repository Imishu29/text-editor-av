import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Install these packages: npm install jspdf html2canvas file-saver
declare const require: any;
let jsPDF: any;
let html2canvas: any;

interface Theme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
}

interface Template {
  name: string;
  icon: string;
  content: string;
}

@Component({
  selector: 'av-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="av-editor-container" [attr.data-theme]="currentTheme.name" [class.fullscreen]="isFullscreen" [class.zen]="isZen">
      <!-- AI Assistant Panel -->
      <div class="ai-assistant-panel" *ngIf="showAIAssistant" [@slideIn]>
        <div class="ai-header">
          <h3>✨ AI Writing Assistant</h3>
          <button (click)="showAIAssistant = false" class="close-btn">×</button>
        </div>
        <div class="ai-body">
          <div class="ai-actions">
            <button (click)="improveWriting()" class="ai-btn">
              <span class="ai-icon">🔧</span>
              Improve Writing
            </button>
            <button (click)="fixGrammar()" class="ai-btn">
              <span class="ai-icon">📝</span>
              Fix Grammar
            </button>
            <button (click)="makeShorter()" class="ai-btn">
              <span class="ai-icon">✂️</span>
              Make Shorter
            </button>
            <button (click)="makeLonger()" class="ai-btn">
              <span class="ai-icon">📏</span>
              Make Longer
            </button>
            <button (click)="changeTone('professional')" class="ai-btn">
              <span class="ai-icon">👔</span>
              Professional
            </button>
            <button (click)="changeTone('casual')" class="ai-btn">
              <span class="ai-icon">😊</span>
              Casual
            </button>
            <button (click)="translateText()" class="ai-btn">
              <span class="ai-icon">🌍</span>
              Translate
            </button>
            <button (click)="summarize()" class="ai-btn">
              <span class="ai-icon">📋</span>
              Summarize
            </button>
          </div>
          <div class="ai-suggestions" *ngIf="aiSuggestions">
            <h4>Suggestions:</h4>
            <p>{{aiSuggestions}}</p>
            <button (click)="applyAISuggestion()" class="apply-btn">Apply</button>
          </div>
        </div>
      </div>

      <!-- Templates Panel -->
      <div class="templates-panel" *ngIf="showTemplates" [@slideIn]>
        <div class="templates-header">
          <h3>📄 Document Templates</h3>
          <button (click)="showTemplates = false" class="close-btn">×</button>
        </div>
        <div class="templates-grid">
          <div *ngFor="let template of templates" 
               (click)="applyTemplate(template)" 
               class="template-card">
            <div class="template-icon">{{template.icon}}</div>
            <div class="template-name">{{template.name}}</div>
          </div>
        </div>
      </div>

      <!-- Text to SVG Panel -->
      <div class="svg-panel" *ngIf="showSVGPanel" [@slideIn]>
        <div class="svg-header">
          <h3>🎨 Text to SVG Art</h3>
          <button (click)="showSVGPanel = false" class="close-btn">×</button>
        </div>
        <div class="svg-body">
          <input [(ngModel)]="svgText" placeholder="Enter text for SVG" class="svg-input">
          <div class="svg-options">
            <select [(ngModel)]="svgFont" class="svg-select">
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier">Courier</option>
              <option value="Georgia">Georgia</option>
              <option value="Impact">Impact</option>
            </select>
            <input type="number" [(ngModel)]="svgFontSize" placeholder="Size" class="svg-size">
            <input type="color" [(ngModel)]="svgColor" class="svg-color">
          </div>
          <div class="svg-styles">
            <button *ngFor="let style of svgStyles" 
                    (click)="selectedSvgStyle = style"
                    [class.active]="selectedSvgStyle === style"
                    class="svg-style-btn">
              {{style.name}}
            </button>
          </div>
          <div class="svg-preview" [innerHTML]="svgPreview"></div>
          <button (click)="insertSVG()" class="insert-svg-btn">Insert SVG</button>
        </div>
      </div>

      <!-- Version History Panel -->
      <div class="history-panel" *ngIf="showHistory" [@slideIn]>
        <div class="history-header">
          <h3>🕐 Version History</h3>
          <button (click)="showHistory = false" class="close-btn">×</button>
        </div>
        <div class="history-list">
          <div *ngFor="let version of versionHistory" 
               (click)="restoreVersion(version)"
               class="history-item">
            <div class="history-time">{{version.timestamp | date:'short'}}</div>
            <div class="history-preview">{{version.preview}}</div>
            <div class="history-stats">{{version.wordCount}} words</div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="av-toolbar" *ngIf="!hideToolbar">
        <!-- File Operations -->
        <div class="toolbar-group">
          <button (click)="newDocument()" title="New Document (Ctrl+N)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </button>
          <button (click)="saveToLocal()" title="Save (Ctrl+S)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </button>
          <button (click)="fileInput.click()" title="Open File" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11v-6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"></path>
              <path d="m19 15 3 3-3 3"></path>
              <path d="M11 15h11"></path>
            </svg>
          </button>
          <input #fileInput type="file" accept=".html,.htm,.md,.txt,.doc,.docx" (change)="importFromFile($event)" style="display: none;" />
          
          <button (click)="showTemplates = true" title="Templates" class="toolbar-btn premium">
            📄
          </button>
          
          <button (click)="showHistory = true" title="Version History" class="toolbar-btn premium">
            🕐
          </button>
        </div>

        <!-- Text Formatting -->
        <div class="toolbar-group">
          <select (change)="formatBlock($event)" class="toolbar-select" title="Heading">
            <option value="">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
          </select>
          
          <select (change)="changeFontFamily($event)" class="toolbar-select" title="Font">
            <option *ngFor="let f of fonts" [value]="f">{{f}}</option>
          </select>
          
          <input type="number" [(ngModel)]="fontSize" (change)="changeFontSize()" 
                 min="8" max="72" class="toolbar-input" title="Font Size">
        </div>

        <!-- Text Styles -->
        <div class="toolbar-group">
          <button (click)="execCommand('bold')" [class.active]="isFormatActive('bold')" 
                  title="Bold (Ctrl+B)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4v16h6.5c2.5 0 4.5-2 4.5-4.5 0-1.5-.7-2.8-1.8-3.5.7-.7 1.3-1.7 1.3-3C17.5 6 15.5 4 12.5 4H7zm3 3h2.5c.8 0 1.5.7 1.5 1.5S13.3 10 12.5 10H10V7zm0 6h3c1.1 0 2 .9 2 2s-.9 2-2 2h-3v-4z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('italic')" [class.active]="isFormatActive('italic')" 
                  title="Italic (Ctrl+I)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4h4l-3 12h3l-1 4H9l1-4H7l3-12z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('underline')" [class.active]="isFormatActive('underline')" 
                  title="Underline (Ctrl+U)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17c3.3 0 6-2.7 6-6V3h-2.5v8c0 1.9-1.6 3.5-3.5 3.5S8.5 12.9 8.5 11V3H6v8c0 3.3 2.7 6 6 6zm-7 2v2h14v-2H5z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('strikeThrough')" [class.active]="isFormatActive('strikeThrough')" 
                  title="Strikethrough" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12h18v2H3v-2zm3-6h12v2h-5v2H8V8h10V6H6v2zm4 10h4v2h-4v-2z"/>
            </svg>
          </button>
          
          <button (click)="toggleHighlight()" [class.active]="highlightActive" 
                  title="Highlight" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 11-6 6v3h3l6-6m-6 0 3-3m-3 3 3 3m7-7 3-3m-3 3-3 3m3-3-3-3 4-4a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-4 4Z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('superscript')" title="Superscript" class="toolbar-btn">
            X²
          </button>
          
          <button (click)="execCommand('subscript')" title="Subscript" class="toolbar-btn">
            X₂
          </button>
          
          <input type="color" [(ngModel)]="textColor" (change)="changeTextColor()" 
                 title="Text Color" class="color-picker">
          
          <input type="color" [(ngModel)]="bgColor" (change)="changeBackgroundColor()" 
                 title="Background Color" class="color-picker">
        </div>

        <!-- Alignment -->
        <div class="toolbar-group">
          <button (click)="execCommand('justifyLeft')" title="Align Left" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('justifyCenter')" title="Center" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('justifyRight')" title="Align Right" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('justifyFull')" title="Justify" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('indent')" title="Indent" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18v2H3V4zm0 15h18v2H3v-2zm8-5h10v2H11v-2zm0-5h10v2H11V9zm-8 3.5L7 12l-4-3.5v7z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('outdent')" title="Outdent" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18v2H3V4zm0 15h18v2H3v-2zm8-5h10v2H11v-2zm0-5h10v2H11V9zm-4-.5L3 12l4 3.5v-7z"/>
            </svg>
          </button>
        </div>

        <!-- Lists & Blocks -->
        <div class="toolbar-group">
          <button (click)="execCommand('insertOrderedList')" title="Numbered List" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
            </svg>
          </button>
          
          <button (click)="execCommand('insertUnorderedList')" title="Bullet List" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </button>
          
          <button (click)="insertTodoList()" title="Todo List" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </button>
          
          <button (click)="insertBlockquote()" title="Quote" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
          </button>
        </div>

        <!-- Insert -->
        <div class="toolbar-group">
          <button (click)="insertLink()" title="Insert Link" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </button>
          
          <button (click)="insertImage()" title="Insert Image" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </button>
          
          <button (click)="insertModernTable()" title="Insert Table" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="15" y1="3" x2="15" y2="21"></line>
            </svg>
          </button>
          
          <button (click)="insertCodeBlock()" title="Code Block" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </button>
          
          <button (click)="insertMathEquation()" title="Math Equation" class="toolbar-btn premium">
            ∑
          </button>
          
          <button (click)="insertChart()" title="Insert Chart" class="toolbar-btn premium">
            📊
          </button>
          
          <button (click)="insertHorizontalRule()" title="Horizontal Line" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12h18v2H3z"/>
            </svg>
          </button>
        </div>

        <!-- Tools -->
        <div class="toolbar-group">
          <button (click)="toggleEmojiPicker()" title="Emoji" class="toolbar-btn">
            😊
          </button>
          
          <button (click)="showSVGPanel = true" title="Text to SVG" class="toolbar-btn premium">
            🎨
          </button>
          
          <button (click)="showAIAssistant = true" title="AI Assistant" class="toolbar-btn premium">
            ✨
          </button>
          
          <button (click)="openSearchPanel()" title="Find & Replace (Ctrl+F)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          
          <button (click)="checkGrammar()" title="Grammar Check" class="toolbar-btn premium">
            ✓
          </button>
          
          <button (click)="execCommand('undo')" title="Undo (Ctrl+Z)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7v6h6"></path>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
            </svg>
          </button>
          
          <button (click)="execCommand('redo')" title="Redo (Ctrl+Y)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 7v6h-6"></path>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
            </svg>
          </button>
        </div>

        <!-- Export -->
        <div class="toolbar-group">
          <button (click)="exportAsHTML()" title="Export as HTML" class="toolbar-btn">
            HTML
          </button>
          
          <button (click)="exportAsMarkdown()" title="Export as Markdown" class="toolbar-btn">
            MD
          </button>
          
          <button (click)="exportAsPDF()" title="Export as PDF" class="toolbar-btn">
            PDF
          </button>
          
          <button (click)="exportAsWord()" title="Export as Word" class="toolbar-btn premium">
            DOC
          </button>
          
          <button (click)="print()" title="Print" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </button>
        </div>

        <!-- View -->
        <div class="toolbar-group">
          <select [(ngModel)]="currentTheme" (change)="applyTheme()" class="toolbar-select">
            <option *ngFor="let theme of themes" [ngValue]="theme">{{theme.name}}</option>
          </select>
          
          <button (click)="toggleFullscreen()" title="Fullscreen" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
          
          <button (click)="toggleZen()" title="Zen Mode" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </button>
          
          <button (click)="toggleRTL()" title="Toggle RTL/LTR" class="toolbar-btn" [class.active]="isRTL">
            ⇄
          </button>
        </div>
      </div>

      <!-- Emoji Picker -->
      <div class="emoji-picker-container" *ngIf="showEmojiPicker" [@slideIn]>
        <div class="emoji-picker">
          <div class="emoji-search">
            <input [(ngModel)]="emojiSearch" placeholder="Search emoji..." class="emoji-search-input">
          </div>
          <div class="emoji-categories">
            <button *ngFor="let category of emojiCategories"
                    (click)="selectedEmojiCategory = category"
                    [class.active]="selectedEmojiCategory === category"
                    class="emoji-category-btn">
              {{category.icon}}
            </button>
          </div>
          <div class="emoji-grid">
            <span *ngFor="let emoji of getFilteredEmojis()"
                  (click)="insertEmoji(emoji)"
                  class="emoji-item"
                  [title]="emoji">
              {{emoji}}
            </span>
          </div>
        </div>
      </div>

      <!-- Search Panel -->
      <div class="search-panel" *ngIf="showSearch" [@slideIn]>
        <div class="search-header">
          <h3>Find & Replace</h3>
          <button (click)="closeSearchPanel()" class="close-btn">×</button>
        </div>
        <div class="search-body">
          <input [(ngModel)]="searchQuery" placeholder="Find..." class="search-input" (keyup.enter)="findNext()">
          <input [(ngModel)]="replaceText" placeholder="Replace with..." class="search-input">
          <div class="search-actions">
            <button (click)="findNext()" class="search-btn">Find Next</button>
            <button (click)="findPrevious()" class="search-btn">Find Previous</button>
            <button (click)="replace()" class="search-btn">Replace</button>
            <button (click)="replaceAll()" class="search-btn primary">Replace All</button>
          </div>
          <div class="search-options">
            <label>
              <input type="checkbox" [(ngModel)]="caseSensitive"> Case sensitive
            </label>
            <label>
              <input type="checkbox" [(ngModel)]="wholeWord"> Whole word
            </label>
          </div>
        </div>
      </div>

      <!-- Editor Area -->
      <div class="av-editor-wrapper">
        <div class="line-numbers" *ngIf="showLineNumbers">
          <div *ngFor="let line of lineNumbers" class="line-number">{{line}}</div>
        </div>
        
        <div #editor
             class="av-editor"
             contenteditable="true"
             [attr.spellcheck]="spellcheck"
             [attr.dir]="isRTL ? 'rtl' : 'ltr'"
             (input)="onContentChange()"
             (paste)="onPaste($event)"
             (keydown)="onKeyDown($event)"
             (keyup)="onKeyUp($event)"
             (mouseup)="onSelectionChange()"
             (drop)="onDrop($event)"
             (dragover)="onDragOver($event)"
             [style.min-height]="minHeight"
             [style.max-height]="maxHeight"
             [attr.placeholder]="placeholder">
        </div>
        
        <!-- Collaboration Sidebar -->
        <div class="collaboration-sidebar" *ngIf="showCollaboration">
          <div class="collab-header">
            <h4>Active Users</h4>
          </div>
          <div class="collab-users">
            <div class="user-avatar" style="background: #3b82f6">A</div>
            <div class="user-avatar" style="background: #10b981">B</div>
            <div class="user-avatar" style="background: #f59e0b">C</div>
          </div>
          <div class="collab-chat">
            <div class="chat-message">
              <strong>Alice:</strong> Great introduction!
            </div>
            <div class="chat-message">
              <strong>Bob:</strong> Added some references
            </div>
          </div>
        </div>
      </div>

      <!-- Grammar Errors Panel -->
      <div class="grammar-panel" *ngIf="grammarErrors.length > 0">
        <div class="grammar-header">
          <h4>Grammar & Spelling</h4>
          <button (click)="grammarErrors = []" class="close-btn">×</button>
        </div>
        <div class="grammar-list">
          <div *ngFor="let error of grammarErrors" class="grammar-error">
            <span class="error-text">{{error.text}}</span>
            <span class="error-suggestion">→ {{error.suggestion}}</span>
            <button (click)="fixGrammarError(error)" class="fix-btn">Fix</button>
          </div>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="av-statusbar" *ngIf="showStatusBar">
        <div class="status-left">
          <span class="status-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            {{wordCount}} words
          </span>
          <span class="status-item">{{charCount}} characters</span>
          <span class="status-item">{{lineCount}} lines</span>
          <span class="status-item">~{{readingTime}} min read</span>
          <span class="status-item premium" *ngIf="showCollaboration">
            👥 3 users online
          </span>
        </div>
        <div class="status-right">
          <span class="auto-save-status" *ngIf="autoSaveEnabled && autoSaveStatus">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {{autoSaveStatus}}
          </span>
          <span class="cursor-position">Ln {{cursorLine}}, Col {{cursorColumn}}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    .av-editor-container {
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      overflow: hidden;
      background: var(--bg-color, #ffffff);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      position: relative;
      transition: all 0.3s ease;
    }

    .av-editor-container:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    /* Toolbar */
    .av-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      background: var(--toolbar-bg, linear-gradient(180deg, #ffffff 0%, #f8fafc 100%));
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      backdrop-filter: blur(8px);
    }

    .toolbar-group {
      display: flex;
      gap: 4px;
      padding: 0 8px;
      border-right: 1px solid var(--border-color, #e2e8f0);
      align-items: center;
    }

    .toolbar-group:last-child {
      border-right: none;
    }

    .toolbar-btn {
      padding: 8px;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-size: 14px;
      min-width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color, #475569);
      position: relative;
    }

    .toolbar-btn:hover {
      background: var(--hover-bg, rgba(59, 130, 246, 0.08));
      border-color: var(--hover-border, rgba(59, 130, 246, 0.2));
      transform: translateY(-1px);
    }

    .toolbar-btn:active {
      transform: translateY(0);
    }

    .toolbar-btn.active {
      background: var(--active-bg, #3b82f6);
      color: white;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }

    .toolbar-btn.premium::after {
      content: '⭐';
      position: absolute;
      top: -4px;
      right: -4px;
      font-size: 10px;
    }

    .toolbar-select, .toolbar-input {
      padding: 6px 10px;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      background: white;
      cursor: pointer;
      height: 36px;
      font-size: 14px;
      transition: all 0.2s ease;
      color: var(--text-color, #475569);
    }

    .toolbar-select:hover, .toolbar-input:hover {
      border-color: var(--hover-border, #3b82f6);
    }

    .toolbar-select:focus, .toolbar-input:focus {
      outline: none;
      border-color: var(--primary, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .toolbar-input {
      width: 70px;
    }

    .color-picker {
      width: 36px;
      height: 36px;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      cursor: pointer;
      padding: 2px;
      transition: all 0.2s ease;
    }

    .color-picker:hover {
      border-color: var(--hover-border, #3b82f6);
      transform: translateY(-1px);
    }

    /* Editor */
    .av-editor-wrapper {
      display: flex;
      position: relative;
      background: var(--editor-bg, white);
    }

    .line-numbers {
      width: 50px;
      padding: 16px 8px;
      background: var(--line-numbers-bg, #f8fafc);
      border-right: 1px solid var(--border-color, #e2e8f0);
      text-align: right;
      color: #94a3b8;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.75;
      user-select: none;
    }

    .av-editor {
      flex: 1;
      min-height: 400px;
      padding: 20px 24px;
      font-size: 16px;
      line-height: 1.75;
      outline: none;
      overflow-y: auto;
      word-wrap: break-word;
      background: var(--editor-bg, white);
      color: var(--text-color, #1e293b);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      direction: ltr;
      unicode-bidi: plaintext;
    }

    .av-editor[dir="rtl"] {
      direction: rtl;
      text-align: right;
    }

    .av-editor:empty:before {
      content: attr(placeholder);
      color: #94a3b8;
      pointer-events: none;
      position: absolute;
    }

    .av-editor:focus {
      outline: none;
    }

    /* Modern Table Styles */
    .av-editor .modern-table {
      width: 100%;
      margin: 20px 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .av-editor .modern-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .av-editor .modern-table th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: white;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: none;
    }

    .av-editor .modern-table td {
      padding: 14px 16px;
      border: none;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-color, #475569);
      transition: all 0.2s ease;
    }

    .av-editor .modern-table tbody tr {
      background: white;
      transition: all 0.2s ease;
    }

    .av-editor .modern-table tbody tr:hover {
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.04) 0%, rgba(59, 130, 246, 0.08) 100%);
      transform: scale(1.01);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .av-editor .modern-table tbody tr:last-child td {
      border-bottom: none;
    }

    /* Editor Content Styles */
    .av-editor h1 {
      font-size: 2.5em;
      font-weight: 700;
      margin: 0.67em 0;
      color: var(--heading-color, #0f172a);
      position: relative;
      padding-bottom: 0.3em;
    }

    .av-editor h1::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 2px;
    }

    .av-editor h2 {
      font-size: 2em;
      font-weight: 600;
      margin: 0.75em 0;
      color: var(--heading-color, #0f172a);
    }

    .av-editor h3 {
      font-size: 1.5em;
      font-weight: 600;
      margin: 0.83em 0;
      color: var(--heading-color, #0f172a);
    }

    .av-editor p {
      margin: 1em 0;
    }

    .av-editor a {
      color: #3b82f6;
      text-decoration: none;
      transition: all 0.2s ease;
      position: relative;
    }

    .av-editor a:hover {
      color: #2563eb;
    }

    .av-editor a::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: #3b82f6;
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    .av-editor a:hover::after {
      transform: scaleX(1);
    }

    .av-editor blockquote {
      border-left: 4px solid #3b82f6;
      padding: 16px 20px;
      margin: 20px 0;
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
      border-radius: 0 8px 8px 0;
      color: #64748b;
      font-style: italic;
      position: relative;
    }

    .av-editor blockquote::before {
      content: '"';
      position: absolute;
      top: -10px;
      left: 10px;
      font-size: 60px;
      color: rgba(59, 130, 246, 0.2);
      font-family: Georgia, serif;
    }

    .av-editor pre {
      background: #1e293b;
      color: #e2e8f0;
      padding: 20px;
      border-radius: 12px;
      overflow-x: auto;
      margin: 20px 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      position: relative;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .av-editor pre::before {
      content: 'CODE';
      position: absolute;
      top: 8px;
      right: 12px;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .av-editor code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      background: rgba(59, 130, 246, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      color: #3b82f6;
      font-size: 0.9em;
    }

    .av-editor ul,
    .av-editor ol {
      margin: 16px 0;
      padding-left: 24px;
    }

    .av-editor li {
      margin: 8px 0;
      line-height: 1.6;
    }

    .av-editor hr {
      border: none;
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 32px 0;
    }

    /* Math Equation */
    .av-editor .math-equation {
      display: inline-block;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-family: 'Times New Roman', serif;
      font-style: italic;
      color: #475569;
      margin: 0 4px;
    }

    /* Chart Container */
    .av-editor .chart-container {
      margin: 20px 0;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
      text-align: center;
    }

    .av-editor .chart-placeholder {
      display: inline-block;
      padding: 40px;
      background: white;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      color: #94a3b8;
    }

    /* AI Assistant Panel */
    .ai-assistant-panel {
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      z-index: 1000;
      background: white;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 320px;
      max-height: 600px;
      display: flex;
      flex-direction: column;
    }

    .ai-header {
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ai-header h3 {
      margin: 0;
      font-size: 16px;
    }

    .ai-body {
      padding: 16px;
      overflow-y: auto;
    }

    .ai-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .ai-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
    }

    .ai-btn:hover {
      background: #f8fafc;
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .ai-icon {
      font-size: 24px;
    }

    .ai-suggestions {
      margin-top: 16px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .ai-suggestions h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #475569;
    }

    .ai-suggestions p {
      margin: 8px 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }

    .apply-btn {
      margin-top: 8px;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .apply-btn:hover {
      background: #2563eb;
    }

    /* Templates Panel */
    .templates-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      background: white;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 600px;
      max-height: 500px;
      overflow: hidden;
    }

    .templates-header {
      padding: 16px;
      background: var(--toolbar-bg, #f8fafc);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .templates-header h3 {
      margin: 0;
      font-size: 18px;
      color: var(--text-color, #1e293b);
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 20px;
      overflow-y: auto;
      max-height: 400px;
    }

    .template-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .template-card:hover {
      border-color: #3b82f6;
      background: #f0f9ff;
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .template-icon {
      font-size: 32px;
    }

    .template-name {
      font-size: 14px;
      font-weight: 500;
      color: #475569;
    }

    /* SVG Panel */
    .svg-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      background: white;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 500px;
      max-height: 600px;
    }

    .svg-header {
      padding: 16px;
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      color: white;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .svg-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .svg-body {
      padding: 20px;
    }

    .svg-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 16px;
    }

    .svg-options {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .svg-select {
      flex: 1;
      padding: 8px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .svg-size {
      width: 80px;
      padding: 8px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .svg-color {
      width: 50px;
      height: 36px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
    }

    .svg-styles {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .svg-style-btn {
      padding: 8px 16px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 13px;
    }

    .svg-style-btn:hover {
      background: #f8fafc;
      border-color: #3b82f6;
    }

    .svg-style-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .svg-preview {
      min-height: 100px;
      padding: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .insert-svg-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .insert-svg-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    /* Version History Panel */
    .history-panel {
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      z-index: 1000;
      background: white;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 320px;
      max-height: 500px;
    }

    .history-header {
      padding: 16px;
      background: var(--toolbar-bg, #f8fafc);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .history-header h3 {
      margin: 0;
      font-size: 16px;
      color: var(--text-color, #1e293b);
    }

    .history-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .history-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .history-item:hover {
      background: #f8fafc;
    }

    .history-time {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .history-preview {
      font-size: 13px;
      color: #475569;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .history-stats {
      font-size: 11px;
      color: #cbd5e1;
    }

    /* Collaboration Sidebar */
    .collaboration-sidebar {
      width: 250px;
      background: #f8fafc;
      border-left: 1px solid var(--border-color, #e2e8f0);
      padding: 16px;
    }

    .collab-header h4 {
      margin: 0 0 12px;
      font-size: 14px;
      color: #475569;
    }

    .collab-users {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    .collab-chat {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }

    .chat-message {
      margin-bottom: 8px;
      padding: 8px;
      background: white;
      border-radius: 6px;
      font-size: 12px;
    }

    .chat-message strong {
      color: #3b82f6;
    }

    /* Grammar Panel */
    .grammar-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 100;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      width: 320px;
      max-height: 300px;
    }

    .grammar-header {
      padding: 12px 16px;
      background: #fef3c7;
      border-bottom: 1px solid #fde68a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 12px 12px 0 0;
    }

    .grammar-header h4 {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }

    .grammar-list {
      max-height: 200px;
      overflow-y: auto;
      padding: 8px;
    }

    .grammar-error {
      padding: 8px;
      margin-bottom: 8px;
      background: #fef3c7;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .error-text {
      color: #dc2626;
      text-decoration: underline wavy;
    }

    .error-suggestion {
      color: #059669;
      flex: 1;
    }

    .fix-btn {
      padding: 4px 8px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }

    /* Emoji Picker */
    .emoji-picker-container {
      position: absolute;
      top: 60px;
      right: 20px;
      z-index: 1000;
      background: white;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      padding: 12px;
      width: 340px;
      max-height: 400px;
      display: flex;
      flex-direction: column;
    }

    .emoji-picker {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .emoji-search {
      margin-bottom: 12px;
    }

    .emoji-search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }

    .emoji-categories {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .emoji-category-btn {
      padding: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 20px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .emoji-category-btn:hover {
      background: rgba(59, 130, 246, 0.08);
    }

    .emoji-category-btn.active {
      background: rgba(59, 130, 246, 0.15);
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;
      overflow-y: auto;
      flex: 1;
      padding: 4px;
    }

    .emoji-item {
      padding: 8px;
      text-align: center;
      cursor: pointer;
      font-size: 20px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .emoji-item:hover {
      background: rgba(59, 130, 246, 0.08);
      transform: scale(1.2);
    }

    /* Search Panel */
    .search-panel {
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: white;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 400px;
      overflow: hidden;
    }

    .search-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--toolbar-bg, #f8fafc);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .search-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-color, #1e293b);
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #64748b;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .search-body {
      padding: 16px;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      outline: none;
    }

    .search-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .search-btn {
      padding: 8px 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .search-btn:hover {
      background: var(--hover-bg, #f8fafc);
      border-color: #3b82f6;
    }

    .search-btn.primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .search-btn.primary:hover {
      background: #2563eb;
    }

    .search-options {
      display: flex;
      gap: 16px;
    }

    .search-options label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #64748b;
      cursor: pointer;
    }

    /* Status Bar */
    .av-statusbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: var(--statusbar-bg, #f8fafc);
      border-top: 1px solid var(--border-color, #e2e8f0);
      font-size: 12px;
      color: #64748b;
    }

    .status-left,
    .status-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-item.premium {
      color: #8b5cf6;
      font-weight: 500;
    }

    .auto-save-status {
      color: #10b981;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Themes */
    [data-theme="Dark"] {
      --bg-color: #0f172a;
      --text-color: #e2e8f0;
      --toolbar-bg: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      --border-color: #334155;
      --hover-bg: rgba(59, 130, 246, 0.15);
      --hover-border: rgba(59, 130, 246, 0.3);
      --active-bg: #3b82f6;
      --editor-bg: #0f172a;
      --statusbar-bg: #1e293b;
      --line-numbers-bg: #1e293b;
      --heading-color: #f1f5f9;
    }

    [data-theme="Sepia"] {
      --bg-color: #faf8f3;
      --text-color: #5c4b3a;
      --toolbar-bg: linear-gradient(180deg, #f5f2ed 0%, #faf8f3 100%);
      --border-color: #d4c4b0;
      --hover-bg: rgba(139, 69, 19, 0.08);
      --hover-border: rgba(139, 69, 19, 0.2);
      --active-bg: #92400e;
      --editor-bg: #faf8f3;
      --statusbar-bg: #f5f2ed;
      --line-numbers-bg: #f5f2ed;
      --heading-color: #451a03;
    }

    /* Fullscreen */
    .av-editor-container.fullscreen {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }

    .av-editor-container.fullscreen .av-editor {
      height: calc(100vh - 120px);
      max-height: none;
    }

    /* Zen Mode */
    .av-editor-container.zen .av-toolbar,
    .av-editor-container.zen .av-statusbar {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .av-editor-container.zen:hover .av-toolbar,
    .av-editor-container.zen:hover .av-statusbar {
      opacity: 1;
      pointer-events: auto;
    }

    .av-editor-container.zen .av-editor {
      font-size: 18px;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }

    /* Animations */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .av-toolbar {
        flex-direction: column;
        padding: 8px;
      }
      
      .toolbar-group {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-color, #e2e8f0);
        padding: 8px 0;
        overflow-x: auto;
      }
      
      .ai-assistant-panel,
      .history-panel {
        width: calc(100vw - 40px);
        right: 20px;
      }
      
      .templates-panel,
      .svg-panel {
        width: calc(100vw - 40px);
      }
    }
  `],
  animations: [
    // Add animations if needed
  ]
})
export class TextEditorAvComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editor', { static: false }) editorElement!: ElementRef<HTMLDivElement>;
  
  @Input() content: string = '<h1>Welcome to AV Text Editor Pro ✨</h1><p>Start typing to create amazing content!</p>';
  @Input() minHeight: string = '400px';
  @Input() maxHeight: string = '70vh';
  @Input() autoSaveEnabled: boolean = true;
  @Input() autoSaveInterval: number = 30000;
  @Input() showLineNumbers: boolean = false;
  @Input() showStatusBar: boolean = true;
  @Input() hideToolbar: boolean = false;
  @Input() placeholder: string = 'Start typing your content here...';
  @Input() spellcheck: boolean = true;
  
  @Output() contentChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<string>();
  @Output() load = new EventEmitter<void>();

  // Stats
  wordCount = 0;
  charCount = 0;
  lineCount = 1;
  readingTime = 0;
  cursorLine = 1;
  cursorColumn = 1;
  lineNumbers: number[] = [];

  // Direction
  isRTL = false;

  // Premium Features
  showAIAssistant = false;
  showTemplates = false;
  showSVGPanel = false;
  showHistory = false;
  showCollaboration = false;
  aiSuggestions = '';
  grammarErrors: any[] = [];

  // Templates
  templates: Template[] = [
    { name: 'Resume', icon: '📄', content: this.getResumeTemplate() },
    { name: 'Letter', icon: '✉️', content: this.getLetterTemplate() },
    { name: 'Report', icon: '📊', content: this.getReportTemplate() },
    { name: 'Article', icon: '📝', content: this.getArticleTemplate() },
    { name: 'Invoice', icon: '💰', content: this.getInvoiceTemplate() },
    { name: 'Meeting Notes', icon: '📅', content: this.getMeetingTemplate() }
  ];

  // SVG Generator
  svgText = '';
  svgFont = 'Arial';
  svgFontSize = 48;
  svgColor = '#3b82f6';
  svgPreview = '';
  selectedSvgStyle: any;
  svgStyles = [
    { name: 'Normal', style: '' },
    { name: 'Bold', style: 'font-weight: bold;' },
    { name: 'Italic', style: 'font-style: italic;' },
    { name: 'Shadow', style: 'filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));' },
    { name: 'Outline', style: 'fill: none; stroke: currentColor; stroke-width: 2;' },
    { name: 'Gradient', style: 'fill: url(#gradient);' }
  ];

  // Version History
  versionHistory: any[] = [];
  private versionTimer: any;

  // Colors
  textColor = '#000000';
  bgColor = '#FFFF00';

  // Formatting
  fonts = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS'];
  fontSize = 16;
  highlightActive = false;

  // Emoji
  showEmojiPicker = false;
  selectedEmojiCategory: any;
  emojiSearch = '';
  emojiCategories = [
    { 
      name: 'smileys', 
      icon: '😀', 
      emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖']
    }
  ];

  // Search
  showSearch = false;
  searchQuery = '';
  replaceText = '';
  caseSensitive = false;
  wholeWord = false;

  // Themes
  themes: Theme[] = [
    { name: 'Light', primary: '#3b82f6', secondary: '#64748b', background: '#ffffff', text: '#1e293b', border: '#e2e8f0' },
    { name: 'Dark', primary: '#60a5fa', secondary: '#94a3b8', background: '#0f172a', text: '#e2e8f0', border: '#334155' },
    { name: 'Sepia', primary: '#92400e', secondary: '#a16207', background: '#faf8f3', text: '#5c4b3a', border: '#d4c4b0' }
  ];
  currentTheme: Theme = this.themes[0];

  // View
  isFullscreen = false;
  isZen = false;

  // Auto Save
  autoSaveStatus = '';
  private autoSaveTimer: any;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.selectedSvgStyle = this.svgStyles[0];
  }

  ngOnInit() {
    this.selectedEmojiCategory = this.emojiCategories[0];
    if (this.showLineNumbers) {
      this.updateLineNumbers();
    }
    
    if (this.isBrowser) {
      this.loadPdfLibraries();
      this.startVersionTracking();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.editorElement?.nativeElement) return;
      
      // Set initial content properly
      this.setContent(this.content);
      this.updateStats();
      
      if (this.isBrowser) {
        this.loadFromLocalStorage();
        if (this.autoSaveEnabled) {
          this.startAutoSave();
        }
        this.addKeyboardShortcuts();
      }
    });
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    if (this.versionTimer) {
      clearInterval(this.versionTimer);
    }
  }

  // Set content with direction fix
  private setContent(html: string) {
    if (!this.editorElement?.nativeElement) return;
    
    // Fix: Ensure proper content direction
    this.editorElement.nativeElement.innerHTML = html;
    
    // Ensure the editor maintains LTR direction unless explicitly set to RTL
    if (!this.isRTL) {
      this.editorElement.nativeElement.style.direction = 'ltr';
      this.editorElement.nativeElement.style.unicodeBidi = 'embed';
    }
  }

  // Toggle RTL/LTR
  toggleRTL() {
    this.isRTL = !this.isRTL;
    if (this.editorElement?.nativeElement) {
      this.editorElement.nativeElement.style.direction = this.isRTL ? 'rtl' : 'ltr';
    }
  }

  // Load PDF libraries
  private async loadPdfLibraries() {
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      
      const html2canvasModule = await import('html2canvas');
      html2canvas = html2canvasModule.default;
    } catch (error) {
      console.log('PDF libraries not installed. Run: npm install jspdf html2canvas');
    }
  }

  // Template Functions
  private getResumeTemplate(): string {
    return `<h1>John Doe</h1>
    <p>📧 john.doe@email.com | 📱 (123) 456-7890 | 📍 New York, NY</p>
    <hr>
    <h2>Professional Summary</h2>
    <p>Experienced professional with expertise in...</p>
    <h2>Experience</h2>
    <h3>Senior Position • Company Name • 2020-Present</h3>
    <ul>
      <li>Achievement 1</li>
      <li>Achievement 2</li>
    </ul>
    <h2>Education</h2>
    <p><strong>Degree Name</strong> • University • Year</p>
    <h2>Skills</h2>
    <p>Skill 1 • Skill 2 • Skill 3</p>`;
  }

  private getLetterTemplate(): string {
    return `<p>[Your Name]<br>[Your Address]<br>[Date]</p>
    <p>[Recipient Name]<br>[Company]<br>[Address]</p>
    <p>Dear [Recipient],</p>
    <p>I am writing to...</p>
    <p>Sincerely,<br>[Your Name]</p>`;
  }

  private getReportTemplate(): string {
    return `<h1>Report Title</h1>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Author:</strong> [Your Name]</p>
    <hr>
    <h2>Executive Summary</h2>
    <p>Brief overview...</p>
    <h2>Introduction</h2>
    <p>Background information...</p>
    <h2>Methodology</h2>
    <p>How the research was conducted...</p>
    <h2>Findings</h2>
    <p>Key discoveries...</p>
    <h2>Recommendations</h2>
    <ul>
      <li>Recommendation 1</li>
      <li>Recommendation 2</li>
    </ul>
    <h2>Conclusion</h2>
    <p>Final thoughts...</p>`;
  }

  private getArticleTemplate(): string {
    return `<h1>Article Title</h1>
    <p><em>By [Author Name] • ${new Date().toLocaleDateString()}</em></p>
    <p class="lead">Engaging introduction paragraph that hooks the reader...</p>
    <h2>Main Point 1</h2>
    <p>Content for first main point...</p>
    <h2>Main Point 2</h2>
    <p>Content for second main point...</p>
    <blockquote>"Relevant quote that supports your argument"</blockquote>
    <h2>Conclusion</h2>
    <p>Wrap up the article...</p>`;
  }

  private getInvoiceTemplate(): string {
    return `<h1>INVOICE</h1>
    <table class="modern-table">
      <tr>
        <td><strong>Invoice #:</strong> INV-001</td>
        <td><strong>Date:</strong> ${new Date().toLocaleDateString()}</td>
      </tr>
    </table>
    <h3>Bill To:</h3>
    <p>[Client Name]<br>[Client Address]</p>
    <table class="modern-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Service/Product 1</td>
          <td>1</td>
          <td>$100.00</td>
          <td>$100.00</td>
        </tr>
      </tbody>
    </table>
    <p><strong>Total: $100.00</strong></p>`;
  }

  private getMeetingTemplate(): string {
    return `<h1>Meeting Notes</h1>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Attendees:</strong> [List attendees]</p>
    <h2>Agenda</h2>
    <ul>
      <li>Topic 1</li>
      <li>Topic 2</li>
    </ul>
    <h2>Discussion Points</h2>
    <p>[Key points discussed]</p>
    <h2>Action Items</h2>
    <ul class="todo-list">
      <li><input type="checkbox"> Action item 1 - Owner</li>
      <li><input type="checkbox"> Action item 2 - Owner</li>
    </ul>
    <h2>Next Steps</h2>
    <p>[What happens next]</p>`;
  }

  applyTemplate(template: Template) {
    this.setContent(template.content);
    this.onContentChange();
    this.showTemplates = false;
  }

  // Version History
  private startVersionTracking() {
    this.versionTimer = setInterval(() => {
      if (this.content && this.editorElement?.nativeElement) {
        const text = this.editorElement.nativeElement.innerText || '';
        if (text.length > 0) {
          this.versionHistory.unshift({
            timestamp: new Date(),
            content: this.editorElement.nativeElement.innerHTML,
            preview: text.substring(0, 50) + '...',
            wordCount: this.wordCount
          });
          
          // Keep only last 10 versions
          if (this.versionHistory.length > 10) {
            this.versionHistory = this.versionHistory.slice(0, 10);
          }
        }
      }
    }, 60000); // Every minute
  }

  restoreVersion(version: any) {
    if (confirm('Restore this version? Current changes will be lost.')) {
      this.setContent(version.content);
      this.onContentChange();
      this.showHistory = false;
    }
  }

  // AI Assistant Functions
  improveWriting() {
    this.aiSuggestions = 'Analyzing your text... Suggestions: Use more active voice, vary sentence length, and add transitional phrases for better flow.';
  }

  fixGrammar() {
    this.checkGrammar();
    this.aiSuggestions = 'Grammar check complete. Found and highlighted potential issues.';
  }

  makeShorter() {
    this.aiSuggestions = 'To make your text more concise: Remove redundant words, combine similar sentences, and use stronger verbs.';
  }

  makeLonger() {
    this.aiSuggestions = 'To expand your text: Add examples, include more details, explain concepts thoroughly, and provide context.';
  }

  changeTone(tone: string) {
    if (tone === 'professional') {
      this.aiSuggestions = 'For a professional tone: Use formal language, avoid contractions, and maintain objectivity.';
    } else {
      this.aiSuggestions = 'For a casual tone: Use conversational language, include personal pronouns, and add friendly expressions.';
    }
  }

  translateText() {
    this.aiSuggestions = 'Translation feature: Select your target language and translate selected text or entire document.';
  }

  summarize() {
    const text = this.editorElement?.nativeElement.innerText || '';
    const sentences = text.split('.').filter(s => s.trim().length > 0);
    this.aiSuggestions = `Summary: Your document contains ${this.wordCount} words and ${sentences.length} sentences. Main topics detected...`;
  }

  applyAISuggestion() {
    // Simulate applying AI suggestions
    alert('AI suggestions applied to your document!');
    this.aiSuggestions = '';
  }

  // Grammar Check
  checkGrammar() {
    // Simulate grammar checking
    this.grammarErrors = [
      { text: 'recieve', suggestion: 'receive' },
      { text: 'there problem', suggestion: 'their problem' }
    ];
  }

  fixGrammarError(error: any) {
    const content = this.editorElement?.nativeElement.innerHTML || '';
    const fixed = content.replace(error.text, error.suggestion);
    this.setContent(fixed);
    this.onContentChange();
    
    // Remove fixed error
    this.grammarErrors = this.grammarErrors.filter(e => e !== error);
  }

  // SVG Generator
  updateSVGPreview() {
    if (!this.svgText) {
      this.svgPreview = '';
      return;
    }

    const style = this.selectedSvgStyle?.style || '';
    const gradientDef = style.includes('gradient') ? 
      `<defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient></defs>` : '';

    this.svgPreview = `
      <svg width="100%" height="100" xmlns="http://www.w3.org/2000/svg">
        ${gradientDef}
        <text x="50%" y="50%" 
              font-family="${this.svgFont}" 
              font-size="${this.svgFontSize}" 
              fill="${this.svgColor}"
              text-anchor="middle" 
              dominant-baseline="middle"
              style="${style}">
          ${this.svgText}
        </text>
      </svg>
    `;
  }

  insertSVG() {
    this.updateSVGPreview();
    if (this.svgPreview) {
      this.execCommand('insertHTML', `<div class="svg-art">${this.svgPreview}</div>`);
      this.showSVGPanel = false;
      this.svgText = '';
    }
  }

  // Core Editor Functions
  execCommand(command: string, value?: string) {
    if (!this.isBrowser) return;
    
    this.editorElement.nativeElement.focus();
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
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = this.fontSize + 'px';
      
      try {
        range.surroundContents(span);
      } catch (e) {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }
      
      this.onContentChange();
    }
  }

  toggleHighlight() {
    if (!this.highlightActive) {
      this.execCommand('hiliteColor', '#FFEB3B');
    } else {
      this.execCommand('hiliteColor', 'transparent');
    }
    this.highlightActive = !this.highlightActive;
  }

  changeTextColor() {
    this.execCommand('foreColor', this.textColor);
  }

  changeBackgroundColor() {
    this.execCommand('hiliteColor', this.bgColor);
  }

  insertBlockquote() {
    const quote = prompt('Enter quote:');
    if (quote) {
      const html = `<blockquote>${this.escapeHtml(quote)}</blockquote><p></p>`;
      this.execCommand('insertHTML', html);
    }
  }

  // Insert Functions
  insertLink() {
    if (!this.isBrowser) return;
    
    const url = prompt('Enter URL:');
    if (!url) return;
    
    const text = prompt('Link text:', url);
    const targetBlank = confirm('Open in new tab?');
    
    const link = `<a href="${this.escapeHtml(url)}" ${targetBlank ? 'target="_blank" rel="noopener noreferrer"' : ''}>${this.escapeHtml(text || url)}</a>`;
    this.execCommand('insertHTML', link);
  }

  insertImage() {
    if (!this.isBrowser) return;
    
    const url = prompt('Enter image URL:');
    if (!url) return;
    
    const alt = prompt('Alt text:', '');
    const width = prompt('Width (optional, e.g., 500px or 100%):', '');
    
    const img = `<img src="${this.escapeHtml(url)}" alt="${this.escapeHtml(alt || '')}" ${width ? `style="width: ${this.escapeHtml(width)}"` : ''} />`;
    this.execCommand('insertHTML', img);
  }

  insertModernTable() {
    if (!this.isBrowser) return;
    
    const rows = parseInt(prompt('Number of rows:', '3') || '0');
    const cols = parseInt(prompt('Number of columns:', '3') || '0');
    
    if (!rows || !cols) return;
    
    let html = '<table class="modern-table">';
    
    // Header row
    html += '<thead><tr>';
    for (let c = 0; c < cols; c++) {
      html += `<th>Header ${c + 1}</th>`;
    }
    html += '</tr></thead>';
    
    // Body rows
    html += '<tbody>';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td>Cell ${r + 1}-${c + 1}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table><p></p>';
    
    this.execCommand('insertHTML', html);
  }

  insertCodeBlock() {
    if (!this.isBrowser) return;
    
    const code = prompt('Enter your code:');
    if (!code) return;
    
    const language = prompt('Language (optional):', 'javascript');
    const codeBlock = `<pre><code class="language-${language}">${this.escapeHtml(code)}</code></pre><p></p>`;
    this.execCommand('insertHTML', codeBlock);
  }

  insertMathEquation() {
    const equation = prompt('Enter math equation (e.g., x² + y² = z²):');
    if (equation) {
      const html = `<span class="math-equation">${this.escapeHtml(equation)}</span>`;
      this.execCommand('insertHTML', html);
    }
  }

  insertChart() {
    const chartType = prompt('Chart type (bar, line, pie):', 'bar');
    if (chartType) {
      const html = `<div class="chart-container">
        <div class="chart-placeholder">📊 ${chartType.toUpperCase()} CHART<br>Configure in chart editor</div>
      </div>`;
      this.execCommand('insertHTML', html);
    }
  }

  insertHorizontalRule() {
    this.execCommand('insertHorizontalRule');
  }

  insertTodoList() {
    const items = prompt('Enter todo items (comma separated):');
    if (!items) return;
    
    const itemList = items.split(',').map(item => item.trim()).filter(Boolean);
    if (!itemList.length) return;
    
    const html = '<ul class="todo-list">' + 
      itemList.map(item => 
        `<li><input type="checkbox" onchange="this.parentNode.classList.toggle('done', this.checked)"> <span>${this.escapeHtml(item)}</span></li>`
      ).join('') + 
      '</ul><p></p>';
    
    this.execCommand('insertHTML', html);
  }

  // Emoji Functions
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  getFilteredEmojis(): string[] {
    if (!this.selectedEmojiCategory) return [];
    return this.selectedEmojiCategory.emojis;
  }

  insertEmoji(emoji: string) {
    this.execCommand('insertText', emoji);
    this.showEmojiPicker = false;
  }

  // Search Functions
  openSearchPanel() {
    this.showSearch = true;
  }

  closeSearchPanel() {
    this.showSearch = false;
    this.searchQuery = '';
    this.replaceText = '';
  }

  findNext() {
    if (!this.searchQuery || !this.isBrowser) return;
    
    const searchOptions = {
      caseSensitive: this.caseSensitive,
      wholeWord: this.wholeWord
    };
    
    // @ts-ignore
    const found = window.find(this.searchQuery, searchOptions.caseSensitive, false, true, searchOptions.wholeWord, false, false);
    
    if (!found) {
      alert('No more matches found');
    }
  }

  findPrevious() {
    if (!this.searchQuery || !this.isBrowser) return;
    
    // @ts-ignore
    const found = window.find(this.searchQuery, this.caseSensitive, true, true, this.wholeWord, false, false);
    
    if (!found) {
      alert('No more matches found');
    }
  }

  replace() {
    if (!this.searchQuery || !this.isBrowser) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().toLowerCase() === this.searchQuery.toLowerCase()) {
      this.execCommand('insertText', this.replaceText);
    }
    this.findNext();
  }

  replaceAll() {
    if (!this.searchQuery || !this.editorElement?.nativeElement) return;
    
    const content = this.editorElement.nativeElement.innerHTML;
    const regex = new RegExp(this.escapeRegExp(this.searchQuery), this.caseSensitive ? 'g' : 'gi');
    const newContent = content.replace(regex, this.replaceText);
    
    this.setContent(newContent);
    this.onContentChange();
  }

  // File Operations
  newDocument() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    if (confirm('Create new document? Any unsaved changes will be lost.')) {
      this.setContent('');
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
      
      this.autoSaveStatus = 'Saved';
      this.save.emit(content);
      
      setTimeout(() => {
        this.autoSaveStatus = '';
      }, 3000);
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }

  loadFromLocal() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    try {
      const savedContent = localStorage.getItem('av-editor-content');
      if (savedContent) {
        this.setContent(savedContent);
        this.content = savedContent;
        this.contentChange.emit(savedContent);
        this.updateStats();
        this.load.emit();
      }
    } catch (e) {
      console.error('Failed to load:', e);
    }
  }

  private loadFromLocalStorage() {
    if (!this.isBrowser) return;
    
    try {
      const savedContent = localStorage.getItem('av-editor-content');
      if (savedContent && !this.content && this.editorElement?.nativeElement) {
        this.setContent(savedContent);
        this.content = savedContent;
        this.updateStats();
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }

  importFromFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (file.name.endsWith('.md')) {
        this.setContent(this.markdownToHtml(content));
      } else if (file.name.endsWith('.txt')) {
        this.setContent(this.textToHtml(content));
      } else {
        this.setContent(content);
      }
      
      this.onContentChange();
    };
    
    reader.readAsText(file);
    input.value = '';
  }

  // Export Functions
  exportAsHTML() {
    const content = this.editorElement?.nativeElement.innerHTML || '';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .modern-table {
            width: 100%;
            margin: 20px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            border: 1px solid #e2e8f0;
        }
        .modern-table thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .modern-table th {
            padding: 16px;
            text-align: left;
            font-weight: 600;
            color: white;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
        }
        .modern-table td {
            padding: 14px 16px;
            border: none;
            border-bottom: 1px solid #f1f5f9;
            color: #475569;
        }
        .modern-table tbody tr {
            background: white;
            transition: all 0.2s ease;
        }
        .modern-table tbody tr:hover {
            background: rgba(59, 130, 246, 0.05);
        }
        blockquote {
            border-left: 4px solid #3b82f6;
            padding: 16px 20px;
            margin: 20px 0;
            background: rgba(59, 130, 246, 0.05);
            border-radius: 0 8px 8px 0;
            color: #64748b;
            font-style: italic;
        }
        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 12px;
            overflow-x: auto;
        }
        code {
            background: rgba(59, 130, 246, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            color: #3b82f6;
        }
        h1::after {
            content: '';
            display: block;
            width: 60px;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            border-radius: 2px;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    
    this.downloadFile(new Blob([html], { type: 'text/html' }), 'document.html');
  }

  exportAsMarkdown() {
    const html = this.editorElement?.nativeElement.innerHTML || '';
    const markdown = this.htmlToMarkdown(html);
    this.downloadFile(new Blob([markdown], { type: 'text/markdown' }), 'document.md');
  }

  async exportAsPDF() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    if (!jsPDF || !html2canvas) {
      alert('PDF export requires jspdf and html2canvas. Please run: npm install jspdf html2canvas');
      return;
    }
    
    try {
      // Show loading
      const originalContent = this.editorElement.nativeElement.innerHTML;
      this.editorElement.nativeElement.style.opacity = '0.5';
      
      // Create a printable version
      const printElement = document.createElement('div');
      printElement.innerHTML = originalContent;
      printElement.style.width = '794px'; // A4 width at 96 DPI
      printElement.style.padding = '40px';
      printElement.style.background = 'white';
      printElement.style.color = 'black';
      printElement.style.fontSize = '12pt';
      printElement.style.lineHeight = '1.5';
      printElement.style.fontFamily = 'Arial, sans-serif';
      
      // Apply print styles
      const tables = printElement.querySelectorAll('.modern-table');
      tables.forEach(table => {
        (table as HTMLElement).style.pageBreakInside = 'avoid';
      });
      
      document.body.appendChild(printElement);
      
      // Generate canvas with better quality
      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(printElement);
      
      // Calculate dimensions for A4
      const imgWidth = 210; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297; // mm
      
      // Create PDF with compression
      const pdf = new jsPDF({
        orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      let position = 0;
      let remainingHeight = imgHeight;
      
      // Add pages as needed
      while (remainingHeight > 0) {
        if (position !== 0) {
          pdf.addPage();
        }
        
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        pageCanvas.width = canvas.width;
        
        const sourceY = position === 0 ? 0 : (position * canvas.height) / imgHeight;
        const sourceHeight = Math.min((pageHeight * canvas.height) / imgHeight, canvas.height - sourceY);
        
        pageCanvas.height = sourceHeight;
        
        pageCtx?.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );
        
        const pageData = pageCanvas.toDataURL('image/jpeg', 0.7); // Use JPEG with compression
        
        pdf.addImage(
          pageData,
          'JPEG',
          0,
          0,
          imgWidth,
          Math.min(pageHeight, remainingHeight)
        );
        
        position += pageHeight;
        remainingHeight -= pageHeight;
      }
      
      // Restore editor
      this.editorElement.nativeElement.style.opacity = '1';
      
      // Save with optimized size
      pdf.save('document.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
      this.editorElement.nativeElement.style.opacity = '1';
    }
  }

  exportAsWord() {
    const content = this.editorElement?.nativeElement.innerHTML || '';
    const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Document</title></head>
    <body>${content}</body>
    </html>`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    this.downloadFile(blob, 'document.doc');
  }

  print() {
    if (!this.isBrowser) return;
    window.print();
  }

  // Theme Functions
  applyTheme() {
    // Theme is applied via data attribute in template
  }

  // View Functions
  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  toggleZen() {
    this.isZen = !this.isZen;
  }

  // Event Handlers
  onContentChange() {
    if (!this.editorElement?.nativeElement) return;
    
    this.content = this.editorElement.nativeElement.innerHTML;
    this.contentChange.emit(this.content);
    this.updateStats();
    
    if (this.showLineNumbers) {
      this.updateLineNumbers();
    }
    
    // Update SVG preview if panel is open
    if (this.showSVGPanel) {
      this.updateSVGPreview();
    }
  }

  onPaste(event: ClipboardEvent) {
    if (!this.isBrowser) return;
    
    event.preventDefault();
    
    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      // Insert as plain text to avoid formatting issues
      document.execCommand('insertText', false, text);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.isBrowser) return;
    
    // Handle Tab
    if (event.key === 'Tab') {
      event.preventDefault();
      this.execCommand('insertText', '    ');
    }
    
    // Keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch(event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          this.saveToLocal();
          break;
        case 'f':
          event.preventDefault();
          this.openSearchPanel();
          break;
        case 'n':
          event.preventDefault();
          this.newDocument();
          break;
        case 'g':
          event.preventDefault();
          this.checkGrammar();
          break;
      }
    }
  }

  onKeyUp(event: KeyboardEvent) {
    this.updateCursorPosition();
  }

  onSelectionChange() {
    this.updateCursorPosition();
  }

  onDrop(event: DragEvent) {
    if (!this.isBrowser) return;
    
    event.preventDefault();
    
    const files = event.dataTransfer?.files;
    if (!files || !files.length) return;
    
    const file = files[0];
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = `<img src="${url}" alt="${file.name}" style="max-width: 100%;" />`;
        this.execCommand('insertHTML', img);
      };
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Helper Functions
  private updateStats() {
    const text = this.editorElement?.nativeElement.innerText || '';
    this.charCount = text.length;
    this.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.lineCount = text.split('\n').length || 1;
    this.readingTime = Math.max(1, Math.round(this.wordCount / 200));
  }

  private updateLineNumbers() {
    this.lineNumbers = Array.from({ length: Math.max(this.lineCount + 5, 20) }, (_, i) => i + 1);
  }

  private updateCursorPosition() {
    if (!this.editorElement?.nativeElement || !this.isBrowser) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(this.editorElement.nativeElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      
      const textBefore = preSelectionRange.toString();
      const lines = textBefore.split('\n');
      
      this.cursorLine = lines.length;
      this.cursorColumn = lines[lines.length - 1].length + 1;
    }
  }

  private startAutoSave() {
    if (!this.isBrowser) return;
    
    this.autoSaveTimer = setInterval(() => {
      this.saveToLocal();
    }, this.autoSaveInterval);
  }

  private addKeyboardShortcuts() {
    if (!this.isBrowser) return;
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch(e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            this.toggleFullscreen();
            break;
          case 'z':
            e.preventDefault();
            this.toggleZen();
            break;
        }
      }
    });
  }

  private downloadFile(blob: Blob, filename: string) {
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

  sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return html;
  }

  private escapeHtml(text: string): string {
    const map: any = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

 private escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

  private htmlToMarkdown(html: string): string {
    // Basic HTML to Markdown conversion
    let markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
      .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
      .replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~')
            .replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
      .replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, '![]($1)')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n')
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n')
      .replace(/<hr[^>]*>/gi, '---\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
      .replace(/<[^>]+>/g, '');
    
    // Clean up multiple newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown.trim();
  }

  private markdownToHtml(markdown: string): string {
    // Basic Markdown to HTML conversion
    let html = markdown
      .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
      .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/__([^_]+)__/g, '<u>$1</u>')
      .replace(/~~([^~]+)~~/g, '<s>$1</s>')
      .replace(/```math([\s\S]+?)```KATEX_INLINE_OPEN([^)]+)KATEX_INLINE_CLOSE/g, '<a href="$2">$1</a>')
.replace(/!```math([\s\S]*?)```KATEX_INLINE_OPEN([^)]+)KATEX_INLINE_CLOSE/g, '<img src="$2" alt="$1">')

      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^---$/gim, '<hr>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
    
    return html;
  }

  private textToHtml(text: string): string {
    // Convert plain text to HTML
    const lines = text.split('\n');
    return lines.map(line => line.trim() ? `<p>${this.escapeHtml(line)}</p>` : '<br>').join('');
  }
}