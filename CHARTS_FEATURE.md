# Wykresy i Statystyki - Documentation

## Przegląd / Overview

Ta funkcja rozszerza system wykresów i statystyk, umożliwiając:
1. Przeglądanie wykresów dla pojedynczych kosztorysów
2. Filtrowanie ogólnych statystyk według okresów czasu (tydzień, miesiąc, rok)

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
- **Ostatni miesiąc** - kosztorysy z dokładnie jednego miesiąca wstecz (uwzględnia różną długość miesięcy)
- **Ostatni rok** - kosztorysy z ostatnich 365 dni

## Jak Używać / How to Use

### Wykresy Ogólne (Overall Statistics)

1. Otwórz menu profilu (przycisk "Profil")
2. Kliknij "Wykresy i statystyki"
3. Wybierz "Wszystkie kosztorysy" w polu "Zakres"
4. Wybierz okres w polu "Okres" (wszystkie/tydzień/miesiąc/rok)
5. Kliknij "Zastosuj"

### Wykresy dla Pojedynczego Kosztorysu (Individual Quote Charts)

**Opcja 1: Z Historii (Zalecane)**
1. Otwórz menu profilu
2. Kliknij "Historia kosztorysów"
3. Znajdź kosztorys, który chcesz przeanalizować
4. Kliknij przycisk "Wykresy" (niebieski) przy tym kosztorysie

**Opcja 2: Z Menu Wykresów**
1. Otwórz menu profilu
2. Kliknij "Wykresy i statystyki"
3. Wybierz "Pojedynczy kosztorys" w polu "Zakres"
4. Wybierz kosztorys z listy rozwijanej
5. Kliknij "Zastosuj"

## Struktura Implementacji / Implementation Structure

### Zmiany w HTML (index.html)

Dodano kontrolki filtrów w `chartsModal`:
- `chartScope` - wybór zakresu (wszystkie/pojedynczy)
- `quoteSelector` - kontener dla selektora kosztorysów
- `chartQuote` - lista rozwijana z kosztorysami
- `timePeriodSelector` - kontener dla selektora okresu
- `chartTimePeriod` - wybór okresu czasu
- `applyChartFilters` - przycisk zastosowania filtrów

### Zmiany w JavaScript (main.js)

**Nowe funkcje:**
- `populateQuoteSelector(quotes)` - wypełnia listę rozwijaną kosztorysami z ich wersjami
- `setupChartFilterControls()` - konfiguruje obsługę zdarzeń dla filtrów
- `renderChartsWithFilters()` - renderuje wykresy na podstawie wybranych filtrów
- `filterQuotesByTimePeriod(quotes, period)` - filtruje kosztorysy według okresu
- `viewQuoteCharts(quoteId)` - otwiera wykresy dla konkretnego kosztorysu

**Zmodyfikowane funkcje:**
- `openChartsModal()` - inicjalizuje modal z nowymi kontrolkami
- `createQuoteCard(q, isInProgress)` - dodaje przycisk "Wykresy" do każdego kosztorysu

**Globalne zmienne:**
- `allQuotesData` - przechowuje dane kosztorysów dla filtrowania

## Przykłady Użycia / Use Cases

### 1. Analiza Miesięcznych Wydatków
```
Zakres: Wszystkie kosztorysy
Okres: Ostatni miesiąc
Cel: Zobacz rozkład kosztów i zysków w ostatnim miesiącu
```

### 2. Szczegółowa Analiza Projektu
```
Zakres: Pojedynczy kosztorys
Kosztorys: [wybierz konkretny projekt]
Cel: Przeanalizuj strukturę kosztów i zysków dla konkretnego projektu
```

### 3. Roczne Podsumowanie
```
Zakres: Wszystkie kosztorysy
Okres: Ostatni rok
Cel: Zobacz wszystkie kosztorysy i zyski z całego roku
```

### 4. Porównanie Wersji Kosztorysu
```
Zakres: Pojedynczy kosztorys
Kosztorys: [wybierz wersję 1]
Następnie: Zmień na [wersję 2]
Cel: Porównaj jak zmieniły się koszty i zyski między wersjami
```

## Typy Wykresów / Chart Types

### 1. Diagram Kosztów według Kategorii (Pie Chart)
- Pokazuje procentowy rozkład kosztów między kategoriami
- Różne kolory dla każdej kategorii
- Tooltip pokazuje:
  - Nazwę kategorii
  - Wartość w złotych (zł)
  - Procent całości

### 2. Wykres Zysku według Kategorii (Bar Chart)
- Pokazuje zysk dla każdej kategorii w formie słupków
- Zielony kolor dla dodatniego zysku
- Czerwony kolor dla ujemnego zysku (straty)
- Tooltip pokazuje dokładną wartość zysku

## Szczegóły Techniczne / Technical Details

### Filtrowanie Okresów Czasu

Funkcja `filterQuotesByTimePeriod()` używa:
- Stałych czasowych dla czytelności (WEEK_MS, MONTH_MS, YEAR_MS)
- Właściwej kalkulacji miesięcy uwzględniającej różną długość miesięcy
- Walidacji dat aby uniknąć błędów z nieprawidłowymi danymi

### Bezpieczeństwo

- Wszystkie dane kosztorysów są ładowane z uwzględnieniem tokenu użytkownika
- Walidacja ID kosztorysów przed przetwarzaniem
- Sprawdzanie poprawności dat przed filtrowaniem
- Brak wykonywania niebezpiecznych operacji na danych wejściowych

### Wydajność

- Dane kosztorysów są ładowane raz przy otwarciu modala
- Wykresy są renderowane tylko po naciśnięciu "Zastosuj"
- Stare wykresy są niszczone przed utworzeniem nowych (zapobiega wyciekom pamięci)
- Użycie requestAnimationFrame dla płynnych animacji

## Testowanie / Testing

### Scenariusze Testowe

1. **Test filtrów okresów**
   - Utwórz kosztorysy w różnych datach
   - Przełącz między filtrami (tydzień/miesiąc/rok)
   - Sprawdź czy wykresy pokazują poprawne dane

2. **Test pojedynczego kosztorysu**
   - Wybierz kosztorys z przyciskiem "Wykresy" w historii
   - Sprawdź czy wykresy pokazują tylko dane z tego kosztorysu
   - Porównaj z danymi w edycji kosztorysu

3. **Test wersji kosztorysów**
   - Utwórz kosztorys z wieloma wersjami
   - Wybierz różne wersje z listy rozwijanej
   - Sprawdź czy wykresy się zmieniają zgodnie z wersją

4. **Test pustych danych**
   - Spróbuj otworzyć wykresy bez kosztorysów
   - Spróbuj wybrać okres bez kosztorysów
   - Sprawdź czy wyświetlają się odpowiednie komunikaty

### Oczekiwane Zachowania

- Modal otwiera się poprawnie
- Filtry są widoczne/ukryte zgodnie z zakresem
- Wykresy renderują się bez błędów
- Komunikaty błędów są jasne i pomocne
- Dane są poprawnie filtrowane

## Znane Ograniczenia / Known Limitations

1. **Filtry czasu działają tylko na createdAt**
   - Nie uwzględniają updatedAt lub innych dat
   - Przyszłe ulepszenie może dodać więcej opcji

2. **Brak zaawansowanych statystyk**
   - Obecnie pokazywane są tylko koszty i zyski
   - Przyszłe wersje mogą dodać więcej metryk

3. **Brak eksportu wykresów**
   - Obecnie nie można eksportować wykresów do pliku
   - Można użyć zrzutu ekranu jako obejścia

## Przyszłe Ulepszenia / Future Enhancements

1. Dodanie więcej typów wykresów (liniowy, obszarowy)
2. Eksport wykresów do PNG/PDF
3. Porównanie wielu kosztorysów obok siebie
4. Zaawansowane filtry (według statusu, według klienta, etc.)
5. Statystyki podsumowujące (średnia, mediana, etc.)
6. Trendy w czasie (jak zmieniają się zyski)

