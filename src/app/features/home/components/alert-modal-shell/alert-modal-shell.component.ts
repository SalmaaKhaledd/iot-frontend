import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alert-modal-shell',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert-modal-backdrop" (click)="closeModal.emit()"></div>
    <div class="alert-modal-shell" role="dialog" aria-modal="true" [attr.aria-label]="ariaLabel">
      <div class="alert-modal-topbar">
        <button class="alert-modal-close" type="button" (click)="closeModal.emit()" aria-label="Close alerts">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="alert-modal-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class AlertModalShellComponent {
  @Input() ariaLabel = 'Alerts';
  @Output() readonly closeModal = new EventEmitter<void>();
}
