import type { Response } from 'express';

export const FLASH_COOKIE = 'flash';

export type ToastType = 'success' | 'error';

export interface Toast {
  type: ToastType;
  message: string;
}

export function setFlash(
  response: Response,
  type: ToastType,
  message: string,
): void {
  response.cookie(FLASH_COOKIE, { type, message } satisfies Toast, {
    httpOnly: true,
    sameSite: 'lax',
  });
}
