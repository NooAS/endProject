import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

/**
 * Generate PDF for a quote
 * @param {Object} quote - Quote object with items
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateQuotePDF = async (quote, options = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            // Collect PDF chunks
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('Смета работ', { align: 'center' });
            doc.moveDown();

            // Quote info
            doc.fontSize(12);
            doc.text(`Название: ${quote.name}`);
            doc.text(`Дата: ${new Date(quote.createdAt).toLocaleDateString('ru-RU')}`);
            doc.moveDown();

            // Table header
            const tableTop = doc.y;
            const colWidths = {
                category: 100,
                room: 80,
                job: 150,
                quantity: 60,
                price: 70,
                total: 70
            };

            doc.fontSize(10).font('Helvetica-Bold');
            let x = 50;
            doc.text('Категория', x, tableTop, { width: colWidths.category });
            x += colWidths.category;
            doc.text('Комната', x, tableTop, { width: colWidths.room });
            x += colWidths.room;
            doc.text('Работа', x, tableTop, { width: colWidths.job });
            x += colWidths.job;
            doc.text('Кол-во', x, tableTop, { width: colWidths.quantity });
            x += colWidths.quantity;
            doc.text('Цена', x, tableTop, { width: colWidths.price });
            x += colWidths.price;
            doc.text('Итого', x, tableTop, { width: colWidths.total });

            // Draw line under header
            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Table rows
            doc.font('Helvetica');
            let y = tableTop + 20;

            if (quote.items && quote.items.length > 0) {
                quote.items.forEach((item, index) => {
                    // Check if we need a new page
                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                    }

                    x = 50;
                    doc.text(item.category || '-', x, y, { width: colWidths.category });
                    x += colWidths.category;
                    doc.text(item.room || '-', x, y, { width: colWidths.room });
                    x += colWidths.room;
                    doc.text(item.job || '-', x, y, { width: colWidths.job });
                    x += colWidths.job;
                    doc.text(item.quantity.toString(), x, y, { width: colWidths.quantity });
                    x += colWidths.quantity;
                    doc.text(item.price.toFixed(2), x, y, { width: colWidths.price });
                    x += colWidths.price;
                    doc.text(item.total.toFixed(2), x, y, { width: colWidths.total });

                    y += 20;
                });
            }

            // Draw line before total
            doc.moveTo(50, y).lineTo(550, y).stroke();
            y += 10;

            // Total
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text(`Общая сумма: ${quote.total.toFixed(2)} руб.`, 50, y, { align: 'right' });

            // Footer
            doc.fontSize(8).font('Helvetica');
            doc.text(
                `Документ сгенерирован ${new Date().toLocaleDateString('ru-RU')}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            // Finalize PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate detailed PDF with material and labor breakdown
 * @param {Object} quote - Quote object with items
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateDetailedQuotePDF = async (quote) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('Детальная смета работ', { align: 'center' });
            doc.moveDown();

            // Quote info
            doc.fontSize(12);
            doc.text(`Название: ${quote.name}`);
            doc.text(`Дата: ${new Date(quote.createdAt).toLocaleDateString('ru-RU')}`);
            doc.moveDown();

            // Group items by category
            const groupedItems = {};
            if (quote.items && quote.items.length > 0) {
                quote.items.forEach(item => {
                    const category = item.category || 'Без категории';
                    if (!groupedItems[category]) {
                        groupedItems[category] = [];
                    }
                    groupedItems[category].push(item);
                });
            }

            // Render each category
            Object.keys(groupedItems).forEach((category, catIndex) => {
                if (catIndex > 0) doc.moveDown();
                
                doc.fontSize(14).font('Helvetica-Bold');
                doc.text(category);
                doc.moveDown(0.5);

                const items = groupedItems[category];
                let categoryTotal = 0;

                items.forEach(item => {
                    doc.fontSize(10).font('Helvetica');
                    doc.text(`  ${item.job}`);
                    doc.text(`    Комната: ${item.room || '-'}`);
                    doc.text(`    Количество: ${item.quantity} ${item.unit || ''}`);
                    
                    if (item.materialPrice) {
                        doc.text(`    Материалы: ${item.materialPrice.toFixed(2)} руб.`);
                    }
                    if (item.laborPrice) {
                        doc.text(`    Работа: ${item.laborPrice.toFixed(2)} руб.`);
                    }
                    
                    doc.text(`    Итого: ${item.total.toFixed(2)} руб.`);
                    doc.moveDown(0.5);
                    
                    categoryTotal += item.total;
                });

                doc.fontSize(11).font('Helvetica-Bold');
                doc.text(`  Итого по категории: ${categoryTotal.toFixed(2)} руб.`);
                doc.moveDown();
            });

            // Total
            doc.fontSize(14).font('Helvetica-Bold');
            doc.text(`Общая сумма: ${quote.total.toFixed(2)} руб.`, { align: 'right' });

            // Footer
            doc.fontSize(8).font('Helvetica');
            doc.text(
                `Документ сгенерирован ${new Date().toLocaleDateString('ru-RU')}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
