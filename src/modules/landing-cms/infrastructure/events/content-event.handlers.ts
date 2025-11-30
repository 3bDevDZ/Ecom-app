import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ContentUpdated } from '../../domain/events/content-updated';
import { ContentPublished } from '../../domain/events/content-published';

@EventsHandler(ContentUpdated)
export class ContentUpdatedHandler implements IEventHandler<ContentUpdated> {
  private readonly logger = new Logger(ContentUpdatedHandler.name);

  handle(event: ContentUpdated): void {
    this.logger.log(
      `Landing page content section "${event.section}" updated for aggregate ${event.aggregateId}`,
    );

    // Here you could:
    // - Invalidate cache for landing page
    // - Publish integration event to message broker
    // - Trigger notifications to admins
    // - Update search index
  }
}

@EventsHandler(ContentPublished)
export class ContentPublishedHandler implements IEventHandler<ContentPublished> {
  private readonly logger = new Logger(ContentPublishedHandler.name);

  handle(event: ContentPublished): void {
    this.logger.log(`Landing page content published for aggregate ${event.aggregateId}`);

    // Here you could:
    // - Clear CDN cache
    // - Publish integration event to notify other services
    // - Trigger deployment of static pages
    // - Send notification to stakeholders
  }
}
