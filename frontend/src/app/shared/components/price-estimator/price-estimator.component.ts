import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InfillLevel, PrintMaterial } from '../../../core/models/api.models';
import { CatalogStore } from '../../../core/services/catalog.store';
import {
  BATCH_TIERS,
  INFILL_OPTIONS,
  QTY_RANGE,
  SIZE_PRESETS,
  WEIGHT_RANGE,
  estimate,
  workingDaysLabel,
} from '../../../core/utils/pricing';
import { formatInt } from '../../../core/utils/format';
import { EurPipe } from '../../pipes/eur.pipe';
import { IconComponent } from '../icon/icon.component';

const DEFAULT_MATERIAL = 'petg';

@Component({
  selector: 'app-price-estimator',
  imports: [RouterLink, IconComponent, EurPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './price-estimator.component.html',
  styleUrl: './price-estimator.component.scss',
})
export class InstantPrintPriceEstimatorComponent {
  protected readonly catalog = inject(CatalogStore);

  protected readonly infillOptions = INFILL_OPTIONS;
  protected readonly sizePresets = SIZE_PRESETS;
  protected readonly weightRange = WEIGHT_RANGE;
  protected readonly qtyRange = QTY_RANGE;
  protected readonly tiers = [...BATCH_TIERS].reverse();

  // ---- User selections (signals)
  private readonly selectedMaterialSlug = signal<string | null>(null);
  protected readonly grams = signal(120);
  protected readonly infill = signal<InfillLevel>('standard');
  protected readonly quantity = signal(1);

  // ---- Derived state
  protected readonly material = computed<PrintMaterial | undefined>(() => {
    const materials = this.catalog.materials();
    return (
      materials.find((m) => m.slug === this.selectedMaterialSlug()) ??
      materials.find((m) => m.slug === DEFAULT_MATERIAL) ??
      materials[0]
    );
  });

  protected readonly technologySlug = computed(() => this.material()?.technology.slug ?? '');

  protected readonly technologyMaterials = computed(
    () => this.catalog.materialsByTechnology().get(this.technologySlug()) ?? [],
  );

  protected readonly result = computed(() => {
    const material = this.material();
    if (!material) return null;
    return estimate({
      pricePerGram: Number(material.price_per_gram_eur),
      setupFee: Number(material.setup_fee_eur),
      grams: this.grams(),
      infill: this.infill(),
      quantity: this.quantity(),
      technologySlug: material.technology.slug,
    });
  });

  protected readonly leadTimeLabel = computed(() => {
    const r = this.result();
    if (!r) return '';
    return `${r.leadTimeMin} – ${r.leadTimeMax} ${workingDaysLabel(r.leadTimeMax)}`;
  });

  protected readonly gramsFill = computed(
    () => ((this.grams() - WEIGHT_RANGE.min) / (WEIGHT_RANGE.max - WEIGHT_RANGE.min)) * 100,
  );
  protected readonly qtyFill = computed(
    () => ((this.quantity() - QTY_RANGE.min) / (QTY_RANGE.max - QTY_RANGE.min)) * 100,
  );

  protected readonly quoteParams = computed(() => ({
    material: this.material()?.slug,
    qty: this.quantity(),
    infill: this.infill(),
    g: this.grams(),
  }));

  constructor() {
    this.catalog.load();
  }

  // ---- Handlers
  protected selectTechnology(slug: string): void {
    if (slug === this.technologySlug()) return;
    const candidates = this.catalog.materialsByTechnology().get(slug) ?? [];
    const next = candidates.find((m) => m.is_featured) ?? candidates[0];
    if (next) this.selectedMaterialSlug.set(next.slug);
  }

  protected selectMaterial(slug: string): void {
    this.selectedMaterialSlug.set(slug);
  }

  protected setGrams(value: number | string): void {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return;
    this.grams.set(clamp(n, WEIGHT_RANGE.min, WEIGHT_RANGE.max));
  }

  protected setQuantity(value: number | string): void {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return;
    this.quantity.set(clamp(n, QTY_RANGE.min, QTY_RANGE.max));
  }

  protected stepQuantity(delta: number): void {
    this.setQuantity(this.quantity() + delta);
  }

  protected percent(rate: number): string {
    return `${Math.round(rate * 100)} %`;
  }

  protected int(value: number): string {
    return formatInt(value);
  }

  protected shortName(name: string): string {
    return name.split(' (')[0];
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
