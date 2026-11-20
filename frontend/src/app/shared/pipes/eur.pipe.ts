import { Pipe, PipeTransform } from '@angular/core';

import { formatEur } from '../../core/utils/format';

/** `{{ price | eur }}` → "12,40 €"; `{{ price | eur: true }}` keeps up to 3 decimals. */
@Pipe({ name: 'eur' })
export class EurPipe implements PipeTransform {
  transform(value: number | string | null | undefined, precise = false): string {
    if (value === null || value === undefined) return '—';
    return formatEur(value, precise);
  }
}
