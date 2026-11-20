import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PortfolioProject } from '../../../core/models/api.models';
import { formatInt } from '../../../core/utils/format';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-portfolio-card',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="pcard">
      <div class="pcard__media">
        <img
          [src]="imageSrc()"
          [alt]="project().title"
          loading="lazy"
          decoding="async"
          width="800"
          height="560"
        />
        <span class="pcard__sector">{{ project().client_sector }}</span>
      </div>
      <div class="pcard__body">
        <div class="pcard__meta">
          <span class="badge">
            <app-icon [name]="project().technology.icon_name" />
            {{ techShort() }}
          </span>
          @if (project().material; as material) {
            <a class="badge badge--accent" [routerLink]="['/technologie-a-materialy', material.slug]">
              {{ material.name.split(' (')[0] }}
            </a>
          }
        </div>
        <h3 class="pcard__title">{{ project().title }}</h3>
        @if (!compact()) {
          <p class="pcard__summary">{{ project().challenge_summary }}</p>
        }
        <dl class="pcard__specs">
          <div>
            <dt>Parametre tlače</dt>
            <dd>{{ project().production_specs }}</dd>
          </div>
          <div class="pcard__qty">
            <dt>Séria</dt>
            <dd class="mono">{{ qty() }} ks</dd>
          </div>
        </dl>
      </div>
    </article>
  `,
  styleUrl: './portfolio-card.component.scss',
})
export class PortfolioCardComponent {
  readonly project = input.required<PortfolioProject>();
  readonly compact = input(false);

  protected readonly qty = computed(() => formatInt(this.project().quantity_produced));
  protected readonly techShort = computed(() => this.project().technology.name.split(' (')[0]);
  protected readonly imageSrc = computed(() =>
    this.project().image_url.replace('w=1400', 'w=900'),
  );
}
