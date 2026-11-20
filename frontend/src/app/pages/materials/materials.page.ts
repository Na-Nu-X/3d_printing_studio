import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { PrintMaterial } from '../../core/models/api.models';
import { CatalogStore } from '../../core/services/catalog.store';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { MaterialCardComponent } from '../../shared/components/material-card/material-card.component';
import { EurPipe } from '../../shared/pipes/eur.pipe';

type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'strength' | 'temperature';

const SORTERS: Record<SortKey, (a: PrintMaterial, b: PrintMaterial) => number> = {
  recommended: (a, b) => Number(b.is_featured) - Number(a.is_featured),
  'price-asc': (a, b) => Number(a.price_per_gram_eur) - Number(b.price_per_gram_eur),
  'price-desc': (a, b) => Number(b.price_per_gram_eur) - Number(a.price_per_gram_eur),
  strength: (a, b) => (b.tensile_strength_mpa ?? 0) - (a.tensile_strength_mpa ?? 0),
  temperature: (a, b) => (b.max_temp_celsius ?? 0) - (a.max_temp_celsius ?? 0),
};

/** Strip diacritics so "uhlik" matches "Uhlíkové vlákno". */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

@Component({
  selector: 'app-materials-page',
  imports: [RouterLink, IconComponent, MaterialCardComponent, EurPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './materials.page.html',
  styleUrl: './materials.page.scss',
})
export class MaterialsPage {
  private readonly router = inject(Router);
  protected readonly catalog = inject(CatalogStore);

  /** Bound from the `?technologia=` query param. */
  readonly technologia = input<string>();

  protected readonly search = signal('');
  protected readonly sort = signal<SortKey>('recommended');
  protected readonly sortOptions: { value: SortKey; label: string }[] = [
    { value: 'recommended', label: 'Odporúčané' },
    { value: 'price-asc', label: 'Cena: od najnižšej' },
    { value: 'price-desc', label: 'Cena: od najvyššej' },
    { value: 'strength', label: 'Pevnosť v ťahu' },
    { value: 'temperature', label: 'Teplotná odolnosť' },
  ];

  protected readonly activeTech = computed(() => {
    const slug = this.technologia();
    return this.catalog.technologies().find((t) => t.slug === slug) ?? null;
  });

  protected readonly filtered = computed(() => {
    const tech = this.activeTech()?.slug;
    const term = normalize(this.search().trim());
    return this.catalog
      .materials()
      .filter((m) => !tech || m.technology.slug === tech)
      .filter((m) => {
        if (!term) return true;
        const haystack = normalize(
          [m.name, m.short_description, m.technology.name, ...m.properties_tags].join(' '),
        );
        return haystack.includes(term);
      })
      .sort(SORTERS[this.sort()]);
  });

  constructor() {
    this.catalog.load();
  }

  protected selectTech(slug: string | null): void {
    void this.router.navigate([], {
      queryParams: { technologia: slug },
      replaceUrl: true,
    });
  }

  protected countFor(slug: string): number {
    return this.catalog.materialsByTechnology().get(slug)?.length ?? 0;
  }

  protected setSort(value: string): void {
    this.sort.set(value as SortKey);
  }

  protected resetFilters(): void {
    this.search.set('');
    this.selectTech(null);
  }

  protected techShort(name: string): string {
    return name.split(' (')[0];
  }

  protected materialShort(name: string): string {
    return name.split(' (')[0];
  }
}
