
import { Project, SphinxNeed } from '../types';

interface NeedsJson {
  version: string;
  current_version: string;
  needs: {
    [key: string]: SphinxNeed;
  };
}

export function exportToNeedsJson(project: Project): string {
  // FIX: The original implementation with destructuring rest syntax (`...restOfNeed`) failed type inference
  // due to the index signature on SphinxNeed. This led to an incorrect type for `needsObject`.
  // The new implementation copies the object and deletes the 'position' property, which is more robust
  // and results in the correctly typed `needsObject`.
  const needsObject = project.needs.reduce((acc, need) => {
    // Sphinx-needs format expects the need object itself, keyed by its ID.
    // We remove the position property as it's not part of the sphinx-needs schema.
    const needToStore = { ...need };
    delete needToStore.position;
    acc[need.id] = needToStore;
    return acc;
  }, {} as { [key: string]: SphinxNeed });

  const needsJson: NeedsJson = {
    version: '1.0',
    current_version: project.name, // Using project name as current_version
    needs: needsObject,
  };

  return JSON.stringify(needsJson, null, 2);
}


export function importFromNeedsJson(jsonString: string, currentProject: Project): Project {
  const parsed: NeedsJson = JSON.parse(jsonString);

  if (!parsed.version || !parsed.needs) {
    throw new Error('Invalid needs.json format.');
  }

  const needs: SphinxNeed[] = Object.values(parsed.needs).map((need, index) => ({
    ...need,
    // Add a default position for imported needs for graphical layout
    position: { x: (index % 5) * 200, y: Math.floor(index / 5) * 120 },
  }));

  // We merge the imported needs into the existing project.
  // A more robust implementation might handle ID conflicts.
  const existingNeedIds = new Set(currentProject.needs.map(n => n.id));
  const newNeeds = needs.filter(n => !existingNeedIds.has(n.id));

  return {
    ...currentProject,
    needs: [...currentProject.needs, ...newNeeds],
  };
}