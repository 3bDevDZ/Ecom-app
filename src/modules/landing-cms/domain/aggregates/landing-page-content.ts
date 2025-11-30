import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { Result } from '../../../../shared/domain/result';
import { HeroSection } from '../value-objects/hero-section';
import { TrustLogos } from '../value-objects/trust-logos';
import { ProductShowcase } from '../value-objects/product-showcase';
import { ShowroomInfo } from '../value-objects/showroom-info';
import { ContactSection } from '../value-objects/contact-section';
import { FooterContent } from '../value-objects/footer-content';
import { ContentUpdated } from '../events/content-updated';
import { ContentPublished } from '../events/content-published';
import { v4 as uuid } from 'uuid';

interface LandingPageContentProps {
  heroSection: HeroSection;
  trustLogos: TrustLogos;
  productShowcase: ProductShowcase;
  showroomInfo: ShowroomInfo;
  contactSection: ContactSection;
  footerContent: FooterContent;
  isPublished?: boolean;
}

export class LandingPageContent extends AggregateRoot {
  private _heroSection: HeroSection;
  private _trustLogos: TrustLogos;
  private _productShowcase: ProductShowcase;
  private _showroomInfo: ShowroomInfo;
  private _contactSection: ContactSection;
  private _footerContent: FooterContent;
  private _isPublished: boolean;

  private constructor(props: LandingPageContentProps, id?: string) {
    super(id || uuid());
    this._heroSection = props.heroSection;
    this._trustLogos = props.trustLogos;
    this._productShowcase = props.productShowcase;
    this._showroomInfo = props.showroomInfo;
    this._contactSection = props.contactSection;
    this._footerContent = props.footerContent;
    this._isPublished = props.isPublished || false;
  }

  get heroSection(): HeroSection {
    return this._heroSection;
  }

  get trustLogos(): TrustLogos {
    return this._trustLogos;
  }

  get productShowcase(): ProductShowcase {
    return this._productShowcase;
  }

  get showroomInfo(): ShowroomInfo {
    return this._showroomInfo;
  }

  get contactSection(): ContactSection {
    return this._contactSection;
  }

  get footerContent(): FooterContent {
    return this._footerContent;
  }

  get isPublished(): boolean {
    return this._isPublished;
  }

  public static create(props: LandingPageContentProps, id?: string): Result<LandingPageContent> {
    const content = new LandingPageContent(props, id);
    return Result.ok<LandingPageContent>(content);
  }

  public updateHero(heroSection: HeroSection): Result<void> {
    this._heroSection = heroSection;
    this._isPublished = false;
    this.touch();
    this.apply(new ContentUpdated(this.id, 'hero'));
    return Result.ok<void>();
  }

  public updateTrustLogos(trustLogos: TrustLogos): Result<void> {
    this._trustLogos = trustLogos;
    this._isPublished = false;
    this.touch();
    this.apply(new ContentUpdated(this.id, 'trust-logos'));
    return Result.ok<void>();
  }

  public updateProductShowcase(productShowcase: ProductShowcase): Result<void> {
    this._productShowcase = productShowcase;
    this._isPublished = false;
    this.touch();
    this.apply(new ContentUpdated(this.id, 'product-showcase'));
    return Result.ok<void>();
  }

  public updateShowroomInfo(showroomInfo: ShowroomInfo): Result<void> {
    this._showroomInfo = showroomInfo;
    this._isPublished = false;
    this.touch();
    this.apply(new ContentUpdated(this.id, 'showroom-info'));
    return Result.ok<void>();
  }

  public updateContactSection(contactSection: ContactSection): Result<void> {
    this._contactSection = contactSection;
    this._isPublished = false;
    this.touch();
    this.apply(new ContentUpdated(this.id, 'contact'));
    return Result.ok<void>();
  }

  public updateFooterContent(footerContent: FooterContent): Result<void> {
    this._footerContent = footerContent;
    this._isPublished = false;
    this.touch();
    this.apply(new ContentUpdated(this.id, 'footer'));
    return Result.ok<void>();
  }

  public publish(): void {
    this._isPublished = true;
    this.touch();
    this.apply(new ContentPublished(this.id));
  }

  public preview(): LandingPageContentPreview {
    return {
      heroSection: this._heroSection,
      trustLogos: this._trustLogos,
      productShowcase: this._productShowcase,
      showroomInfo: this._showroomInfo,
      contactSection: this._contactSection,
      footerContent: this._footerContent,
    };
  }
}

export interface LandingPageContentPreview {
  heroSection: HeroSection;
  trustLogos: TrustLogos;
  productShowcase: ProductShowcase;
  showroomInfo: ShowroomInfo;
  contactSection: ContactSection;
  footerContent: FooterContent;
}
