import type { FeatureProps } from '@/types/types';
import type { FeatureData, HeroFeatureItem } from '@/types/utility-types';

/**
 * Maps feature data to feature props
 */
export function mapFeatureDataToProps(
  featureData: FeatureData[]
): FeatureProps[] {
  return featureData.map(feature => ({
    icon: feature.icon,
    title: feature.title,
    description: feature.description,
  }));
}

/**
 * Gets hero feature items with separators
 */
export function getHeroFeatureItems(
  features: readonly string[]
): HeroFeatureItem[] {
  const items: HeroFeatureItem[] = [];
  const separator = '•';

  features.forEach((feature, index) => {
    items.push({ text: feature, isSeparator: false });

    // Add separator after each feature except the last one
    if (index < features.length - 1) {
      items.push({ text: separator, isSeparator: true });
    }
  });

  return items;
}
