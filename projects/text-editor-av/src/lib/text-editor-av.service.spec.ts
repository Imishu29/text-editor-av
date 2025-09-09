import { TestBed } from '@angular/core/testing';

import { TextEditorAvService } from './text-editor-av.service';

describe('TextEditorAvService', () => {
  let service: TextEditorAvService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextEditorAvService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
