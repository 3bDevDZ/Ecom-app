/**
 * Cancel order command
 */
export class CancelOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly orderId: string,
    public readonly reason: string,
  ) {}
}

