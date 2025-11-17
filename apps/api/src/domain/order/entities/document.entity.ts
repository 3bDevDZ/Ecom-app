/**
 * Document Entity
 * Represents order-related documents (Invoice, Delivery Note, etc.)
 */
export enum DocumentType {
  INVOICE = 'INVOICE',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  RETURN_LABEL = 'RETURN_LABEL',
  RECEIPT = 'RECEIPT',
}

export interface DocumentProps {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  createdAt: Date;
}

export class Document {
  private constructor(private readonly props: DocumentProps) {
    this.validate();
  }

  static create(props: DocumentProps): Document {
    return new Document(props);
  }

  getId(): string {
    return this.props.id;
  }

  getType(): DocumentType {
    return this.props.type;
  }

  getName(): string {
    return this.props.name;
  }

  getUrl(): string {
    return this.props.url;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getIcon(): string {
    const icons: Record<DocumentType, string> = {
      [DocumentType.INVOICE]: 'invoice-icon',
      [DocumentType.DELIVERY_NOTE]: 'delivery-icon',
      [DocumentType.RETURN_LABEL]: 'return-icon',
      [DocumentType.RECEIPT]: 'receipt-icon',
    };
    return icons[this.props.type];
  }

  toJSON() {
    return {
      id: this.props.id,
      type: this.props.type,
      name: this.props.name,
      url: this.props.url,
      createdAt: this.props.createdAt.toISOString(),
      icon: this.getIcon(),
    };
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('Document ID is required');
    }
    if (!this.props.name?.trim()) {
      throw new Error('Document name is required');
    }
    if (!this.props.url?.trim()) {
      throw new Error('Document URL is required');
    }
  }
}
