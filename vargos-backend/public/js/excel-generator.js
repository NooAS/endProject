// Excel generation for company (owner) version
// Exports: generateOwnerExcel(project, config)
// Dependencies: window.XLSX (SheetJS), collectPdfData
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
        const roomMargin = roomNetto > 0 ? (roomProfit / roomNetto) : 0;

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
            roomMargin  // Excel percentage format will handle the conversion
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
            const marginPercent = clientTotal > 0 ? (profit / clientTotal) : 0;

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
                marginPercent  // Excel percentage format will handle the conversion
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
    const marginPercent = netto > 0 ? (totalProfit / netto) : 0;

    wsData.push(["Suma netto (klient):", netto]);
    wsData.push(["Koszt firmy:", allCosts]);
    wsData.push(["Zysk calkowity:", totalProfit]);
    wsData.push(["Marza:", marginPercent]);  // Excel percentage format will handle the conversion
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
        { wch: 25 },  // Lp (wider to accommodate footer labels like "Suma netto (klient):")
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

    // Apply percentage formatting to margin column (column J, index 9)
    // Format cells starting from row 7 (after headers) to the data rows
    const headerRowCount = 6; // Number of rows before the data table starts
    const range = window.XLSX.utils.decode_range(ws['!ref']);
    
    for (let R = headerRowCount; R <= range.e.r; R++) {
        const cellAddress = window.XLSX.utils.encode_cell({ r: R, c: 9 }); // Column J (Marza %)
        if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
            ws[cellAddress].z = '0.0%'; // Excel percentage format with 1 decimal place
        }
    }

    // Apply styling to make the table more readable
    // Note: SheetJS community edition has limited styling support
    // For better styling, the commercial version or alternative libraries would be needed
    
    // Apply bold style to header row (row index headerRowCount)
    const headerRow = headerRowCount;
    for (let C = 0; C <= 9; C++) {
        const cellAddress = window.XLSX.utils.encode_cell({ r: headerRow, c: C });
        if (ws[cellAddress]) {
            ws[cellAddress].s = {
                font: { bold: true, sz: 11 },
                fill: { fgColor: { rgb: "D3D3D3" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
    }

    // Track room header rows for styling
    const roomHeaderRows = [];
    let currentRow = headerRowCount + 1;
    
    project.rooms.forEach(room => {
        roomHeaderRows.push(currentRow);
        currentRow += 1 + room.works.length; // room header + work items
    });

    // Apply styling to room header rows
    roomHeaderRows.forEach(rowIndex => {
        for (let C = 0; C <= 9; C++) {
            const cellAddress = window.XLSX.utils.encode_cell({ r: rowIndex, c: C });
            if (ws[cellAddress]) {
                ws[cellAddress].s = {
                    font: { bold: true, sz: 10 },
                    fill: { fgColor: { rgb: "E8F4F8" } },
                    alignment: { horizontal: "left", vertical: "center" }
                };
            }
        }
    });

    // Apply styling to footer totals (last 6 rows)
    const totalRowsStart = range.e.r - 5;
    for (let R = totalRowsStart; R <= range.e.r; R++) {
        for (let C = 0; C <= 1; C++) {
            const cellAddress = window.XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cellAddress]) {
                ws[cellAddress].s = {
                    font: { bold: true, sz: 10 },
                    fill: { fgColor: { rgb: "FFF4E6" } },
                    alignment: { horizontal: "left", vertical: "center" }
                };
            }
        }
    }

    // Add worksheet to workbook
    window.XLSX.utils.book_append_sheet(wb, ws, "Wycena dla firmy");

    // Generate Excel file and trigger download
    window.XLSX.writeFile(wb, "wycena-firma.xlsx");

    return wb;
}
