import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
    try {
        // Create a test user
        const user = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                email: 'test@example.com',
                password: 'test123'
            }
        });
        
        console.log('User:', user);
        
        // Create a quote with items
        const quote = await prisma.quote.create({
            data: {
                userId: user.id,
                name: 'Test Quote',
                total: 1000,
                notes: 'Test notes',
                items: {
                    create: [
                        {
                            category: 'Test Category',
                            room: 'Test Room',
                            job: 'Test Job',
                            quantity: 10,
                            price: 100,
                            total: 1000
                        }
                    ]
                }
            }
        });
        
        console.log('Created quote:', quote);
        
        // Try to update the quote with new items
        const updatedQuote = await prisma.quote.update({
            where: { id: quote.id },
            data: {
                name: 'Updated Quote',
                total: 2000,
                items: {
                    deleteMany: {},
                    create: [
                        {
                            category: 'Updated Category',
                            room: 'Updated Room',
                            job: 'Updated Job',
                            quantity: 20,
                            price: 100,
                            total: 2000
                        }
                    ]
                }
            }
        });
        
        console.log('Updated quote:', updatedQuote);
        
        // Clean up
        await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });
        await prisma.quote.delete({ where: { id: quote.id } });
        await prisma.user.delete({ where: { id: user.id } });
        
        console.log('Test completed successfully!');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
