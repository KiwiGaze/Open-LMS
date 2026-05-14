export const apiVersion = '0.0.0';

const bearerAuthSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
};

export const openApiDocumentBase = {
  openapi: '3.0.3' as const,
  info: {
    title: 'Open-LMS API',
    version: apiVersion,
    description: 'HTTP API contract generated from Open-LMS Hono route definitions.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerAuth: bearerAuthSecurityScheme,
    },
  },
};

export type OpenApiDocumentWithSchemas = {
  components?: {
    schemas?: Record<string, GeneratedSchemaObject>;
    securitySchemes?: Record<string, unknown>;
  };
};

type GeneratedSchemaObject = Record<string, unknown> & {
  type?: string | string[];
  format?: string;
  nullable?: boolean;
  properties?: Record<string, GeneratedSchemaObject>;
  items?: GeneratedSchemaObject;
  allOf?: GeneratedSchemaObject[];
  anyOf?: GeneratedSchemaObject[];
  oneOf?: GeneratedSchemaObject[];
};

const applyDateTimeFormatsToSchema = (
  schema: GeneratedSchemaObject,
  propertyName?: string,
): void => {
  if (propertyName?.endsWith('At') && schema.type === 'string') {
    schema.format = 'date-time';
  }

  if (schema.properties) {
    for (const [childPropertyName, childSchema] of Object.entries(schema.properties)) {
      applyDateTimeFormatsToSchema(childSchema, childPropertyName);
    }
  }

  if (schema.items) {
    applyDateTimeFormatsToSchema(schema.items);
  }

  for (const composedSchemas of [schema.allOf, schema.anyOf, schema.oneOf]) {
    if (!composedSchemas) {
      continue;
    }

    for (const composedSchema of composedSchemas) {
      applyDateTimeFormatsToSchema(composedSchema);
    }
  }
};

export const applyDateTimeFormats = (document: OpenApiDocumentWithSchemas): void => {
  for (const schema of Object.values(document.components?.schemas ?? {})) {
    applyDateTimeFormatsToSchema(schema);
  }
};

export const applyBearerAuthSecurityScheme = (document: OpenApiDocumentWithSchemas): void => {
  document.components = {
    ...document.components,
    securitySchemes: {
      ...document.components?.securitySchemes,
      bearerAuth: bearerAuthSecurityScheme,
    },
  };
};
