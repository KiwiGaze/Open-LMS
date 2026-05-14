import { describe, expect, it } from 'vitest';
import {
  CommonCartridgeCourseExport,
  CommonCartridgeImportRequest,
  CommonCartridgeImportResult,
} from '../src/index.ts';

const now = new Date('2026-05-12T00:00:00.000Z');

describe('Common Cartridge contracts', () => {
  it('models an IMS Common Cartridge course export envelope', () => {
    const cartridge = CommonCartridgeCourseExport.parse({
      format: 'imscc_1_3',
      exportedAt: now,
      manifestXml: '<manifest identifier="openlms-course"></manifest>',
      files: [
        {
          path: 'pages/overview.html',
          contentType: 'text/html',
          content: '<h1>Overview</h1>',
        },
      ],
    });

    expect(cartridge.files[0]?.path).toBe('pages/overview.html');
  });

  it('models an IMS Common Cartridge import request and result', () => {
    const request = CommonCartridgeImportRequest.parse({
      format: 'imscc_1_3',
      manifestXml: '<manifest identifier="openlms-course"></manifest>',
      files: [],
    });
    const result = CommonCartridgeImportResult.parse({
      format: 'imscc_1_3',
      learningObjectivesRestored: 1,
      modulesRestored: 1,
      unitsRestored: 1,
      pagesRestored: 1,
      resourcesRestored: 1,
    });

    expect(request.format).toBe('imscc_1_3');
    expect(result.resourcesRestored).toBe(1);
  });
});
