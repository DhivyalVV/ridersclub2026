import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  MapPin,
  PhoneCall,
  Plus,
  ShieldAlert,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';
import {
  HelpCategory,
  HelpRequestStatus,
  UserRole,
  type HelpRequestItem,
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

const INITIAL_HELP_REQUESTS: HelpRequestItem[] = [
  {
    id: 'help-1',
    category: HelpCategory.FLAT_TIRE,
    description:
      'Rear tube puncture on NH-48 near Tumakuru bypass. Have spare tube and tire irons, need a portable air inflator or 17mm axle wrench.',
    vehicleSummary: 'Hero XPulse 200 4V (Rally Edition)',
    createdAt: '2026-10-22T14:15:00.000Z',
    createdAtLabel: '18 mins ago',
    resolvedAt: null,
    status: HelpRequestStatus.OPEN,
    locationSharedWithConsent: true,
    locationLabel: 'NH-48 Tumakuru Bypass (13.3409° N, 77.1010° E)',
    latitude: 13.3409,
    longitude: 77.101,
    externalMapUrl:
      'https://www.openstreetmap.org/?mlat=13.34090&mlon=77.10100#map=15/13.34090/77.10100',
    distanceKmFromViewer: 6.4,
    offersCount: 0,
    offers: [],
    isOfferedByViewer: false,
    requester: {
      id: 'user-help-1',
      displayName: 'Karthik Nair',
      username: 'karthik_xpulse',
      avatarUrl: null,
      bio: 'XPulse 200 4V • Weekend trail rider',
      city: 'Bengaluru',
      role: UserRole.USER,
      canReceiveDirectMessage: true,
    },
  },
  {
    id: 'help-2',
    category: HelpCategory.BATTERY_JUMP,
    description:
      'Alternator warning light came on and battery drained at highway rest stop. Need jumper cables from a car or portable jump pack.',
    vehicleSummary: 'Skoda Octavia 2.0 TDI (Race Blue)',
    createdAt: '2026-10-22T13:50:00.000Z',
    createdAtLabel: '42 mins ago',
    resolvedAt: null,
    status: HelpRequestStatus.ASSISTANCE_OFFERED,
    locationSharedWithConsent: false,
    locationLabel: 'Location hidden (Contact via 1:1 chat for exact spot)',
    latitude: null,
    longitude: null,
    externalMapUrl: null,
    distanceKmFromViewer: null,
    offersCount: 1,
    isOfferedByViewer: false,
    offers: [
      {
        id: 'offer-seed-1',
        helpRequestId: 'help-2',
        helperId: 'user-helper-seed',
        note: 'Carrying a NOCO Boost jump pack, reaching Mysuru road stop in 15 mins.',
        createdAt: '2026-10-22T14:00:00.000Z',
        helper: {
          id: 'user-helper-seed',
          displayName: 'Rohan Kulkarni',
          username: 'rohan_gt',
          avatarUrl: null,
          bio: 'Continental GT 650 • Highway Marshal',
          city: 'Bengaluru',
          role: UserRole.USER,
          canReceiveDirectMessage: true,
        },
      },
    ],
    requester: {
      id: 'user-help-2',
      displayName: 'Priya Menon',
      username: 'priya_octavia',
      avatarUrl: null,
      bio: 'Highway tourer • Octavia TDI',
      city: 'Mysuru',
      role: UserRole.USER,
      canReceiveDirectMessage: true,
    },
  },
];

const API_BASE_URL = 'http://localhost:4000/api';

function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem('ridersclub.accessToken');
  } catch {
    return null;
  }
}

export function HelpRemoteApp(): React.JSX.Element {
  const [requests, setRequests] = React.useState<HelpRequestItem[]>(
    INITIAL_HELP_REQUESTS,
  );
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [showComposer, setShowComposer] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<
    'ALL' | HelpRequestStatus
  >('ALL');
  const [viewMode, setViewMode] = React.useState<'LIST' | 'MAP'>('LIST');
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);

  // Composer state
  const [newCategory, setNewCategory] = React.useState<HelpCategory>(
    HelpCategory.FLAT_TIRE,
  );
  const [newVehicleSummary, setNewVehicleSummary] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [newLocationLabel, setNewLocationLabel] = React.useState(
    'NICE Road Kanakapura Exit Toll',
  );
  const [newLatitude, setNewLatitude] = React.useState('12.8698');
  const [newLongitude, setNewLongitude] = React.useState('77.5295');

  React.useEffect(() => {
    let active = true;
    const token = getStoredToken();
    fetch(`${API_BASE_URL}/help`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as HelpRequestItem[];
      })
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setRequests(data);
        }
      })
      .catch(() => {
        // Fallback to initial seeded requests when running standalone in tests
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredRequests = React.useMemo(() => {
    if (statusFilter === 'ALL') return requests;
    return requests.filter((req) => req.status === statusFilter);
  }, [requests, statusFilter]);

  const handleCreateHelpRequest = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    const parsedLat = Number(newLatitude);
    const parsedLng = Number(newLongitude);
    const hasValidCoords =
      consentChecked && !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng);

    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/help`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: newCategory,
            description: newDescription.trim(),
            vehicleSummary: newVehicleSummary.trim() || undefined,
            locationConsentGranted: consentChecked,
            locationLabel: consentChecked ? newLocationLabel.trim() : undefined,
            latitude: hasValidCoords ? parsedLat : undefined,
            longitude: hasValidCoords ? parsedLng : undefined,
          }),
        });
        if (res.ok) {
          const created = (await res.json()) as HelpRequestItem;
          setRequests((prev) => [created, ...prev]);
          setShowComposer(false);
          setNewDescription('');
          setNewVehicleSummary('');
          setStatusNotice(
            consentChecked
              ? 'Help request published with explicit location consent.'
              : 'Help request published with GPS coordinates hidden.',
          );
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    const fallbackCreated: HelpRequestItem = {
      id: `help-${Date.now()}`,
      category: newCategory,
      description: newDescription.trim(),
      vehicleSummary: newVehicleSummary.trim() || 'Rider Vehicle',
      status: HelpRequestStatus.OPEN,
      locationSharedWithConsent: consentChecked,
      locationLabel: consentChecked
        ? `${newLocationLabel.trim() || 'Shared Highway Spot'} (${hasValidCoords ? `${parsedLat.toFixed(4)}° N, ${parsedLng.toFixed(4)}° E` : 'GPS Shared'})`
        : 'Location hidden (Contact via 1:1 chat for exact spot)',
      latitude: hasValidCoords ? parsedLat : null,
      longitude: hasValidCoords ? parsedLng : null,
      externalMapUrl: hasValidCoords
        ? `https://www.openstreetmap.org/?mlat=${parsedLat.toFixed(5)}&mlon=${parsedLng.toFixed(5)}#map=15/${parsedLat.toFixed(5)}/${parsedLng.toFixed(5)}`
        : null,
      distanceKmFromViewer: hasValidCoords ? 3.2 : null,
      offersCount: 0,
      offers: [],
      isOfferedByViewer: false,
      createdAt: new Date().toISOString(),
      createdAtLabel: 'Just now',
      resolvedAt: null,
      requester: {
        id: 'user-current-rider',
        displayName: 'Aarav Sharma',
        username: 'aarav_rider',
        avatarUrl: null,
        bio: 'Himalayan 450 • Bengaluru',
        city: 'Bengaluru',
        role: UserRole.USER,
        canReceiveDirectMessage: true,
      },
    };

    setRequests((prev) => [fallbackCreated, ...prev]);
    setShowComposer(false);
    setNewDescription('');
    setNewVehicleSummary('');
    setStatusNotice(
      consentChecked
        ? 'Help request published with explicit location consent.'
        : 'Help request published with GPS coordinates hidden.',
    );
  };

  const handleOfferAssistance = async (reqId: string): Promise<void> => {
    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/help/${reqId}/offer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            note: 'En route with tool kit and portable air pump.',
          }),
        });
        if (res.ok) {
          const updated = (await res.json()) as HelpRequestItem;
          setRequests((prev) =>
            prev.map((item) => (item.id === reqId ? updated : item)),
          );
          setStatusNotice('Assistance offer recorded! Coordinate via 1:1 chat.');
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    setRequests((prev) =>
      prev.map((item) => {
        if (item.id !== reqId) return item;
        const newOffer = {
          id: `offer-${Date.now()}`,
          helpRequestId: reqId,
          helperId: 'user-current-helper',
          note: 'En route with tool kit and portable air pump.',
          createdAt: new Date().toISOString(),
          helper: {
            id: 'user-current-helper',
            displayName: 'Dev Rider (You)',
            username: 'dev_rider',
            avatarUrl: null,
            bio: 'Peer Roadside Responder',
            city: 'Bengaluru',
            role: UserRole.USER,
            canReceiveDirectMessage: true,
          },
        };
        const updatedOffers = [...(item.offers ?? []), newOffer];
        return {
          ...item,
          status: HelpRequestStatus.ASSISTANCE_OFFERED,
          isOfferedByViewer: true,
          offersCount: updatedOffers.length,
          offers: updatedOffers,
        };
      }),
    );
    setStatusNotice('Assistance offer recorded! Coordinate via 1:1 chat.');
  };

  const handleUpdateStatus = async (
    reqId: string,
    nextStatus: HelpRequestStatus.RESOLVED | HelpRequestStatus.CANCELLED,
  ): Promise<void> => {
    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/help/${reqId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (res.ok) {
          const updated = (await res.json()) as HelpRequestItem;
          setRequests((prev) =>
            prev.map((item) => (item.id === reqId ? updated : item)),
          );
          setStatusNotice(
            `Help request marked ${nextStatus} and GPS coordinates automatically redacted.`,
          );
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    setRequests((prev) =>
      prev.map((item) =>
        item.id === reqId
          ? {
              ...item,
              status: nextStatus,
              locationSharedWithConsent: false,
              latitude: null,
              longitude: null,
              externalMapUrl: null,
              locationLabel: 'Location auto-redacted after request closure',
              resolvedAt:
                nextStatus === HelpRequestStatus.RESOLVED
                  ? new Date().toISOString()
                  : item.resolvedAt,
            }
          : item,
      ),
    );
    setStatusNotice(
      `Help request marked ${nextStatus} and GPS coordinates automatically redacted.`,
    );
  };

  return (
    <section
      aria-label="Roadside Help and Assistance Federated Module"
      className="space-y-6"
    >
      {/* Mandatory Official Emergency Disclaimer Banner (Section 8) */}
      <div
        role="region"
        aria-label="Official Emergency Services Disclaimer"
        className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-red-950 shadow-sm sm:p-5"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert
            className="mt-0.5 h-6 w-6 shrink-0 text-red-600"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wide text-red-900">
              Important Safety Notice — Not an Official Emergency Service
            </h2>
            <p className="text-xs leading-relaxed text-red-900 sm:text-sm">
              RidersClub Help is a voluntary, peer-to-peer rider assistance
              board for mechanical breakdowns and roadside support.{' '}
              <strong>
                If you or anyone else is injured or in immediate danger, call
                official local emergency services (112 / 108 / 911) immediately.
              </strong>{' '}
              Your live location is never shared automatically without your
              explicit consent.
            </p>
          </div>
        </div>
      </div>

      {/* Header & Consent-Based Request Action */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-primary-950 to-primary-900 p-5 text-white shadow-md sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles
              className="h-3.5 w-3.5 text-amber-300"
              aria-hidden="true"
            />
            <span>Federated Remote • @ridersclub/help (:5003)</span>
          </div>
          <Badge variant="verified">
            Phase 9 Live • Consent-First Roadside Help
          </Badge>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Roadside Assistance & Peer Help
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-200">
              Request mechanical help from nearby riders or offer assistance via
              private 1:1 chat. Coordinates are strictly opt-in and
              automatically redacted once resolved.
            </p>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs text-white">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="h-4 w-4 rounded border-white/40 accent-amber-500"
              />
              <span>
                I explicitly consent to share my current coordinates for this
                help request only
              </span>
            </label>
          </div>

          <Button
            variant="emergency"
            size="lg"
            onClick={() => setShowComposer((prev) => !prev)}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {consentChecked
              ? 'Post Help Request (With Location)'
              : 'Post Help Request (No GPS Coordinates)'}
          </Button>
        </div>
      </div>

      {statusNotice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900"
        >
          <span>{statusNotice}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-emerald-700 underline hover:text-emerald-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Composer Form */}
      {showComposer && (
        <Card className="border-amber-300 bg-amber-50/40 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-amber-600" aria-hidden="true" />
              Create Roadside Help Request
            </CardTitle>
            <CardDescription>
              Describe your mechanical issue clearly. Location coordinates will{' '}
              {consentChecked ? (
                <strong className="text-emerald-700">
                  be shared with your explicit consent
                </strong>
              ) : (
                <strong className="text-slate-700">
                  NOT be stored or displayed (privacy mode)
                </strong>
              )}
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateHelpRequest} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="help-category-select"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Breakdown Category
                  </label>
                  <select
                    id="help-category-select"
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as HelpCategory)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value={HelpCategory.FLAT_TIRE}>Flat Tire</option>
                    <option value={HelpCategory.BATTERY_JUMP}>
                      Battery Jump Start
                    </option>
                    <option value={HelpCategory.OUT_OF_FUEL}>
                      Out of Fuel
                    </option>
                    <option value={HelpCategory.EMERGENCY_BREAKDOWN}>
                      Mechanical Breakdown
                    </option>
                    <option value={HelpCategory.ACCIDENT_SUPPORT}>
                      Non-Medical Accident Support
                    </option>
                    <option value={HelpCategory.OTHER}>Other Issue</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="help-vehicle-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Vehicle Make & Model
                  </label>
                  <input
                    id="help-vehicle-input"
                    type="text"
                    value={newVehicleSummary}
                    onChange={(e) => setNewVehicleSummary(e.target.value)}
                    placeholder="e.g., Royal Enfield Himalayan 450 (Kamet White)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="help-description-input"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  What tools or assistance do you need?
                </label>
                <textarea
                  id="help-description-input"
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the issue, safe landmark, and tools needed..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>

              {consentChecked && (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200 bg-white p-3.5 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="help-location-label"
                      className="mb-1 block text-xs font-semibold text-slate-700"
                    >
                      Highway / Landmark Label
                    </label>
                    <input
                      id="help-location-label"
                      type="text"
                      value={newLocationLabel}
                      onChange={(e) => setNewLocationLabel(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="help-lat-input"
                      className="mb-1 block text-xs font-semibold text-slate-700"
                    >
                      Latitude
                    </label>
                    <input
                      id="help-lat-input"
                      type="text"
                      value={newLatitude}
                      onChange={(e) => setNewLatitude(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="help-lng-input"
                      className="mb-1 block text-xs font-semibold text-slate-700"
                    >
                      Longitude
                    </label>
                    <input
                      id="help-lng-input"
                      type="text"
                      value={newLongitude}
                      onChange={(e) => setNewLongitude(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComposer(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="emergency" size="sm">
                  Publish Help Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter & Discovery View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['ALL', 'All Requests'],
              [HelpRequestStatus.OPEN, 'Open'],
              [HelpRequestStatus.ASSISTANCE_OFFERED, 'Assistance Offered'],
              [HelpRequestStatus.RESOLVED, 'Resolved'],
            ] as const
          ).map(([statusKey, label]) => (
            <Button
              key={statusKey}
              size="sm"
              variant={statusFilter === statusKey ? 'default' : 'outline'}
              onClick={() => setStatusFilter(statusKey)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'LIST' ? 'default' : 'outline'}
            onClick={() => setViewMode('LIST')}
          >
            Nearby List ({filteredRequests.length})
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'MAP' ? 'default' : 'outline'}
            onClick={() => setViewMode('MAP')}
          >
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            Radar & Map View
          </Button>
        </div>
      </div>

      {/* Optional Radar & Map Overview */}
      {viewMode === 'MAP' && (
        <Card className="border-primary-200 bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Compass
                className="h-5 w-5 text-primary-400"
                aria-hidden="true"
              />
              Consent-Filtered Roadside Radar (OpenStreetMap Integration)
            </CardTitle>
            <CardDescription className="text-slate-300">
              Only active requests where the rider explicitly granted location
              consent appear with pins below. Resolved and no-consent requests
              automatically hide coordinates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredRequests.filter(
              (r) =>
                r.locationSharedWithConsent &&
                r.latitude !== null &&
                r.longitude !== null,
            ).length === 0 ? (
              <p className="rounded-xl bg-white/5 p-4 text-xs text-slate-300">
                No active requests currently broadcasting GPS coordinates.
              </p>
            ) : (
              filteredRequests
                .filter(
                  (r) =>
                    r.locationSharedWithConsent &&
                    r.latitude !== null &&
                    r.longitude !== null,
                )
                .map((pin) => (
                  <div
                    key={pin.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-amber-300">
                        {pin.category.replace(/_/g, ' ')}
                      </span>{' '}
                      • {pin.requester.displayName} ({pin.locationLabel})
                    </div>
                    {pin.externalMapUrl && (
                      <a
                        href={pin.externalMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary-300 underline hover:text-white"
                      >
                        Open OpenStreetMap Pin
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Nearby Requests */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredRequests.map((req) => {
          const isClosed =
            req.status === HelpRequestStatus.RESOLVED ||
            req.status === HelpRequestStatus.CANCELLED;

          return (
            <Card
              key={req.id}
              className="flex flex-col justify-between border-amber-200/80"
            >
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="warning">
                    {req.category.replace(/_/g, ' ')}
                  </Badge>
                  <Badge
                    variant={
                      req.status === HelpRequestStatus.OPEN
                        ? 'destructive'
                        : req.status === HelpRequestStatus.ASSISTANCE_OFFERED
                          ? 'verified'
                          : 'secondary'
                    }
                  >
                    {req.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-lg">{req.description}</CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Clock
                      className="h-3.5 w-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    {req.createdAtLabel}
                  </span>
                  {req.vehicleSummary && (
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Wrench
                        className="h-3.5 w-3.5 text-slate-400"
                        aria-hidden="true"
                      />
                      {req.vehicleSummary}
                    </span>
                  )}
                  {req.distanceKmFromViewer !== null && !isClosed && (
                    <span className="font-semibold text-primary-700">
                      ~{req.distanceKmFromViewer} km away
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={`h-4 w-4 shrink-0 ${
                        req.locationSharedWithConsent
                          ? 'text-primary-600'
                          : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{req.locationLabel}</span>
                  </div>
                  {req.externalMapUrl && req.locationSharedWithConsent && (
                    <a
                      href={req.externalMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline"
                    >
                      Map
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Requested By
                  </p>
                  <UserProfileCard
                    user={req.requester}
                    contextLabel={`Help Request: ${req.category}`}
                    compact
                  />
                </div>

                {req.offers && req.offers.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                    <p className="text-xs font-semibold text-emerald-900">
                      Responding Riders ({req.offers.length})
                    </p>
                    {req.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="rounded-lg bg-white p-2 text-xs text-slate-700 shadow-2xs"
                      >
                        <span className="font-semibold text-slate-900">
                          {offer.helper.displayName}:
                        </span>{' '}
                        {offer.note || 'Offered roadside assistance'}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">
                  Coordinates auto-redacted when resolved
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {!isClosed && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateStatus(req.id, HelpRequestStatus.RESOLVED)
                        }
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-hidden="true"
                        />
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleUpdateStatus(req.id, HelpRequestStatus.CANCELLED)
                        }
                      >
                        <XCircle
                          className="h-3.5 w-3.5 text-slate-500"
                          aria-hidden="true"
                        />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOfferAssistance(req.id)}
                      >
                        <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                        {req.isOfferedByViewer
                          ? 'Assistance Offered'
                          : 'Offer Assistance'}
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default HelpRemoteApp;
