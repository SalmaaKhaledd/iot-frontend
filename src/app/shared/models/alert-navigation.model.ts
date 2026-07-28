export type AlertNavigationType = 'traffic' | 'air-quality' | 'street-light';

export interface AlertNavigationTarget {
  type: AlertNavigationType;
  alertId: string;
}
