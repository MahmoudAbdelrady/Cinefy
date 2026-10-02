import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import type {
  ChangePasswordPayload,
  CurrentStaffMember,
  OnShiftSummary,
  PositionCoverage,
  StaffMemberDetail,
  StaffMemberPayload,
  StaffMemberSummary,
  UpdateProfilePayload,
  UserPosition,
} from '../shared/types';
import type { PaginatedResponse } from 'cinefy-ui/types';

const API_PREFIX = '/staff';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);

  private readonly currentStaffMember = new BehaviorSubject<CurrentStaffMember | null>(null);
  private currentStaffMemberRequested = false;

  getCurrentStaffMember(): Observable<CurrentStaffMember> {
    if (!this.currentStaffMemberRequested) {
      this.currentStaffMemberRequested = true;
      this.http.get<CurrentStaffMember>(`${API_PREFIX}/me`).subscribe({
        next: (member) => this.currentStaffMember.next(member),
        error: () => (this.currentStaffMemberRequested = false),
      });
    }
    return this.currentStaffMember.pipe(filter((member) => member !== null));
  }

  updateCurrentStaffMember(data: UpdateProfilePayload): Observable<StaffMemberDetail> {
    return this.http.put<StaffMemberDetail>(`${API_PREFIX}/me`, data);
  }

  changeCurrentStaffMemberPassword(data: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>(`${API_PREFIX}/me/password`, data);
  }

  patchCurrentStaffMember(partial: Partial<CurrentStaffMember>): void {
    const current = this.currentStaffMember.value;
    if (!current) return;
    this.currentStaffMember.next({ ...current, ...partial });
  }

  clearCurrentStaffMember(): void {
    this.currentStaffMember.next(null);
    this.currentStaffMemberRequested = false;
  }

  getStaffMembers(
    name?: string,
    position?: UserPosition,
    pageable?: { page?: number; size?: number },
    context?: HttpContext,
  ): Observable<PaginatedResponse<StaffMemberSummary>> {
    const params = {
      ...(name && { name }),
      ...(position && { position }),
      ...pageable,
    };
    return this.http.get<PaginatedResponse<StaffMemberSummary>>(API_PREFIX, { params, context });
  }

  getPositionCoverage(context?: HttpContext): Observable<PositionCoverage> {
    return this.http.get<PositionCoverage>(`${API_PREFIX}/position-coverage`, { context });
  }

  getOnShiftSummary(context?: HttpContext): Observable<OnShiftSummary> {
    return this.http.get<OnShiftSummary>(`${API_PREFIX}/on-shift`, { context });
  }

  getStaffMember(id: string, context?: HttpContext): Observable<StaffMemberDetail> {
    return this.http.get<StaffMemberDetail>(`${API_PREFIX}/${id}`, { context });
  }

  createStaffMember(data: StaffMemberPayload): Observable<StaffMemberSummary> {
    return this.http.post<StaffMemberSummary>(API_PREFIX, data);
  }

  updateStaffMember(id: string, data: StaffMemberPayload): Observable<StaffMemberSummary> {
    return this.http.put<StaffMemberSummary>(`${API_PREFIX}/${id}`, data);
  }

  deleteStaffMember(id: string): Observable<void> {
    return this.http.delete<void>(`${API_PREFIX}/${id}`);
  }
}
