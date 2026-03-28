import { Component } from '@angular/core';
import {
  LucideAngularModule,
  Film,
  ChevronRight,
  Clock,
  Ticket,
  DollarSign,
  Users,
} from 'lucide-angular';
import { RouterLink } from '@angular/router';

interface NowShowingMovie {
  poster: string;
  title: string;
  genre: string;
  showtimes: number;
  ticketsSold: number;
  revenue: string;
  occupancy: string;
}

@Component({
  selector: 'now-showing-component',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './now-showing.html',
  styleUrl: './now-showing.scss',
})
export class NowShowingComponent {
  protected FilmIcon = Film;
  protected ChevronRightIcon = ChevronRight;
  protected ClockIcon = Clock;
  protected TicketIcon = Ticket;
  protected DollarSignIcon = DollarSign;
  protected UsersIcon = Users;
  protected nowShowingMovies: NowShowingMovie[] = [
    {
      poster:
        'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'The Matrix Resurrections',
      genre: 'Sci-Fi',
      showtimes: 8,
      ticketsSold: 284,
      revenue: '$12,450',
      occupancy: '78%',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'Dune: Part Two',
      genre: 'Adventure',
      showtimes: 6,
      ticketsSold: 517,
      revenue: '$18,900',
      occupancy: '92%',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'Spider-Man: No Way Home',
      genre: 'Action',
      showtimes: 10,
      ticketsSold: 638,
      revenue: '$24,350',
      occupancy: '85%',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'Avatar: The Way of Water',
      genre: 'Fantasy',
      showtimes: 7,
      ticketsSold: 391,
      revenue: '$15,200',
      occupancy: '81%',
    },
  ];
}
