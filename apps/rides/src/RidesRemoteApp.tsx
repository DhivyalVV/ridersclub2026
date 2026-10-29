import * as React from 'react';
import {
  Ban,
  Calendar,
  CheckCircle2,
  Compass,
  ExternalLink,
  Flag,
  LogOut,
  MapPin,
  Navigation,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  RideStatus,
  UserRole,
  type AuthenticatedUserAccount,
  type RideItem,
  type RideParticipantItem,
} from '@ridersclub/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  UserProfileCard,
} from '@ridersclub/ui';

const API_BASE_URL = 'http://localhost:4000/api/v1';
const AUTH_STORAGE_KEY = 'ridersclub:access_token';
const AUTH_USER_STORAGE_KEY = 'ridersclub_auth_user';

const INITIAL_RIDES: RideItem[] = [
  {
    id: 'ride-1',
    title: 'Nandi Hills Sunrise Breakfast Run',
    description:
      'Disciplined staggered formation ride departing Hebbal flyover at 05:30 AM. Mandatory full riding gear (ECE helmet, gloves, jacket, boots).',
    startLocation: 'Hebbal Flyover Toll, Bengaluru',
    destination: 'Nandi Hills Foothills Cafe',
    departureAt: '2026-11-02T05:30:00.000Z',
    dateTimeLabel: 'Sun, Nov 02 • 05:30 AM IST',
    capacity: 20,
    participantCount: 16,
    status: RideStatus.UPCOMING,
    isJoinedByViewer: false,
    createdAt: new Date().toISOString(),
    organizer: {
      id: 'user-founder-1',
      displayName: 'Vikramaditya Rao',
      username: 'vikram_adv',
      avatarUrl: null,
      bio: 'Lead ride marshal • Tiger 900 Rally Pro',
      city: 'Bengaluru',
      role: UserRole.MODERATOR,
      canReceiveDirectMessage: true,
    },
    routePreview: {
      providerName: 'OpenStreetMap / OSRM Route Adapter',
      startAddress: 'Hebbal Flyover Toll, Bengaluru',
      destinationAddress: 'Nandi Hills Foothills Cafe',
      estimatedDistanceKm: 65,
      estimatedDurationMinutes: 85,
      waypoints: [
        'Assembly & Safety Briefing: Hebbal Flyover Toll, Bengaluru',
        'Mid-Route Fuel & Hydration Checkpoint',
        'Final Destination: Nandi Hills Foothills Cafe',
      ],
      mapExternalUrl:
        'https://www.openstreetmap.org/search?query=Hebbal%20Flyover%20Toll%20to%20Nandi%20Hills',
    },
  },
  {
    id: 'ride-2',
    title: 'Coorg Coffee Estate Weekend Overnighter',
    description:
      'Two-day touring circuit via Mysuru bypass and Kushalnagar with scenic tarmac and mild estate trails. Suitable for both touring motorcycles and sport sedans.',
    startLocation: 'NICE Road Junction, Kengeri',
    destination: 'Madikeri, Coorg',
    departureAt: '2026-11-15T06:00:00.000Z',
    dateTimeLabel: 'Sat, Nov 15 • 06:00 AM IST',
    capacity: 15,
    participantCount: 15,
    status: RideStatus.UPCOMING,
    isJoinedByViewer: false,
    createdAt: new Date().toISOString(),
    organizer: {
      id: 'user-organizer-2',
      displayName: 'Siddharth Menon',
      username: 'sid_tourer',
      avatarUrl: null,
      bio: 'Endurance tourer • V-Strom 650 XT',
      city: 'Kochi',
      role: UserRole.USER,
      canReceiveDirectMessage: true,
    },
    routePreview: {
      providerName: 'OpenStreetMap / OSRM Route Adapter',
      startAddress: 'NICE Road Junction, Kengeri',
      destinationAddress: 'Madikeri, Coorg',
      estimatedDistanceKm: 255,
      estimatedDurationMinutes: 310,
      waypoints: [
        'Assembly & Safety Briefing: NICE Road Junction, Kengeri',
        'Mid-Route Fuel & Hydration Checkpoint',
        'Final Destination: Madikeri, Coorg',
      ],
      mapExternalUrl:
        'https://www.openstreetmap.org/search?query=NICE%20Road%20Kengeri%20to%20Madikeri%20Coorg',
    },
  },
];

function getStoredToken(): string | null {
  try {
    return (
      window.localStorage.getItem(AUTH_STORAGE_KEY) ??
      window.localStorage.getItem('ridersclub_auth_token')
    );
  } catch {
    return null;
  }
}

function getStoredUser(): AuthenticatedUserAccount | null {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedUserAccount) : null;
  } catch {
    return null;
  }
}

export function RidesRemoteApp(): React.JSX.Element {
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | RideStatus>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [rides, setRides] = React.useState<RideItem[]>(INITIAL_RIDES);
  const [statusBanner, setStatusBanner] = React.useState<string | null>(null);

  // Host a Ride Modal / Form State
  const [showHostForm, setShowHostForm] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState('');
  const [startLocationInput, setStartLocationInput] = React.useState('');
  const [destinationInput, setDestinationInput] = React.useState('');
  const [departureAtInput, setDepartureAtInput] = React.useState('2026-11-22T06:00');
  const [capacityInput, setCapacityInput] = React.useState(18);
  const [descriptionInput, setDescriptionInput] = React.useState('');

  // Selected Ride Roster & Route Map Preview State
  const [selectedRide, setSelectedRide] = React.useState<RideItem | null>(null);
  const [selectedRoster, setSelectedRoster] = React.useState<RideParticipantItem[]>([]);

  React.useEffect(() => {
    const token = getStoredToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    fetch(`${API_BASE_URL}/rides`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RideItem[] | null) => {
        if (Array.isArray(data) && data.length > 0) {
          setRides(data);
        }
      })
      .catch(() => {
        // Keep initial rides in standalone/unit test mode
      });
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredRides = rides.filter((ride) => {
    const matchesStatus = statusFilter === 'ALL' || ride.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      ride.title.toLowerCase().includes(normalizedSearch) ||
      ride.startLocation.toLowerCase().includes(normalizedSearch) ||
      ride.destination.toLowerCase().includes(normalizedSearch) ||
      ride.description.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = titleInput.trim();
    const trimmedStart = startLocationInput.trim();
    const trimmedDest = destinationInput.trim();
    const trimmedDesc = descriptionInput.trim();
    if (!trimmedTitle || !trimmedStart || !trimmedDest || !trimmedDesc) return;

    const token = getStoredToken();
    const currentUser = getStoredUser();
    const isoDeparture = new Date(departureAtInput).toISOString();

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/rides`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: trimmedTitle,
            startLocation: trimmedStart,
            destination: trimmedDest,
            departureAt: isoDeparture,
            capacity: Number(capacityInput) || 15,
            description: trimmedDesc,
          }),
        });

        if (res.ok) {
          const created = (await res.json()) as RideItem;
          setRides((prev) => [created, ...prev]);
          setShowHostForm(false);
          setTitleInput('');
          setStartLocationInput('');
          setDestinationInput('');
          setDescriptionInput('');
          setStatusBanner(`Hosted new group ride "${created.title}"!`);
          return;
        }
      } catch {
        // Fallback below
      }
    }

    const fallbackRide: RideItem = {
      id: `ride-local-${Date.now()}`,
      title: trimmedTitle,
      description: trimmedDesc,
      startLocation: trimmedStart,
      destination: trimmedDest,
      departureAt: isoDeparture,
      dateTimeLabel: 'Sun, Nov 22 • 06:00 AM IST',
      capacity: Math.max(2, Number(capacityInput) || 15),
      participantCount: 1,
      status: RideStatus.UPCOMING,
      isJoinedByViewer: true,
      createdAt: new Date().toISOString(),
      organizer: {
        id: currentUser?.id ?? 'local-organizer',
        displayName: currentUser?.profile.displayName ?? 'You (Ride Marshal)',
        username: currentUser?.profile.username ?? 'ride_marshal',
        avatarUrl: currentUser?.profile.avatarUrl ?? null,
        bio: currentUser?.profile.bio ?? 'Group Ride Organizer',
        city: currentUser?.profile.city ?? 'Bengaluru',
        role: currentUser?.role ?? UserRole.USER,
        canReceiveDirectMessage: true,
      },
      routePreview: {
        providerName: 'OpenStreetMap / OSRM Route Adapter',
        startAddress: trimmedStart,
        destinationAddress: trimmedDest,
        estimatedDistanceKm: 110,
        estimatedDurationMinutes: 140,
        waypoints: [
          `Assembly & Safety Briefing: ${trimmedStart}`,
          'Mid-Route Fuel & Hydration Checkpoint',
          `Final Destination: ${trimmedDest}`,
        ],
        mapExternalUrl: `https://www.openstreetmap.org/search?query=${encodeURIComponent(
          `${trimmedStart} to ${trimmedDest}`,
        )}`,
      },
    };

    setRides((prev) => [fallbackRide, ...prev]);
    setShowHostForm(false);
    setTitleInput('');
    setStartLocationInput('');
    setDestinationInput('');
    setDescriptionInput('');
    setStatusBanner(`Hosted new group ride "${fallbackRide.title}"!`);
  };

  const handleJoinRide = async (ride: RideItem) => {
    if (ride.participantCount >= ride.capacity || ride.status !== RideStatus.UPCOMING) {
      return;
    }

    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/rides/${ride.id}/join`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            participantCount: number;
            joined: boolean;
          };
          setRides((prev) =>
            prev.map((r) =>
              r.id === ride.id
                ? {
                    ...r,
                    participantCount: data.participantCount,
                    isJoinedByViewer: data.joined,
                  }
                : r,
            ),
          );
          setStatusBanner(`Joined "${ride.title}"! Your spot on the roster is confirmed.`);
          return;
        }
      } catch {
        // Fallback below
      }
    }

    setRides((prev) =>
      prev.map((r) =>
        r.id === ride.id
          ? {
              ...r,
              participantCount: Math.min(r.capacity, r.participantCount + 1),
              isJoinedByViewer: true,
            }
          : r,
      ),
    );
    setStatusBanner(`Joined "${ride.title}"! Your spot on the roster is confirmed.`);
  };

  const handleLeaveRide = async (ride: RideItem) => {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/rides/${ride.id}/leave`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore network error in fallback mode
      }
    }

    setRides((prev) =>
      prev.map((r) =>
        r.id === ride.id
          ? {
              ...r,
              participantCount: Math.max(1, r.participantCount - 1),
              isJoinedByViewer: false,
            }
          : r,
      ),
    );
    setStatusBanner(`Left "${ride.title}".`);
  };

  const handleCancelRide = async (ride: RideItem) => {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/rides/${ride.id}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore network error in fallback mode
      }
    }

    setRides((prev) =>
      prev.map((r) =>
        r.id === ride.id ? { ...r, status: RideStatus.CANCELLED } : r,
      ),
    );
    if (selectedRide?.id === ride.id) {
      setSelectedRide((prev) =>
        prev ? { ...prev, status: RideStatus.CANCELLED } : null,
      );
    }
    setStatusBanner(`Cancelled ride "${ride.title}".`);
  };

  const handleOpenRideDetails = async (ride: RideItem) => {
    setSelectedRide(ride);
    setSelectedRoster([
      {
        id: `part-${ride.organizer.id}`,
        rideId: ride.id,
        userId: ride.organizer.id,
        joinedAt: ride.createdAt,
        user: ride.organizer,
      },
    ]);

    const token = getStoredToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const res = await fetch(`${API_BASE_URL}/rides/${ride.id}`, { headers });
      if (res.ok) {
        const full = (await res.json()) as RideItem;
        setSelectedRide(full);
        if (full.participants) {
          setSelectedRoster(full.participants);
        }
      }
    } catch {
      // Keep local preview roster
    }
  };

  return (
    <section aria-label="Group Rides Federated Module" className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-5 text-white shadow-md sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary-200" aria-hidden="true" />
            <span>Federated Remote • @ridersclub/rides (:5002)</span>
          </div>
          <Badge variant="secondary" className="border-none bg-emerald-100 text-emerald-950">
            Phase 8 Live Group Rides & Route Adapter
          </Badge>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Group Ride Organization
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-primary-100 sm:text-base">
              Host, discover, and join capacity-managed group rides. Contact ride organizers
              directly via 1:1 private chat for route briefings and gear requirements.
            </p>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-primary-900 hover:bg-primary-50"
            onClick={() => setShowHostForm(true)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Host a Ride
          </Button>
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusBanner ? (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {statusBanner}
          </span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Host a New Group Ride Form Panel */}
      {showHostForm ? (
        <Card className="border-primary-200 bg-primary-50/40">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Host a New Group Ride</CardTitle>
              <CardDescription>
                Specify starting assembly point, destination, rider capacity limit, and mandatory
                safety gear requirements.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Close host ride form"
              onClick={() => setShowHostForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleCreateRide(e)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ride-title-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Ride Title
                  </label>
                  <input
                    id="ride-title-input"
                    type="text"
                    required
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g., Western Ghats Agumbe Monsoon Trail"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ride-capacity-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Maximum Rider Capacity
                  </label>
                  <input
                    id="ride-capacity-input"
                    type="number"
                    min={2}
                    max={200}
                    required
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="ride-start-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Starting Assembly Point
                  </label>
                  <input
                    id="ride-start-input"
                    type="text"
                    required
                    value={startLocationInput}
                    onChange={(e) => setStartLocationInput(e.target.value)}
                    placeholder="Nelamangala Toll Plaza"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ride-dest-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Destination
                  </label>
                  <input
                    id="ride-dest-input"
                    type="text"
                    required
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    placeholder="Agumbe Sunset Viewpoint"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ride-date-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Departure Date & Time
                  </label>
                  <input
                    id="ride-date-input"
                    type="datetime-local"
                    required
                    value={departureAtInput}
                    onChange={(e) => setDepartureAtInput(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ride-desc-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Briefing & Mandatory Gear Notes
                </label>
                <textarea
                  id="ride-desc-input"
                  rows={3}
                  required
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Describe formation rules, fuel stops, and required riding gear..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHostForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Publish Group Ride</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Selected Ride Roster & Route Map Provider Detail Panel */}
      {selectedRide ? (
        <Card className="border-2 border-primary-600 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedRide.status}</Badge>
                  <Badge variant="secondary">
                    {selectedRide.participantCount}/{selectedRide.capacity} Riders Confirmed
                  </Badge>
                </div>
                <CardTitle className="mt-1.5 text-xl">{selectedRide.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {selectedRide.status === RideStatus.UPCOMING ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleCancelRide(selectedRide)}
                  >
                    <Ban className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                    Cancel Ride
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedRide(null)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Close Details
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-6 pt-5 lg:grid-cols-2">
            {/* Route Map Provider Abstraction Card */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-700">
                  <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                  {selectedRide.routePreview.providerName}
                </span>
                <Badge variant="outline">
                  ~{selectedRide.routePreview.estimatedDistanceKm} km •{' '}
                  {selectedRide.routePreview.estimatedDurationMinutes} mins
                </Badge>
              </div>

              <div className="space-y-2 pt-1 text-xs text-slate-700">
                {selectedRide.routePreview.waypoints.map((wp, idx) => (
                  <div
                    key={wp}
                    className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-xs"
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-800">
                      {idx + 1}
                    </span>
                    <span>{wp}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <a
                  href={selectedRide.routePreview.mapExternalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
                >
                  Open Interactive Route in OpenStreetMap
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Confirmed Participant Roster */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Confirmed Participant Roster ({selectedRoster.length})
              </h3>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {selectedRoster.map((part) => (
                  <UserProfileCard
                    key={part.id}
                    user={part.user}
                    contextLabel={`Ride Roster: ${selectedRide.title}`}
                    compact
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Filter & Search Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {(
            ['ALL', RideStatus.UPCOMING, RideStatus.COMPLETED, RideStatus.CANCELLED] as const
          ).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'ALL' ? 'All Rides' : status}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rides, start or destination..."
            aria-label="Search group rides"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
      </div>

      {/* Rides Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredRides.map((ride) => {
          const isFull = ride.participantCount >= ride.capacity;
          const isCancelled = ride.status === RideStatus.CANCELLED;
          return (
            <Card key={ride.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        isCancelled ? 'destructive' : isFull ? 'warning' : 'verified'
                      }
                    >
                      {isCancelled
                        ? 'Ride Cancelled'
                        : isFull
                          ? 'Capacity Full'
                          : `${ride.capacity - ride.participantCount} Spots Open`}
                    </Badge>
                    {ride.isJoinedByViewer ? (
                      <Badge
                        variant="outline"
                        className="border-primary-200 bg-primary-50 text-primary-700"
                      >
                        Joined Roster
                      </Badge>
                    ) : null}
                  </div>
                  <Badge variant="outline">{ride.status}</Badge>
                </div>
                <CardTitle className="mt-2 text-xl">{ride.title}</CardTitle>
                <CardDescription className="mt-1">{ride.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
                    <span>
                      <strong>Start:</strong> {ride.startLocation}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
                    <span>
                      <strong>Destination:</strong> {ride.destination}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
                      {ride.dateTimeLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Users className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
                      {ride.participantCount}/{ride.capacity} riders
                    </span>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Ride Organizer
                  </p>
                  <UserProfileCard
                    user={ride.organizer}
                    contextLabel={`Ride: ${ride.title}`}
                    compact
                  />
                </div>
              </CardContent>

              <CardFooter className="flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleOpenRideDetails(ride)}
                >
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  View Roster & Route Map
                </Button>

                {ride.isJoinedByViewer ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleLeaveRide(ride)}
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    Leave Ride
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isFull || isCancelled}
                    onClick={() => void handleJoinRide(ride)}
                  >
                    {isCancelled
                      ? 'Cancelled'
                      : isFull
                        ? 'Waitlist / Full'
                        : 'Join Ride'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default RidesRemoteApp;
