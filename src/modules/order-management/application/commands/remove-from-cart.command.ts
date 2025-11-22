/**
 * Remove item from cart command
 */
export class RemoveFromCartCommand {
  constructor(
    public readonly userId: string,
    public readonly itemId: string,
  ) {}
}

