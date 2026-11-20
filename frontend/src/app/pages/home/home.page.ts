import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { PortfolioProject } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { CatalogStore } from '../../core/services/catalog.store';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { PortfolioCardComponent } from '../../shared/components/portfolio-card/portfolio-card.component';
import { InstantPrintPriceEstimatorComponent } from '../../shared/components/price-estimator/price-estimator.component';

interface Pillar {
  icon: IconName;
  metric: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, IconComponent, PortfolioCardComponent, InstantPrintPriceEstimatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly api = inject(ApiService);
  protected readonly catalog = inject(CatalogStore);
  protected readonly config = SITE_CONFIG;

  protected readonly projects = signal<PortfolioProject[]>([]);
  protected readonly projectsLoading = signal(true);

  protected readonly heroImage =
    'https://images.unsplash.com/photo-1611117775350-ac3950990985?auto=format&fit=crop&w=1200&q=80';

  protected readonly pillars: Pillar[] = [
    {
      icon: 'target',
      metric: '± 0.05 mm',
      title: 'Presnosť až ± 0.05 mm',
      text: 'Kalibrované SLA a priemyselné FDM tlačiarne s kontrolou rozmerov každej série. Diely sedia na prvé zloženie.',
    },
    {
      icon: 'clock',
      metric: '48 h',
      title: 'Expresné dodanie od 48 hodín',
      text: 'Ponuku posielame do 24 hodín, výroba prebieha v nepretržitej prevádzke. Osobný odber alebo kuriér po celej SR.',
    },
    {
      icon: 'fiber',
      metric: 'PA12-CF',
      title: 'Priemyselné kompozity s uhlíkom',
      text: 'Nylony vystužené uhlíkovými vláknami, UV stabilné ASA a SLS polyamid – materiály, ktoré nahradia hliník aj vstrekovaný plast.',
    },
    {
      icon: 'factory',
      metric: '1 – 500 ks',
      title: 'Malosériová výroba bez drahých foriem',
      text: 'Pilotné série a koncové diely bez investície do vstrekovacích foriem. Množstevné zľavy až 30 % už od 100 kusov.',
    },
  ];

  protected readonly steps = [
    {
      title: 'Nahrajte 3D model',
      text: 'Pošlite súbor STL, STEP, 3MF alebo OBJ – prípadne len výkres či náčrt.',
    },
    {
      title: 'Technická kontrola',
      text: 'Inžinier skontroluje vyrobiteľnosť, hrúbky stien a navrhne optimálny materiál.',
    },
    {
      title: 'Presná cenová ponuka',
      text: 'Do 24 hodín dostanete záväznú cenu a termín. Bez skrytých poplatkov.',
    },
    {
      title: 'Výroba a dodanie',
      text: 'Tlačíme, dokončíme povrch a odovzdáme osobne v dielni alebo kuriérom.',
    },
  ];

  constructor() {
    this.catalog.load();
    this.api.getPortfolio({ featured: true }).subscribe({
      next: (projects) => {
        this.projects.set(projects.slice(0, 3));
        this.projectsLoading.set(false);
      },
      error: () => this.projectsLoading.set(false),
    });
  }

  protected techShort(name: string): string {
    return name.split(' (')[0];
  }

  protected techSub(name: string): string {
    return /\((.*)\)/.exec(name)?.[1] ?? '';
  }
}
