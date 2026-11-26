import * as React from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Edit3,
  Heart,
  Info,
  LogOut,
  MessageCircle,
  MoreVertical,
  Plus,
  Send,
  Share2,
  Trash2,
  X,
  Search,
} from 'lucide-react';
import {
  CommunityMemberRole,
  CommunityMembershipStatus,
  CommunityVisibility,
  UserRole,
  type AuthenticatedUserAccount,
  type NewsCommentItem,
  type NewsArticleItem,
  type CommunityChatMessageItem,
  type CommunityDetailResponse,
  type CommunityItem,
  type CommunityMemberItem,
  type PaginatedResponse,
} from '@ridersclub/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  MessageUserButton,
  UserProfileCard,
  openUserProfileModal,
} from '@ridersclub/ui';

export interface CommunityRemoteAppProps {
  initialSection?: 'communities' | 'news';
}

const API_BASE_URL = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL) || 'http://localhost:4000/api/v1';
const AUTH_USER_STORAGE_KEY = 'ridersclub_auth_user';
const DEFAULT_NEWS_HEADER_IMAGE =
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80';

const INITIAL_COMMUNITIES: CommunityItem[] = [
  {
    id: 'comm-1',
    slug: 'western-ghats-adv-tourers',
    name: 'Western Ghats ADV Tourers',
    description:
      'Weekend trail rides, monsoon preparedness checklists, and technical terrain mentorship across Karnataka, Goa, and Maharashtra.',
    memberCount: 1420,
    visibility: CommunityVisibility.PUBLIC,
    viewerMembershipStatus: null,
    viewerRole: null,
    createdAt: new Date().toISOString(),
    founder: {
      id: 'user-founder-1',
      displayName: 'Vikramaditya Rao',
      username: 'vikram_adv',
      avatarUrl: null,
      bio: 'Lead ride marshal • Tiger 900 Rally Pro',
      city: 'Bengaluru',
      role: UserRole.MODERATOR,
      canReceiveDirectMessage: true,
    },
  },
  {
    id: 'comm-2',
    slug: 'classic-modern-retro-mechanics-guild',
    name: 'Classic & Modern Retro Mechanics Guild',
    description:
      'Carburetor tuning, electrical wiring schematics, and restoration logs for twins, singles, and modern classic cars.',
    memberCount: 865,
    visibility: CommunityVisibility.PUBLIC,
    viewerMembershipStatus: null,
    viewerRole: null,
    createdAt: new Date().toISOString(),
    founder: {
      id: 'user-founder-2',
      displayName: 'Meera Krishnan',
      username: 'meera_torques',
      avatarUrl: null,
      bio: 'Automotive engineer & track-day coach',
      city: 'Chennai',
      role: UserRole.ADMIN,
      canReceiveDirectMessage: true,
    },
  },
  {
    id: 'comm-3',
    slug: 'deccan-gt-track-canyon-club',
    name: 'Deccan GT Track & Canyon Club',
    description:
      'Invite-only group for verified sportbike and performance sedan owners organizing track sessions and telemetry reviews.',
    memberCount: 210,
    visibility: CommunityVisibility.PRIVATE,
    viewerMembershipStatus: null,
    viewerRole: null,
    createdAt: new Date().toISOString(),
    founder: {
      id: 'user-founder-3',
      displayName: 'Rohan Deshmukh',
      username: 'rohan_apex',
      avatarUrl: null,
      bio: 'Track day organizer • privacy set to non-DM',
      city: 'Pune',
      role: UserRole.USER,
      canReceiveDirectMessage: false,
    },
  },
];

const INITIAL_NEWS: NewsArticleItem[] = [
  {
    id: 'news-1',
    slug: 'high-altitude-braking-clutch-care-spiti',
    title: 'High-Altitude Braking & Clutch Care Before a Spiti Circuit',
    excerpt:
      'How DOT 4 boiling points, braided steel lines, and clutch free-play adjustments prevent fade on steep mountain descents.',
    content:
      'Long mountain descents from Kunzum La and Rohtang put extreme thermal loads on your braking system. Old hygroscopic brake fluid absorbs moisture over monsoon months, dropping its wet boiling point dramatically.\n\n1. Flush and bleed with fresh DOT 4 or DOT 5.1 fluid before any high-altitude tour.\n2. Inspect sintered brake pad thickness—ensure at least 3.5mm of friction material remains.\n3. Verify 2–3mm of clutch lever free-play at the perch so slipping the clutch in rocky hairpins does not glaze your friction plates.',
    imageUrl:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
    readTimeMinutes: 6,
    likesCount: 24,
    commentsCount: 2,
    isLikedByViewer: false,
    tags: ['Brakes', 'Touring Prep', 'Safety'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: 'user-founder-2',
      displayName: 'Meera Krishnan',
      username: 'meera_torques',
      avatarUrl: null,
      bio: 'RidersClub Editorial Admin • Automotive engineer & track-day coach',
      city: 'Chennai',
      role: UserRole.ADMIN,
      canReceiveDirectMessage: true,
    },
    comments: [
      {
        id: 'comment-sample-1',
        newsId: 'news-1',
        body: 'Flushed with fresh DOT 5.1 right before our Zanskar run—zero lever sponge even after descending Singge La!',
        createdAt: new Date().toISOString(),
        author: {
          id: 'user-founder-1',
          displayName: 'Vikramaditya Rao',
          username: 'vikram_adv',
          avatarUrl: null,
          bio: 'Lead ride marshal • Tiger 900 Rally Pro',
          city: 'Bengaluru',
          role: UserRole.MODERATOR,
          canReceiveDirectMessage: true,
        },
      },
    ],
  },
  {
    id: 'news-2',
    slug: 'pre-purchase-inspection-used-dual-sport-motorcycles',
    title: 'Pre-Purchase Inspection Checklist for Used Dual-Sport Motorcycles',
    excerpt:
      'Inspecting steering head bearings, swingarm play, cold-start compression, and service records before negotiating on the Marketplace.',
    content:
      'Buying a pre-owned adventure or dual-sport motorcycle requires checking components that endure off-road impacts.\n\n1. Ask the seller for a true cold start and listen for cam-chain tensioner rattle.\n2. Lift the front wheel off the ground and check steering stem bearings for center-detent notchiness.\n3. Inspect the lower frame cradle, bash-plate mounts, and wheel rims for flat spots or hairline cracks.\n4. Cross-reference every odometer milestone against workshop invoices.',
    imageUrl:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
    readTimeMinutes: 8,
    likesCount: 39,
    commentsCount: 1,
    isLikedByViewer: false,
    tags: ['Marketplace', 'Inspection', 'Used Bikes'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: 'user-founder-2',
      displayName: 'Meera Krishnan',
      username: 'meera_torques',
      avatarUrl: null,
      bio: 'RidersClub Editorial Admin • Automotive engineer & track-day coach',
      city: 'Chennai',
      role: UserRole.ADMIN,
      canReceiveDirectMessage: true,
    },
    comments: [],
  },
];

function getCommunityInviteLink(community: CommunityItem): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'http://localhost:5000';
  return `${origin}/communities?invite=${encodeURIComponent(community.slug)}`;
}

function getStoredUser(): AuthenticatedUserAccount | null {
  try {
    const raw = window.localStorage.getItem('ridersclub:auth_user') ?? window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedUserAccount) : null;
  } catch {
    return null;
  }
}

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

export function CommunityRemoteApp({
  initialSection = 'communities',
}: CommunityRemoteAppProps): React.JSX.Element {
  const activeSection: 'communities' | 'news' =
    initialSection === 'news' ? 'news' : 'communities';
  const [searchQuery, setSearchQuery] = React.useState('');
  const [communities, setCommunities] = React.useState<CommunityItem[]>(INITIAL_COMMUNITIES);
  const [newsArticles, setNewsArticles] = React.useState<NewsArticleItem[]>(INITIAL_NEWS);
  const [statusBanner, setStatusBanner] = React.useState<string | null>(null);
  const [showHeaderInfo, setShowHeaderInfo] = React.useState(false);

  // Create Community Modal State
  const [showCreateCommunity, setShowCreateCommunity] = React.useState(false);
  const [newCommunityName, setNewCommunityName] = React.useState('');
  const [newCommunityVisibility, setNewCommunityVisibility] = React.useState<CommunityVisibility>(
    CommunityVisibility.PUBLIC,
  );
  const [newCommunityDescription, setNewCommunityDescription] = React.useState('');
  const [createCommunityError, setCreateCommunityError] = React.useState<string | null>(null);

  // Active Community Chat & Roster Drawer/Panel State
  const [activeCommunity, setActiveCommunity] = React.useState<CommunityItem | null>(null);
  const [showCommunityMembers, setShowCommunityMembers] = React.useState(false);
  const [showGroupOptionsMenu, setShowGroupOptionsMenu] = React.useState(false);

  React.useEffect(() => {
    if (!showCommunityMembers) setShowGroupOptionsMenu(false);
  }, [showCommunityMembers]);

  React.useEffect(() => {
    if (!showGroupOptionsMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGroupOptionsMenu(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGroupOptionsMenu]);
  const [communityMembers, setCommunityMembers] = React.useState<CommunityMemberItem[]>([]);
  const [pendingMembers, setPendingMembers] = React.useState<CommunityMemberItem[]>([]);
  const [communityMessages, setCommunityMessages] = React.useState<CommunityChatMessageItem[]>([]);
  const [lastMessageByCommunity, setLastMessageByCommunity] = React.useState<Record<string, string>>(
    () => {
      const defaults = Object.fromEntries(
        INITIAL_COMMUNITIES.map((c) => [
          c.id,
          `${c.founder.displayName}: Welcome to ${c.name}! Coordinate rides, share technical advice, or click any member to start a 1:1 private chat.`,
        ]),
      );
      try {
        const stored = window.localStorage.getItem('ridersclub:community_last_messages');
        if (stored) {
          return { ...defaults, ...(JSON.parse(stored) as Record<string, string>) };
        }
      } catch {
        // Ignore storage read error
      }
      return defaults;
    },
  );
  const [chatAccessError, setChatAccessError] = React.useState<string | null>(null);
  const [chatMessageDraft, setChatMessageDraft] = React.useState('');
  const communityMessagesContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (activeCommunity && !showCommunityMembers) {
      const container = communityMessagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [activeCommunity, showCommunityMembers, communityMessages.length]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        'ridersclub:community_last_messages',
        JSON.stringify(lastMessageByCommunity),
      );
    } catch {
      // Ignore storage write error
    }
  }, [lastMessageByCommunity]);

  // Create / Edit News Modal State (Admin Only)
  const [showNewsComposer, setShowNewsComposer] = React.useState(false);
  const [editingNewsId, setEditingNewsId] = React.useState<string | null>(null);
  const [newsTitle, setNewsTitle] = React.useState('');
  const [newsExcerpt, setNewsExcerpt] = React.useState('');
  const [newsContent, setNewsContent] = React.useState('');
  const [newsImageUrl, setNewsImageUrl] = React.useState('');
  const [newsTagsInput, setNewsTagsInput] = React.useState('Touring Prep, Maintenance');

  // Active Full News Page State
  const [selectedArticle, setSelectedArticle] = React.useState<NewsArticleItem | null>(null);
  const [commentDraft, setCommentDraft] = React.useState('');

  React.useEffect(() => {
    setSearchQuery('');
    setShowHeaderInfo(false);
    setSelectedArticle(null);
    setShowNewsComposer(false);
  }, [initialSection]);

  const loadLiveCommunitiesAndNews = React.useCallback(async () => {
    const token = getStoredToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const [commRes, newsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/communities`, { headers, credentials: 'include' }),
        fetch(`${API_BASE_URL}/news?page=1&limit=20`, { headers, credentials: 'include' }),
      ]);

      if (commRes.ok) {
        const commData = (await commRes.json()) as CommunityItem[];
        if (Array.isArray(commData) && commData.length > 0) {
          setCommunities(commData);
          setLastMessageByCommunity((prev) => {
            const next = { ...prev };
            for (const c of commData) {
              if (c.lastMessage) {
                next[c.id] = `${c.lastMessage.sender.displayName}: ${c.lastMessage.body}`;
              }
            }
            return next;
          });
        }
      }

      if (newsRes.ok) {
        const newsData = (await newsRes.json()) as PaginatedResponse<NewsArticleItem>;
        if (newsData?.items && newsData.items.length > 0) {
          setNewsArticles(newsData.items);
        }
      }
    } catch {
      // Keep initial preview items when running standalone or in unit tests
    }
  }, []);

  React.useEffect(() => {
    void loadLiveCommunitiesAndNews();
  }, [loadLiveCommunitiesAndNews]);

  const activeCommunityIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    activeCommunityIdRef.current = activeCommunity?.id ?? null;
  }, [activeCommunity]);

  const pendingInviteSlugRef = React.useRef<string | null>(
    (() => {
      if (typeof window === 'undefined') return null;
      try {
        return new URLSearchParams(window.location.search).get('invite')?.trim() || null;
      } catch {
        return null;
      }
    })(),
  );

  // Sync browser URL with the currently opened community (and clear stale ?invite= on list view)
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.history?.replaceState) return;
    if (activeSection !== 'communities') return;

    if (activeCommunity) {
      pendingInviteSlugRef.current = null;
      const nextUrl = `${window.location.pathname}?invite=${encodeURIComponent(activeCommunity.slug)}`;
      if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
        window.history.replaceState(null, '', nextUrl);
      }
    } else if (!pendingInviteSlugRef.current && window.location.search.includes('invite=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [activeCommunity, activeSection]);

  React.useEffect(() => {
    return () => {
      if (
        typeof window !== 'undefined' &&
        window.history?.replaceState &&
        window.location.search.includes('invite=')
      ) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
  }, []);

  // Real-time community chat updates via Server-Sent Events (SSE) and cross-tab BroadcastChannel
  React.useEffect(() => {
    const applyIncomingMessage = (communityId: string, msg: CommunityChatMessageItem) => {
      setLastMessageByCommunity((prev) => ({
        ...prev,
        [communityId]: `${msg.sender.displayName}: ${msg.body}`,
      }));

      setCommunityMessages((prev) => {
        if (activeCommunityIdRef.current !== communityId) {
          return prev;
        }
        if (prev.some((existing) => existing.id === msg.id)) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    let eventSource: EventSource | null = null;
    if (typeof window.EventSource !== 'undefined') {
      try {
        const token = getStoredToken();
        const streamUrl = token
          ? `${API_BASE_URL}/communities/stream?token=${encodeURIComponent(token)}`
          : `${API_BASE_URL}/communities/stream`;
        eventSource = new window.EventSource(streamUrl);
        const handleCommunitySseMessage = (evt: MessageEvent) => {
          try {
            const payload = JSON.parse(evt.data as string) as {
              type?: string;
              communityId?: string;
              message?: CommunityChatMessageItem;
            };
            if (
              payload.type === 'community_message.created' &&
              payload.communityId &&
              payload.message
            ) {
              applyIncomingMessage(payload.communityId, payload.message);
            }
          } catch {
            // Ignore malformed SSE payload
          }
        };
        eventSource.onmessage = handleCommunitySseMessage;
        eventSource.addEventListener(
          'community_message.created',
          handleCommunitySseMessage as EventListener,
        );
      } catch {
        // Ignore EventSource connection failure in test/offline mode
      }
    }

    let channel: BroadcastChannel | null = null;
    if (typeof window.BroadcastChannel !== 'undefined') {
      try {
        channel = new window.BroadcastChannel('ridersclub_community_chat');
        channel.onmessage = (evt) => {
          const data = evt.data as {
            communityId?: string;
            message?: CommunityChatMessageItem;
          } | null;
          if (data?.communityId && data.message) {
            applyIncomingMessage(data.communityId, data.message);
          }
        };
      } catch {
        // Ignore BroadcastChannel error
      }
    }

    return () => {
      eventSource?.close();
      channel?.close();
    };
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const myCommunities = communities.filter(
    (c) =>
      c.viewerMembershipStatus === CommunityMembershipStatus.APPROVED ||
      c.viewerMembershipStatus === CommunityMembershipStatus.PENDING,
  );

  const filteredCommunities = communities.filter(
    (c) =>
      !normalizedSearch ||
      c.name.toLowerCase().includes(normalizedSearch) ||
      c.description.toLowerCase().includes(normalizedSearch),
  );

  const displayedCommunities = normalizedSearch ? filteredCommunities : myCommunities;

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCommunityName.trim();
    const trimmedDesc = newCommunityDescription.trim();
    if (!trimmedName || !trimmedDesc) return;

    const token = getStoredToken();
    const currentUser = getStoredUser();
    const activeFounderId = currentUser?.id ?? 'local-rider';
    const normalizedTargetName = trimmedName.toLowerCase();

    const isDuplicate =
      newCommunityVisibility === CommunityVisibility.PUBLIC
        ? communities.some(
            (c) =>
              c.visibility === CommunityVisibility.PUBLIC &&
              c.name.trim().toLowerCase() === normalizedTargetName,
          )
        : communities.some(
            (c) =>
              c.visibility === CommunityVisibility.PRIVATE &&
              c.founder.id === activeFounderId &&
              c.name.trim().toLowerCase() === normalizedTargetName,
          );

    if (isDuplicate) {
      setCreateCommunityError('Community already present, cannot create duplicate.');
      return;
    }

    setCreateCommunityError(null);

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/communities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            name: trimmedName,
            visibility: newCommunityVisibility,
            description: trimmedDesc,
          }),
        });

        if (res.ok) {
          const created = (await res.json()) as CommunityItem;
          const normalizedCreated: CommunityItem = {
            ...created,
            viewerMembershipStatus:
              created.viewerMembershipStatus ?? CommunityMembershipStatus.APPROVED,
            viewerRole: created.viewerRole ?? CommunityMemberRole.FOUNDER,
          };
          setCommunities((prev) => [normalizedCreated, ...prev]);
          setShowCreateCommunity(false);
          setNewCommunityName('');
          setNewCommunityDescription('');
          setCreateCommunityError(null);
          setSearchQuery('');
          setStatusBanner(`Created community "${created.name}" and assigned you as Founder.`);
          return;
        }

        const errPayload = (await res.json().catch(() => null)) as {
          message?: string | string[];
        } | null;
        const errMsg = Array.isArray(errPayload?.message)
          ? errPayload.message.join(', ')
          : errPayload?.message || 'Community already present, cannot create duplicate.';
        setCreateCommunityError(errMsg);
        return;
      } catch {
        // Fallback to local state update below when offline
      }
    }

    const fallbackCommunity: CommunityItem = {
      id: `comm-local-${Date.now()}`,
      slug: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: trimmedName,
      description: trimmedDesc,
      visibility: newCommunityVisibility,
      memberCount: 1,
      viewerMembershipStatus: CommunityMembershipStatus.APPROVED,
      viewerRole: CommunityMemberRole.FOUNDER,
      createdAt: new Date().toISOString(),
      founder: {
        id: activeFounderId,
        displayName: currentUser?.profile.displayName ?? 'You (Rider Founder)',
        username: currentUser?.profile.username ?? 'rider_founder',
        avatarUrl: currentUser?.profile.avatarUrl ?? null,
        bio: currentUser?.profile.bio ?? 'Community Founder',
        city: currentUser?.profile.city ?? 'Bengaluru',
        role: currentUser?.role ?? UserRole.USER,
        canReceiveDirectMessage: true,
      },
    };

    setCommunities((prev) => [fallbackCommunity, ...prev]);
    setShowCreateCommunity(false);
    setNewCommunityName('');
    setNewCommunityDescription('');
    setCreateCommunityError(null);
    setSearchQuery('');
    setStatusBanner(`Created community "${fallbackCommunity.name}".`);
  };

  const handleJoinCommunity = async (community: CommunityItem) => {
    const token = getStoredToken();
    const expectedStatus =
      community.visibility === CommunityVisibility.PUBLIC
        ? CommunityMembershipStatus.APPROVED
        : CommunityMembershipStatus.PENDING;

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/communities/${community.id}/join`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            status: CommunityMembershipStatus;
            role: CommunityMemberRole;
          };
          setCommunities((prev) =>
            prev.map((c) =>
              c.id === community.id
                ? {
                    ...c,
                    viewerMembershipStatus: data.status,
                    viewerRole: data.role,
                    memberCount:
                      data.status === CommunityMembershipStatus.APPROVED
                        ? c.memberCount + 1
                        : c.memberCount,
                  }
                : c,
            ),
          );
          setActiveCommunity((prev) =>
            prev && prev.id === community.id
              ? {
                  ...prev,
                  viewerMembershipStatus: data.status,
                  viewerRole: data.role,
                  memberCount:
                    data.status === CommunityMembershipStatus.APPROVED
                      ? prev.memberCount + 1
                      : prev.memberCount,
                }
              : prev,
          );
          setStatusBanner(
            data.status === CommunityMembershipStatus.APPROVED
              ? `Joined ${community.name}! You now have access to Community Chat.`
              : `Membership request sent to ${community.name} moderators.`,
          );
          return;
        }
      } catch {
        // Fallback to local state update
      }
    }

    setCommunities((prev) =>
      prev.map((c) =>
        c.id === community.id
          ? {
              ...c,
              viewerMembershipStatus: expectedStatus,
              viewerRole: CommunityMemberRole.MEMBER,
              memberCount:
                expectedStatus === CommunityMembershipStatus.APPROVED
                  ? c.memberCount + 1
                  : c.memberCount,
            }
          : c,
      ),
    );
    setActiveCommunity((prev) =>
      prev && prev.id === community.id
        ? {
            ...prev,
            viewerMembershipStatus: expectedStatus,
            viewerRole: CommunityMemberRole.MEMBER,
            memberCount:
              expectedStatus === CommunityMembershipStatus.APPROVED
                ? prev.memberCount + 1
                : prev.memberCount,
          }
        : prev,
    );
    setStatusBanner(
      expectedStatus === CommunityMembershipStatus.APPROVED
        ? `Joined ${community.name}! You can now post in Community Chat.`
        : `Membership request submitted for private community "${community.name}".`,
    );
  };

  const handleLeaveCommunity = async (community: CommunityItem) => {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/communities/${community.id}/leave`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore network error in fallback mode
      }
    }

    setCommunities((prev) =>
      prev.map((c) =>
        c.id === community.id
          ? {
              ...c,
              viewerMembershipStatus: null,
              viewerRole: null,
              memberCount:
                c.viewerMembershipStatus === CommunityMembershipStatus.APPROVED
                  ? Math.max(1, c.memberCount - 1)
                  : c.memberCount,
            }
          : c,
      ),
    );
    setActiveCommunity((prev) => (prev?.id === community.id ? null : prev));
    setShowCommunityMembers(false);
    setStatusBanner(`Left ${community.name}.`);
  };

  /**
   * Delete permissions:
   * - Platform ADMIN: can delete any community (public or private).
   * - Private community owner (founder): can delete their own private community.
   * - Everyone else (incl. public community founders): cannot delete.
   */
  const canDeleteCommunity = (community: CommunityItem): boolean => {
    const user = getStoredUser();
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    return (
      community.visibility === CommunityVisibility.PRIVATE &&
      community.founder.id === user.id
    );
  };

  const handleDeleteCommunity = async (community: CommunityItem) => {
    if (!canDeleteCommunity(community)) return;

    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function' &&
      !window.confirm(
        `Delete "${community.name}"? This permanently removes the community, its members and all chat messages.`,
      )
    ) {
      return;
    }

    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/communities/${community.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok && res.status !== 404) {
          const data = (await res.json().catch(() => null)) as {
            message?: string | string[];
          } | null;
          const message = Array.isArray(data?.message)
            ? data?.message.join(', ')
            : data?.message;
          setStatusBanner(message || `Unable to delete ${community.name}.`);
          return;
        }
      } catch {
        // Ignore network error in fallback mode
      }
    }

    setCommunities((prev) => prev.filter((c) => c.id !== community.id));
    setActiveCommunity((prev) => (prev?.id === community.id ? null : prev));
    setShowCommunityMembers(false);
    setStatusBanner(`Deleted community ${community.name}.`);
  };

  const handleOpenCommunityHub = async (community: CommunityItem) => {
    pendingInviteSlugRef.current = null;
    setActiveCommunity(community);
    setShowCommunityMembers(false);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?invite=${encodeURIComponent(community.slug)}`,
      );
    }
    setChatAccessError(null);
    setCommunityMembers([
      {
        id: `mem-${community.founder.id}`,
        communityId: community.id,
        userId: community.founder.id,
        role: CommunityMemberRole.FOUNDER,
        status: CommunityMembershipStatus.APPROVED,
        joinedAt: community.createdAt,
        user: community.founder,
      },
    ]);
    setPendingMembers([]);

    const getLockedChatMessage = (c: CommunityItem) =>
      c.visibility === CommunityVisibility.PRIVATE
        ? 'This community is private. Only approved members can view or send messages in Community Chat.'
        : 'Only members can view or send messages in Community Chat. Join this community to access the chat.';

    if (community.viewerMembershipStatus !== CommunityMembershipStatus.APPROVED) {
      setCommunityMessages([]);
      setChatAccessError(getLockedChatMessage(community));
    } else {
      setCommunityMessages([
        {
          id: `msg-welcome-${community.id}`,
          communityId: community.id,
          body: `Welcome to ${community.name}! Coordinate rides, share technical advice, or click any member to start a 1:1 private chat.`,
          createdAt: community.createdAt,
          sender: community.founder,
        },
      ]);
    }

    const token = getStoredToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const [detailsRes, messagesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/communities/${community.id}`, { headers, credentials: 'include' }),
        fetch(`${API_BASE_URL}/communities/${community.id}/messages`, {
          headers,
          credentials: 'include',
        }),
      ]);

      let resolvedCommunity = community;
      if (detailsRes.ok) {
        const details = (await detailsRes.json()) as CommunityDetailResponse;
        resolvedCommunity = details.community;
        setActiveCommunity(details.community);
        setCommunityMembers(details.members);
        setPendingMembers(details.pendingMembers);
      }

      if (resolvedCommunity.viewerMembershipStatus !== CommunityMembershipStatus.APPROVED) {
        setCommunityMessages([]);
        setChatAccessError(getLockedChatMessage(resolvedCommunity));
      } else if (messagesRes.ok) {
        const msgs = (await messagesRes.json()) as CommunityChatMessageItem[];
        setCommunityMessages(msgs);
        const latest = msgs[msgs.length - 1];
        if (latest) {
          setLastMessageByCommunity((prev) => ({
            ...prev,
            [community.id]: `${latest.sender.displayName}: ${latest.body}`,
          }));
        }
        setChatAccessError(null);
      } else if (messagesRes.status === 403) {
        setCommunityMessages([]);
        setChatAccessError(getLockedChatMessage(resolvedCommunity));
      }
    } catch {
      // Keep local preview state
    }
  };

  React.useEffect(() => {
    const slug = pendingInviteSlugRef.current?.toLowerCase();
    if (!slug || activeSection !== 'communities') return;
    const matched = communities.find(
      (c) => c.slug.toLowerCase() === slug || c.id.toLowerCase() === slug,
    );
    if (matched) {
      pendingInviteSlugRef.current = null;
      void handleOpenCommunityHub(matched);
    }
  }, [communities, activeSection]);

  const handleSendCommunityMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommunity) return;
    const trimmed = chatMessageDraft.trim();
    if (!trimmed) return;

    const token = getStoredToken();
    const currentUser = getStoredUser();

    if (token) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/communities/${activeCommunity.id}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ body: trimmed }),
          },
        );
        if (res.ok) {
          const msg = (await res.json()) as CommunityChatMessageItem;
          setCommunityMessages((prev) =>
            prev.some((existing) => existing.id === msg.id) ? prev : [...prev, msg],
          );
          setLastMessageByCommunity((prev) => ({
            ...prev,
            [activeCommunity.id]: `${msg.sender.displayName}: ${msg.body}`,
          }));
          try {
            if (typeof window.BroadcastChannel !== 'undefined') {
              const ch = new window.BroadcastChannel('ridersclub_community_chat');
              ch.postMessage({ communityId: activeCommunity.id, message: msg });
              ch.close();
            }
          } catch {
            // Ignore broadcast error
          }
          setChatMessageDraft('');
          return;
        }
      } catch {
        // Fallback to local message append
      }
    }

    const fallbackMsg: CommunityChatMessageItem = {
      id: `cm-local-${Date.now()}`,
      communityId: activeCommunity.id,
      body: trimmed,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser?.id ?? 'local-rider',
        displayName: currentUser?.profile.displayName ?? 'You (Rider)',
        username: currentUser?.profile.username ?? 'rider_you',
        avatarUrl: currentUser?.profile.avatarUrl ?? null,
        bio: currentUser?.profile.bio ?? null,
        city: currentUser?.profile.city ?? 'Bengaluru',
        role: currentUser?.role ?? UserRole.USER,
        canReceiveDirectMessage: true,
      },
    };
    setCommunityMessages((prev) => [...prev, fallbackMsg]);
    setLastMessageByCommunity((prev) => ({
      ...prev,
      [activeCommunity.id]: `${fallbackMsg.sender.displayName}: ${fallbackMsg.body}`,
    }));
    try {
      if (typeof window.BroadcastChannel !== 'undefined') {
        const ch = new window.BroadcastChannel('ridersclub_community_chat');
        ch.postMessage({ communityId: activeCommunity.id, message: fallbackMsg });
        ch.close();
      }
    } catch {
      // Ignore broadcast error
    }
    setChatMessageDraft('');
  };

  const handleApprovePendingMember = async (member: CommunityMemberItem) => {
    if (!activeCommunity) return;
    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/communities/${activeCommunity.id}/members/${member.userId}/approve`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const approved = (await res.json()) as CommunityMemberItem;
          setPendingMembers((prev) => prev.filter((m) => m.userId !== member.userId));
          setCommunityMembers((prev) => [...prev, approved]);
          return;
        }
      } catch {
        // Fallback below
      }
    }

    setPendingMembers((prev) => prev.filter((m) => m.userId !== member.userId));
    setCommunityMembers((prev) => [
      ...prev,
      { ...member, status: CommunityMembershipStatus.APPROVED },
    ]);
  };

  const handleShareInviteLink = async (community: CommunityItem) => {
    const inviteLink = getCommunityInviteLink(community);
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: `Join ${community.name} on RidersClub`,
          text: `You're invited to join the "${community.name}" riding group on RidersClub!`,
          url: inviteLink,
        });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      // Fallback to copying link
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      }
    } catch {
      // Ignore clipboard permission errors
    }
    setStatusBanner(`Copied group invite link for "${community.name}".`);
  };

  const openNewNewsComposer = () => {
    const user = getStoredUser();
    if (user?.role !== UserRole.ADMIN) return;
    setEditingNewsId(null);
    setNewsTitle('');
    setNewsExcerpt('');
    setNewsContent('');
    setNewsImageUrl('');
    setNewsTagsInput('Touring Prep, Maintenance');
    setShowNewsComposer(true);
  };

  const openEditNewsComposer = (article: NewsArticleItem) => {
    const user = getStoredUser();
    if (user?.role !== UserRole.ADMIN) return;
    setEditingNewsId(article.id);
    setNewsTitle(article.title);
    setNewsExcerpt(article.excerpt);
    setNewsContent(article.content);
    setNewsImageUrl(article.imageUrl ?? '');
    setNewsTagsInput(article.tags.join(', '));
    setSelectedArticle(null);
    setShowNewsComposer(true);
  };

  const handleNewsImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewsImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = getStoredUser();
    if (currentUser?.role !== UserRole.ADMIN) return;

    const trimmedTitle = newsTitle.trim();
    const trimmedExcerpt = newsExcerpt.trim();
    const trimmedContent = newsContent.trim();
    const trimmedImageUrl = newsImageUrl.trim() || DEFAULT_NEWS_HEADER_IMAGE;
    if (!trimmedTitle || !trimmedExcerpt || !trimmedContent) return;

    const parsedTags = newsTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const token = getStoredToken();

    if (token) {
      try {
        const url = editingNewsId
          ? `${API_BASE_URL}/news/${editingNewsId}`
          : `${API_BASE_URL}/news`;
        const method = editingNewsId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: trimmedTitle,
            excerpt: trimmedExcerpt,
            content: trimmedContent,
            imageUrl: trimmedImageUrl,
            tags: parsedTags,
          }),
        });

        if (res.ok) {
          const saved = (await res.json()) as NewsArticleItem;
          const normalizedSaved: NewsArticleItem = {
            ...saved,
            imageUrl: saved.imageUrl || trimmedImageUrl,
          };
          setNewsArticles((prev) =>
            editingNewsId
              ? prev.map((b) => (b.id === editingNewsId ? normalizedSaved : b))
              : [normalizedSaved, ...prev],
          );
          setShowNewsComposer(false);
          setStatusBanner(
            editingNewsId
              ? `Updated news "${normalizedSaved.title}".`
              : `Published new news "${normalizedSaved.title}".`,
          );
          return;
        }
      } catch {
        // Fallback to local state below
      }
    }

    const readTimeMinutes = Math.max(
      1,
      Math.ceil(trimmedContent.split(/\s+/).length / 180),
    );

    if (editingNewsId) {
      setNewsArticles((prev) =>
        prev.map((b) =>
          b.id === editingNewsId
            ? {
                ...b,
                title: trimmedTitle,
                excerpt: trimmedExcerpt,
                content: trimmedContent,
                imageUrl: trimmedImageUrl,
                tags: parsedTags,
                readTimeMinutes,
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      );
      setStatusBanner(`Updated news "${trimmedTitle}".`);
    } else {
      const createdArticle: NewsArticleItem = {
        id: `news-local-${Date.now()}`,
        slug: trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: trimmedTitle,
        excerpt: trimmedExcerpt,
        content: trimmedContent,
        imageUrl: trimmedImageUrl,
        tags: parsedTags.length > 0 ? parsedTags : ['Rider News'],
        readTimeMinutes,
        likesCount: 0,
        commentsCount: 0,
        isLikedByViewer: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: currentUser.id,
          displayName: currentUser.profile.displayName,
          username: currentUser.profile.username,
          avatarUrl: currentUser.profile.avatarUrl ?? null,
          bio: currentUser.profile.bio ?? 'RidersClub Admin',
          city: currentUser.profile.city ?? 'Bengaluru',
          role: UserRole.ADMIN,
          canReceiveDirectMessage: true,
        },
        comments: [],
      };
      setNewsArticles((prev) => [createdArticle, ...prev]);
      setStatusBanner(`Published new news "${createdArticle.title}".`);
    }

    setShowNewsComposer(false);
  };

  const handleDeleteNews = async (article: NewsArticleItem) => {
    const currentUser = getStoredUser();
    if (currentUser?.role !== UserRole.ADMIN) return;

    const token = getStoredToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/news/${article.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore network error in fallback mode
      }
    }

    setNewsArticles((prev) => prev.filter((b) => b.id !== article.id));
    if (selectedArticle?.id === article.id) {
      setSelectedArticle(null);
    }
    setStatusBanner(`Deleted news "${article.title}".`);
  };

  const handleOpenNewsReader = async (article: NewsArticleItem) => {
    setSelectedArticle(article);
    const token = getStoredToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const res = await fetch(`${API_BASE_URL}/news/${article.id}`, { headers });
      if (res.ok) {
        const full = (await res.json()) as NewsArticleItem;
        setSelectedArticle(full);
      }
    } catch {
      // Keep local news article object
    }
  };

  const handleToggleNewsReaction = async (article: NewsArticleItem) => {
    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/news/${article.id}/reactions/toggle`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            newsId: string;
            liked: boolean;
            likesCount: number;
          };
          const updateFn = (item: NewsArticleItem): NewsArticleItem =>
            item.id === article.id
              ? {
                  ...item,
                  isLikedByViewer: data.liked,
                  likesCount: data.likesCount,
                }
              : item;

          setNewsArticles((prev) => prev.map(updateFn));
          setSelectedArticle((prev) => (prev ? updateFn(prev) : null));
          return;
        }
      } catch {
        // Fallback below
      }
    }

    const nextLiked = !article.isLikedByViewer;
    const nextCount = nextLiked ? article.likesCount + 1 : Math.max(0, article.likesCount - 1);
    const updateFn = (item: NewsArticleItem): NewsArticleItem =>
      item.id === article.id
        ? { ...item, isLikedByViewer: nextLiked, likesCount: nextCount }
        : item;

    setNewsArticles((prev) => prev.map(updateFn));
    setSelectedArticle((prev) => (prev ? updateFn(prev) : null));
  };

  const handleAddNewsComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle) return;
    const trimmed = commentDraft.trim();
    if (!trimmed) return;

    const token = getStoredToken();
    const currentUser = getStoredUser();

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/news/${selectedArticle.id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: trimmed }),
        });

        if (res.ok) {
          const created = (await res.json()) as NewsCommentItem;
          setSelectedArticle((prev) =>
            prev
              ? {
                  ...prev,
                  commentsCount: prev.commentsCount + 1,
                  comments: [...(prev.comments ?? []), created],
                }
              : null,
          );
          setNewsArticles((prev) =>
            prev.map((b) =>
              b.id === selectedArticle.id
                ? { ...b, commentsCount: b.commentsCount + 1 }
                : b,
            ),
          );
          setCommentDraft('');
          return;
        }
      } catch {
        // Fallback below
      }
    }

    const fallbackComment: NewsCommentItem = {
      id: `comment-local-${Date.now()}`,
      newsId: selectedArticle.id,
      body: trimmed,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser?.id ?? 'local-rider',
        displayName: currentUser?.profile.displayName ?? 'You (Rider)',
        username: currentUser?.profile.username ?? 'rider_you',
        avatarUrl: currentUser?.profile.avatarUrl ?? null,
        bio: currentUser?.profile.bio ?? null,
        city: currentUser?.profile.city ?? 'Bengaluru',
        role: currentUser?.role ?? UserRole.USER,
        canReceiveDirectMessage: true,
      },
    };

    setSelectedArticle((prev) =>
      prev
        ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [...(prev.comments ?? []), fallbackComment],
          }
        : null,
    );
    setNewsArticles((prev) =>
      prev.map((b) =>
        b.id === selectedArticle.id
          ? { ...b, commentsCount: b.commentsCount + 1 }
          : b,
      ),
    );
    setCommentDraft('');
  };

  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <section
      aria-label={
        activeSection === 'communities'
          ? 'Riding Communities Federated Module'
          : 'News Federated Module'
      }
      className="flex flex-1 flex-col space-y-6"
    >
      {/* Header Banner (hidden when a full-screen community chat or full news page is open) */}
      {!(activeSection === 'communities' && activeCommunity) &&
        !(activeSection === 'news' && selectedArticle) && (
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
                  className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-primary-200 bg-primary-50 p-3.5 text-xs leading-relaxed text-primary-950 shadow-lg sm:w-80"
                >
                  <p>
                    {activeSection === 'communities'
                      ? 'Connect with regional riding chapters, join real-time community discussions, and click any member profile to initiate a 1:1 private conversation in the Shell.'
                      : 'Official News curated and published exclusively by RidersClub Administrators. Click on any news card to open the full news story in a dedicated page.'}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {activeSection === 'communities' ? 'Riding Communities' : 'News'}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {activeSection === 'communities' ? (
                <Button
                  variant="secondary"
                  className="bg-white text-primary-900 hover:bg-primary-50"
                  onClick={() => {
                    setCreateCommunityError(null);
                    setShowCreateCommunity(true);
                  }}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New Community
                </Button>
              ) : isAdmin ? (
                <Button
                  variant="secondary"
                  className="bg-white text-primary-900 hover:bg-primary-50"
                  onClick={openNewNewsComposer}
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  Publish News
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}

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

      {/* Create Community Form Panel */}
      {showCreateCommunity ? (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Create a Riding Community</CardTitle>
              <CardDescription>
                Public communities allow instant join and chat access. Private communities require
                founder or moderator approval before members can view community chat.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Close community form"
              onClick={() => {
                setShowCreateCommunity(false);
                setCreateCommunityError(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleCreateCommunity(e)} className="space-y-4">
              {createCommunityError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800"
                >
                  {createCommunityError}
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="comm-name-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Community Name
                  </label>
                  <input
                    id="comm-name-input"
                    type="text"
                    required
                    value={newCommunityName}
                    onChange={(e) => {
                      setNewCommunityName(e.target.value);
                      if (createCommunityError) setCreateCommunityError(null);
                    }}
                    placeholder="e.g., Nilgiris Weekend Tourers"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="comm-visibility-select"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Access & Privacy
                  </label>
                  <select
                    id="comm-visibility-select"
                    value={newCommunityVisibility}
                    onChange={(e) => {
                      setNewCommunityVisibility(e.target.value as CommunityVisibility);
                      if (createCommunityError) setCreateCommunityError(null);
                    }}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value={CommunityVisibility.PUBLIC}>
                      Public (Instant Join & Chat)
                    </option>
                    <option value={CommunityVisibility.PRIVATE}>
                      Private (Approval Required)
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="comm-desc-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Description & Riding Charter
                </label>
                <textarea
                  id="comm-desc-input"
                  rows={3}
                  required
                  value={newCommunityDescription}
                  onChange={(e) => setNewCommunityDescription(e.target.value)}
                  placeholder="Describe your riding routes, safety expectations, and vehicle focus..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateCommunity(false);
                    setCreateCommunityError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Community</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Create / Edit News Composer Panel (Admin Only) */}
      {showNewsComposer && isAdmin ? (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>
                {editingNewsId ? 'Edit News Article' : 'Publish Official Rider News'}
              </CardTitle>
              <CardDescription>
                Upload or link a header image, write a concise description for the news card, and
                provide the full news story. Only administrators can publish news.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Close news composer"
              onClick={() => setShowNewsComposer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSaveNews(e)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="news-title-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    News Headline / Title
                  </label>
                  <input
                    id="news-title-input"
                    type="text"
                    required
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="e.g., Monsoon Chain & Sprocket Care for Coastal Rides"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="news-tags-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    id="news-tags-input"
                    type="text"
                    value={newsTagsInput}
                    onChange={(e) => setNewsTagsInput(e.target.value)}
                    placeholder="Maintenance, Monsoon, Safety"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="news-image-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Header Image URL
                  </label>
                  <input
                    id="news-image-input"
                    type="text"
                    value={newsImageUrl}
                    onChange={(e) => setNewsImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="news-image-file-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Or Upload Header Image
                  </label>
                  <input
                    id="news-image-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleNewsImageFileUpload}
                    className="mt-1 block h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="news-excerpt-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Short Description
                </label>
                <input
                  id="news-excerpt-input"
                  type="text"
                  required
                  value={newsExcerpt}
                  onChange={(e) => setNewsExcerpt(e.target.value)}
                  placeholder="A 1-2 sentence description shown below the header image on the news card..."
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="news-content-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Full News Content
                </label>
                <textarea
                  id="news-content-input"
                  rows={5}
                  required
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="Write the full news article content..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewsComposer(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNewsId ? 'Save News Changes' : 'Publish News'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Dedicated Section Content */}
      {activeSection === 'communities' ? (
        activeCommunity ? (
          /* Full-Screen Community Chat & Members View (matching 1:1 Direct Chat style) */
          <div
            role="dialog"
            aria-label={`${activeCommunity.name} Community View`}
            className="!mt-0 fixed inset-0 z-40 flex flex-col bg-background"
          >
            {/* Top Header Bar */}
            <div className="border-b border-slate-200 bg-primary-900 py-3 pl-2 pr-4 text-white shadow-sm sm:px-6 sm:py-3.5">
              <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 sm:gap-3">
                <div className="flex min-w-0 items-center gap-1 sm:gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={
                      showCommunityMembers ? 'Back to community chat' : 'Back to communities list'
                    }
                    onClick={() => {
                      if (showCommunityMembers) {
                        setShowCommunityMembers(false);
                      } else {
                        setShowCommunityMembers(false);
                        setActiveCommunity(null);
                      }
                    }}
                    className="h-8 w-7 shrink-0 px-0 text-white hover:bg-primary-800 hover:text-white sm:h-9 sm:w-9"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </Button>

                  {showCommunityMembers ? (
                    <div className="flex min-w-0 items-center gap-2 px-1 py-1 sm:gap-2.5 sm:px-2">
                      <Avatar
                        alt={activeCommunity.name}
                        fallbackText={activeCommunity.name}
                        src={null}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white sm:text-base">
                          {activeCommunity.name}
                        </p>
                        <p className="truncate text-[11px] text-primary-200">
                          {activeCommunity.memberCount.toLocaleString()} members
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`View members of ${activeCommunity.name}`}
                      onClick={() => setShowCommunityMembers(true)}
                      className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-primary-800 sm:gap-2.5 sm:px-2"
                    >
                      <Avatar
                        alt={activeCommunity.name}
                        fallbackText={activeCommunity.name}
                        src={null}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-bold text-white sm:text-base">
                            {activeCommunity.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-primary-300/40 bg-primary-800 text-[10px] text-primary-100"
                          >
                            {activeCommunity.visibility === CommunityVisibility.PUBLIC
                              ? 'Public'
                              : 'Private'}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-primary-200">
                          {activeCommunity.memberCount.toLocaleString()} members • Tap for group info
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {showCommunityMembers ? (
                  <div className="relative shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Group options"
                      aria-haspopup="menu"
                      aria-expanded={showGroupOptionsMenu}
                      onClick={() => setShowGroupOptionsMenu((prev) => !prev)}
                      className="text-white hover:bg-primary-800 hover:text-white"
                    >
                      <MoreVertical className="h-5 w-5" aria-hidden="true" />
                    </Button>
                    {showGroupOptionsMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          aria-hidden="true"
                          onClick={() => setShowGroupOptionsMenu(false)}
                        />
                        <div
                          role="menu"
                          aria-label="Group options"
                          className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm text-slate-800 shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setShowGroupOptionsMenu(false);
                              void handleShareInviteLink(activeCommunity);
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                          >
                            <Share2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            Share
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setShowGroupOptionsMenu(false);
                              void handleLeaveCommunity(activeCommunity);
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                          >
                            <LogOut className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            Leave
                          </button>
                          {canDeleteCommunity(activeCommunity) ? (
                            <button
                              type="button"
                              role="menuitem"
                              aria-label={`Delete community ${activeCommunity.name}`}
                              onClick={() => {
                                setShowGroupOptionsMenu(false);
                                void handleDeleteCommunity(activeCommunity);
                              }}
                              className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-left text-rose-700 hover:bg-rose-50 focus-visible:bg-rose-50 focus-visible:outline-none"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {showCommunityMembers ? (
              /* Full-Screen Community Members Body */
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
                  {pendingMembers.length > 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Pending Join Requests ({pendingMembers.length})
                      </h4>
                      <div className="mt-2 space-y-2">
                        {pendingMembers.map((pending) => (
                          <div
                            key={pending.id}
                            className="flex items-center justify-between rounded-xl bg-white p-3 text-xs shadow-sm"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">
                                {pending.user.displayName}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => void handleApprovePendingMember(pending)}
                            >
                              Approve
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                      Approved Members ({communityMembers.length})
                    </h3>
                    <div className="space-y-2">
                      {communityMembers.map((member) => (
                        <UserProfileCard
                          key={member.id}
                          user={member.user}
                          contextLabel={`Community Member: ${activeCommunity.name}`}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Full-Screen Community Chat Body (matching 1:1 Direct Chat conversation view) */
              <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden bg-white shadow-sm sm:my-4 sm:rounded-2xl sm:border sm:border-slate-200">
                {chatAccessError ? (
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-semibold">
                        {activeCommunity.visibility === CommunityVisibility.PRIVATE
                          ? 'Private Community Chat Locked'
                          : 'Community Chat Locked'}
                      </p>
                      <p className="mt-1 text-xs">{chatAccessError}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      ref={communityMessagesContainerRef}
                      className="bg-road-chat flex-1 space-y-3 overflow-y-auto p-4 sm:p-6"
                    >
                      {communityMessages.length === 0 ? (
                        <div className="flex justify-center py-8">
                          <p className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-center text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                            No messages yet. Start the conversation below!
                          </p>
                        </div>
                      ) : (
                        communityMessages.map((msg) => {
                          const isMe = Boolean(currentUser && msg.sender.id === currentUser.id);
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                  isMe
                                    ? 'bg-primary-600 text-white'
                                    : 'border border-slate-200/80 bg-white/95 text-slate-900'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => openUserProfileModal(msg.sender)}
                                  aria-label={`View profile of ${msg.sender.displayName}`}
                                  className={`mb-1 block rounded text-left text-xs font-bold tracking-wide hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                                    isMe
                                      ? 'text-amber-200 hover:text-amber-100'
                                      : 'text-primary-700 hover:text-primary-900'
                                  }`}
                                >
                                  {msg.sender.displayName}
                                </button>
                                <p className={isMe ? 'text-white' : 'text-slate-700'}>
                                  {msg.body}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form
                      onSubmit={(e) => void handleSendCommunityMessage(e)}
                      className="flex items-center gap-2.5 border-t border-slate-200 p-4 sm:px-6"
                    >
                      <input
                        type="text"
                        value={chatMessageDraft}
                        onChange={(e) => setChatMessageDraft(e.target.value)}
                        placeholder={`Message ${activeCommunity.name}...`}
                        aria-label="Community chat message"
                        className="h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      />
                      <Button type="submit" size="icon" aria-label="Send">
                        <Send className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* WhatsApp-style Communities Group List View */
          <Card className="flex flex-1 flex-col overflow-hidden border border-slate-200 shadow-sm">
            {/* Top Search Bar inside the Group List */}
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search communities to join or open..."
                  aria-label="Search communities"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>
                  {normalizedSearch
                    ? `Search Results (${filteredCommunities.length})`
                    : `My Communities (${myCommunities.length})`}
                </span>
                {normalizedSearch ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-primary-700 hover:underline"
                  >
                    Clear search
                  </button>
                ) : null}
              </div>
            </div>

            {/* Group List Body */}
            {normalizedSearch ? (
              filteredCommunities.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Search className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    No communities found. Click on the add button above to create communities.
                  </p>
                  <p className="mt-1 max-w-md text-xs text-slate-500">
                    You can create a public or private riding community using the New Community button above.
                  </p>
                </div>
              ) : (
                <ul
                  role="list"
                  aria-label="Community search results"
                  className="flex-1 space-y-2.5 bg-slate-50/60 py-2.5"
                >
                  {filteredCommunities.map((community) => {
                    const isApproved =
                      community.viewerMembershipStatus === CommunityMembershipStatus.APPROVED;
                    const isPending =
                      community.viewerMembershipStatus === CommunityMembershipStatus.PENDING;
                    const lastMessage =
                      lastMessageByCommunity[community.id] ??
                      `${community.founder.displayName}: Welcome to ${community.name}!`;

                    return (
                      <li
                        key={community.id}
                        onClick={() => void handleOpenCommunityHub(community)}
                        className="flex cursor-pointer items-center justify-between gap-3 border-y border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-primary-200 hover:bg-slate-50 sm:px-5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3.5">
                          <Avatar
                            alt={community.name}
                            fallbackText={community.name}
                            src={null}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-bold text-slate-900">
                              {community.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {isPending
                                ? 'Join request sent • Waiting for moderator approval'
                                : lastMessage}
                            </p>
                          </div>
                        </div>

                        {!isApproved ? (
                          <div
                            className="flex shrink-0 items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isPending ? (
                              <Button size="sm" variant="secondary" disabled>
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                Requested
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => void handleJoinCommunity(community)}
                              >
                                {community.visibility === CommunityVisibility.PUBLIC
                                  ? 'Join Community'
                                  : 'Request to Join'}
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )
            ) : myCommunities.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <MessageCircle className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-base font-semibold text-slate-900">
                  You are not in any groups
                </h2>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                  Search for riding communities in the search bar above to join a public group or request to join a private group, or click the add button above to create a new community.
                </p>
              </div>
            ) : (
              <ul
                role="list"
                aria-label="My communities group list"
                className="flex-1 space-y-2.5 bg-slate-50/60 py-2.5"
              >
                {displayedCommunities.map((community) => {
                  const isPending =
                    community.viewerMembershipStatus === CommunityMembershipStatus.PENDING;
                  const lastMessage =
                    lastMessageByCommunity[community.id] ??
                    `${community.founder.displayName}: Welcome to ${community.name}!`;

                  return (
                    <li
                      key={community.id}
                      onClick={() => void handleOpenCommunityHub(community)}
                      className="flex cursor-pointer items-center gap-3.5 border-y border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-primary-200 hover:bg-slate-50 sm:px-5"
                    >
                      <Avatar
                        alt={community.name}
                        fallbackText={community.name}
                        src={null}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-slate-900">
                          {community.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {isPending
                            ? 'Join request sent • Waiting for moderator approval'
                            : lastMessage}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )
      ) : selectedArticle ? (
        /* Dedicated Full News Page View (opened when clicking any news card) */
        <article
          data-testid="full-news-page"
          aria-label={`Full news article: ${selectedArticle.title}`}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedArticle(null)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back to News
            </Button>

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditNewsComposer(selectedArticle)}
                >
                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit News
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleDeleteNews(selectedArticle)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                  Delete News
                </Button>
              </div>
            ) : null}
          </div>

          <Card className="overflow-hidden border border-slate-200 shadow-lg">
            {/* Full News Header Image */}
            <div className="relative h-64 w-full overflow-hidden bg-slate-900 sm:h-96">
              <img
                src={selectedArticle.imageUrl || DEFAULT_NEWS_HEADER_IMAGE}
                alt={selectedArticle.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2 sm:bottom-6 sm:left-6 sm:right-6">
                <Badge className="bg-primary-600 text-white">Official News</Badge>
                <Badge variant="secondary" className="bg-white/90 text-slate-900">
                  {selectedArticle.readTimeMinutes} min read
                </Badge>
                {selectedArticle.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-white/40 bg-slate-900/60 text-white"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <CardHeader className="border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {selectedArticle.title}
              </CardTitle>
              <CardDescription className="mt-2 text-base font-medium leading-relaxed text-slate-600">
                {selectedArticle.excerpt}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div className="whitespace-pre-line text-sm leading-relaxed text-slate-800 sm:text-base">
                {selectedArticle.content}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-4">
                <div className="w-full sm:w-auto sm:min-w-[320px]">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Published By Admin
                  </p>
                  <UserProfileCard
                    user={selectedArticle.author}
                    contextLabel={`News: ${selectedArticle.title}`}
                    compact
                  />
                </div>

                <Button
                  variant={selectedArticle.isLikedByViewer ? 'default' : 'outline'}
                  onClick={() => void handleToggleNewsReaction(selectedArticle)}
                >
                  <Heart
                    className={`h-4 w-4 ${selectedArticle.isLikedByViewer ? 'fill-current' : ''}`}
                    aria-hidden="true"
                  />
                  {selectedArticle.isLikedByViewer ? 'Liked' : 'Like Article'} (
                  {selectedArticle.likesCount})
                </Button>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Rider Discussion ({selectedArticle.comments?.length ?? selectedArticle.commentsCount})
                </h3>

                <div className="space-y-3">
                  {(selectedArticle.comments ?? []).map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar
                            alt={comment.author.displayName}
                            fallbackText={comment.author.displayName}
                            src={comment.author.avatarUrl}
                            size="sm"
                          />
                          <span className="text-xs font-semibold text-slate-900">
                            {comment.author.displayName}
                          </span>
                        </div>
                        <MessageUserButton
                          user={comment.author}
                          contextLabel={`Comment on: ${selectedArticle.title}`}
                          size="sm"
                          variant="ghost"
                        />
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{comment.body}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={(e) => void handleAddNewsComment(e)} className="flex gap-2">
                  <input
                    type="text"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Add a technical note or comment on this news article..."
                    aria-label="Add news comment"
                    className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                  <Button type="submit" size="sm" className="h-10 px-4">
                    Post Comment
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </article>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {newsArticles.map((article) => (
              <Card
                key={article.id}
                role="article"
                tabIndex={0}
                aria-label={article.title}
                onClick={() => void handleOpenNewsReader(article)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void handleOpenNewsReader(article);
                  }
                }}
                className="group flex cursor-pointer flex-col justify-between overflow-hidden border border-slate-200 transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                {/* News Card Image Header */}
                <div>
                  <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                    <img
                      src={article.imageUrl || DEFAULT_NEWS_HEADER_IMAGE}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-white/90 text-xs font-semibold text-slate-900"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <Badge
                        variant="outline"
                        className="border-white/40 bg-slate-900/70 text-white"
                      >
                        {article.readTimeMinutes} min read
                      </Badge>
                    </div>
                  </div>

                  {/* News Headline & Description */}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl transition-colors group-hover:text-primary-700">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardFooter className="justify-between border-t border-slate-100 bg-slate-50/50 py-3">
                  <span className="text-xs font-medium text-slate-500">
                    By {article.author.displayName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 group-hover:underline">
                    Read Full News →
                  </span>
                </CardFooter>
              </Card>
            ))}
        </div>
      )}
    </section>
  );
}

export default CommunityRemoteApp;
