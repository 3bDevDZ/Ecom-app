import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export class ContentUpdated extends DomainEvent {
  public readonly eventType = 'landing-cms.content-updated';

  constructor(
    aggregateId: string,
    public readonly section: string,
  ) {
    super(aggregateId);
  }
}
