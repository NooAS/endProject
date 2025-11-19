// Модели: Work, Room, Project

export class Work {
    constructor(id) {
        this.id = id;
        this.name = "";
        this.unit = "m2";
        this.quantity = 0;
        this.clientPrice = 0;
        this.materialPrice = 0;
        this.laborPrice = 0;
        this.categoryId = null;
        this.templateId = null;
    }
    get clientTotal() { return this.quantity * this.clientPrice; }
    get companyCost() { return this.quantity * (this.materialPrice + this.laborPrice); }
    get profit() { return this.clientTotal - this.companyCost; }
}

export class Room {
    constructor(id, number, name) {
        this.id = id;
        this.number = number;
        this.name = name || `Позиция ${number}`;
        this.works = [];
    }
    addWork(work) { this.works.push(work); }
    removeWork(workId) { this.works = this.works.filter(w => w.id !== workId); }
    getTotals(config) {
        const netto = this.works.reduce((sum, w) => sum + w.clientTotal, 0);
        const brutto = netto * (1 + config.vat / 100);
        return { netto, brutto };
    }
}

export class Project {
    constructor(config) {
        this.config = config;
        this.name = "";
        this.rooms = [];
        this._roomAutoId = 1;
        this.categories = [];
        this._catAutoId = 1;
        this._tplAutoId = 1;
        this.pdfCompanyData = null;
        this.pdfObjectAddress = "";
    }
    setName(name) { this.name = name; }
    addRoom(name) {
        const roomNumber = this.rooms.length + 1;
        const room = new Room(this._roomAutoId++, roomNumber, name);
        this.rooms.push(room);
        return room;
    }
    removeRoom(roomId) {
        this.rooms = this.rooms.filter(r => r.id !== roomId);
        this.rooms.forEach((r, idx) => r.number = idx + 1);
    }
    generateWorkId(room) {
        const index = room.works.length + 1;
        return this.config.useNumbering ? `${room.number}.${index}` : String(index);
    }
    getTotals() {
        const netto = this.rooms.reduce((sum, r) => sum + r.getTotals(this.config).netto, 0);
        const brutto = netto * (1 + this.config.vat / 100);
        return { netto, brutto };
    }
    addCategory(name) {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const existing = this.categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) return existing;
        const cat = { id: this._catAutoId++, name: trimmed, templates: [] };
        this.categories.push(cat);
        return cat;
    }
    addTemplateToCategory(catId, template) {
        const cat = this.categories.find(c => c.id === catId);
        if (!cat) return null;
        const trimmed = template.name.trim();
        if (!trimmed) return null;
        const tpl = { id: this._tplAutoId++, name: trimmed, defaults: template.defaults || null };
        cat.templates.push(tpl);
        return tpl;
    }
    getCategoryById(id) {
        return this.categories.find(c => c.id === id) || null;
    }
    getTemplatesForCategory(catId) {
        const cat = this.getCategoryById(catId);
        return cat ? cat.templates : [];
    }
}