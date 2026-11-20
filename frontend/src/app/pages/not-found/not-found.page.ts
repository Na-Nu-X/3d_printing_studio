import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container nf">
        <span class="nf__code mono">ERR 404 · ± 0.00 mm</span>
        <h1>Tento diel v našom katalógu nie je</h1>
        <p class="lead">Stránka, ktorú hľadáte, neexistuje alebo bola presunutá.</p>
        <div class="nf__actions">
          <a routerLink="/" class="btn btn--primary"><app-icon name="arrow-right" /> Na úvodnú stránku</a>
          <a routerLink="/technologie-a-materialy" class="btn btn--outline">Katalóg materiálov</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    @use 'mixins' as *;
    .nf {
      display: grid;
      justify-items: start;
      gap: sp(5);
      min-height: 50vh;
      align-content: center;
    }
    .nf__code {
      color: var(--c-accent-text);
      font-size: 0.85rem;
    }
    .nf__actions {
      display: flex;
      flex-wrap: wrap;
      gap: sp(3);
    }
  `,
})
export class NotFoundPage {}
