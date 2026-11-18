import React, { useEffect, useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useTranslation } from 'react-i18next';
import { FormHelperText } from '@mui/material';
import { getSubroles } from '../../services/LoginService';
import {
  normalizeSingleReference,
  isReferenceObject,
} from '../../utils/referenceFieldUtils';

interface EnumOption {
  value: string;
  label: string;
  _originalData?: any;
  disabled?: boolean;
}

const CustomSingleSelectWidget = ({
  id,
  options,
  value = '',
  required,
  label,
  onChange,
  schema,
  uiSchema,
  rawErrors = [],
  onSubrolesChange,
}: WidgetProps & { onSubrolesChange?: (subroles: any[]) => void }) => {
  // Enhanced options resolution
  const enumOptions: EnumOption[] = React.useMemo(() => {
    // 1. First check uiSchema options (most reliable)
    if (uiSchema?.['ui:options']?.enumOptions) {
      return (uiSchema['ui:options'].enumOptions as EnumOption[]) || [];
    }

    // 2. Check direct options prop
    if (options?.enumOptions) {
      return (options.enumOptions as EnumOption[]) || [];
    }

    // 3. Fallback to schema.enum + enumNames (legacy support)
    if (schema.enum && schema.enumNames) {
      return schema.enum.map((value: any, index: number) => ({
        value: String(value),
        label: schema.enumNames[index] ?? String(value),
      }));
    }

    // 4. Final fallback - schema.enum only
    if (schema.enum) {
      return schema.enum.map((value: any) => ({
        value: String(value),
        label: String(value),
      }));
    }

    return [];
  }, [uiSchema, options, schema]);

  // Normalize reference object or primitive ID
  const { id: selectedId, label: selectedLabel } = React.useMemo(
    () => normalizeSingleReference(value),
    [value]
  );

  // Synthesize missing prefilled options if options load asynchronously
  const effectiveEnumOptions: EnumOption[] = React.useMemo(() => {
    if (
      selectedId &&
      !enumOptions.some((opt) => String(opt.value) === String(selectedId))
    ) {
      return [
        {
          value: selectedId,
          label: selectedLabel || selectedId,
          _originalData: isReferenceObject(value) ? value : null,
        },
        ...enumOptions,
      ];
    }
    return enumOptions;
  }, [enumOptions, selectedId, selectedLabel, value]);

  const { t } = useTranslation();
  const [subRolesVisible, setSubRolesVisible] = useState(false);
  const [subRoles, setSubRoles] = useState<any[]>([]);
  const isDisabled = uiSchema?.['ui:disabled'] === true;
  const isEmptyOptionIncluded = schema?.allowEmptyOption || false;
  const lowerLabel = label?.toLowerCase();
  const isRoleField = lowerLabel === 'role';
  const helperText = 'Please select a role.';

  // Filter out 'is a required property' messages
  const displayErrors = rawErrors.filter(
    (error) => !error.toLowerCase().includes('required')
  );

  const [open, setOpen] = useState(false);

  const handleChange = async (event: any) => {
    const selected = event.target.value;
    const selectedOption = effectiveEnumOptions.find(
      (option: EnumOption) => String(option.value) === String(selected)
    );

    // Preserve reference object so label and externalId presence are maintained for submission
    const valueToPass = (selectedOption as any)?._originalData
      ? (selectedOption as any)._originalData
      : selectedOption && selectedOption.label !== selectedOption.value
      ? {
          value: selectedOption.value,
          label: selectedOption.label,
          ...((selectedOption as any).externalId
            ? { externalId: (selectedOption as any).externalId }
            : {}),
        }
      : selected;

    onChange(valueToPass);

    if (isRoleField && selected) {
      try {
        const roleIdToFetch = selectedOption?._originalData?._id;
        localStorage.setItem('role', roleIdToFetch);

        if (roleIdToFetch) {
          const subrolesResponse = await getSubroles(roleIdToFetch);
          const subrolesData = subrolesResponse.result ?? [];

          const formattedSubroles = subrolesData?.data?.map((subrole: any) => ({
            value: subrole._id,
            label: subrole.name,
            _originalData: subrole,
          }));

          if (onSubrolesChange) {
            onSubrolesChange(formattedSubroles);
          }
        }
      } catch (error) {
        console.error('Error fetching subroles:', error);
        if (onSubrolesChange) {
          onSubrolesChange([]);
        }
      }
    }
  };

  useEffect(() => {
    // if (value === 'HT & Officials') {
    setSubRolesVisible(true);
    // }
  }, [value]);

  // Determine what helper text to show
  const getHelperText = () => {
    // Show validation errors first
    if (displayErrors.length > 0) {
      return displayErrors[0];
    }

    // Show helper text for role field when no value is selected
    if (isRoleField && !selectedId) {
      return helperText;
    }

    // Show required field message for other fields when no value is selected
    if (required && !selectedId) {
      return `${label} is required`;
    }

    return '';
  };

  const shouldShowHelperText = () => {
    return getHelperText() !== '';
  };

  const shouldShrinkLabel = open || Boolean(selectedId);
  const labelId = `${id}-label`;

  return (
    <FormControl
      fullWidth
      size="small"
      disabled={isDisabled}
      error={rawErrors && rawErrors.length > 0}
      sx={{
        '& .MuiOutlinedInput-notchedOutline > legend': {
          maxWidth: '0.01px',
          transition: 'max-width 150ms ease',
        },
        '& .MuiInputLabel-shrink + .MuiOutlinedInput-notchedOutline > legend': {
          maxWidth: '1000px',
        },
      }}
    >
      <InputLabel
        id={labelId}
        shrink={shouldShrinkLabel}
        sx={{
          fontSize: '12px',
          zIndex: 1,
          '&.MuiInputLabel-shrink': {
            backgroundColor: '#fff',
            padding: '0 4px',
          },
          '@supports (-webkit-touch-callout: none)': {
            '&.MuiInputLabel-shrink': {
              transform: 'translate(12px, -9px) scale(0.75) !important',
              backgroundColor: '#fff',
              padding: '0 4px',
            },
          },
          '&.Mui-focused': {
            color: '#000000 !important',
          },
          '&.Mui-focused.MuiInputLabel-shrink': {
            color: '#000000 !important',
          },
        }}
      >
        {isRoleField ? (
          <>
            {label}
            <span style={{ color: 'red' }}> *</span>
          </>
        ) : (
          label
        )}
      </InputLabel>

      <Select
        id={id}
        labelId={labelId}
        value={selectedId ?? ''}
        onChange={handleChange}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        displayEmpty
        label={label}
        renderValue={(selected) => {
          if (!selected) {
            return isEmptyOptionIncluded ? <em>{t('FORM.Select')}</em> : '';
          }
          const found = effectiveEnumOptions.find(
            (opt: EnumOption) => String(opt.value) === String(selected)
          );
          if (found) {
            return t(`FORM.${found.label}`, { defaultValue: found.label });
          }
          if (selectedLabel) return selectedLabel;
          return String(selected);
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
              zIndex: 1300, // Ensure dropdown appears above other elements
            },
          },
        }}
        sx={{
          '& .MuiSelect-select': {
            padding: '10px 12px',
            fontSize: '12px !important', // Ensure 16px font size to prevent iOS zoom
            // iOS Safari zoom prevention
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            WebkitAppearance: 'none',
            borderRadius: '0',
            // Prevent zoom on focus
            '@media screen and (-webkit-min-device-pixel-ratio: 0)': {
              fontSize: '12px !important',
            },
          },
          // Additional iOS fixes
          '& .MuiInputBase-root': {
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
          },
        }}
      >
        {isEmptyOptionIncluded && (
          <MenuItem value="">
            <em>
              {t('FORM.Select')}
              {required && '*'}
            </em>
          </MenuItem>
        )}

        {effectiveEnumOptions.length > 0 ? (
          effectiveEnumOptions.map((option: EnumOption) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {t(`FORM.${option.label}`, { defaultValue: option.label })}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No options available</MenuItem>
        )}
      </Select>

      {shouldShowHelperText() && (
        <FormHelperText
          sx={{
            color:
              rawErrors && rawErrors.length > 0
                ? 'error.main'
                : 'text.secondary',
            fontSize: '11px',
            marginLeft: '0px',
          }}
        >
          {getHelperText()}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default CustomSingleSelectWidget;
