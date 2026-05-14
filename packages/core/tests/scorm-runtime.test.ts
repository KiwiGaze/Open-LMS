import {
  type ScormAttempt,
  ScormAttemptId,
  ScormPackageId,
  type ScormRuntimeValueMap,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  applyScormRuntimeCommit,
  buildInitialScormRuntimeAttempt,
  buildScormRuntimeBridgeScript,
  buildScormRuntimeState,
} from '../src/scorm/runtime.ts';

const tenantId = TenantId.parse('01J9QW7B6N5W2YH3D3A1V0KE70');
const scormPackageId = ScormPackageId.parse('01J9QW7B6N5W2YH3D3A1V0KE72');
const studentId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE78');
const now = new Date('2026-05-12T00:00:00.000Z');

const attempt = (overrides: Partial<ScormAttempt> = {}): ScormAttempt => ({
  id: ScormAttemptId.parse('01J9QW7B6N5W2YH3D3A1V0KE77'),
  tenantId,
  scormPackageId,
  studentId,
  completionStatus: 'incomplete',
  successStatus: 'unknown',
  scoreScaled: null,
  totalTimeSeconds: null,
  suspendData: null,
  lastVisitedAt: now,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('SCORM runtime bridge mapping', () => {
  it('builds an initial attempt snapshot for LMSInitialize', () => {
    const snapshot = buildInitialScormRuntimeAttempt({
      tenantId,
      scormPackageId,
      studentId,
      now,
    });

    expect(snapshot).toEqual({
      tenantId,
      scormPackageId,
      studentId,
      completionStatus: 'incomplete',
      successStatus: 'unknown',
      scoreScaled: null,
      totalTimeSeconds: null,
      suspendData: null,
      lastVisitedAt: now,
    });
  });

  it('projects persisted attempts into LMSGetValue-compatible state', () => {
    const state = buildScormRuntimeState(
      attempt({
        completionStatus: 'completed',
        successStatus: 'passed',
        scoreScaled: 0.87,
        totalTimeSeconds: 750,
        suspendData: 'bookmark=section-2',
      }),
    );

    expect(state.values).toEqual({
      'cmi.core.lesson_status': 'passed',
      'cmi.core.score.raw': '87',
      'cmi.core.total_time': '0000:12:30.00',
      'cmi.suspend_data': 'bookmark=section-2',
      'cmi.core.entry': 'resume',
      'cmi.completion_status': 'completed',
      'cmi.success_status': 'passed',
      'cmi.score.scaled': '0.87',
      'cmi.total_time': 'PT12M30S',
      'cmi.entry': 'resume',
    });
  });

  it('applies LMSSetValue data during LMSCommit without double-counting existing total time', () => {
    const input = applyScormRuntimeCommit({
      attempt: attempt({ totalTimeSeconds: 60 }),
      values: {
        'cmi.core.lesson_status': 'passed',
        'cmi.core.score.raw': '87',
        'cmi.core.session_time': '0000:12:30.00',
        'cmi.suspend_data': 'bookmark=section-2',
      },
      now,
    });

    expect(input).toEqual({
      tenantId,
      scormPackageId,
      studentId,
      completionStatus: 'completed',
      successStatus: 'passed',
      scoreScaled: 0.87,
      totalTimeSeconds: 810,
      suspendData: 'bookmark=section-2',
      lastVisitedAt: now,
    });
  });

  it('applies SCORM 2004 SetValue data during Commit without double-counting total time', () => {
    const input = applyScormRuntimeCommit({
      attempt: attempt({ totalTimeSeconds: 60 }),
      values: {
        'cmi.completion_status': 'completed',
        'cmi.success_status': 'passed',
        'cmi.score.scaled': '0.87',
        'cmi.session_time': 'PT12M30S',
        'cmi.suspend_data': 'bookmark=section-2',
      },
      now,
    });

    expect(input).toEqual({
      tenantId,
      scormPackageId,
      studentId,
      completionStatus: 'completed',
      successStatus: 'passed',
      scoreScaled: 0.87,
      totalTimeSeconds: 810,
      suspendData: 'bookmark=section-2',
      lastVisitedAt: now,
    });
  });

  it('rejects unsupported SCORM runtime data model elements', () => {
    expect(() =>
      applyScormRuntimeCommit({
        attempt: attempt(),
        values: {
          'cmi.core.lesson_location': 'slide-7',
        } as unknown as ScormRuntimeValueMap,
        now,
      }),
    ).toThrow(/not supported/);
  });

  it('builds a SCORM 1.2 JavaScript bridge for legacy package launches', () => {
    const script = buildScormRuntimeBridgeScript({
      initializeUrl:
        '/api/v1/tenants/tenant-1/courses/course-1/scorm-packages/package-1/runtime/initialize',
      commitUrl:
        '/api/v1/tenants/tenant-1/courses/course-1/scorm-packages/package-1/runtime/commit',
      finishUrl:
        '/api/v1/tenants/tenant-1/courses/course-1/scorm-packages/package-1/runtime/finish',
    });

    expect(script).toContain('window.API');
    expect(script).toContain('LMSInitialize');
    expect(script).toContain('LMSGetValue');
    expect(script).toContain('LMSSetValue');
    expect(script).toContain('LMSCommit');
    expect(script).toContain('LMSFinish');
    expect(script).toContain('window.API_1484_11');
    expect(script).toContain('Terminate');
    expect(script).toContain('window.OpenLmsScormBridge');
    expect(script).toContain('configure(options)');
    expect(script).toContain('/runtime/initialize');
    expect(script).toContain('/runtime/commit');
    expect(script).toContain('/runtime/finish');
    expect(script).toContain('Authorization');
  });

  it('runs initialize, commit, and finish through synchronous SCORM 1.2 calls', () => {
    type ScormBridgeApi = {
      LMSInitialize(argument?: string): string;
      LMSGetValue(element: string): string;
      LMSSetValue(element: string, value: string): string;
      LMSCommit(argument?: string): string;
      LMSFinish(argument?: string): string;
      LMSGetLastError(): string;
    };
    type ScormBridgeWindow = {
      API?: ScormBridgeApi;
      OpenLmsScormBridge?: {
        configure(options: { authorization?: string | null }): void;
      };
    };
    type BridgeRequest = {
      method: string;
      url: string;
      asyncRequest: boolean;
      headers: Record<string, string>;
      body: string | null;
    };
    type RuntimeResponse = { values: Record<string, string> };

    const requests: BridgeRequest[] = [];
    const responses: Record<string, RuntimeResponse> = {
      '/runtime/initialize': {
        values: {
          'cmi.core.lesson_status': 'incomplete',
          'cmi.core.total_time': '0000:00:00.00',
        },
      },
      '/runtime/commit': {
        values: {
          'cmi.core.lesson_status': 'completed',
          'cmi.core.total_time': '0000:05:00.00',
        },
      },
      '/runtime/finish': {
        values: {
          'cmi.core.lesson_status': 'completed',
          'cmi.core.total_time': '0000:05:00.00',
        },
      },
    };

    class FakeXMLHttpRequest {
      status = 200;
      responseText = '{}';
      private method = '';
      private url = '';
      private asyncRequest = true;
      private readonly headers: Record<string, string> = {};

      open(method: string, url: string, asyncRequest: boolean): void {
        this.method = method;
        this.url = url;
        this.asyncRequest = asyncRequest;
      }

      setRequestHeader(name: string, value: string): void {
        this.headers[name] = value;
      }

      send(body: string | null): void {
        requests.push({
          method: this.method,
          url: this.url,
          asyncRequest: this.asyncRequest,
          headers: { ...this.headers },
          body,
        });
        this.responseText = JSON.stringify(responses[this.url]);
      }
    }

    const script = buildScormRuntimeBridgeScript({
      initializeUrl: '/runtime/initialize',
      commitUrl: '/runtime/commit',
      finishUrl: '/runtime/finish',
    });
    const bridgeWindow: ScormBridgeWindow = {};
    const executeBridge = new Function('window', 'XMLHttpRequest', script) as (
      window: ScormBridgeWindow,
      XMLHttpRequest: typeof FakeXMLHttpRequest,
    ) => void;

    executeBridge(bridgeWindow, FakeXMLHttpRequest);

    if (!bridgeWindow.API || !bridgeWindow.OpenLmsScormBridge) {
      throw new Error('SCORM bridge did not register window.API.');
    }

    bridgeWindow.OpenLmsScormBridge.configure({ authorization: 'Bearer runtime-token' });

    expect(bridgeWindow.API.LMSInitialize('')).toBe('true');
    expect(bridgeWindow.API.LMSGetValue('cmi.core.lesson_status')).toBe('incomplete');
    expect(bridgeWindow.API.LMSSetValue('cmi.core.lesson_status', 'completed')).toBe('true');
    expect(bridgeWindow.API.LMSCommit('')).toBe('true');
    expect(bridgeWindow.API.LMSFinish('')).toBe('true');
    expect(bridgeWindow.API.LMSGetLastError()).toBe('0');
    expect(requests.map((request) => request.asyncRequest)).toEqual([false, false, false]);
    expect(requests.map((request) => request.url)).toEqual([
      '/runtime/initialize',
      '/runtime/commit',
      '/runtime/finish',
    ]);
    expect(requests.map((request) => request.headers.Authorization)).toEqual([
      'Bearer runtime-token',
      'Bearer runtime-token',
      'Bearer runtime-token',
    ]);

    const commitBody = JSON.parse(requests[1]?.body ?? '{}') as {
      values: Record<string, string>;
    };
    expect(commitBody.values['cmi.core.lesson_status']).toBe('completed');
    expect(commitBody.values['cmi.core.total_time']).toBeUndefined();
  });

  it('runs initialize, commit, and terminate through synchronous SCORM 2004 calls', () => {
    type Scorm2004BridgeApi = {
      Initialize(argument?: string): string;
      GetValue(element: string): string;
      SetValue(element: string, value: string): string;
      Commit(argument?: string): string;
      Terminate(argument?: string): string;
      GetLastError(): string;
    };
    type ScormBridgeWindow = {
      API_1484_11?: Scorm2004BridgeApi;
      OpenLmsScormBridge?: {
        configure(options: { authorization?: string | null }): void;
      };
    };
    type BridgeRequest = {
      url: string;
      asyncRequest: boolean;
      headers: Record<string, string>;
      body: string | null;
    };
    type RuntimeResponse = { values: Record<string, string> };

    const requests: BridgeRequest[] = [];
    const responses: Record<string, RuntimeResponse> = {
      '/runtime/initialize': {
        values: {
          'cmi.completion_status': 'incomplete',
          'cmi.total_time': 'PT0S',
        },
      },
      '/runtime/commit': {
        values: {
          'cmi.completion_status': 'completed',
          'cmi.total_time': 'PT5M',
        },
      },
      '/runtime/finish': {
        values: {
          'cmi.completion_status': 'completed',
          'cmi.total_time': 'PT5M',
        },
      },
    };

    class FakeXMLHttpRequest {
      status = 200;
      responseText = '{}';
      private url = '';
      private asyncRequest = true;
      private readonly headers: Record<string, string> = {};

      open(_method: string, url: string, asyncRequest: boolean): void {
        this.url = url;
        this.asyncRequest = asyncRequest;
      }

      setRequestHeader(name: string, value: string): void {
        this.headers[name] = value;
      }

      send(body: string | null): void {
        requests.push({
          url: this.url,
          asyncRequest: this.asyncRequest,
          headers: { ...this.headers },
          body,
        });
        this.responseText = JSON.stringify(responses[this.url]);
      }
    }

    const script = buildScormRuntimeBridgeScript({
      initializeUrl: '/runtime/initialize',
      commitUrl: '/runtime/commit',
      finishUrl: '/runtime/finish',
    });
    const bridgeWindow: ScormBridgeWindow = {};
    const executeBridge = new Function('window', 'XMLHttpRequest', script) as (
      window: ScormBridgeWindow,
      XMLHttpRequest: typeof FakeXMLHttpRequest,
    ) => void;

    executeBridge(bridgeWindow, FakeXMLHttpRequest);

    if (!bridgeWindow.API_1484_11 || !bridgeWindow.OpenLmsScormBridge) {
      throw new Error('SCORM 2004 bridge did not register window.API_1484_11.');
    }

    bridgeWindow.OpenLmsScormBridge.configure({ authorization: 'Bearer runtime-token' });

    expect(bridgeWindow.API_1484_11.Initialize('')).toBe('true');
    expect(bridgeWindow.API_1484_11.GetValue('cmi.completion_status')).toBe('incomplete');
    expect(bridgeWindow.API_1484_11.SetValue('cmi.completion_status', 'completed')).toBe('true');
    expect(bridgeWindow.API_1484_11.Commit('')).toBe('true');
    expect(bridgeWindow.API_1484_11.Terminate('')).toBe('true');
    expect(bridgeWindow.API_1484_11.GetLastError()).toBe('0');
    expect(requests.map((request) => request.asyncRequest)).toEqual([false, false, false]);
    expect(requests.map((request) => request.url)).toEqual([
      '/runtime/initialize',
      '/runtime/commit',
      '/runtime/finish',
    ]);
    expect(requests.map((request) => request.headers.Authorization)).toEqual([
      'Bearer runtime-token',
      'Bearer runtime-token',
      'Bearer runtime-token',
    ]);

    const commitBody = JSON.parse(requests[1]?.body ?? '{}') as {
      values: Record<string, string>;
    };
    expect(commitBody.values['cmi.completion_status']).toBe('completed');
    expect(commitBody.values['cmi.total_time']).toBeUndefined();
  });
});
