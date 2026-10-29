/**
 * Shared domain enums, DTO contracts, and utility helpers for RidersClub.
 * Safe to import in both React micro-frontends and the NestJS API.
 */

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum DirectMessagePrivacy {
  EVERYONE = 'EVERYONE',
  COMMUNITY_PEERS_ONLY = 'COMMUNITY_PEERS_ONLY',
  NONE = 'NONE',
}

export enum CommunityVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum CommunityMembershipStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
}

export enum CommunityMemberRole {
  FOUNDER = 'FOUNDER',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export enum RideStatus {
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum HelpRequestStatus {
  OPEN = 'OPEN',
  ASSISTANCE_OFFERED = 'ASSISTANCE_OFFERED',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum HelpCategory {
  EMERGENCY_BREAKDOWN = 'EMERGENCY_BREAKDOWN',
  FLAT_TIRE = 'FLAT_TIRE',
  OUT_OF_FUEL = 'OUT_OF_FUEL',
  BATTERY_JUMP = 'BATTERY_JUMP',
  ACCIDENT_SUPPORT = 'ACCIDENT_SUPPORT',
  OTHER = 'OTHER',
}

export enum MechanicVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  WITHDRAWN = 'WITHDRAWN',
}

export interface ApiHealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  database: {
    connected: boolean;
    latencyMs?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PublicUserSummary {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  role: UserRole;
  canReceiveDirectMessage: boolean;
  publicPhoneNumber?: string | null;
  isBlockedByViewer?: boolean;
}

export interface UserProfileDetails {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  city: string | null;
  showPhone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedUserAccount {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  hasGoogleLinked: boolean;
  role: UserRole;
  accountStatus: AccountStatus;
  allowDirectMessages: DirectMessagePrivacy;
  profile: UserProfileDetails;
}

export interface OtpRequestResponse {
  message: string;
  phoneNumber: string;
  expiresAt: string;
  /**
   * Populated only in local development (NODE_ENV !== 'production') so developers
   * can test OTP sign-in without paid SMS credentials.
   */
  devOtpPreview?: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  expiresAt: string;
  user: AuthenticatedUserAccount;
}

export interface UpdateProfilePayload {
  displayName?: string;
  username?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  showPhone?: boolean;
  allowDirectMessages?: DirectMessagePrivacy;
}

export interface BlogCommentItem {
  id: string;
  blogId: string;
  body: string;
  createdAt: string;
  author: PublicUserSummary;
}

export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  readTimeMinutes: number;
  likesCount: number;
  commentsCount: number;
  isLikedByViewer: boolean;
  createdAt: string;
  updatedAt: string;
  author: PublicUserSummary;
  comments?: BlogCommentItem[];
}

export interface CreateBlogPayload {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export interface UpdateBlogPayload {
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
}

export interface CommunityItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  visibility: CommunityVisibility;
  memberCount: number;
  founder: PublicUserSummary;
  viewerMembershipStatus: CommunityMembershipStatus | null;
  viewerRole: CommunityMemberRole | null;
  createdAt: string;
}

export interface CommunityMemberItem {
  id: string;
  communityId: string;
  userId: string;
  role: CommunityMemberRole;
  status: CommunityMembershipStatus;
  joinedAt: string;
  user: PublicUserSummary;
}

export interface CommunityChatMessageItem {
  id: string;
  communityId: string;
  body: string;
  createdAt: string;
  sender: PublicUserSummary;
}

export interface CommunityDetailResponse {
  community: CommunityItem;
  members: CommunityMemberItem[];
  pendingMembers: CommunityMemberItem[];
}

export interface CreateCommunityPayload {
  name: string;
  description: string;
  category: string;
  visibility: CommunityVisibility;
}

export interface DirectMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  contextLabel: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface DirectConversationItem {
  id: string;
  participantPairKey: string;
  peer: PublicUserSummary;
  contextLabel: string | null;
  unreadCount: number;
  lastMessageAt: string | null;
  updatedAt: string;
  messages: DirectMessageItem[];
}

export interface StartDirectConversationPayload {
  recipientUserId: string;
  contextLabel?: string;
}

export interface SendDirectMessagePayload {
  body: string;
  contextLabel?: string;
}

export interface DirectMessagingRealtimeEvent {
  type: 'direct_message.created' | 'direct_message.read';
  conversationId: string;
  participantPairKey: string;
  recipientUserIds: string[];
  message?: DirectMessageItem;
}

export interface RideRoutePreview {
  providerName: string;
  startAddress: string;
  destinationAddress: string;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  waypoints: string[];
  mapExternalUrl: string;
}

export interface RideParticipantItem {
  id: string;
  rideId: string;
  userId: string;
  joinedAt: string;
  user: PublicUserSummary;
}

export interface RideItem {
  id: string;
  title: string;
  description: string;
  startLocation: string;
  destination: string;
  departureAt: string;
  dateTimeLabel: string;
  capacity: number;
  participantCount: number;
  status: RideStatus;
  organizer: PublicUserSummary;
  isJoinedByViewer: boolean;
  routePreview: RideRoutePreview;
  participants?: RideParticipantItem[];
  createdAt: string;
}

export interface CreateRidePayload {
  title: string;
  description: string;
  startLocation: string;
  destination: string;
  departureAt: string;
  capacity: number;
}

export interface UpdateRidePayload {
  title?: string;
  description?: string;
  startLocation?: string;
  destination?: string;
  departureAt?: string;
  capacity?: number;
  status?: RideStatus;
}

export interface HelpRequestOfferItem {
  id: string;
  helpRequestId: string;
  helperId: string;
  note: string | null;
  createdAt: string;
  helper: PublicUserSummary;
}

export interface HelpRequestItem {
  id: string;
  category: HelpCategory;
  description: string;
  vehicleSummary: string | null;
  status: HelpRequestStatus;
  locationSharedWithConsent: boolean;
  locationLabel: string;
  latitude: number | null;
  longitude: number | null;
  externalMapUrl: string | null;
  distanceKmFromViewer: number | null;
  requester: PublicUserSummary;
  offersCount: number;
  offers?: HelpRequestOfferItem[];
  isOfferedByViewer: boolean;
  createdAt: string;
  createdAtLabel: string;
  resolvedAt: string | null;
}

export interface CreateHelpRequestPayload {
  category: HelpCategory;
  description: string;
  vehicleSummary?: string;
  locationConsentGranted: boolean;
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
}

export interface OfferHelpPayload {
  note?: string;
}

export interface UpdateHelpStatusPayload {
  status: HelpRequestStatus;
}

export interface MechanicItem {
  id: string;
  ownerId: string;
  businessName: string;
  description: string;
  serviceCategories: string[];
  address: string;
  city: string;
  contactPhonePublic: boolean;
  displayPhone: string;
  verificationStatus: MechanicVerificationStatus;
  verifiedAt: string | null;
  verificationNotes: string | null;
  owner: PublicUserSummary;
  createdAt: string;
}

export interface RegisterMechanicPayload {
  businessName: string;
  description: string;
  serviceCategories: string[];
  address: string;
  city: string;
  contactPhone: string;
  contactPhonePublic: boolean;
}

export interface UpdateMechanicPayload {
  businessName?: string;
  description?: string;
  serviceCategories?: string[];
  address?: string;
  city?: string;
  contactPhone?: string;
  contactPhonePublic?: boolean;
}

export interface VerifyMechanicPayload {
  status: MechanicVerificationStatus;
  verificationNotes?: string;
}

export interface VehicleServiceRecordItem {
  id: string;
  vehicleId: string;
  serviceDate: string;
  odometerKm: number;
  description: string;
  costInr: number;
  workshopName: string | null;
  createdAt: string;
}

export interface VehicleNoteItem {
  id: string;
  vehicleId: string;
  content: string;
  createdAt: string;
}

export interface GarageVehicleItem {
  id: string;
  ownerId: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  registrationLabel: string | null;
  currentOdometerKm: number;
  nextReminderLabel: string | null;
  nextServiceOdometerKm: number | null;
  notes: VehicleNoteItem[];
  serviceHistory: VehicleServiceRecordItem[];
  createdAt: string;
}

export interface CreateVehiclePayload {
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  registrationLabel?: string;
  currentOdometerKm: number;
  nextReminderLabel?: string;
  nextServiceOdometerKm?: number;
}

export interface UpdateVehiclePayload {
  make?: string;
  model?: string;
  year?: number;
  registrationLabel?: string;
  currentOdometerKm?: number;
  nextReminderLabel?: string;
  nextServiceOdometerKm?: number;
}

export interface CreateServiceRecordPayload {
  serviceDate: string;
  odometerKm: number;
  description: string;
  costInr: number;
  workshopName?: string;
}

export interface CreateVehicleNotePayload {
  content: string;
}

export type ListingSortOption = 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC';

export interface ListingPhotoItem {
  id: string;
  listingId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  displayOrder: number;
}

export interface MarketplaceListingItem {
  id: string;
  sellerId: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  odometerKm: number;
  askingPriceInr: number;
  description: string;
  location: string;
  status: ListingStatus;
  photos: ListingPhotoItem[];
  seller: PublicUserSummary;
  createdAt: string;
}

export interface ListingPhotoUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
}

export interface CreateMarketplaceListingPayload {
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  odometerKm: number;
  askingPriceInr: number;
  description: string;
  location: string;
  photos?: ListingPhotoUploadInput[];
}

export interface UpdateMarketplaceListingPayload {
  make?: string;
  model?: string;
  year?: number;
  odometerKm?: number;
  askingPriceInr?: number;
  description?: string;
  location?: string;
  status?: ListingStatus;
}

export enum ModerationTargetType {
  BLOG = 'BLOG',
  COMMUNITY = 'COMMUNITY',
  USER = 'USER',
  HELP_REQUEST = 'HELP_REQUEST',
  MECHANIC = 'MECHANIC',
  LISTING = 'LISTING',
}

export enum ReportStatus {
  OPEN = 'OPEN',
  ACTIONED = 'ACTIONED',
  DISMISSED = 'DISMISSED',
}

export interface ContentReportItem {
  id: string;
  reporterId: string;
  targetType: ModerationTargetType;
  targetId: string;
  targetLabel: string;
  reason: string;
  status: ReportStatus;
  resolutionNotes: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  reporter: PublicUserSummary;
  createdAt: string;
}

export interface ModerationAuditLogItem {
  id: string;
  actorId: string;
  action: string;
  targetType: ModerationTargetType;
  targetId: string;
  reason: string;
  actor: PublicUserSummary;
  createdAt: string;
}

export interface AdminPlatformOverview {
  totalUsers: number;
  openReportsCount: number;
  pendingMechanicsCount: number;
  activeRidesCount: number;
  activeHelpRequestsCount: number;
  activeListingsCount: number;
  reports: ContentReportItem[];
  auditLogs: ModerationAuditLogItem[];
}

export interface CreateContentReportPayload {
  targetType: ModerationTargetType;
  targetId: string;
  targetLabel: string;
  reason: string;
}

export interface ResolveContentReportPayload {
  status: ReportStatus.ACTIONED | ReportStatus.DISMISSED;
  actionTaken: string;
  resolutionNotes?: string;
}

export interface AdminUpdateUserStatusPayload {
  accountStatus: AccountStatus;
  reason: string;
}

/**
 * Generates a deterministic canonical key for a 1:1 conversation between two users.
 * Ensures that (userA, userB) and (userB, userA) always resolve to the exact same key,
 * preventing duplicate conversations at both the application and database level.
 */
export function buildConversationPairKey(userAId: string, userBId: string): string {
  const trimmedA = userAId.trim();
  const trimmedB = userBId.trim();

  if (!trimmedA || !trimmedB) {
    throw new Error('Both user IDs must be non-empty strings.');
  }

  if (trimmedA === trimmedB) {
    throw new Error('Cannot create a 1:1 conversation pair key with the same user ID.');
  }

  return [trimmedA, trimmedB].sort().join(':');
}
