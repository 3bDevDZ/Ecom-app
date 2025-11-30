import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { LANDING_CONTENT_REPOSITORY } from './domain/repositories/ilanding-content-repository';
import { LandingPageContentEntity } from './infrastructure/persistence/entities/landing-page-content.entity';
import { LandingContentRepository } from './infrastructure/persistence/repositories/landing-content.repository';

// Application - Command Handlers
import {
  PublishContentHandler,
  UpdateContactSectionHandler,
  UpdateFooterContentHandler,
  UpdateHeroHandler,
  UpdateProductShowcaseHandler,
  UpdateShowroomInfoHandler,
  UpdateTrustLogosHandler
} from './application/handlers/command.handlers';

// Application - Query Handlers
import { GetLandingContentHandler } from './application/handlers/query.handlers';

// Infrastructure - Event Handlers
import {
  ContentPublishedHandler,
  ContentUpdatedHandler,
} from './infrastructure/events/content-event.handlers';

// Presentation
import {
  LandingCmsController,
  LandingPageController,
} from './presentation/controllers/landing-cms.controller';
import { LandingPresenter } from './presentation/presenters/landing.presenter';

// Import Identity Module for authentication guards
import { IdentityModule } from '../identity/identity.module';

/**
 * Landing CMS Module (Bounded Context)
 *
 * Responsibilities:
 * - Landing page content management via admin CMS
 * - Hero sections, trust logos, product showcase
 * - Dynamic content rendering with Handlebars
 * - Content publishing workflow
 */

// Command Handlers
const commandHandlers = [
  UpdateHeroHandler,
  UpdateTrustLogosHandler,
  UpdateProductShowcaseHandler,
  UpdateShowroomInfoHandler,
  UpdateContactSectionHandler,
  UpdateFooterContentHandler,
  PublishContentHandler,
];

// Query Handlers
const queryHandlers = [GetLandingContentHandler];

// Event Handlers
const eventHandlers = [ContentUpdatedHandler, ContentPublishedHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([LandingPageContentEntity]),
    IdentityModule, // Required for JWT authentication guards
  ],
  controllers: [LandingCmsController, LandingPageController],
  providers: [
    // Repository
    {
      provide: LANDING_CONTENT_REPOSITORY,
      useClass: LandingContentRepository,
    },

    // Presenter
    LandingPresenter,

    // CQRS Handlers
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
  exports: [LANDING_CONTENT_REPOSITORY, LandingPresenter],
})
export class LandingCmsModule { }
