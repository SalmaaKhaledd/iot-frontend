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
          <button
            type="button"
            class="chip"
            [ngClass]="option.cssClass"
            [class.active]="activeValue === option.value"
            (click)="valueChange.emit(option.value)"
            [attr.aria-pressed]="activeValue === option.value">
            {{ option.label }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .filter-label {
      color: var(--t-text-secondary);
      font-size: 12px;
      font-weight: 500;
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-width: 0;
    }

    .chip {
      min-height: 32px;
      padding: 6px 14px;
      border: 1px solid var(--t-chip-border);
      border-radius: 8px;
      background: var(--t-chip-bg);
      color: var(--t-chip-text);
      font: inherit;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.35;
      white-space: nowrap;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .chip:hover {
      background: var(--t-chip-hover);
    }

    .chip.active {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: #ffffff;
    }
  `],
})
export class ChipFilterComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) options!: ChipOption[];
  @Input({ required: true }) activeValue!: string;
  @Output() valueChange = new EventEmitter<string>();
}
