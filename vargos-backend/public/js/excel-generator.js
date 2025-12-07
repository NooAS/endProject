// Excel generation for company (owner) version
// Exports: generateOwnerExcel(project, config)
// Dependencies: window.XLSX (SheetJS), collectPdfData, formatCurrency, formatNumberPL
import { formatCurrency, formatNumberPL } from "./helpers.js";
import { collectPdfData } from "./pdf-data.js";

/**
 * Helper: get display name of work.
 */
function getWorkDisplayName(work, project) {
    if (work && String((work.name || "")).trim()) return work.name;
    const tplId = work && (work.templateId || work.template);
    if (!tplId || !project || !Array.isArray(project.categories)) return "";
    const numericTplId = Number(tplId);
    for (const cat of project.categories) {
        if (!cat || !Array.isArray(cat.templates)) continue;
        const tpl = cat.templates.find(t => Number(t.id) === numericTplId);
        if (tpl && tpl.name) return tpl.name;
    }
    return "";
}

/**
 * Generate Excel for owner (internal detailed view)
 */
export async function generateOwnerExcel(project, config) {
    const pdfData = await collectPdfData(project);
    
    if (!window.XLSX) {
        throw new Error("Biblioteka XLSX nie została załadowana");
    }

    const { projectName, objectAddress } = pdfData || {};

    // Create a new workbook
    const wb = window.XLSX.utils.book_new();
    
    // Prepare data for the worksheet
    const wsData = [];
    
    // Header section
    wsData.push([projectName || "Wycena - FIRMA (szczegoly kosztow)"]);
    wsData.push([]);
    if (objectAddress) {
        wsData.push(["Adres inwestycji:", objectAddress]);
    }
    wsData.push(["Wersja wewnetrzna - zawiera koszty materialow, robocizny oraz marze."]);
    wsData.push([]);
    
    // Table headers
    wsData.push([
        "Lp",
        "Rodzaj prac",
        "Jm",
        "Ilosc",
        "Cena kl.",
        "Material",
        "Robocizna",
        "Koszt firmy",
        "Zysk",
        "Marza %"
    ]);

    let sectionIndex = 1;

    // Process each room
    project.rooms.forEach(room => {
        const totals = room.getTotals(config);
        const roomNetto = totals.netto;

        const roomCompanyCost = room.works.reduce((sum, w) => {
            const material = w.materialPrice || 0;
            const labor = w.laborPrice || 0;
            return sum + w.quantity * (material + labor);
        }, 0);

        const roomProfit = roomNetto - roomCompanyCost;
        const roomMargin = roomCompanyCost > 0 ? (roomProfit / roomCompanyCost) * 100 : 0;

        // Room header row
        wsData.push([
            String(sectionIndex),
            (room.name || "").toUpperCase(),
            "",
            "",
            "",
            "",
            "",
            roomCompanyCost,
            roomProfit,
            roomMargin.toFixed(1) + "%"
        ]);

        // Work items
        room.works.forEach((w, i) => {
            const displayName = getWorkDisplayName(w, project) || w.name || "";
            const clientNet = w.clientPrice;
            const material = w.materialPrice || 0;
            const labor = w.laborPrice || 0;
            const cost = material + labor;

            const clientTotal = w.quantity * clientNet;
            const companyCost = w.quantity * cost;
            const profit = clientTotal - companyCost;
            const marginPercent = companyCost > 0 ? (profit / companyCost) * 100 : 0;

            wsData.push([
                room.number + "." + (i + 1),
                displayName,
                w.unit,
                w.quantity,
                clientNet,
                material,
                labor,
                companyCost,
                profit,
                marginPercent.toFixed(1) + "%"
            ]);
        });

        sectionIndex++;
    });

    // Add spacing
    wsData.push([]);
    wsData.push([]);

    // Footer totals
    const totals = project.getTotals();
    const netto = totals.netto;
    const brutto = totals.brutto;
    const vatAmount = brutto - netto;

    const allCosts = project.rooms.reduce((sum, r) => {
        return sum + r.works.reduce((s, w) => s + (w.quantity * ((w.materialPrice || 0) + (w.laborPrice || 0))), 0);
    }, 0);

    const totalProfit = netto - allCosts;
    const marginPercent = allCosts > 0 ? ((totalProfit / allCosts) * 100).toFixed(1) : "0";

    wsData.push(["Suma netto (klient):", netto]);
    wsData.push(["Koszt firmy:", allCosts]);
    wsData.push(["Zysk calkowity:", totalProfit]);
    wsData.push(["Marza:", marginPercent + "%"]);
    wsData.push(["VAT " + config.vat + "%:", vatAmount]);
    wsData.push(["Brutto klienta:", brutto]);

    // Add notes if they exist
    if (project.notes && project.notes.trim()) {
        wsData.push([]);
        wsData.push(["Notatki:"]);
        wsData.push([project.notes]);
    }

    // Create worksheet from data
    const ws = window.XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = [
        { wch: 8 },   // Lp
        { wch: 35 },  // Rodzaj prac
        { wch: 6 },   // Jm
        { wch: 8 },   // Ilosc
        { wch: 12 },  // Cena kl.
        { wch: 12 },  // Material
        { wch: 12 },  // Robocizna
        { wch: 12 },  // Koszt firmy
        { wch: 12 },  // Zysk
        { wch: 10 }   // Marza %
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    window.XLSX.utils.book_append_sheet(wb, ws, "Wycena dla firmy");

    // Generate Excel file and trigger download
    window.XLSX.writeFile(wb, "wycena-firma.xlsx");

    return wb;
}
