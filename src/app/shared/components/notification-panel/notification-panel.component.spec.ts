import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationPanelComponent } from './notification-panel.component';

describe('NotificationPanelComponent', () => {
  let component: NotificationPanelComponent;
  let fixture: ComponentFixture<NotificationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the unread badge count', () => {
    const badge = fixture.nativeElement.querySelector('.notify-badge') as HTMLElement;

    expect(component.unreadCount).toBe(3);
    expect(badge.textContent?.trim()).toBe('3');
  });

  it('toggles the panel and clears the expanded report when closed', () => {
    component.toggle();
    component.toggleReport('alert-2');

    expect(component.isOpen()).toBe(true);
    expect(component.expandedAlertId()).toBe('alert-2');

    component.close();

    expect(component.isOpen()).toBe(false);
    expect(component.expandedAlertId()).toBeNull();
  });

  it('collapses the panel when clicking outside', () => {
    component.toggle();

    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', {
      value: document.createElement('div'),
    });

    component.onDocumentClick(event);

    expect(component.isOpen()).toBe(false);
    expect(component.expandedAlertId()).toBeNull();
  });

  it('maps severity and alert types to the expected icons and labels', () => {
    expect(component.getSeverityIcon('critical')).toBe('error');
    expect(component.getSeverityIcon('warning')).toBe('warning');
    expect(component.getSeverityIcon('info')).toBe('info');

    expect(component.getTypeLabel('air-quality')).toBe('AIR QUALITY');
    expect(component.getTypeIcon('traffic')).toBe('traffic');
    expect(component.getTypeIcon('air-quality')).toBe('air');
    expect(component.getTypeIcon('street-light')).toBe('lightbulb');
  });
});