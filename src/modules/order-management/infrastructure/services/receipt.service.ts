import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { MinioService } from '../../../../shared/infrastructure/storage/minio.service';
import { OrderDto } from '../../application/dtos/order.dto';

/**
 * Receipt Service
 *
 * Generates PDF receipts for orders and stores them in MinIO.
 */
@Injectable()
export class ReceiptService {
    private readonly logger = new Logger(ReceiptService.name);

    constructor(private readonly minioService: MinioService) { }

    /**
     * Generate and store a receipt PDF for an order
     *
     * @param order - Order DTO
     * @returns Promise with the receipt URL
     */
    async generateReceipt(order: OrderDto): Promise<string> {
        try {
            // Generate PDF
            const pdfBuffer = await this.generateReceiptPDF(order);

            // Store in MinIO receipts bucket
            const filePath = `${order.orderNumber}-${order.id}.pdf`;

            // Upload to receipts bucket
            const receiptUrl = await this.minioService.uploadFileToBucket(
                'receipts',
                filePath,
                pdfBuffer,
                'application/pdf',
            );

            this.logger.log(`Receipt generated for order ${order.orderNumber}: ${receiptUrl}`);
            return receiptUrl;
        } catch (error) {
            this.logger.error(`Failed to generate receipt for order ${order.orderNumber}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Generate receipt PDF buffer
     *
     * @param order - Order DTO
     * @returns Promise with PDF Buffer
     */
    private async generateReceiptPDF(order: OrderDto): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Header
                doc.fontSize(24).font('Helvetica-Bold').text('RECEIPT', { align: 'center' });
                doc.moveDown();

                // Company Info
                doc.fontSize(12).font('Helvetica').text('B2B E-Commerce Platform', { align: 'center' });
                doc.text('123 Business Street, Suite 100', { align: 'center' });
                doc.text('City, State 12345', { align: 'center' });
                doc.moveDown(2);

                // Order Info
                doc.fontSize(14).font('Helvetica-Bold').text(`Order Number: ${order.orderNumber}`);
                doc.fontSize(10).font('Helvetica').text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
                doc.text(`Status: ${order.status.toUpperCase()}`);
                doc.moveDown();

                // Shipping Address
                doc.fontSize(12).font('Helvetica-Bold').text('Shipping Address:');
                doc.fontSize(10).font('Helvetica');
                doc.text(`${order.shippingAddress.contactName}`);
                doc.text(order.shippingAddress.street);
                doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`);
                doc.text(order.shippingAddress.country);
                if (order.shippingAddress.contactPhone) {
                    doc.text(`Phone: ${order.shippingAddress.contactPhone}`);
                }
                doc.moveDown();

                // Items Table Header
                doc.fontSize(12).font('Helvetica-Bold');
                doc.text('Items', { underline: true });
                doc.moveDown(0.5);

                // Table Header Row
                const tableTop = doc.y;
                doc.fontSize(10);
                doc.text('SKU', 50, tableTop);
                doc.text('Product', 150, tableTop);
                doc.text('Qty', 400, tableTop, { width: 50, align: 'right' });
                doc.text('Price', 450, tableTop, { width: 60, align: 'right' });
                doc.text('Total', 510, tableTop, { width: 60, align: 'right' });

                // Draw line
                doc.moveTo(50, doc.y + 5).lineTo(570, doc.y + 5).stroke();
                doc.moveDown();

                // Items
                let yPosition = doc.y;
                order.items.forEach((item, index) => {
                    if (yPosition > 700) {
                        // New page if needed
                        doc.addPage();
                        yPosition = 50;
                    }

                    doc.font('Helvetica').fontSize(9);
                    doc.text(item.sku || 'N/A', 50, yPosition);
                    doc.text(item.productName || 'Product', 150, yPosition, { width: 240 });
                    doc.text(item.quantity.toString(), 400, yPosition, { width: 50, align: 'right' });
                    doc.text(`$${item.unitPrice.toFixed(2)}`, 450, yPosition, { width: 60, align: 'right' });
                    doc.text(`$${item.lineTotal.toFixed(2)}`, 510, yPosition, { width: 60, align: 'right' });

                    yPosition += 20;
                    doc.y = yPosition;
                });

                doc.moveDown();

                // Totals
                const subtotal = order.totalAmount;
                const tax = 0; // TODO: Add tax calculation
                const shipping = 0; // TODO: Add shipping calculation
                const total = subtotal + tax + shipping;

                const totalsY = doc.y;
                doc.fontSize(10).font('Helvetica');

                if (tax > 0) {
                    doc.text('Subtotal:', 450, totalsY, { width: 60, align: 'right' });
                    doc.text(`$${subtotal.toFixed(2)}`, 510, totalsY, { width: 60, align: 'right' });
                    doc.moveDown();

                    doc.text('Tax:', 450, doc.y, { width: 60, align: 'right' });
                    doc.text(`$${tax.toFixed(2)}`, 510, doc.y, { width: 60, align: 'right' });
                    doc.moveDown();

                    if (shipping > 0) {
                        doc.text('Shipping:', 450, doc.y, { width: 60, align: 'right' });
                        doc.text(`$${shipping.toFixed(2)}`, 510, doc.y, { width: 60, align: 'right' });
                        doc.moveDown();
                    }
                }

                // Total
                doc.fontSize(12).font('Helvetica-Bold');
                doc.text('Total:', 450, doc.y, { width: 60, align: 'right' });
                doc.text(`$${total.toFixed(2)}`, 510, doc.y, { width: 60, align: 'right' });

                // Footer
                doc.fontSize(8).font('Helvetica');
                doc.text('Thank you for your business!', 50, doc.page.height - 50, { align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get receipt URL for an order
     *
     * @param orderNumber - Order number
     * @param orderId - Order ID
     * @returns Promise with receipt URL or null if not found
     */
    async getReceiptUrl(orderNumber: string, orderId: string): Promise<string | null> {
        try {
            const filePath = `${orderNumber}-${orderId}.pdf`;
            const exists = await this.minioService.fileExistsInBucket('receipts', filePath);

            if (!exists) {
                return null;
            }

            return await this.minioService.getFileUrlFromBucket('receipts', filePath);
        } catch (error) {
            this.logger.error(`Failed to get receipt URL for order ${orderNumber}: ${error.message}`, error.stack);
            return null;
        }
    }

    /**
     * Download receipt PDF buffer
     *
     * @param orderNumber - Order number
     * @param orderId - Order ID
     * @returns Promise with PDF Buffer or null if not found
     */
    async downloadReceipt(orderNumber: string, orderId: string): Promise<Buffer | null> {
        try {
            const filePath = `${orderNumber}-${orderId}.pdf`;
            const exists = await this.minioService.fileExistsInBucket('receipts', filePath);

            if (!exists) {
                return null;
            }

            return await this.minioService.downloadFileFromBucket('receipts', filePath);
        } catch (error) {
            this.logger.error(`Failed to download receipt for order ${orderNumber}: ${error.message}`, error.stack);
            return null;
        }
    }
}

