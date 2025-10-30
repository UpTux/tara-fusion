
import { Project, Threat } from '../types';

export function exportProjectToJson(project: Project): string {
    const projectToExport = JSON.parse(JSON.stringify(project));

    // Remove calculated fields from threats to keep the export clean
    if (projectToExport.threats) {
        projectToExport.threats.forEach((threat: any) => {
            delete threat.initialAFR;
            delete threat.residualAFR;
        });
    }
    
    return JSON.stringify(projectToExport, null, 2);
}

export function parseProjectJson(jsonString: string): Omit<Project, 'id' | 'organizationId'> {
    const parsed = JSON.parse(jsonString);

    // Basic validation to ensure it looks like a project file
    if (!parsed.name || !parsed.needs) {
        throw new Error('Invalid project JSON file. Missing required fields like "name" or "needs".');
    }
    
    // The imported project shouldn't dictate its own ID or organization.
    // The App component will assign new ones to prevent conflicts.
    const { id: _id, organizationId: _organizationId, ...projectData } = parsed;

    return projectData;
}
