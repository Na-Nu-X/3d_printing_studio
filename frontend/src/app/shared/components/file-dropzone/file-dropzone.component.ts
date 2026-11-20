import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

import { formatFileSize } from '../../../core/utils/format';
import { IconComponent } from '../icon/icon.component';

/** Drag & drop (or click / keyboard) picker for 3D model files with client-side validation. */
@Component({
  selector: 'app-file-dropzone',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (file(); as f) {
      <div class="file">
        <span class="file__icon"><app-icon name="cube" [strokeWidth]="1.5" /></span>
        <div class="file__info">
          <span class="file__name">{{ f.name }}</span>
          <span class="file__meta mono">{{ ext(f.name) }} · {{ size(f.size) }}</span>
        </div>
        <span class="badge badge--success">Pripravené</span>
        <button type="button" class="file__remove" (click)="clear()" aria-label="Odstrániť súbor">
          <app-icon name="trash" />
        </button>
      </div>
    } @else {
      <label
        class="zone"
        [class.is-dragging]="dragging()"
        [class.is-invalid]="invalid() || !!error()"
        (dragenter)="onDrag($event, true)"
        (dragover)="onDrag($event, true)"
        (dragleave)="onDrag($event, false)"
        (drop)="onDrop($event)"
      >
        <input
          type="file"
          class="visually-hidden"
          [attr.id]="inputId()"
          [accept]="accept()"
          (change)="onSelect($event)"
          [attr.aria-describedby]="inputId() + '-hint'"
        />
        <span class="zone__icon"><app-icon name="upload" [strokeWidth]="1.5" /></span>
        <span class="zone__title">
          Presuňte sem 3D model alebo <span class="zone__link">vyberte súbor</span>
        </span>
        <span class="zone__hint" [attr.id]="inputId() + '-hint'">
          <span class="mono">{{ acceptLabel() }}</span> · max. {{ maxSizeMb() }} MB · viac súborov zabaľte do .ZIP
        </span>
      </label>
    }
    @if (error()) {
      <p class="field__error" role="alert"><app-icon name="alert" /> {{ error() }}</p>
    }
  `,
  styleUrl: './file-dropzone.component.scss',
})
export class FileDropzoneComponent {
  readonly file = model<File | null>(null);
  readonly accept = input('.stl,.step,.stp,.3mf,.obj,.zip');
  readonly maxSizeMb = input(50);
  readonly invalid = input(false);
  readonly inputId = input('model-file');

  protected readonly dragging = signal(false);
  protected readonly error = signal('');

  protected readonly acceptLabel = computed(() =>
    this.accept()
      .split(',')
      .map((e) => e.trim().toUpperCase())
      .join(' '),
  );

  protected onDrag(event: DragEvent, active: boolean): void {
    event.preventDefault();
    this.dragging.set(active);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.take(file);
  }

  protected onSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) this.take(file);
    target.value = '';
  }

  protected clear(): void {
    this.file.set(null);
    this.error.set('');
  }

  protected ext(name: string): string {
    return name.includes('.') ? name.split('.').pop()!.toUpperCase() : 'SÚBOR';
  }

  protected size(bytes: number): string {
    return formatFileSize(bytes);
  }

  private take(file: File): void {
    const allowed = this.accept()
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const extension = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    if (!allowed.includes(extension)) {
      this.error.set(`Formát ${extension.toUpperCase()} nie je podporovaný. Povolené sú ${this.acceptLabel()}.`);
      return;
    }
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      this.error.set(
        `Súbor má ${formatFileSize(file.size)}, maximum je ${this.maxSizeMb()} MB. Vložte prosím odkaz na cloud.`,
      );
      return;
    }
    this.error.set('');
    this.file.set(file);
  }
}
