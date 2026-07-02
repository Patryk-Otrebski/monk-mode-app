export type GuideSection = {
  id: string;
  kicker: string;
  title: string;
  body: string[];
  rules?: string[];
  evidence?: "mocne" | "średnie" | "słabe";
};

/**
 * Przewodnik systemu — wersja skrócona protokołu Monk + Founder Mode,
 * dostosowana do okresu bez etatu. Pełna wersja: 12_MONK_FOUNDER_MODE_PROTOCOL.md
 * i 25_MONK_MODE_2.0_ANALIZA_I_PLAN.md w katalogu projektu.
 */
export const guideSections: GuideSection[] = [
  {
    id: "how-it-works",
    kicker: "Instrukcja",
    title: "Jak działa ten system",
    body: [
      "Nie planujemy doby co do minuty — plan minutowy klęka przy pierwszym gorszym dniu. Zamiast tego: bloki-okna w stałej kolejności, 3 poziomy dnia i Wielka Trójka, która decyduje, czy dzień się liczy.",
      "Rano wybierasz poziom w 5 sekund: P1 (zły dzień — tylko minima kotwic), P2 (normalny dzień — domyślny), P3 (wysoka energia — dołóż bloki, ale z sufitem 4-5h pracy głębokiej).",
      "Dzień jest ZALICZONY, gdy zrobisz ≥1 działanie w stronę pracy LUB projektu oraz ruch. Dzień jest NIE-ZERO, gdy zrobisz cokolwiek. Jedyna twarda reguła: nigdy dwa zera z rzędu."
    ],
    rules: [
      "Rano: wybierz P1/P2/P3, przeczytaj wczorajszy MIT",
      "W ciągu dnia: odhaczaj bloki, wieczorem Wielką Trójkę",
      "Zły dzień → P1, nie zero. Minimum to zwycięstwo",
      "Niedziela: przegląd tygodnia, 3 pytania, 1 eksperyment"
    ]
  },
  {
    id: "why-procrastinate",
    kicker: "Mechanizm",
    title: "Dlaczego odkładasz (to nie lenistwo)",
    body: [
      "Prokrastynacja to regulacja emocji, nie wada charakteru: odkładasz nie zadanie, tylko nieprzyjemne uczucie z nim związane — lęk, niejasność, przytłoczenie. Ulga po odłożeniu nagradza unikanie i pętla się wzmacnia (model Sirois & Pychyl).",
      "Największe tarcie jest w sekundzie zero. Gdy już zaczniesz, opór spada. Dlatego system atakuje moment startu: wersje minimum (25 min), pierwszy ruch przygotowany wieczorem, telefon w innym pokoju.",
      "Niejasność = paraliż. 'Szukać pracy' to chmura — mózg nie umie zacząć chmury. '2 dopasowane aplikacje do 12:00' — to umie."
    ],
    evidence: "mocne"
  },
  {
    id: "unemployment",
    kicker: "Bez etatu",
    title: "Ryzyko #1: rozpad struktury i izolacja",
    body: [
      "Praca daje ukryte dobra: strukturę czasu, kontakt z ludźmi, wspólny cel, status i aktywność (model deprywacji Jahody; potwierdzony metaanalizą Paul i in. 2023 — bezrobotni raportują niższy poziom wszystkich pięciu funkcji). To ich brak, nie sam brak pieniędzy, najmocniej obniża nastrój i napęd.",
      "Uwaga z badań: najłatwiej niedocenić kontakt społeczny — różnice w samej strukturze czasu są mniejsze niż w poczuciu celu i kontaktach. Dlatego plan odtwarza nie tylko rytm (stała pobudka, stałe bloki, godziny otwarcia i zamknięcia), ale też ludzi: kontakty w bloku pracy i wieczorem.",
      "Sen do południa i 'wolność' bez ram to najszybsza droga do spirali. Rytm trzyma się kotwicą pobudki i porannego światła."
    ],
    rules: [
      "Pobudka o stałej porze ±30 min, też w weekend",
      "Godziny pracy własnej: ~8:15-16:30, potem koniec",
      "2-3 realne kontakty z ludźmi w tygodniu (nie tylko czaty)",
      "Wieczór i weekend = regeneracja, nie poczucie winy"
    ],
    evidence: "mocne"
  },
  {
    id: "job-search",
    kicker: "Praca",
    title: "Szukanie pracy jako projekt, nie stan",
    body: [
      "Metaanaliza 47 badań interwencji (Liu, Huang i Wang 2014, Psychological Bulletin): uczestnicy ustrukturyzowanych programów mieli 2,67x wyższe szanse na zatrudnienie. Działa połączenie DWÓCH składników: umiejętności (dopasowane CV, autoprezentacja) + motywacja (cele, poczucie sprawczości, 'szczepienie' na odmowy, wsparcie ludzi). Sama technika bez ochrony motywacji nie działa.",
      "Jakość bije ilość: 2-3 dopasowane aplikacje dziennie (15-25/tydzień to górna granica sensu) + kontakty z ludźmi są warte więcej niż 20 masowych CV. Badania nad wypaleniem: ponad połowa szukających długo zgłasza wyczerpanie procesem — dlatego twardy time-box i odcięcie wieczorem to część metody, nie lenistwo.",
      "Mierz to, co kontrolujesz (wysłane aplikacje, kontakty, follow-upy), nie to, czego nie kontrolujesz (odpowiedzi). Odmowa = punkt danych procesu, nie ocena Ciebie — to dosłownie składnik 'inoculation against setbacks' z programów JOBS."
    ],
    rules: [
      "Twardy time-box: 2h dziennie, potem temat zamknięty",
      "2-3 dopasowane aplikacje LUB 1 aplikacja + 1 kontakt",
      "Piątek: przegląd i follow-upy zamiast nowych aplikacji",
      "Weekend: zero szukania pracy — planowe odstawienie"
    ],
    evidence: "mocne"
  },
  {
    id: "own-project",
    kicker: "Projekt",
    title: "Własny projekt: najpierw na zewnątrz",
    body: [
      "Główny wróg to produktywna prokrastynacja: research, ulepszanie narzędzi, kolejny pomysł. Daje ulgę i pozory pracy, a nie generuje przychodu ani feedbacku.",
      "Reguła artefaktu: każdy blok projektu kończy się czymś, co widzi świat — publikacją, ofertą, wiadomością do potencjalnego klienta, wersją produktu. Jeśli rynek tego nie zobaczył, to się nie liczy.",
      "Jedna dźwignia naraz, na 90 dni. Przełączanie projektów resetuje krzywą uczenia i dystrybucji — rozpraszając się na kilka, gwarantujesz sobie brak sygnału ze wszystkich."
    ],
    rules: ["Blok projektu rano, gdy głowa najświeższa", "≥1 artefakt na zewnątrz dziennie", "Research tylko z timeboxem i konkretnym pytaniem"],
    evidence: "średnie"
  },
  {
    id: "learning",
    kicker: "Nauka",
    title: "Nauka, która zostaje w głowie",
    body: [
      "Dwie techniki z najmocniejszymi dowodami (przegląd Dunlosky i in. 2013): retrieval practice (odtwarzanie z pamięci zamiast ponownego czytania) i spacing (rozłożenie powtórek w czasie). Bierne oglądanie kursów daje złudzenie wiedzy.",
      "Zaczynaj blok nauki od 5 min przypomnienia wczorajszego materiału z pamięci, kończ zapisaniem 3 pytań na jutro. Przerwy: krótkie 5-10 min podnoszą wigor (metaanaliza Albulescu 2022), ale po ciężkim bloku poznawczym potrzeba dłuższej przerwy — stąd spacer po obiedzie. Ucz się robiąc: kod, zadania, mini-projekty do portfolio.",
      "Nauka ma służyć zatrudnialności albo projektowi — wybieraj materiał pod konkretną rolę lub konkretny produkt, nie 'na zapas'."
    ],
    evidence: "mocne"
  },
  {
    id: "energy",
    kicker: "Energia",
    title: "Sen, światło, ruch — 90% efektu",
    body: [
      "REGULARNOŚC snu bije jego długość: badanie UK Biobank (61 tys. osób, Windred i in. 2023) pokazało, że regularność rytmu snu i pobudki jest silniejszym predyktorem zdrowia i śmiertelności niż liczba godzin. Dlatego kotwicą jest STAŁA pora pobudki i gaszenia świateł, nie perfekcyjne 8h. Poranne światło + kofeina ostatnia o 13:00 domykają rytm.",
      "Trening działa jak lek: przegląd parasolowy 97 przeglądów (Singh i in. 2023, BJSM, 128 tys. uczestników) — aktywność fizyczna daje średni efekt na depresję (-0,43) i lęk (-0,42), porównywalny z terapią. Przy obniżonym nastroju działanie mimo braku chęci (behavioral activation) jest skuteczniejsze niż czekanie na motywację.",
      "Suplementy to maksymalnie 5-10% efektu i tylko po badaniach krwi. Jeśli przewlekle brak energii — najpierw wyklucz medycynę (morfologia, ferrytyna, TSH, wit. D, B12), nie walcz siłą woli z chorobą."
    ],
    evidence: "mocne"
  },
  {
    id: "attention",
    kicker: "Uwaga",
    title: "Telefon i tarcie środowiska",
    body: [
      "Uczciwie: słynny efekt 'brain drain' (sama obecność telefonu obniża pamięć roboczą, Ward 2017) NIE przeszedł prób replikacji (m.in. Ruiz Pardo i Minda 2022) — nie on jest powodem tej reguły. Pewne jest co innego: koszt przerwań i przełączania uwagi. Każde sięgnięcie po telefon to realne minuty powrotu do skupienia, a 30 mikro-przerwań dziennie zjada pracę głęboką mimo 8h przy biurku.",
      "Telefon w innym pokoju działa przez TARCIE, nie magię: usuwa okazję do sprawdzania, zanim impuls wygra. Siła woli to zawodny zasób; architektura środowiska działa 24/7. Dobre działania mają być ≤20 sekund od startu, złe mają kosztować (wylogowanie z aplikacji, cisza powiadomień).",
      "Rano żadnych tanich bodźców przez pierwszą godzinę — pierwsza nagroda dnia to ukończenie czegoś realnego, nie scroll."
    ],
    rules: ["Telefon w innym pokoju w blokach pracy", "Telefon ładuje się poza sypialnią", "Powiadomienia: domyślnie cisza", "Feedy najwcześniej po pierwszym bloku"],
    evidence: "średnie"
  },
  {
    id: "recovery",
    kicker: "Reset",
    title: "Powrót po wpadce (najważniejsza część)",
    body: [
      "Złamiesz zasady — wielokrotnie. System to przewiduje. Badanie Lally i in. (2010) nad realnym budowaniem nawyków (mediana 66 dni, zakres 18-254): pominięcie POJEDYNCZEGO dnia nie zaburza procesu — automatyzm wraca po powrocie do działania. Większość ludzi nie przegrywa złym dniem, tylko reakcją na zły dzień: 'i tak już zawaliłem' (what-the-hell effect) zamienia jedno odstępstwo w stracony tydzień.",
      "Samokrytyka po wpadce pogłębia prokrastynację (więcej nieprzyjemnych emocji do uniknięcia). Samowspółczucie — potraktowanie wpadki jak zwykłego błędu — w badaniach ją redukuje. Wpadka to punkt danych, nie katastrofa.",
      "Reguła 10 minut: po zerwanym dniu natychmiast malutkie działanie naprawcze (10 min pracy albo ruchu). Jutro: tylko P1, bez 'nadrabiania'. Jeśli P1 trwa 4-5 dni z rzędu — to sygnał do przeglądu (medycyna? źle dobrany cel?), nie do zaciskania zębów."
    ],
    rules: ["Nigdy dwa zera z rzędu", "Po wpadce: 10 min czegokolwiek naprawczego", "Po złym dniu wracasz do P1, nie do heroizmu"],
    evidence: "średnie"
  },
  {
    id: "review",
    kicker: "Tydzień",
    title: "Przegląd tygodniowy i metryki",
    body: [
      "Codziennie wieczorem 2 minuty: odhacz Wielką Trójkę, bloki i zapisz MIT na jutro. Zapisanie planu w formie 'jutro o X robię Y' (implementation intention) to jedna z najsilniej udokumentowanych interwencji — duże metaanalizy pokazują wyraźny wpływ na realizację zamiarów.",
      "W niedzielę 20-30 min: co ruszyło w stronę pracy i pieniędzy, gdzie było najwęższe gardło, jaki JEDEN eksperyment na nowy tydzień. Jedna decyzja, nie roztrząsanie.",
      "North Star tej fazy: rosnąca liczba dni zaliczonych (działanie na pracę/projekt + ruch). Jeśli ten trend rośnie — system działa, nawet jeśli rynek jeszcze milczy."
    ],
    evidence: "mocne"
  }
];
