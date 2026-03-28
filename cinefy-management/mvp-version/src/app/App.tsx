import React, { useState } from 'react';
import {
  Film,
  Layout,
  CreditCard,
  Home,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  Ticket,
  Clock,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Settings,
  ChevronRight,
  BarChart3,
  AlertCircle,
  Search,
} from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAddHallModal, setShowAddHallModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedHall, setSelectedHall] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [hallTypes, setHallTypes] = useState(['Normal', 'IMAX', '4DX']);
  const [showAddHallTypeModal, setShowAddHallTypeModal] = useState(false);
  const [newHallTypeName, setNewHallTypeName] = useState('');
  const [editingHallType, setEditingHallType] = useState<string | null>(null);
  const [editingHallTypeName, setEditingHallTypeName] = useState('');
  const [hallsPage, setHallsPage] = useState(1);
  const hallsPerPage = 5;
  const [hallsSearch, setHallsSearch] = useState('');

  // Seat layout editor state
  type Seat = { type: 'normal' | 'vip' | 'empty'; onsiteOnly: boolean };
  const [numRows, setNumRows] = useState(10);
  const [seatsPerRow, setSeatsPerRow] = useState(12);
  const [seatLayout, setSeatLayout] = useState<Seat[][]>([]);
  const [selectedSeatType, setSelectedSeatType] = useState<'normal' | 'vip' | 'empty'>('normal');
  const [selectedOnsiteOnly, setSelectedOnsiteOnly] = useState(false);

  const makeSeat = (type: Seat['type'], onsiteOnly = false): Seat => ({
    type,
    onsiteOnly: type === 'empty' ? false : onsiteOnly,
  });

  const initializeSeatLayout = (rows: number, cols: number) => {
    setSeatLayout((prev) => {
      const layout: Seat[][] = [];
      for (let i = 0; i < rows; i++) {
        const row: Seat[] = [];
        for (let j = 0; j < cols; j++) {
          if (prev.length > 0 && i < prev.length && j < prev[i].length) {
            row.push(prev[i][j]);
          } else {
            row.push(makeSeat('normal'));
          }
        }
        layout.push(row);
      }
      return layout;
    });
  };

  const handleSeatClick = (rowIndex: number, colIndex: number) => {
    setSeatLayout((prev) =>
      prev.map((row, ri) =>
        ri === rowIndex
          ? row.map((seat, ci) =>
              ci === colIndex ? makeSeat(selectedSeatType, selectedOnsiteOnly) : seat,
            )
          : row,
      ),
    );
  };

  const calculateSeatStats = () => {
    let normal = 0,
      vip = 0,
      onsiteOnly = 0,
      total = 0;
    seatLayout.forEach((row) => {
      row.forEach((seat) => {
        if (seat.type !== 'empty') {
          total++;
          if (seat.type === 'normal') normal++;
          else if (seat.type === 'vip') vip++;
          if (seat.onsiteOnly) onsiteOnly++;
        }
      });
    });
    return { normal, vip, onsiteOnly, total };
  };

  // Hall data
  const [halls, setHalls] = useState([
    {
      id: 1,
      name: 'Hall 1',
      capacity: 120,
      rows: 10,
      seatsPerRow: 12,
      status: 'Active',
      currentMovie: 'Spider-Man: No Way Home',
      showtime: 'now_showing' as 'scheduled' | 'now_showing' | null,
      occupancy: 85,
      normalPrice: 12.0,
      vipPrice: null as number | null,
    },
    {
      id: 2,
      name: 'Hall 2',
      capacity: 150,
      rows: 12,
      seatsPerRow: 13,
      status: 'Active',
      currentMovie: 'Dune: Part Two',
      showtime: 'now_showing' as 'scheduled' | 'now_showing' | null,
      occupancy: 92,
      normalPrice: 14.0,
      vipPrice: null as number | null,
    },
    {
      id: 3,
      name: 'Hall 3',
      capacity: 100,
      rows: 8,
      seatsPerRow: 13,
      status: 'Active',
      currentMovie: 'The Matrix Resurrections',
      showtime: 'scheduled' as 'scheduled' | 'now_showing' | null,
      occupancy: 78,
      normalPrice: 10.0,
      vipPrice: null as number | null,
    },
    {
      id: 4,
      name: 'Hall 4',
      capacity: 80,
      rows: 8,
      seatsPerRow: 10,
      status: 'Inactive',
      currentMovie: null,
      showtime: null as 'scheduled' | 'now_showing' | null,
      occupancy: 0,
      normalPrice: null as number | null,
      vipPrice: null as number | null,
    },
    {
      id: 5,
      name: 'IMAX Hall',
      capacity: 200,
      rows: 14,
      seatsPerRow: 15,
      status: 'Active',
      currentMovie: 'Avatar: The Way of Water',
      showtime: 'now_showing' as 'scheduled' | 'now_showing' | null,
      occupancy: 95,
      normalPrice: 18.5,
      vipPrice: 32.0,
    },
    {
      id: 6,
      name: 'Hall 5',
      capacity: 90,
      rows: 9,
      seatsPerRow: 10,
      status: 'Active',
      currentMovie: 'The Dark Knight Returns',
      showtime: 'scheduled' as 'scheduled' | 'now_showing' | null,
      occupancy: 0,
      normalPrice: 11.0,
      vipPrice: null as number | null,
    },
    {
      id: 7,
      name: '4DX Hall',
      capacity: 60,
      rows: 6,
      seatsPerRow: 10,
      status: 'Under Maintenance',
      currentMovie: null,
      showtime: null as 'scheduled' | 'now_showing' | null,
      occupancy: 0,
      normalPrice: 22.0,
      vipPrice: 40.0,
    },
    {
      id: 8,
      name: 'Hall 6',
      capacity: 110,
      rows: 10,
      seatsPerRow: 11,
      status: 'Active',
      currentMovie: null,
      showtime: null as 'scheduled' | 'now_showing' | null,
      occupancy: 0,
      normalPrice: 13.0,
      vipPrice: 25.0,
    },
  ]);

  const nowShowingMovies = [
    {
      title: 'The Matrix Resurrections',
      poster:
        'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Sci-Fi',
      rating: 4.5,
      showtimes: 8,
      revenue: '$12,450',
      occupancy: '78%',
      status: 'Now Showing',
    },
    {
      title: 'Dune: Part Two',
      poster:
        'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Adventure',
      rating: 4.8,
      showtimes: 6,
      revenue: '$18,900',
      occupancy: '92%',
      status: 'Now Showing',
    },
    {
      title: 'Spider-Man: No Way Home',
      poster:
        'https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      rating: 4.7,
      showtimes: 10,
      revenue: '$24,350',
      occupancy: '85%',
      status: 'Now Showing',
    },
    {
      title: 'Avatar: The Way of Water',
      poster:
        'https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Fantasy',
      rating: 4.6,
      showtimes: 7,
      revenue: '$15,200',
      occupancy: '81%',
      status: 'Now Showing',
    },
  ];

  const upcomingMovies = [
    {
      title: 'The Dark Knight Returns',
      poster:
        'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Action',
      releaseDate: 'March 30, 2026',
      status: 'Upcoming',
    },
    {
      title: 'Interstellar Journey',
      poster:
        'https://images.unsplash.com/photo-1758232589376-9f3db5aa371d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      genre: 'Sci-Fi',
      releaseDate: 'April 5, 2026',
      status: 'Upcoming',
    },
  ];

  return (
    <div className="size-full flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Film size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cinema Admin</h1>
              <p className="text-xs text-gray-500">Management Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-auto">
          <div className="space-y-1">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home size={20} />
              <span className="flex-1 text-left font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSection('halls')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'halls'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Layout size={20} />
              <span className="flex-1 text-left font-medium">Halls</span>
            </button>

            <button
              onClick={() => setActiveSection('movies')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'movies'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Film size={20} />
              <span className="flex-1 text-left font-medium">Movies</span>
            </button>

            <button
              onClick={() => setActiveSection('payment')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'payment'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard size={20} />
              <span className="flex-1 text-left font-medium">Payment</span>
            </button>

            <button
              onClick={() => setActiveSection('statistics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === 'statistics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 size={20} />
              <span className="flex-1 text-left font-medium">Statistics</span>
            </button>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
                <Settings size={20} />
                <span className="flex-1 text-left font-medium">Settings</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-semibold">AU</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@cinema.com</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {activeSection === 'dashboard' && (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Welcome back! Here's what's happening today
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex items-center gap-2">
                    <BarChart3 size={18} />
                    <span>View Reports</span>
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                    <Plus size={18} />
                    <span>Quick Add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Today's Overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Today's Performance</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Real-time metrics for March 25, 2026
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('statistics')}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-sm"
                  >
                    View Full Statistics <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Ticket size={28} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
                      <p className="text-3xl font-bold text-gray-900">342</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        ↑ 12% vs yesterday
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign size={28} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">$8.5K</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        ↑ 15% vs yesterday
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users size={28} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Viewers</p>
                      <p className="text-3xl font-bold text-gray-900">156</p>
                      <p className="text-xs text-gray-600 mt-1">In theaters now</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={28} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                      <p className="text-3xl font-bold text-gray-900">84%</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">↑ 8% vs last week</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Layout size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                      <p className="text-sm text-gray-600">Total Halls</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-green-600">3</span> Active Now
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Manage →
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Film size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                      <p className="text-sm text-gray-600">Total Movies</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-purple-600">6</span> Now Showing
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All →
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Calendar size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                      <p className="text-sm text-gray-600">Today's Showtimes</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-orange-600">18</span> Scheduled
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Details →
                    </button>
                  </div>
                </div>
              </div>

              {/* Now Showing Movies */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Film className="text-purple-600" size={24} />
                      Now Showing Movies
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Currently screening in your cinema</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    View All <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {nowShowingMovies.map((movie, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group"
                    >
                      <div className="relative">
                        <ImageWithFallback
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-72 object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          {movie.rating}
                        </div>
                        <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                          {movie.status}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                            <button className="flex-1 bg-white text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1">
                              <Edit size={16} />
                              Edit
                            </button>
                            <button className="px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 truncate">{movie.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{movie.genre}</p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Clock size={14} />
                              Showtimes
                            </span>
                            <span className="font-semibold text-gray-900">
                              {movie.showtimes} times
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <DollarSign size={14} />
                              Revenue
                            </span>
                            <span className="font-semibold text-green-600">{movie.revenue}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Eye size={14} />
                              Occupancy
                            </span>
                            <span className="font-semibold text-blue-600">{movie.occupancy}</span>
                          </div>
                        </div>

                        <button className="w-full mt-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                          Manage Showtimes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Movies */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="text-orange-600" size={20} />
                      Upcoming Movies
                    </h3>
                    <div className="space-y-4">
                      {upcomingMovies.map((movie, index) => (
                        <div
                          key={index}
                          className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <ImageWithFallback
                            src={movie.poster}
                            alt={movie.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">
                              {movie.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">{movie.genre}</p>
                            <p className="text-xs text-orange-600 font-medium">
                              {movie.releaseDate}
                            </p>
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                        View All Upcoming
                      </button>
                    </div>
                  </div>
                </div>

                {/* Today's Showtimes Schedule */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="text-blue-600" size={20} />
                        Today's Schedule
                      </h3>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View Full Schedule
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          movie: 'Spider-Man: No Way Home',
                          hall: 'Hall 2',
                          time: '14:30',
                          seats: '89/150',
                          status: 'In Progress',
                          color: 'green',
                        },
                        {
                          movie: 'Dune: Part Two',
                          hall: 'Hall 3',
                          time: '15:00',
                          seats: '32/100',
                          status: 'Upcoming',
                          color: 'orange',
                        },
                        {
                          movie: 'The Matrix Resurrections',
                          hall: 'Hall 1',
                          time: '16:00',
                          seats: '45/120',
                          status: 'Upcoming',
                          color: 'orange',
                        },
                        {
                          movie: 'Avatar: The Way of Water',
                          hall: 'Hall 1',
                          time: '18:30',
                          seats: '67/120',
                          status: 'Upcoming',
                          color: 'orange',
                        },
                        {
                          movie: 'Dune: Part Two',
                          hall: 'Hall 2',
                          time: '19:00',
                          seats: '78/150',
                          status: 'Upcoming',
                          color: 'orange',
                        },
                      ].map((showtime, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                        >
                          <div className="text-center min-w-[80px]">
                            <p className="text-2xl font-bold text-gray-900">{showtime.time}</p>
                            <p className="text-xs text-gray-500 uppercase">{showtime.hall}</p>
                          </div>

                          <div className="h-12 w-px bg-gray-200"></div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{showtime.movie}</h4>
                            <div className="flex items-center gap-3 text-sm">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  showtime.color === 'green'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {showtime.status}
                              </span>
                              <span className="text-gray-600">
                                <Ticket size={14} className="inline mr-1" />
                                {showtime.seats} seats
                              </span>
                            </div>
                          </div>

                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Halls Management Section */}
        {activeSection === 'halls' && (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Halls Management</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage cinema halls, seats, and layouts
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowAddHallTypeModal(true);
                      setNewHallTypeName('');
                    }}
                    className="px-4 py-2 bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Settings size={18} />
                    <span>Manage Hall Types</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddHallModal(true);
                      setEditMode(false);
                      setSelectedHall(null);
                      setNumRows(10);
                      setSeatsPerRow(12);
                      initializeSeatLayout(10, 12);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={18} />
                    <span>Add New Hall</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Layout size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{halls.length}</p>
                      <p className="text-sm text-gray-600">Total Halls</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Eye size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {halls.filter((h) => h.status === 'Active').length}
                      </p>
                      <p className="text-sm text-gray-600">Active Halls</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {halls.reduce((acc, h) => acc + h.capacity, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Capacity</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <TrendingUp size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(halls.reduce((acc, h) => acc + h.occupancy, 0) / halls.length)}%
                      </p>
                      <p className="text-sm text-gray-600">Avg Occupancy</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Halls List */}
              {(() => {
                const filteredHalls = halls.filter((h) => {
                  if (!hallsSearch.trim()) return true;
                  const q = hallsSearch.toLowerCase();
                  return (
                    h.name.toLowerCase().includes(q) ||
                    h.status.toLowerCase().includes(q) ||
                    (h.currentMovie && h.currentMovie.toLowerCase().includes(q))
                  );
                });
                const totalPages = Math.ceil(filteredHalls.length / hallsPerPage);
                return (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">All Halls</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage your cinema halls and seating arrangements
                    </p>
                  </div>
                  <div className="relative w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={hallsSearch}
                      onChange={(e) => {
                        setHallsSearch(e.target.value);
                        setHallsPage(1);
                      }}
                      placeholder="Search halls..."
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {filteredHalls.length === 0 ? (
                    <div className="p-12 text-center">
                      <Search size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">No halls match "{hallsSearch}"</p>
                    </div>
                  ) : filteredHalls
                    .slice((hallsPage - 1) * hallsPerPage, hallsPage * hallsPerPage)
                    .map((hall) => (
                      <div key={hall.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                              <Layout size={32} className="text-white" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">{hall.name}</h4>
                                {hall.status === 'Under Maintenance' ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                    Under Maintenance
                                  </span>
                                ) : hall.status === 'Inactive' ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                    Inactive
                                  </span>
                                ) : hall.showtime === 'now_showing' ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    Now Showing
                                  </span>
                                ) : hall.showtime === 'scheduled' ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                    Scheduled
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Users size={16} />
                                  {hall.capacity} seats
                                </span>
                                <span className="flex items-center gap-1">
                                  <Layout size={16} />
                                  {hall.rows} rows × {hall.seatsPerRow} seats
                                </span>
                                {hall.currentMovie && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1">
                                      <Film size={16} />
                                      {hall.currentMovie}
                                    </span>
                                  </>
                                )}
                              </div>

                              {hall.occupancy > 0 && (
                                <div className="mt-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-600">Occupancy</span>
                                    <span className="text-xs font-semibold text-gray-900">
                                      {hall.occupancy}%
                                    </span>
                                  </div>
                                  <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                      style={{ width: `${hall.occupancy}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedHall(hall);
                                setEditMode(false);
                                setShowAddHallModal(true);
                                setNumRows(hall.rows);
                                setSeatsPerRow(hall.seatsPerRow);
                                initializeSeatLayout(hall.rows, hall.seatsPerRow);
                              }}
                              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 border border-blue-200"
                            >
                              <Eye size={16} />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedHall(hall);
                                setShowDeleteConfirm(true);
                              }}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                            >
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {(hallsPage - 1) * hallsPerPage + 1}–
                      {Math.min(hallsPage * hallsPerPage, filteredHalls.length)} of {filteredHalls.length} halls
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setHallsPage(hallsPage - 1)}
                        disabled={hallsPage === 1}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: totalPages },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setHallsPage(page)}
                          className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                            page === hallsPage
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setHallsPage(hallsPage + 1)}
                        disabled={hallsPage === totalPages}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
                );
              })()}
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Hall Modal */}
      {showAddHallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {!selectedHall
                      ? 'Add New Hall'
                      : editMode
                        ? `Edit ${selectedHall.name}`
                        : selectedHall.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {!selectedHall
                      ? 'Configure hall details and seat layout'
                      : editMode
                        ? 'Editing hall details and seat layout'
                        : 'Hall details and seat layout'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedHall && !editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                      title="Switch to Edit mode"
                    >
                      <Edit size={20} />
                    </button>
                  )}
                  {selectedHall && editMode && (
                    <button
                      onClick={() => setEditMode(false)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      title="Switch to View mode"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddHallModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            {(() => {
              const viewMode = !!selectedHall && !editMode;
              return (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Hall Details */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Settings size={20} className="text-blue-600" />
                          Hall Information
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Hall Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Hall 1, VIP Hall, IMAX"
                              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              defaultValue={selectedHall?.name ?? ''}
                              disabled={viewMode}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Rows
                              </label>
                              <input
                                type="number"
                                placeholder="10"
                                min="1"
                                max="20"
                                value={numRows}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 10;
                                  setNumRows(val);
                                  initializeSeatLayout(val, seatsPerRow);
                                }}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                disabled={viewMode}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seats per Row
                              </label>
                              <input
                                type="number"
                                placeholder="12"
                                min="1"
                                max="20"
                                value={seatsPerRow}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 12;
                                  setSeatsPerRow(val);
                                  initializeSeatLayout(numRows, val);
                                }}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                disabled={viewMode}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Status
                            </label>
                            <select
                              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              disabled={viewMode}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Maintenance">Under Maintenance</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type
                            </label>
                            <select
                              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              disabled={viewMode}
                            >
                              {hallTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div
                            className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 ${viewMode ? 'bg-gray-100' : 'bg-gray-50'}`}
                          >
                            <label className="text-sm font-medium text-gray-700">Supports 3D</label>
                            <button
                              type="button"
                              role="switch"
                              aria-checked="false"
                              disabled={viewMode}
                              className={`group relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${viewMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                              onClick={(e) => {
                                const btn = e.currentTarget;
                                const isOn = btn.getAttribute('aria-checked') === 'true';
                                btn.setAttribute('aria-checked', String(!isOn));
                                btn.classList.toggle('bg-blue-600', !isOn);
                                btn.classList.toggle('bg-gray-200', isOn);
                                const knob = btn.firstElementChild as HTMLElement;
                                knob.classList.toggle('translate-x-5', !isOn);
                                knob.classList.toggle('translate-x-0', isOn);
                              }}
                            >
                              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                            </button>
                          </div>

                          {!viewMode && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Copy Layout From Existing Hall
                              </label>
                              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Create new layout</option>
                                {halls.map((h) => (
                                  <option key={h.id} value={h.id}>
                                    {h.name} ({h.rows}×{h.seatsPerRow})
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                Select a hall to copy its seat configuration
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {!viewMode && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Star size={20} className="text-purple-600" />
                            Seat Categories
                          </h4>

                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-600">Seat Type</p>

                            <button
                              onClick={() => setSelectedSeatType('normal')}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                selectedSeatType === 'normal'
                                  ? 'bg-blue-100 border-blue-500 shadow-md'
                                  : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                                <span className="font-medium text-gray-900">Normal</span>
                              </div>
                              {selectedSeatType === 'normal' && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                  Selected
                                </span>
                              )}
                            </button>

                            <button
                              onClick={() => setSelectedSeatType('vip')}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                selectedSeatType === 'vip'
                                  ? 'bg-purple-100 border-purple-500 shadow-md'
                                  : 'bg-purple-50 border-purple-200 hover:border-purple-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-purple-500 rounded"></div>
                                <span className="font-medium text-gray-900">VIP</span>
                              </div>
                              {selectedSeatType === 'vip' && (
                                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                  Selected
                                </span>
                              )}
                            </button>

                            <button
                              onClick={() => setSelectedSeatType('empty')}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                selectedSeatType === 'empty'
                                  ? 'bg-gray-200 border-gray-500 shadow-md'
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                                <span className="font-medium text-gray-900">Space/Aisle</span>
                              </div>
                              {selectedSeatType === 'empty' && (
                                <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                                  Selected
                                </span>
                              )}
                            </button>

                            {selectedSeatType !== 'empty' && (
                              <>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-3 mb-1">
                                  Reservation
                                </p>
                                <div
                                  onClick={() => setSelectedOnsiteOnly(!selectedOnsiteOnly)}
                                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    selectedOnsiteOnly
                                      ? 'bg-orange-100 border-orange-400 shadow-md'
                                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                        selectedOnsiteOnly
                                          ? 'bg-orange-500 text-white'
                                          : 'bg-gray-300 text-gray-500'
                                      }`}
                                    >
                                      S
                                    </div>
                                    <span className="font-medium text-gray-900">On-Site Only</span>
                                  </div>
                                  <div
                                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                                      selectedOnsiteOnly ? 'bg-orange-500' : 'bg-gray-200'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        selectedOnsiteOnly ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs text-gray-700 text-center">
                                <strong>Tip:</strong> Select a seat type above, then click on seats
                                in the layout to apply it
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <DollarSign size={20} className="text-green-600" />
                          Ticket Pricing{' '}
                          <span className="text-xs font-normal text-orange-400">(without VAT)</span>
                        </h4>
                        <div className="space-y-3">
                          {calculateSeatStats().normal > 0 && (
                            <div>
                              <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                Normal Seat
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  defaultValue={selectedHall?.normalPrice ?? ''}
                                  disabled={viewMode}
                                  className={`w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                              </div>
                            </div>
                          )}
                          {calculateSeatStats().vip > 0 && (
                            <div>
                              <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
                                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                                VIP Seat
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  defaultValue={selectedHall?.vipPrice ?? ''}
                                  disabled={viewMode}
                                  className={`w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Seat Layout */}
                    <div>
                      <div className="sticky top-0">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Layout size={20} className="text-blue-600" />
                          {viewMode ? 'Seat Layout' : 'Seat Layout Editor'}
                        </h4>

                        <div className="bg-gray-100 rounded-xl p-6 border-2 border-gray-300">
                          {/* Screen */}
                          <div className="mb-6">
                            <div className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-lg p-3 shadow-lg">
                              <p className="text-center text-white text-sm font-semibold">SCREEN</p>
                            </div>
                          </div>

                          {/* Seat Grid */}
                          <div className="bg-white rounded-lg p-4 shadow-inner max-h-96 overflow-auto">
                            <div className="flex flex-col gap-3">
                              {seatLayout.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-500 w-6 text-center">
                                    {String.fromCharCode(65 + rowIndex)}
                                  </span>
                                  <div className="flex gap-2 flex-1 justify-center">
                                    {row.map((seat, seatIndex) => {
                                      const seatId = `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`;

                                      if (seat.type === 'empty') {
                                        return (
                                          <div
                                            key={seatIndex}
                                            onClick={() =>
                                              !viewMode && handleSeatClick(rowIndex, seatIndex)
                                            }
                                            className={`w-6 h-6 rounded transition-all bg-transparent border-2 border-dashed border-gray-300 ${viewMode ? 'cursor-default' : 'hover:scale-110 hover:border-gray-400 cursor-pointer'}`}
                                            title={`${seatId} (Aisle)${viewMode ? '' : ' - Click to change'}`}
                                          ></div>
                                        );
                                      }

                                      const colorMap = {
                                        normal: 'bg-blue-500',
                                        vip: 'bg-purple-500',
                                      };
                                      const hoverMap = {
                                        normal: 'hover:bg-blue-600',
                                        vip: 'hover:bg-purple-600',
                                      };
                                      const label = seat.type === 'vip' ? 'VIP' : 'Normal';
                                      const onsiteLabel = seat.onsiteOnly ? ', On-Site Only' : '';

                                      return (
                                        <div
                                          key={seatIndex}
                                          onClick={() =>
                                            !viewMode && handleSeatClick(rowIndex, seatIndex)
                                          }
                                          className={`relative w-6 h-6 rounded transition-all ${colorMap[seat.type]} ${viewMode ? 'cursor-default' : `${hoverMap[seat.type]} hover:scale-110 cursor-pointer`}`}
                                          title={`${seatId} (${label}${onsiteLabel})${viewMode ? '' : ' - Click to change'}`}
                                        >
                                          {seat.onsiteOnly && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full border border-white" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-blue-500 rounded"></div>
                              <span className="text-gray-600">
                                Normal ({calculateSeatStats().normal})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-purple-500 rounded"></div>
                              <span className="text-gray-600">
                                VIP ({calculateSeatStats().vip})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="relative w-4 h-4 bg-gray-400 rounded">
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-white" />
                              </div>
                              <span className="text-gray-600">
                                On-Site Only ({calculateSeatStats().onsiteOnly})
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-gray-700 text-center">
                              <strong>Total Seats:</strong> {calculateSeatStats().total} (Normal:{' '}
                              {calculateSeatStats().normal}, VIP: {calculateSeatStats().vip},
                              On-Site Only: {calculateSeatStats().onsiteOnly})
                            </p>
                          </div>

                          {!viewMode && (
                            <button
                              type="button"
                              onClick={() => {
                                setSeatLayout((prev) =>
                                  prev.map((row) => row.map(() => makeSeat('normal'))),
                                );
                              }}
                              className="mt-4 w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Reset Layout
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            {(editMode || !selectedHall) && (
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setShowAddHallModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button className="px-6 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-300">
                    Save as Draft
                  </button>
                  <button className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md">
                    {editMode ? 'Update Hall' : 'Create Hall'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Hall</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{selectedHall?.name}</strong>? This action
                cannot be undone and will remove all seat configurations and associated data.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Warning:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All seat reservations will be cancelled</li>
                      <li>Scheduled showtimes will be removed</li>
                      <li>Historical data will be archived</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setHalls(halls.filter((h) => h.id !== selectedHall?.id));
                    setShowDeleteConfirm(false);
                    setSelectedHall(null);
                  }}
                  className="flex-1 px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md"
                >
                  Delete Hall
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showAddHallTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Manage Hall Types</h3>
              <p className="text-sm text-gray-600 mt-1">Create a new hall type for your cinema</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Types
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {hallTypes.map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {editingHallType === type ? (
                        <input
                          type="text"
                          value={editingHallTypeName}
                          onChange={(e) => setEditingHallTypeName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const trimmed = editingHallTypeName.trim();
                              if (trimmed && (trimmed === type || !hallTypes.includes(trimmed))) {
                                setHallTypes(hallTypes.map((t) => (t === type ? trimmed : t)));
                              }
                              setEditingHallType(null);
                            } else if (e.key === 'Escape') {
                              setEditingHallType(null);
                            }
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-800">{type}</span>
                      )}
                      <div className="flex items-center gap-1 ml-2">
                        {editingHallType === type ? (
                          <>
                            <button
                              onClick={() => {
                                const trimmed = editingHallTypeName.trim();
                                if (trimmed && (trimmed === type || !hallTypes.includes(trimmed))) {
                                  setHallTypes(hallTypes.map((t) => (t === type ? trimmed : t)));
                                }
                                setEditingHallType(null);
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Save"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditingHallType(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                              title="Cancel"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingHallType(type);
                                setEditingHallTypeName(type);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setHallTypes(hallTypes.filter((t) => t !== type))}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Type Name
                </label>
                <input
                  type="text"
                  value={newHallTypeName}
                  onChange={(e) => setNewHallTypeName(e.target.value)}
                  placeholder="e.g., ScreenX, Dolby Atmos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowAddHallTypeModal(false);
                  setEditingHallType(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const trimmed = newHallTypeName.trim();
                  if (trimmed && !hallTypes.includes(trimmed)) {
                    setHallTypes([...hallTypes, trimmed]);
                    setNewHallTypeName('');
                  }
                }}
                disabled={!newHallTypeName.trim() || hallTypes.includes(newHallTypeName.trim())}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
