import { LandingPageContent } from '../aggregates/landing-page-content';

export interface ILandingContentRepository {
  /**
   * Find the landing page content (there should only be one)
   */
  findCurrent(): Promise<LandingPageContent | null>;

  /**
   * Save landing page content
   */
  save(content: LandingPageContent): Promise<void>;

  /**
   * Check if landing page content exists
   */
  exists(): Promise<boolean>;
}

export const LANDING_CONTENT_REPOSITORY = Symbol('ILandingContentRepository');
