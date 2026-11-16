import * as React from 'react';
import {
  Calendar,
  FileText,
  Gauge,
  Info,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  VehicleType,
  type GarageVehicleItem,
} from '@ridersclub/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ridersclub/ui';

const INITIAL_VEHICLES: GarageVehicleItem[] = [
  {
    id: 'veh-1',
    ownerId: 'user-owner-1',
    type: VehicleType.MOTORCYCLE,
    make: 'Royal Enfield',
    model: 'Himalayan 450 Hanle Black',
    year: 2025,
    registrationLabel: 'KA-01-RC-4500',
    currentOdometerKm: 11420,
    createdAt: '2026-01-10T00:00:00.000Z',
    notes: [
      {
        id: 'note-1',
        vehicleId: 'veh-1',
        content: 'Front fork preload set to standard; rear +2 clicks for luggage.',
        createdAt: '2026-08-12T00:00:00.000Z',
      },
      {
        id: 'note-2',
        vehicleId: 'veh-1',
        content: 'Installed sintered front brake pads at 9,800 km.',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ],
    serviceHistory: [
      {
        id: 'srv-1',
        vehicleId: 'veh-1',
        serviceDate: '2026-09-14',
        odometerKm: 10050,
        description:
          '10,000 km Periodic Service — Fully synthetic 10W40 oil, oil filter, air filter, and throttle body sync.',
        costInr: 4650,
        workshopName: 'Apex MotoWorks & Suspension Lab',
        createdAt: '2026-09-14T10:00:00.000Z',
      },
      {
        id: 'srv-2',
        vehicleId: 'veh-1',
        serviceDate: '2026-04-02',
        odometerKm: 5120,
        description:
          '5,000 km Inspection — Oil top-up, chain clean & lube, brake fluid bleed.',
        costInr: 1850,
        workshopName: 'Authorized Service Center',
        createdAt: '2026-04-02T10:00:00.000Z',
      },
    ],
  },
  {
    id: 'veh-2',
    ownerId: 'user-owner-1',
    type: VehicleType.CAR,
    make: 'Skoda',
    model: 'Octavia 2.0 TSI L&K',
    year: 2023,
    registrationLabel: 'KA-03-TS-2023',
    currentOdometerKm: 28900,
    createdAt: '2026-02-15T00:00:00.000Z',
    notes: [
      {
        id: 'note-3',
        vehicleId: 'veh-2',
        content: 'Cold tire pressure: 33 PSI front / 35 PSI rear for highway runs.',
        createdAt: '2026-06-10T00:00:00.000Z',
      },
      {
        id: 'note-4',
        vehicleId: 'veh-2',
        content: 'Michelin Pilot Sport 4 tires rotated at 25,000 km.',
        createdAt: '2026-07-20T00:00:00.000Z',
      },
    ],
    serviceHistory: [
      {
        id: 'srv-3',
        vehicleId: 'veh-2',
        serviceDate: '2026-07-20',
        odometerKm: 25100,
        description:
          'Annual Scheduled Maintenance — VW 508.00 oil change, cabin pollen filter, and wheel alignment.',
        costInr: 16400,
        workshopName: 'European Performance Garage',
        createdAt: '2026-07-20T12:00:00.000Z',
      },
    ],
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

export function GarageRemoteApp(): React.JSX.Element {
  const [vehicles, setVehicles] =
    React.useState<GarageVehicleItem[]>(INITIAL_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>(
    INITIAL_VEHICLES[0]!.id,
  );
  const [showAddVehicle, setShowAddVehicle] = React.useState(false);
  const [showLogService, setShowLogService] = React.useState(false);
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);
  const [showHeaderInfo, setShowHeaderInfo] = React.useState(false);

  // Add Vehicle form state
  const [newType, setNewType] = React.useState<VehicleType>(
    VehicleType.MOTORCYCLE,
  );
  const [newMake, setNewMake] = React.useState('');
  const [newModel, setNewModel] = React.useState('');
  const [newYear, setNewYear] = React.useState('2025');
  const [newRegLabel, setNewRegLabel] = React.useState('');
  const [newOdometerKm, setNewOdometerKm] = React.useState('1200');

  // Log Service form state
  const [srvDate, setSrvDate] = React.useState('2026-10-22');
  const [srvOdometerKm, setSrvOdometerKm] = React.useState('12100');
  const [srvCostInr, setSrvCostInr] = React.useState('5200');
  const [srvWorkshop, setSrvWorkshop] = React.useState(
    'Apex MotoWorks & Suspension Lab',
  );
  const [srvDescription, setSrvDescription] = React.useState('');

  // Private Note form state
  const [newNoteContent, setNewNoteContent] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const token = getStoredToken();
    if (!token) return;

    fetch(`${API_BASE_URL}/garage/vehicles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as GarageVehicleItem[];
      })
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setVehicles(data);
          setSelectedVehicleId(data[0]!.id);
        }
      })
      .catch(() => {
        // Keep seeded vehicles in standalone/offline mode
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0]!;

  const totalSpendInr = selectedVehicle.serviceHistory.reduce(
    (sum, s) => sum + s.costInr,
    0,
  );

  const handleAddVehicle = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setErrorNotice(null);

    if (!newMake.trim() || !newModel.trim()) return;

    const parsedYear = Number(newYear) || 2025;
    const parsedOdo = Math.max(0, Number(newOdometerKm) || 0);

    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/garage/vehicles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: newType,
            make: newMake.trim(),
            model: newModel.trim(),
            year: parsedYear,
            registrationLabel: newRegLabel.trim() || undefined,
            currentOdometerKm: parsedOdo,
          }),
        });
        if (res.ok) {
          const created = (await res.json()) as GarageVehicleItem;
          setVehicles((prev) => [...prev, created]);
          setSelectedVehicleId(created.id);
          setShowAddVehicle(false);
          setNewMake('');
          setNewModel('');
          setStatusNotice(
            `Added ${created.make} ${created.model} to your private garage.`,
          );
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    const fallbackCreated: GarageVehicleItem = {
      id: `veh-${Date.now()}`,
      ownerId: 'user-owner-1',
      type: newType,
      make: newMake.trim(),
      model: newModel.trim(),
      year: parsedYear,
      registrationLabel: newRegLabel.trim() || null,
      currentOdometerKm: parsedOdo,
      createdAt: new Date().toISOString(),
      notes: [],
      serviceHistory: [],
    };

    setVehicles((prev) => [...prev, fallbackCreated]);
    setSelectedVehicleId(fallbackCreated.id);
    setShowAddVehicle(false);
    setNewMake('');
    setNewModel('');
    setStatusNotice(
      `Added ${fallbackCreated.make} ${fallbackCreated.model} to your private garage.`,
    );
  };

  const handleLogServiceRecord = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setErrorNotice(null);

    if (!srvDescription.trim()) return;

    const parsedOdo = Number(srvOdometerKm);
    const parsedCost = Number(srvCostInr);

    if (Number.isNaN(parsedOdo) || parsedOdo < 0) {
      setErrorNotice('Odometer reading must be a non-negative number.');
      return;
    }
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      setErrorNotice('Service cost must be a non-negative amount.');
      return;
    }

    const highestLoggedOdo =
      selectedVehicle.serviceHistory.reduce(
        (max, r) => Math.max(max, r.odometerKm),
        0,
      ) ?? 0;

    if (parsedOdo < highestLoggedOdo) {
      setErrorNotice(
        `Service odometer (${parsedOdo.toLocaleString()} km) cannot be lower than the latest logged service (${highestLoggedOdo.toLocaleString()} km).`,
      );
      return;
    }

    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/garage/vehicles/${selectedVehicle.id}/service-records`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              serviceDate: srvDate,
              odometerKm: parsedOdo,
              costInr: parsedCost,
              workshopName: srvWorkshop.trim() || undefined,
              description: srvDescription.trim(),
            }),
          },
        );
        if (res.ok) {
          const updated = (await res.json()) as GarageVehicleItem;
          setVehicles((prev) =>
            prev.map((v) => (v.id === updated.id ? updated : v)),
          );
          setShowLogService(false);
          setSrvDescription('');
          setStatusNotice(
            `Logged service at ${parsedOdo.toLocaleString()} km and updated current odometer.`,
          );
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    const newRecord = {
      id: `srv-${Date.now()}`,
      vehicleId: selectedVehicle.id,
      serviceDate: srvDate,
      odometerKm: parsedOdo,
      description: srvDescription.trim(),
      costInr: parsedCost,
      workshopName: srvWorkshop.trim() || null,
      createdAt: new Date().toISOString(),
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === selectedVehicle.id
          ? {
              ...v,
              currentOdometerKm: Math.max(v.currentOdometerKm, parsedOdo),
              serviceHistory: [newRecord, ...v.serviceHistory],
            }
          : v,
      ),
    );
    setShowLogService(false);
    setSrvDescription('');
    setStatusNotice(
      `Logged service at ${parsedOdo.toLocaleString()} km and updated current odometer.`,
    );
  };

  const handleAddNote = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/garage/vehicles/${selectedVehicle.id}/notes`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: newNoteContent.trim() }),
          },
        );
        if (res.ok) {
          const updated = (await res.json()) as GarageVehicleItem;
          setVehicles((prev) =>
            prev.map((v) => (v.id === updated.id ? updated : v)),
          );
          setNewNoteContent('');
          setStatusNotice('Saved private vehicle note.');
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    const createdNote = {
      id: `note-${Date.now()}`,
      vehicleId: selectedVehicle.id,
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === selectedVehicle.id
          ? { ...v, notes: [createdNote, ...v.notes] }
          : v,
      ),
    );
    setNewNoteContent('');
    setStatusNotice('Saved private vehicle note.');
  };

  const handleDeleteNote = (noteId: string): void => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === selectedVehicle.id
          ? { ...v, notes: v.notes.filter((n) => n.id !== noteId) }
          : v,
      ),
    );
  };

  return (
    <section
      aria-label="Private Garage and Service History Federated Module"
      className="space-y-6"
    >
      <div className="relative rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 px-5 py-4 pr-12 text-white shadow-md sm:px-6 sm:pr-14">
        <div className="absolute right-2.5 top-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle page description"
            aria-expanded={showHeaderInfo}
            title="Page information"
            onClick={() => setShowHeaderInfo((prev) => !prev)}
            className="h-7 w-7 text-primary-100 hover:bg-white/15 hover:text-white"
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
                className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-yellow-200 bg-yellow-50 p-3.5 text-xs leading-relaxed text-yellow-950 shadow-lg sm:w-80"
              >
                <p>
                  Maintain private vehicle records, odometer-validated service
                  history, costs, and notes for your motorcycles and
                  cars.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            My Garage & Service Logbook
          </h1>
          <Button
            variant="secondary"
            className="bg-yellow-100 text-yellow-950 hover:bg-yellow-200"
            onClick={() => setShowAddVehicle((prev) => !prev)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Vehicle
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

      {/* Add Vehicle Composer */}
      {showAddVehicle && (
        <Card className="border-primary-200 bg-primary-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              Add Vehicle to Private Garage
            </CardTitle>
            <CardDescription>
              Vehicle records, notes, and service costs are strictly visible
              only to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label
                    htmlFor="garage-vehicle-type"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Vehicle Type
                  </label>
                  <select
                    id="garage-vehicle-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as VehicleType)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value={VehicleType.MOTORCYCLE}>Motorcycle</option>
                    <option value={VehicleType.CAR}>Car</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="garage-vehicle-make"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Make / Brand
                  </label>
                  <input
                    id="garage-vehicle-make"
                    type="text"
                    required
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    placeholder="e.g., Triumph"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="garage-vehicle-model"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Model & Variant
                  </label>
                  <input
                    id="garage-vehicle-model"
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="e.g., Speed 400"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="garage-vehicle-year"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Year
                  </label>
                  <input
                    id="garage-vehicle-year"
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="garage-vehicle-odo"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Current Odometer (km)
                  </label>
                  <input
                    id="garage-vehicle-odo"
                    type="number"
                    value={newOdometerKm}
                    onChange={(e) => setNewOdometerKm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="garage-vehicle-reg"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Registration / Nickname (Optional)
                  </label>
                  <input
                    id="garage-vehicle-reg"
                    type="text"
                    value={newRegLabel}
                    onChange={(e) => setNewRegLabel(e.target.value)}
                    placeholder="e.g., KA-01-TR-0400"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddVehicle(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Vehicle to Garage
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Selector */}
      <div className="flex flex-wrap gap-3">
        {vehicles.map((vehicle) => {
          const isSelected = vehicle.id === selectedVehicle.id;
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => setSelectedVehicleId(vehicle.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                isSelected
                  ? 'border-primary-600 bg-primary-50/90 text-primary-950 shadow-sm ring-2 ring-primary-600/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={isSelected ? 'default' : 'outline'}>
                    {vehicle.type}
                  </Badge>
                  <span className="text-xs font-medium text-slate-500">
                    {vehicle.year}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold">
                  {vehicle.make} {vehicle.model}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Vehicle Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Service History Column */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>
                Service History — {selectedVehicle.make} {selectedVehicle.model}
              </CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <Gauge
                    className="h-3.5 w-3.5 text-primary-600"
                    aria-hidden="true"
                  />
                  Current Odometer:{' '}
                  {selectedVehicle.currentOdometerKm.toLocaleString()} km
                </span>
                <span>
                  • Total Logged Spend: ₹{totalSpendInr.toLocaleString()}
                </span>
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSrvOdometerKm(String(selectedVehicle.currentOdometerKm + 500));
                setShowLogService((prev) => !prev);
              }}
            >
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              Log Service
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {showLogService && (
              <form
                onSubmit={handleLogServiceRecord}
                className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/40 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-primary-900">
                  Log New Service Record
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="srv-date-input"
                      className="mb-1 block text-xs font-semibold text-slate-700"
                    >
                      Service Date
                    </label>
                    <input
                      id="srv-date-input"
                      type="date"
                      value={srvDate}
                      onChange={(e) => setSrvDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="srv-odo-input"
                      className="mb-1 block text-xs font-semibold text-slate-700"
                    >
                      Odometer Reading (km)
                    </label>
                    <input
                      id="srv-odo-input"
                      type="number"
                      required
                      value={srvOdometerKm}
                      onChange={(e) => setSrvOdometerKm(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="srv-cost-input"
                      className="mb-1 block text-xs font-semibold text-slate-700"
                    >
                      Total Cost (₹)
                    </label>
                    <input
                      id="srv-cost-input"
                      type="number"
                      required
                      value={srvCostInr}
                      onChange={(e) => setSrvCostInr(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="srv-workshop-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Workshop / Service Center
                  </label>
                  <input
                    id="srv-workshop-input"
                    type="text"
                    value={srvWorkshop}
                    onChange={(e) => setSrvWorkshop(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="srv-desc-input"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Work Performed & Parts Replaced
                  </label>
                  <textarea
                    id="srv-desc-input"
                    rows={2}
                    required
                    value={srvDescription}
                    onChange={(e) => setSrvDescription(e.target.value)}
                    placeholder="e.g., Replaced chain & sprocket kit, Motul 7100 10W40 oil change..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowLogService(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Service Entry
                  </Button>
                </div>
              </form>
            )}

            {selectedVehicle.serviceHistory.map((record) => (
              <div
                key={record.id}
                className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    {record.serviceDate} • {record.odometerKm.toLocaleString()}{' '}
                    km
                    {record.workshopName ? ` • ${record.workshopName}` : ''}
                  </span>
                  <Badge variant="outline">
                    Cost: ₹{record.costInr.toLocaleString()}
                  </Badge>
                </div>
                <p className="text-sm text-slate-800">{record.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notes Column */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText
                    className="h-4 w-4 text-primary-600"
                    aria-hidden="true"
                  />
                  Vehicle Notes
                </CardTitle>
                <Badge variant="secondary">Private</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  aria-label="New private vehicle note"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add tire PSI, suspension setting..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                />
                <Button type="submit" size="sm" variant="outline">
                  Add Note
                </Button>
              </form>

              {selectedVehicle.notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
                >
                  <span>{note.content}</span>
                  <button
                    type="button"
                    aria-label="Delete vehicle note"
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default GarageRemoteApp;
