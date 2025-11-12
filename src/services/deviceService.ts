import { App, Platform } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

export class DeviceService {
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  static isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  static async exitApp(): Promise<void> {
    if (this.isNative()) {
      await App.exitApp();
    }
  }

  static async minimizeApp(): Promise<void> {
    if (this.isAndroid()) {
      // Pour Android, on peut utiliser une méthode native ou web
      (window as any).minimizeApp?.();
    }
  }

  static getStatusBarHeight(): number {
    // Retourne la hauteur de la status bar en pixels
    if (this.isAndroid()) {
      return 24; // Valeur approximative pour Android
    }
    if (this.isIOS()) {
      return 44; // Valeur approximative pour iOS
    }
    return 0;
  }

  static getSafeAreaInsets(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    if (this.isNative()) {
      // Retourne les insets pour éviter les zones système
      return {
        top: this.getStatusBarHeight(),
        right: 0,
        bottom: this.isAndroid() ? 16 : 34, // Navigation bar
        left: 0,
      };
    }
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  static async checkPermissions(): Promise<{
    camera: boolean;
    location: boolean;
    storage: boolean;
  }> {
    // À implémenter avec les plugins Capacitor
    return {
      camera: true,
      location: true,
      storage: true,
    };
  }
}