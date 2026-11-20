import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Zákazková 3D tlač a malosériová výroba',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'technologie-a-materialy',
    title: 'Technológie a materiály',
    loadComponent: () =>
      import('./pages/materials/materials.page').then((m) => m.MaterialsPage),
  },
  {
    path: 'technologie-a-materialy/:slug',
    title: 'Technický list materiálu',
    loadComponent: () =>
      import('./pages/material-detail/material-detail.page').then((m) => m.MaterialDetailPage),
  },
  {
    path: 'realizacie',
    title: 'Portfólio realizácií',
    loadComponent: () =>
      import('./pages/portfolio/portfolio.page').then((m) => m.PortfolioPage),
  },
  {
    path: '3d-modelovanie',
    title: '3D modelovanie a reverzné inžinierstvo',
    loadComponent: () =>
      import('./pages/cad-modeling/cad-modeling.page').then((m) => m.CadModelingPage),
  },
  {
    path: 'dopyt',
    title: 'Nezáväzná kalkulácia 3D tlače',
    loadComponent: () => import('./pages/quote/quote.page').then((m) => m.QuotePage),
  },
  {
    path: '**',
    title: 'Stránka nenájdená',
    loadComponent: () =>
      import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
