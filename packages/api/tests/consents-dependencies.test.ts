import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  appendConsent: vi.fn(),
  listConsentsForSubject: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    appendConsent: coreMocks.appendConsent,
    listConsentsForSubject: coreMocks.listConsentsForSubject,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEH0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEH1';
const consentId = '01J9QW7B6N5W2YH3D3A1V0KEH2';
const now = new Date('2026-05-10T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

const sampleConsentRecord = () => ({
  id: consentId,
  tenantId,
  subjectId: actorUserId,
  actionType: 'ai_analysis' as const,
  scope: 'tenant' as const,
  scopeId: tenantId,
  state: 'granted' as const,
  grantedBy: 'subject' as const,
  grantedAt: now,
  revokedAt: null,
  expiresAt: null,
  evidence: null,
  createdAt: now,
  updatedAt: now,
});

describe('list my consents API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listConsentsForSubject.mockResolvedValue([sampleConsentRecord()]);
  });

  it('returns the actor’s consents when they are a tenant member', async () => {
    setActorRole('student');
    const dependencies = createDependencies();

    const consents = await dependencies.listMyConsents(actorUserId, tenantId);

    expect(consents).toHaveLength(1);
    expect(consents[0]).toMatchObject({ subjectId: actorUserId, state: 'granted' });
    expect(coreMocks.listConsentsForSubject).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      actorUserId,
    );
  });

  it('rejects non-members with forbidden', async () => {
    setActorRole(null);
    const dependencies = createDependencies();

    await expect(dependencies.listMyConsents(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });
    expect(coreMocks.listConsentsForSubject).not.toHaveBeenCalled();
  });
});

describe('record my consent API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.appendConsent.mockResolvedValue(sampleConsentRecord());
  });

  it('appends a consent record for the actor', async () => {
    setActorRole('student');
    const dependencies = createDependencies();

    const result = await dependencies.recordMyConsent(actorUserId, tenantId, {
      actionType: 'ai_analysis',
      scope: 'tenant',
      scopeId: tenantId,
      state: 'granted',
      expiresAt: null,
      evidence: null,
    });

    expect(result).toMatchObject({ state: 'granted', actionType: 'ai_analysis' });
    expect(coreMocks.appendConsent).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      subjectId: actorUserId,
      actionType: 'ai_analysis',
      scope: 'tenant',
      scopeId: tenantId,
      state: 'granted',
      expiresAt: null,
      evidence: null,
    });
  });

  it('rejects non-members with forbidden', async () => {
    setActorRole(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.recordMyConsent(actorUserId, tenantId, {
        actionType: 'ai_analysis',
        scope: 'tenant',
        scopeId: tenantId,
        state: 'granted',
        expiresAt: null,
        evidence: null,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect(coreMocks.appendConsent).not.toHaveBeenCalled();
  });
});
