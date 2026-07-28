import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pagination-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination-bar" *ngIf="totalElements > 0">
      <span class="range-text">{{ rangeText }} alerts</span>
      <div class="pagination-actions">
        <button (click)="prev.emit()" [disabled]="currentPage === 1"
          class="nav-arrow" aria-label="Previous page">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <button (click)="next.emit()" [disabled]="currentPage * pageSize >= totalElements"
          class="nav-arrow" aria-label="Next page">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      flex: 0 0 auto;
      width: 100%;
      min-width: 0;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 54px;
      width: 100%;
      margin: 0;
      padding: 10px 16px;
      border-block: 1px solid var(--t-card-border);
      background: var(--t-metric-bg);
    }

    .range-text {
      min-width: 0;
      color: var(--t-text-secondary);
      font-size: 14px;
      font-weight: 500;
      line-height: 1.35;
    }

    .pagination-actions {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 8px;
    }

    .nav-arrow {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 1px solid var(--t-metric-border);
      border-radius: 6px;
      background: var(--t-chip-bg);
      color: var(--t-text-primary);
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
    }

    .nav-arrow:hover:not(:disabled),
    .nav-arrow:focus-visible:not(:disabled) {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: #ffffff;
      outline: none;
    }

    .nav-arrow:disabled {
      color: var(--t-text-muted);
      cursor: not-allowed;
      opacity: 0.45;
    }

    .nav-arrow mat-icon {
      display: block;
      width: 20px;
      height: 20px;
      font-size: 20px;
      line-height: 20px;
    }

    :host-context(body[data-theme="light"]) .pagination-bar {
      border-color: #e2e8f0;
      background: #f8fafc;
    }

    :host-context(body[data-theme="light"]) .range-text {
      color: #475569;
    }

    :host-context(body[data-theme="light"]) .nav-arrow {
      border-color: #cbd5e1;
      background: #ffffff;
      color: #0f172a;
    }
  `],
})
export class PaginationBarComponent {
  @Input({ required: true }) totalElements!: number;
  @Input({ required: true }) currentPage!: number;
  @Input({ required: true }) pageSize!: number;
  @Input({ required: true }) rangeText!: string;
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
}
