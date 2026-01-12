/**
 * @file Input.tsx
 * @description 通用輸入框組件 / Common Input Component
 * @description_en Reusable input component with label and error support
 * @description_zh 支援標籤與錯誤訊息的通用輸入框
 */

import React, { forwardRef } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, fullWidth = false, ...props }, ref) => {
        const inputClasses = `erp-input ${error ? 'erp-input--error' : ''} ${className}`;
        const wrapperClasses = `erp-input-wrapper ${fullWidth ? 'w-full' : ''}`;

        return (
            <div className={wrapperClasses}>
                {label && <label className="erp-input-label">{label}</label>}
                <input
                    ref={ref}
                    className={inputClasses}
                    {...props}
                />
                {error && <span className="erp-input-error">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
