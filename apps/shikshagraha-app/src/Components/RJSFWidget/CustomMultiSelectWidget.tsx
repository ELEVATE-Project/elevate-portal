// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { WidgetProps } from '@rjsf/utils';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useTranslation } from 'react-i18next';
import { FormHelperText } from '@mui/material';
import { normalizeMultiReference } from '../../utils/referenceFieldUtils';

const CustomMultiSelectWidget = ({
  id,
  options,
  value = [],
  required,
  label,
  onChange,
  schema,
  uiSchema,
}: WidgetProps) => {
  const enumOptions =
    uiSchema?.['ui:options']?.enumOptions ?? (options.enumOptions || []);
  const { t } = useTranslation();
  const lowerLabel = label?.toLowerCase();
  const isRoleField = lowerLabel === 'sub-role';
  const helperText = ' Please select a sub role.';

  // Normalize array of reference objects or primitive string IDs
  const { ids: selectedValues, labelsMap: prefilledLabelsMap } = useMemo(
    () => normalizeMultiReference(value),
    [value]
  );

  // Combine enumOptions with any prefilled options not yet present in enumOptions
  // (handles asynchronously loaded dropdown options)
  const effectiveEnumOptions = useMemo(() => {
    const existingIds = new Set(
      enumOptions.map((opt: any) => String(opt.value))
    );
    const synthesized: any[] = [];
    selectedValues.forEach((id) => {
      if (!existingIds.has(String(id)) && id) {
        synthesized.push({
          value: id,
          label: prefilledLabelsMap[id] || id,
          _originalData: null,
        });
      }
    });
    return synthesized.length > 0
      ? [...synthesized, ...enumOptions]
      : enumOptions;
  }, [enumOptions, selectedValues, prefilledLabelsMap]);

  const maxSelections = schema.maxSelection ?? effectiveEnumOptions.length;

  const [isAllSelected, setIsAllSelected] = useState(
    selectedValues.length > 0 &&
      selectedValues.length === effectiveEnumOptions.length
  );

  const isDisabled = uiSchema?.['ui:disabled'] === true;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsAllSelected(
      selectedValues.length > 0 &&
        selectedValues.length === effectiveEnumOptions.length
    );
  }, [selectedValues, effectiveEnumOptions]);

  const handleChange = (event: any) => {
    const selected = event.target.value;

    if (selected.includes('selectAll')) {
      if (isAllSelected) {
        onChange([]);
      } else {
        const allOptions = effectiveEnumOptions.slice(0, maxSelections);
        const mapped = allOptions.map((opt) =>
          opt._originalData
            ? opt._originalData
            : opt.label !== opt.value
            ? {
                value: opt.value,
                label: opt.label,
                ...(opt.externalId ? { externalId: opt.externalId } : {}),
              }
            : opt.value
        );
        onChange(mapped);
      }
    } else {
      if (Array.isArray(selected)) {
        if (selected.length <= maxSelections) {
          const mapped = selected.map((val) => {
            const opt = effectiveEnumOptions.find(
              (o) => String(o.value) === String(val)
            );
            if (opt?._originalData) return opt._originalData;
            if (opt && opt.label !== opt.value) {
              return {
                value: opt.value,
                label: opt.label,
                ...(opt.externalId ? { externalId: opt.externalId } : {}),
              };
            }
            return val;
          });
          onChange(mapped.length > 0 ? mapped : []);
          if (maxSelections === 1 && selected.length === 1) {
            setOpen(false);
          }
        }
      }
    }
  };

  const shouldShrinkLabel = open || selectedValues.length > 0;
  const labelId = `${id}-label`;

  return (
    <FormControl
      fullWidth
      disabled={isDisabled}
      error={false}
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
          display: 'flex',
          alignItems: 'center',
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
        {label}
        {isRoleField && <span style={{ color: 'red' }}>&nbsp;*</span>}
      </InputLabel>

      <Select
        id={id}
        multiple
        label={label}
        labelId={labelId}
        value={selectedValues}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={handleChange}
        renderValue={(selected: any) => {
          const arr = Array.isArray(selected) ? selected : [selected];
          return arr
            .map((val) => {
              const strVal = String(val);
              const found = effectiveEnumOptions.find(
                (option) => String(option.value) === strVal
              );
              if (found) {
                return t(`FORM.${found.label}`, {
                  defaultValue: found.label,
                });
              }
              if (prefilledLabelsMap[strVal]) {
                return t(`FORM.${prefilledLabelsMap[strVal]}`, {
                  defaultValue: prefilledLabelsMap[strVal],
                });
              }
              return strVal;
            })
            .filter(Boolean)
            .join(', ');
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: '300px',
            },
          },
        }}
        sx={{
          '& .MuiSelect-select': {
            padding: '10px 12px',
            fontSize: '12px !important',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            WebkitAppearance: 'none',
            borderRadius: '0',
            '@media screen and (-webkit-min-device-pixel-ratio: 0)': {
              fontSize: '12px !important',
            },
          },
          '& .MuiInputBase-root': {
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
          },
        }}
        error={false}
      >
        {effectiveEnumOptions.length > 1 &&
          maxSelections >= effectiveEnumOptions.length && (
            <MenuItem
              key="selectAll"
              value="selectAll"
              disabled={effectiveEnumOptions.length === 1}
            >
              <Checkbox checked={isAllSelected} />
              <ListItemText
                primary={isAllSelected ? 'Deselect All' : 'Select All'}
              />
            </MenuItem>
          )}

        {effectiveEnumOptions
          .filter((option) => option.value !== 'Select')
          .map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={
                selectedValues.length >= maxSelections &&
                !selectedValues.includes(String(option.value))
              }
            >
              <Checkbox checked={selectedValues.includes(String(option.value))} />
              <ListItemText
                primary={t(`FORM.${option.label}`, {
                  defaultValue: option.label,
                })}
              />
            </MenuItem>
          ))}
      </Select>
      {helperText && selectedValues.length === 0 && (
        <FormHelperText
          sx={{
            color: 'red',
            fontSize: '11px',
            marginLeft: '0px',
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default CustomMultiSelectWidget;
