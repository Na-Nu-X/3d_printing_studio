import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SITE_CONFIG } from '../../../core/config/site.config';
import { IconComponent } from '../icon/icon.component';
import { LogoComponent } from '../logo/logo.component';

interface NavLink {
  label: string;
  path: string;
  fragment?: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
})
export class NavbarComponent {
  private readonly document = inject(DOCUMENT);
  protected readonly config = SITE_CONFIG;
  protected readonly open = signal(false);
  protected readonly scrolled = signal(false);

  protected readonly links: NavLink[] = [
    { label: 'Technológie & Materiály', path: '/technologie-a-materialy' },
    { label: 'Realizácie', path: '/realizacie' },
    { label: '3D Modelovanie', path: '/3d-modelovanie' },
    { label: 'Ako objednať', path: '/', fragment: 'ako-objednat' },
  ];

  constructor() {
    const router = inject(Router);
    router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.open.set(false));

    // Lock page scroll while the mobile drawer is open.
    effect(() => {
      this.document.body.style.overflow = this.open() ? 'hidden' : '';
    });

    const win = this.document.defaultView;
    if (win) {
      const onScroll = () => this.scrolled.set(win.scrollY > 8);
      win.addEventListener('scroll', onScroll, { passive: true });
      inject(DestroyRef).onDestroy(() => win.removeEventListener('scroll', onScroll));
    }
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected close(): void {
    this.open.set(false);
  }
}
