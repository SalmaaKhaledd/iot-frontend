import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChipOption {
  label: string;
  value: string;
  cssClass?: string;
}

@Component({
  selector: 'app-chip-filter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-group">
      <span class="filter-label">{{ label }}</span>
      <div class="chip-row">
        @for (option of options; track option.value) {
          <div
            class="chip"
            [class]="option.cssClass || ''"
            [class.active]="activeValue === option.value"
            (click)="valueChange.emit(option.value)"
            (keydown.enter)="valueChange.emit(option.value)"
            (keydown.space)="valueChange.emit(option.value)"
            role="button"
            [attr.tabindex]="0"
            [attr.aria-pressed]="activeValue === option.value">
            {{ option.label }}
          </div>
        }
      </div>
    </div>
  `,
})
export class ChipFilterComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) options!: ChipOption[];
  @Input({ required: true }) activeValue!: string;
  @Output() valueChange = new EventEmitter<string>();
} 