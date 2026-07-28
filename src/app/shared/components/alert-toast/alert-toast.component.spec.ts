import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { vi } from 'vitest';

import { AlertToastComponent, type AlertToastData } from './alert-toast.component';

describe('AlertToastComponent', () => {
  let component: AlertToastComponent;
  let fixture: ComponentFixture<AlertToastComponent>;
  let snackBarRef: {
    dismiss: ReturnType<typeof vi.fn>;
    dismissWithAction: ReturnType<typeof vi.fn>;
  };

  const toastData: AlertToastData = {
    title: 'Traffic Alert',
    message: 'Traffic density exceeded threshold.',
    type: 'traffic',
    severity: 'warning',
    icon: 'traffic',
  };

  beforeEach(async () => {
    snackBarRef = {
      dismiss: vi.fn(),
      dismissWithAction: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AlertToastComponent],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: toastData },
        { provide: MatSnackBarRef, useValue: snackBarRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders alert toast content', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.title')?.textContent?.trim()).toBe('Traffic Alert');
    expect(el.querySelector('.message')?.textContent?.trim()).toBe('Traffic density exceeded threshold.');
    expect(el.querySelector('.toast-open')?.getAttribute('aria-label')).toBe('Open Traffic Alert');
  });

  it('dismisses with action when the toast body is clicked', () => {
    const el = fixture.nativeElement as HTMLElement;

    el.querySelector<HTMLButtonElement>('.toast-open')?.click();

    expect(snackBarRef.dismissWithAction).toHaveBeenCalledOnce();
    expect(snackBarRef.dismiss).not.toHaveBeenCalled();
  });

  it('dismisses without action and stops propagation from the close button', () => {
    const event = new MouseEvent('click');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    component.dismiss(event);

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(snackBarRef.dismiss).toHaveBeenCalledOnce();
    expect(snackBarRef.dismissWithAction).not.toHaveBeenCalled();
  });
});
