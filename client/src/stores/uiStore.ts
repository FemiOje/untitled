/**
 * UI Store
 *
 * Zustand store for UI state management
 * Following death-mountain pattern for UI state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Loading states
  isConnecting: boolean;
  isTransactionPending: boolean;
  pendingTransactionHash: string | null;

  // Error states
  lastError: string | null;
  errorTimestamp: number | null;

  // Modal states
  showWalletModal: boolean;
  showSettingsModal: boolean;
  showHelpModal: boolean;
  showEventLogModal: boolean;

  // Camera/Viewport settings
  cameraPosition: { x: number; y: number; z: number };
  cameraZoom: number;

  // User preferences (persisted)
  soundEnabled: boolean;
  musicEnabled: boolean;
  showGrid: boolean;
  showCoordinates: boolean;
  theme: "dark" | "light";

  // Notifications
  notifications: Notification[];

  // Actions - Loading States
  setIsConnecting: (connecting: boolean) => void;
  setIsTransactionPending: (pending: boolean, txHash?: string) => void;

  // Actions - Error Management
  setError: (error: string) => void;
  clearError: () => void;

  // Actions - Modal Management
  setShowWalletModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setShowHelpModal: (show: boolean) => void;
  setShowEventLogModal: (show: boolean) => void;
  closeAllModals: () => void;

  // Actions - Camera Management
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setCameraZoom: (zoom: number) => void;
  resetCamera: () => void;

  // Actions - User Preferences
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setShowCoordinates: (show: boolean) => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleGrid: () => void;
  toggleCoordinates: () => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: number;
  duration?: number; // Auto-dismiss duration in ms
}

// Default camera settings
const DEFAULT_CAMERA = {
  position: { x: 10, y: 15, z: 10 },
  zoom: 1,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnecting: false,
      isTransactionPending: false,
      pendingTransactionHash: null,
      lastError: null,
      errorTimestamp: null,
      showWalletModal: false,
      showSettingsModal: false,
      showHelpModal: false,
      showEventLogModal: false,
      cameraPosition: DEFAULT_CAMERA.position,
      cameraZoom: DEFAULT_CAMERA.zoom,
      soundEnabled: true,
      musicEnabled: true,
      showGrid: true,
      showCoordinates: true,
      theme: "dark",
      notifications: [],

      // Loading States Actions
      setIsConnecting: (connecting: boolean) =>
        set({ isConnecting: connecting }),

      setIsTransactionPending: (pending: boolean, txHash?: string) =>
        set({
          isTransactionPending: pending,
          pendingTransactionHash: pending ? txHash || null : null,
        }),

      // Error Management Actions
      setError: (error: string) =>
        set({
          lastError: error,
          errorTimestamp: Date.now(),
        }),

      clearError: () =>
        set({
          lastError: null,
          errorTimestamp: null,
        }),

      // Modal Management Actions
      setShowWalletModal: (show: boolean) => set({ showWalletModal: show }),
      setShowSettingsModal: (show: boolean) =>
        set({ showSettingsModal: show }),
      setShowHelpModal: (show: boolean) => set({ showHelpModal: show }),
      setShowEventLogModal: (show: boolean) =>
        set({ showEventLogModal: show }),

      closeAllModals: () =>
        set({
          showWalletModal: false,
          showSettingsModal: false,
          showHelpModal: false,
          showEventLogModal: false,
        }),

      // Camera Management Actions
      setCameraPosition: (position: { x: number; y: number; z: number }) =>
        set({ cameraPosition: position }),

      setCameraZoom: (zoom: number) =>
        set({ cameraZoom: Math.max(0.5, Math.min(3, zoom)) }), // Clamp between 0.5 and 3

      resetCamera: () =>
        set({
          cameraPosition: DEFAULT_CAMERA.position,
          cameraZoom: DEFAULT_CAMERA.zoom,
        }),

      // User Preferences Actions
      setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
      setMusicEnabled: (enabled: boolean) => set({ musicEnabled: enabled }),
      setShowGrid: (show: boolean) => set({ showGrid: show }),
      setShowCoordinates: (show: boolean) => set({ showCoordinates: show }),
      setTheme: (theme: "dark" | "light") => set({ theme }),

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      toggleCoordinates: () =>
        set((state) => ({ showCoordinates: !state.showCoordinates })),

      // Notifications Actions
      addNotification: (notification) => {
        const id = `${Date.now()}-${Math.random()}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 5), // Keep last 5
        }));

        // Auto-dismiss if duration is set
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
      },

      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "untitled-ui-storage", // Storage key
      partialize: (state) => ({
        // Only persist user preferences
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        showGrid: state.showGrid,
        showCoordinates: state.showCoordinates,
        theme: state.theme,
        cameraZoom: state.cameraZoom,
      }),
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 */

export const useIsConnecting = () => useUIStore((state) => state.isConnecting);

export const useIsTransactionPending = () =>
  useUIStore((state) => state.isTransactionPending);

export const usePendingTransactionHash = () =>
  useUIStore((state) => state.pendingTransactionHash);

export const useLastError = () => useUIStore((state) => state.lastError);

export const useShowWalletModal = () =>
  useUIStore((state) => state.showWalletModal);

export const useShowSettingsModal = () =>
  useUIStore((state) => state.showSettingsModal);

export const useCameraSettings = () =>
  useUIStore((state) => ({
    position: state.cameraPosition,
    zoom: state.cameraZoom,
  }));

export const useUserPreferences = () =>
  useUIStore((state) => ({
    soundEnabled: state.soundEnabled,
    musicEnabled: state.musicEnabled,
    showGrid: state.showGrid,
    showCoordinates: state.showCoordinates,
    theme: state.theme,
  }));

export const useNotifications = () =>
  useUIStore((state) => state.notifications);

/**
 * Helper function to show success notification
 */
export const showSuccessNotification = (message: string, duration = 3000) => {
  useUIStore.getState().addNotification({
    type: "success",
    message,
    duration,
  });
};

/**
 * Helper function to show error notification
 */
export const showErrorNotification = (message: string, duration = 5000) => {
  useUIStore.getState().addNotification({
    type: "error",
    message,
    duration,
  });
};

/**
 * Helper function to show info notification
 */
export const showInfoNotification = (message: string, duration = 3000) => {
  useUIStore.getState().addNotification({
    type: "info",
    message,
    duration,
  });
};
