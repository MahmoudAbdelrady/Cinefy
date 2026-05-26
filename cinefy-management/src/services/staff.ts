import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import type {
  CurrentStaffMember,
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

  private currentStaffMember$: Observable<CurrentStaffMember> | null = null;

  getCurrentStaffMember(): Observable<CurrentStaffMember> {
    this.currentStaffMember$ ??= this.http
      .get<CurrentStaffMember>('/staff/me')
      .pipe(shareReplay(1));
    return this.currentStaffMember$;
  }

  clearCurrentStaffMember(): void {
    this.currentStaffMember$ = null;
  }

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
