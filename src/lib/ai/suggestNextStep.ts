import { suggestion, type AiSuggestion } from "./types";

/**
 * Regelbasierter Vorschlag für den nächsten Bearbeitungsschritt anhand
 * von Kategorie und Status.
 */
export function suggestNextStep(input: {
  kategorie?: string | null;
  status?: string | null;
  patientZugeordnet?: boolean;
}): AiSuggestion<string> {
  if (input.patientZugeordnet === false) {
    return suggestion("Patient zuordnen", 0.85, "Es ist noch kein Patient zugeordnet – Zuordnung ist der nächste Schritt.", ["Regel: fehlende Patientenzuordnung"]);
  }

  switch (input.kategorie) {
    case "Rezeptanfrage":
      return suggestion("Rezept ärztlich prüfen und freigeben", 0.8, "Rezeptanfragen erfordern ärztliche Freigabe.", ["Kategorie: Rezeptanfrage"]);
    case "Laborbefund":
      return suggestion("Befund ärztlich sichten und Patient informieren", 0.8, "Laborbefunde müssen ärztlich beurteilt werden.", ["Kategorie: Laborbefund"]);
    case "Terminanfrage":
      return suggestion("Termin im Kalender anlegen/anpassen", 0.8, "Terminanfragen führen zu einem Kalendereintrag.", ["Kategorie: Terminanfrage"]);
    case "Rückrufbitte":
      return suggestion("Rückruf einplanen", 0.8, "Rückrufbitten erfordern einen geplanten Rückruf.", ["Kategorie: Rückrufbitte"]);
    case "Überweisung":
      return suggestion("Überweisung erstellen und versenden", 0.75, "Überweisungen werden dokumentiert und versendet.", ["Kategorie: Überweisung"]);
    case "Notfall":
      return suggestion("Sofort ärztlich eskalieren", 0.95, "Notfälle müssen umgehend eskaliert werden.", ["Kategorie: Notfall"]);
    default:
      return suggestion("Vorgang einer Kategorie zuordnen und Verantwortliche/n festlegen", 0.5, "Ohne klare Kategorie zuerst triagieren.", ["Standardregel"]);
  }
}
