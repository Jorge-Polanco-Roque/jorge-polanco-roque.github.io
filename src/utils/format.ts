/**
 * Utilidades de formateo de números y fechas
 */

/**
 * Formatea un número con comas para miles y punto para decimales
 * Ejemplo: 12344654.54 → "12,344,654.54"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formatea un precio con el símbolo de dólar
 * Ejemplo: 1234.5 → "$1,234.50"
 */
export function formatPrice(value: number): string {
  return `$${formatNumber(value, 2)}`;
}

/**
 * Formatea una cantidad como moneda
 * Ejemplo: 1234.5 → "$1,234.50"
 */
export function formatCurrency(value: number): string {
  return `$${formatNumber(value, 2)}`;
}

/**
 * Formatea un número entero con comas
 * Ejemplo: 12345 → "12,345"
 */
export function formatInteger(value: number): string {
  return formatNumber(value, 0);
}

/**
 * Formatea un porcentaje
 * Ejemplo: 0.754 → "75.4%" (con 1 decimal por defecto)
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formatea una fecha en español
 * Ejemplo: new Date('2024-01-15') → "15 ene"
 */
export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return 'N/A';
  }
}

/**
 * Formatea una fecha completa en español
 * Ejemplo: new Date('2024-01-15') → "15 de enero de 2024"
 */
export function formatDateFull(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return 'N/A';
  }
}
