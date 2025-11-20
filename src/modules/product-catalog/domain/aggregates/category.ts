import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';

/**
 * Category Aggregate Root
 *
 * Organizes products into hierarchical categories.
 * Categories can have subcategories (parent-child relationships).
 *
 * @example
 * const electronics = Category.create(
 *   'cat-1',
 *   'Electronics',
 *   'electronics',
 *   'Electronic devices and accessories'
 * );
 *
 * const laptops = Category.create(
 *   'cat-2',
 *   'Laptops',
 *   'laptops',
 *   'Laptop computers',
 *   'cat-1' // parent ID
 * );
 */
export class Category extends AggregateRoot {
  private _name: string;
  private _slug: string;
  private _description: string | null;
  private _parentId: string | null;
  private _displayOrder: number;
  private _isActive: boolean;

  private constructor(
    id: string,
    name: string,
    slug: string,
    description: string | null = null,
    parentId: string | null = null,
  ) {
    super(id);
    this._name = name;
    this._slug = slug;
    this._description = description;
    this._parentId = parentId;
    this._displayOrder = 0;
    this._isActive = true;
  }

  public static create(
    id: string,
    name: string,
    slug: string,
    description: string | null = null,
    parentId: string | null = null,
  ): Category {
    Category.validateName(name);
    Category.validateSlug(slug);

    return new Category(id, name, slug, description, parentId);
  }

  get name(): string {
    return this._name;
  }

  get slug(): string {
    return this._slug;
  }

  get description(): string | null {
    return this._description;
  }

  get parentId(): string | null {
    return this._parentId;
  }

  get displayOrder(): number {
    return this._displayOrder;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
  }

  private static validateSlug(slug: string): void {
    if (!slug || slug.trim().length === 0) {
      throw new Error('Category slug cannot be empty');
    }

    // Slug must be URL-friendly (lowercase alphanumeric with hyphens)
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      throw new Error('Category slug must be URL-friendly (lowercase alphanumeric with hyphens)');
    }
  }

  public updateDetails(name: string, description: string | null): void {
    Category.validateName(name);

    this._name = name.trim();
    this._description = description;
    this.touch();
  }

  public setDisplayOrder(order: number): void {
    if (order < 0) {
      throw new Error('Display order cannot be negative');
    }

    this._displayOrder = order;
    this.touch();
  }

  public activate(): void {
    this._isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  public isRootCategory(): boolean {
    return this._parentId === null;
  }
}
