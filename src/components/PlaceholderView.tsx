
import React from 'react';
import { useTranslation } from 'react-i18next';

interface PlaceholderViewProps {
  title: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title }) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center text-vscode-text-secondary bg-vscode-bg-sidebar p-8">
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-vscode-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-vscode-text-primary">{title}</h2>
        <p className="mt-2 text-lg text-vscode-text-secondary">{t('featureUnderConstruction')}</p>
      </div>
    </div>
  );
};
