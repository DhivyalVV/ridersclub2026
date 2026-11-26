import * as React from 'react';
import {
  CheckCircle2,
  Info,
  Link2,
  LogIn,
  LogOut,
  Save,
  Shield,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  DirectMessagePrivacy,
  type AuthenticatedUserAccount,
  type AuthSessionResponse,
  type OtpRequestResponse,
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

export interface AuthAndProfileViewProps {
  apiBaseUrl: string;
  currentUser: AuthenticatedUserAccount | null;
  accessToken: string | null;
  onSessionEstablished: (session: AuthSessionResponse) => void;
  onUserUpdated: (user: AuthenticatedUserAccount) => void;
  onSignOut: () => void;
}

export function AuthAndProfileView({
  apiBaseUrl,
  currentUser,
  accessToken,
  onSessionEstablished,
  onUserUpdated,
  onSignOut,
}: AuthAndProfileViewProps): React.JSX.Element {
  // Username & Password Sign-In / Sign-Up State
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');
  const [signInIdentifier, setSignInIdentifier] = React.useState('');
  const [signInPassword, setSignInPassword] = React.useState('');

  const [signUpUsername, setSignUpUsername] = React.useState('');
  const [signUpDisplayName, setSignUpDisplayName] = React.useState('');
  const [signUpEmail, setSignUpEmail] = React.useState('');
  const [signUpPassword, setSignUpPassword] = React.useState('');

  // Profile Editor State
  const [editDisplayName, setEditDisplayName] = React.useState('');
  const [editUsername, setEditUsername] = React.useState('');
  const [editCity, setEditCity] = React.useState('');
  const [editBio, setEditBio] = React.useState('');
  const [editShowPhone, setEditShowPhone] = React.useState(false);
  const [editDmPrivacy, setEditDmPrivacy] = React.useState<DirectMessagePrivacy>(
    DirectMessagePrivacy.EVERYONE,
  );

  // Account Linking Phone State
  const [linkPhoneInput, setLinkPhoneInput] = React.useState('');
  const [linkOtpInput, setLinkOtpInput] = React.useState('');
  const [linkOtpPreview, setLinkOtpPreview] = React.useState<string | null>(null);

  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showHeaderInfo, setShowHeaderInfo] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setEditDisplayName(currentUser.profile.displayName);
      setEditUsername(currentUser.profile.username);
      setEditCity(currentUser.profile.city ?? '');
      setEditBio(currentUser.profile.bio ?? '');
      setEditShowPhone(currentUser.profile.showPhone);
      setEditDmPrivacy(currentUser.allowDirectMessages);
    }
  }, [currentUser]);

  const googleClientId =
    ((import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_GOOGLE_CLIENT_ID ?? '').trim() ||
    '61740694709-eull2hmmm141ocln51v6po950v71npku.apps.googleusercontent.com';

  React.useEffect(() => {
    if (!googleClientId || currentUser || typeof document === 'undefined') {
      return;
    }

    const existingScript = document.getElementById('google-gsi-client-script');
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [googleClientId, currentUser]);

  async function handlePasswordSignIn(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: signInIdentifier,
          password: signInPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Sign in failed',
        );
      }

      const session = data as AuthSessionResponse;
      onSessionEstablished(session);
      setStatusMessage(
        `Signed in as ${session.user.profile.displayName}`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordSignUp(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: signUpUsername,
          password: signUpPassword,
          displayName: signUpDisplayName.trim() || undefined,
          email: signUpEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Account creation failed',
        );
      }

      const session = data as AuthSessionResponse;
      onSessionEstablished(session);
      setStatusMessage(
        `Welcome to RidersClub, ${session.user.profile.displayName}!`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleSignIn(): void {
    setErrorMessage(null);
    setStatusMessage(null);

    const g = (
      window as unknown as {
        google?: {
          accounts?: {
            oauth2?: {
              initTokenClient: (cfg: {
                client_id: string;
                scope: string;
                prompt?: string;
                callback: (resp: { access_token?: string; error?: string }) => void;
              }) => { requestAccessToken: () => void };
            };
          };
        };
      }
    ).google;

    if (!g?.accounts?.oauth2) {
      setErrorMessage(
        'Google Sign-In popup is still initializing. Please wait a second and click Sign In with Google again.',
      );
      return;
    }

    const tokenClient = g.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse.error || !tokenResponse.access_token) {
          setErrorMessage('Google account selection was cancelled or failed.');
          return;
        }
        setIsSubmitting(true);
        try {
          const res = await fetch(`${apiBaseUrl}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              googleAccessToken: tokenResponse.access_token,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(
              Array.isArray(data.message)
                ? data.message.join(', ')
                : data.message || 'Google sign-in failed',
            );
          }

          const session = data as AuthSessionResponse;
          onSessionEstablished(session);
          setStatusMessage(
            `Signed in via Google OAuth as ${session.user.profile.displayName} (${session.user.role})`,
          );
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : 'Google sign-in failed');
        } finally {
          setIsSubmitting(false);
        }
      },
    });

    tokenClient.requestAccessToken();
  }

  async function handleSaveProfile(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!accessToken) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/profiles/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName: editDisplayName,
          username: editUsername,
          city: editCity || null,
          bio: editBio || null,
          showPhone: editShowPhone,
          allowDirectMessages: editDmPrivacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Failed to update profile',
        );
      }

      onUserUpdated(data as AuthenticatedUserAccount);
      setStatusMessage('Profile and privacy settings saved.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Profile update failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestLinkPhoneOtp(): Promise<void> {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: linkPhoneInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to request OTP');
      }
      const otpRes = data as OtpRequestResponse;
      setLinkOtpPreview(otpRes.devOtpPreview ?? null);
      if (otpRes.devOtpPreview) setLinkOtpInput(otpRes.devOtpPreview);
      setStatusMessage(`OTP sent to ${linkPhoneInput} for account linking.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'OTP request failed');
    }
  }

  async function handleVerifyLinkPhone(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!accessToken) return;
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/link/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: linkPhoneInput,
          code: linkOtpInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to link phone number');
      }
      onUserUpdated(data as AuthenticatedUserAccount);
      setLinkOtpPreview(null);
      setStatusMessage('Phone number verified and linked to your account.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Phone linking failed');
    }
  }

  return (
    <section aria-label="Authentication and Rider Profile Settings" className="space-y-6">
      {statusMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900"
        >
          {errorMessage}
        </div>
      )}

      {!currentUser ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Username & Password Authentication Card (Sign In / Sign Up) */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-xl">
                  {authMode === 'signin'
                    ? 'Sign In with Username & Password'
                    : 'Create Rider Account'}
                </CardTitle>
                <div
                  role="tablist"
                  aria-label="Authentication Mode"
                  className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === 'signin'}
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                      setStatusMessage(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      authMode === 'signin'
                        ? 'bg-white text-primary-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === 'signup'}
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMessage(null);
                      setStatusMessage(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      authMode === 'signup'
                        ? 'bg-white text-primary-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
              <CardDescription>
                {authMode === 'signin'
                  ? 'Sign in with your RidersClub username (or email) and password.'
                  : 'Create a free rider account with a username and password.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {authMode === 'signin' ? (
                <form onSubmit={handlePasswordSignIn} className="space-y-3">
                  <div>
                    <label
                      htmlFor="signin-identifier-input"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Username or Email
                    </label>
                    <input
                      id="signin-identifier-input"
                      type="text"
                      required
                      autoComplete="username"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      placeholder="aarav_rides or aarav@ridersclub.dev"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:placeholder:text-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="signin-password-input"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Password
                    </label>
                    <input
                      id="signin-password-input"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:placeholder:text-transparent"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Sign In
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePasswordSignUp} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="signup-username-input"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Username (@handle) *
                      </label>
                      <input
                        id="signup-username-input"
                        type="text"
                        required
                        minLength={3}
                        maxLength={24}
                        autoComplete="username"
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value)}
                        placeholder="aarav_rides"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:placeholder:text-transparent"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="signup-display-name-input"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Display Name
                      </label>
                      <input
                        id="signup-display-name-input"
                        type="text"
                        maxLength={60}
                        autoComplete="name"
                        value={signUpDisplayName}
                        onChange={(e) => setSignUpDisplayName(e.target.value)}
                        placeholder="Aarav Sharma"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:placeholder:text-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="signup-email-input"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Email Address (optional)
                    </label>
                    <input
                      id="signup-email-input"
                      type="email"
                      autoComplete="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="aarav@ridersclub.dev"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:placeholder:text-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="signup-password-input"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Password (min 6 characters) *
                    </label>
                    <input
                      id="signup-password-input"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Create a password"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:placeholder:text-transparent"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Create Account & Sign In
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Google OAuth Sign-In Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Continue with Google</CardTitle>
              <CardDescription>
                Click below to select your Google account and sign in to RidersClub.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full"
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white p-0.5 shadow-xs"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </span>
                Sign In with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
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
                      Update how your profile appears across News, Communities, Rides, Help,
                      Mechanics, and Marketplace.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Edit Rider Profile & Privacy Settings
                </h1>
                <Badge variant="verified">
                  <UserCheck className="h-3 w-3" aria-hidden="true" />
                  Authenticated Session ({currentUser.role})
                </Badge>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="bg-yellow-100 text-yellow-950 hover:bg-yellow-200"
                onClick={onSignOut}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Edit Profile & Privacy Controls */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="profile-display-name"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Display Name
                    </label>
                    <input
                      id="profile-display-name"
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-username"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Username (@handle)
                    </label>
                    <input
                      id="profile-username"
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="profile-city"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      City / Riding Region
                    </label>
                    <input
                      id="profile-city"
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-dm-privacy"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      1:1 Direct Message Privacy
                    </label>
                    <select
                      id="profile-dm-privacy"
                      value={editDmPrivacy}
                      onChange={(e) =>
                        setEditDmPrivacy(e.target.value as DirectMessagePrivacy)
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value={DirectMessagePrivacy.EVERYONE}>
                        Everyone on RidersClub
                      </option>
                      <option value={DirectMessagePrivacy.COMMUNITY_PEERS_ONLY}>
                        Community Peers Only
                      </option>
                      <option value={DirectMessagePrivacy.NONE}>
                        No One (Disable Direct Messages)
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-bio"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Rider Bio & Vehicles
                  </label>
                  <textarea
                    id="profile-bio"
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editShowPhone}
                    onChange={(e) => setEditShowPhone(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-primary-600"
                  />
                  <span>
                    Display my verified phone number on my public rider profile (hidden by default)
                  </span>
                </label>

                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save Profile & Privacy Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Linked Auth Credentials Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-4 w-4 text-primary-600" aria-hidden="true" />
                Account Security & Linking
              </CardTitle>
              <CardDescription>
                Manage your linked sign-in methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-800">Google OAuth</p>
                  <p className="text-slate-500">
                    {currentUser.email ?? 'Not linked'}
                  </p>
                </div>
                <Badge variant={currentUser.hasGoogleLinked ? 'verified' : 'outline'}>
                  {currentUser.hasGoogleLinked ? 'Linked' : 'Unlinked'}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-800">Verified Phone OTP</p>
                  <p className="text-slate-500">
                    {currentUser.phoneNumber ?? 'No phone linked yet'}
                  </p>
                </div>
                <Badge variant={currentUser.phoneNumber ? 'verified' : 'outline'}>
                  {currentUser.phoneNumber ? 'Verified' : 'Unlinked'}
                </Badge>
              </div>

              {!currentUser.phoneNumber && (
                <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800">Link a Phone Number</p>
                  <input
                    type="tel"
                    value={linkPhoneInput}
                    onChange={(e) => setLinkPhoneInput(e.target.value)}
                    placeholder="+911234567890"
                    className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:placeholder:text-transparent"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleRequestLinkPhoneOtp()}
                    className="w-full"
                  >
                    <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Send Link OTP
                  </Button>
                  {linkOtpPreview && (
                    <form onSubmit={handleVerifyLinkPhone} className="space-y-2 pt-2">
                      <p className="text-[11px] font-semibold text-yellow-800">
                        Dev OTP: {linkOtpPreview}
                      </p>
                      <input
                        type="text"
                        value={linkOtpInput}
                        onChange={(e) => setLinkOtpInput(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-300 px-2.5 font-mono text-xs"
                      />
                      <Button type="submit" size="sm" className="w-full">
                        Verify & Link Phone
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </>
      )}
    </section>
  );
}
