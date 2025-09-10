import { Component } from '@angular/core';
import { TextEditorAvComponent } from '../../../text-editor-av/src/lib/text-editor-av.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TextEditorAvComponent],
  template: `
    <div class="container">
      <header>
        <h1>AV Text Editor Demo</h1>
        <p>A modern, feature-rich text editor for Angular</p>
      </header>
      
      <main>
        <av-text-editor
          [content]="editorContent"
          [autoSaveEnabled]="true"
          [autoSaveInterval]="10000"
          [showStatusBar]="true"
          [showLineNumbers]="false"
          [spellcheck]="true"
          placeholder="Start writing your amazing content..."
          (contentChange)="onContentChange($event)"
          (save)="onSave($event)"
          (load)="onLoad()">
        </av-text-editor>
      </main>
      
      <footer>
        <p>Made with ❤️ using Angular</p>
      </footer>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: #666;
    }
  `]
})
export class AppComponent {
  editorContent = `
    <h1>Welcome to AV Text Editor! 🎉</h1>
    <p>This is a <strong>powerful</strong> and <em>flexible</em> text editor with many features:</p>
    <ul>
      <li>✅ Rich text formatting</li>
      <li>✅ Tables and lists</li>
      <li>✅ Code blocks with syntax highlighting</li>
      <li>✅ Image and video embedding</li>
      <li>✅ Export to PDF, HTML, and Markdown</li>
      <li>✅ Auto-save functionality</li>
      <li>✅ Dark mode support</li>
    </ul>
    <p>Try out all the features using the toolbar above!</p>
  `;

  onContentChange(content: string) {
    console.log('Content updated:', content.substring(0, 100) + '...');
  }

  onSave(content: string) {
    console.log('Content saved successfully!');
    // Here you can send the content to your backend
  }

  onLoad() {
    console.log('Content loaded from local storage');
  }
}