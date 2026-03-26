import { useState } from "react";
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
  Settings,
  ChevronRight,
  BarChart3,
  AlertCircle,
  Search,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nowShowingMovies = [
    {
      title: "The Matrix Resurrections",
      poster:
        "https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      genre: "Sci-Fi",
      showtimes: 8,
      revenue: "$12,450",
      occupancy: "78%",
      ticketsSold: 284,
      status: "Now Showing",
    },
    {
      title: "Dune: Part Two",
      poster:
        "https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      genre: "Adventure",
      showtimes: 6,
      revenue: "$18,900",
      occupancy: "92%",
      ticketsSold: 517,
      status: "Now Showing",
    },
    {
      title: "Spider-Man: No Way Home",
      poster:
        "https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      genre: "Action",
      showtimes: 10,
      revenue: "$24,350",
      occupancy: "85%",
      ticketsSold: 638,
      status: "Now Showing",
    },
    {
      title: "Avatar: The Way of Water",
      poster:
        "https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      genre: "Fantasy",
      showtimes: 7,
      revenue: "$15,200",
      occupancy: "81%",
      ticketsSold: 391,
      status: "Now Showing",
    },
  ];

  const upcomingMovies = [
    {
      title: "The Dark Knight Returns",
      poster:
        "https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      genre: "Action",
      releaseDate: "March 30, 2026",
      daysLeft: 5,
    },
    {
      title: "Interstellar Journey",
      poster:
        "https://images.unsplash.com/photo-1758232589376-9f3db5aa371d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      genre: "Sci-Fi",
      releaseDate: "April 5, 2026",
      daysLeft: 11,
    },
    {
      title: "Eternal Horizon",
      poster:
        "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      genre: "Drama",
      releaseDate: "April 12, 2026",
      daysLeft: 18,
    },
  ];

  return (
    <div className="size-full flex bg-gray-50">
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Film size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cinefy</h1>
              <p className="text-xs text-gray-500">Management Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-auto">
          <div className="space-y-1">
            {([
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'halls', label: 'Halls', icon: Layout },
              { id: 'movies', label: 'Movies', icon: Film },
              { id: 'payment', label: 'Payment', icon: CreditCard },
              { id: 'statistics', label: 'Statistics', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  activeSection === item.id ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon size={20} />
                <span className="flex-1 text-left font-medium">{item.label}</span>
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-200">
              <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all cursor-pointer">
                <Settings size={20} />
                <span className="flex-1 text-left font-medium">Settings</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3 sm:gap-6">
              {/* Left: Hamburger + Date & Time */}
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <Menu size={22} />
                </button>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center hidden sm:flex">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">Tuesday, Mar 25, 2026</p>
                  <p className="text-[11px] text-gray-400">Welcome back, Admin</p>
                </div>
              </div>

              {/* Center: Search
              <div className="flex-1 max-w-md">
                <div className="relative group">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Search movies, halls, schedules..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border border-transparent rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
              */}

              {/* Right: Actions & Profile */}
              <div className="flex items-center gap-2">
                {/* Quick Add */}
                <div className="relative">
                  <button
                    onClick={() => setQuickAddOpen(!quickAddOpen)}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-blue-600/20 active:scale-[0.97]"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Quick Add</span>
                    <ChevronDown size={14} className={`transition-transform hidden sm:block ${quickAddOpen ? "rotate-180" : ""}`} />
                  </button>
                  {quickAddOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setQuickAddOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-200/60 py-1.5 z-30 overflow-hidden">
                        <button
                          onClick={() => setQuickAddOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Film size={16} className="text-gray-400" />
                          Movie
                        </button>
                        <button
                          onClick={() => setQuickAddOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Layout size={16} className="text-gray-400" />
                          Hall
                        </button>
                        <button
                          onClick={() => setQuickAddOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Clock size={16} className="text-gray-400" />
                          Showtime
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 mx-1" />

                {/* User Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-sm shadow-blue-500/30">
                      <span className="text-white text-xs font-bold">AU</span>
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">Admin User</p>
                      <p className="text-[11px] text-gray-400">Administrator</p>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 group-hover:text-gray-600 transition-all hidden lg:block ${profileOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-200/60 py-1.5 z-30 overflow-hidden">
                        <button
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <User size={16} className="text-gray-400" />
                          My Profile
                        </button>
                        <div className="my-1.5 border-t border-gray-100" />
                        <button
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut size={16} className="text-red-400" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Today's Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Today's Performance</h3>
            <p className="text-sm text-gray-600 mb-6">Real-time metrics for March 25, 2026</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Ticket size={28} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
                  <p className="text-3xl font-bold text-gray-900">342</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">↑ 12% vs yesterday</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign size={28} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">$8.5K</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">↑ 15% vs yesterday</p>
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

          {/* Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Layout size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Halls</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">3 active</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Film size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Movies</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <span className="ml-auto text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">6 showing</span>
              </div>
            </div>
          </div>

          {/* Now Showing Movies */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Film className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Now Showing</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{nowShowingMovies.length} movies screening today</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1">
                View All <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nowShowingMovies.map((movie, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200/80 p-4 flex gap-4 hover:shadow-md transition-all"
                >
                  {/* Small poster */}
                  <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/5">
                    <ImageWithFallback src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{movie.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{movie.genre}</p>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-auto gap-3">
                      <div className="flex items-center flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock size={15} className="text-gray-400" />
                          <span className="font-bold text-gray-800">{movie.showtimes}</span> shows
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Ticket size={15} className="text-gray-400" />
                          <span className="font-bold text-purple-600">{movie.ticketsSold}</span> sold
                        </span>
                        <span className="flex items-center gap-1.5">
                          <DollarSign size={15} className="text-gray-400" />
                          <span className="font-bold text-green-600">{movie.revenue}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={15} className="text-gray-400" />
                          <span className="font-bold text-blue-600">{movie.occupancy}</span>
                        </span>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button className="px-3.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                          View Details
                        </button>
                        <button className="px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Upcoming Movies */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Calendar className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Upcoming</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{upcomingMovies.length} movies scheduled</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {upcomingMovies.map((movie, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors cursor-pointer"
                    >
                      <div className="w-11 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/5">
                        <ImageWithFallback
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{movie.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{movie.genre}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock size={11} className="text-orange-500" />
                          <span className="text-[11px] font-medium text-orange-600">{movie.daysLeft} days left</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-gray-500">{movie.releaseDate.split(",")[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                  <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer">
                    View All Upcoming
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Showtimes Schedule */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Today's Schedule</h3>
                      <p className="text-xs text-gray-400 mt-0.5">5 showtimes remaining</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors cursor-pointer self-start sm:self-auto">
                    View Full Schedule
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {[
                    {
                      movie: "Spider-Man: No Way Home",
                      poster:
                        "https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                      hall: "Hall 2",
                      time: "14:30",
                      endTime: "16:45",
                      seats: "89/150",
                      status: "In Progress",
                      color: "green",
                    },
                    {
                      movie: "Dune: Part Two",
                      poster:
                        "https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                      hall: "Hall 3",
                      time: "15:00",
                      endTime: "17:30",
                      seats: "32/100",
                      status: "Upcoming",
                      color: "orange",
                    },
                    {
                      movie: "The Matrix Resurrections",
                      poster:
                        "https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                      hall: "Hall 1",
                      time: "16:00",
                      endTime: "18:20",
                      seats: "45/120",
                      status: "Upcoming",
                      color: "orange",
                    },
                    {
                      movie: "Avatar: The Way of Water",
                      poster:
                        "https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                      hall: "Hall 1",
                      time: "18:30",
                      endTime: "21:15",
                      seats: "67/120",
                      status: "Upcoming",
                      color: "orange",
                    },
                    {
                      movie: "Dune: Part Two",
                      poster:
                        "https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                      hall: "Hall 2",
                      time: "19:00",
                      endTime: "21:30",
                      seats: "78/150",
                      status: "Upcoming",
                      color: "orange",
                    },
                  ].map((showtime, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4 hover:bg-gray-50/80 transition-colors cursor-pointer ${showtime.color === "green" ? "bg-green-50/30" : ""}`}
                    >
                      {/* Poster */}
                      <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        <ImageWithFallback
                          src={showtime.poster}
                          alt={showtime.movie}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Movie & Hall */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{showtime.movie}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Layout size={12} />
                            {showtime.hall}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Ticket size={12} />
                            {showtime.seats}
                          </span>
                        </div>
                      </div>

                      {/* Time Block */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums">
                          {showtime.time} – {showtime.endTime}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            showtime.color === "green" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${showtime.color === "green" ? "bg-green-500 animate-pulse" : "bg-orange-400"}`}
                          />
                          {showtime.status}
                        </span>
                      </div>

                      <ChevronRight size={16} className="text-gray-300 flex-shrink-0 hidden sm:block" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
