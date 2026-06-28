import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SingleUploadUrlData {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
  maxSizeMB?: number;
}

interface SingleUploadUrlResponse {
  success: boolean;
  data: SingleUploadUrlData;
}

interface ImageUploadRequest {
  fileName: string;
  fileType: string;
}

interface ImagePresignedUrlData {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
  maxSizeMB: number;
}

interface BatchImageUploadUrlResponse {
  success: boolean;
  data: ImagePresignedUrlData[];
}

export interface ListingImagePayload {
  url: string;
  orderIndex: number;
  isThumbnail: boolean;
}

@Injectable({ providedIn: 'root' })
export class MediaUploadService {
  private readonly apiBase = `/uploads`;

  constructor(private readonly http: HttpClient) {}

  async uploadImages(files: File[], propertyId?: string): Promise<ListingImagePayload[]> {
    const images: ImageUploadRequest[] = files.map(file => ({
      fileName: file.name,
      fileType: file.type || 'image/jpeg',
    }));

    const body: { images: ImageUploadRequest[]; propertyId?: string } = { images };
    if (propertyId) body.propertyId = propertyId;

    const { data: presignedItems } = await firstValueFrom(
      this.http.post<BatchImageUploadUrlResponse>(`${this.apiBase}/property-images-urls`, body)
    );

    return Promise.all(
      presignedItems.map((item, index) =>
        this.putToS3(item.uploadUrl, files[index]).then(() => ({
          url: item.fileUrl,
          orderIndex: index,
          isThumbnail: index === 0,
        }))
      )
    );
  }

  async uploadVideo(file: File, propertyId?: string): Promise<string> {
    const body: { fileName: string; fileType: string; propertyId?: string } = {
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
    };
    if (propertyId) body.propertyId = propertyId;

    const { data } = await firstValueFrom(
      this.http.post<SingleUploadUrlResponse>(`${this.apiBase}/property-video-url`, body)
    );
    await this.putToS3(data.uploadUrl, file);
    return data.fileUrl;
  }

  async deleteImage(fileUrl: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<{ success: boolean }>(`${this.apiBase}/property-image`, {
        body: { fileUrl },
      })
    );
  }

  private async putToS3(uploadUrl: string, file: File): Promise<void> {
    await firstValueFrom(
      this.http.put(uploadUrl, file, {
        headers: new HttpHeaders({
          'Content-Type': file.type || 'application/octet-stream',
        }),
        responseType: 'text',
      })
    );
  }
}
