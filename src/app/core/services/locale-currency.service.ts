import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { PaymentsApiService, type FxQuote } from './payments-api.service';
import { currencyFromBrowserLocale } from '../utils/locale-currency';
import { convertPkrAmount, formatMoney } from '../utils/format-money';

export interface FxSnapshot {
  currency: string;
  rate: number;
  exponent: number;
  updatedAt: string;
}

const PKR_SNAPSHOT: FxSnapshot = {
  currency: 'PKR',
  rate: 1,
  exponent: 2,
  updatedAt: '',
};

function toSnapshot(quote: FxQuote | null | undefined): FxSnapshot {
  const currency = String(quote?.currency || 'PKR').trim().toUpperCase() || 'PKR';
  const rate = Number(quote?.rate);
  const exponent = Number(quote?.exponent);
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(exponent) || exponent < 0) {
    return { ...PKR_SNAPSHOT };
  }
  return {
    currency,
    rate,
    exponent,
    updatedAt: quote?.updatedAt || '',
  };
}

@Injectable({ providedIn: 'root' })
export class LocaleCurrencyService {
  private readonly paymentsApi = inject(PaymentsApiService);
  private snapshot: FxSnapshot = { ...PKR_SNAPSHOT };
  private ready$: Observable<FxSnapshot> | null = null;

  /** Browser currency before the rate feed confirms it. Unsupported codes still charge as PKR on the API. */
  readonly requestedCurrency = currencyFromBrowserLocale();
  ratesUnavailable = false;

  ready(): Observable<FxSnapshot> {
    if (!this.ready$) {
      this.ready$ = this.load().pipe(shareReplay(1));
    }
    return this.ready$;
  }

  isPkr(): boolean {
    return this.snapshot.currency === 'PKR';
  }

  /** Convert a configured PKR amount and format it for the browser locale. */
  formatFromPkr(amountPkr: number | null | undefined): string {
    const converted = convertPkrAmount(Number(amountPkr) || 0, this.snapshot.rate, this.snapshot.exponent);
    return formatMoney(converted, this.snapshot.currency);
  }

  private load(): Observable<FxSnapshot> {
    if (this.requestedCurrency === 'PKR') {
      this.snapshot = { ...PKR_SNAPSHOT, updatedAt: new Date().toISOString() };
      this.ratesUnavailable = false;
      return of(this.snapshot);
    }

    return this.paymentsApi.getFx(this.requestedCurrency).pipe(
      map((res) => toSnapshot(res?.data)),
      tap((fx) => {
        this.snapshot = fx;
        this.ratesUnavailable = false;
      }),
      catchError(() => {
        this.ratesUnavailable = true;
        this.snapshot = { ...PKR_SNAPSHOT };
        return of(this.snapshot);
      }),
    );
  }
}
