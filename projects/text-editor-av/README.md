TextEditorAv

🚀 Ultimate Free Angular Text Editor
Powerful, feature-rich, and free text editor for Angular applications.

📦 Installation
npm install text-editor-av --save


or

yarn add text-editor-av

🚀 Usage
Import the Module
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TextEditorAvModule } from 'text-editor-av';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, TextEditorAvModule],
  bootstrap: [AppComponent]
})
export class AppModule {}

Use in Component
<text-editor-av [(ngModel)]="content"></text-editor-av>

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  content: string = '';
}

👨‍💻 Author

Abhishek Rout

LinkedIn: abhishekrout1999

Email: abhishekrout128@gmail.com

📄 License

MIT © Abhishek Rout

⭐ If you like this package, please give it a star on GitHub!