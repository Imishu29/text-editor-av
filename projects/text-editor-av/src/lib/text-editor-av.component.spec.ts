import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextEditorAvComponent } from './text-editor-av.component';

describe('TextEditorAvComponent', () => {
  let component: TextEditorAvComponent;
  let fixture: ComponentFixture<TextEditorAvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextEditorAvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TextEditorAvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
