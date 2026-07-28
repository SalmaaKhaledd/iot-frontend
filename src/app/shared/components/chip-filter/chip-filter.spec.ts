import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChipFilterComponent, ChipOption } from './chip-filter';

const mockOptions: ChipOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Low', value: 'low', cssClass: 'chip-success' },
  { label: 'High', value: 'high', cssClass: 'chip-error' },
];

describe('ChipFilterComponent', () => {
  let component: ChipFilterComponent;
  let fixture: ComponentFixture<ChipFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChipFilterComponent);
    component = fixture.componentInstance;
    component.label = 'Test Filter';
    component.options = mockOptions;
    component.activeValue = 'all';
    fixture.detectChanges();
  });

  it('renders the label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.filter-label')?.textContent?.trim()).toBe('Test Filter');
  });

  it('renders all options', () => {
    const chips = fixture.nativeElement.querySelectorAll('.chip');
    expect(chips.length).toBe(3);
  });

  it('marks the active chip correctly', () => {
    const chips = fixture.nativeElement.querySelectorAll('.chip');
    expect(chips[0].classList).toContain('active');
    expect(chips[1].classList).not.toContain('active');
  });

  it('emits valueChange on click', () => {
    const emitted: string[] = [];
    component.valueChange.subscribe((v: string) => emitted.push(v));
    const chips = fixture.nativeElement.querySelectorAll('.chip');
    chips[1].click();
    expect(emitted).toContain('low');
  });

  it('renders options as native button controls', () => {
    const el = fixture.nativeElement as HTMLElement;
    const chips = Array.from(el.querySelectorAll('.chip')) as HTMLButtonElement[];

    chips.forEach((chip) => {
      expect(chip.tagName).toBe('BUTTON');
      expect(chip.type).toBe('button');
    });
  });

  it('applies cssClass to chip when provided', () => {
    const chips = fixture.nativeElement.querySelectorAll('.chip');
    expect(chips[1].classList).toContain('chip-success');
    expect(chips[2].classList).toContain('chip-error');
  });
});
