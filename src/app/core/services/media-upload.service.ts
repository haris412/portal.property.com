import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface UploadUrlData {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
  maxSizeMB?: number;
}

interface UploadUrlResponse {
  success: boolean;
  data: UploadUrlData;
}

export interface ListingImagePayload {
  url: string;
  orderIndex: number;
  isThumbnail: boolean;
}

@Injectable({ providedIn: 'root' })
export class MediaUploadService {
  private readonly apiBase = `${environment.apiUrl}/api/uploads`;

  constructor(private readonly http: HttpClient) {}

  async uploadImages(files: File[], propertyId?: string): Promise<ListingImagePayload[]> {
    const uploads = files.map(async (file, index) => {
      const signed = await this.requestUploadUrl('property-image-url', file, propertyId);
      await this.putToS3(signed.uploadUrl, file);
      return {
        url: signed.fileUrl,
        orderIndex: index,
        isThumbnail: index === 0,
      };
    });
    return Promise.all(uploads);
  }

  async uploadVideo(file: File, propertyId?: string): Promise<string> {
    const signed = await this.requestUploadUrl('property-video-url', file, propertyId);
    await this.putToS3(signed.uploadUrl, file);
    return signed.fileUrl;
  }

  private async requestUploadUrl(
    endpoint: 'property-image-url' | 'property-video-url',
    file: File,
    propertyId?: string
  ): Promise<UploadUrlData> {
    const body = this.buildSignedUrlBody(file, propertyId);
    const response = await firstValueFrom(
      this.http.post<UploadUrlResponse>(`${this.apiBase}/${endpoint}`, body)
    );
    return response.data;
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

  private buildSignedUrlBody(file: File, propertyId?: string): {
    fileName: string;
    fileType: string;
    propertyId?: string;
  } {
    const body: { fileName: string; fileType: string; propertyId?: string } = {
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
    };
    if (propertyId) {
      body.propertyId = propertyId;
    }
    return body;
  }
}
