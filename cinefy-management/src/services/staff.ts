import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import type {
  ChangePasswordPayload,
  CurrentStaffMember,
  PaginatedResponse,
  PositionCoverage,
  StaffMemberDetail,
  StaffMemberPayload,
  StaffMemberSummary,
  UpdateProfilePayload,
  UserPosition,
} from '../shared/types';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);

  private readonly currentStaffMember = new BehaviorSubject<CurrentStaffMember | null>(null);
  private currentStaffMemberRequested = false;

  getCurrentStaffMember(): Observable<CurrentStaffMember> {
    if (!this.currentStaffMemberRequested) {
      this.currentStaffMemberRequested = true;
      this.http
        .get<CurrentStaffMember>('/staff/me')
        .subscribe((member) => this.currentStaffMember.next(member));
    }
    return this.currentStaffMember.pipe(filter((member) => member !== null));
  }

  updateCurrentStaffMember(data: UpdateProfilePayload): Observable<StaffMemberDetail> {
    return this.http.put<StaffMemberDetail>('/staff/me', data);
  }

  changeCurrentStaffMemberPassword(data: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>('/staff/me/password', data);
  }

  setCurrentStaffMember(member: CurrentStaffMember): void {
    this.currentStaffMember.next(member);
  }

  clearCurrentStaffMember(): void {
    this.currentStaffMember.next(null);
    this.currentStaffMemberRequested = false;
  }

  getStaffMembers(
    name?: string,
    position?: UserPosition,
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
