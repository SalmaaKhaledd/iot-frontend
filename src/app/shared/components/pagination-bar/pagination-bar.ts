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
})
export class PaginationBarComponent {
  @Input({ required: true }) totalElements!: number;
  @Input({ required: true }) currentPage!: number;
  @Input({ required: true }) pageSize!: number;
  @Input({ required: true }) rangeText!: string;
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
}