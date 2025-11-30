import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export class ContentPublished extends DomainEvent {
  public readonly eventType = 'landing-cms.content-published';

  constructor(aggregateId: string) {
    super(aggregateId);
  }
}
