import React, { useState, useEffect } from 'react';

interface Aufgabe {
  id: string;
  name: string; // Oder eine andere relevante Eigenschaft der Aufgabe
}

const AufgabeVerschieben: React.FC = () => {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [betroffeneAufgabe, setBetroffeneAufgabe] = useState('');
  const [grundDerVerschiebung, setGrundDerVerschiebung] = useState('');
  const [verschiebungInTagen, setVerschiebungInTagen] = useState(0);

  useEffect(() => {
    const fetchAufgaben = async () => {
      const res = await fetch('https://mslignhgrdkuvtzxvqbw.supabase.co/rest/v1/tasks', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbGlnbmhncmRrdXZ0enh2cWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODM1MjYsImV4cCI6MjA1MTI1OTUyNn0.nSgTRbyuBOU5KPK4LQ9Apg_x1JREvbm7iIyuci8BVsk',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbGlnbmhncmRrdXZ0enh2cWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODM1MjYsImV4cCI6MjA1MTI1OTUyNn0.nSgTRbyuBOU5KPK4LQ9Apg_x1JREvbm7iIyuci8BVsk'
        }
      });
      const data = await res.json();
      setAufgaben(data);
    };
    fetchAufgaben();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch('https://hook.eu2.make.com/n4mf3o4fpgm3hkxappybl0di8qchifla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          betroffeneAufgabe,
          grundDerVerschiebung,
          verschiebungInTagen
        })
      });

      if (response.ok) {
        // Erfolg!
        console.log('Aufgabe verschoben!');
        // Optional: Hier kannst du eine Erfolgsmeldung anzeigen oder die Seite neu laden
      } else {
        // Fehlerbehandlung
        console.error('Fehler beim Verschieben der Aufgabe:', response.status);
        // Optional: Hier kannst du eine Fehlermeldung anzeigen
      }
    } catch (error) {
      console.error('Fehler beim Verschieben der Aufgabe:', error);
      // Optional: Hier kannst du eine Fehlermeldung anzeigen
    }
  };

  return (
    <div>
      <h1>Aufgabe verschieben</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="betroffeneAufgabe">Betroffene Aufgabe:</label>
          <select
            id="betroffeneAufgabe"
            value={betroffeneAufgabe}
            onChange={(e) => setBetroffeneAufgabe(e.target.value)}
          >
            <option value="">Bitte wählen...</option>
            {aufgaben.map((aufgabe) => (
              <option key={aufgabe.id} value={aufgabe.id}>
                {aufgabe.name} 
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="grundDerVerschiebung">Grund der Verschiebung:</label>
          <input
            type="text"
            id="grundDerVerschiebung"
            value={grundDerVerschiebung}
            onChange={(e) => setGrundDerVerschiebung(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="verschiebungInTagen">Verschiebung in Tagen:</label>
          <input
            type="number"
            id="verschiebungInTagen"
            value={verschiebungInTagen}
            onChange={(e) => setVerschiebungInTagen(parseInt(e.target.value, 10))}
          />
        </div>
        <button type="submit" style={{ backgroundColor: 'blue', color: 'white' }}>
          Aufgabe verschieben &rarr;
        </button>
      </form>
    </div>
  );
};

export default AufgabeVerschieben;
