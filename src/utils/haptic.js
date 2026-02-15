export function haptic(duration = 10) {
  if (navigator.vibrate) navigator.vibrate(duration);
}
export function hapticHeavy() { haptic(25); }
export function hapticSuccess() { if (navigator.vibrate) navigator.vibrate([10, 30, 10]); }
export function hapticError() { if (navigator.vibrate) navigator.vibrate([30, 20, 30]); }
