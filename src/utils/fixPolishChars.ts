const polishFixes: Record<string, string> = {
  "P�atno��": "Płatność",
  "Kart�": "Kartą",
  "Tytu�": "Tytuł",
  "Zwrot p�atno�ci kart�": "Zwrot płatności kartą",
  "Op�ata sk�adki ubezpieczeniowej": "Opłata składki ubezpieczeniowej",
  "Przelew na telefon przychodz. zew.": "Przelew na telefon przychodz. zew.",
  "Sp�ata kredytu": "Spłata kredytu",
  "Obci��enie": "Obciążenie",
  "Wyp�ata z bankomatu": "Wypłata z bankomatu",
  "Przelew z karty": "Przelew z karty",
  "Przelew z rachunku": "Przelew z rachunku",
  "Przelew na konto": "Przelew na konto",
  "Zlecenie sta�e": "Zlecenie stałe",
  // Add more as needed
};

export const fixPolishChars = (str: string) => {
  if (!str) return str;
  for (const [broken, correct] of Object.entries(polishFixes)) {
    str = str.replace(new RegExp(broken, "g"), correct);
  }
  return str;
};