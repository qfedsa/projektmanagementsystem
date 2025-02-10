import type { WebhookTask } from '../types';

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/1uhguqlswe8machae1i201kal3hg3h3c';

interface ProjectData {
  project_id: string;
  start_date: string;
  tasks: WebhookTask[];
}

export async function triggerProjectWebhook(projectData: ProjectData): Promise<void> {
  try {
    // Validiere die Eingabedaten
    if (!projectData.project_id || !projectData.start_date || !projectData.tasks.length) {
      throw new Error('Ungültige Webhook-Daten: Fehlende Pflichtfelder');
    }

    // Validiere das Format der Tasks
    for (const task of projectData.tasks) {
      if (!task.id || !task.task_name || task.duration <= 0) {
        throw new Error(`Ungültige Task-Daten: ${task.task_name || 'Unbekannte Aufgabe'}`);
      }
    }

    // Erstelle eine Map für Task-Namen zu Task-IDs
    const taskNameToId = new Map(
      projectData.tasks.map(task => [task.task_name, task.id])
    );

    // Formatiere die Daten mit korrekten Dependencies
    const formattedData = {
      ...projectData,
      tasks: projectData.tasks.map(task => {
        let dependencies: string[] = [];
        
        if (task.dependencies) {
          dependencies = (typeof task.dependencies === 'string' 
            ? task.dependencies.split(',').map(d => d.trim())
            : task.dependencies)
            .map(depName => {
              const depId = taskNameToId.get(depName);
              if (!depId) {
                console.warn(`Abhängigkeit nicht gefunden: ${depName}`);
              }
              return depId;
            })
            .filter((id): id is string => Boolean(id));
        }

        return {
          task_id: task.id,
          task_name: task.task_name,
          duration: task.duration,
          responsible_party: task.responsible_party,
          dependencies,
          position: task.position
        };
      })
    };

    console.log('Sende Webhook-Daten:', JSON.stringify(formattedData, null, 2));

    // Sende die Daten an den Webhook mit Timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 Sekunden Timeout

    try {
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook Error Response:', errorText);
        throw new Error(`Webhook-Fehler: ${response.status} - ${errorText}`);
      }

      // Warte auf die Antwort
      const result = await response.text();
      if (result) {
        console.log('Webhook erfolgreich:', result);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Webhook-Timeout: Der Server antwortet nicht');
      }
      throw error;
    }
  } catch (error) {
    console.error('Fehler beim Webhook-Aufruf:', error);
    throw error;
  }
}
