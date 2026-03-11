import type { AuthUser } from './types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function getStoredUser(): AuthUser | null {
  const stored = localStorage.getItem('auth_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export function formatCurrencyValue(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR');
}
