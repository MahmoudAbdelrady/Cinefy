import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  PaymentMethod,
  PaymentMethodStatusRequest,
  PaymentMethodSummary,
  PaymentMethodTestResult,
  TestConnectionRequest,
} from '../shared/types';

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private readonly http = inject(HttpClient);

  getPaymentMethods(): Observable<PaymentMethodSummary[]> {
    return this.http.get<PaymentMethodSummary[]>('/payment-methods');
  }

  createPaymentMethod(data: PaymentMethod): Observable<PaymentMethodSummary> {
    return this.http.post<PaymentMethodSummary>('/payment-methods', data);
  }

  updatePaymentMethod(id: string, data: PaymentMethod): Observable<PaymentMethodSummary> {
    return this.http.put<PaymentMethodSummary>(`/payment-methods/${id}`, data);
  }

  deletePaymentMethod(id: string): Observable<void> {
    return this.http.delete<void>(`/payment-methods/${id}`);
  }

  testConnection(data: TestConnectionRequest): Observable<void> {
    return this.http.post<void>('/payment-methods/test-connection', data);
  }

  testPaymentMethodConnection(id: string): Observable<PaymentMethodTestResult> {
    return this.http.post<PaymentMethodTestResult>(`/payment-methods/${id}/test-connection`, {});
  }

  updatePaymentMethodStatus(id: string, data: PaymentMethodStatusRequest): Observable<void> {
    return this.http.post<void>(`/payment-methods/${id}/status`, data);
  }
}
