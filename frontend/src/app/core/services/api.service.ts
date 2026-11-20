import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiFieldErrors,
  CadRequestPayload,
  CreatedResponse,
  MaterialQuery,
  PortfolioProject,
  PortfolioQuery,
  PrintMaterial,
  PrintMaterialDetail,
  PrintTechnology,
  QuoteRequestPayload,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getTechnologies(): Observable<PrintTechnology[]> {
    return this.http.get<PrintTechnology[]>(`${this.base}/technologies/`);
  }

  getMaterials(query: MaterialQuery = {}): Observable<PrintMaterial[]> {
    return this.http.get<PrintMaterial[]>(`${this.base}/materials/`, {
      params: toParams(query),
    });
  }

  getMaterial(slug: string): Observable<PrintMaterialDetail> {
    return this.http.get<PrintMaterialDetail>(
      `${this.base}/materials/${encodeURIComponent(slug)}/`,
    );
  }

  getPortfolio(query: PortfolioQuery = {}): Observable<PortfolioProject[]> {
    return this.http.get<PortfolioProject[]>(`${this.base}/portfolio/`, {
      params: toParams(query),
    });
  }

  /** Sends multipart when a file is attached, JSON otherwise. */
  submitQuote(payload: QuoteRequestPayload): Observable<CreatedResponse> {
    const url = `${this.base}/quotes/`;
    if (!payload.model_file) {
      const { model_file: _ignored, ...json } = payload;
      return this.http.post<CreatedResponse>(url, json);
    }
    const form = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined || value === '') continue;
      form.append(key, value instanceof File ? value : String(value));
    }
    return this.http.post<CreatedResponse>(url, form);
  }

  submitModelingRequest(payload: CadRequestPayload): Observable<CreatedResponse> {
    return this.http.post<CreatedResponse>(`${this.base}/modeling-requests/`, payload);
  }
}

function toParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params = params.set(key, String(value));
  }
  return params;
}

/** Normalises an HTTP error into field errors + a Slovak summary message. */
export function parseApiError(error: unknown): { fields: Record<string, string>; message: string } {
  const fields: Record<string, string> = {};
  if (error instanceof HttpErrorResponse) {
    if (error.status === 400 && error.error && typeof error.error === 'object') {
      for (const [key, value] of Object.entries(error.error as ApiFieldErrors)) {
        fields[key] = Array.isArray(value) ? value.join(' ') : String(value);
      }
      return { fields, message: 'Skontrolujte prosím zvýraznené polia formulára.' };
    }
    if (error.status === 413) {
      return { fields, message: 'Súbor je príliš veľký. Pošlite nám prosím odkaz na cloud.' };
    }
    if (error.status === 429) {
      return {
        fields,
        message: 'Odoslali ste príliš veľa dopytov. Skúste to prosím o chvíľu znova.',
      };
    }
    if (error.status === 0) {
      return {
        fields,
        message: 'Nepodarilo sa spojiť so serverom. Skontrolujte pripojenie a skúste to znova.',
      };
    }
  }
  return { fields, message: 'Nastala neočakávaná chyba. Skúste to prosím znova alebo nám zavolajte.' };
}
