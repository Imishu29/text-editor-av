import { Component } from '@angular/core';
import { TextEditorAvComponent } from '../../../text-editor-av/src/lib/text-editor-av.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TextEditorAvComponent],
  template: `
    <div style="padding: 20px;">
      <h1>Text Editor Demo</h1>
      <av-text-editor
        [content]="editorContent"
        [autoSaveEnabled]="false"
        [showStatusBar]="true"
        (contentChange)="onContentChange($event)"
        (save)="onSave($event)">
      </av-text-editor>
    </div>
  `,
  styles: []
})
export class AppComponent {
  editorContent = '<p>Welcome to the editor!</p>';

  onContentChange(content: string) {
    console.log('Content changed');
  }

  onSave(content: string) {
    console.log('Content saved');
  }
}