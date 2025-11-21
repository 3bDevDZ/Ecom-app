/**
 * Add item to cart command
 */
export class AddToCartCommand {
  constructor(
    public readonly userId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly variantId?: string,
  ) { }
}

