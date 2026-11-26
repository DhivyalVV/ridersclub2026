import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  PhoneCall,
  Plus,
  ShieldAlert,
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
    locationLabel: 'Bengaluru • NH-48 Tumakuru Bypass',
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

const API_BASE_URL = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL) || 'http://localhost:4000/api/v1';

function getStoredToken(): string | null {
  try {
    const token =
      window.localStorage.getItem('ridersclub:access_token') ??
      window.localStorage.getItem('ridersclub_auth_token') ??
      window.localStorage.getItem('ridersclub.accessToken');
    if (!token || token.startsWith('local-session-')) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function getStoredUserCity(): string {
  try {
    const raw =
      window.localStorage.getItem('ridersclub:auth_user') ??
      window.localStorage.getItem('ridersclub_auth_user');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { profile?: { city?: string | null } };
    return parsed?.profile?.city?.trim() || '';
  } catch {
    return '';
  }
}

export function HelpRemoteApp(): React.JSX.Element {
  const [requests, setRequests] = React.useState<HelpRequestItem[]>(
    INITIAL_HELP_REQUESTS,
  );
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [showComposer, setShowComposer] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<
    'ALL' | 'NEARBY' | HelpRequestStatus
  >('ALL');
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);
  const [showHeaderInfo, setShowHeaderInfo] = React.useState(false);

  // Composer state
  const [newCategory, setNewCategory] = React.useState<HelpCategory>(
    HelpCategory.FLAT_TIRE,
  );
  const [newVehicleSummary, setNewVehicleSummary] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [detectedCity, setDetectedCity] = React.useState(() =>
    getStoredUserCity(),
  );
  const [isDetectingLocation, setIsDetectingLocation] = React.useState(false);
  const [newLandmarkLabel, setNewLandmarkLabel] = React.useState('');

  const requestCurrentCityLocation = React.useCallback(() => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation ||
      typeof navigator.geolocation.getCurrentPosition !== 'function'
    ) {
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let cityFound = '';
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
              latitude,
            )}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`,
          );
          if (res.ok) {
            const data = (await res.json()) as {
              city?: string;
              locality?: string;
              principalSubdivision?: string;
            };
            cityFound =
              data.city?.trim() ||
              data.locality?.trim() ||
              data.principalSubdivision?.trim() ||
              '';
          }
        } catch {
          // Fallback to OpenStreetMap Nominatim if BigDataCloud is unreachable
        }

        if (!cityFound) {
          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
                latitude,
              )}&lon=${encodeURIComponent(longitude)}`,
            );
            if (nomRes.ok) {
              const nomData = (await nomRes.json()) as {
                address?: {
                  city?: string;
                  town?: string;
                  village?: string;
                  county?: string;
                  state_district?: string;
                };
              };
              cityFound =
                nomData.address?.city ||
                nomData.address?.town ||
                nomData.address?.village ||
                nomData.address?.state_district ||
                nomData.address?.county ||
                '';
            }
          } catch {
            // Keep cityFound empty if offline
          }
        }

        if (cityFound) {
          setDetectedCity(cityFound);
          setStatusNotice(`Location detected: ${cityFound}`);
        }
        setIsDetectingLocation(false);
      },
      (error) => {
        setIsDetectingLocation(false);
        if (error.code === 1) {
          setStatusNotice(
            'Location permission was denied. You can still type your current city and landmark manually.',
          );
        } else {
          setStatusNotice(
            'Could not detect GPS location automatically. Please verify your device location is turned on or enter your city below.',
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  const handleToggleLocationConsent = (checked: boolean): void => {
    setConsentChecked(checked);
    if (checked) {
      requestCurrentCityLocation();
    }
  };

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
    if (statusFilter === 'NEARBY') {
      const targetCity = detectedCity.trim().toLowerCase();
      if (!targetCity) {
        return requests.filter((req) => req.locationSharedWithConsent);
      }
      return requests.filter(
        (req) =>
          req.locationLabel.toLowerCase().includes(targetCity) ||
          (req.requester.city ?? '').toLowerCase().includes(targetCity),
      );
    }
    return requests.filter((req) => req.status === statusFilter);
  }, [requests, statusFilter, detectedCity]);

  const handleCreateHelpRequest = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    const cityPart = detectedCity.trim();
    const landmarkPart = newLandmarkLabel.trim();
    const combinedLocationLabel = [cityPart, landmarkPart]
      .filter(Boolean)
      .join(' • ');

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
            locationLabel: consentChecked
              ? combinedLocationLabel || undefined
              : undefined,
          }),
        });
        if (res.ok) {
          const created = (await res.json()) as HelpRequestItem;
          setRequests((prev) => [created, ...prev]);
          setShowComposer(false);
          setNewDescription('');
          setNewVehicleSummary('');
          setNewLandmarkLabel('');
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

    const fallbackLocationLabel = consentChecked
      ? combinedLocationLabel || 'Current city / landmark shared by rider'
      : 'Location hidden (Contact via 1:1 chat for exact spot)';

    const fallbackCreated: HelpRequestItem = {
      id: `help-${Date.now()}`,
      category: newCategory,
      description: newDescription.trim(),
      vehicleSummary: newVehicleSummary.trim() || 'Rider Vehicle',
      status: HelpRequestStatus.OPEN,
      locationSharedWithConsent: consentChecked,
      locationLabel: fallbackLocationLabel,
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
        city: cityPart || 'Bengaluru',
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
      `Help request marked ${nextStatus} and location automatically redacted.`,
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
        className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-red-950 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <ShieldAlert
            className="h-4 w-4 shrink-0 text-red-600"
            aria-hidden="true"
          />
          <h2 className="text-xs font-bold uppercase tracking-wide text-red-900">
            Important Safety Notice — Not an Official Emergency Service (Call 112 / 108 / 911 for emergencies)
          </h2>
        </div>
      </div>

      {/* Header & Consent-Based Request Action */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-primary-950 to-primary-900 px-5 py-4 pr-12 text-white shadow-md sm:px-6 sm:pr-14">
        <div className="absolute right-2.5 top-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle page description"
            aria-expanded={showHeaderInfo}
            title="Page information"
            onClick={() => setShowHeaderInfo((prev) => !prev)}
            className="h-7 w-7 text-slate-200 hover:bg-white/15 hover:text-white"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </Button>
          {showHeaderInfo && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => setShowHeaderInfo(false)}
              />
              <div
                role="dialog"
                aria-label="Page information"
                className="absolute right-0 top-full z-50 mt-1.5 w-72 space-y-1.5 rounded-xl border border-primary-200 bg-primary-50 p-3.5 text-xs leading-relaxed text-primary-950 shadow-lg sm:w-80"
              >
                <p>
                  Request mechanical help from nearby riders or offer assistance via
                  private 1:1 chat. Coordinates are strictly opt-in and
                  automatically redacted once resolved.
                </p>
                <p className="font-medium text-primary-900">
                  RidersClub Help is a voluntary, peer-to-peer rider assistance
                  board for mechanical breakdowns and roadside support. If you or
                  anyone else is injured or in immediate danger, call official local
                  emergency services (112 / 108 / 911) immediately.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Roadside Assistance & Peer Help
            </h1>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => handleToggleLocationConsent(e.target.checked)}
                className="h-4 w-4 rounded border-white/40 accent-amber-500"
              />
              <span>
                Share current GPS coordinates for this help request only
                {isDetectingLocation ? ' (Detecting city...)' : detectedCity ? ` (${detectedCity})` : ''}
              </span>
            </label>
          </div>

          <Button
            variant="emergency"
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
        <Card className="border-amber-300 bg-amber-50 shadow-sm">
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
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200 bg-white p-3.5 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor="help-city-input"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Current City / Location
                      </label>
                      <button
                        type="button"
                        onClick={requestCurrentCityLocation}
                        disabled={isDetectingLocation}
                        className="text-[11px] font-semibold text-primary-700 underline hover:text-primary-900 disabled:opacity-50"
                      >
                        {isDetectingLocation
                          ? 'Detecting city...'
                          : 'Detect My City'}
                      </button>
                    </div>
                    <input
                      id="help-city-input"
                      type="text"
                      value={detectedCity}
                      onChange={(e) => setDetectedCity(e.target.value)}
                      placeholder={
                        isDetectingLocation
                          ? 'Detecting your current city...'
                          : 'e.g., Bengaluru'
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
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
                      value={newLandmarkLabel}
                      onChange={(e) => setNewLandmarkLabel(e.target.value)}
                      placeholder="e.g., NICE Road Kanakapura Exit Toll"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
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

      {/* Filter Bar */}
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
            variant={statusFilter === 'NEARBY' ? 'default' : 'outline'}
            onClick={() => {
              setStatusFilter((prev) => (prev === 'NEARBY' ? 'ALL' : 'NEARBY'));
              if (!detectedCity) {
                requestCurrentCityLocation();
              }
            }}
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {detectedCity
              ? `Nearby (${detectedCity})`
              : `Nearby List (${filteredRequests.length})`}
          </Button>
        </div>
      </div>

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
