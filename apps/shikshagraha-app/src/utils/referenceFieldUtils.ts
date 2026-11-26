/**
 * Generic utilities to handle reference-type fields across Read, Create, and Update APIs.
 *
 * Supports:
 * - Single reference objects: e.g. { value: "id", label: "Label", externalId: "101" }
 * - Array of reference objects: e.g. [{ value: "id1", label: "L1" }, { value: "id2", label: "L2" }]
 * - Alternate reference object formats: { _id, name }, { id, label }, etc.
 * - Nested objects and arrays containing reference fields
 * - Asynchronously loaded dropdown options
 * - Safe handling of null, undefined, primitive values, and unrelated business objects
 */

const REFERENCE_METADATA_KEYS = new Set([
  'value',
  'label',
  'externalId',
  'external_id',
  '_id',
  'id',
  'name',
  'code',
  'title',
  'displayName',
  'display_name',
  'description',
  'disabled',
  '_originalData',
]);

/**
 * Checks whether a given value is a reference object representing an entity option.
 * Distinguishes reference objects from arbitrary/unrelated objects.
 */
export function isReferenceObject(val: any): boolean {
  if (val === null || val === undefined || typeof val !== 'object' || Array.isArray(val)) {
    return false;
  }

  const keys = Object.keys(val);
  if (keys.length === 0) return false;

  // Check if it has an identifier property (value, _id, or id)
  const hasValue = val.value !== undefined && val.value !== null && typeof val.value !== 'object';
  const hasUnderscoreId = val._id !== undefined && val._id !== null && typeof val._id !== 'object';
  const hasId = val.id !== undefined && val.id !== null && typeof val.id !== 'object';

  if (!hasValue && !hasUnderscoreId && !hasId) {
    return false;
  }

  // Check for presence of display properties
  const hasLabel = typeof val.label === 'string';
  const hasName = typeof val.name === 'string';
  const hasExternalId = val.externalId !== undefined || val.external_id !== undefined;
  const hasDisplayName = typeof val.displayName === 'string' || typeof val.display_name === 'string';
  const hasTitle = typeof val.title === 'string';

  const hasDisplayProp = hasLabel || hasName || hasExternalId || hasDisplayName || hasTitle;

  // 1. If it has 'value' and a display property, or its keys are reference metadata keys
  if (hasValue) {
    if (hasDisplayProp) return true;
    if (keys.every((k) => REFERENCE_METADATA_KEYS.has(k))) return true;
  }

  // 2. If it has '_id' and a display property (or reference metadata keys)
  if (hasUnderscoreId) {
    if (hasDisplayProp) return true;
    if (keys.every((k) => REFERENCE_METADATA_KEYS.has(k))) return true;
  }

  // 3. If it has 'id' and a display property, ensure it is not an arbitrary business object with extra keys
  if (hasId && hasDisplayProp && keys.every((k) => REFERENCE_METADATA_KEYS.has(k))) {
    return true;
  }

  return false;
}

/**
 * Checks whether a reference object contains an externalId property.
 */
export function hasReferenceExternalId(val: any): boolean {
  if (val === null || val === undefined || typeof val !== 'object' || Array.isArray(val)) {
    return false;
  }
  const extId = val.externalId !== undefined ? val.externalId : val.external_id;
  return extId !== undefined && extId !== null && extId !== '';
}

/**
 * Extracts the submission value from a reference object according to externalId presence:
 * - If externalId exists: use value (or _id / id).
 * - If externalId is absent: use label (or name / displayName / title).
 * If val is not a reference object or is primitive, returns val as-is.
 */
export function extractReferenceSubmissionValue(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object' || Array.isArray(val)) return val;

  if (isReferenceObject(val)) {
    if (hasReferenceExternalId(val)) {
      // If externalId exists, use value as the submission value
      return extractReferenceId(val);
    } else {
      // If externalId is absent, use label as the submission value
      const label = extractReferenceLabel(val);
      return label !== '' ? label : extractReferenceId(val);
    }
  }

  return val;
}

/**
 * Extracts the raw ID/value from a reference object or returns the primitive value as-is.
 */
export function extractReferenceId(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;
  if (val.value !== undefined && val.value !== null) return val.value;
  if (val._id !== undefined && val._id !== null) return val._id;
  if (val.id !== undefined && val.id !== null) return val.id;
  return val;
}

/**
 * Extracts the display label from a reference object or returns a string representation.
 */
export function extractReferenceLabel(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.label !== undefined && val.label !== null) return String(val.label);
    if (val.name !== undefined && val.name !== null) return String(val.name);
    if (val.displayName !== undefined && val.displayName !== null) return String(val.displayName);
    if (val.display_name !== undefined && val.display_name !== null) return String(val.display_name);
    if (val.title !== undefined && val.title !== null) return String(val.title);
    if (val.value !== undefined && val.value !== null) return String(val.value);
    if (val._id !== undefined && val._id !== null) return String(val._id);
    if (val.id !== undefined && val.id !== null) return String(val.id);
  }
  return '';
}

/**
 * Recursively extracts values from reference objects across any nested data structure.
 *
 * Rules:
 * - If externalId exists: uses value (ID) as the submission value.
 * - If externalId is absent: uses label as the submission value.
 *
 * Example:
 * {
 *   block: { value: "6852c8de7248c20014b38a9d", label: "AGARTALA...", externalId: "160101" },
 *   blocks: [
 *     { value: "id1", label: "Block 1", externalId: "101" },
 *     { value: "id2", label: "Block 2", externalId: "102" }
 *   ],
 *   userSchool: {
 *     value: "other",
 *     label: "Ms kachiyama"
 *   }
 * }
 * =>
 * {
 *   block: "6852c8de7248c20014b38a9d",
 *   blocks: ["id1", "id2"],
 *   userSchool: "Ms kachiyama"
 * }
 *
 * Preserves primitive values, null, undefined, and unrelated business objects intact.
 */
export function extractReferenceValues<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // If data itself is a reference object, extract its submission value
  if (isReferenceObject(data)) {
    return extractReferenceSubmissionValue(data);
  }

  // If array, recursively process each item
  if (Array.isArray(data)) {
    return data.map((item) => extractReferenceValues(item)) as unknown as T;
  }

  // If plain object, recursively process each key
  if (typeof data === 'object') {
    // Preserve special non-plain objects (e.g. Date, RegExp) as-is
    if (data instanceof Date || data instanceof RegExp) {
      return data;
    }

    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      result[key] = extractReferenceValues(val);
    }
    return result as T;
  }

  // Primitive value (string, number, boolean, symbol, bigint)
  return data;
}

/**
 * Normalizes a single reference value for select widgets.
 * Returns normalized string `id` and display `label`.
 */
export function normalizeSingleReference(val: any): { id: string; label: string } {
  if (val === null || val === undefined || val === '') {
    return { id: '', label: '' };
  }
  if (isReferenceObject(val)) {
    return {
      id: String(extractReferenceId(val) ?? ''),
      label: extractReferenceLabel(val),
    };
  }
  return {
    id: String(val),
    label: String(val),
  };
}

/**
 * Normalizes multi-reference values (array of reference objects or IDs) for multi-select widgets.
 * Returns normalized `ids` array of strings and `labelsMap` mapping id -> label.
 */
export function normalizeMultiReference(val: any): { ids: string[]; labelsMap: Record<string, string> } {
  if (!val) {
    return { ids: [], labelsMap: {} };
  }
  const items = Array.isArray(val) ? val : [val];
  const ids: string[] = [];
  const labelsMap: Record<string, string> = {};

  items.forEach((item) => {
    if (item === null || item === undefined || item === '') return;
    if (isReferenceObject(item)) {
      const id = String(extractReferenceId(item) ?? '');
      const label = extractReferenceLabel(item);
      if (id) {
        ids.push(id);
        if (label) {
          labelsMap[id] = label;
        }
      }
    } else {
      const id = String(item);
      ids.push(id);
    }
  });

  return { ids, labelsMap };
}
