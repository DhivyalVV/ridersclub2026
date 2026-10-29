import { describe, expect, it } from 'vitest';
import {
  buildConversationPairKey,
  HelpRequestStatus,
  MechanicVerificationStatus,
  UserRole,
} from '../index.js';

describe('@ridersclub/types shared contracts', () => {
  it('generates identical canonical conversation pair keys regardless of argument order', () => {
    const key1 = buildConversationPairKey('user-uuid-999', 'user-uuid-111');
    const key2 = buildConversationPairKey('user-uuid-111', 'user-uuid-999');

    expect(key1).toBe('user-uuid-111:user-uuid-999');
    expect(key1).toBe(key2);
  });

  it('throws when attempting to create a conversation pair key with identical user IDs', () => {
    expect(() => buildConversationPairKey('user-1', 'user-1')).toThrow(
      'Cannot create a 1:1 conversation pair key with the same user ID.',
    );
  });

  it('exposes explicit security-critical role and verification enums', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(MechanicVerificationStatus.UNVERIFIED).toBe('UNVERIFIED');
    expect(HelpRequestStatus.OPEN).toBe('OPEN');
  });
});

