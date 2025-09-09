import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextEditorAvComponent } from './text-editor-av.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    TextEditorAvComponent
  ],
  exports: [TextEditorAvComponent]
})
export class TextEditorAvModule { }