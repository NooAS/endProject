# Wykresy i Statystyki - Documentation

## Nowe Funkcje / New Features

### 1. Wykresy dla Pojedynczego Kosztorysu (Individual Quote Charts)

Użytkownicy mogą teraz przeglądać wykresy i statystyki dla każdego kosztorysu osobno:

- **Przycisk "Wykresy"** został dodany do każdego kosztorysu w historii
- Po kliknięciu przycisku otwiera się modal z wykresami filtrowanymi tylko dla tego kosztorysu
- Wyświetla diagram kosztów według kategorii oraz wykres zysku dla wybranego kosztorysu

### 2. Filtry Okresów Czasowych (Time Period Filters)

Dodano możliwość filtrowania statystyk ogólnych według okresów:

- **Wszystkie** - wszystkie kosztorysy
- **Ostatni tydzień** - kosztorysy z ostatnich 7 dni
- **Ostatni miesiąc** - kosztorysy z ostatnich 30 dni
- **Ostatni rok** - kosztorysy z ostatnich 365 dni

## Jak Używać / How to Use

### Wykresy Ogólne (Overall Statistics)

1. Otwórz menu profilu (przycisk "Profil")
2. Kliknij "Wykresy i statystyki"
3. Wybierz "Wszystkie kosztorysy" w polu "Zakres"
4. Wybierz okres w polu "Okres" (wszystkie/tydzień/miesiąc/rok)
5. Kliknij "Zastosuj"

### Wykresy dla Pojedynczego Kosztorysu (Individual Quote Charts)

**Opcja 1: Z Historii**
1. Otwórz menu profilu
2. Kliknij "Historia kosztorysów"
3. Znajdź kosztorys, który chcesz przeanalizować
4. Kliknij przycisk "Wykresy" przy tym kosztorysie

**Opcja 2: Z Menu Wykresów**
1. Otwórz menu profilu
2. Kliknij "Wykresy i statystyki"
3. Wybierz "Pojedynczy kosztorys" w polu "Zakres"
4. Wybierz kosztorys z listy rozwijanej
5. Kliknij "Zastosuj"

## Struktura Implementacji / Implementation Structure

### Zmiany w HTML (index.html)

- Dodano kontrolki filtrów w `chartsModal`:
  - `chartScope` - wybór zakresu (wszystkie/pojedynczy)
  - `chartQuote` - lista kosztorysów do wyboru
  - `chartTimePeriod` - wybór okresu czasu
  - `applyChartFilters` - przycisk zastosowania filtrów

### Zmiany w JavaScript (main.js)

Nowe funkcje:
- `populateQuoteSelector()` - wypełnia listę rozwijaną kosztorysami
- `setupChartFilterControls()` - konfiguruje obsługę zdarzeń dla filtrów
- `renderChartsWithFilters()` - renderuje wykresy na podstawie wybranych filtrów
- `filterQuotesByTimePeriod()` - filtruje kosztorysy według okresu
- `viewQuoteCharts()` - otwiera wykresy dla konkretnego kosztorysu

Zmodyfikowane funkcje:
- `openChartsModal()` - inicjalizuje modal z nowymi kontrolkami
- `createQuoteCard()` - dodaje przycisk "Wykresy" do każdego kosztorysu

## Przykłady Użycia / Use Cases

1. **Analiza Miesięcznych Wydatków**
   - Zakres: Wszystkie kosztorysy
   - Okres: Ostatni miesiąc
   - Cel: Zobacz rozkład kosztów i zysków w ostatnim miesiącu

2. **Szczegółowa Analiza Projektu**
   - Zakres: Pojedynczy kosztorys
   - Kosztorys: [wybierz konkretny projekt]
   - Cel: Przeanalizuj strukturę kosztów i zysków dla konkretnego projektu

3. **Roczne Podsumowanie**
   - Zakres: Wszystkie kosztorysy
   - Okres: Ostatni rok
   - Cel: Zobacz wszystkie kosztorysy i zyski z całego roku

## Typy Wykresów / Chart Types

1. **Diagram Kosztów według Kategorii** (Pie Chart)
   - Pokazuje procentowy rozkład kosztów między kategoriami
   - Różne kolory dla każdej kategorii
   - Tooltip pokazuje wartość i procent

2. **Wykres Zysku według Kategorii** (Bar Chart)
   - Pokazuje zysk dla każdej kategorii
   - Zielony kolor dla dodatniego zysku
   - Czerwony kolor dla ujemnego zysku (straty)
