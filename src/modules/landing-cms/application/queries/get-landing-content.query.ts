import { IQuery } from '@nestjs/cqrs';

export class GetLandingContentQuery implements IQuery {
  constructor(public readonly includeUnpublished: boolean = false) {}
}
