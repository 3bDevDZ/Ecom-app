import { AddressProps } from '../../domain/value-objects/address';

/**
 * Place order command
 */
export class PlaceOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly shippingAddress: AddressProps,
    public readonly poNumber?: string,
    public readonly notes?: string,
  ) { }
}

