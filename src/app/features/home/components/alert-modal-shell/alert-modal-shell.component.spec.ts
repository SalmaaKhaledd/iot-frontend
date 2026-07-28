import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AlertModalShellComponent } from './alert-modal-shell.component';

describe('AlertModalShellComponent', () => {
  let component: AlertModalShellComponent;
  let fixture: ComponentFixture<AlertModalShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertModalShellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertModalShellComponent);
    component = fixture.componentInstance;
  });

  it('renders an accessible dialog with the configured label', () => {
    component.ariaLabel = 'Traffic alerts';
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.alert-modal-shell') as HTMLElement;

    expect(shell.getAttribute('role')).toBe('dialog');
    expect(shell.getAttribute('aria-modal')).toBe('true');
    expect(shell.getAttribute('aria-label')).toBe('Traffic alerts');
  });

  it('emits close from the backdrop and close button', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    nativeElement.querySelector<HTMLElement>('.alert-modal-backdrop')?.click();
    nativeElement.querySelector<HTMLElement>('.alert-modal-close')?.click();

    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps the closeModal output as a compatibility alias', () => {
    const closeSpy = vi.fn();
    component.closeModal.subscribe(closeSpy);
    fixture.detectChanges();

    component.requestClose();

    expect(closeSpy).toHaveBeenCalledOnce();
  });
});
