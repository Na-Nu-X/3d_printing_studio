import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { CadServiceType } from '../../core/models/api.models';
import { ApiService, parseApiError } from '../../core/services/api.service';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

interface CadService {
  value: CadServiceType;
  icon: IconName;
  title: string;
  short: string;
  text: string;
  deliverables: string[];
  priceFrom: string;
}

const PHONE_PATTERN = /^\+?[0-9 ()/-]{9,20}$/;

@Component({
  selector: 'app-cad-modeling-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cad-modeling.page.html',
  styleUrl: './cad-modeling.page.scss',
})
export class CadModelingPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  private readonly document = inject(DOCUMENT);
  protected readonly config = SITE_CONFIG;

  /** Optional `?sluzba=` query param to preselect a service. */
  readonly sluzba = input<string>();

  protected readonly heroImage =
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1100&q=80';

  protected readonly services: CadService[] = [
    {
      value: 'cad_navrh',
      icon: 'pencil',
      title: 'Návrh 3D modelu podľa výkresu alebo náčrtu',
      short: 'CAD návrh',
      text: 'Z 2D výkresu, kótovaného náčrtu alebo fotografie vytvoríme parametrický CAD model optimalizovaný pre 3D tlač – so správnymi hrúbkami stien, vôľami a orientáciou.',
      deliverables: ['Parametrický model STEP + STL', 'Kontrola vyrobiteľnosti', '2 kolá úprav v cene'],
      priceFrom: 'od 45 €',
    },
    {
      value: 'reverzne_inzinierstvo',
      icon: 'wrench',
      title: 'Výroba náhradného dielu podľa poškodeného kusu',
      short: 'Reverzné inžinierstvo',
      text: 'Prasknutý, opotrebovaný alebo už nevyrábaný diel zmeriame, domodelujeme chýbajúce časti a vyrobíme z odolnejšieho materiálu ako originál.',
      deliverables: ['Meranie a rekonštrukcia geometrie', 'Výber odolnejšieho materiálu', 'Model archivujeme pre ďalšie objednávky'],
      priceFrom: 'od 60 €',
    },
    {
      value: '3d_skenovanie',
      icon: 'scan',
      title: 'Optické 3D skenovanie a digitalizácia',
      short: '3D skenovanie',
      text: 'Štruktúrovaným svetlom digitalizujeme diely, formy aj tvarové plochy s presnosťou do 0.05 mm. Výstupom je sieť STL alebo plošný model pre ďalšiu konštrukciu.',
      deliverables: ['Presnosť skenovania do 0.05 mm', 'Výstup STL / OBJ / STEP', 'Porovnanie sken vs. CAD (farebná mapa)'],
      priceFrom: 'od 80 €',
    },
  ];

  protected readonly process = [
    { title: 'Zadanie', text: 'Pošlete výkres, fotky s rozmermi alebo diel osobne prinesiete do dielne.' },
    { title: 'Meranie a návrh', text: 'Konštruktér vytvorí CAD model a overí kritické rozmery a uloženia.' },
    { title: 'Schválenie modelu', text: 'Dostanete náhľad a technický výkres na schválenie pred výrobou.' },
    { title: 'Tlač a odovzdanie', text: 'Diel vytlačíme, skontrolujeme a odovzdáme spolu s CAD súbormi.' },
  ];

  protected readonly submitting = signal(false);
  protected readonly attempted = signal(false);
  protected readonly serverMessage = signal('');
  protected readonly createdId = signal<number | null>(null);

  protected readonly form = this.fb.group({
    service_type: ['cad_navrh' as CadServiceType, [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(4000)]],
    client_name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    consent: [false, [Validators.requiredTrue]],
  });

  ngOnInit(): void {
    const preset = this.services.find((s) => s.value === this.sluzba());
    if (preset) this.form.controls.service_type.setValue(preset.value);
  }

  protected chooseService(value: CadServiceType): void {
    this.form.controls.service_type.setValue(value);
    this.document.getElementById('dopyt-modelovanie')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected errorFor(name: keyof typeof this.form.controls): string {
    const control = this.form.controls[name];
    if (!control.errors || !(control.touched || this.attempted())) return '';
    const e = control.errors;
    if (e['server']) return e['server'];
    if (e['requiredTrue']) return 'Pre odoslanie dopytu potrebujeme váš súhlas.';
    if (e['required']) {
      return name === 'description'
        ? 'Popíšte prosím, čo potrebujete vymodelovať.'
        : name === 'email'
          ? 'Zadajte e-mail, na ktorý vám odpovieme.'
          : 'Toto pole je povinné.';
    }
    if (e['minlength']) {
      return name === 'description'
        ? `Popíšte zadanie podrobnejšie (aspoň 20 znakov, teraz ${control.value.toString().length}).`
        : 'Zadajte prosím celé meno a priezvisko.';
    }
    if (e['email']) return 'Zadajte platnú e-mailovú adresu.';
    if (e['pattern']) return 'Zadajte telefónne číslo v tvare +421 900 123 456.';
    if (e['maxlength']) return 'Text je príliš dlhý.';
    return 'Skontrolujte prosím toto pole.';
  }

  protected submit(): void {
    this.attempted.set(true);
    this.serverMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.serverMessage.set('Skontrolujte prosím zvýraznené polia formulára.');
      return;
    }
    const { consent: _consent, ...v } = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .submitModelingRequest({
        service_type: v.service_type,
        description: v.description.trim(),
        client_name: v.client_name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.createdId.set(res.id);
          this.document.getElementById('dopyt-modelovanie')?.scrollIntoView({ behavior: 'smooth' });
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          const { fields, message } = parseApiError(err);
          for (const [key, msg] of Object.entries(fields)) {
            if (key in this.form.controls) {
              const control = this.form.controls[key as keyof typeof this.form.controls];
              control.setErrors({ server: msg });
              control.markAsTouched();
            }
          }
          this.serverMessage.set(message);
        },
      });
  }

  protected reset(): void {
    this.createdId.set(null);
    this.attempted.set(false);
    this.form.reset();
  }
}
