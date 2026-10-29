import * as React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  Globe,
  Heart,
  Lock,
  LogOut,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  Search,
} from 'lucide-react';
import {
  CommunityMemberRole,
  CommunityMembershipStatus,
  CommunityVisibility,
  UserRole,
  type AuthenticatedUserAccount,
  type BlogCommentItem,
  type BlogPostItem,
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
} from '@ridersclub/ui';

export interface CommunityRemoteAppProps {
  initialSection?: 'communities' | 'blogs';
}

const API_BASE_URL = 'http://localhost:4000/api/v1';
const AUTH_STORAGE_KEY = 'ridersclub_auth_token';
const AUTH_USER_STORAGE_KEY = 'ridersclub_auth_user';

const INITIAL_COMMUNITIES: CommunityItem[] = [
  {
    id: 'comm-1',
    slug: 'western-ghats-adv-tourers',
    name: 'Western Ghats ADV Tourers',
    description:
      'Weekend trail rides, monsoon preparedness checklists, and technical terrain mentorship across Karnataka, Goa, and Maharashtra.',
    memberCount: 1420,
    visibility: CommunityVisibility.PUBLIC,
    category: 'Adventure & Touring',
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
    category: 'Maintenance & Builds',
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
    category: 'Track & Performance',
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

const INITIAL_BLOGS: BlogPostItem[] = [
  {
    id: 'blog-1',
    slug: 'high-altitude-braking-clutch-care-spiti',
    title: 'High-Altitude Braking & Clutch Care Before a Spiti Circuit',
    excerpt:
      'How DOT 4 boiling points, braided steel lines, and clutch free-play adjustments prevent fade on steep mountain descents.',
    content:
      'Long mountain descents from Kunzum La and Rohtang put extreme thermal loads on your braking system. Old hygroscopic brake fluid absorbs moisture over monsoon months, dropping its wet boiling point dramatically.\n\n1. Flush and bleed with fresh DOT 4 or DOT 5.1 fluid before any high-altitude tour.\n2. Inspect sintered brake pad thickness—ensure at least 3.5mm of friction material remains.\n3. Verify 2–3mm of clutch lever free-play at the perch so slipping the clutch in rocky hairpins does not glaze your friction plates.',
    readTimeMinutes: 6,
    likesCount: 24,
    commentsCount: 2,
    isLikedByViewer: false,
    tags: ['Brakes', 'Touring Prep', 'Safety'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: 'user-author-1',
      displayName: 'Kabir Sen',
      username: 'kabir_wrench',
      avatarUrl: null,
      bio: '120,000 km across the Himalayas on 2 & 4 wheels',
      city: 'Chandigarh',
      role: UserRole.USER,
      canReceiveDirectMessage: true,
    },
    comments: [
      {
        id: 'comment-sample-1',
        blogId: 'blog-1',
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
    id: 'blog-2',
    slug: 'pre-purchase-inspection-used-dual-sport-motorcycles',
    title: 'Pre-Purchase Inspection Checklist for Used Dual-Sport Motorcycles',
    excerpt:
      'Inspecting steering head bearings, swingarm play, cold-start compression, and service records before negotiating on the Marketplace.',
    content:
      'Buying a pre-owned adventure or dual-sport motorcycle requires checking components that endure off-road impacts.\n\n1. Ask the seller for a true cold start and listen for cam-chain tensioner rattle.\n2. Lift the front wheel off the ground and check steering stem bearings for center-detent notchiness.\n3. Inspect the lower frame cradle, bash-plate mounts, and wheel rims for flat spots or hairline cracks.\n4. Cross-reference every odometer milestone against workshop invoices.',
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
      bio: 'Automotive engineer & track-day coach',
      city: 'Chennai',
      role: UserRole.ADMIN,
      canReceiveDirectMessage: true,
    },
    comments: [],
  },
];

function getStoredUser(): AuthenticatedUserAccount | null {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedUserAccount) : null;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function CommunityRemoteApp({
  initialSection = 'communities',
}: CommunityRemoteAppProps): React.JSX.Element {
  const [activeTab, setActiveTab] = React.useState<'communities' | 'blogs'>(initialSection);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [communities, setCommunities] = React.useState<CommunityItem[]>(INITIAL_COMMUNITIES);
  const [blogs, setBlogs] = React.useState<BlogPostItem[]>(INITIAL_BLOGS);
  const [statusBanner, setStatusBanner] = React.useState<string | null>(null);

  // Create Community Modal State
  const [showCreateCommunity, setShowCreateCommunity] = React.useState(false);
  const [newCommunityName, setNewCommunityName] = React.useState('');
  const [newCommunityCategory, setNewCommunityCategory] = React.useState('Adventure & Touring');
  const [newCommunityVisibility, setNewCommunityVisibility] = React.useState<CommunityVisibility>(
    CommunityVisibility.PUBLIC,
  );
  const [newCommunityDescription, setNewCommunityDescription] = React.useState('');

  // Active Community Chat & Roster Drawer/Panel State
  const [activeCommunity, setActiveCommunity] = React.useState<CommunityItem | null>(null);
  const [communityMembers, setCommunityMembers] = React.useState<CommunityMemberItem[]>([]);
  const [pendingMembers, setPendingMembers] = React.useState<CommunityMemberItem[]>([]);
  const [communityMessages, setCommunityMessages] = React.useState<CommunityChatMessageItem[]>([]);
  const [chatAccessError, setChatAccessError] = React.useState<string | null>(null);
  const [chatMessageDraft, setChatMessageDraft] = React.useState('');

  // Create / Edit Blog Modal State
  const [showBlogComposer, setShowBlogComposer] = React.useState(false);
  const [editingBlogId, setEditingBlogId] = React.useState<string | null>(null);
  const [blogTitle, setBlogTitle] = React.useState('');
  const [blogExcerpt, setBlogExcerpt] = React.useState('');
  const [blogContent, setBlogContent] = React.useState('');
  const [blogTagsInput, setBlogTagsInput] = React.useState('Touring Prep, Maintenance');

  // Active Blog Reader Modal State
  const [selectedBlog, setSelectedBlog] = React.useState<BlogPostItem | null>(null);
  const [commentDraft, setCommentDraft] = React.useState('');

  React.useEffect(() => {
    setActiveTab(initialSection);
  }, [initialSection]);

  const loadLiveCommunitiesAndBlogs = React.useCallback(async () => {
    const token = getStoredToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const [commRes, blogsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/communities`, { headers }),
        fetch(`${API_BASE_URL}/blogs?page=1&limit=20`, { headers }),
      ]);

      if (commRes.ok) {
        const commData = (await commRes.json()) as CommunityItem[];
        if (Array.isArray(commData) && commData.length > 0) {
          setCommunities(commData);
        }
      }

      if (blogsRes.ok) {
        const blogsData = (await blogsRes.json()) as PaginatedResponse<BlogPostItem>;
        if (blogsData?.items && blogsData.items.length > 0) {
          setBlogs(blogsData.items);
        }
      }
    } catch {
      // Keep initial preview items when running standalone or in unit tests
    }
  }, []);

  React.useEffect(() => {
    void loadLiveCommunitiesAndBlogs();
  }, [loadLiveCommunitiesAndBlogs]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredCommunities = communities.filter(
    (c) =>
      !normalizedSearch ||
      c.name.toLowerCase().includes(normalizedSearch) ||
      c.category.toLowerCase().includes(normalizedSearch) ||
      c.description.toLowerCase().includes(normalizedSearch),
  );

  const filteredBlogs = blogs.filter(
    (b) =>
      !normalizedSearch ||
      b.title.toLowerCase().includes(normalizedSearch) ||
      b.excerpt.toLowerCase().includes(normalizedSearch) ||
      b.tags.some((t) => t.toLowerCase().includes(normalizedSearch)),
  );

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCommunityName.trim();
    const trimmedDesc = newCommunityDescription.trim();
    if (!trimmedName || !trimmedDesc) return;

    const token = getStoredToken();
    const currentUser = getStoredUser();

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/communities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedName,
            category: newCommunityCategory.trim() || 'General Riding',
            visibility: newCommunityVisibility,
            description: trimmedDesc,
          }),
        });

        if (res.ok) {
          const created = (await res.json()) as CommunityItem;
          setCommunities((prev) => [created, ...prev]);
          setShowCreateCommunity(false);
          setNewCommunityName('');
          setNewCommunityDescription('');
          setStatusBanner(`Created community "${created.name}" and assigned you as Founder.`);
          return;
        }
      } catch {
        // Fallback to local state update below
      }
    }

    const fallbackCommunity: CommunityItem = {
      id: `comm-local-${Date.now()}`,
      slug: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: trimmedName,
      description: trimmedDesc,
      category: newCommunityCategory.trim() || 'General Riding',
      visibility: newCommunityVisibility,
      memberCount: 1,
      viewerMembershipStatus: CommunityMembershipStatus.APPROVED,
      viewerRole: CommunityMemberRole.FOUNDER,
      createdAt: new Date().toISOString(),
      founder: {
        id: currentUser?.id ?? 'local-rider',
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
    setStatusBanner(`Left ${community.name}.`);
  };

  const handleOpenCommunityHub = async (community: CommunityItem) => {
    setActiveCommunity(community);
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

    if (
      community.visibility === CommunityVisibility.PRIVATE &&
      community.viewerMembershipStatus !== CommunityMembershipStatus.APPROVED
    ) {
      setCommunityMessages([]);
      setChatAccessError(
        'This community is private. Only approved members can view or send messages in Community Chat.',
      );
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
        fetch(`${API_BASE_URL}/communities/${community.id}`, { headers }),
        fetch(`${API_BASE_URL}/communities/${community.id}/messages`, { headers }),
      ]);

      if (detailsRes.ok) {
        const details = (await detailsRes.json()) as CommunityDetailResponse;
        setActiveCommunity(details.community);
        setCommunityMembers(details.members);
        setPendingMembers(details.pendingMembers);
      }

      if (messagesRes.ok) {
        const msgs = (await messagesRes.json()) as CommunityChatMessageItem[];
        setCommunityMessages(msgs);
        setChatAccessError(null);
      } else if (messagesRes.status === 403) {
        setCommunityMessages([]);
        setChatAccessError(
          'This community is private. Only approved members can view or send messages in Community Chat.',
        );
      }
    } catch {
      // Keep local preview state
    }
  };

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
          setCommunityMessages((prev) => [...prev, msg]);
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

  const openNewBlogComposer = () => {
    setEditingBlogId(null);
    setBlogTitle('');
    setBlogExcerpt('');
    setBlogContent('');
    setBlogTagsInput('Touring Prep, Maintenance');
    setShowBlogComposer(true);
    setActiveTab('blogs');
  };

  const openEditBlogComposer = (blog: BlogPostItem) => {
    setEditingBlogId(blog.id);
    setBlogTitle(blog.title);
    setBlogExcerpt(blog.excerpt);
    setBlogContent(blog.content);
    setBlogTagsInput(blog.tags.join(', '));
    setSelectedBlog(null);
    setShowBlogComposer(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = blogTitle.trim();
    const trimmedExcerpt = blogExcerpt.trim();
    const trimmedContent = blogContent.trim();
    if (!trimmedTitle || !trimmedExcerpt || !trimmedContent) return;

    const parsedTags = blogTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const token = getStoredToken();
    const currentUser = getStoredUser();

    if (token) {
      try {
        const url = editingBlogId
          ? `${API_BASE_URL}/blogs/${editingBlogId}`
          : `${API_BASE_URL}/blogs`;
        const method = editingBlogId ? 'PATCH' : 'POST';

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
            tags: parsedTags,
          }),
        });

        if (res.ok) {
          const saved = (await res.json()) as BlogPostItem;
          setBlogs((prev) =>
            editingBlogId
              ? prev.map((b) => (b.id === editingBlogId ? saved : b))
              : [saved, ...prev],
          );
          setShowBlogComposer(false);
          setStatusBanner(
            editingBlogId
              ? `Updated blog post "${saved.title}".`
              : `Published new rider blog "${saved.title}".`,
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

    if (editingBlogId) {
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === editingBlogId
            ? {
                ...b,
                title: trimmedTitle,
                excerpt: trimmedExcerpt,
                content: trimmedContent,
                tags: parsedTags,
                readTimeMinutes,
                updatedAt: new Date().toISOString(),
              }
            : b,
        ),
      );
      setStatusBanner(`Updated blog post "${trimmedTitle}".`);
    } else {
      const createdBlog: BlogPostItem = {
        id: `blog-local-${Date.now()}`,
        slug: trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: trimmedTitle,
        excerpt: trimmedExcerpt,
        content: trimmedContent,
        tags: parsedTags.length > 0 ? parsedTags : ['Riding Log'],
        readTimeMinutes,
        likesCount: 0,
        commentsCount: 0,
        isLikedByViewer: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: currentUser?.id ?? 'local-rider',
          displayName: currentUser?.profile.displayName ?? 'You (Rider Author)',
          username: currentUser?.profile.username ?? 'rider_author',
          avatarUrl: currentUser?.profile.avatarUrl ?? null,
          bio: currentUser?.profile.bio ?? 'Community contributor',
          city: currentUser?.profile.city ?? 'Bengaluru',
          role: currentUser?.role ?? UserRole.USER,
          canReceiveDirectMessage: true,
        },
        comments: [],
      };
      setBlogs((prev) => [createdBlog, ...prev]);
      setStatusBanner(`Published new rider blog "${createdBlog.title}".`);
    }

    setShowBlogComposer(false);
  };

  const handleDeleteBlog = async (blog: BlogPostItem) => {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/blogs/${blog.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore network error in fallback mode
      }
    }

    setBlogs((prev) => prev.filter((b) => b.id !== blog.id));
    if (selectedBlog?.id === blog.id) {
      setSelectedBlog(null);
    }
    setStatusBanner(`Deleted blog post "${blog.title}".`);
  };

  const handleOpenBlogReader = async (blog: BlogPostItem) => {
    setSelectedBlog(blog);
    const token = getStoredToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const res = await fetch(`${API_BASE_URL}/blogs/${blog.id}`, { headers });
      if (res.ok) {
        const full = (await res.json()) as BlogPostItem;
        setSelectedBlog(full);
      }
    } catch {
      // Keep local blog object
    }
  };

  const handleToggleBlogReaction = async (blog: BlogPostItem) => {
    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/blogs/${blog.id}/reactions/toggle`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            blogId: string;
            liked: boolean;
            likesCount: number;
          };
          const updateFn = (item: BlogPostItem): BlogPostItem =>
            item.id === blog.id
              ? {
                  ...item,
                  isLikedByViewer: data.liked,
                  likesCount: data.likesCount,
                }
              : item;

          setBlogs((prev) => prev.map(updateFn));
          setSelectedBlog((prev) => (prev ? updateFn(prev) : null));
          return;
        }
      } catch {
        // Fallback below
      }
    }

    const nextLiked = !blog.isLikedByViewer;
    const nextCount = nextLiked ? blog.likesCount + 1 : Math.max(0, blog.likesCount - 1);
    const updateFn = (item: BlogPostItem): BlogPostItem =>
      item.id === blog.id
        ? { ...item, isLikedByViewer: nextLiked, likesCount: nextCount }
        : item;

    setBlogs((prev) => prev.map(updateFn));
    setSelectedBlog((prev) => (prev ? updateFn(prev) : null));
  };

  const handleAddBlogComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlog) return;
    const trimmed = commentDraft.trim();
    if (!trimmed) return;

    const token = getStoredToken();
    const currentUser = getStoredUser();

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/blogs/${selectedBlog.id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: trimmed }),
        });

        if (res.ok) {
          const created = (await res.json()) as BlogCommentItem;
          setSelectedBlog((prev) =>
            prev
              ? {
                  ...prev,
                  commentsCount: prev.commentsCount + 1,
                  comments: [...(prev.comments ?? []), created],
                }
              : null,
          );
          setBlogs((prev) =>
            prev.map((b) =>
              b.id === selectedBlog.id
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

    const fallbackComment: BlogCommentItem = {
      id: `comment-local-${Date.now()}`,
      blogId: selectedBlog.id,
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

    setSelectedBlog((prev) =>
      prev
        ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [...(prev.comments ?? []), fallbackComment],
          }
        : null,
    );
    setBlogs((prev) =>
      prev.map((b) =>
        b.id === selectedBlog.id
          ? { ...b, commentsCount: b.commentsCount + 1 }
          : b,
      ),
    );
    setCommentDraft('');
  };

  const currentUser = getStoredUser();

  return (
    <section aria-label="Community and Blogs Federated Module" className="space-y-6">
      {/* Federated Remote Banner & Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-5 text-white shadow-md sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary-200" aria-hidden="true" />
            <span>Federated Remote • @ridersclub/community (:5001)</span>
          </div>
          <Badge variant="secondary" className="border-none bg-emerald-100 text-emerald-950">
            Phase 6 Live Communities, Chat & Blogs
          </Badge>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Communities & Rider Blogs
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-primary-100 sm:text-base">
              Connect with regional riding chapters, join real-time community discussions, and read
              long-form maintenance and travel logs. Click any profile below to initiate a 1:1
              private conversation in the Shell.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="secondary"
              className="bg-white text-primary-900 hover:bg-primary-50"
              onClick={() => {
                setActiveTab('communities');
                setShowCreateCommunity(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Community
            </Button>
            <Button
              variant="outline"
              className="border-white/30 bg-primary-800/50 text-white hover:bg-primary-700 hover:text-white"
              onClick={openNewBlogComposer}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Write Blog
            </Button>
          </div>
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

      {/* Create Community Form Panel */}
      {showCreateCommunity ? (
        <Card className="border-primary-200 bg-primary-50/40">
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
              onClick={() => setShowCreateCommunity(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleCreateCommunity(e)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                    onChange={(e) => setNewCommunityName(e.target.value)}
                    placeholder="e.g., Nilgiris Weekend Tourers"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="comm-category-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Category
                  </label>
                  <input
                    id="comm-category-input"
                    type="text"
                    required
                    value={newCommunityCategory}
                    onChange={(e) => setNewCommunityCategory(e.target.value)}
                    placeholder="Adventure & Touring"
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
                    onChange={(e) =>
                      setNewCommunityVisibility(e.target.value as CommunityVisibility)
                    }
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
                  onClick={() => setShowCreateCommunity(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Community</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Create / Edit Blog Composer Panel */}
      {showBlogComposer ? (
        <Card className="border-primary-200 bg-primary-50/40">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>
                {editingBlogId ? 'Edit Rider Blog Post' : 'Publish a Rider Blog Post'}
              </CardTitle>
              <CardDescription>
                Share maintenance guides, long-distance route reports, or pre-purchase inspection
                tips with the RidersClub community.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Close blog composer"
              onClick={() => setShowBlogComposer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSaveBlog(e)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="blog-title-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Article Title
                  </label>
                  <input
                    id="blog-title-input"
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="e.g., Monsoon Chain & Sprocket Care for Coastal Rides"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="blog-tags-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    id="blog-tags-input"
                    type="text"
                    value={blogTagsInput}
                    onChange={(e) => setBlogTagsInput(e.target.value)}
                    placeholder="Maintenance, Monsoon, Safety"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="blog-excerpt-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Short Summary / Excerpt
                </label>
                <input
                  id="blog-excerpt-input"
                  type="text"
                  required
                  value={blogExcerpt}
                  onChange={(e) => setBlogExcerpt(e.target.value)}
                  placeholder="A 1-2 sentence summary shown on the blog feed card..."
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="blog-content-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Full Article Content
                </label>
                <textarea
                  id="blog-content-input"
                  rows={5}
                  required
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  placeholder="Write your detailed maintenance steps, torque specs, or route itinerary..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBlogComposer(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBlogId ? 'Save Blog Changes' : 'Publish Blog'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Active Community Chat & Roster Panel */}
      {activeCommunity ? (
        <Card className="border-2 border-primary-600 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{activeCommunity.category}</Badge>
                  <Badge variant="outline">
                    {activeCommunity.visibility === CommunityVisibility.PUBLIC
                      ? 'Public Community Chat'
                      : 'Private Community Chat'}
                  </Badge>
                </div>
                <CardTitle className="mt-1.5 text-xl">{activeCommunity.name}</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveCommunity(null)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Close Community Hub
              </Button>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-6 pt-5 lg:grid-cols-3">
            {/* Left 2 Columns: Persistent Community Chat */}
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Community Group Chat
              </h3>

              {chatAccessError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Private Community Chat Locked</p>
                  <p className="mt-1 text-xs">{chatAccessError}</p>
                </div>
              ) : (
                <>
                  <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {communityMessages.length === 0 ? (
                      <p className="text-center text-xs text-slate-500">
                        No messages yet. Start the conversation below!
                      </p>
                    ) : (
                      communityMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar
                                alt={msg.sender.displayName}
                                fallbackText={msg.sender.displayName}
                                src={msg.sender.avatarUrl}
                                size="sm"
                              />
                              <div>
                                <p className="text-xs font-semibold text-slate-900">
                                  {msg.sender.displayName}{' '}
                                  <span className="font-normal text-slate-500">
                                    @{msg.sender.username}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <MessageUserButton
                              user={msg.sender}
                              contextLabel={`Community Chat: ${activeCommunity.name}`}
                              size="sm"
                              variant="ghost"
                            />
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{msg.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    onSubmit={(e) => void handleSendCommunityMessage(e)}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatMessageDraft}
                      onChange={(e) => setChatMessageDraft(e.target.value)}
                      placeholder={`Message ${activeCommunity.name}...`}
                      aria-label="Community chat message"
                      className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    />
                    <Button type="submit" size="sm" className="h-10 px-4">
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Send
                    </Button>
                  </form>
                </>
              )}
            </div>

            {/* Right Column: Member Roster & Pending Approvals */}
            <div className="space-y-4">
              {pendingMembers.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Pending Join Requests ({pendingMembers.length})
                  </h4>
                  <div className="mt-2 space-y-2">
                    {pendingMembers.map((pending) => (
                      <div
                        key={pending.id}
                        className="flex items-center justify-between rounded-lg bg-white p-2 text-xs shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {pending.user.displayName}
                          </p>
                          <p className="text-slate-500">@{pending.user.username}</p>
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

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Approved Members ({communityMembers.length})
                </h3>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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
          </CardContent>
        </Card>
      ) : null}

      {/* Full Blog Reader & Comments Panel */}
      {selectedBlog ? (
        <Card className="border-2 border-primary-600 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedBlog.readTimeMinutes} min read</Badge>
                  {selectedBlog.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="mt-2 text-2xl">{selectedBlog.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {currentUser &&
                (currentUser.id === selectedBlog.author.id ||
                  currentUser.role === UserRole.ADMIN ||
                  currentUser.role === UserRole.MODERATOR) ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditBlogComposer(selectedBlog)}
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleDeleteBlog(selectedBlog)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                      Delete
                    </Button>
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedBlog(null)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Close Article
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-800 sm:text-base">
              {selectedBlog.content}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-4">
              <div className="w-full sm:w-auto sm:min-w-[320px]">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Written By
                </p>
                <UserProfileCard
                  user={selectedBlog.author}
                  contextLabel={`Blog: ${selectedBlog.title}`}
                  compact
                />
              </div>

              <Button
                variant={selectedBlog.isLikedByViewer ? 'default' : 'outline'}
                onClick={() => void handleToggleBlogReaction(selectedBlog)}
              >
                <Heart
                  className={`h-4 w-4 ${selectedBlog.isLikedByViewer ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
                {selectedBlog.isLikedByViewer ? 'Liked' : 'Like Article'} (
                {selectedBlog.likesCount})
              </Button>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                Rider Discussion ({selectedBlog.comments?.length ?? selectedBlog.commentsCount})
              </h3>

              <div className="space-y-3">
                {(selectedBlog.comments ?? []).map((comment) => (
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
                        <span className="text-xs text-slate-500">
                          @{comment.author.username}
                        </span>
                      </div>
                      <MessageUserButton
                        user={comment.author}
                        contextLabel={`Comment on: ${selectedBlog.title}`}
                        size="sm"
                        variant="ghost"
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{comment.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={(e) => void handleAddBlogComment(e)} className="flex gap-2">
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Add a technical note or question on this article..."
                  aria-label="Add blog comment"
                  className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                />
                <Button type="submit" size="sm" className="h-10 px-4">
                  Post Comment
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Controls Bar: Segmented Switcher + Search */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div
          role="tablist"
          aria-label="Community module views"
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'communities'}
            onClick={() => setActiveTab('communities')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'communities'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Communities ({filteredCommunities.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'blogs'}
            onClick={() => setActiveTab('blogs')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'blogs'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Rider Blogs ({filteredBlogs.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'communities'
                ? 'Search communities or categories...'
                : 'Search blogs or tags...'
            }
            aria-label="Search communities and blogs"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'communities' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredCommunities.map((community) => (
            <Card key={community.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary">{community.category}</Badge>
                  <div className="flex items-center gap-1.5">
                    {community.viewerMembershipStatus === CommunityMembershipStatus.APPROVED ? (
                      <Badge variant="outline" className="border-primary-200 bg-primary-50 text-primary-700">
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                        {community.viewerRole === CommunityMemberRole.FOUNDER
                          ? 'Founder'
                          : 'Member'}
                      </Badge>
                    ) : community.viewerMembershipStatus === CommunityMembershipStatus.PENDING ? (
                      <Badge variant="warning">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Pending Approval
                      </Badge>
                    ) : null}

                    {community.visibility === CommunityVisibility.PUBLIC ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        <Globe className="h-3 w-3" aria-hidden="true" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Private
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="mt-2 text-xl">{community.name}</CardTitle>
                <CardDescription className="mt-1 leading-relaxed">
                  {community.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    {community.memberCount.toLocaleString()} members
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    Persistent community chat ready
                  </span>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Community Founder
                  </p>
                  <UserProfileCard
                    user={community.founder}
                    contextLabel={`Community: ${community.name}`}
                    compact
                  />
                </div>
              </CardContent>

              <CardFooter className="flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleOpenCommunityHub(community)}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Open Chat & Roster
                </Button>

                {community.viewerMembershipStatus === CommunityMembershipStatus.APPROVED ? (
                  community.viewerRole !== CommunityMemberRole.FOUNDER ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleLeaveCommunity(community)}
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      Leave
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-primary-700">
                      You founded this chapter
                    </span>
                  )
                ) : community.viewerMembershipStatus === CommunityMembershipStatus.PENDING ? (
                  <Button size="sm" variant="secondary" disabled>
                    Approval Pending
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => void handleJoinCommunity(community)}
                  >
                    {community.visibility === CommunityVisibility.PUBLIC
                      ? 'Join Community'
                      : 'Request Access'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredBlogs.map((blog) => (
            <Card key={blog.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-primary-700">
                    Rider Technical & Travel Log
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{blog.readTimeMinutes} min read</Badge>
                    <Badge variant="secondary">
                      {blog.likesCount} likes • {blog.commentsCount} comments
                    </Badge>
                  </div>
                </div>
                <CardTitle className="mt-2 text-xl">{blog.title}</CardTitle>
                <CardDescription className="mt-1 leading-relaxed">
                  {blog.excerpt}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {blog.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Published By
                  </p>
                  <UserProfileCard
                    user={blog.author}
                    contextLabel={`Blog: ${blog.title}`}
                    compact
                  />
                </div>
              </CardContent>

              <CardFooter className="justify-between border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant={blog.isLikedByViewer ? 'default' : 'ghost'}
                  onClick={() => void handleToggleBlogReaction(blog)}
                >
                  <Heart
                    className={`h-4 w-4 ${blog.isLikedByViewer ? 'fill-current' : ''}`}
                    aria-hidden="true"
                  />
                  Like ({blog.likesCount})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleOpenBlogReader(blog)}
                >
                  Read Full Article
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export default CommunityRemoteApp;
