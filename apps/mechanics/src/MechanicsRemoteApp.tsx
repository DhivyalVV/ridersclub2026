import * as React from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import {
  MechanicVerificationStatus,
  UserRole,
  type MechanicItem,
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

const INITIAL_MECHANICS: MechanicItem[] = [
  {
    id: 'mech-1',
    ownerId: 'user-mech-1',
    businessName: 'Apex MotoWorks & Suspension Lab',
    description:
      'Factory-trained suspension tuning, Ohlins/WP rebuilds, Bosch ECU diagnostics, and comprehensive track/touring prep.',
    serviceCategories: [
      'Suspension Tuning',
      'ECU Diagnostics',
      'Periodic Service',
    ],
    address: '42 Indiranagar 100ft Road, HAL 2nd Stage',
    city: 'Bengaluru',
    contactPhonePublic: false,
    displayPhone: '+91 98450 •••12',
    verificationStatus: MechanicVerificationStatus.VERIFIED,
    verifiedAt: '2026-10-15T10:00:00.000Z',
    verificationNotes:
      'Verified GST registration and physical workshop inspection in Indiranagar.',
    createdAt: '2026-10-10T08:00:00.000Z',
    owner: {
      id: 'user-mech-1',
      displayName: 'Arjun Shetty',
      username: 'arjun_apexmoto',
      avatarUrl: null,
      bio: 'Master Technician • 14 years multi-brand big bike & car experience',
      city: 'Bengaluru',
      role: UserRole.USER,
      canReceiveDirectMessage: true,
    },
  },
  {
    id: 'mech-2',
    ownerId: 'user-mech-2',
    businessName: 'Highway 44 Garage & Tire Center',
    description:
      'High-speed dynamic wheel balancing, sintered brake overhauls, and emergency flatbed recovery along NH-44.',
    serviceCategories: ['Tire Balancing', 'Brake Overhaul', 'Emergency Towing'],
    address: 'Plot 19, Medchal Highway Service Road',
    city: 'Hyderabad',
    contactPhonePublic: false,
    displayPhone: '+91 90001 •••88',
    verificationStatus: MechanicVerificationStatus.PENDING_REVIEW,
    verifiedAt: null,
    verificationNotes: null,
    createdAt: '2026-10-18T09:30:00.000Z',
    owner: {
      id: 'user-mech-2',
      displayName: 'Farhan Ali',
      username: 'farhan_hwy44',
      avatarUrl: null,
      bio: '24x7 highway tire & brake specialist',
      city: 'Hyderabad',
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

function maskPhoneLocal(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  if (trimmed.length <= 4) return `•••${trimmed}`;
  const prefix = trimmed.slice(0, Math.min(8, trimmed.length - 4));
  const suffix = trimmed.slice(-2);
  return `${prefix.trim()} •••${suffix}`;
}

export function MechanicsRemoteApp(): React.JSX.Element {
  const [mechanics, setMechanics] =
    React.useState<MechanicItem[]>(INITIAL_MECHANICS);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [showRegisterForm, setShowRegisterForm] =
    React.useState<boolean>(false);
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);

  // Registration form fields
  const [businessName, setBusinessName] = React.useState('');
  const [city, setCity] = React.useState('Bengaluru');
  const [address, setAddress] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [categoriesInput, setCategoriesInput] = React.useState(
    'Periodic Service, ECU Diagnostics',
  );
  const [contactPhone, setContactPhone] = React.useState('+91 98450 77812');
  const [contactPhonePublic, setContactPhonePublic] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/mechanics`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as MechanicItem[];
      })
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setMechanics(data);
        }
      })
      .catch(() => {
        // Fallback to initial seeded mechanics in standalone/test mode
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredMechanics = React.useMemo(() => {
    return mechanics.filter((m) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        m.serviceCategories.some((c) =>
          c.toLowerCase().includes(selectedCategory.toLowerCase()),
        );
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.businessName.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.serviceCategories.some((c) => c.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [mechanics, selectedCategory, searchQuery]);

  const handleRegisterWorkshop = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!businessName.trim() || !address.trim()) return;

    const parsedCategories = categoriesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const serviceCategories =
      parsedCategories.length > 0 ? parsedCategories : ['Periodic Service'];

    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/mechanics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessName: businessName.trim(),
            description:
              description.trim() ||
              'Independent multi-brand motorcycle & car service center.',
            serviceCategories,
            address: address.trim(),
            city: city.trim() || 'Bengaluru',
            contactPhone: contactPhone.trim(),
            contactPhonePublic,
          }),
        });
        if (res.ok) {
          const created = (await res.json()) as MechanicItem;
          setMechanics((prev) => [created, ...prev]);
          setShowRegisterForm(false);
          setBusinessName('');
          setAddress('');
          setDescription('');
          setStatusNotice(
            'Workshop submitted! Listed as Unverified (PENDING REVIEW) until administrator verification is completed.',
          );
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    const fallbackCreated: MechanicItem = {
      id: `mech-${Date.now()}`,
      ownerId: 'user-current-owner',
      businessName: businessName.trim(),
      description:
        description.trim() ||
        'Independent multi-brand motorcycle & car service center.',
      serviceCategories,
      address: address.trim(),
      city: city.trim() || 'Bengaluru',
      contactPhonePublic,
      displayPhone: contactPhonePublic
        ? contactPhone.trim()
        : maskPhoneLocal(contactPhone),
      verificationStatus: MechanicVerificationStatus.PENDING_REVIEW,
      verifiedAt: null,
      verificationNotes: null,
      createdAt: new Date().toISOString(),
      owner: {
        id: 'user-current-owner',
        displayName: 'Vikram Garage Owner',
        username: 'vikram_workshop',
        avatarUrl: null,
        bio: 'Independent Service Specialist',
        city: city.trim() || 'Bengaluru',
        role: UserRole.USER,
        canReceiveDirectMessage: true,
      },
    };

    setMechanics((prev) => [fallbackCreated, ...prev]);
    setShowRegisterForm(false);
    setBusinessName('');
    setAddress('');
    setDescription('');
    setStatusNotice(
      'Workshop submitted! Listed as Unverified (PENDING REVIEW) until administrator verification is completed.',
    );
  };

  const handleAdminVerify = async (
    mechanicId: string,
    nextStatus: MechanicVerificationStatus,
  ): Promise<void> => {
    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/mechanics/${mechanicId}/verify`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: nextStatus,
              verificationNotes:
                nextStatus === MechanicVerificationStatus.VERIFIED
                  ? 'Business credentials and physical workshop verified by RidersClub Admin.'
                  : 'Verification revoked pending updated credentials.',
            }),
          },
        );
        if (res.ok) {
          const updated = (await res.json()) as MechanicItem;
          setMechanics((prev) =>
            prev.map((m) => (m.id === mechanicId ? updated : m)),
          );
          setStatusNotice(
            nextStatus === MechanicVerificationStatus.VERIFIED
              ? 'Provider marked as Admin Verified!'
              : 'Provider moved to Pending Review.',
          );
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    setMechanics((prev) =>
      prev.map((m) =>
        m.id === mechanicId
          ? {
              ...m,
              verificationStatus: nextStatus,
              verifiedAt:
                nextStatus === MechanicVerificationStatus.VERIFIED
                  ? new Date().toISOString()
                  : null,
              verificationNotes:
                nextStatus === MechanicVerificationStatus.VERIFIED
                  ? 'Business credentials and physical workshop verified by RidersClub Admin.'
                  : null,
            }
          : m,
      ),
    );
    setStatusNotice(
      nextStatus === MechanicVerificationStatus.VERIFIED
        ? 'Provider marked as Admin Verified!'
        : 'Provider moved to Pending Review.',
    );
  };

  return (
    <section
      aria-label="Mechanics and Service Providers Federated Module"
      className="space-y-6"
    >
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-5 text-white shadow-md sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles
              className="h-3.5 w-3.5 text-primary-200"
              aria-hidden="true"
            />
            <span>Federated Remote • @ridersclub/mechanics (:5004)</span>
          </div>
          <Badge variant="verified">
            Phase 10 Live • Verified Service Directory
          </Badge>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Mechanics & Service Providers
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-primary-100 sm:text-base">
              Search independent workshops and specialists by location and
              service category. Providers are only marked as Verified after
              administrator verification is completed.
            </p>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-primary-900 hover:bg-primary-50"
            onClick={() => setShowRegisterForm((prev) => !prev)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Register Workshop
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

      {/* Self-Registration Composer */}
      {showRegisterForm && (
        <Card className="border-primary-200 bg-primary-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              Register Independent Workshop or Service Center
            </CardTitle>
            <CardDescription>
              All newly registered workshops start as{' '}
              <strong>Unverified (PENDING REVIEW)</strong> until an
              administrator verifies business credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterWorkshop} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="mech-business-name"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Workshop / Business Name
                  </label>
                  <input
                    id="mech-business-name"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Torque Factory Customs"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mech-city-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    City
                  </label>
                  <input
                    id="mech-city-input"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Bengaluru"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="mech-address-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Street Address / Landmark
                  </label>
                  <input
                    id="mech-address-input"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 18 Koramangala 80ft Road"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mech-categories-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Service Categories (comma-separated)
                  </label>
                  <input
                    id="mech-categories-input"
                    type="text"
                    value={categoriesInput}
                    onChange={(e) => setCategoriesInput(e.target.value)}
                    placeholder="Suspension Tuning, ECU Diagnostics, Tire Balancing"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mech-description-input"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Workshop Overview & Equipment
                </label>
                <textarea
                  id="mech-description-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your tools, supported brands, and specialties..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="mech-phone-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Workshop Contact Phone
                  </label>
                  <input
                    id="mech-phone-input"
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={contactPhonePublic}
                      onChange={(e) => setContactPhonePublic(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-primary-600"
                    />
                    <span>
                      Display full workshop phone publicly (otherwise masked for
                      1:1 chat privacy)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegisterForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Submit Workshop Registration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'Suspension', 'Diagnostics', 'Tire', 'Brake'].map(
            (category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'ALL' ? 'All Specialties' : category}
              </Button>
            ),
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search mechanics by name or city"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, workshop, specialty..."
            className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pr-3 pl-9 text-xs text-slate-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredMechanics.map((mechanic) => {
          const isVerified =
            mechanic.verificationStatus === MechanicVerificationStatus.VERIFIED;

          return (
            <Card key={mechanic.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700">
                    <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                    {mechanic.city}
                  </span>

                  {isVerified ? (
                    <Badge variant="verified">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Admin Verified Provider
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Unverified (
                      {mechanic.verificationStatus.replace(/_/g, ' ')})
                    </Badge>
                  )}
                </div>

                <CardTitle className="mt-2 text-xl">
                  {mechanic.businessName}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-1.5">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <span>
                    {mechanic.address}, {mechanic.city}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-600">
                  {mechanic.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {mechanic.serviceCategories.map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Phone
                      className="h-3.5 w-3.5 text-primary-600"
                      aria-hidden="true"
                    />
                    Workshop Contact: {mechanic.displayPhone}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {mechanic.contactPhonePublic
                      ? 'Public Workshop Line'
                      : 'Privacy-protected'}
                  </span>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Lead Service Provider
                  </p>
                  <UserProfileCard
                    user={mechanic.owner}
                    contextLabel={`Mechanic: ${mechanic.businessName}`}
                    compact
                  />
                </div>
              </CardContent>

              <CardFooter className="flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">
                  {isVerified
                    ? 'Business credentials verified by RidersClub Admin'
                    : 'Self-registered provider — not yet verified'}
                </span>

                <div className="flex items-center gap-2">
                  {!isVerified ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAdminVerify(
                          mechanic.id,
                          MechanicVerificationStatus.VERIFIED,
                        )
                      }
                    >
                      <ShieldCheck
                        className="h-3.5 w-3.5 text-emerald-600"
                        aria-hidden="true"
                      />
                      Verify Provider (Admin)
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleAdminVerify(
                          mechanic.id,
                          MechanicVerificationStatus.PENDING_REVIEW,
                        )
                      }
                    >
                      Revoke Verification
                    </Button>
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

export default MechanicsRemoteApp;
