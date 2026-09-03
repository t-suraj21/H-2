export interface RootState {
  appInitialized: boolean;
  authenticated: boolean;
  userId?: string;
  watchlistCount: number;
  alertsCount: number;
}

export const initialRootState: RootState = {
  appInitialized: true,
  authenticated: false,
  watchlistCount: 3,
  alertsCount: 2,
};
