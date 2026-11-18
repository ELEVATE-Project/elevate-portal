import {
  isReferenceObject,
  hasReferenceExternalId,
  extractReferenceSubmissionValue,
  extractReferenceId,
  extractReferenceLabel,
  extractReferenceValues,
  normalizeSingleReference,
  normalizeMultiReference,
} from './referenceFieldUtils';

describe('referenceFieldUtils', () => {
  describe('isReferenceObject', () => {
    it('should identify standard reference objects with value, label, externalId', () => {
      const ref = {
        value: '6852c8de7248c20014b38a9d',
        label: 'AGARTALA MUNICIPAL COORPORATION',
        externalId: '160101',
      };
      expect(isReferenceObject(ref)).toBe(true);
    });

    it('should identify reference objects with _id and name', () => {
      const ref = {
        _id: '6852c8de7248c20014b38a9d',
        name: 'AGARTALA',
        externalId: '160101',
      };
      expect(isReferenceObject(ref)).toBe(true);
    });

    it('should identify reference objects with id and label', () => {
      const ref = { id: 'id1', label: 'Block 1' };
      expect(isReferenceObject(ref)).toBe(true);
    });

    it('should identify reference objects with only value property', () => {
      expect(isReferenceObject({ value: 'val123' })).toBe(true);
    });

    it('should return false for primitive values, null, and undefined', () => {
      expect(isReferenceObject(null)).toBe(false);
      expect(isReferenceObject(undefined)).toBe(false);
      expect(isReferenceObject('some-string-id')).toBe(false);
      expect(isReferenceObject(12345)).toBe(false);
      expect(isReferenceObject(true)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isReferenceObject([{ value: '1', label: 'One' }])).toBe(false);
      expect(isReferenceObject(['id1', 'id2'])).toBe(false);
    });

    it('should return false for unrelated business objects', () => {
      const unrelated = {
        theme: 'dark',
        primaryColor: '#572E91',
        fontSize: 14,
      };
      expect(isReferenceObject(unrelated)).toBe(false);

      const complexEntity = {
        id: 'user_1',
        email: 'user@example.com',
        role: 'admin',
        bio: 'Hello world',
        createdAt: '2026-01-01',
      };
      expect(isReferenceObject(complexEntity)).toBe(false);
    });
  });

  describe('hasReferenceExternalId', () => {
    it('should return true when externalId exists', () => {
      expect(
        hasReferenceExternalId({
          value: '6852c8de7248c20014b38a9d',
          label: 'AGARTALA',
          externalId: '160101',
        })
      ).toBe(true);
      expect(hasReferenceExternalId({ external_id: '160101' })).toBe(true);
    });

    it('should return false when externalId is absent, null, or empty string', () => {
      expect(
        hasReferenceExternalId({
          value: 'other',
          label: 'Ms kachiyama',
        })
      ).toBe(false);
      expect(
        hasReferenceExternalId({
          value: 'other',
          label: 'Ms kachiyama',
          externalId: null,
        })
      ).toBe(false);
      expect(
        hasReferenceExternalId({
          value: 'other',
          label: 'Ms kachiyama',
          externalId: '',
        })
      ).toBe(false);
      expect(hasReferenceExternalId(null)).toBe(false);
      expect(hasReferenceExternalId('plain-string')).toBe(false);
    });
  });

  describe('extractReferenceSubmissionValue', () => {
    it('should use value as submission value when externalId exists', () => {
      const ref = {
        value: '6852c8de7248c20014b38a9d',
        label: 'AGARTALA MUNICIPAL COORPORATION',
        externalId: '160101',
      };
      expect(extractReferenceSubmissionValue(ref)).toBe(
        '6852c8de7248c20014b38a9d'
      );
    });

    it('should use label as submission value when externalId is absent', () => {
      const ref = {
        value: 'other',
        label: 'Ms kachiyama',
      };
      expect(extractReferenceSubmissionValue(ref)).toBe('Ms kachiyama');
    });

    it('should fallback to name when externalId is absent and label is not present', () => {
      const ref = {
        _id: '123',
        name: 'School Name',
      };
      expect(extractReferenceSubmissionValue(ref)).toBe('School Name');
    });

    it('should return primitive values unchanged', () => {
      expect(extractReferenceSubmissionValue('string-val')).toBe('string-val');
      expect(extractReferenceSubmissionValue(100)).toBe(100);
      expect(extractReferenceSubmissionValue(null)).toBe(null);
      expect(extractReferenceSubmissionValue(undefined)).toBe(undefined);
    });
  });

  describe('extractReferenceId', () => {
    it('should extract value from reference object', () => {
      expect(
        extractReferenceId({
          value: '6852c8de7248c20014b38a9d',
          label: 'AGARTALA',
        })
      ).toBe('6852c8de7248c20014b38a9d');
    });

    it('should extract _id from reference object if value is not present', () => {
      expect(extractReferenceId({ _id: 'state_101', name: 'Tripura' })).toBe(
        'state_101'
      );
    });

    it('should extract id from reference object if value and _id are not present', () => {
      expect(extractReferenceId({ id: 'id_101', label: 'Item 1' })).toBe(
        'id_101'
      );
    });

    it('should return primitive values unchanged', () => {
      expect(extractReferenceId('primitive-id')).toBe('primitive-id');
      expect(extractReferenceId(123)).toBe(123);
      expect(extractReferenceId(null)).toBe(null);
      expect(extractReferenceId(undefined)).toBe(undefined);
    });
  });

  describe('extractReferenceLabel', () => {
    it('should extract label from reference object', () => {
      expect(
        extractReferenceLabel({
          value: '123',
          label: 'My Label',
        })
      ).toBe('My Label');
    });

    it('should fallback to name, displayName, title, or value', () => {
      expect(extractReferenceLabel({ _id: '1', name: 'Name Label' })).toBe(
        'Name Label'
      );
      expect(
        extractReferenceLabel({ id: '1', displayName: 'Display Label' })
      ).toBe('Display Label');
      expect(extractReferenceLabel({ value: 'val1' })).toBe('val1');
    });

    it('should return string representation of primitive values', () => {
      expect(extractReferenceLabel('Plain String')).toBe('Plain String');
      expect(extractReferenceLabel(100)).toBe('100');
      expect(extractReferenceLabel(null)).toBe('');
      expect(extractReferenceLabel(undefined)).toBe('');
    });
  });

  describe('extractReferenceValues', () => {
    it('should match the expected Create/Update payload from example Read Profile response', () => {
      const readProfileResponse = {
        block: {
          value: '6852c8de7248c20014b38a9d',
          label: 'AGARTALA MUNICIPAL COORPORATION',
          externalId: '160101',
        },
        blocks: [
          { value: 'id1', label: 'Block 1', externalId: '101' },
          { value: 'id2', label: 'Block 2', externalId: '102' },
        ],
      };

      const result = extractReferenceValues(readProfileResponse);

      expect(result).toEqual({
        block: '6852c8de7248c20014b38a9d',
        blocks: ['id1', 'id2'],
      });
    });

    it('should use label as submission value when reference object has no externalId', () => {
      const readProfileResponse = {
        userSchool: {
          value: 'other',
          label: 'Ms kachiyama',
        },
      };

      const result = extractReferenceValues(readProfileResponse);

      expect(result).toEqual({
        userSchool: 'Ms kachiyama',
      });
    });

    it('should handle arrays of reference objects with and without externalId', () => {
      const payload = {
        schoolsWithoutExternalId: [
          { value: 'other', label: 'Ms kachiyama' },
          { value: 'custom', label: 'Springfield High' },
        ],
        mixedSchools: [
          { value: 'other', label: 'Ms kachiyama' },
          { value: 'sch_1', label: 'Govt High School', externalId: '101' },
        ],
      };

      const result = extractReferenceValues(payload);

      expect(result).toEqual({
        schoolsWithoutExternalId: ['Ms kachiyama', 'Springfield High'],
        mixedSchools: ['Ms kachiyama', 'sch_1'],
      });
    });

    it('should preserve primitive values and unrelated objects', () => {
      const payload = {
        name: 'Jane Doe',
        age: 28,
        isActive: true,
        emptyField: null,
        undefinedField: undefined,
        themeConfig: {
          mode: 'dark',
          colors: ['#fff', '#000'],
        },
        block: {
          value: 'block_123',
          label: 'Block 123',
          externalId: '123',
        },
      };

      const result = extractReferenceValues(payload);

      expect(result).toEqual({
        name: 'Jane Doe',
        age: 28,
        isActive: true,
        emptyField: null,
        undefinedField: undefined,
        themeConfig: {
          mode: 'dark',
          colors: ['#fff', '#000'],
        },
        block: 'block_123',
      });
    });

    it('should support nested objects and arrays containing reference fields with externalId', () => {
      const nestedData = {
        organization: {
          id: 'org1',
          name: 'Main Org',
          externalId: 'ext_org1',
        },
        user: {
          location: {
            state: { _id: 'state_1', name: 'State 1', externalId: 's1' },
            district: { _id: 'dist_1', name: 'District 1', externalId: 'd1' },
            blocks: [
              { value: 'b1', label: 'Block B1', externalId: 'b1' },
              { value: 'b2', label: 'Block B2', externalId: 'b2' },
            ],
          },
        },
        tags: ['tag1', 'tag2'],
      };

      const result = extractReferenceValues(nestedData);

      expect(result).toEqual({
        organization: 'org1',
        user: {
          location: {
            state: 'state_1',
            district: 'dist_1',
            blocks: ['b1', 'b2'],
          },
        },
        tags: ['tag1', 'tag2'],
      });
    });

    it('should support nested objects and arrays containing reference fields without externalId', () => {
      const nestedData = {
        user: {
          school: {
            value: 'other',
            label: 'Ms kachiyama',
          },
          previousSchools: [
            { value: 'p1', label: 'Primary School A' },
            { value: 'p2', label: 'High School B' },
          ],
        },
      };

      const result = extractReferenceValues(nestedData);

      expect(result).toEqual({
        user: {
          school: 'Ms kachiyama',
          previousSchools: ['Primary School A', 'High School B'],
        },
      });
    });

    it('should handle already extracted IDs (backward compatibility)', () => {
      const alreadyClean = {
        block: '6852c8de7248c20014b38a9d',
        blocks: ['id1', 'id2'],
      };

      const result = extractReferenceValues(alreadyClean);
      expect(result).toEqual(alreadyClean);
    });

    it('should handle null and empty values safely', () => {
      expect(extractReferenceValues(null)).toBe(null);
      expect(extractReferenceValues(undefined)).toBe(undefined);
      expect(extractReferenceValues({})).toEqual({});
      expect(extractReferenceValues([])).toEqual([]);
    });
  });

  describe('normalizeSingleReference', () => {
    it('should normalize reference object to id and label', () => {
      const ref = {
        value: '6852c8de7248c20014b38a9d',
        label: 'AGARTALA MUNICIPAL COORPORATION',
      };
      const normalized = normalizeSingleReference(ref);
      expect(normalized).toEqual({
        id: '6852c8de7248c20014b38a9d',
        label: 'AGARTALA MUNICIPAL COORPORATION',
      });
    });

    it('should normalize primitive string ID', () => {
      const normalized = normalizeSingleReference('simple-id');
      expect(normalized).toEqual({
        id: 'simple-id',
        label: 'simple-id',
      });
    });

    it('should handle null and undefined', () => {
      expect(normalizeSingleReference(null)).toEqual({ id: '', label: '' });
      expect(normalizeSingleReference(undefined)).toEqual({
        id: '',
        label: '',
      });
    });
  });

  describe('normalizeMultiReference', () => {
    it('should normalize array of reference objects to ids and labels map', () => {
      const refs = [
        { value: 'id1', label: 'Block 1', externalId: '101' },
        { value: 'id2', label: 'Block 2', externalId: '102' },
      ];
      const normalized = normalizeMultiReference(refs);
      expect(normalized.ids).toEqual(['id1', 'id2']);
      expect(normalized.labelsMap).toEqual({
        id1: 'Block 1',
        id2: 'Block 2',
      });
    });

    it('should normalize array of string IDs', () => {
      const ids = ['id1', 'id2'];
      const normalized = normalizeMultiReference(ids);
      expect(normalized.ids).toEqual(['id1', 'id2']);
      expect(normalized.labelsMap).toEqual({});
    });

    it('should normalize mixed array of reference objects and string IDs', () => {
      const mixed = ['id1', { value: 'id2', label: 'Block 2' }];
      const normalized = normalizeMultiReference(mixed);
      expect(normalized.ids).toEqual(['id1', 'id2']);
      expect(normalized.labelsMap).toEqual({
        id2: 'Block 2',
      });
    });

    it('should handle single object passed instead of array', () => {
      const single = { value: 'id1', label: 'Block 1' };
      const normalized = normalizeMultiReference(single);
      expect(normalized.ids).toEqual(['id1']);
      expect(normalized.labelsMap).toEqual({ id1: 'Block 1' });
    });

    it('should handle empty or null values', () => {
      expect(normalizeMultiReference(null)).toEqual({ ids: [], labelsMap: {} });
      expect(normalizeMultiReference([])).toEqual({ ids: [], labelsMap: {} });
    });
  });

  describe('Asynchronously loaded dropdown options handling', () => {
    it('should retain label and value when options list is initially empty', () => {
      // 1. Initial state: prefilled value exists, but options have not arrived from API yet
      const prefilledValue = {
        value: '6852c8de7248c20014b38a9d',
        label: 'AGARTALA MUNICIPAL COORPORATION',
        externalId: '160101',
      };
      const initialAsyncOptions: any[] = [];

      const { id: selectedId, label: selectedLabel } =
        normalizeSingleReference(prefilledValue);

      // Synthesize missing prefilled option into options list
      const synthesizedOptions =
        selectedId && !initialAsyncOptions.some((opt) => opt.value === selectedId)
          ? [{ value: selectedId, label: selectedLabel || selectedId }, ...initialAsyncOptions]
          : initialAsyncOptions;

      expect(synthesizedOptions).toHaveLength(1);
      expect(synthesizedOptions[0]).toEqual({
        value: '6852c8de7248c20014b38a9d',
        label: 'AGARTALA MUNICIPAL COORPORATION',
      });

      // 2. Later state: async options arrive from API
      const loadedAsyncOptions = [
        { value: '6852c8de7248c20014b38a9d', label: 'AGARTALA MUNICIPAL COORPORATION' },
        { value: 'other_id', label: 'OTHER BLOCK' },
      ];

      const finalOptions =
        selectedId && !loadedAsyncOptions.some((opt) => opt.value === selectedId)
          ? [{ value: selectedId, label: selectedLabel || selectedId }, ...loadedAsyncOptions]
          : loadedAsyncOptions;

      expect(finalOptions).toHaveLength(2);
      expect(finalOptions[0].value).toBe('6852c8de7248c20014b38a9d');
    });

    it('should retain multi-select labels and values when options list is initially empty', () => {
      const prefilledMultiValue = [
        { value: 'id1', label: 'Block 1', externalId: '101' },
        { value: 'id2', label: 'Block 2', externalId: '102' },
      ];
      const initialAsyncOptions: any[] = [];

      const { ids, labelsMap } = normalizeMultiReference(prefilledMultiValue);

      const synthesizedOptions = [...initialAsyncOptions];
      ids.forEach((id) => {
        if (!synthesizedOptions.some((opt) => opt.value === id)) {
          synthesizedOptions.push({
            value: id,
            label: labelsMap[id] || id,
          });
        }
      });

      expect(ids).toEqual(['id1', 'id2']);
      expect(synthesizedOptions).toEqual([
        { value: 'id1', label: 'Block 1' },
        { value: 'id2', label: 'Block 2' },
      ]);
    });
  });

  describe('Generic Read to Create/Update workflow', () => {
    it('should transform full user profile with various reference fields into clean API payload', () => {
      const readProfile = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        state: { _id: 'state_101', name: 'Tripura', externalId: '101' },
        district: { _id: 'dist_201', name: 'West Tripura', externalId: '201' },
        block: {
          value: '6852c8de7248c20014b38a9d',
          label: 'AGARTALA MUNICIPAL COORPORATION',
          externalId: '160101',
        },
        blocks: [
          { value: 'id1', label: 'Block 1', externalId: '101' },
          { value: 'id2', label: 'Block 2', externalId: '102' },
        ],
        userSchool: {
          value: 'other',
          label: 'Ms kachiyama',
        },
        customFields: [
          {
            fieldId: 'custom_cluster_id',
            value: { value: 'cluster_99', label: 'Cluster 99', externalId: '99' },
          },
        ],
        unrelatedMetadata: {
          preferredTheme: 'light',
          notificationSettings: {
            sms: true,
            email: false,
          },
        },
      };

      const submittedPayload = extractReferenceValues(readProfile);

      expect(submittedPayload).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        state: 'state_101',
        district: 'dist_201',
        block: '6852c8de7248c20014b38a9d',
        blocks: ['id1', 'id2'],
        userSchool: 'Ms kachiyama',
        customFields: [
          {
            fieldId: 'custom_cluster_id',
            value: 'cluster_99',
          },
        ],
        unrelatedMetadata: {
          preferredTheme: 'light',
          notificationSettings: {
            sms: true,
            email: false,
          },
        },
      });
    });
  });
});
