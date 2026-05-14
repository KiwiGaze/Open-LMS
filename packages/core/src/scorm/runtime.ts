import type {
  ScormAttempt,
  ScormCompletionStatus,
  ScormRuntimeState,
  ScormRuntimeValueMap,
  ScormSuccessStatus,
} from '@openlms/contracts';

export type ScormRuntimeAttemptInput = {
  tenantId: string;
  scormPackageId: string;
  studentId: string;
  completionStatus: ScormCompletionStatus;
  successStatus: ScormSuccessStatus;
  scoreScaled: number | null;
  totalTimeSeconds: number | null;
  suspendData: string | null;
  lastVisitedAt: Date | null;
};

export const buildInitialScormRuntimeAttempt = (input: {
  tenantId: string;
  scormPackageId: string;
  studentId: string;
  now: Date;
}): ScormRuntimeAttemptInput => ({
  tenantId: input.tenantId,
  scormPackageId: input.scormPackageId,
  studentId: input.studentId,
  completionStatus: 'incomplete',
  successStatus: 'unknown',
  scoreScaled: null,
  totalTimeSeconds: null,
  suspendData: null,
  lastVisitedAt: input.now,
});

const formatScormTime = (seconds: number | null): string => {
  const totalSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${hours.toString().padStart(4, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.00`;
};

const formatScorm2004Time = (seconds: number | null): string => {
  const totalSeconds = Math.max(0, Math.floor(seconds ?? 0));
  if (totalSeconds === 0) {
    return 'PT0S';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const parts = ['PT'];

  if (hours > 0) {
    parts.push(`${hours}H`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}M`);
  }
  if (remainingSeconds > 0) {
    parts.push(`${remainingSeconds}S`);
  }

  return parts.join('');
};

const parseScormTime = (value: string): number => {
  const match = /^(\d{2,}):([0-5]\d):([0-5]\d)(?:\.\d{1,2})?$/.exec(value);

  if (!match) {
    throw new Error('SCORM session time must use HHHH:MM:SS.cc format.');
  }

  const [, hours, minutes, seconds] = match;

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

const parseScorm2004Time = (value: string): number => {
  const match = /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(value);

  if (!match || match.slice(1).every((part) => part === undefined)) {
    throw new Error('SCORM 2004 session time must use PT#H#M#S duration format.');
  }

  const [, hours = '0', minutes = '0', seconds = '0'] = match;

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

const lessonStatusForAttempt = (attempt: ScormAttempt): string => {
  if (attempt.successStatus === 'passed') {
    return 'passed';
  }

  if (attempt.successStatus === 'failed') {
    return 'failed';
  }

  if (attempt.completionStatus === 'completed') {
    return 'completed';
  }

  if (attempt.completionStatus === 'not_attempted') {
    return 'not attempted';
  }

  return 'incomplete';
};

const completionStatusForAttempt = (attempt: ScormAttempt): string => {
  if (attempt.completionStatus === 'completed') {
    return 'completed';
  }
  if (attempt.completionStatus === 'not_attempted') {
    return 'not attempted';
  }
  return 'incomplete';
};

const applyLessonStatus = (
  value: string,
): { completionStatus: ScormCompletionStatus; successStatus: ScormSuccessStatus } => {
  switch (value) {
    case 'passed':
      return { completionStatus: 'completed', successStatus: 'passed' };
    case 'failed':
      return { completionStatus: 'completed', successStatus: 'failed' };
    case 'completed':
      return { completionStatus: 'completed', successStatus: 'unknown' };
    case 'incomplete':
    case 'browsed':
      return { completionStatus: 'incomplete', successStatus: 'unknown' };
    case 'not attempted':
      return { completionStatus: 'not_attempted', successStatus: 'unknown' };
    default:
      throw new Error(
        'SCORM cmi.core.lesson_status must be passed, completed, failed, incomplete, browsed, or not attempted.',
      );
  }
};

const applyCompletionStatus = (value: string): ScormCompletionStatus => {
  switch (value) {
    case 'completed':
      return 'completed';
    case 'not attempted':
      return 'not_attempted';
    case 'incomplete':
    case 'unknown':
      return 'incomplete';
    default:
      throw new Error(
        'SCORM cmi.completion_status must be completed, incomplete, not attempted, or unknown.',
      );
  }
};

const applySuccessStatus = (value: string): ScormSuccessStatus => {
  switch (value) {
    case 'passed':
      return 'passed';
    case 'failed':
      return 'failed';
    case 'unknown':
      return 'unknown';
    default:
      throw new Error('SCORM cmi.success_status must be passed, failed, or unknown.');
  }
};

const scoreRawForAttempt = (attempt: ScormAttempt): string | undefined => {
  if (attempt.scoreScaled === null) {
    return undefined;
  }

  return Number((attempt.scoreScaled * 100).toFixed(3)).toString();
};

const parseRawScore = (value: string): number => {
  const rawScore = Number(value);

  if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > 100) {
    throw new Error('SCORM cmi.core.score.raw must be a number from 0 through 100.');
  }

  return rawScore / 100;
};

const parseScaledScore = (value: string): number => {
  const scaledScore = Number(value);

  if (!Number.isFinite(scaledScore) || scaledScore < 0 || scaledScore > 1) {
    throw new Error('SCORM cmi.score.scaled must be a number from 0 through 1.');
  }

  return scaledScore;
};

export const buildScormRuntimeState = (attempt: ScormAttempt): ScormRuntimeState => {
  const values: ScormRuntimeValueMap = {
    'cmi.core.lesson_status': lessonStatusForAttempt(attempt),
    'cmi.core.total_time': formatScormTime(attempt.totalTimeSeconds),
    'cmi.suspend_data': attempt.suspendData ?? '',
    'cmi.core.entry': attempt.suspendData ? 'resume' : '',
    'cmi.completion_status': completionStatusForAttempt(attempt),
    'cmi.success_status': attempt.successStatus,
    'cmi.total_time': formatScorm2004Time(attempt.totalTimeSeconds),
    'cmi.entry': attempt.suspendData ? 'resume' : '',
  };
  const rawScore = scoreRawForAttempt(attempt);

  if (rawScore !== undefined) {
    values['cmi.core.score.raw'] = rawScore;
    values['cmi.score.scaled'] = attempt.scoreScaled?.toString() ?? rawScore;
  }

  return { attempt, values };
};

export const applyScormRuntimeCommit = (input: {
  attempt: ScormRuntimeAttemptInput;
  values: ScormRuntimeValueMap;
  now: Date;
}): ScormRuntimeAttemptInput => {
  let completionStatus = input.attempt.completionStatus;
  let successStatus = input.attempt.successStatus;
  let scoreScaled = input.attempt.scoreScaled;
  let totalTimeSeconds = input.attempt.totalTimeSeconds;
  let suspendData = input.attempt.suspendData;

  for (const [element, value] of Object.entries(input.values)) {
    switch (element) {
      case 'cmi.core.lesson_status': {
        const status = applyLessonStatus(value);
        completionStatus = status.completionStatus;
        successStatus = status.successStatus;
        break;
      }
      case 'cmi.core.score.raw':
        scoreScaled = parseRawScore(value);
        break;
      case 'cmi.core.session_time':
        totalTimeSeconds = (totalTimeSeconds ?? 0) + parseScormTime(value);
        break;
      case 'cmi.completion_status':
        completionStatus = applyCompletionStatus(value);
        break;
      case 'cmi.success_status':
        successStatus = applySuccessStatus(value);
        break;
      case 'cmi.score.scaled':
        scoreScaled = parseScaledScore(value);
        break;
      case 'cmi.session_time':
        totalTimeSeconds = (totalTimeSeconds ?? 0) + parseScorm2004Time(value);
        break;
      case 'cmi.suspend_data':
        suspendData = value.length === 0 ? null : value;
        break;
      case 'cmi.entry':
      case 'cmi.total_time':
      case 'cmi.core.entry':
      case 'cmi.core.total_time':
        throw new Error(`SCORM runtime element ${element} is read-only.`);
      default:
        throw new Error(`SCORM runtime element ${element} is not supported yet.`);
    }
  }

  return {
    tenantId: input.attempt.tenantId,
    scormPackageId: input.attempt.scormPackageId,
    studentId: input.attempt.studentId,
    completionStatus,
    successStatus,
    scoreScaled,
    totalTimeSeconds,
    suspendData,
    lastVisitedAt: input.now,
  };
};

export type BuildScormRuntimeBridgeScriptInput = {
  initializeUrl: string;
  commitUrl: string;
  finishUrl: string;
};

export const buildScormRuntimeBridgeScript = (
  input: BuildScormRuntimeBridgeScriptInput,
): string => {
  const config = JSON.stringify({
    initializeUrl: input.initializeUrl,
    commitUrl: input.commitUrl,
    finishUrl: input.finishUrl,
  });

  return `(() => {
  "use strict";

  const endpoints = ${config};
  const runtime = {
    values: {},
    dirtyValues: {},
    authorization: null,
    initialized: false,
    finished: false,
    lastError: "0"
  };

  const errorStrings = {
    "0": "No error",
    "101": "General exception",
    "201": "Invalid argument error",
    "301": "Not initialized",
    "401": "Not implemented error"
  };

  const setError = (code) => {
    runtime.lastError = code;
    return code === "0" ? "true" : "false";
  };

  const request = (method, url, body) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    xhr.setRequestHeader("content-type", "application/json");
    if (runtime.authorization) {
      xhr.setRequestHeader("Authorization", runtime.authorization);
    }
    xhr.send(body === undefined ? null : JSON.stringify(body));
    if (xhr.status < 200 || xhr.status >= 300) {
      throw new Error("SCORM runtime request failed with status " + xhr.status + ".");
    }
    return JSON.parse(xhr.responseText);
  };

  const requireInitialized = () => {
    if (!runtime.initialized || runtime.finished) {
      setError("301");
      return false;
    }
    return true;
  };

  const commit = (url) => {
    if (!requireInitialized()) {
      return "false";
    }
    try {
      const state = request("POST", url, { values: runtime.dirtyValues });
      runtime.values = { ...state.values };
      runtime.dirtyValues = {};
      return setError("0");
    } catch {
      return setError("101");
    }
  };

  const api = {
    LMSInitialize() {
      if (runtime.initialized && !runtime.finished) {
        return setError("101");
      }
      try {
        const state = request("POST", endpoints.initializeUrl);
        runtime.values = { ...state.values };
        runtime.initialized = true;
        runtime.finished = false;
        return setError("0");
      } catch {
        return setError("101");
      }
    },
    LMSFinish() {
      const result = commit(endpoints.finishUrl);
      if (result === "true") {
        runtime.finished = true;
      }
      return result;
    },
    LMSGetValue(element) {
      if (!requireInitialized()) {
        return "";
      }
      if (typeof element !== "string" || element.length === 0) {
        setError("201");
        return "";
      }
      setError("0");
      return runtime.values[element] ?? "";
    },
    LMSSetValue(element, value) {
      if (!requireInitialized()) {
        return "false";
      }
      if (typeof element !== "string" || element.length === 0) {
        return setError("201");
      }
      runtime.values[element] = String(value ?? "");
      runtime.dirtyValues[element] = runtime.values[element];
      return setError("0");
    },
    LMSCommit() {
      return commit(endpoints.commitUrl);
    },
    LMSGetLastError() {
      return runtime.lastError;
    },
    LMSGetErrorString(code) {
      return errorStrings[String(code)] ?? "Unknown SCORM runtime error";
    },
    LMSGetDiagnostic(code) {
      return this.LMSGetErrorString(code || runtime.lastError);
    }
  };

  const api2004 = {
    Initialize(argument) {
      return api.LMSInitialize(argument);
    },
    Terminate(argument) {
      return api.LMSFinish(argument);
    },
    GetValue(element) {
      return api.LMSGetValue(element);
    },
    SetValue(element, value) {
      return api.LMSSetValue(element, value);
    },
    Commit(argument) {
      return api.LMSCommit(argument);
    },
    GetLastError() {
      return api.LMSGetLastError();
    },
    GetErrorString(code) {
      return api.LMSGetErrorString(code);
    },
    GetDiagnostic(code) {
      return api.LMSGetErrorString(code || runtime.lastError);
    }
  };

  window.OpenLmsScormBridge = {
    configure(options) {
      runtime.authorization =
        options && typeof options.authorization === "string" ? options.authorization : null;
    },
    getValues() {
      return { ...runtime.values };
    }
  };
  window.API = api;
  window.API_1484_11 = api2004;
})();`;
};
