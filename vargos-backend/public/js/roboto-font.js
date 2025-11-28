// Roboto font for jsPDF
// This file embeds the Roboto-Regular font for PDF generation with Polish character support

const robotoB64 = "";

export function registerRobotoFont(doc) {
    const callAddFont = function () {
        this.addFileToVFS("Roboto-Regular.ttf", robotoB64);
        this.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    };
    callAddFont.call(doc);
}

export { robotoB64 };
