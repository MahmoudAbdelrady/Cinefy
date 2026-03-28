import { Component } from '@angular/core';
import {
  Eye,
  LayoutDashboard,
  LucideAngularModule,
  TrendingUp,
  Users,
} from 'lucide-angular';

@Component({
  selector: 'halls-statistics',
  imports: [LucideAngularModule],
  templateUrl: './halls-statistics.html',
  styleUrl: './halls-statistics.scss',
})
export class HallsStatisticsComponent {
  protected LayoutIcon = LayoutDashboard;
  protected EyeIcon = Eye;
  protected UsersIcon = Users;
  protected TrendingUpIcon = TrendingUp;
}
