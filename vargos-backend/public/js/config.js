// Конфигурация приложения
export class Config {
    constructor() {
        this.useRooms = true;
        this.useCategories = true;
        this.useNumbering = true;
        this.mode = "simple"; // "simple" | "extended"
        this.vat = 23;
        this.vatMode = "addToNetto"; // "addToNetto" | "subtractFromBrutto"
    }
}