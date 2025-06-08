import React from 'react';
import { OptionType } from '../types';

interface SelectInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | OptionType[];
}

const SelectInput: React.FC<SelectInputProps> = ({ id, label, value, onChange, options }) => {
  const isOptionObject = (option: any): option is OptionType => {
    return typeof option === 'object' && option !== null && 'value' in option && 'label' in option;
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-100"
        aria-label={label}
      >
        {options.map(option => {
          if (isOptionObject(option)) {
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          }
          // Handle simple string options (backward compatibility or specific use cases)
          return (
            <option key={option} value={option === "None" || option.startsWith("Pilih") ? "" : option}>
              {option}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default SelectInput;
