import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'sensorix-theme';

  readonly isDark = signal<boolean>(this.loadPreference());

  constructor() {
    // Apply theme on boot
    this.applyTheme(this.isDark());

    // Reactively apply whenever signal changes
    effect(() => {
      this.applyTheme(this.isDark());
    });
  }

  toggle(): void {
    this.isDark.set(!this.isDark());
    localStorage.setItem(this.STORAGE_KEY, this.isDark() ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean): void {
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  private loadPreference(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return stored === 'dark';
    // Default to dark
    return true;
  }
}
