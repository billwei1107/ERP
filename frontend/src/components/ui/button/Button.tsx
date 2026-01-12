/**
 * @file Button.tsx
 * @description 通用按鈕組件 / Common Button Component
 * @description_en Reusable button component with different variants and sizes
 * @description_zh 可重用的按鈕組件，支援不同變體與尺寸
 */

import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
}

/**
 * 按鈕組件 / Button Component
 * @param variant 按鈕樣式變體 (primary, secondary, etc.)
 * @param size 按鈕尺寸
 * @param fullWidth 是否滿版寬度
 * @param isLoading 是否顯示載入中狀態
 */
export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    disabled,
    ...props
}) => {
    const baseClass = 'erp-btn';
    const classes = `${baseClass} ${baseClass}--${variant} ${baseClass}--${size} ${fullWidth ? `${baseClass}--full-width` : ''} ${className}`;

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="erp-btn__loader">...</span>
            ) : children}
        </button>
    );
};
