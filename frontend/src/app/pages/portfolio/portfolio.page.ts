import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { PortfolioProject } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { CatalogStore } from '../../core/services/catalog.store';
import { formatInt } from '../../core/utils/format';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PortfolioCardComponent } from '../../shared/components/portfolio-card/portfolio-card.component';

@Component({
  selector: 'app-portfolio-page',
  imports: [RouterLink, IconComponent, PortfolioCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio.page.html',
  styleUrl: './portfolio.page.scss',
})
export class PortfolioPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly catalog = inject(CatalogStore);

  /** Bound from `?technologia=` and `?odvetvie=` query params. */
  readonly technologia = input<string>();
  readonly odvetvie = input<string>();

  protected readonly projects = signal<PortfolioProject[]>([]);
  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  protected readonly sectors = computed(() =>
    [...new Set(this.projects().map((p) => p.client_sector))].sort((a, b) => a.localeCompare(b, 'sk')),
  );

  protected readonly technologies = computed(() => {
    const used = new Set(this.projects().map((p) => p.technology.slug));
    return this.catalog.technologies().filter((t) => used.has(t.slug));
  });

  protected readonly filtered = computed(() => {
    const tech = this.technologia();
    const sector = this.odvetvie();
    return this.projects().filter(
      (p) => (!tech || p.technology.slug === tech) && (!sector || p.client_sector === sector),
    );
  });

  protected readonly totals = computed(() => {
    const items = this.projects();
    return {
      projects: items.length,
      pieces: formatInt(items.reduce((sum, p) => sum + p.quantity_produced, 0)),
      sectors: this.sectors().length,
    };
  });

  constructor() {
    this.catalog.load();
    this.load();
  }

  protected load(): void {
    this.status.set('loading');
    this.api.getPortfolio().subscribe({
      next: (items) => {
        this.projects.set(items);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  protected setFilter(key: 'technologia' | 'odvetvie', value: string | null): void {
    void this.router.navigate([], {
      queryParams: { [key]: value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected clearFilters(): void {
    void this.router.navigate([], {
      queryParams: { technologia: null, odvetvie: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected techShort(name: string): string {
    return name.split(' (')[0];
  }
}
