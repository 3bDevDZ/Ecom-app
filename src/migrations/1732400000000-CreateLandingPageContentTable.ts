import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLandingPageContentTable1732400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'landing_page_content',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'hero_heading',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'hero_subheading',
            type: 'varchar',
            length: '300',
          },
          {
            name: 'hero_background_image_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'hero_cta_button_text',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'hero_cta_button_link',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'trust_logos',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'product_showcase',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'showroom_address',
            type: 'text',
          },
          {
            name: 'showroom_business_hours',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'showroom_map_image_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'contact_heading',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'contact_description',
            type: 'text',
          },
          {
            name: 'footer_company_description',
            type: 'text',
          },
          {
            name: 'footer_navigation_links',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'footer_copyright_text',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'is_published',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on is_published for faster queries
    await queryRunner.query(
      `CREATE INDEX "IDX_landing_page_content_is_published" ON "landing_page_content" ("is_published")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('landing_page_content');
  }
}
