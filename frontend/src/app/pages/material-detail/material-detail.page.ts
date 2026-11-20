import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';

import { SITE_CONFIG } from '../../core/config/site.config';
import { PrintMaterialDetail } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { CatalogStore } from '../../core/services/catalog.store';
import { swatchFor } from '../../core/utils/format';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { MaterialCardComponent } from '../../shared/components/material-card/material-card.component';
import { EurPipe } from '../../shared/pipes/eur.pipe';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

/** Post-processing options offered per technology. */
const POST_PROCESSING: Record<string, { title: string; text: string }[]> = {
  fdm: [
    { title: 'Odstránenie podpôr a začistenie', text: 'Štandardne v cene – čisté hrany a funkčné plochy.' },
    { title: 'Brúsenie a lakovanie povrchu', text: 'Tmelenie, brúsenie a lak v odtieni RAL pre prezentačné diely.' },
    { title: 'Zalisovanie mosadzných závitových vložiek', text: 'Vložky M2 – M8 pre opakovanú montáž skrutiek.' },
  ],
  sla: [
    { title: 'UV dotvrdenie a umytie v IPA', text: 'Štandardne v cene – maximálne mechanické vlastnosti živice.' },
    { title: 'Brúsenie a lakovanie povrchu', text: 'Zrkadlový alebo matný povrch, lakovanie v odtieni RAL.' },
    { title: 'Leštenie do transparentna', text: 'Pre číre živice – svetlovody a vizualizačné modely.' },
  ],
  sls: [
    { title: 'Tryskanie povrchu', text: 'Štandardne v cene – jednotný jemne matný povrch.' },
    { title: 'Farbenie na čierno', text: 'Hĺbkové farbenie, ktoré sa neodiera ani pri poškriabaní.' },
    { title: 'Zalisovanie mosadzných závitových vložiek', text: 'Pre koncové diely s opakovanou montážou.' },
  ],
};

@Component({
  selector: 'app-material-detail-page',
  imports: [RouterLink, IconComponent, MaterialCardComponent, EurPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './material-detail.page.html',
  styleUrl: './material-detail.page.scss',
})
export class MaterialDetailPage {
  private readonly api = inject(ApiService);
  private readonly title = inject(Title);
  private readonly catalog = inject(CatalogStore);

  /** Bound from the `:slug` route param. */
  readonly slug = input.required<string>();

  protected readonly material = signal<PrintMaterialDetail | null>(null);
  protected readonly state = signal<LoadState>('loading');

  protected readonly titleParts = computed(() => {
    const name = this.material()?.name ?? '';
    const match = /^(.*?)\s*\((.*)\)\s*$/.exec(name);
    return match ? { main: match[1], sub: match[2] } : { main: name, sub: '' };
  });

  protected readonly postProcessing = computed(
    () => POST_PROCESSING[this.material()?.technology.slug ?? ''] ?? POST_PROCESSING['fdm'],
  );

  protected readonly related = computed(() => {
    const m = this.material();
    if (!m) return [];
    return (this.catalog.materialsByTechnology().get(m.technology.slug) ?? [])
      .filter((x) => x.slug !== m.slug)
      .slice(0, 3);
  });

  constructor() {
    this.catalog.load();
    toObservable(this.slug)
      .pipe(
        tap(() => this.state.set('loading')),
        switchMap((slug) =>
          this.api.getMaterial(slug).pipe(
            catchError((err: unknown) => {
              this.state.set(
                err instanceof HttpErrorResponse && err.status === 404 ? 'not-found' : 'error',
              );
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((material) => {
        if (!material) return;
        this.material.set(material);
        this.state.set('ready');
        this.title.setTitle(`${material.name} – technický list | ${SITE_CONFIG.studioName}`);
      });
  }

  protected swatch(color: string): string {
    return swatchFor(color);
  }

  protected techShort(name: string): string {
    return name.split(' (')[0];
  }
}
