import * as React from 'react';
import {
  CheckCircle2,
  Chrome,
  KeyRound,
  Link2,
  LogOut,
  Phone,
  Save,
  Shield,
  Smartphone,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  DirectMessagePrivacy,
  type AuthenticatedUserAccount,
  type AuthSessionResponse,
  type OtpRequestResponse,
  type PublicUserSummary,
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
  // Phone OTP Sign-In State
  const [phoneInput, setPhoneInput] = React.useState('+919845012345');
  const [otpInput, setOtpInput] = React.useState('');
  const [displayNameInput, setDisplayNameInput] = React.useState('Dhivyal Rider');
  const [otpRequested, setOtpRequested] = React.useState<OtpRequestResponse | null>(null);

  // Google OAuth Sign-In State
  const [googleEmail, setGoogleEmail] = React.useState('dhivyal@ridersclub.dev');
  const [googleName, setGoogleName] = React.useState('Dhivyal Rider');

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
  const [linkPhoneInput, setLinkPhoneInput] = React.useState('+919845099887');
  const [linkOtpInput, setLinkOtpInput] = React.useState('');
  const [linkOtpPreview, setLinkOtpPreview] = React.useState<string | null>(null);

  // Directory State
  const [directoryProfiles, setDirectoryProfiles] = React.useState<PublicUserSummary[]>([]);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const loadDirectory = React.useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${apiBaseUrl}/profiles`, {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const list = (await res.json()) as PublicUserSummary[];
        setDirectoryProfiles(list);
      }
    } catch {
      // Ignore directory load error if API is offline during unit tests
    }
  }, [apiBaseUrl, accessToken]);

  React.useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  async function handleRequestOtp(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(', ') : data.message || 'OTP request failed',
        );
      }

      const otpRes = data as OtpRequestResponse;
      setOtpRequested(otpRes);
      if (otpRes.devOtpPreview) {
        setOtpInput(otpRes.devOtpPreview);
      }
      setStatusMessage(otpRes.message);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to request OTP');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: phoneInput,
          code: otpInput,
          displayName: displayNameInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(', ') : data.message || 'OTP verification failed',
        );
      }

      const session = data as AuthSessionResponse;
      onSessionEstablished(session);
      setOtpRequested(null);
      setStatusMessage(`Signed in as ${session.user.profile.displayName} (@${session.user.profile.username})`);
      void loadDirectory();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const googleSubjectId = `google-sub-${googleEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const res = await fetch(`${apiBaseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          googleSubjectId,
          email: googleEmail,
          displayName: googleName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Google sign-in failed',
        );
      }

      const session = data as AuthSessionResponse;
      onSessionEstablished(session);
      setStatusMessage(`Signed in via Google OAuth as ${session.user.profile.displayName}`);
      void loadDirectory();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
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
      setStatusMessage('Profile and privacy settings saved to PostgreSQL.');
      void loadDirectory();
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
          {/* Phone Number OTP Authentication Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="default">
                  <Smartphone className="h-3 w-3" aria-hidden="true" />
                  Phone OTP Authentication
                </Badge>
                <Badge variant="outline">Rate-Limited & 5m Expiry</Badge>
              </div>
              <CardTitle className="mt-2 text-xl">Sign In with Phone OTP</CardTitle>
              <CardDescription>
                Receive a 6-digit verification code. Maximum 3 requests per 10 minutes.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label
                    htmlFor="otp-phone-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Phone Number (E.164 format)
                  </label>
                  <input
                    id="otp-phone-input"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+919845012345"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="otp-name-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Display Name (for new rider accounts)
                  </label>
                  <input
                    id="otp-name-input"
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Send 6-Digit OTP Code
                </Button>
              </form>

              {otpRequested && (
                <form
                  onSubmit={handleVerifyOtp}
                  className="mt-4 space-y-3 rounded-xl border border-primary-200 bg-primary-50/60 p-4"
                >
                  {otpRequested.devOtpPreview && (
                    <div className="flex items-center justify-between rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950">
                      <span>Local Dev OTP Code: {otpRequested.devOtpPreview}</span>
                      <Badge variant="warning">Dev Mode</Badge>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="otp-code-input"
                      className="block text-xs font-semibold text-slate-800"
                    >
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      id="otp-code-input"
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="123456"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm tracking-widest focus:border-primary-600 focus:outline-none"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    Verify OTP & Sign In
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Google OAuth Sign-In Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  <Chrome className="h-3 w-3" aria-hidden="true" />
                  Google OAuth 2.0
                </Badge>
                <Badge variant="outline">Account-Linking Safeguards</Badge>
              </div>
              <CardTitle className="mt-2 text-xl">Continue with Google</CardTitle>
              <CardDescription>
                Sign in with your Google identity. Automatically links to matching verified email
                accounts while preventing subject-ID hijacking.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleGoogleSignIn} className="space-y-3">
                <div>
                  <label
                    htmlFor="google-email-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Google Account Email
                  </label>
                  <input
                    id="google-email-input"
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="google-name-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Google Profile Name
                  </label>
                  <input
                    id="google-name-input"
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Chrome className="h-4 w-4 text-primary-600" aria-hidden="true" />
                  Sign In with Google
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Edit Profile & Privacy Controls */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <Badge variant="verified">
                  <UserCheck className="h-3 w-3" aria-hidden="true" />
                  Authenticated Session ({currentUser.role})
                </Badge>
                <CardTitle className="mt-2 text-2xl">
                  Edit Rider Profile & Privacy Settings
                </CardTitle>
                <CardDescription>
                  Changes persist to PostgreSQL and update how your profile appears across Blogs,
                  Communities, Rides, Help, Mechanics, and Marketplace.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={onSignOut}>
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </Button>
            </CardHeader>

            <CardContent>
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
                    className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs"
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
                      <p className="text-[11px] font-semibold text-amber-800">
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
      )}

      {/* Registered Riders Directory from PostgreSQL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Registered Riders in PostgreSQL ({directoryProfiles.length})
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => void loadDirectory()}>
              Refresh Directory
            </Button>
          </div>
          <CardDescription>
            Click any rider profile below to view their public profile or start a 1:1 conversation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {directoryProfiles.length === 0 ? (
            <p className="text-xs text-slate-500">
              Sign in above with Phone OTP or Google OAuth to create your live rider profile in
              PostgreSQL!
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {directoryProfiles.map((rider) => (
                <UserProfileCard
                  key={rider.id}
                  user={rider}
                  contextLabel="Rider Directory"
                />
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-slate-500">
          Direct messaging buttons automatically disable when a rider sets privacy to NONE or when
          a block is active.
        </CardFooter>
      </Card>
    </section>
  );
}

