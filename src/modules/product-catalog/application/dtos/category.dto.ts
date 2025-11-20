/**
 * CategoryDto
 *
 * Data Transfer Object for categories.
 * Used in query responses to return category information.
 */
export class CategoryDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly parentId: string | null,
    public readonly displayOrder: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly productCount?: number, // Optional: number of products in this category
    public readonly subcategories?: CategoryDto[], // Optional: child categories for hierarchical display
  ) {}

  /**
   * Check if this is a root category (no parent)
   */
  public get isRoot(): boolean {
    return this.parentId === null;
  }

  /**
   * Check if this category has subcategories
   */
  public get hasSubcategories(): boolean {
    return this.subcategories !== undefined && this.subcategories.length > 0;
  }
}
