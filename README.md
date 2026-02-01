# e-Learning System 🎓

Prosta i funkcjonalna platforma do tworzenia i rozwiązywania testów wiedzy. Aplikacja pozwala na zarządzanie przedmiotami, sprawdzianami i pytaniami poprzez panel administratora oraz umożliwia użytkownikom rozwiązywanie testów w trybie nauki.

## ✨ Funkcje

*   **Dla Ucznia:**
    *   Przeglądanie dostępnych przedmiotów i sprawdzianów.
    *   Rozwiązywanie testów (pytania wielokrotnego wyboru oraz Prawda/Fałsz).
    *   Natychmiastowa informacja zwrotna o poprawności odpowiedzi.
    *   Podsumowanie wyników po zakończeniu testu.
    *   Tryb ciemny (Dark Mode) 🌙.

*   **Dla Administratora:**
    *   Dodawanie i usuwanie przedmiotów.
    *   Tworzenie i usuwanie sprawdzianów w ramach przedmiotów.
    *   Dodawanie pytań (wybór typu: ABC lub Prawda/Fałsz).
    *   Zarządzanie bazą pytań.

*   **Techniczne:**
    *   Brak konieczności instalacji bazy danych (dane zapisywane w pliku JSON).
    *   Lekki backend oparty na Node.js.

## 🚀 Instalacja i Uruchomienie

### Wymagania
- **Node.js** (pobierz i zainstaluj z https://nodejs.org/)
- Przeglądarka internetowa (Brave, Chrome, Firefox, Edge itp.)

### Instrukcja krok po kroku

1. **Pobierz pliki** projektu do wybranego folderu.

2. **Otwórz terminal (CMD)** w folderze projektu:
   *   Kliknij prawym przyciskiem myszy w folderze i wybierz "Otwórz w terminalu" lub wpisz `cmd` w pasku adresu folderu.

3. **Zainstaluj biblioteki:**
   Wpisz poniższą komendę i naciśnij Enter:
   ```
   npm install
   ```

4. **Uruchom serwer:**
   ```bash
   npm start
   ```
   Powinieneś zobaczyć komunikat: `Server started on http://localhost:3000`.
   ⚠️ **Nie zamykaj tego okna!** Musi być otwarte, aby strona działała.

5. **Otwórz aplikację:**
   Wpisz w przeglądarce adres: http://localhost:3000

## 🔐 Panel Administratora

Aby zarządzać testami, kliknij przycisk **"Panel administracyjny"** w menu bocznym.

**Domyślne hasło:**
> `Naukasuper123`

*(Hasło można zmienić edytując plik `public/admin.js` w linii 1).*

## 📂 Struktura danych

Wszystkie pytania i testy są zapisywane automatycznie w pliku:
`data/questions.json`

Możesz zrobić kopię zapasową tego pliku, aby nie stracić utworzonych testów.
