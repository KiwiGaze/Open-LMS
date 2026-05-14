import { describe, expect, it } from 'vitest';
import { CourseCredential, CredentialAward } from '../src/credential.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const credentialId = '01J9QW7B6N5W2YH3D3A1V0KE4R';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

describe('credential contracts', () => {
  it('accepts course badges and certificates', () => {
    expect(
      CourseCredential.parse({
        id: credentialId,
        tenantId,
        courseId,
        credentialType: 'certificate',
        title: 'Evidence writing certificate',
        description: 'Issued when a student completes the evidence writing course.',
        criteriaSummary: 'Complete all required activities.',
        status: 'published',
        imageUrl: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      id: credentialId,
      credentialType: 'certificate',
      status: 'published',
    });
  });

  it('accepts student credential awards', () => {
    expect(
      CredentialAward.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE4S',
        tenantId,
        credentialId,
        studentId,
        status: 'issued',
        issuedAt: now,
        revokedAt: null,
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      credentialId,
      studentId,
      status: 'issued',
      issuedAt: now,
    });
  });
});
