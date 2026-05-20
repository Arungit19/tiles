
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const QUOTATIONS_FILE = path.join(DATA_DIR, 'quotations.json');

// Ensure data directory exists
export async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Read all quotations
export async function readQuotations() {
  try {
    await ensureDataDir();
    try {
      const data = await fs.readFile(QUOTATIONS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  } catch (error) {
    console.error('Error reading quotations:', error);
    return [];
  }
}

// Write quotations to file
export async function writeQuotations(quotations) {
  try {
    await ensureDataDir();
    await fs.writeFile(QUOTATIONS_FILE, JSON.stringify(quotations, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing quotations:', error);
    return false;
  }
}

// Add new quotation
export async function addQuotation(quotationData) {
  try {
    const quotations = await readQuotations();
    
    const newQuotation = {
      id: Date.now().toString(),
      ...quotationData,
      createdAt: new Date().toISOString(),
    };

    quotations.push(newQuotation);
    const success = await writeQuotations(quotations);
    
    if (success) {
      return { success: true, data: newQuotation };
    } else {
      return { success: false, error: 'Failed to save quotation' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all quotations
export async function getAllQuotations() {
  try {
    return await readQuotations();
  } catch (error) {
    return [];
  }
}

// Get quotation by ID
export async function getQuotationById(id) {
  try {
    const quotations = await readQuotations();
    return quotations.find(q => q.id === id);
  } catch (error) {
    return null;
  }
}

// Delete quotation
export async function deleteQuotation(id) {
  try {
    let quotations = await readQuotations();
    const initialLength = quotations.length;
    
    quotations = quotations.filter(q => q.id !== id);
    
    if (quotations.length === initialLength) {
      return { success: false, error: 'Quotation not found' };
    }
    
    const success = await writeQuotations(quotations);
    if (success) {
      return { success: true, message: 'Quotation deleted successfully' };
    } else {
      return { success: false, error: 'Failed to delete quotation' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Search quotations
export async function searchQuotations(filters) {
  try {
    const quotations = await readQuotations();
    
    return quotations.filter(q => {
      // Search by quotation number
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesQuotation = q.quotationNum?.toLowerCase().includes(term);
        const matchesClient = q.clientInfo?.name?.toLowerCase().includes(term);
        if (!matchesQuotation && !matchesClient) return false;
      }

      // Filter by date
      if (filters.date) {
        if (q.date !== filters.date) return false;
      }

      return true;
    });
  } catch (error) {
    return [];
  }
}

// Get statistics
export async function getStatistics() {
  try {
    const quotations = await readQuotations();
    
    const stats = {
      totalQuotations: quotations.length,
      totalRevenue: quotations.reduce((sum, q) => {
        const total = parseFloat(q.grandTotal) || 0;
        return sum + total;
      }, 0),
      averageQuotationValue: 0,
      quotationsThisMonth: 0,
      quotationsToday: 0
    };

    if (quotations.length > 0) {
      stats.averageQuotationValue = stats.totalRevenue / quotations.length;
    }

    // Count quotations from this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    stats.quotationsThisMonth = quotations.filter(q => {
      const qDate = new Date(q.date);
      return qDate.getMonth() === currentMonth && qDate.getFullYear() === currentYear;
    }).length;

    // Count quotations from today
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    stats.quotationsToday = quotations.filter(q => q.date === today).length;

    return stats;
  } catch (error) {
    return null;
  }
}