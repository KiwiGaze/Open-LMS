import {
  type QtiAssessmentItemExport,
  QuizQuestionAnswerKey,
  type QuizQuestionAnswerKey as QuizQuestionAnswerKeyContract,
  type QuizQuestionChoice,
  type QuizQuestionType,
} from '@openlms/contracts';
import type { AutoGradableQuizQuestion } from '../quizzes/auto-grading.ts';

export class QtiParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QtiParseError';
  }
}

export class UnsupportedQtiItemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedQtiItemError';
  }
}

export type QtiQuizQuestionImportInput = {
  questionType: QuizQuestionType;
  prompt: string;
  points: number;
  choices: QuizQuestionChoice[];
  answerKey?: QuizQuestionAnswerKeyContract | null;
};

type XmlTextNode = {
  kind: 'text';
  text: string;
};

type XmlElementNode = {
  kind: 'element';
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
};

type XmlNode = XmlTextNode | XmlElementNode;

const qtiNamespace = 'http://www.imsglobal.org/xsd/imsqti_v2p1';
const openLmsQtiNamespace = 'https://open-lms.local/qti';

const localName = (name: string): string => {
  const parts = name.split(':');
  return parts[parts.length - 1] ?? name;
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

const textContent = (node: XmlNode): string => {
  if (node.kind === 'text') {
    return node.text;
  }

  return node.children.map(textContent).join('');
};

const childElements = (node: XmlElementNode, name?: string): XmlElementNode[] =>
  node.children.filter((child): child is XmlElementNode => {
    if (child.kind !== 'element') {
      return false;
    }

    return name === undefined || localName(child.name) === name;
  });

const descendants = (node: XmlElementNode, name: string): XmlElementNode[] => {
  const matches: XmlElementNode[] = [];

  for (const child of childElements(node)) {
    if (localName(child.name) === name) {
      matches.push(child);
    }
    matches.push(...descendants(child, name));
  }

  return matches;
};

const firstDescendant = (node: XmlElementNode, name: string): XmlElementNode | null =>
  descendants(node, name)[0] ?? null;

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

const parseXml = (xml: string): XmlElementNode => {
  if (/<!DOCTYPE/i.test(xml)) {
    throw new QtiParseError('QTI XML with DOCTYPE declarations is not supported.');
  }

  const root: XmlElementNode = {
    kind: 'element',
    name: '__root__',
    attributes: {},
    children: [],
  };
  const stack: XmlElementNode[] = [root];
  const tokenPattern = /<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/g;

  for (const match of xml.matchAll(tokenPattern)) {
    const token = match[0];
    const parent = stack[stack.length - 1];

    if (!parent) {
      throw new QtiParseError('QTI XML could not be parsed.');
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
        throw new QtiParseError('QTI XML contains mismatched closing tags.');
      }
      continue;
    }

    if (token.startsWith('<!')) {
      throw new QtiParseError('QTI XML declaration is not supported.');
    }

    const selfClosing = token.endsWith('/>');
    const tagContent = token.slice(1, selfClosing ? -2 : -1).trim();
    const tagName = tagContent.match(/^\S+/)?.[0];

    if (!tagName) {
      throw new QtiParseError('QTI XML contains an empty tag.');
    }

    const element: XmlElementNode = {
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
    throw new QtiParseError('QTI XML contains unclosed tags.');
  }

  const documentElements = childElements(root);

  if (documentElements.length !== 1) {
    throw new QtiParseError('QTI XML must contain exactly one root element.');
  }

  return documentElements[0] as XmlElementNode;
};

const promptFromItemBody = (itemBody: XmlElementNode): string => {
  const paragraph = firstDescendant(itemBody, 'p');
  const prompt = (paragraph ? textContent(paragraph) : textContent(itemBody)).trim();

  if (prompt.length === 0) {
    throw new QtiParseError('QTI assessment item is missing prompt text.');
  }

  return prompt;
};

const pointsFromItem = (item: XmlElementNode): number => {
  const scoreDeclaration = childElements(item, 'outcomeDeclaration').find(
    (declaration) => declaration.attributes.identifier === 'SCORE',
  );
  const valueText = scoreDeclaration
    ? textContent(firstDescendant(scoreDeclaration, 'value') ?? scoreDeclaration).trim()
    : '0';
  const points = Number(valueText);

  if (!Number.isInteger(points) || points < 0) {
    throw new UnsupportedQtiItemError('QTI item SCORE outcome must be a nonnegative integer.');
  }

  return points;
};

const responseDeclaration = (item: XmlElementNode): XmlElementNode | null =>
  childElements(item, 'responseDeclaration').find(
    (declaration) => declaration.attributes.identifier === 'RESPONSE',
  ) ?? null;

const correctResponseValues = (item: XmlElementNode): string[] => {
  const declaration = responseDeclaration(item);

  if (!declaration) {
    return [];
  }

  const correctResponse = firstDescendant(declaration, 'correctResponse');

  if (!correctResponse) {
    return [];
  }

  return childElements(correctResponse, 'value').map((value) => textContent(value).trim());
};

const answerKeyFromChoiceValues = (values: string[]): QuizQuestionAnswerKeyContract | null =>
  values.length > 0
    ? QuizQuestionAnswerKey.parse({ kind: 'choice', correctChoiceIds: values })
    : null;

const parseChoiceInteraction = (
  item: XmlElementNode,
  itemBody: XmlElementNode,
  interaction: XmlElementNode,
): QtiQuizQuestionImportInput => {
  const choices = childElements(interaction, 'simpleChoice').map((choice) => ({
    id: choice.attributes.identifier ?? '',
    text: textContent(choice).trim(),
  }));

  if (choices.some((choice) => choice.id.length === 0 || choice.text.length === 0)) {
    throw new QtiParseError('QTI choice interactions must include identifiers and text.');
  }

  const lowerChoiceIds = choices.map((choice) => choice.id.toLocaleLowerCase());
  const questionType =
    choices.length === 2 && lowerChoiceIds.includes('true') && lowerChoiceIds.includes('false')
      ? 'true_false'
      : 'multiple_choice';

  return {
    questionType,
    prompt: promptFromItemBody(itemBody),
    points: pointsFromItem(item),
    choices,
    answerKey: answerKeyFromChoiceValues(correctResponseValues(item)),
  };
};

const parseTextEntryInteraction = (
  item: XmlElementNode,
  itemBody: XmlElementNode,
): QtiQuizQuestionImportInput => {
  const declaration = responseDeclaration(item);
  const baseType = declaration?.attributes.baseType;
  const correctValues = correctResponseValues(item);

  if (baseType === 'float' || baseType === 'integer') {
    const value = Number(correctValues[0]);
    const toleranceElement = firstDescendant(item, 'numericTolerance');
    const toleranceText = toleranceElement ? textContent(toleranceElement).trim() : '';
    const tolerance = toleranceText.length > 0 ? Number(toleranceText) : 0;

    if (!Number.isFinite(value) || !Number.isFinite(tolerance) || tolerance < 0) {
      throw new QtiParseError('QTI numeric response must include a finite value and tolerance.');
    }

    return {
      questionType: 'numeric',
      prompt: promptFromItemBody(itemBody),
      points: pointsFromItem(item),
      choices: [],
      answerKey: QuizQuestionAnswerKey.parse({ kind: 'numeric', value, tolerance }),
    };
  }

  return {
    questionType: 'short_answer',
    prompt: promptFromItemBody(itemBody),
    points: pointsFromItem(item),
    choices: [],
    answerKey:
      correctValues.length > 0
        ? QuizQuestionAnswerKey.parse({
            kind: 'text',
            acceptedAnswers: correctValues,
            caseSensitive: false,
          })
        : null,
  };
};

export const parseQtiAssessmentItem = (xml: string): QtiQuizQuestionImportInput => {
  const item = parseXml(xml);

  if (localName(item.name) !== 'assessmentItem') {
    throw new QtiParseError('QTI import expects an assessmentItem root element.');
  }

  const itemBody = childElements(item, 'itemBody')[0];

  if (!itemBody) {
    throw new QtiParseError('QTI assessment item is missing itemBody.');
  }

  const choiceInteraction = firstDescendant(itemBody, 'choiceInteraction');

  if (choiceInteraction) {
    return parseChoiceInteraction(item, itemBody, choiceInteraction);
  }

  if (firstDescendant(itemBody, 'textEntryInteraction')) {
    return parseTextEntryInteraction(item, itemBody);
  }

  if (firstDescendant(itemBody, 'extendedTextInteraction')) {
    return {
      questionType: 'essay',
      prompt: promptFromItemBody(itemBody),
      points: pointsFromItem(item),
      choices: [],
      answerKey: null,
    };
  }

  throw new UnsupportedQtiItemError(
    'QTI import supports choiceInteraction, textEntryInteraction, and extendedTextInteraction items.',
  );
};

const titleFromPrompt = (prompt: string): string => {
  const normalized = prompt.replace(/\s+/g, ' ').trim();
  return normalized.slice(0, 180);
};

const outcomeDeclaration = (points: number): string =>
  `<outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"><defaultValue><value>${points}</value></defaultValue></outcomeDeclaration>`;

const responseDeclarationXml = (
  cardinality: 'single' | 'multiple',
  baseType: 'identifier' | 'string' | 'float',
  correctValues: string[],
): string => {
  if (correctValues.length === 0) {
    return `<responseDeclaration identifier="RESPONSE" cardinality="${cardinality}" baseType="${baseType}" />`;
  }

  const values = correctValues.map((value) => `<value>${escapeXmlText(value)}</value>`).join('');
  return `<responseDeclaration identifier="RESPONSE" cardinality="${cardinality}" baseType="${baseType}"><correctResponse>${values}</correctResponse></responseDeclaration>`;
};

const choiceInteractionXml = (question: AutoGradableQuizQuestion): string => {
  if (question.answerKey !== null && question.answerKey.kind !== 'choice') {
    throw new UnsupportedQtiItemError('QTI choice export requires a choice answer key.');
  }

  const correctChoiceIds = question.answerKey?.correctChoiceIds ?? [];
  const maxChoices = Math.max(1, correctChoiceIds.length);
  const choices =
    question.questionType === 'true_false' && question.choices.length === 0
      ? [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ]
      : question.choices;
  const simpleChoices = choices
    .map(
      (choice) =>
        `<simpleChoice identifier="${escapeXmlAttribute(choice.id)}">${escapeXmlText(choice.text)}</simpleChoice>`,
    )
    .join('');

  return [
    responseDeclarationXml(
      correctChoiceIds.length > 1 ? 'multiple' : 'single',
      'identifier',
      correctChoiceIds,
    ),
    outcomeDeclaration(question.points),
    `<itemBody><p>${escapeXmlText(question.prompt)}</p><choiceInteraction responseIdentifier="RESPONSE" maxChoices="${maxChoices}">${simpleChoices}</choiceInteraction></itemBody>`,
  ].join('');
};

const shortAnswerInteractionXml = (question: AutoGradableQuizQuestion): string => {
  if (question.answerKey !== null && question.answerKey.kind !== 'text') {
    throw new UnsupportedQtiItemError('QTI short answer export requires a text answer key.');
  }

  return [
    responseDeclarationXml('single', 'string', question.answerKey?.acceptedAnswers ?? []),
    outcomeDeclaration(question.points),
    `<itemBody><p>${escapeXmlText(question.prompt)}</p><textEntryInteraction responseIdentifier="RESPONSE" /></itemBody>`,
  ].join('');
};

const numericInteractionXml = (question: AutoGradableQuizQuestion): string => {
  if (question.answerKey !== null && question.answerKey.kind !== 'numeric') {
    throw new UnsupportedQtiItemError('QTI numeric export requires a numeric answer key.');
  }

  const correctValues = question.answerKey ? [String(question.answerKey.value)] : [];
  const tolerance =
    question.answerKey === null
      ? ''
      : `<openlms:numericTolerance>${question.answerKey.tolerance}</openlms:numericTolerance>`;

  return [
    responseDeclarationXml('single', 'float', correctValues),
    outcomeDeclaration(question.points),
    `<itemBody><p>${escapeXmlText(question.prompt)}</p><textEntryInteraction responseIdentifier="RESPONSE" />${tolerance}</itemBody>`,
  ].join('');
};

const essayInteractionXml = (question: AutoGradableQuizQuestion): string => {
  if (question.answerKey !== null) {
    throw new UnsupportedQtiItemError('QTI essay export does not support answer keys.');
  }

  return `${outcomeDeclaration(question.points)}<itemBody><p>${escapeXmlText(question.prompt)}</p><extendedTextInteraction responseIdentifier="RESPONSE" /></itemBody>`;
};

const interactionXml = (question: AutoGradableQuizQuestion): string => {
  switch (question.questionType) {
    case 'multiple_choice':
    case 'true_false':
      return choiceInteractionXml(question);
    case 'short_answer':
      return shortAnswerInteractionXml(question);
    case 'numeric':
      return numericInteractionXml(question);
    case 'essay':
      return essayInteractionXml(question);
    case 'matching':
      throw new UnsupportedQtiItemError('QTI matching export is not supported in this iteration.');
  }
};

export const exportQuizQuestionToQtiItem = (
  question: AutoGradableQuizQuestion,
): QtiAssessmentItemExport => {
  const title = titleFromPrompt(question.prompt);
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<assessmentItem xmlns="${qtiNamespace}" xmlns:openlms="${openLmsQtiNamespace}" identifier="${escapeXmlAttribute(question.id)}" title="${escapeXmlAttribute(title)}" adaptive="false" timeDependent="false">`,
    interactionXml(question),
    '</assessmentItem>',
  ].join('');

  return {
    identifier: question.id,
    title,
    xml,
  };
};
