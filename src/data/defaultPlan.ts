import type { AppSettings, RoutineTask, TimerPreset } from "../types";

const weekdays = [1, 2, 3, 4, 5];
const everyDay = [0, 1, 2, 3, 4, 5, 6];
const strengthDays = [0, 2, 4];
const recoveryDays = [1, 3, 5, 6];
const weekendDays = [0, 6];
const sundayOnly = [0];

export const defaultSettings: AppSettings = {
  wakeTime: "07:00",
  bedTime: "23:00",
  caffeineCutoff: "13:00",
  scoreTarget: 80
};

export const timerPresets: TimerPreset[] = [
  { id: "start-25", label: "Start 25", minutes: 25 },
  { id: "deep-work", label: "Deep Work 50", minutes: 50 },
  { id: "deep-work-long", label: "Deep Work 80", minutes: 80 },
  { id: "reset", label: "Reset 10", minutes: 10 },
  { id: "meditation", label: "Medytacja 10", minutes: 10 },
  { id: "admin", label: "Admin 20", minutes: 20 }
];

/**
 * Plan dla dnia bez etatu. Bloki to okna, nie sztywne minuty — liczy się
 * kolejność i zamknięcie bloku, nie start co do minuty.
 * Kręgosłup dnia: pobudka -> projekt (na zewnątrz) -> praca (aplikacje)
 * -> nauka -> ruch -> shutdown. Wielka Trójka decyduje, czy dzień się liczy.
 */
export const defaultTasks: RoutineTask[] = [
  {
    id: "morning-launch",
    title: "Start dnia: światło + ruch",
    category: "morning",
    start: "07:00",
    end: "07:45",
    durationMinutes: 45,
    days: everyDay,
    priority: "critical",
    weight: 6,
    instructions:
      "Stała pobudka także bez pracy — to fundament całego systemu. Bez telefonu przez pierwszą godzinę.",
    rationale:
      "Bez etatu znika zewnętrzna struktura dnia i rytm dryfuje. REGULARNOŚĆ rytmu snu i pobudki jest silniejszym predyktorem zdrowia niż liczba godzin snu (UK Biobank, Windred i in. 2023). Stała pobudka + poranne światło to najsilniejszy regulator rytmu okołodobowego (dowody: mocne).",
    checklist: [
      "Pobudka o stałej porze (±30 min, też weekend)",
      "Telefon nie wchodzi do ręki",
      "Szklanka wody, pościel łóżko",
      "10-15 min światła dziennego: balkon / spacer",
      "5-10 min rozruchu ciała"
    ],
    minimum: "Wstań o stałej porze + 10 min światła dziennego. Tylko tyle.",
    isDefault: true
  },
  {
    id: "fuel-plan",
    title: "Paliwo + wybór poziomu dnia",
    category: "health",
    start: "07:45",
    end: "08:15",
    durationMinutes: 30,
    days: everyDay,
    priority: "standard",
    weight: 3,
    instructions:
      "Śniadanie białkowe, kawa, wybór poziomu dnia (P1/P2/P3) w 5 sekund i potwierdzenie planu z wczorajszego shutdownu.",
    rationale:
      "Białko stabilizuje energię. Wybór poziomu rano zdejmuje negocjacje z całego dnia: w gorszy dzień schodzisz do P1, nie do zera. Opcjonalnie 10 min medytacji uwagi (trening powrotu do celu).",
    checklist: [
      "30-50 g białka",
      "Kawa teraz, ostatnia do 13:00",
      "Wybierz poziom dnia: P1 / P2 / P3",
      "Przeczytaj MIT zapisany wczoraj wieczorem"
    ],
    isDefault: true
  },
  {
    id: "deep-project",
    title: "Deep Work: własny projekt",
    category: "project",
    start: "08:15",
    end: "10:00",
    durationMinutes: 105,
    days: weekdays,
    priority: "critical",
    weight: 8,
    instructions:
      "Pierwszy blok dnia idzie na projekt, który ma zarabiać. Reguła: zanim blok się skończy, powstaje ≥1 artefakt, który widzi świat (publikacja, oferta, wiadomość, wersja produktu). Najpierw na zewnątrz, potem dłubanie.",
    rationale:
      "Rano kontrola wykonawcza jest najświeższa — najtrudniejsza i najbardziej unikana praca idzie pierwsza. Research i ulepszanie narzędzi dają ulgę bez przychodu (produktywna prokrastynacja); wymuszenie artefaktu na zewnątrz odwraca kolejność nagradzania. Telefon w innym pokoju działa przez tarcie: usuwa okazję do przerwań, a to przerwania (nie sama obecność) niszczą skupienie.",
    checklist: [
      "Telefon w innym pokoju",
      "Jedno zadanie z najwyższą dźwignią na pieniądze",
      "2 x 50 min z 5-10 min przerwy",
      "Na końcu: co dziś zobaczył świat? (artefakt)"
    ],
    minimum: "25 min nad projektem, telefon w innym pokoju. Wynik: 1 mały artefakt.",
    isDefault: true
  },
  {
    id: "job-search",
    title: "Szukanie pracy (time-box 2h)",
    category: "jobSearch",
    start: "10:15",
    end: "12:00",
    durationMinutes: 105,
    days: weekdays,
    priority: "critical",
    weight: 8,
    instructions:
      "Twardy time-box: 2 godziny i koniec. Jakość > ilość: 2-3 dopasowane aplikacje LUB 1 aplikacja + 1 kontakt z człowiekiem (znajomy, rekruter, follow-up). Piątek: przegląd tygodnia aplikacji zamiast nowych.",
    rationale:
      "Metaanaliza interwencji (Liu i in. 2014): ustrukturyzowane szukanie z celami wejściowymi + ochroną motywacji daje 2,67x wyższe szanse zatrudnienia. Odmowa = punkt danych procesu ('inoculation against setbacks'). Rozciąganie szukania na 8h daje ruminację i wypalenie, nie oferty (dowody: mocne).",
    checklist: [
      "Cel dnia: 2-3 dopasowane aplikacje LUB 1 aplikacja + 1 kontakt",
      "CV/list dopasowane do ogłoszenia, nie masówka",
      "1 follow-up do wcześniejszej aplikacji",
      "Zapisz w notatce: co wysłane, do kogo",
      "Po 2h ZAMYKASZ temat pracy do jutra"
    ],
    minimum: "1 działanie: jedna aplikacja ALBO jedna wiadomość do człowieka (15 min).",
    isDefault: true
  },
  {
    id: "lunch-walk",
    title: "Obiad + marsz",
    category: "health",
    start: "12:00",
    end: "13:00",
    durationMinutes: 60,
    days: everyDay,
    priority: "standard",
    weight: 3,
    instructions: "Prawdziwy posiłek z białkiem i 10-15 min marszu. Bez feedów przy jedzeniu.",
    rationale:
      "Po ciężkim bloku poznawczym krótkie mikroprzerwy nie wystarczają do odzyskania wydajności (metaanaliza Albulescu 2022) — potrzebna jest dłuższa przerwa. Marsz po posiłku dodatkowo poprawia kontrolę glukozy i przerywa siedzenie.",
    checklist: ["Białko + warzywa + węgle złożone", "10-15 min marszu", "Zero scrollowania przy stole"],
    isDefault: true
  },
  {
    id: "deep-learning",
    title: "Nauka główna",
    category: "deepWork",
    start: "13:00",
    end: "14:45",
    durationMinutes: 105,
    days: weekdays,
    priority: "critical",
    weight: 7,
    instructions:
      "Blok kompetencji: kurs, dokumentacja, projekt ćwiczeniowy. Aktywnie: pisz kod / rozwiązuj / odtwarzaj z pamięci. Zero biernego oglądania.",
    rationale:
      "Retrieval practice i spacing to dwie najlepiej udokumentowane techniki uczenia się (dowody: mocne). Materiał wraca w powtórkach zamiast być 'przerobiony' raz. Nauka po południu jest lżejsza niż tworzenie — dlatego projekt i aplikacje idą rano.",
    checklist: [
      "5 min: przypomnij wczorajszy materiał Z PAMIĘCI",
      "2 x 45-50 min pracy aktywnej",
      "Zapisz 3 pytania do jutrzejszej powtórki",
      "Efekt nauki dopisuj do portfolio, gdy się da"
    ],
    minimum: "25 min aktywnej nauki (zadanie lub fiszki), nie oglądanie.",
    isDefault: true
  },
  {
    id: "flex-block",
    title: "Blok elastyczny",
    category: "deepWork",
    start: "15:00",
    end: "16:30",
    durationMinutes: 90,
    days: weekdays,
    priority: "optional",
    weight: 2,
    instructions:
      "Dokończenie projektu albo nauki — wg tego, co tydzień wymaga. Tu też wchodzą urzędy, lekarz, sprawy życiowe. Jeśli energia siadła — odpuść bez winy, krytyczne bloki już za Tobą.",
    rationale:
      "Sufit ~4-5h realnej pracy głębokiej dziennie: powyżej jakość spada i kupujesz crash na jutro. Blok elastyczny domyka dzień bez rozdmuchiwania planu, a plan z luzem przeżywa gorsze dni.",
    checklist: ["Jedna rzecz, nie trzy", "Jeśli urzędy/sprawy — to jest to miejsce"],
    isDefault: true
  },
  {
    id: "home-admin",
    title: "Dom + administracja",
    category: "admin",
    start: "16:30",
    end: "17:15",
    durationMinutes: 45,
    days: everyDay,
    priority: "standard",
    weight: 3,
    instructions: "10 min resetu mieszkania + jedna rzecz finansowo-urzędowa. Małe dawki codziennie zamiast góry zaległości.",
    rationale:
      "Codzienna mała ekspozycja na finanse/dokumenty redukuje unikanie i ciężar mentalny — zaległości przestają rosnąć w tle. Porządek w otoczeniu obniża tarcie startu następnego dnia.",
    checklist: ["10 min: kubki, blat, śmieci, ubrania", "1 rzecz: rachunek / mail / dokument / budżet", "Zapisz następny krok, jeśli sprawa ma ciąg dalszy"],
    isDefault: true
  },
  {
    id: "strength-training",
    title: "Trening siłowy",
    category: "training",
    start: "17:30",
    end: "19:30",
    durationMinutes: 120,
    days: strengthDays,
    priority: "critical",
    weight: 6,
    instructions: "Niedziela, wtorek, czwartek. Pełny blok z dojazdem. Dojazd bez scrollowania.",
    rationale:
      "Aktywność fizyczna daje średni efekt na depresję i lęk, porównywalny z terapią (przegląd parasolowy Singh i in. 2023: 97 przeglądów, 128 tys. osób). Trening oporowy 3x/tydzień poprawia też funkcje wykonawcze i sen. To codzienne 'małe zwycięstwo' budujące tożsamość osoby, która robi, co zaplanowała.",
    checklist: [
      "Torba spakowana wcześniej (leży przy drzwiach)",
      "8-10 min rozgrzewki",
      "4 ruchy główne, 2-3 serie robocze",
      "Zapas 1-3 powtórzeń, bez upadku mięśniowego jako normy",
      "Zapisz ciężary"
    ],
    minimum: "10 min ruchu: spacer, przysiady, rozciąganie. Liczy się fakt, nie objętość.",
    isDefault: true
  },
  {
    id: "cardio-walk",
    title: "Ruch tlenowy",
    category: "training",
    start: "17:30",
    end: "18:30",
    durationMinutes: 60,
    days: recoveryDays,
    priority: "standard",
    weight: 4,
    instructions: "Poniedziałek, środa, piątek, sobota: 40-60 min szybkiego marszu albo lekkie cardio. Bez sociali w trakcie.",
    rationale:
      "Objętość tlenowa w dni nietreningowe: regeneracja, kontrola glukozy, nastrój — bez kosztu ciężkiej sesji. Marsz to też najtańsza forma przerwy od ekranu.",
    checklist: ["40-60 min marszu / roweru / lekkiego cardio", "Telefon tylko do muzyki/podcastu"],
    minimum: "10 min spaceru. Wyjdź z domu.",
    isDefault: true
  },
  {
    id: "dinner-reset",
    title: "Kolacja + kuchnia zero",
    category: "home",
    start: "19:30",
    end: "20:15",
    durationMinutes: 45,
    days: everyDay,
    priority: "standard",
    weight: 3,
    instructions: "Stabilny posiłek i czysta kuchnia. Po treningu siłowym: białko + węgle, prysznic.",
    rationale: "Stabilna kolacja zmniejsza wieczorne impulsy żywieniowe; czysta kuchnia to mniejsze tarcie jutrzejszego poranka.",
    checklist: ["Białko + węgle", "Naczynia, blat, śmieci"],
    isDefault: true
  },
  {
    id: "evening-free",
    title: "Wieczór wolny (niska stymulacja)",
    category: "evening",
    start: "20:15",
    end: "22:00",
    durationMinutes: 105,
    days: everyDay,
    priority: "optional",
    weight: 1,
    instructions:
      "Świadomy czas wolny — zaplanowany, nie 'luka'. Ludzie, czytanie, serial z limitem, hobby. Bez doomscrollingu i bez zaczynania nowej pętli pracy.",
    rationale:
      "System bez zaplanowanej przyjemności łamie się w 2-3 tygodnie. Regeneracja i kontakt z ludźmi to ochrona nastroju — przy bezrobociu izolacja społeczna jest jednym z głównych czynników pogorszenia zdrowia psychicznego (dowody: mocne).",
    checklist: ["Zero nieskończonych feedów", "2-3 realne kontakty z ludźmi w tygodniu planowane tutaj", "Nie zaczynaj nowej pracy"],
    isDefault: true
  },
  {
    id: "shutdown",
    title: "Shutdown: zamknięcie dnia",
    category: "evening",
    start: "22:00",
    end: "22:30",
    durationMinutes: 30,
    days: everyDay,
    priority: "critical",
    weight: 6,
    instructions:
      "Domknięcie pętli: odhacz dzień w aplikacji, zapisz MIT i pierwszy ruch na jutro, telefon na ładowanie poza sypialnią.",
    rationale:
      "Zapisanie konkretnego pierwszego zadania na jutro ('jutro o X robię Y') to implementation intention — metaanaliza 94 badań (Gollwitzer i Sheeran 2006) daje efekt d=0,65 na realizację zamiarów. Zabija poranny paraliż 'od czego zacząć'. Domknięcie dnia obniża ruminację i poprawia sen.",
    checklist: [
      "Odhacz Wielką Trójkę i bloki w aplikacji",
      "Zapisz MIT na jutro + pierwszy ruch (otwarty plik, torba przy drzwiach)",
      "Telefon poza sypialnię",
      "Światło ciepłe, ekrany off"
    ],
    minimum: "2 minuty: odhacz dzień + zapisz jedno zadanie na jutro.",
    isDefault: true
  },
  {
    id: "sleep",
    title: "Sen 8h",
    category: "health",
    start: "23:00",
    durationMinutes: 480,
    days: everyDay,
    priority: "critical",
    weight: 6,
    instructions: "Łóżko o stałej porze. Telefon poza zasięgiem.",
    rationale:
      "Sen to mnożnik wszystkiego: kontrola impulsów, nastrój, pamięć, nauka. Regularność pory snu jest silniejszym predyktorem zdrowia niż długość (Windred i in. 2023) — stała pora bije 'odsypianie'.",
    minimum: "Połóż się o stałej porze, telefon poza sypialnią.",
    isDefault: true
  },
  {
    id: "weekend-sprint",
    title: "Sprint weekendowy: projekt/nauka",
    category: "project",
    start: "09:30",
    end: "11:30",
    durationMinutes: 120,
    days: weekendDays,
    priority: "standard",
    weight: 5,
    instructions:
      "Jeden blok 2h zamiast pełnego dnia pracy: projekt albo nauka, wedle tego co tydzień wymaga. Bez szukania pracy w weekend — rekruterzy i tak nie czytają, a Ty potrzebujesz odstawienia.",
    rationale:
      "Weekend chroni regenerację: 1 blok utrzymuje ciągłość i spacing bez wypalenia. Planowane odstawienie od szukania pracy redukuje ruminację i utrzymuje jakość aplikacji w tygodniu.",
    checklist: ["2 x 50 min", "Sobota: budowa. Niedziela: powtórka + plan tygodnia", "Po bloku — koniec pracy na dziś"],
    minimum: "25 min projektu albo powtórki. Utrzymaj ciągłość.",
    isDefault: true
  },
  {
    id: "weekly-review",
    title: "Przegląd tygodnia (20-30 min)",
    category: "admin",
    start: "17:00",
    end: "17:30",
    durationMinutes: 30,
    days: sundayOnly,
    priority: "critical",
    weight: 5,
    instructions:
      "Niedziela: 3 pytania w zakładce Statystyki — co ruszyło, gdzie najwęższe gardło, jaki JEDEN eksperyment na przyszły tydzień. 30 minut, nie roztrząsanie.",
    rationale:
      "Tygodniowa pętla zwrotna koryguje kurs, zanim stracisz miesiąc na ślepej uliczce, i ogranicza sunk-cost. Jedna decyzja tygodniowo zamiast codziennego renegocjowania planu.",
    checklist: [
      "Ile dni z działaniem na pracę? Ile na projekt?",
      "Gdzie było największe tarcie?",
      "JEDEN eksperyment na nowy tydzień",
      "Zapisz w zakładce Statystyki"
    ],
    minimum: "5 min: odpowiedz na 3 pytania przeglądu w Statystykach.",
    isDefault: true
  }
];
