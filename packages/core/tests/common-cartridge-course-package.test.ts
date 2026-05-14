import {
  CourseBackup,
  type CourseBackup as CourseBackupContract,
  CourseId,
  TenantId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  CommonCartridgeParseError,
  exportCourseBackupAsCommonCartridge,
  parseCommonCartridgeCoursePackage,
} from '../src/common-cartridge/course-package.ts';

const tenantId = TenantId.parse('01J9QW7B6N5W2YH3D3A1V0KE85');
const courseId = CourseId.parse('01J9QW7B6N5W2YH3D3A1V0KE86');
const now = new Date('2026-05-12T00:00:00.000Z');

const sampleBackup = (): CourseBackupContract =>
  CourseBackup.parse({
    formatVersion: '1',
    exportedAt: now,
    course: {
      id: courseId,
      tenantId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'active',
      startsAt: null,
      endsAt: null,
      createdAt: now,
      updatedAt: now,
    },
    learningObjectives: [
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE91',
        tenantId,
        courseId,
        code: 'LO-1',
        title: 'Use evidence',
        description: 'Select relevant evidence.',
        status: 'active',
        position: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    modules: [
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE92',
        tenantId,
        courseId,
        title: 'Evidence module',
        summary: 'Finding and explaining evidence.',
        visibility: 'published',
        accessPolicy: 'course_member',
        version: 1,
        position: 0,
        learningObjectiveIds: ['01J9QW7B6N5W2YH3D3A1V0KE91'],
        createdAt: now,
        updatedAt: now,
      },
    ],
    units: [
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE93',
        tenantId,
        courseId,
        moduleId: '01J9QW7B6N5W2YH3D3A1V0KE92',
        title: 'Evidence unit',
        summary: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        version: 1,
        position: 0,
        learningObjectiveIds: ['01J9QW7B6N5W2YH3D3A1V0KE91'],
        createdAt: now,
        updatedAt: now,
      },
    ],
    pages: [
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE94',
        tenantId,
        courseId,
        title: 'Overview',
        body: '<p>Read the overview.</p>',
        visibility: 'published',
        version: 1,
        learningObjectiveIds: ['01J9QW7B6N5W2YH3D3A1V0KE91'],
        createdAt: now,
        updatedAt: now,
      },
    ],
    resources: [
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE95',
        tenantId,
        courseId,
        moduleId: '01J9QW7B6N5W2YH3D3A1V0KE92',
        unitId: '01J9QW7B6N5W2YH3D3A1V0KE93',
        resourceType: 'reading_material',
        title: 'Reading',
        body: '<p>Evidence reading.</p>',
        sourceUri: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        version: 1,
        position: 0,
        learningObjectiveIds: ['01J9QW7B6N5W2YH3D3A1V0KE91'],
        createdAt: now,
        updatedAt: now,
      },
    ],
  });

describe('Common Cartridge course package mapping', () => {
  it('exports a course backup as an IMSCC manifest with HTML files', () => {
    const cartridge = exportCourseBackupAsCommonCartridge(sampleBackup(), now);

    expect(cartridge.format).toBe('imscc_1_3');
    expect(cartridge.manifestXml).toContain('<manifest');
    expect(cartridge.manifestXml).toContain('imsmanifest.xml');
    expect(cartridge.manifestXml).toContain('pages/overview.html');
    expect(cartridge.files.map((file) => file.path)).toContain('resources/reading.html');
  });

  it('keeps duplicate content titles on distinct package file paths', () => {
    const backup = CourseBackup.parse({
      ...sampleBackup(),
      pages: [
        ...sampleBackup().pages,
        {
          ...sampleBackup().pages[0],
          id: '01J9QW7B6N5W2YH3D3A1V0KE96',
          body: '<p>Second overview.</p>',
        },
      ],
      resources: [
        ...sampleBackup().resources,
        {
          ...sampleBackup().resources[0],
          id: '01J9QW7B6N5W2YH3D3A1V0KE97',
          body: '<p>Second reading.</p>',
          position: 1,
        },
      ],
    });

    const cartridge = exportCourseBackupAsCommonCartridge(backup, now);
    const paths = cartridge.files.map((file) => file.path);
    const restored = parseCommonCartridgeCoursePackage({
      package: cartridge,
      tenantId,
      courseId,
      now,
    });

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toEqual([
      'pages/overview.html',
      'pages/overview-2.html',
      'resources/reading.html',
      'resources/reading-2.html',
    ]);
    expect(restored.pages.map((page) => page.body)).toContain('<p>Second overview.</p>');
    expect(restored.resources.map((resource) => resource.body)).toContain('<p>Second reading.</p>');
  });

  it('rejects invalid Open LMS enum attributes as Common Cartridge parse errors', () => {
    const cartridge = exportCourseBackupAsCommonCartridge(sampleBackup(), now);

    expect(() =>
      parseCommonCartridgeCoursePackage({
        package: {
          ...cartridge,
          manifestXml: cartridge.manifestXml.replace(
            'openlms:visibility="published"',
            'openlms:visibility="hidden"',
          ),
        },
        tenantId,
        courseId,
        now,
      }),
    ).toThrow(CommonCartridgeParseError);
  });

  it('parses the supported IMSCC subset back into a restorable course backup', () => {
    const cartridge = exportCourseBackupAsCommonCartridge(sampleBackup(), now);
    const backup = parseCommonCartridgeCoursePackage({
      package: cartridge,
      tenantId,
      courseId,
      now,
    });

    expect(backup.course.title).toBe('Evidence-Based Writing');
    expect(backup.modules.map((module) => module.title)).toEqual(['Evidence module']);
    expect(backup.units.map((unit) => unit.title)).toEqual(['Evidence unit']);
    expect(backup.pages.map((page) => page.title)).toEqual(['Overview']);
    expect(backup.resources.map((resource) => resource.title)).toEqual(['Reading']);
  });
});
