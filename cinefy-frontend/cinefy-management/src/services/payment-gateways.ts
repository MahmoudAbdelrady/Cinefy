import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PaymentGateway, PaymentGatewayList, PaymentGatewayRequest } from '../shared/types';

const API_PREFIX = '/payment-gateways';

@Injectable({ providedIn: 'root' })
export class PaymentGatewaysService {
  private readonly http = inject(HttpClient);

  getPaymentGateways(context?: HttpContext): Observable<PaymentGatewayList> {
    return this.http.get<PaymentGatewayList>(API_PREFIX, { context });
  }

  getActivePaymentGateway(context?: HttpContext): Observable<PaymentGateway> {
    return this.http.get<PaymentGateway>(`${API_PREFIX}/active`, { context });
  }

  createPaymentGateway(data: PaymentGatewayRequest): Observable<PaymentGateway> {
    return this.http.post<PaymentGateway>(API_PREFIX, data);
  }

  updatePaymentGateway(id: string, data: PaymentGatewayRequest): Observable<PaymentGateway> {
    return this.http.put<PaymentGateway>(`${API_PREFIX}/${id}`, data);
  }

  updatePaymentGatewayStatus(id: string, active: boolean): Observable<void> {
    return this.http.post<void>(`${API_PREFIX}/${id}/status`, { active });
  }

  deletePaymentGateway(id: string): Observable<void> {
    return this.http.delete<void>(`${API_PREFIX}/${id}`);
  }
}
