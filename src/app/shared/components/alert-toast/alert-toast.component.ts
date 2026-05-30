import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface AlertToastData {
  title: string;
  message: string;
  type: 'traffic' | 'air-quality' | 'street-light';
  severity: 'info' | 'warning' | 'critical';
  icon: string;
}

@Component({
  selector: 'app-alert-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './alert-toast.component.html',
  styleUrl: './alert-toast.component.scss'
})
export class AlertToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: AlertToastData,
    public snackBarRef: MatSnackBarRef<AlertToastComponent>
  ) {}

  dismiss() {
    this.snackBarRef.dismiss();
  }
}
