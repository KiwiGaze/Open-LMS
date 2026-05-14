import {
  CommonCartridgeCourseExport,
  type CommonCartridgeCourseExport as CommonCartridgeCourseExportContract,
  type CommonCartridgeFile,
  type CommonCartridgeImportRequest,
  CourseBackup,
  type CourseBackup as CourseBackupContract,
  type CourseContentAccessPolicy,
  CourseContentAccessPolicy as CourseContentAccessPolicySchema,
  type CourseContentVisibility,
  CourseContentVisibility as CourseContentVisibilitySchema,
  CourseId,
  CourseModuleId,
  CoursePageId,
  type CoursePageVisibility,
  CoursePageVisibility as CoursePageVisibilitySchema,
  CourseResourceId,
  type CourseResourceType,
  CourseResourceType as CourseResourceTypeSchema,
  CourseStatus,
  CourseUnitId,
  LearningObjectiveId,
  type LearningObjectiveId as LearningObjectiveIdContract,
  type LearningObjectiveStatus,
  LearningObjectiveStatus as LearningObjectiveStatusSchema,
  TenantId,
} from '@openlms/contracts';
import { ulid } from 'ulid';

export class CommonCartridgeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommonCartridgeParseError';
  }
}

export type ParseCommonCartridgeCoursePackageInput = {
  package: CommonCartridgeImportRequest;
  tenantId: string;
  courseId: string;
  now?: Date;
};

type ManifestTextNode = {
  kind: 'text';
  text: string;
};

type ManifestElementNode = {
  kind: 'element';
  name: string;
  attributes: Record<string, string>;
  children: ManifestNode[];
};

type ManifestNode = ManifestTextNode | ManifestElementNode;
type EnumSchema<T extends string> = {
  safeParse: (value: unknown) => { success: true; data: T } | { success: false };
};

const imsccNamespace = 'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1';
const openLmsNamespace = 'https://open-lms.local/common-cartridge';

const slug = (value: string): string => {
  const normalized = value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized.length > 0 ? normalized.slice(0, 80) : 'item';
};

const escapeXmlText = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const escapeXmlAttribute = (value: string): string =>
  escapeXmlText(value).replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const decodeXmlEntity = (value: string): string =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');

const localName = (name: string): string => {
  const parts = name.split(':');
  return parts[parts.length - 1] ?? name;
};

const parseAttributes = (source: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  const attributePattern = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

  for (const match of source.matchAll(attributePattern)) {
    const key = match[1];
    const value = match[3] ?? match[4] ?? '';

    if (key) {
      attributes[key] = decodeXmlEntity(value);
    }
  }

  return attributes;
};

const parseXml = (xml: string): ManifestElementNode => {
  if (/<!DOCTYPE/i.test(xml)) {
    throw new CommonCartridgeParseError(
      'Common Cartridge manifests with DOCTYPE are not supported.',
    );
  }

  const root: ManifestElementNode = {
    kind: 'element',
    name: '__root__',
    attributes: {},
    children: [],
  };
  const stack: ManifestElementNode[] = [root];
  const tokenPattern = /<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/g;

  for (const match of xml.matchAll(tokenPattern)) {
    const token = match[0];
    const parent = stack[stack.length - 1];

    if (!parent) {
      throw new CommonCartridgeParseError('Common Cartridge manifest could not be parsed.');
    }

    if (token.startsWith('<!--') || token.startsWith('<?')) {
      continue;
    }

    if (token.startsWith('<![CDATA[')) {
      parent.children.push({
        kind: 'text',
        text: token.slice('<![CDATA['.length, -']]>'.length),
      });
      continue;
    }

    if (!token.startsWith('<')) {
      if (token.trim().length > 0) {
        parent.children.push({ kind: 'text', text: decodeXmlEntity(token) });
      }
      continue;
    }

    if (token.startsWith('</')) {
      const closedName = token.slice(2, -1).trim();
      const openElement = stack.pop();

      if (!openElement || localName(openElement.name) !== localName(closedName)) {
        throw new CommonCartridgeParseError('Common Cartridge manifest has mismatched tags.');
      }
      continue;
    }

    if (token.startsWith('<!')) {
      throw new CommonCartridgeParseError(
        'Common Cartridge manifest declaration is not supported.',
      );
    }

    const selfClosing = token.endsWith('/>');
    const tagContent = token.slice(1, selfClosing ? -2 : -1).trim();
    const tagName = tagContent.match(/^\S+/)?.[0];

    if (!tagName) {
      throw new CommonCartridgeParseError('Common Cartridge manifest contains an empty tag.');
    }

    const element: ManifestElementNode = {
      kind: 'element',
      name: tagName,
      attributes: parseAttributes(tagContent.slice(tagName.length)),
      children: [],
    };
    parent.children.push(element);

    if (!selfClosing) {
      stack.push(element);
    }
  }

  if (stack.length !== 1) {
    throw new CommonCartridgeParseError('Common Cartridge manifest has unclosed tags.');
  }

  const documentElements = childElements(root);

  if (documentElements.length !== 1) {
    throw new CommonCartridgeParseError(
      'Common Cartridge manifest must contain exactly one root element.',
    );
  }

  return documentElements[0] as ManifestElementNode;
};

const childElements = (node: ManifestElementNode, name?: string): ManifestElementNode[] =>
  node.children.filter((child): child is ManifestElementNode => {
    if (child.kind !== 'element') {
      return false;
    }

    return name === undefined || localName(child.name) === name;
  });

const descendants = (node: ManifestElementNode, name: string): ManifestElementNode[] => {
  const matches: ManifestElementNode[] = [];

  for (const child of childElements(node)) {
    if (localName(child.name) === name) {
      matches.push(child);
    }
    matches.push(...descendants(child, name));
  }

  return matches;
};

const firstChild = (node: ManifestElementNode, name: string): ManifestElementNode | null =>
  childElements(node, name)[0] ?? null;

const firstDescendant = (node: ManifestElementNode, name: string): ManifestElementNode | null =>
  descendants(node, name)[0] ?? null;

const textContent = (node: ManifestNode): string => {
  if (node.kind === 'text') {
    return node.text;
  }

  return node.children.map(textContent).join('');
};

const textAttribute = (attributes: Record<string, string>, name: string): string | null =>
  attributes[name] ?? attributes[`openlms:${name}`] ?? null;

const requiredTextAttribute = (attributes: Record<string, string>, name: string): string => {
  const value = textAttribute(attributes, name);

  if (!value) {
    throw new CommonCartridgeParseError(`Common Cartridge manifest is missing ${name}.`);
  }

  return value;
};

const resourceByIdentifier = (manifest: ManifestElementNode): Map<string, ManifestElementNode> =>
  new Map(
    descendants(manifest, 'resource')
      .map((resource): [string, ManifestElementNode] | null => {
        const identifier = resource.attributes.identifier;
        return identifier ? [identifier, resource] : null;
      })
      .filter((entry): entry is [string, ManifestElementNode] => entry !== null),
  );

const fileContent = (files: CommonCartridgeFile[], href: string): string => {
  const file = files.find((candidate) => candidate.path === href);

  if (!file) {
    throw new CommonCartridgeParseError(`Common Cartridge file is missing: ${href}`);
  }

  return file.content;
};

const allocateFilePath = (
  pathCounts: Map<string, number>,
  kind: 'pages' | 'resources',
  title: string,
): string => {
  const basePath = `${kind}/${slug(title)}`;
  const nextCount = (pathCounts.get(basePath) ?? 0) + 1;
  pathCounts.set(basePath, nextCount);

  return nextCount === 1 ? `${basePath}.html` : `${basePath}-${nextCount}.html`;
};

const courseAttributes = (backup: CourseBackupContract): string =>
  [
    `openlms:course-code="${escapeXmlAttribute(backup.course.code)}"`,
    `openlms:course-status="${escapeXmlAttribute(backup.course.status)}"`,
  ].join(' ');

const learningObjectiveXml = (backup: CourseBackupContract): string =>
  backup.learningObjectives
    .map(
      (objective) =>
        `<openlms:learningObjective identifier="${escapeXmlAttribute(objective.id)}" code="${escapeXmlAttribute(objective.code)}" title="${escapeXmlAttribute(objective.title)}" status="${escapeXmlAttribute(objective.status)}" position="${objective.position}"${objective.description ? ` description="${escapeXmlAttribute(objective.description)}"` : ''} />`,
    )
    .join('');

const objectiveRefs = (ids: string[]): string =>
  ids
    .map((id) => `<openlms:learningObjectiveRef identifierref="${escapeXmlAttribute(id)}" />`)
    .join('');

const itemXml = (input: {
  identifier: string;
  title: string;
  type: string;
  position: number;
  visibility?: string;
  accessPolicy?: string;
  identifierref?: string;
  children?: string;
  learningObjectiveIds?: string[];
  summary?: string | null;
}): string => {
  const identifierRef = input.identifierref
    ? ` identifierref="${escapeXmlAttribute(input.identifierref)}"`
    : '';
  const visibility = input.visibility
    ? ` openlms:visibility="${escapeXmlAttribute(input.visibility)}"`
    : '';
  const accessPolicy = input.accessPolicy
    ? ` openlms:access-policy="${escapeXmlAttribute(input.accessPolicy)}"`
    : '';
  const summary = input.summary ? ` openlms:summary="${escapeXmlAttribute(input.summary)}"` : '';
  const children = [
    `<title>${escapeXmlText(input.title)}</title>`,
    objectiveRefs(input.learningObjectiveIds ?? []),
    input.children ?? '',
  ].join('');

  return `<item identifier="${escapeXmlAttribute(input.identifier)}"${identifierRef} openlms:type="${escapeXmlAttribute(input.type)}" openlms:position="${input.position}"${visibility}${accessPolicy}${summary}>${children}</item>`;
};

export const exportCourseBackupAsCommonCartridge = (
  backup: CourseBackupContract,
  now = new Date(),
): CommonCartridgeCourseExportContract => {
  const files: CommonCartridgeFile[] = [];
  const pathCounts = new Map<string, number>();
  const pageResources = backup.pages
    .map((page) => {
      const href = allocateFilePath(pathCounts, 'pages', page.title);
      files.push({ path: href, contentType: 'text/html', content: page.body });
      return `<resource identifier="res-${escapeXmlAttribute(page.id)}" type="webcontent" href="${escapeXmlAttribute(href)}" openlms:type="page" openlms:visibility="${escapeXmlAttribute(page.visibility)}"><file href="${escapeXmlAttribute(href)}" /></resource>`;
    })
    .join('');
  const contentResources = backup.resources
    .map((resource) => {
      const href = allocateFilePath(pathCounts, 'resources', resource.title);
      files.push({ path: href, contentType: 'text/html', content: resource.body });
      return `<resource identifier="res-${escapeXmlAttribute(resource.id)}" type="webcontent" href="${escapeXmlAttribute(href)}" openlms:type="resource" openlms:resource-type="${escapeXmlAttribute(resource.resourceType)}" openlms:visibility="${escapeXmlAttribute(resource.visibility)}" openlms:access-policy="${escapeXmlAttribute(resource.accessPolicy)}" openlms:source-uri="${escapeXmlAttribute(resource.sourceUri ?? '')}"><file href="${escapeXmlAttribute(href)}" /></resource>`;
    })
    .join('');
  const unitsByModuleId = new Map<string, typeof backup.units>();

  for (const module of backup.modules) {
    unitsByModuleId.set(
      module.id,
      backup.units.filter((unit) => unit.moduleId === module.id),
    );
  }

  const unattachedPages = backup.pages.map((page, index) =>
    itemXml({
      identifier: `item-${page.id}`,
      identifierref: `res-${page.id}`,
      title: page.title,
      type: 'page',
      position: index,
      visibility: page.visibility,
      learningObjectiveIds: page.learningObjectiveIds,
    }),
  );
  const moduleItems = backup.modules.map((module) => {
    const moduleUnits = unitsByModuleId.get(module.id) ?? [];
    const unitItems = moduleUnits.map((unit) => {
      const unitResources = backup.resources.filter((resource) => resource.unitId === unit.id);
      const resourceItems = unitResources.map((resource) =>
        itemXml({
          identifier: `item-${resource.id}`,
          identifierref: `res-${resource.id}`,
          title: resource.title,
          type: 'resource',
          position: resource.position,
          visibility: resource.visibility,
          accessPolicy: resource.accessPolicy,
          learningObjectiveIds: resource.learningObjectiveIds,
        }),
      );

      return itemXml({
        identifier: `item-${unit.id}`,
        title: unit.title,
        type: 'unit',
        position: unit.position,
        visibility: unit.visibility,
        accessPolicy: unit.accessPolicy,
        summary: unit.summary,
        learningObjectiveIds: unit.learningObjectiveIds,
        children: resourceItems.join(''),
      });
    });
    const moduleResources = backup.resources
      .filter((resource) => resource.moduleId === module.id && resource.unitId === null)
      .map((resource) =>
        itemXml({
          identifier: `item-${resource.id}`,
          identifierref: `res-${resource.id}`,
          title: resource.title,
          type: 'resource',
          position: resource.position,
          visibility: resource.visibility,
          accessPolicy: resource.accessPolicy,
          learningObjectiveIds: resource.learningObjectiveIds,
        }),
      );

    return itemXml({
      identifier: `item-${module.id}`,
      title: module.title,
      type: 'module',
      position: module.position,
      visibility: module.visibility,
      accessPolicy: module.accessPolicy,
      summary: module.summary,
      learningObjectiveIds: module.learningObjectiveIds,
      children: [...unitItems, ...moduleResources].join(''),
    });
  });
  const manifestXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<manifest identifier="openlms-course-${escapeXmlAttribute(backup.course.id)}" xmlns="${imsccNamespace}" xmlns:openlms="${openLmsNamespace}" ${courseAttributes(backup)}>`,
    '<metadata><schema>IMS Common Cartridge</schema><schemaversion>1.3.0</schemaversion>',
    learningObjectiveXml(backup),
    '</metadata>',
    '<organizations default="org-1"><organization identifier="org-1">',
    `<title>${escapeXmlText(backup.course.title)}</title>`,
    [...moduleItems, ...unattachedPages].join(''),
    '</organization></organizations>',
    `<resources>${pageResources}${contentResources}<resource identifier="imsmanifest" type="associatedcontent/imscc_xmlv1p3/learning-application-resource" href="imsmanifest.xml" /></resources>`,
    '</manifest>',
  ].join('');

  return CommonCartridgeCourseExport.parse({
    format: 'imscc_1_3',
    exportedAt: now,
    manifestXml,
    files,
  });
};

const titleOf = (element: ManifestElementNode): string => {
  const title = firstChild(element, 'title');

  if (!title) {
    throw new CommonCartridgeParseError('Common Cartridge item is missing a title.');
  }

  return textContent(title).trim();
};

const learningObjectiveIds = (
  item: ManifestElementNode,
  objectiveIdMap: Map<string, LearningObjectiveIdContract>,
): LearningObjectiveIdContract[] =>
  childElements(item, 'learningObjectiveRef')
    .map((ref) => ref.attributes.identifierref)
    .filter((id): id is string => id !== undefined)
    .map((id) => objectiveIdMap.get(id))
    .filter((id): id is LearningObjectiveIdContract => id !== undefined);

const numberAttribute = (
  attributes: Record<string, string>,
  name: string,
  fallback: number,
): number => {
  const value = textAttribute(attributes, name);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

const enumAttribute = <T extends string>(
  attributes: Record<string, string>,
  name: string,
  schema: EnumSchema<T>,
  fallback: T,
): T => {
  const value = textAttribute(attributes, name);

  if (!value) {
    return fallback;
  }

  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw new CommonCartridgeParseError(`Common Cartridge manifest has invalid ${name}: ${value}.`);
  }

  return parsed.data;
};

const parseVisibility = (attributes: Record<string, string>): CourseContentVisibility =>
  enumAttribute(
    attributes,
    'visibility',
    CourseContentVisibilitySchema,
    'published' satisfies CourseContentVisibility,
  );

const parseAccessPolicy = (attributes: Record<string, string>): CourseContentAccessPolicy =>
  enumAttribute(
    attributes,
    'access-policy',
    CourseContentAccessPolicySchema,
    'course_member' satisfies CourseContentAccessPolicy,
  );

export const parseCommonCartridgeCoursePackage = (
  input: ParseCommonCartridgeCoursePackageInput,
): CourseBackupContract => {
  const now = input.now ?? new Date();
  const manifest = parseXml(input.package.manifestXml);

  if (localName(manifest.name) !== 'manifest') {
    throw new CommonCartridgeParseError('Common Cartridge import expects a manifest root element.');
  }

  const organization = firstDescendant(manifest, 'organization');

  if (!organization) {
    throw new CommonCartridgeParseError('Common Cartridge manifest is missing an organization.');
  }

  const courseTitle = titleOf(organization);
  const objectiveIdMap = new Map<string, LearningObjectiveIdContract>();
  const learningObjectives = childElements(firstChild(manifest, 'metadata') ?? manifest)
    .filter((element) => localName(element.name) === 'learningObjective')
    .map((objective) => {
      const newId = LearningObjectiveId.parse(ulid());
      objectiveIdMap.set(requiredTextAttribute(objective.attributes, 'identifier'), newId);

      return {
        id: newId,
        tenantId: TenantId.parse(input.tenantId),
        courseId: CourseId.parse(input.courseId),
        code: requiredTextAttribute(objective.attributes, 'code'),
        title: requiredTextAttribute(objective.attributes, 'title'),
        description: textAttribute(objective.attributes, 'description'),
        status: enumAttribute(
          objective.attributes,
          'status',
          LearningObjectiveStatusSchema,
          'active' satisfies LearningObjectiveStatus,
        ),
        position: numberAttribute(objective.attributes, 'position', objectiveIdMap.size - 1),
        createdAt: now,
        updatedAt: now,
      };
    });
  const resources = resourceByIdentifier(manifest);
  const modules: CourseBackupContract['modules'] = [];
  const units: CourseBackupContract['units'] = [];
  const pages: CourseBackupContract['pages'] = [];
  const courseResources: CourseBackupContract['resources'] = [];

  const readContentResource = (identifierRef: string): ManifestElementNode => {
    const resource = resources.get(identifierRef);

    if (!resource) {
      throw new CommonCartridgeParseError(
        `Common Cartridge manifest references missing resource ${identifierRef}.`,
      );
    }

    return resource;
  };

  const restorePage = (item: ManifestElementNode): void => {
    const identifierRef = requiredTextAttribute(item.attributes, 'identifierref');
    const resource = readContentResource(identifierRef);
    const href = requiredTextAttribute(resource.attributes, 'href');
    pages.push({
      id: CoursePageId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.courseId),
      title: titleOf(item),
      body: fileContent(input.package.files, href),
      visibility: enumAttribute(
        resource.attributes,
        'visibility',
        CoursePageVisibilitySchema,
        'published' satisfies CoursePageVisibility,
      ),
      version: 1,
      learningObjectiveIds: learningObjectiveIds(item, objectiveIdMap),
      createdAt: now,
      updatedAt: now,
    });
  };

  const restoreResource = (
    item: ManifestElementNode,
    moduleId: string | null,
    unitId: string | null,
    fallbackPosition: number,
  ): void => {
    const identifierRef = requiredTextAttribute(item.attributes, 'identifierref');
    const resource = readContentResource(identifierRef);
    const href = requiredTextAttribute(resource.attributes, 'href');
    courseResources.push({
      id: CourseResourceId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.courseId),
      moduleId: moduleId ? CourseModuleId.parse(moduleId) : null,
      unitId: unitId ? CourseUnitId.parse(unitId) : null,
      resourceType: enumAttribute(
        resource.attributes,
        'resource-type',
        CourseResourceTypeSchema,
        'reading_material' satisfies CourseResourceType,
      ),
      title: titleOf(item),
      body: fileContent(input.package.files, href),
      sourceUri: textAttribute(resource.attributes, 'source-uri') || null,
      visibility: parseVisibility(resource.attributes),
      accessPolicy: parseAccessPolicy(resource.attributes),
      version: 1,
      position: numberAttribute(item.attributes, 'position', fallbackPosition),
      learningObjectiveIds: learningObjectiveIds(item, objectiveIdMap),
      createdAt: now,
      updatedAt: now,
    });
  };

  for (const [moduleIndex, moduleItem] of childElements(organization, 'item').entries()) {
    const type = textAttribute(moduleItem.attributes, 'type');

    if (type === 'page') {
      restorePage(moduleItem);
      continue;
    }

    if (type === 'resource') {
      restoreResource(moduleItem, null, null, moduleIndex);
      continue;
    }

    if (type !== 'module') {
      continue;
    }

    const moduleId = CourseModuleId.parse(ulid());
    modules.push({
      id: moduleId,
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.courseId),
      title: titleOf(moduleItem),
      summary: textAttribute(moduleItem.attributes, 'summary'),
      visibility: parseVisibility(moduleItem.attributes),
      accessPolicy: parseAccessPolicy(moduleItem.attributes),
      version: 1,
      position: numberAttribute(moduleItem.attributes, 'position', moduleIndex),
      learningObjectiveIds: learningObjectiveIds(moduleItem, objectiveIdMap),
      createdAt: now,
      updatedAt: now,
    });

    for (const [unitIndex, unitItem] of childElements(moduleItem, 'item').entries()) {
      const unitType = textAttribute(unitItem.attributes, 'type');

      if (unitType === 'resource') {
        restoreResource(unitItem, moduleId, null, unitIndex);
        continue;
      }

      if (unitType !== 'unit') {
        continue;
      }

      const unitId = CourseUnitId.parse(ulid());
      units.push({
        id: unitId,
        tenantId: TenantId.parse(input.tenantId),
        courseId: CourseId.parse(input.courseId),
        moduleId,
        title: titleOf(unitItem),
        summary: textAttribute(unitItem.attributes, 'summary'),
        visibility: parseVisibility(unitItem.attributes),
        accessPolicy: parseAccessPolicy(unitItem.attributes),
        version: 1,
        position: numberAttribute(unitItem.attributes, 'position', unitIndex),
        learningObjectiveIds: learningObjectiveIds(unitItem, objectiveIdMap),
        createdAt: now,
        updatedAt: now,
      });

      for (const [resourceIndex, resourceItem] of childElements(unitItem, 'item').entries()) {
        if (textAttribute(resourceItem.attributes, 'type') === 'resource') {
          restoreResource(resourceItem, moduleId, unitId, resourceIndex);
        }
      }
    }
  }

  return CourseBackup.parse({
    formatVersion: '1',
    exportedAt: now,
    course: {
      id: CourseId.parse(input.courseId),
      tenantId: TenantId.parse(input.tenantId),
      code: textAttribute(manifest.attributes, 'course-code') ?? 'IMSCC',
      title: courseTitle,
      status: enumAttribute(manifest.attributes, 'course-status', CourseStatus, 'draft'),
      startsAt: null,
      endsAt: null,
      createdAt: now,
      updatedAt: now,
    },
    learningObjectives,
    modules,
    units,
    pages,
    resources: courseResources,
  });
};
