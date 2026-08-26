import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PaymentGateway, PaymentGatewayList, PaymentGatewayRequest } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class PaymentGatewaysService {
  private readonly http = inject(HttpClient);

  getPaymentGateways(): Observable<PaymentGatewayList> {
    return this.http.get<PaymentGatewayList>('/payment-gateways');
  }

  getActivePaymentGateway(context?: HttpContext): Observable<PaymentGateway> {
    return this.http.get<PaymentGateway>('/payment-gateways/active', { context });
  }

  createPaymentGateway(data: PaymentGatewayRequest): Observable<PaymentGateway> {
    return this.http.post<PaymentGateway>('/payment-gateways', data);
  }

  updatePaymentGateway(id: string, data: PaymentGatewayRequest): Observable<PaymentGateway> {
    return this.http.put<PaymentGateway>(`/payment-gateways/${id}`, data);
  }

  updatePaymentGatewayStatus(id: string, active: boolean): Observable<void> {
    return this.http.post<void>(`/payment-gateways/${id}/status`, { active });
  }

  deletePaymentGateway(id: string): Observable<void> {
    return this.http.delete<void>(`/payment-gateways/${id}`);
  }
}
