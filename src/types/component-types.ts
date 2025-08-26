import type { CheckResult } from './types';

/**
 * Hero feature item props
 */
export interface FeatureItemProps {
  text: string;
  isSeparator?: boolean;
}

/**
 * Country status type
 */
export type CountryStatus = 'pending' | 'loading' | 'completed' | 'error';

/**
 * Country with support information
 */
export type CountryWithSupport = {
  code: string;
  name: string;
  region: string;
  continent: string;
  supported: boolean;
};

/**
 * Country card props
 */
export interface CountryCardProps {
  country: { code: string; name: string; region: string };
  status: CountryStatus;
  result?: CheckResult;
}

/**
 * Results grid props
 */
export interface ResultsGridProps {
  countries: Array<{
    code: string;
    name: string;
    region: string;
    status: CountryStatus;
    result?: CheckResult;
  }>;
}

/**
 * Streaming results props
 */
export interface StreamingResultsProps {
  url: string;
  countries?: string[];
}

/**
 * Countries grid props for supported countries
 */
export interface CountriesGridProps {
  countries: CountryWithSupport[];
}

/**
 * Layout component props
 */
export interface PageLayoutProps {
  children: React.ReactNode;
}

/**
 * Provider component props
 */
export interface ProvidersProps {
  children: React.ReactNode;
}
