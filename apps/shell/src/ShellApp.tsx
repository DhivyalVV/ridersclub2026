import * as React from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Ban,
  Bell,
  BookOpen,
  Car,
  Compass,
  Gauge,
  LogIn,
  Menu,
  MessageSquare,
  Send,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  User,
  Wrench,
  X,
} from 'lucide-react';
import {
  buildConversationPairKey,
  UserRole,
  type ApiHealthResponse,
  type AuthenticatedUserAccount,
  type AuthSessionResponse,
  type DirectConversationItem,
  type DirectMessageItem,
  type DirectMessagingRealtimeEvent,
  type PublicUserSummary,
} from '@ridersclub/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  RemoteErrorBoundary,
  RemoteLoadingState,
  RIDERSCLUB_OPEN_CHAT_EVENT,
  RIDERSCLUB_VIEW_PROFILE_EVENT,
  UserProfileCard,
  type OpenDirectChatDetail,
  type ViewUserProfileDetail,
} from '@ridersclub/ui';
import { AdminModerationView } from './admin/AdminModerationView.js';
import { AuthAndProfileView } from './auth/AuthAndProfileView.js';

const FederatedCommunityRemote = React.lazy(() => import('community/App'));
const FederatedRidesRemote = React.lazy(() => import('rides/App'));
const FederatedHelpRemote = React.lazy(() => import('help/App'));
const FederatedMechanicsRemote = React.lazy(() => import('mechanics/App'));
const FederatedGarageRemote = React.lazy(() => import('garage/App'));
const FederatedMarketplaceRemote = React.lazy(() => import('marketplace/App'));

const ACCESS_TOKEN_STORAGE_KEY = 'ridersclub:access_token';

const FALLBACK_GUEST_USER: PublicUserSummary = {
  id: 'user-current-dev',
  displayName: 'Dhivyal Rider',
  username: 'dhivyal_rc',
  avatarUrl: null,
  bio: 'RidersClub Member • Touring & Garage Enthusiast',
  city: 'Bengaluru',
  role: UserRole.ADMIN,
  canReceiveDirectMessage: true,
};

interface DirectConversationThread {
  conversationId?: string;
  pairKey: string;
  peer: PublicUserSummary;
  contextLabel?: string;
  unreadCount: number;
  messages: Array<{
    id: string;
    senderId: string;
    body: string;
    sentAtLabel: string;
  }>;
}

function formatSentTimeLabel(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Just now';
  }
}

function mapApiConversationToThread(item: DirectConversationItem): DirectConversationThread {
  return {
    conversationId: item.id,
    pairKey: item.participantPairKey,
    peer: item.peer,
    contextLabel: item.contextLabel ?? undefined,
    unreadCount: item.unreadCount,
    messages: item.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      sentAtLabel: formatSentTimeLabel(m.createdAt),
    })),
  };
}

export interface RemoteComponentOverrides {
  Community?: React.ComponentType<{ initialSection?: 'communities' | 'blogs' }>;
  Rides?: React.ComponentType;
  Help?: React.ComponentType;
  Mechanics?: React.ComponentType;
  Garage?: React.ComponentType;
  Marketplace?: React.ComponentType;
}

export interface ShellAppProps {
  /**
   * Optional override components used in tests for simulating specific remote states or failures.
   */
  CommunityComponentOverride?: React.ComponentType<{
    initialSection?: 'communities' | 'blogs';
  }>;
  remoteOverrides?: RemoteComponentOverrides;
}

export function ShellApp({
  CommunityComponentOverride,
  remoteOverrides,
}: ShellAppProps): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();

  const apiBaseUrl =
    (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
    'http://localhost:4000/api/v1';

  const [apiHealth, setApiHealth] = React.useState<ApiHealthResponse | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(() => {
    try {
      return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [authenticatedUser, setAuthenticatedUser] =
    React.useState<AuthenticatedUserAccount | null>(null);

  const [isChatDrawerOpen, setIsChatDrawerOpen] = React.useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = React.useState(false);
  const [inspectedUser, setInspectedUser] = React.useState<PublicUserSummary | null>(null);
  const [blockedUserIds, setBlockedUserIds] = React.useState<Set<string>>(new Set());
  const [draftMessage, setDraftMessage] = React.useState('');

  const activeSelfId = authenticatedUser?.id ?? FALLBACK_GUEST_USER.id;
  const activeSelfDisplayName =
    authenticatedUser?.profile.displayName ?? FALLBACK_GUEST_USER.displayName;

  const [conversations, setConversations] = React.useState<DirectConversationThread[]>([
    {
      pairKey: buildConversationPairKey(FALLBACK_GUEST_USER.id, 'user-founder-1'),
      peer: {
        id: 'user-founder-1',
        displayName: 'Vikramaditya Rao',
        username: 'vikram_adv',
        avatarUrl: null,
        bio: 'Lead ride marshal • Tiger 900 Rally Pro',
        city: 'Bengaluru',
        role: UserRole.MODERATOR,
        canReceiveDirectMessage: true,
      },
      contextLabel: 'Community: Western Ghats ADV Tourers',
      unreadCount: 1,
      messages: [
        {
          id: 'msg-seed-1',
          senderId: 'user-founder-1',
          body: 'Hey! Welcome to Western Ghats ADV Tourers. Let me know if you are joining Sunday’s Sakleshpur breakfast run.',
          sentAtLabel: '09:15 AM',
        },
      ],
    },
  ]);

  const [activePairKey, setActivePairKey] = React.useState<string>(
    conversations[0]?.pairKey ?? '',
  );

  // Check Backend API + PostgreSQL health on mount
  React.useEffect(() => {
    let isMounted = true;

    fetch(`${apiBaseUrl}/health`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('API unreachable'))))
      .then((data: ApiHealthResponse) => {
        if (isMounted) setApiHealth(data);
      })
      .catch(() => {
        if (isMounted) setApiHealth(null);
      });

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  // Restore authenticated user session if token exists and load persisted 1:1 conversations
  React.useEffect(() => {
    if (!accessToken) {
      setAuthenticatedUser(null);
      return;
    }

    let isMounted = true;
    fetch(`${apiBaseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Invalid session'))))
      .then((user: AuthenticatedUserAccount) => {
        if (!isMounted) return;
        setAuthenticatedUser(user);
        return fetch(`${apiBaseUrl}/conversations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((items: DirectConversationItem[]) => {
            if (isMounted && Array.isArray(items) && items.length > 0) {
              const mapped = items.map(mapApiConversationToThread);
              setConversations(mapped);
              setActivePairKey((prev) => prev || mapped[0]?.pairKey || '');
            }
          });
      })
      .catch(() => {
        if (isMounted) {
          setAuthenticatedUser(null);
          setAccessToken(null);
          try {
            window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
          } catch {
            // ignore
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, apiBaseUrl]);

  // Connect to real-time 1:1 messaging SSE stream when authenticated
  React.useEffect(() => {
    if (!accessToken || typeof window.EventSource === 'undefined') {
      return;
    }

    let source: EventSource | null = null;
    try {
      source = new window.EventSource(
        `${apiBaseUrl}/conversations/stream?token=${encodeURIComponent(accessToken)}`,
      );

      source.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data) as DirectMessagingRealtimeEvent;
          if (payload.type === 'direct_message.created' && payload.message) {
            const incomingMsg = payload.message;
            setConversations((prev) =>
              prev.map((thread) => {
                if (thread.pairKey !== payload.participantPairKey) {
                  return thread;
                }
                const alreadyExists = thread.messages.some((m) => m.id === incomingMsg.id);
                if (alreadyExists) {
                  return thread;
                }
                const isFromPeer = incomingMsg.senderId !== activeSelfId;
                return {
                  ...thread,
                  conversationId: payload.conversationId,
                  unreadCount:
                    isFromPeer && !isChatDrawerOpen
                      ? thread.unreadCount + 1
                      : thread.unreadCount,
                  messages: [
                    ...thread.messages,
                    {
                      id: incomingMsg.id,
                      senderId: incomingMsg.senderId,
                      body: incomingMsg.body,
                      sentAtLabel: formatSentTimeLabel(incomingMsg.createdAt),
                    },
                  ],
                };
              }),
            );
          }
        } catch {
          // ignore malformed SSE event
        }
      };
    } catch {
      // ignore if EventSource fails to connect
    }

    return () => {
      source?.close();
    };
  }, [accessToken, apiBaseUrl, activeSelfId, isChatDrawerOpen]);

  // Listen for cross-micro-frontend 1:1 Chat & Profile inspection events
  React.useEffect(() => {
    function handleOpenChat(event: Event): void {
      const customEvent = event as CustomEvent<OpenDirectChatDetail>;
      const { targetUser, contextLabel } = customEvent.detail;

      if (targetUser.id === activeSelfId) return;
      if (blockedUserIds.has(targetUser.id) || !targetUser.canReceiveDirectMessage) {
        return;
      }

      const pairKey = buildConversationPairKey(activeSelfId, targetUser.id);

      setConversations((prev) => {
        const existing = prev.find((c) => c.pairKey === pairKey);
        if (existing) {
          return prev.map((c) =>
            c.pairKey === pairKey
              ? {
                  ...c,
                  unreadCount: 0,
                  contextLabel: contextLabel ?? c.contextLabel,
                }
              : c,
          );
        }

        const newThread: DirectConversationThread = {
          pairKey,
          peer: targetUser,
          contextLabel,
          unreadCount: 0,
          messages: [],
        };
        return [newThread, ...prev];
      });

      setActivePairKey(pairKey);
      setIsChatDrawerOpen(true);

      if (accessToken) {
        fetch(`${apiBaseUrl}/conversations/open`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            recipientUserId: targetUser.id,
            contextLabel,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((conv: DirectConversationItem | null) => {
            if (!conv) return;
            const synced = mapApiConversationToThread(conv);
            setConversations((prev) =>
              prev.map((c) => (c.pairKey === synced.pairKey ? synced : c)),
            );
          })
          .catch(() => {
            // keep local thread state if offline
          });
      }
    }

    function handleViewProfile(event: Event): void {
      const customEvent = event as CustomEvent<ViewUserProfileDetail>;
      setInspectedUser(customEvent.detail.targetUser);
    }

    window.addEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, handleOpenChat);
    window.addEventListener(RIDERSCLUB_VIEW_PROFILE_EVENT, handleViewProfile);

    return () => {
      window.removeEventListener(RIDERSCLUB_OPEN_CHAT_EVENT, handleOpenChat);
      window.removeEventListener(RIDERSCLUB_VIEW_PROFILE_EVENT, handleViewProfile);
    };
  }, [activeSelfId, blockedUserIds, accessToken, apiBaseUrl]);

  // WCAG AA Keyboard accessibility: Escape key dismisses active drawers or dialogs
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setInspectedUser(null);
        setIsChatDrawerOpen(false);
        setIsMobileMoreOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const totalUnreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const activeConversation = conversations.find((c) => c.pairKey === activePairKey) ?? null;

  function handleSessionEstablished(session: AuthSessionResponse): void {
    setAccessToken(session.accessToken);
    setAuthenticatedUser(session.user);
    try {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
    } catch {
      // ignore
    }
  }

  async function handleSignOut(): Promise<void> {
    if (accessToken) {
      try {
        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
      } catch {
        // ignore network error on logout
      }
    }
    setAccessToken(null);
    setAuthenticatedUser(null);
    try {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  async function handleToggleBlockUser(targetUser: PublicUserSummary): Promise<void> {
    const isCurrentlyBlocked = blockedUserIds.has(targetUser.id);
    const nextBlocked = new Set(blockedUserIds);

    if (isCurrentlyBlocked) {
      nextBlocked.delete(targetUser.id);
    } else {
      nextBlocked.add(targetUser.id);
    }
    setBlockedUserIds(nextBlocked);

    if (accessToken) {
      try {
        await fetch(`${apiBaseUrl}/profiles/${targetUser.id}/block`, {
          method: isCurrentlyBlocked ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
      } catch {
        // ignore if offline
      }
    }

    setInspectedUser((prev) =>
      prev && prev.id === targetUser.id
        ? {
            ...prev,
            canReceiveDirectMessage: isCurrentlyBlocked,
            isBlockedByViewer: !isCurrentlyBlocked,
          }
        : prev,
    );
  }

  function handleSendMessage(e: React.FormEvent): void {
    e.preventDefault();
    const trimmed = draftMessage.trim();
    if (!trimmed || !activeConversation) return;

    const tempId = `msg-${Date.now()}`;
    const targetPairKey = activeConversation.pairKey;
    const targetConversationId = activeConversation.conversationId;
    const targetContextLabel = activeConversation.contextLabel;

    setConversations((prev) =>
      prev.map((c) =>
        c.pairKey === targetPairKey
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: tempId,
                  senderId: activeSelfId,
                  body: trimmed,
                  sentAtLabel: 'Just now',
                },
              ],
            }
          : c,
      ),
    );
    setDraftMessage('');

    if (accessToken && targetConversationId) {
      fetch(`${apiBaseUrl}/conversations/${targetConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          body: trimmed,
          contextLabel: targetContextLabel,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((saved: DirectMessageItem | null) => {
          if (!saved) return;
          setConversations((prev) =>
            prev.map((c) =>
              c.pairKey === targetPairKey
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === tempId
                        ? {
                            id: saved.id,
                            senderId: saved.senderId,
                            body: saved.body,
                            sentAtLabel: formatSentTimeLabel(saved.createdAt),
                          }
                        : m,
                    ),
                  }
                : c,
            ),
          );
        })
        .catch(() => {
          // keep optimistic message if offline
        });
    }
  }

  const CommunityComponent =
    remoteOverrides?.Community ?? CommunityComponentOverride ?? FederatedCommunityRemote;
  const RidesComponent = remoteOverrides?.Rides ?? FederatedRidesRemote;
  const HelpComponent = remoteOverrides?.Help ?? FederatedHelpRemote;
  const MechanicsComponent = remoteOverrides?.Mechanics ?? FederatedMechanicsRemote;
  const GarageComponent = remoteOverrides?.Garage ?? FederatedGarageRemote;
  const MarketplaceComponent = remoteOverrides?.Marketplace ?? FederatedMarketplaceRemote;

  function renderFederatedModule(
    remoteName: string,
    remoteUrl: string,
    element: React.ReactNode,
  ): React.JSX.Element {
    return (
      <RemoteErrorBoundary
        key={location.pathname}
        remoteName={remoteName}
        remoteUrl={remoteUrl}
      >
        <React.Suspense fallback={<RemoteLoadingState remoteName={remoteName} />}>
          {element}
        </React.Suspense>
      </RemoteErrorBoundary>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* WCAG 2.1 AA Skip-to-Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Top Global Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
                <Gauge className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Riders<span className="text-primary-600">Club</span>
                </span>
                <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
                  Enterprise Mobility & Rider Network
                </span>
              </div>
            </Link>

            {/* Live API + PostgreSQL status indicator */}
            <div className="hidden items-center lg:flex">
              {apiHealth?.database.connected ? (
                <Badge variant="verified" className="ml-3">
                  <Activity className="h-3 w-3" aria-hidden="true" />
                  API & DB Connected ({apiHealth.database.latencyMs}ms)
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-3 text-slate-500">
                  <Activity className="h-3 w-3" aria-hidden="true" />
                  Shell Host (:5000)
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeConversation) {
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.pairKey === activeConversation.pairKey ? { ...c, unreadCount: 0 } : c,
                    ),
                  );
                }
                setIsChatDrawerOpen(true);
              }}
              aria-label="Open 1:1 Direct Messages Drawer"
              className="relative"
            >
              <MessageSquare className="h-4 w-4 text-primary-600" aria-hidden="true" />
              <span className="hidden sm:inline">Messages</span>
              {totalUnreadMessages > 0 && (
                <span
                  aria-label={`${totalUnreadMessages} unread messages`}
                  className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[11px] font-bold text-white"
                >
                  {totalUnreadMessages}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => navigate('/help')}
              title="Roadside Help & Alerts"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Link
              to="/profile"
              aria-label="My Profile and Account Settings"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 text-xs font-semibold text-slate-800 transition-colors hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              <Avatar
                alt={activeSelfDisplayName}
                fallbackText={activeSelfDisplayName}
                size="sm"
              />
              <span className="hidden md:inline">
                {authenticatedUser ? activeSelfDisplayName : 'Sign In / Profile'}
              </span>
              {!authenticatedUser && (
                <LogIn className="h-3.5 w-3.5 text-primary-600 md:hidden" aria-hidden="true" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Grid with Desktop Left Rail */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 pb-24 pt-6 sm:px-6 md:pb-12">
        {/* Desktop Sidebar Navigation */}
        <aside
          aria-label="Desktop Navigation"
          className="hidden w-60 shrink-0 flex-col justify-between md:flex"
        >
          <nav className="space-y-1">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Core Experience
            </p>
            {[
              { to: '/communities', label: 'Communities', icon: Compass, port: ':5001' },
              { to: '/blogs', label: 'Rider Blogs', icon: BookOpen, port: ':5001' },
              { to: '/rides', label: 'Group Rides', icon: Car, port: ':5002' },
              { to: '/help', label: 'Roadside Help', icon: AlertTriangle, port: ':5003', highlight: true },
              { to: '/garage', label: 'My Garage', icon: Shield, port: ':5005' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-sm'
                        : item.highlight
                          ? 'text-amber-800 hover:bg-amber-50'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className="rounded-full bg-primary-100/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary-900">
                    {item.port}
                  </span>
                </NavLink>
              );
            })}

            <p className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Directory & Commerce
            </p>
            {[
              { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, port: ':5006' },
              { to: '/mechanics', label: 'Mechanics', icon: Wrench, port: ':5004' },
              { to: '/profile', label: 'Profile & Auth', icon: User, port: 'Phase 5' },
              { to: '/admin', label: 'Admin & Safety', icon: ShieldAlert, port: 'Phase 13' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                    {item.port}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          <Card className="mt-6 bg-primary-950 text-white border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>6 Remotes + Auth Active</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Shell (:5000) orchestrates Community (:5001), Rides (:5002), Help (:5003),
                Mechanics (:5004), Garage (:5005), Marketplace (:5006) & NestJS Auth (:4000).
              </p>
            </CardContent>
          </Card>
        </aside>

        {/* Active Route Viewport */}
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          <Routes>
            <Route
              path="/"
              element={renderFederatedModule(
                'Community (@ridersclub/community)',
                'http://localhost:5001/remoteEntry.js',
                <CommunityComponent initialSection="communities" />,
              )}
            />
            <Route
              path="/communities/*"
              element={renderFederatedModule(
                'Community (@ridersclub/community)',
                'http://localhost:5001/remoteEntry.js',
                <CommunityComponent initialSection="communities" />,
              )}
            />
            <Route
              path="/blogs/*"
              element={renderFederatedModule(
                'Community (@ridersclub/community)',
                'http://localhost:5001/remoteEntry.js',
                <CommunityComponent initialSection="blogs" />,
              )}
            />
            <Route
              path="/rides/*"
              element={renderFederatedModule(
                'Rides (@ridersclub/rides)',
                'http://localhost:5002/remoteEntry.js',
                <RidesComponent />,
              )}
            />
            <Route
              path="/help/*"
              element={renderFederatedModule(
                'Help (@ridersclub/help)',
                'http://localhost:5003/remoteEntry.js',
                <HelpComponent />,
              )}
            />
            <Route
              path="/mechanics/*"
              element={renderFederatedModule(
                'Mechanics (@ridersclub/mechanics)',
                'http://localhost:5004/remoteEntry.js',
                <MechanicsComponent />,
              )}
            />
            <Route
              path="/garage/*"
              element={renderFederatedModule(
                'Garage (@ridersclub/garage)',
                'http://localhost:5005/remoteEntry.js',
                <GarageComponent />,
              )}
            />
            <Route
              path="/marketplace/*"
              element={renderFederatedModule(
                'Marketplace (@ridersclub/marketplace)',
                'http://localhost:5006/remoteEntry.js',
                <MarketplaceComponent />,
              )}
            />
            <Route
              path="/profile/*"
              element={
                <AuthAndProfileView
                  apiBaseUrl={apiBaseUrl}
                  currentUser={authenticatedUser}
                  accessToken={accessToken}
                  onSessionEstablished={handleSessionEstablished}
                  onUserUpdated={setAuthenticatedUser}
                  onSignOut={() => void handleSignOut()}
                />
              }
            />
            <Route
              path="/auth/*"
              element={
                <AuthAndProfileView
                  apiBaseUrl={apiBaseUrl}
                  currentUser={authenticatedUser}
                  accessToken={accessToken}
                  onSessionEstablished={handleSessionEstablished}
                  onUserUpdated={setAuthenticatedUser}
                  onSignOut={() => void handleSignOut()}
                />
              }
            />
            <Route
              path="/admin/*"
              element={
                <AdminModerationView
                  apiBaseUrl={apiBaseUrl}
                  currentUser={authenticatedUser}
                  accessToken={accessToken}
                />
              }
            />
            <Route path="*" element={<NotFoundRouteView />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Priority Navigation Bar (Max 5 items to prevent clutter) */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 shadow-lg md:hidden"
      >
        <NavLink
          to="/communities"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium ${
              isActive || location.pathname === '/' || location.pathname.startsWith('/blogs')
                ? 'text-primary-600'
                : 'text-slate-600'
            }`
          }
        >
          <Compass className="h-5 w-5" aria-hidden="true" />
          <span>Explore</span>
        </NavLink>

        <NavLink
          to="/rides"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium ${
              isActive ? 'text-primary-600' : 'text-slate-600'
            }`
          }
        >
          <Car className="h-5 w-5" aria-hidden="true" />
          <span>Rides</span>
        </NavLink>

        <NavLink
          to="/help"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-semibold ${
              isActive
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`
          }
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <span>Help</span>
        </NavLink>

        <NavLink
          to="/garage"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium ${
              isActive ? 'text-primary-600' : 'text-slate-600'
            }`
          }
        >
          <Shield className="h-5 w-5" aria-hidden="true" />
          <span>Garage</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setIsMobileMoreOpen((v) => !v)}
          aria-expanded={isMobileMoreOpen}
          aria-label="More navigation destinations"
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-slate-600"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Secondary Navigation Sheet */}
      {isMobileMoreOpen && (
        <div
          role="dialog"
          aria-label="Secondary Navigation Menu"
          className="fixed inset-0 z-40 flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs md:hidden"
        >
          <div className="rounded-t-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-900">More RidersClub Modules</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMoreOpen(false)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[
                { to: '/blogs', label: 'Rider Blogs', icon: BookOpen },
                { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
                { to: '/mechanics', label: 'Mechanics', icon: Wrench },
                { to: '/profile', label: 'Profile & Auth', icon: User },
                { to: '/admin', label: 'Admin & Safety', icon: ShieldAlert },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMoreOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-800 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Icon className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global Slide-Over 1:1 Direct Messaging Drawer */}
      {isChatDrawerOpen && (
        <div
          role="dialog"
          aria-label="Individual Direct Chat Drawer"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-primary-900 px-5 py-4 text-white">
              <div>
                <h2 className="text-base font-bold">1:1 Private Messaging</h2>
                <p className="text-xs text-primary-200">
                  Shared across all RidersClub micro-frontends
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatDrawerOpen(false)}
                aria-label="Close Direct Messages Drawer"
                className="text-white hover:bg-primary-800 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            {/* Conversation Switcher */}
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              {conversations.map((thread) => (
                <button
                  key={thread.pairKey}
                  type="button"
                  onClick={() => {
                    setActivePairKey(thread.pairKey);
                    setConversations((prev) =>
                      prev.map((c) =>
                        c.pairKey === thread.pairKey ? { ...c, unreadCount: 0 } : c,
                      ),
                    );
                    if (accessToken && thread.conversationId && thread.unreadCount > 0) {
                      void fetch(`${apiBaseUrl}/conversations/${thread.conversationId}/read`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${accessToken}` },
                      }).catch(() => {});
                    }
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    thread.pairKey === activePairKey
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{thread.peer.displayName}</span>
                  {thread.unreadCount > 0 ? (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                      {thread.unreadCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Active Thread Messages */}
            {activeConversation ? (
              <>
                <div className="border-b border-slate-100 bg-primary-50/60 px-5 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Chatting with {activeConversation.peer.displayName} (@
                      {activeConversation.peer.username})
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Pair Key: {activeConversation.pairKey}
                    </Badge>
                  </div>
                  {activeConversation.contextLabel && (
                    <p className="mt-0.5 text-[11px] text-primary-700">
                      Initiated from {activeConversation.contextLabel}
                    </p>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {activeConversation.messages.length === 0 ? (
                    <EmptyState
                      title={`Start chatting with ${activeConversation.peer.displayName}`}
                      description="Conversations are deduplicated between any two riders across Blogs, Communities, Rides, Help, Mechanics, and Marketplace."
                    />
                  ) : (
                    activeConversation.messages.map((msg) => {
                      const isMe = msg.senderId === activeSelfId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                              isMe
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            {msg.body}
                          </div>
                          <span className="mt-1 text-[10px] text-slate-400">
                            {msg.sentAtLabel}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-slate-200 p-4"
                >
                  <input
                    type="text"
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder={`Message ${activeConversation.peer.displayName}...`}
                    aria-label={`Message ${activeConversation.peer.displayName}`}
                    className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                  <Button type="submit" size="icon" aria-label="Send message">
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* User Profile Inspector Modal with Block/Unblock & Direct Chat */}
      {inspectedUser && (
        <div
          role="dialog"
          aria-label={`Profile details for ${inspectedUser.displayName}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{inspectedUser.displayName}</CardTitle>
                <CardDescription>@{inspectedUser.username}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInspectedUser(null)}
                aria-label="Close profile dialog"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <UserProfileCard user={inspectedUser} contextLabel="Profile Modal" />

              {inspectedUser.publicPhoneNumber && (
                <p className="text-xs text-slate-600">
                  <strong>Public Phone:</strong> {inspectedUser.publicPhoneNumber}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  {blockedUserIds.has(inspectedUser.id)
                    ? 'You have blocked this user (messaging disabled)'
                    : 'Safety & privacy controls'}
                </span>
                <Button
                  size="sm"
                  variant={blockedUserIds.has(inspectedUser.id) ? 'outline' : 'destructive'}
                  onClick={() => void handleToggleBlockUser(inspectedUser)}
                >
                  <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                  {blockedUserIds.has(inspectedUser.id) ? 'Unblock User' : 'Block User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function NotFoundRouteView(): React.JSX.Element {
  return (
    <EmptyState
      title="Route Not Found"
      description="The requested RidersClub URL does not match any active micro-frontend route."
      action={
        <Link
          to="/communities"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Return to Explore
        </Link>
      }
    />
  );
}

export default ShellApp;
