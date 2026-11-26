import * as React from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Edit3,
  Heart,
  Info,
  Trash2,
  X,
} from 'lucide-react';
import {
  UserRole,
  type AuthenticatedUserAccount,
  type NewsArticleItem,
  type NewsCommentItem,
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

const API_BASE_URL =
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL) || 'http://localhost:4000/api/v1';
const AUTH_USER_STORAGE_KEY = 'ridersclub_auth_user';
const DEFAULT_NEWS_HEADER_IMAGE =
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80';

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

function getStoredUser(): AuthenticatedUserAccount | null {
  try {
    const raw =
      window.localStorage.getItem('ridersclub:auth_user') ??
      window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
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

export function NewsRemoteApp(): React.JSX.Element {
  const [newsArticles, setNewsArticles] = React.useState<NewsArticleItem[]>(INITIAL_NEWS);
  const [statusBanner, setStatusBanner] = React.useState<string | null>(null);
  const [showHeaderInfo, setShowHeaderInfo] = React.useState(false);

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

  const loadLiveNews = React.useCallback(async () => {
    const token = getStoredToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const newsRes = await fetch(`${API_BASE_URL}/news?page=1&limit=20`, {
        headers,
        credentials: 'include',
      });

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
    void loadLiveNews();
  }, [loadLiveNews]);

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
    <section aria-label="News Federated Module" className="space-y-6">
      {/* Header Banner (hidden when a full news page is open) */}
      {!selectedArticle && (
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
                    Official News curated and published exclusively by RidersClub Administrators.
                    Click on any news card to open the full news story in a dedicated page.
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">News</h1>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
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

      {/* News List or Full Article View */}
      {selectedArticle ? (
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

export default NewsRemoteApp;
