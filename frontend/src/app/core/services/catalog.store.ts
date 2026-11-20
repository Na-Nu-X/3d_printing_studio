import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { PrintMaterial, PrintTechnology } from '../models/api.models';
import { ApiService } from './api.service';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Signal-based cache of the technology & material catalog. The catalog is
 * small and shared by the estimator, the catalog page and the quote wizard,
 * so it is loaded once and reused.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly api = inject(ApiService);

  private readonly _technologies = signal<PrintTechnology[]>([]);
  private readonly _materials = signal<PrintMaterial[]>([]);
  private readonly _status = signal<LoadStatus>('idle');

  readonly technologies = this._technologies.asReadonly();
  readonly materials = this._materials.asReadonly();
  readonly status = this._status.asReadonly();
  readonly loading = computed(() => this._status() === 'loading' || this._status() === 'idle');
  readonly error = computed(() => this._status() === 'error');

  readonly materialsByTechnology = computed(() => {
    const groups = new Map<string, PrintMaterial[]>();
    for (const material of this._materials()) {
      const key = material.technology.slug;
      groups.set(key, [...(groups.get(key) ?? []), material]);
    }
    return groups;
  });

  /** Idempotent: triggers a request only if nothing is loaded or loading. */
  load(force = false): void {
    const status = this._status();
    if (!force && (status === 'loading' || status === 'ready')) return;
    this._status.set('loading');
    forkJoin({
      technologies: this.api.getTechnologies(),
      materials: this.api.getMaterials(),
    }).subscribe({
      next: ({ technologies, materials }) => {
        this._technologies.set(technologies);
        this._materials.set(materials);
        this._status.set('ready');
      },
      error: () => this._status.set('error'),
    });
  }

  findMaterial(slug: string | null | undefined): PrintMaterial | undefined {
    if (!slug) return undefined;
    return this._materials().find((m) => m.slug === slug);
  }
}
