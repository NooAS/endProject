// Генерация PDF — клиентская и фирменная версии
// Экспортирует: generateClientPdf(project, config) и generateOwnerPdf(project, config)
// Зависимости: window.jspdf (jsPDF + autotable), collectPdfData, formatCurrency, formatNumberPL
import { formatCurrency, formatNumberPL } from "./helpers.js";
import { collectPdfData } from "./pdf-data.js";

/**
 * Вспомогательная: получить отображаемое имя работы.
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
 * Generate PDF for client (summary view)
 */
export async function generateClientPdf(project, config) {
    const pdfData = await collectPdfData(project);
    const { jsPDF } = window.jspdf;
    if (!jsPDF) throw new Error("jsPDF nie znaleziono w window.jspdf");

    const pdf = new jsPDF({
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(16);

    const { projectName, objectAddress, companyData, priceMode, priceDisplay } = pdfData || {};
    const displayMode = priceDisplay || "netto"; // "netto", "brutto", or "both"
    const vat = config.vat / 100;

    let y = 15;
    const margin = 10;

    pdf.text(projectName || "Wycena", margin, y);
    y += 8;

    pdf.setFontSize(11);
    if (objectAddress) {
        pdf.text("Adres inwestycji: " + objectAddress, margin, y);
        y += 6;
    }
    if (companyData && companyData.companyName) {
        pdf.text(companyData.companyName, margin, y);
        y += 5;
        if (companyData.address) {
            pdf.text(companyData.address, margin, y);
            y += 5;
        }
        if (companyData.nip) {
            pdf.text("NIP: " + companyData.nip, margin, y);
            y += 5;
        }
        if (companyData.phone) {
            pdf.text("Tel: " + companyData.phone, margin, y);
            y += 5;
        }
        if (companyData.email) {
            pdf.text("Email: " + companyData.email, margin, y);
            y += 6;
        }
    }

    // Display mode label
    let displayModeLabel = "NETTO";
    if (displayMode === "brutto") displayModeLabel = "BRUTTO";
    else if (displayMode === "both") displayModeLabel = "NETTO i BRUTTO";
    pdf.text("Tryb wyceny: " + displayModeLabel, margin, y);
    y += 6;

    // Build table headers based on display mode
    let tableHead;
    if (displayMode === "both") {
        tableHead = [["Lp", "Rodzaj prac", "Jm", "Ilosc", "Cena netto", "Razem netto", "Cena brutto", "Razem brutto"]];
    } else {
        tableHead = [["Lp", "Rodzaj prac", "Jm", "Ilosc", "Cena jedn.", "Razem"]];
    }

    const tableBody = [];

    let sectionIndex = 1;
    project.rooms.forEach(room => {
        const roomNameCaps = (room.name || "").toUpperCase();
        const roomTotals = room.getTotals(config);

        if (displayMode === "both") {
            tableBody.push([
                { content: "" + sectionIndex, styles: { fillColor: [230, 230, 230], fontStyle: "bold" } },
                { content: roomNameCaps, styles: { fillColor: [230, 230, 230], fontStyle: "bold" } },
                "", "", "",
                { content: formatCurrency(roomTotals.netto), styles: { fillColor: [230, 230, 230], fontStyle: "bold" } },
                "",
                { content: formatCurrency(roomTotals.brutto), styles: { fillColor: [230, 230, 230], fontStyle: "bold" } }
            ]);
        } else {
            const roomValue = displayMode === "brutto" ? roomTotals.brutto : roomTotals.netto;
            tableBody.push([
                { content: "" + sectionIndex, styles: { fillColor: [230, 230, 230], fontStyle: "bold" } },
                { content: roomNameCaps, styles: { fillColor: [230, 230, 230], fontStyle: "bold" } },
                "", "", "",
                { content: formatCurrency(roomValue), styles: { fillColor: [230, 230, 230], fontStyle: "bold" } }
            ]);
        }

        room.works.forEach((w, i) => {
            const displayName = getWorkDisplayName(w, project) || w.name || "";
            const priceNet = w.clientPrice;
            const priceGross = w.clientPrice * (1 + vat);
            const netTotal = w.quantity * priceNet;
            const grossTotal = w.quantity * priceGross;

            if (displayMode === "both") {
                tableBody.push([
                    room.number + "." + (i + 1),
                    displayName,
                    w.unit,
                    formatNumberPL(w.quantity),
                    formatNumberPL(priceNet),
                    formatNumberPL(netTotal),
                    formatNumberPL(priceGross),
                    formatNumberPL(grossTotal)
                ]);
            } else {
                const singlePrice = displayMode === "brutto" ? priceGross : priceNet;
                const total = displayMode === "brutto" ? grossTotal : netTotal;
                tableBody.push([
                    room.number + "." + (i + 1),
                    displayName,
                    w.unit,
                    formatNumberPL(w.quantity),
                    formatNumberPL(singlePrice),
                    formatNumberPL(total)
                ]);
            }
        });

        sectionIndex++;
    });

    pdf.autoTable({
        startY: y,
        head: tableHead,
        body: tableBody,
        theme: "grid",
        styles: {
            font: "helvetica",
            fontSize: 10,
            halign: "center",
            valign: "middle"
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold"
        },
        columnStyles: {
            1: { halign: "left" }
        },
        margin: { left: margin, right: margin }
    });

    const finalY = (pdf.lastAutoTable && pdf.lastAutoTable.finalY ? pdf.lastAutoTable.finalY : y) + 10;

    const total = project.getTotals();
    const netto = total.netto;
    const brutto = total.brutto;
    const vatAmount = brutto - netto;

    pdf.setFontSize(12);
    
    // Display totals based on mode
    if (displayMode === "netto") {
        pdf.text("Suma netto:  " + formatCurrency(netto), margin, finalY);
        pdf.text("VAT " + config.vat + "%:  " + formatCurrency(vatAmount), margin, finalY + 6);
        pdf.text("Suma brutto: " + formatCurrency(brutto), margin, finalY + 12);
    } else if (displayMode === "brutto") {
        pdf.text("Suma brutto: " + formatCurrency(brutto), margin, finalY);
        pdf.text("(w tym VAT " + config.vat + "%: " + formatCurrency(vatAmount) + ")", margin, finalY + 6);
    } else {
        // both
        pdf.text("Suma netto:  " + formatCurrency(netto), margin, finalY);
        pdf.text("VAT " + config.vat + "%:  " + formatCurrency(vatAmount), margin, finalY + 6);
        pdf.text("Suma brutto: " + formatCurrency(brutto), margin, finalY + 12);
    }

    pdf.save("wycena-klient.pdf");

    return pdf;
}

/**
 * Generate PDF for owner (internal detailed view)
 */
export async function generateOwnerPdf(project, config) {
    const pdfData = await collectPdfData(project);
    const { jsPDF } = window.jspdf;
    if (!jsPDF) throw new Error("jsPDF nie znaleziono w window.jspdf");

    const pdf = new jsPDF({
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(16);

    const { projectName, objectAddress, companyData } = pdfData || {};

    let y = 15;
    const margin = 10;

    pdf.text(projectName || "Wycena - FIRMA (szczegoly kosztow)", margin, y);
    y += 8;

    pdf.setFontSize(11);
    if (objectAddress) {
        pdf.text("Adres inwestycji: " + objectAddress, margin, y);
        y += 6;
    }

    pdf.text("Wersja wewnetrzna - zawiera koszty materialow, robocizny oraz marze.", margin, y);
    y += 10;

    const tableHead = [
        [
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
        ]
    ];

    const tableBody = [];
    let sectionIndex = 1;

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

        tableBody.push([
            { content: "" + sectionIndex, styles: { fillColor: [240, 240, 240], fontStyle: "bold" } },
            { content: (room.name || "").toUpperCase(), styles: { fillColor: [240, 240, 240], fontStyle: "bold" } },
            "", "", "", "", "",
            { content: formatCurrency(roomCompanyCost), styles: { fillColor: [240, 240, 240], fontStyle: "bold" } },
            { content: formatCurrency(roomProfit), styles: { fillColor: [240, 240, 240], fontStyle: "bold" } },
            { content: roomMargin.toFixed(1) + "%", styles: { fillColor: [240, 240, 240], fontStyle: "bold" } }
        ]);

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

            tableBody.push([
                room.number + "." + (i + 1),
                displayName,
                w.unit,
                formatNumberPL(w.quantity),
                formatNumberPL(clientNet),
                formatNumberPL(material),
                formatNumberPL(labor),
                formatNumberPL(companyCost),
                formatNumberPL(profit),
                marginPercent.toFixed(1) + "%"
            ]);
        });

        sectionIndex++;
    });

    pdf.autoTable({
        startY: y,
        head: tableHead,
        body: tableBody,
        theme: "grid",
        styles: {
            font: "helvetica",
            fontSize: 9,
            halign: "center",
            valign: "middle"
        },
        headStyles: {
            fillColor: [55, 71, 79],
            textColor: 255,
            fontStyle: "bold"
        },
        columnStyles: {
            1: { halign: "left" }
        },
        margin: { left: margin, right: margin }
    });

    const fy = (pdf.lastAutoTable && pdf.lastAutoTable.finalY ? pdf.lastAutoTable.finalY : y) + 10;

    // FOOTER
    const totals = project.getTotals();
    const netto = totals.netto;
    const brutto = totals.brutto;
    const vatAmount = brutto - netto;

    const allCosts = project.rooms.reduce((sum, r) => {
        return sum + r.works.reduce((s, w) => s + (w.quantity * ((w.materialPrice || 0) + (w.laborPrice || 0))), 0);
    }, 0);

    const totalProfit = netto - allCosts;
    const marginText = allCosts > 0 ? ((totalProfit / allCosts) * 100).toFixed(1) + "%" : "0%";

    pdf.setFontSize(12);
    pdf.text("Suma netto (klient):     " + formatCurrency(netto), margin, fy);
    pdf.text("Koszt firmy:             " + formatCurrency(allCosts), margin, fy + 6);
    pdf.text("Zysk calkowity:         " + formatCurrency(totalProfit), margin, fy + 12);
    pdf.text("Marza:                   " + marginText, margin, fy + 18);
    pdf.text("VAT " + config.vat + "%:             " + formatCurrency(vatAmount), margin, fy + 24);
    pdf.text("Brutto klienta:          " + formatCurrency(brutto), margin, fy + 30);

    // Add notes if they exist
    if (project.notes && project.notes.trim()) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const notesY = fy + 40;
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("Notatki:", margin, notesY);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        const notesLines = pdf.splitTextToSize(project.notes, pageWidth - margin * 2);
        pdf.text(notesLines, margin, notesY + 6);
    }

    pdf.save("wycena-firma.pdf");

    return pdf;
}
