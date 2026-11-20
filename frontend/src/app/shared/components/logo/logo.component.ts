import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SITE_CONFIG } from '../../../core/config/site.config';

/** Wordmark driven by `site.config.ts`. The mark is a stylised stack of layers. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.inverse]': 'inverse()' },
  template: `
    <svg class="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="31" height="31" rx="3" class="frame" />
      <path d="M7 22h18" class="layer" />
      <path d="M9 18h14" class="layer" />
      <path d="M11 14h10" class="layer" />
      <path d="M13 10h6" class="layer accent" />
    </svg>
    <span class="word">
      <span class="primary">{{ config.wordmark.primary }}</span>
      <span class="secondary">{{ config.wordmark.secondary }}</span>
    </span>
  `,
  styles: `
    @use 'variables' as *;
    @use 'mixins' as *;

    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      color: $c-text;
    }
    :host(.inverse) {
      color: $c-on-carbon;
    }
    .mark {
      width: 34px;
      height: 34px;
    }
    .frame {
      fill: $c-carbon;
      stroke: $c-carbon;
    }
    :host(.inverse) .frame {
      fill: transparent;
      stroke: $c-carbon-line;
    }
    .layer {
      stroke: $c-on-carbon;
      stroke-width: 2.2;
      stroke-linecap: square;
      fill: none;
    }
    .accent {
      stroke: $c-accent;
    }
    .word {
      display: grid;
      line-height: 1;
    }
    .primary {
      font-family: $font-display;
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: 0.06em;
    }
    .secondary {
      @include eyebrow;
      font-size: 0.62rem;
      margin-top: 0.25rem;
      color: $c-text-3;
      letter-spacing: 0.14em;
    }
    :host(.inverse) .secondary {
      color: $c-on-carbon-muted;
    }
  `,
})
export class LogoComponent {
  readonly inverse = input(false);
  protected readonly config = SITE_CONFIG;
}
