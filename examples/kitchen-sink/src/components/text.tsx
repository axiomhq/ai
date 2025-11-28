import { ReactNode, createElement } from 'react';

type TextVariant = 'h1' | 'subtitle' | 'h2' | 'paragraph';

interface TextProps {
  variant: TextVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<TextVariant, string> = {
  h1: 'mb-4 text-3xl font-bold text-balance',
  subtitle: 'text-lg leading-7 text-balance text-gray-700 mb-5',
  h2: 'mt-10 mb-4 scroll-mt-18 text-xl font-medium text-balance',
  paragraph: 'mb-4 text-gray-800',
};

const variantElements: Record<TextVariant, string> = {
  h1: 'h1',
  subtitle: 'p',
  h2: 'h2',
  paragraph: 'p',
};

export const Text = ({ variant, children, className = '' }: TextProps) => {
  const elementType = variantElements[variant];
  const baseStyles = variantStyles[variant];
  const combinedClassName = className ? `${baseStyles} ${className}` : baseStyles;

  return createElement(elementType, { className: combinedClassName }, children);
};
