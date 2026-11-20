import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PrintMaterial } from '../../../core/models/api.models';
import { swatchFor } from '../../../core/utils/format';
import { EurPipe } from '../../pipes/eur.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-material-card',
  imports: [RouterLink, IconComponent, EurPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <header class="card__head">
        <span class="badge">
          <app-icon [name]="material().technology.icon_name" />
          {{ techShort() }}
        </span>
        @if (material().is_featured) {
          <span class="badge badge--success">Odporúčaný</span>
        }
      </header>

      <h3 class="card__title">
        <a [routerLink]="['/technologie-a-materialy', material().slug]">{{ title().main }}</a>
      </h3>
      @if (title().sub) {
        <p class="card__sub">{{ title().sub }}</p>
      }
      <p class="card__desc">{{ material().short_description }}</p>

      <ul class="tag-list card__tags" aria-label="Kľúčové vlastnosti">
        @for (tag of material().properties_tags.slice(0, 3); track tag) {
          <li class="tag">{{ tag }}</li>
        }
      </ul>

      <dl class="card__specs">
        <div>
          <dt><app-icon name="thermometer" /> Max. teplota</dt>
          <dd class="mono">{{ material().max_temp_celsius ?? '—' }} °C</dd>
        </div>
        <div>
          <dt><app-icon name="gauge" /> Pevnosť v ťahu</dt>
          <dd class="mono">{{ material().tensile_strength_mpa ?? '—' }} MPa</dd>
        </div>
      </dl>

      <div class="card__colors" aria-label="Dostupné farby">
        @for (color of material().available_colors; track color) {
          <span
            class="swatch"
            [class.swatch--clear]="color === 'Transparentná'"
            [style.background]="swatch(color)"
            [title]="color"
          ></span>
        }
        <span class="card__colors-label">{{ material().available_colors.length }} farieb</span>
      </div>

      <footer class="card__foot">
        <div class="card__price">
          <span class="card__price-label">od</span>
          <span class="mono card__price-value">{{ material().price_per_gram_eur | eur: true }}</span>
          <span class="card__price-label">/ g</span>
        </div>
        <a class="btn btn--link" [routerLink]="['/technologie-a-materialy', material().slug]">
          Technický list <app-icon name="arrow-right" />
        </a>
      </footer>
    </article>
  `,
  styleUrl: './material-card.component.scss',
})
export class MaterialCardComponent {
  readonly material = input.required<PrintMaterial>();

  /** Splits "PETG (Mechanicky a chemicky odolný)" into title + subtitle. */
  protected readonly title = computed(() => {
    const match = /^(.*?)\s*\((.*)\)\s*$/.exec(this.material().name);
    return match ? { main: match[1], sub: match[2] } : { main: this.material().name, sub: '' };
  });

  protected readonly techShort = computed(() => this.material().technology.name.split(' (')[0]);

  protected swatch(color: string): string {
    return swatchFor(color);
  }
}
