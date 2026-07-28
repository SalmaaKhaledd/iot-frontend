import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PaginationBarComponent } from './pagination-bar';

async function createComponent(totalElements: number, currentPage: number, pageSize: number) {
  const fixture = TestBed.createComponent(PaginationBarComponent);
  const component = fixture.componentInstance;
  component.totalElements = totalElements;
  component.currentPage = currentPage;
  component.pageSize = pageSize;
  component.rangeText = `${currentPage}-${pageSize} of ${totalElements}`;
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, component };
}

describe('PaginationBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationBarComponent],
    }).compileComponents();
  });

  it('renders range text', async () => {
    const { fixture } = await createComponent(25, 1, 10);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.range-text')?.textContent).toContain('of 25');
  });

  it('hides when totalElements is 0', async () => {
    const { fixture } = await createComponent(0, 1, 10);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pagination-bar')).toBeNull();
  });

  it('disables prev button on first page', async () => {
    const { fixture } = await createComponent(25, 1, 10);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].disabled).toBe(true);
  });

  it('enables next button when more pages exist', async () => {
    const { fixture } = await createComponent(25, 1, 10);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[1].disabled).toBe(false);
  });

  it('disables next button on last page', async () => {
    const { fixture } = await createComponent(25, 3, 10);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[1].disabled).toBe(true);
  });

  it('emits prev when previous arrow is clicked', async () => {
    const { fixture, component } = await createComponent(25, 2, 10);
    const prevSpy = vi.fn();
    component.prev.subscribe(prevSpy);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();

    expect(prevSpy).toHaveBeenCalledOnce();
  });

  it('emits next when next arrow is clicked', async () => {
    const { fixture, component } = await createComponent(25, 1, 10);
    const nextSpy = vi.fn();
    component.next.subscribe(nextSpy);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();

    expect(nextSpy).toHaveBeenCalledOnce();
  });
});
