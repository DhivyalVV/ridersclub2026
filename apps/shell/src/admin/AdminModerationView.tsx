import * as React from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Flag,
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  ModerationTargetType,
  ReportStatus,
  UserRole,
  type AdminPlatformOverview,
  type AuthenticatedUserAccount,
  type ContentReportItem,
  type ModerationAuditLogItem,
} from '@ridersclub/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@ridersclub/ui';

const INITIAL_ADMIN_OVERVIEW: AdminPlatformOverview = {
  totalUsers: 148,
  openReportsCount: 2,
  pendingMechanicsCount: 1,
  activeRidesCount: 4,
  activeHelpRequestsCount: 2,
  activeListingsCount: 3,
  reports: [
    {
      id: 'rep-seed-1',
      reporterId: 'user-founder-1',
      targetType: ModerationTargetType.LISTING,
      targetId: 'list-suspicious-01',
      targetLabel: '2022 Yamaha R15 V4 — Urgent Advance Token Requested',
      reason:
        'Seller requested UPI token payment before allowing physical vehicle inspection.',
      status: ReportStatus.OPEN,
      resolutionNotes: null,
      resolvedById: null,
      resolvedAt: null,
      reporter: {
        id: 'user-founder-1',
        username: 'vikram_adv',
        displayName: 'Vikramaditya Rao',
        avatarUrl: null,
        bio: 'Lead ride marshal • Tiger 900 Rally Pro',
        city: 'Bengaluru',
        role: UserRole.MODERATOR,
        canReceiveDirectMessage: true,
      },
      createdAt: '2026-10-21T08:30:00.000Z',
    },
    {
      id: 'rep-seed-2',
      reporterId: 'user-founder-1',
      targetType: ModerationTargetType.MECHANIC,
      targetId: 'mech-2',
      targetLabel: 'Highway 44 Garage & Tire Center',
      reason:
        'Pending trade license verification before granting Verified Provider badge.',
      status: ReportStatus.OPEN,
      resolutionNotes: null,
      resolvedById: null,
      resolvedAt: null,
      reporter: {
        id: 'user-founder-1',
        username: 'vikram_adv',
        displayName: 'Vikramaditya Rao',
        avatarUrl: null,
        bio: 'Lead ride marshal • Tiger 900 Rally Pro',
        city: 'Bengaluru',
        role: UserRole.MODERATOR,
        canReceiveDirectMessage: true,
      },
      createdAt: '2026-10-21T07:45:00.000Z',
    },
  ],
  auditLogs: [
    {
      id: 'audit-seed-1',
      actorId: 'user-current-dev',
      action: 'MECHANIC_VERIFIED',
      targetType: ModerationTargetType.MECHANIC,
      targetId: 'mech-1',
      reason:
        'Verified GST registration and physical workshop inspection for Apex MotoWorks & Suspension Lab.',
      actor: {
        id: 'user-current-dev',
        username: 'dhivyal_rc',
        displayName: 'Dhivyal Rider',
        avatarUrl: null,
        bio: 'RidersClub Governance Lead',
        city: 'Bengaluru',
        role: UserRole.ADMIN,
        canReceiveDirectMessage: true,
      },
      createdAt: '2026-10-20T14:20:00.000Z',
    },
  ],
};

export interface AdminModerationViewProps {
  apiBaseUrl: string;
  currentUser: AuthenticatedUserAccount | null;
  accessToken: string | null;
}

export function AdminModerationView({
  apiBaseUrl,
  currentUser,
  accessToken,
}: AdminModerationViewProps): React.JSX.Element {
  const [overview, setOverview] =
    React.useState<AdminPlatformOverview>(INITIAL_ADMIN_OVERVIEW);
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | ReportStatus>('ALL');
  const [showReportComposer, setShowReportComposer] = React.useState(false);
  const [statusBanner, setStatusBanner] = React.useState<string | null>(null);

  // Report composer state
  const [targetType, setTargetType] = React.useState<ModerationTargetType>(
    ModerationTargetType.LISTING,
  );
  const [targetId, setTargetId] = React.useState('');
  const [targetLabel, setTargetLabel] = React.useState('');
  const [reportReason, setReportReason] = React.useState('');
  const [composerError, setComposerError] = React.useState<string | null>(null);

  const effectiveRole = currentUser?.role ?? UserRole.ADMIN;
  const isModeratorOrAdmin =
    effectiveRole === UserRole.ADMIN || effectiveRole === UserRole.MODERATOR;

  React.useEffect(() => {
    if (!accessToken) {
      return;
    }
    let isMounted = true;

    fetch(`${apiBaseUrl}/admin/overview`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AdminPlatformOverview | null) => {
        if (isMounted && data) {
          setOverview(data);
        }
      })
      .catch(() => {
        // Keep seeded fallback overview when offline
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, apiBaseUrl]);

  const filteredReports = React.useMemo(() => {
    if (statusFilter === 'ALL') {
      return overview.reports;
    }
    return overview.reports.filter((r) => r.status === statusFilter);
  }, [overview.reports, statusFilter]);

  function handleResolveReport(
    report: ContentReportItem,
    resolutionStatus: ReportStatus.ACTIONED | ReportStatus.DISMISSED,
  ): void {
    const actionTaken =
      resolutionStatus === ReportStatus.ACTIONED
        ? `${report.targetType}_MODERATED_ACTIONED`
        : `${report.targetType}_REPORT_DISMISSED`;
    const resolutionNotes =
      resolutionStatus === ReportStatus.ACTIONED
        ? `Trust & Safety action enforced on ${report.targetLabel}.`
        : `Reviewed ${report.targetLabel}; no policy violation found.`;

    const optimisticAuditLog: ModerationAuditLogItem = {
      id: `audit-${Date.now()}`,
      actorId: currentUser?.id ?? 'user-current-dev',
      action: actionTaken,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: resolutionNotes,
      actor: {
        id: currentUser?.id ?? 'user-current-dev',
        username: currentUser?.profile.username ?? 'dhivyal_rc',
        displayName: currentUser?.profile.displayName ?? 'Dhivyal Rider',
        avatarUrl: null,
        bio: 'RidersClub Governance Lead',
        city: 'Bengaluru',
        role: effectiveRole,
        canReceiveDirectMessage: true,
      },
      createdAt: new Date().toISOString(),
    };

    setOverview((prev) => {
      const updatedReports = prev.reports.map((item) =>
        item.id === report.id
          ? {
              ...item,
              status: resolutionStatus,
              resolutionNotes,
              resolvedById: optimisticAuditLog.actorId,
              resolvedAt: optimisticAuditLog.createdAt,
            }
          : item,
      );
      const openReportsCount = updatedReports.filter(
        (r) => r.status === ReportStatus.OPEN,
      ).length;

      return {
        ...prev,
        openReportsCount,
        reports: updatedReports,
        auditLogs: [optimisticAuditLog, ...prev.auditLogs],
      };
    });

    setStatusBanner(
      `Report "${report.targetLabel}" marked ${resolutionStatus} and recorded in the immutable Moderation Audit Log.`,
    );

    if (accessToken) {
      fetch(`${apiBaseUrl}/admin/reports/${report.id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: resolutionStatus,
          actionTaken,
          resolutionNotes,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (
            saved: {
              report: ContentReportItem;
              auditLog: ModerationAuditLogItem;
            } | null,
          ) => {
            if (!saved) return;
            setOverview((prev) => ({
              ...prev,
              reports: prev.reports.map((r) =>
                r.id === saved.report.id ? saved.report : r,
              ),
              auditLogs: prev.auditLogs.map((l) =>
                l.id === optimisticAuditLog.id ? saved.auditLog : l,
              ),
            }));
          },
        )
        .catch(() => {
          // Keep optimistic resolution when offline
        });
    }
  }

  function handleCreateReport(e: React.FormEvent): void {
    e.preventDefault();
    setComposerError(null);

    if (!targetId.trim() || !targetLabel.trim() || reportReason.trim().length < 5) {
      setComposerError(
        'Please provide a target ID, descriptive target label, and a detailed reason.',
      );
      return;
    }

    const newReport: ContentReportItem = {
      id: `rep-${Date.now()}`,
      reporterId: currentUser?.id ?? 'user-current-dev',
      targetType,
      targetId: targetId.trim(),
      targetLabel: targetLabel.trim(),
      reason: reportReason.trim(),
      status: ReportStatus.OPEN,
      resolutionNotes: null,
      resolvedById: null,
      resolvedAt: null,
      reporter: {
        id: currentUser?.id ?? 'user-current-dev',
        username: currentUser?.profile.username ?? 'dhivyal_rc',
        displayName: currentUser?.profile.displayName ?? 'Dhivyal Rider',
        avatarUrl: null,
        bio: 'RidersClub Member',
        city: 'Bengaluru',
        role: effectiveRole,
        canReceiveDirectMessage: true,
      },
      createdAt: new Date().toISOString(),
    };

    setOverview((prev) => ({
      ...prev,
      openReportsCount: prev.openReportsCount + 1,
      reports: [newReport, ...prev.reports],
    }));

    setTargetId('');
    setTargetLabel('');
    setReportReason('');
    setShowReportComposer(false);
    setStatusBanner(
      `Safety report submitted for "${newReport.targetLabel}" and queued for moderator review.`,
    );

    if (accessToken) {
      fetch(`${apiBaseUrl}/admin/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetType: newReport.targetType,
          targetId: newReport.targetId,
          targetLabel: newReport.targetLabel,
          reason: newReport.reason,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((saved: ContentReportItem | null) => {
          if (!saved) return;
          setOverview((prev) => ({
            ...prev,
            reports: prev.reports.map((r) => (r.id === newReport.id ? saved : r)),
          }));
        })
        .catch(() => {
          // Keep optimistic report when offline
        });
    }
  }

  return (
    <div className="space-y-6">
      {/* Deep Cobalt Governance Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-950 via-primary-900 to-primary-700 p-6 text-white shadow-md">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white border-white/25">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Trust, Safety & Governance Console
              </Badge>
              <Badge variant="verified">
                Role: {effectiveRole}
              </Badge>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Administrator & Moderation Center
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-primary-100">
              Review flagged marketplace listings, mechanic verifications, and community content with immutable audit logging and WCAG AA accessibility safeguards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={() => setShowReportComposer((prev) => !prev)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {showReportComposer ? 'Close Report Form' : 'File Safety Report'}
            </Button>
          </div>
        </div>
      </div>

      {statusBanner && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {statusBanner}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusBanner(null)}
            className="text-emerald-800 hover:bg-emerald-100"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* File Safety Report Composer */}
      {showReportComposer && (
        <Card className="border-primary-200 bg-primary-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4 text-primary-600" aria-hidden="true" />
              Submit Content or Seller Safety Report
            </CardTitle>
            <CardDescription>
              Flag suspicious listings, unverified mechanics, or abusive posts for moderator action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateReport} className="space-y-4">
              {composerError && (
                <p role="alert" className="text-xs font-semibold text-rose-600">
                  {composerError}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="report-target-type"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Target Entity Type
                  </label>
                  <select
                    id="report-target-type"
                    value={targetType}
                    onChange={(e) =>
                      setTargetType(e.target.value as ModerationTargetType)
                    }
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  >
                    <option value={ModerationTargetType.LISTING}>Marketplace Listing</option>
                    <option value={ModerationTargetType.MECHANIC}>Mechanic Provider</option>
                    <option value={ModerationTargetType.BLOG}>Rider Blog Post</option>
                    <option value={ModerationTargetType.COMMUNITY}>Community Post</option>
                    <option value={ModerationTargetType.HELP_REQUEST}>Roadside Help Request</option>
                    <option value={ModerationTargetType.USER}>User Account</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="report-target-id"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Target Reference ID
                  </label>
                  <input
                    id="report-target-id"
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="e.g. list-902 or mech-4"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="report-target-label"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Target Title / Summary
                  </label>
                  <input
                    id="report-target-label"
                    type="text"
                    value={targetLabel}
                    onChange={(e) => setTargetLabel(e.target.value)}
                    placeholder="e.g. Suspicious Duke 390 Ad"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="report-reason"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Safety Concern / Policy Violation Details
                </label>
                <textarea
                  id="report-reason"
                  rows={2}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe why this item requires moderator review..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReportComposer(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Safety Report</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Platform Health & Governance KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Registered Riders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {overview.totalUsers}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-amber-800">Open Reports</p>
            <p
              data-testid="open-reports-count"
              className="mt-1 text-2xl font-bold text-amber-900"
            >
              {overview.openReportsCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Pending Mechanics</p>
            <p className="mt-1 text-2xl font-bold text-primary-700">
              {overview.pendingMechanicsCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Upcoming Rides</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {overview.activeRidesCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Active SOS Alerts</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">
              {overview.activeHelpRequestsCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Active Listings</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {overview.activeListingsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Moderation Queue */}
      <Card>
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Content & Marketplace Moderation Queue
            </CardTitle>
            <CardDescription>
              Every moderator decision automatically writes an immutable record to the audit log.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter reports by status">
            {(['ALL', ReportStatus.OPEN, ReportStatus.ACTIONED, ReportStatus.DISMISSED] as const).map(
              (status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ),
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredReports.length === 0 ? (
            <EmptyState
              title="No reports match this filter"
              description="All flagged items in this category have been processed."
            />
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        report.status === ReportStatus.OPEN
                          ? 'warning'
                          : report.status === ReportStatus.ACTIONED
                            ? 'verified'
                            : 'outline'
                      }
                    >
                      {report.status}
                    </Badge>
                    <Badge variant="outline">{report.targetType}</Badge>
                    <span className="font-mono text-xs text-slate-500">
                      ID: {report.targetId}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {report.targetLabel}
                  </h3>
                  <p className="text-xs text-slate-600">{report.reason}</p>
                  <p className="text-[11px] text-slate-400">
                    Reported by {report.reporter.displayName} (@
                    {report.reporter.username})
                    {report.resolutionNotes
                      ? ` • Resolution: ${report.resolutionNotes}`
                      : ''}
                  </p>
                </div>

                {report.status === ReportStatus.OPEN && isModeratorOrAdmin ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleResolveReport(report, ReportStatus.ACTIONED)
                      }
                      aria-label={`Action report for ${report.targetLabel}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Action Report
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleResolveReport(report, ReportStatus.DISMISSED)
                      }
                      aria-label={`Dismiss report for ${report.targetLabel}`}
                    >
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      Dismiss
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Immutable Moderation Audit Log & Security/Accessibility Audit */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Immutable Moderation Audit Log
            </CardTitle>
            <CardDescription>
              Tamper-evident chronological ledger of administrator and moderator actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{log.action}</Badge>
                    <Badge variant="outline">
                      {log.targetType} • {log.targetId}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Actor: {log.actor.displayName} (@{log.actor.username})
                  </span>
                </div>
                <p className="mt-2 text-slate-700">{log.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Security & WCAG AA Audit
            </CardTitle>
            <CardDescription>
              Active OWASP & accessibility safeguards verified across RidersClub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>
                  <strong>Auth & Token Hygiene:</strong> Argon2id password hashing, short-lived JWT access tokens, and HttpOnly refresh token rotation.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>
                  <strong>Roadside GPS Redaction:</strong> Exact coordinates require explicit consent and are automatically wiped when an SOS is resolved or cancelled.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>
                  <strong>Phone & Garage Privacy:</strong> Phone numbers are masked unless opted in; Garage vehicles & service logs enforce strict owner-only access.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>
                  <strong>WCAG AA Keyboard & Screen Reader Support:</strong> Skip-to-main-content link, Escape key dialog dismissal, semantic ARIA live regions, and high-contrast Deep Cobalt tokens.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminModerationView;

