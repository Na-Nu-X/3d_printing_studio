import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import {
  ClientType,
  InfillLevel,
  PostProcessing,
  QuoteRequestPayload,
} from '../../core/models/api.models';
import { ApiService, parseApiError } from '../../core/services/api.service';
import { CatalogStore } from '../../core/services/catalog.store';
import { INFILL_OPTIONS, QTY_RANGE, WEIGHT_RANGE, estimate } from '../../core/utils/pricing';
import { FileDropzoneComponent } from '../../shared/components/file-dropzone/file-dropzone.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EurPipe } from '../../shared/pipes/eur.pipe';

const PHONE_PATTERN = /^\+?[0-9 ()/-]{9,20}$/;
const URL_PATTERN = /^https?:\/\/\S+\.\S+/i;

const POST_PROCESSING_OPTIONS: { value: PostProcessing; label: string; hint: string }[] = [
  { value: 'none', label: 'Bez dodatočných úprav', hint: 'Odstránenie podpôr a začistenie' },
  { value: 'sanding_painting', label: 'Brúsenie a lakovanie povrchu', hint: 'Prezentačný povrch, odtieň RAL' },
  { value: 'threaded_inserts', label: 'Závitové vložky', hint: 'Zalisované mosadzné vložky M2 – M8' },
];

@Component({
  selector: 'app-quote-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, FileDropzoneComponent, EurPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote.page.html',
  styleUrl: './quote.page.scss',
})
export class QuotePage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  private readonly document = inject(DOCUMENT);
  protected readonly catalog = inject(CatalogStore);
  protected readonly config = SITE_CONFIG;

  // ---- Query params (pre-fill from estimator / datasheet)
  readonly material = input<string>();
  readonly technology = input<string>();
  readonly qty = input<string>();
  readonly infill = input<string>();
  readonly g = input<string>();

  protected readonly infillOptions = INFILL_OPTIONS;
  protected readonly postOptions = POST_PROCESSING_OPTIONS;

  // ---- UI state
  protected readonly sourceMode = signal<'file' | 'link'>('file');
  protected readonly file = signal<File | null>(null);
  protected readonly submitting = signal(false);
  protected readonly attempted = signal(false);
  protected readonly serverMessage = signal('');
  protected readonly serverFileError = signal('');
  protected readonly createdId = signal<number | null>(null);
  protected readonly prefilled = signal(false);

  protected readonly form = this.fb.group({
    external_file_link: ['', [Validators.pattern(URL_PATTERN)]],
    technology: [''],
    material: [''],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(100000)]],
    desired_color: [''],
    infill_level: ['standard' as InfillLevel],
    post_processing: ['none' as PostProcessing],
    client_type: ['firma' as ClientType],
    company_name: [''],
    client_name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    notes: ['', [Validators.maxLength(3000)]],
    consent: [false, [Validators.requiredTrue]],
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  // ---- Derived
  protected readonly selectedTechnology = computed(() =>
    this.catalog.technologies().find((t) => t.slug === this.value().technology),
  );
  protected readonly selectedMaterial = computed(() => this.catalog.findMaterial(this.value().material));

  protected readonly materialOptions = computed(() => {
    const tech = this.value().technology;
    const all = this.catalog.materials();
    return tech ? all.filter((m) => m.technology.slug === tech) : all;
  });

  protected readonly isCompany = computed(() => this.value().client_type === 'firma');

  protected readonly modelMissing = computed(() =>
    this.sourceMode() === 'file' ? !this.file() : !this.value().external_file_link?.trim(),
  );

  /** Orientational estimate — only when the user came from the calculator with a weight. */
  protected readonly estimate = computed(() => {
    const grams = Number(this.g());
    const material = this.selectedMaterial();
    if (!material || !Number.isFinite(grams) || grams < WEIGHT_RANGE.min) return null;
    const v = this.value();
    return estimate({
      pricePerGram: Number(material.price_per_gram_eur),
      setupFee: Number(material.setup_fee_eur),
      grams: Math.min(grams, WEIGHT_RANGE.max),
      infill: v.infill_level ?? 'standard',
      quantity: Math.max(1, Number(v.quantity) || 1),
      technologySlug: material.technology.slug,
    });
  });

  protected readonly infillLabel = computed(() => {
    const o = INFILL_OPTIONS.find((x) => x.value === this.value().infill_level);
    return o ? `${o.percent} % · ${o.label}` : '—';
  });

  protected readonly postLabel = computed(
    () => POST_PROCESSING_OPTIONS.find((x) => x.value === this.value().post_processing)?.label ?? '—',
  );

  constructor() {
    this.catalog.load();
    const c = this.form.controls;

    // Keep technology & material consistent.
    c.material.valueChanges.pipe(takeUntilDestroyed()).subscribe((slug) => {
      const material = this.catalog.findMaterial(slug);
      if (material && c.technology.value !== material.technology.slug) {
        c.technology.setValue(material.technology.slug, { emitEvent: true });
      }
      if (material && c.desired_color.value && !material.available_colors.includes(c.desired_color.value)) {
        c.desired_color.setValue('');
      }
    });
    c.technology.valueChanges.pipe(takeUntilDestroyed()).subscribe((tech) => {
      const material = this.catalog.findMaterial(c.material.value);
      if (material && tech && material.technology.slug !== tech) {
        c.material.setValue('');
        c.desired_color.setValue('');
      }
    });

    // Company name is mandatory for B2B requests.
    c.client_type.valueChanges.pipe(takeUntilDestroyed()).subscribe((type) => {
      c.company_name.setValidators(type === 'firma' ? [Validators.required] : []);
      c.company_name.updateValueAndValidity();
    });
    c.company_name.setValidators([Validators.required]);

    // Once the catalog arrives, align technology with a pre-filled material.
    effect(() => {
      const material = this.catalog.findMaterial(this.value().material);
      if (material && !this.value().technology) {
        c.technology.setValue(material.technology.slug);
      }
    });
  }

  ngOnInit(): void {
    const c = this.form.controls;
    let touched = false;
    if (this.material()) {
      c.material.setValue(this.material()!);
      touched = true;
    }
    if (this.technology()) {
      c.technology.setValue(this.technology()!);
      touched = true;
    }
    const qty = Number(this.qty());
    if (Number.isInteger(qty) && qty >= QTY_RANGE.min && qty <= 100000) {
      c.quantity.setValue(qty);
      touched = true;
    }
    const infill = this.infill();
    if (infill && INFILL_OPTIONS.some((o) => o.value === infill)) {
      c.infill_level.setValue(infill as InfillLevel);
      touched = true;
    }
    this.prefilled.set(touched);
  }

  // ---- Template helpers
  protected setSourceMode(mode: 'file' | 'link'): void {
    this.sourceMode.set(mode);
    this.serverFileError.set('');
  }

  protected setClientType(type: ClientType): void {
    this.form.controls.client_type.setValue(type);
  }

  protected errorFor(name: keyof typeof this.form.controls): string {
    const control: AbstractControl = this.form.controls[name];
    if (!control.errors || !(control.touched || this.attempted())) return '';
    const e = control.errors;
    if (e['server']) return e['server'];
    if (e['required']) return requiredMessage(name);
    if (name === 'consent') return 'Pre odoslanie dopytu potrebujeme váš súhlas.';
    if (e['email']) return 'Zadajte platnú e-mailovú adresu (napr. meno@firma.sk).';
    if (e['minlength']) return 'Zadajte prosím celé meno a priezvisko.';
    if (e['min'] || e['max']) return 'Zadajte počet kusov od 1 do 100 000.';
    if (e['pattern']) {
      return name === 'phone'
        ? 'Zadajte telefónne číslo v tvare +421 900 123 456.'
        : 'Zadajte platný odkaz začínajúci https://';
    }
    if (e['maxlength']) return 'Text je príliš dlhý.';
    return 'Skontrolujte prosím toto pole.';
  }

  protected techShort(name: string): string {
    return name.split(' (')[0];
  }

  protected submit(): void {
    this.attempted.set(true);
    this.serverMessage.set('');
    this.serverFileError.set('');

    if (this.form.invalid || this.modelMissing()) {
      this.form.markAllAsTouched();
      this.serverMessage.set('Skontrolujte prosím zvýraznené polia formulára.');
      this.scrollToFirstError();
      return;
    }

    const v = this.form.getRawValue();
    const payload: QuoteRequestPayload = {
      technology: v.technology || null,
      material: v.material || null,
      model_file: this.sourceMode() === 'file' ? this.file() : null,
      external_file_link: this.sourceMode() === 'link' ? v.external_file_link.trim() : '',
      quantity: v.quantity,
      desired_color: v.desired_color,
      infill_level: v.infill_level,
      post_processing: v.post_processing,
      client_type: v.client_type,
      company_name: v.client_type === 'firma' ? v.company_name.trim() : '',
      client_name: v.client_name.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      notes: this.composeNotes(v.notes),
    };

    this.submitting.set(true);
    this.api.submitQuote(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.createdId.set(res.id);
        this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const { fields, message } = parseApiError(err);
        for (const [key, msg] of Object.entries(fields)) {
          if (key === 'model_file' || key === 'external_file_link') {
            this.serverFileError.set(msg);
          } else if (key in this.form.controls) {
            const control = this.form.controls[key as keyof typeof this.form.controls];
            control.setErrors({ server: msg });
            control.markAsTouched();
          }
        }
        this.serverMessage.set(fields['non_field_errors'] ?? message);
        this.scrollToFirstError();
      },
    });
  }

  protected startOver(): void {
    this.createdId.set(null);
    this.attempted.set(false);
    this.file.set(null);
    this.form.reset();
    this.form.controls.company_name.setValidators([Validators.required]);
  }

  private composeNotes(notes: string): string {
    const grams = Number(this.g());
    const extra =
      Number.isFinite(grams) && grams > 0
        ? `\n\n[Z kalkulačky: odhadovaná hmotnosť ${Math.round(grams)} g / ks]`
        : '';
    return (notes.trim() + extra).trim();
  }

  private scrollToFirstError(): void {
    queueMicrotask(() => {
      const el = this.document.querySelector<HTMLElement>('.is-invalid, .ng-invalid.ng-touched, .zone.is-invalid');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el && 'focus' in el) el.focus({ preventScroll: true });
    });
  }
}

function requiredMessage(name: string): string {
  switch (name) {
    case 'client_name':
      return 'Zadajte vaše meno a priezvisko.';
    case 'email':
      return 'Zadajte e-mail, na ktorý pošleme cenovú ponuku.';
    case 'company_name':
      return 'Pre firemný dopyt uveďte názov firmy.';
    case 'quantity':
      return 'Zadajte počet kusov.';
    default:
      return 'Toto pole je povinné.';
  }
}
