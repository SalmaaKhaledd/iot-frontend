import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSelect implements OnChanges {
  private readonly elRef = inject(ElementRef);

  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  readonly isOpen = signal(false);
  readonly selectedLabel = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.updateLabel(this.value);
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  select(option: SelectOption): void {
    this.value = option.value;
    this.selectedLabel.set(option.label);
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }

  private updateLabel(value: string): void {
    const found = this.options.find(o => o.value === value);
    this.selectedLabel.set(found ? found.label : '');
  }
}