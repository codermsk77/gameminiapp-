/** Лёгкая вибрация при действии (работает в Telegram Mini App) */
export function hapticLight(): void {
  try {
    const haptic = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void } } } }).Telegram?.WebApp?.HapticFeedback;
    haptic?.impactOccurred?.('light');
  } catch {
    // Игнорируем вне Telegram
  }
}

/** Тактильный отклик при выборе (например, наведение на точку) */
export function hapticSelection(): void {
  try {
    const haptic = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { selectionChanged: () => void } } } }).Telegram?.WebApp?.HapticFeedback;
    haptic?.selectionChanged?.();
  } catch {
    // Игнорируем вне Telegram
  }
}
