import React, { useState } from 'react';
import { HelpCircle, X, Home, Plus, ClipboardList, Users, AlertTriangle, MoveHorizontal, Send, FileDown, BarChart2, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Trash2, RefreshCw } from 'lucide-react';

interface HelpSection {
  title: string;
  icon: React.ElementType;
  description: string;
  subsections: {
    title: string;
    content: string[];
    steps?: string[];
    notes?: string[];
    warnings?: string[];
  }[];
}

export function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const sections: HelpSection[] = [
    {
      title: 'Projektübersicht',
      icon: Home,
      description: 'Das Dashboard bietet Ihnen einen umfassenden Überblick über Ihr Projekt.',
      subsections: [
        {
          title: 'Timeline-Ansicht',
          content: [
            'Zeigt den zeitlichen Ablauf aller Aufgaben in einem übersichtlichen Zeitstrahl',
            'Automatische Aktualisierung bei Änderungen',
            'Manuelles Aktualisieren über den "Aktualisieren"-Button möglich'
          ],
          steps: [
            'Die Timeline wird sofort mit zwischengespeicherten Daten angezeigt',
            'Neue Daten werden automatisch im Hintergrund geladen',
            'Letzte Aktualisierungszeit wird oben angezeigt',
            'Klicken Sie auf "Aktualisieren" für manuelle Aktualisierung'
          ],
          notes: [
            'Daten werden lokal zwischengespeichert für schnelle Anzeige',
            'Echtzeit-Updates bei Änderungen durch andere Benutzer',
            'Optimierte Leistung durch intelligentes Caching'
          ]
        },
        {
          title: 'Kanban-Ansicht',
          content: [
            'Organisiert Aufgaben nach ihrem Status (Ausstehend, In Bearbeitung, Abgeschlossen)',
            'Zeigt den aktuellen Bearbeitungsstand jeder Aufgabe',
            'Echtzeit-Aktualisierung bei Statusänderungen'
          ]
        },
        {
          title: 'Matrix-Ansicht',
          content: [
            'Detaillierte tabellarische Übersicht aller Aufgaben',
            'Zeigt Status, Verzögerungen und weitere Details',
            'Optimiert für schnelle Ladezeiten und Aktualisierungen'
          ]
        }
      ]
    },
    {
      title: 'Aufgaben hinzufügen',
      icon: Plus,
      description: 'Hier können Sie neue Aufgaben zum Projekt hinzufügen und deren Abhängigkeiten definieren.',
      subsections: [
        {
          title: 'Erforderliche Angaben',
          content: [
            'Aufgabenname: Eindeutige Bezeichnung der Aufgabe',
            'Dauer: Geplante Dauer in Tagen',
            'Zuständige Gewerkschaft: Verantwortlicher Subunternehmer',
            'Abhängigkeiten: Aufgaben, die vorher abgeschlossen sein müssen'
          ]
        },
        {
          title: 'Vorgehensweise',
          steps: [
            'Füllen Sie alle erforderlichen Felder aus',
            'Wählen Sie bei Bedarf Abhängigkeiten aus',
            'Klicken Sie auf "Aufgabe hinzufügen"',
            'Die Aufgabe erscheint in der Aufgabenübersicht'
          ]
        },
        {
          title: 'Wichtige Hinweise',
          notes: [
            'Abhängigkeiten können nur zu bereits erstellten Aufgaben definiert werden',
            'Die Reihenfolge der Aufgaben wird automatisch basierend auf den Abhängigkeiten berechnet',
            'Änderungen sind später noch möglich'
          ]
        }
      ]
    },
    {
      title: 'Aufgabenübersicht',
      icon: ClipboardList,
      description: 'Verwalten Sie hier alle Projektaufgaben und starten Sie das Projekt.',
      subsections: [
        {
          title: 'Hauptfunktionen',
          content: [
            'Projektstartdatum festlegen',
            'Aufgaben überprüfen und bearbeiten',
            'Aufgabenreihenfolge anpassen',
            'Projekt starten und Zeitplan aktivieren'
          ]
        },
        {
          title: 'Aufgaben verschieben',
          steps: [
            'Nutzen Sie die Pfeile in der Position-Spalte',
            'Pfeil nach oben: Verschiebt die Aufgabe eine Position nach oben',
            'Pfeil nach unten: Verschiebt die Aufgabe eine Position nach unten',
            'Die Reihenfolge wird automatisch gespeichert'
          ],
          notes: [
            'Die erste Aufgabe kann nicht nach oben verschoben werden',
            'Die letzte Aufgabe kann nicht nach unten verschoben werden',
            'Die Verschiebung berücksichtigt keine Abhängigkeiten'
          ]
        },
        {
          title: 'Projekt starten',
          steps: [
            'Wählen Sie ein Startdatum aus',
            'Überprüfen Sie alle Aufgaben und deren Reihenfolge',
            'Klicken Sie auf "Projekt starten"'
          ],
          warnings: [
            'Nach dem Start können keine neuen Aufgaben mehr hinzugefügt werden',
            'Das Startdatum kann nach Projektstart nicht mehr geändert werden',
            'Die Aufgabenreihenfolge ist nach dem Start fixiert'
          ]
        }
      ]
    },
    {
      title: 'Subunternehmer verwalten',
      icon: Users,
      description: 'Verwalten Sie hier alle beteiligten Subunternehmer und deren Kontaktdaten.',
      subsections: [
        {
          title: 'Funktionen',
          content: [
            'Neue Subunternehmer hinzufügen',
            'Kontaktdaten bearbeiten',
            'Subunternehmer entfernen'
          ]
        },
        {
          title: 'Erforderliche Daten',
          content: [
            'Gewerkschaft: Art der ausgeführten Arbeiten',
            'Ansprechpartner: Name des Verantwortlichen',
            'E-Mail: Kontakt-E-Mail für Benachrichtigungen'
          ],
          notes: [
            'Alle Felder müssen ausgefüllt werden',
            'E-Mail-Adressen werden für automatische Benachrichtigungen verwendet'
          ]
        }
      ]
    },
    {
      title: 'Verzögerung melden',
      icon: AlertTriangle,
      description: 'Melden Sie hier Verzögerungen bei Aufgaben und deren Auswirkungen.',
      subsections: [
        {
          title: 'Prozess',
          steps: [
            'Wählen Sie die betroffene Aufgabe aus',
            'Geben Sie den Grund der Verzögerung an',
            'Legen Sie die Dauer der Verzögerung fest'
          ]
        },
        {
          title: 'Auswirkungen',
          content: [
            'Automatische Neuberechnung des Zeitplans',
            'Benachrichtigung betroffener Subunternehmer',
            'Aktualisierung der Timeline-Ansicht'
          ],
          warnings: [
            'Verzögerungen können Auswirkungen auf abhängige Aufgaben haben',
            'Alle betroffenen Subunternehmer werden automatisch informiert'
          ]
        }
      ]
    },
    {
      title: 'Aufgabe verschieben',
      icon: MoveHorizontal,
      description: 'Verschieben Sie geplante Aufgaben im Zeitplan.',
      subsections: [
        {
          title: 'Vorgehensweise',
          steps: [
            'Wählen Sie die zu verschiebende Aufgabe',
            'Geben Sie den Grund der Verschiebung an',
            'Legen Sie die Anzahl der Tage fest'
          ]
        },
        {
          title: 'Wichtige Hinweise',
          notes: [
            'Berücksichtigt automatisch alle Abhängigkeiten',
            'Passt den Gesamtzeitplan entsprechend an'
          ],
          warnings: [
            'Kann Auswirkungen auf nachfolgende Aufgaben haben',
            'Beachten Sie mögliche Verzögerungen im Gesamtprojekt'
          ]
        }
      ]
    },
    {
      title: 'Nachricht senden',
      icon: Send,
      description: 'Kommunizieren Sie direkt mit den Subunternehmern.',
      subsections: [
        {
          title: 'Funktionen',
          content: [
            'Direkte Kommunikation mit Subunternehmern',
            'Automatische E-Mail-Benachrichtigungen',
            'Nachrichtenverlauf einsehbar'
          ]
        },
        {
          title: 'Vorgehensweise',
          steps: [
            'Wählen Sie den Subunternehmer aus',
            'Geben Sie Betreff und Nachricht ein',
            'Senden Sie die Nachricht'
          ],
          notes: [
            'Nachrichten werden automatisch archiviert',
            'Status der Nachricht wird angezeigt'
          ]
        }
      ]
    },
    {
      title: 'Projekt exportieren',
      icon: FileDown,
      description: 'Exportieren Sie alle Projektdaten als PDF-Dokument.',
      subsections: [
        {
          title: 'Enthaltene Daten',
          content: [
            'Projektübersicht und Statistiken',
            'Detaillierte Aufgabenliste mit Status',
            'Zeitplan und Abhängigkeiten',
            'Subunternehmer-Kontakte'
          ]
        },
        {
          title: 'Export-Optionen',
          content: [
            'Vollständiger Projektbericht',
            'Aktuelle Projektsituation',
            'Verzögerungsübersicht'
          ],
          notes: [
            'PDF-Format für einfache Weitergabe',
            'Enthält alle wichtigen Projektinformationen'
          ]
        }
      ]
    },
    {
      title: 'Fehlerbehebung',
      icon: AlertTriangle,
      description: 'Hilfe bei häufigen Fehlermeldungen und deren Behebung.',
      subsections: [
        {
          title: 'Projekt konnte nicht gestartet werden',
          content: [
            'Diese Meldung erscheint, wenn es technische Probleme beim Starten des Projekts gab'
          ],
          steps: [
            'Klicken Sie auf den "Projekt löschen" Button in der Fehlermeldung',
            'Kehren Sie zur Aufgabenübersicht zurück',
            'Klicken Sie erneut auf "Projekt starten"'
          ],
          notes: [
            'Ihre Aufgaben und deren Reihenfolge bleiben erhalten',
            'Das Projekt wird nur aus der Datenbank entfernt und kann neu gestartet werden'
          ]
        },
        {
          title: 'Benachrichtigung konnte nicht gesendet werden',
          content: [
            'Diese Meldung erscheint im Workflow-Monitor, wenn eine E-Mail nicht zugestellt werden konnte'
          ],
          steps: [
            'Prüfen Sie die E-Mail-Adresse des Empfängers',
            'Klicken Sie auf "Erneut senden" in der Fehlermeldung',
            'Warten Sie bis der neue Sendeversuch abgeschlossen ist'
          ],
          notes: [
            'Sie können die Nachricht auch archivieren und eine neue senden',
            'Fehlgeschlagene Nachrichten werden im System gespeichert'
          ]
        },
        {
          title: 'Workflow-Status Fehler',
          content: [
            'Fehler im Workflow-Monitor zeigen Probleme bei automatischen Prozessen an'
          ],
          steps: [
            'Prüfen Sie die Details in der Fehlermeldung',
            'Klicken Sie auf "Erneut senden" in der Fehlermeldung'
          ],
          notes: [
            'Die meisten Workflow-Fehler beeinflussen nicht die Projektfunktionalität',
            'Archivierte Fehlermeldungen können über den Filter wieder angezeigt werden'
          ]
        },
        {
          title: 'Projekt-Fehler',
          content: [
            'Kritische Fehler, die das gesamte Projekt betreffen'
          ],
          steps: [
            'Lesen Sie die Fehlermeldung sorgfältig',
            'Folgen Sie den angezeigten Anweisungen',
            'Bei "Projekt konnte nicht gestartet werden": Projekt löschen und neu starten',
            'Bei anderen Fehlern: Prüfen Sie die Projekteinstellungen'
          ],
          warnings: [
            'Ignorieren Sie keine kritischen Projekt-Fehler',
            'Sichern Sie wichtige Daten bevor Sie ein Projekt löschen',
            'Kontaktieren Sie den Support bei wiederkehrenden Problemen'
          ]
        }
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-[9999] flex items-center justify-center w-12 h-12"
        aria-label="Hilfe anzeigen"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000] overflow-hidden">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <HelpCircle className="w-6 h-6 mr-2 text-blue-600" />
                Hilfe & Anleitung
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6">
                {sections.map((section) => (
                  <div
                    key={section.title}
                    className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <section.icon className="w-5 h-5 text-blue-600 mr-3" />
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {section.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      {expandedSections.includes(section.title) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.includes(section.title) && (
                      <div className="p-4 border-t border-gray-200">
                        {section.subsections.map((subsection, index) => (
                          <div 
                            key={index}
                            className="mb-4 last:mb-0"
                          >
                            <h4 className="font-medium text-gray-900 mb-2">
                              {subsection.title}
                            </h4>
                            
                            {subsection.content && (
                              <ul className="list-disc list-inside mb-3 space-y-1">
                                {subsection.content.map((item, i) => (
                                  <li key={i} className="text-gray-600 text-sm">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {subsection.steps && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Schritte:
                                </p>
                                <ol className="list-decimal list-inside space-y-1">
                                  {subsection.steps.map((step, i) => (
                                    <li key={i} className="text-gray-600 text-sm">
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {subsection.notes && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Hinweise:
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                  {subsection.notes.map((note, i) => (
                                    <li key={i} className="text-gray-600 text-sm">
                                      {note}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {subsection.warnings && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-red-700 mb-2">
                                  Wichtig zu beachten:
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                  {subsection.warnings.map((warning, i) => (
                                    <li key={i} className="text-red-600 text-sm">
                                      {warning}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <p className="text-sm text-gray-500 text-center">
                Klicken Sie auf den blauen Hilfe-Button in der unteren linken Ecke, 
                um diese Anleitung jederzeit wieder aufzurufen.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
