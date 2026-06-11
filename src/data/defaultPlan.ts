import type { AppSettings, RoutineTask, TimerPreset } from "../types";

const weekdays = [1, 2, 3, 4, 5];
const everyDay = [0, 1, 2, 3, 4, 5, 6];
const strengthDays = [0, 2, 4];
const recoveryDays = [1, 3, 5, 6];

export const defaultSettings: AppSettings = {
  wakeTime: "07:00",
  workStart: "10:00",
  workEnd: "18:00",
  bedTime: "23:30",
  caffeineCutoff: "13:00",
  scoreTarget: 85
};

export const timerPresets: TimerPreset[] = [
  { id: "meditation", label: "Medytacja", minutes: 10 },
  { id: "deep-work", label: "Deep Work", minutes: 80 },
  { id: "reset", label: "Reset mieszkania", minutes: 10 },
  { id: "admin", label: "Administracja", minutes: 20 },
  { id: "body-scan", label: "Skan ciała", minutes: 10 }
];

export const defaultTasks: RoutineTask[] = [
  {
    id: "morning-launch",
    title: "Morning Launch",
    category: "morning",
    start: "07:00",
    end: "07:30",
    durationMinutes: 30,
    days: everyDay,
    priority: "critical",
    weight: 6,
    instructions: "Jeden blok startowy bez telefonu. Liczy się zamknięcie sekwencji, nie perfekcja co do minuty.",
    rationale: "Stała pobudka, światło i szybki ruch kotwiczą rytm dobowy, podnoszą pobudzenie korowe i redukują koszt pierwszych decyzji.",
    checklist: [
      "Wstań o 07:00, telefon poza ręką",
      "Pościel łóżko",
      "Szklanka wody i otwarcie okna",
      "Światło dzienne / balkon / spacer 10-15 min",
      "5-10 min rozruchu ciała",
      "Higiena i łazienka zero"
    ],
    isDefault: true
  },
  {
    id: "breakfast-coffee",
    title: "Paliwo + medytacja",
    category: "health",
    start: "07:30",
    end: "08:00",
    durationMinutes: 30,
    days: everyDay,
    priority: "critical",
    weight: 6,
    instructions: "Śniadanie i kawa przed medytacją. Medytacja po kofeinie, bez telefonu.",
    rationale: "Białko stabilizuje energię i sytość; kofeina blokuje receptory adenozynowe. Focused Attention trenuje ACC i dlPFC: wykrycie rozproszenia, hamowanie impulsu, powrót do celu.",
    checklist: [
      "35-50 g białka",
      "Kawa teraz, ostatnia najpóźniej 13:00",
      "Timer 10 min",
      "Uwaga na oddech",
      "Rozproszenie = etykieta 'myśl' i powrót"
    ],
    isDefault: true
  },
  {
    id: "deep-work",
    title: "Deep Work nad celem",
    category: "deepWork",
    start: "08:00",
    end: "09:20",
    durationMinutes: 80,
    days: everyDay,
    priority: "critical",
    weight: 8,
    instructions: "Jeden wynik o najwyższej dźwigni: finanse, portfolio, nauka albo projekt. Telefon poza zasięgiem.",
    rationale: "Blokowanie przełączania chroni kontrolę wykonawczą i pamięć roboczą. Najlepsza energia poznawcza idzie w cel zanim etat przejmie uwagę.",
    checklist: [
      "Biurko zero",
      "Jedno zadanie, jeden plik, jeden wynik",
      "80 min bez komunikatorów i sociali",
      "Na końcu zapisz lub wyślij rezultat"
    ],
    isDefault: true
  },
  {
    id: "morning-buffer",
    title: "Bufor techniczny",
    category: "morning",
    start: "09:20",
    end: "09:30",
    durationMinutes: 10,
    days: weekdays,
    priority: "standard",
    weight: 2,
    instructions: "Zamknij komputer, spakuj rzeczy, bez dokładania nowego zadania.",
    rationale: "Bufor redukuje efekt domina: jedno opóźnienie nie rozwala wyjścia do pracy.",
    checklist: [
      "Zapisz stan pracy",
      "Zamknij kartę / edytor",
      "Spakuj jedzenie, portfel, klucze, dokumenty"
    ],
    isDefault: true
  },
  {
    id: "prepare-work",
    title: "Prysznic + wyjście bez chaosu",
    category: "morning",
    start: "09:30",
    end: "09:50",
    durationMinutes: 20,
    days: weekdays,
    priority: "critical",
    weight: 4,
    instructions: "Limit 20 min. To ma być procedura startowa, nie negocjacje.",
    rationale: "Stała sekwencja wyjścia zmniejsza obciążenie decyzyjne i chroni punktualność bez zjadania bloku pracy.",
    checklist: [
      "Prysznic",
      "Ubranie",
      "Klucze, portfel, jedzenie, dokumenty",
      "Wyjście najpóźniej 09:50"
    ],
    isDefault: true
  },
  {
    id: "work-block",
    title: "Etat bez chaosu",
    category: "work",
    start: "10:00",
    end: "18:00",
    durationMinutes: 480,
    days: weekdays,
    priority: "critical",
    weight: 7,
    instructions: "Trzy wyniki do dowiezienia. Przerwy mają wspierać pracę, nie zamieniać się w scroll.",
    rationale: "Precyzyjne intencje implementacyjne i krótkie przerwy obniżają reaktywność na bodźce oraz stabilizują uwagę w czasie dnia pracy.",
    checklist: [
      "Na starcie zapisz 3 konkretne wyniki",
      "Lunch z białkiem",
      "5-10 min marszu po posiłku",
      "Kofeina tylko do 13:00",
      "Na koniec zapisz stan i następny krok"
    ],
    isDefault: true
  },
  {
    id: "reset-strength",
    title: "Reset + trening siłowy",
    category: "training",
    start: "18:10",
    end: "20:10",
    durationMinutes: 120,
    days: strengthDays,
    priority: "critical",
    weight: 7,
    instructions: "Wtorek, czwartek, niedziela. Realny blok z dojazdem: reset, przejazd, rozgrzewka, trening, powrót.",
    rationale: "Trzy sesje tygodniowo są zgodne z progresją treningu oporowego dla regularności i adaptacji. Blok 120 min chroni punktualność, regenerację i sen zamiast udawać nierealne 70 min.",
    checklist: [
      "Buty, torba i ubrania na miejsce",
      "10 min: kubki, śmieci, blat, ubrania",
      "Dojazd bez scrollowania",
      "8-10 min rozgrzewki: mobilizacja + serie narastające",
      "4 ruchy główne, 2-3 serie robocze",
      "Zapas 1-3 powtórzeń, bez upadku mięśniowego jako normy",
      "Zapisz ciężary i wróć do domu"
    ],
    isDefault: true
  },
  {
    id: "reset-recovery",
    title: "Reset + ruch tlenowy",
    category: "training",
    start: "18:10",
    end: "19:20",
    durationMinutes: 70,
    days: recoveryDays,
    priority: "standard",
    weight: 4,
    instructions: "Poniedziałek, środa, piątek, sobota. Reset mieszkania i szybki marsz zamiast leżenia z telefonem.",
    rationale: "Niska intensywność dorzuca objętość tlenową, poprawia kontrolę glukozy i regenerację bez kosztu ciężkiego treningu.",
    checklist: [
      "Buty, torba i ubrania na miejsce",
      "10 min resetu mieszkania",
      "40-60 min szybkiego marszu albo lekkie cardio",
      "Bez sociali w trakcie"
    ],
    isDefault: true
  },
  {
    id: "dinner-admin-regular",
    title: "Kolacja + administracja",
    category: "admin",
    start: "19:30",
    end: "20:20",
    durationMinutes: 50,
    days: recoveryDays,
    priority: "critical",
    weight: 6,
    instructions: "Jedzenie, kuchnia zero i jedna rzecz finansowo-organizacyjna.",
    rationale: "Stabilny posiłek zmniejsza wieczorne impulsy. Codzienna mała ekspozycja na finanse i dokumenty redukuje unikanie oraz ciężar mentalny zaległości.",
    checklist: [
      "Kolacja: białko, warzywa, węgle złożone",
      "Naczynia, blat, śmieci",
      "Jedna rzecz: rachunek, mail, dokument albo budżet",
      "Zapisz następny krok administracyjny"
    ],
    isDefault: true
  },
  {
    id: "dinner-admin-training",
    title: "Kolacja potreningowa + minimum admin",
    category: "admin",
    start: "20:15",
    end: "20:55",
    durationMinutes: 40,
    days: strengthDays,
    priority: "critical",
    weight: 5,
    instructions: "Po treningu tylko rzeczy niezbędne: jedzenie, kuchnia zero i jeden krótki punkt organizacyjny.",
    rationale: "Po późnym treningu priorytetem jest uzupełnienie energii, wyciszenie układu nerwowego i ochrona snu. Admin zostaje w wersji minimum, żeby nie rozkręcać pobudzenia poznawczego.",
    checklist: [
      "Kolacja z białkiem i węglami",
      "Prysznic / higiena po treningu",
      "Kuchnia zero w 8 min",
      "Jedna krótka rzecz organizacyjna",
      "Zapisz kolejny trening"
    ],
    isDefault: true
  },
  {
    id: "light-block",
    title: "Lekki blok",
    category: "deepWork",
    start: "20:45",
    end: "21:15",
    durationMinutes: 30,
    days: recoveryDays,
    priority: "standard",
    weight: 3,
    instructions: "Nauka, czytanie, portfolio albo mała praca koncepcyjna. Niskie tarcie, bez heroizmu.",
    rationale: "Krótka, powtarzalna dawka utrzymuje ciągłość celu bez przeciążania snu.",
    checklist: [
      "Jedna mała rzecz albo 10 stron czytania",
      "Nie zaczynaj nowego dużego projektu",
      "Zapisz, co kontynuujesz jutro"
    ],
    isDefault: true
  },
  {
    id: "shutdown",
    title: "Shutdown",
    category: "evening",
    start: "22:30",
    end: "23:30",
    durationMinutes: 60,
    days: everyDay,
    priority: "critical",
    weight: 6,
    instructions: "Zamknięcie dnia i wygaszenie układu nerwowego. Telefon poza łóżkiem.",
    rationale: "Planowanie jutra przenosi decyzje poza poranek. Niższe światło i skan ciała obniżają pobudzenie, chronią melatoninę i ograniczają ruminacje.",
    checklist: [
      "Plan jutra: 3 wyniki",
      "Ubranie, jedzenie, biurko i pierwszy krok Deep Work",
      "Skan ciała 10 min",
      "Ciepłe światło, zero sociali",
      "Telefon poza łóżkiem"
    ],
    isDefault: true
  },
  {
    id: "sleep",
    title: "Sen",
    category: "health",
    start: "23:30",
    durationMinutes: 450,
    days: everyDay,
    priority: "critical",
    weight: 6,
    instructions: "Łóżko. Telefon poza zasięgiem.",
    rationale: "Sen odbudowuje kontrolę wykonawczą, pamięć i regulację emocji.",
    isDefault: true
  }
];
