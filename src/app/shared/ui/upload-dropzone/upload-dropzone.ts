import { ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-upload-dropzone',
  imports: [MatIconModule],
  templateUrl: './upload-dropzone.html',
  styleUrl: './upload-dropzone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadDropzoneComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly icon = input.required<string>();
  readonly accept = input<string>('');
  readonly multiple = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly filesSelected = output<File[]>();

  readonly isDragOver = signal(false);

  readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  openFilePicker(): void {
    if (this.disabled()) {
      return;
    }

    this.fileInputRef()?.nativeElement.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length > 0) {
      this.filesSelected.emit(files);
    }

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    if (this.disabled()) {
      return;
    }

    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    if (this.disabled()) {
      return;
    }

    this.isDragOver.set(false);

    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];

    if (files.length > 0) {
      this.filesSelected.emit(files);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openFilePicker();
    }
  }
}