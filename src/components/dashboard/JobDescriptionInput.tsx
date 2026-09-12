'use client';
import { useState } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function JobDescriptionInput({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false);
  const isValid = value.length >= 50;
  const isError = focused && !isValid && value.length > 0;

  return (
    <div className="flex flex-col h-full">
      <label className="text-sm font-medium text-gray-700 mb-1">2. Target Job Description</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Paste the target job description here..."
        className={`flex-1 min-h-[150px] p-3 border rounded-lg resize-none focus:ring-2 focus:outline-none ${
          isError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
        }`}
      />
      <div className="flex justify-between items-center mt-2 text-xs">
        <span className={isError ? 'text-red-500' : 'text-gray-500'}>
          {value.length} / 15000 characters
        </span>
        {!isValid && value.length > 0 && (
          <span className="text-red-500 font-medium">Minimum 50 characters required</span>
        )}
      </div>
    </div>
  );
}
