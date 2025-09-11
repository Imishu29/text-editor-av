<div align="center">

🚀 Free Alternative to CKEditor, TinyMCE, Quill for Angular

Created by Abhishek Rout
💼 LinkedIn
 | 💻 GitHub

</div> 

### 
✅ Why CKB Editor?

100% FREE – No hidden charges

All features included – No license required

Commercial use allowed

Lightweight – Small bundle size

Easy to use – Simple Angular integration

Modern – Works with Angular 12+

Feature Rich – Export to PDF/DOCX, Tables, Code blocks, Emojis, Dark mode, Auto-save

### 📦 Installation
Step 1: Install the package
npm install ckb-editor-angular --save

Step 2: Import the module

Add CkbEditorModule to your AppModule (or feature module):

// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Needed for [(ngModel)]
import { AppComponent } from './app.component';

// Import Editor Module
import { TextEditorAvComponent } from 'ckb-editor-angular';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    CkbEditorModule // ✅ Add editor module
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

Step 3: Use in your component




<!--  app.component.html -->

      <av-text-editor
  formControlName="content"
  placeholder="Write job description here..."
  [autoSaveEnabled]="false"
  [showStatusBar]="true"
  [spellcheck]="true"
  (contentChange)="careerForm.get('content')?.setValue($event)">
</av-text-editor>




### 📌 Angular Compatibility

This package supports Angular 12+

Angular Version	Install Command
Angular 12	npm install ckb-editor-angular@latest
Angular 13	npm install ckb-editor-angular@latest
Angular 14	npm install ckb-editor-angular@latest
Angular 15	npm install ckb-editor-angular@latest
Angular 16	npm install ckb-editor-angular@latest
Angular 17	npm install ckb-editor-angular@latest
📂 Peer Dependencies
"peerDependencies": {
  "@angular/common": ">=12.0.0",
  "@angular/core": ">=12.0.0"
}

### 👨‍💻 Author

<table> <tr> <td align="center"> <a href="https://www.linkedin.com/in/abhishekrout1999/"> <img src="https://avatars.githubusercontent.com/Imishu29" width="100px;" alt="Abhishek Rout"/> <br /> <sub><b>Abhishek Rout</b></sub> </a> <br /> <a href="https://www.linkedin.com/in/abhishekrout1999/" title="LinkedIn">💼</a> <a href="https://github.com/Imishu29" title="GitHub">💻</a> </td> </tr> </table>

### ⚡ CKB Editor Angular – A free, modern, feature-rich text editor for Angular developers.

## 📌 Note on Package Naming

You might notice that the main component is called **`TextEditorAvComponent`** but it comes from the package **`ckb-editor-angular`**.

This happened because the **first release** of this editor was published under the name **`text-editor-av`**.  
At that time, due to npm registry visibility issues, the package wasn’t showing up properly when searching on npm.  

To fix this, the package name was updated and republished as **`ckb-editor-angular`**.  
Since the component was already built and stable, its name (`TextEditorAvComponent`) was kept the same, but the official and maintained npm package is now **`ckb-editor-angular`**.

➡️ So don’t get confused — just install and use `ckb-editor-angular`. 