import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  PaginatedResponse,
  PositionCoverage,
  StaffMemberDetail,
  StaffMemberPayload,
  StaffMemberSummary,
  StaffPosition,
} from '../shared/types';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);

  getStaffMembers(
    name?: string,
    position?: StaffPosition,
    pageable?: { page?: number; size?: number },
  ): Observable<PaginatedResponse<StaffMemberSummary>> {
    const params = {
      ...(name && { name }),
      ...(position && { position }),
      ...pageable,
    };
    return this.http.get<PaginatedResponse<StaffMemberSummary>>('/staff', { params });
  }

  getPositionCoverage(): Observable<PositionCoverage> {
    return this.http.get<PositionCoverage>('/staff/position-coverage');
  }

  getStaffMember(id: string): Observable<StaffMemberDetail> {
    return this.http.get<StaffMemberDetail>(`/staff/${id}`);
  }

  createStaffMember(data: StaffMemberPayload): Observable<StaffMemberSummary> {
    return this.http.post<StaffMemberSummary>('/staff', data);
  }

  updateStaffMember(id: string, data: StaffMemberPayload): Observable<StaffMemberSummary> {
    return this.http.put<StaffMemberSummary>(`/staff/${id}`, data);
  }

  deleteStaffMember(id: string): Observable<void> {
    return this.http.delete<void>(`/staff/${id}`);
  }
}
