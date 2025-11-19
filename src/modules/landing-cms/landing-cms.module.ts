import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Landing CMS Module (Bounded Context)
 * 
 * Responsibilities:
 * - Landing page content management
 * - Hero sections, banners, featured products
 * - Static content serving (About, Contact, etc.)
 * - Server-side rendering with Handlebars
 * - Content versioning and scheduling
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      // ContentEntity, BannerEntity will be added later
    ]),
  ],
  controllers: [
    // LandingPageController will be added in T014
  ],
  providers: [
    // Command handlers, query handlers, repositories will be added later
  ],
  exports: [],
})
export class LandingCmsModule {}

