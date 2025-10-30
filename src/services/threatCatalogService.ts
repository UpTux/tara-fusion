import { SphinxNeed, NeedType, NeedStatus, AttackPotentialTuple } from '../types';

const categoryMap: Record<string, keyof AttackPotentialTuple> = {
    'ET': 'time',
    'SE': 'expertise',
    'KoIC': 'knowledge',
    'WoO': 'access',
    'Eq': 'equipment',
};

const valueMap: Record<keyof AttackPotentialTuple, Record<string, number>> = {
    time: { '0': 0, '1': 1, '2': 4, '3': 10 },
    expertise: { '0': 0, '1': 3, '2': 6, '3': 8 },
    knowledge: { '0': 0, '1': 3, '2': 7, '3': 11 },
    access: { '0': 0, '1': 2, '2': 5, '3': 7, '4': 11 },
    equipment: { '0': 0, '1': 4, '2': 7, '3': 9 },
};


export function importFromThreatCatalogXml(xmlString: string, existingNeeds: SphinxNeed[]): SphinxNeed[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
        throw new Error('Failed to parse XML file.');
    }

    const threatClasses = Array.from(doc.getElementsByTagName('ThreatClass'));
    const existingIds = new Set(existingNeeds.map(n => n.id));
    const newLeaves: SphinxNeed[] = [];

    for (const threat of threatClasses) {
        const name = threat.getAttribute('name');
        const title = threat.getAttribute('title');

        if (!name || !title || existingIds.has(name)) {
            continue;
        }
        
        const feasibilityNode = threat.querySelector('InitialFeasibilityOptions');
        if (!feasibilityNode) {
            continue; // Skip abstract/parent threats
        }

        const attackPotential: AttackPotentialTuple = {
            time: 0,
            expertise: 0,
            knowledge: 0,
            access: 0,
            equipment: 0,
        };

        const ratings = Array.from(feasibilityNode.getElementsByTagName('FeasibilityRating'));
        for (const rating of ratings) {
            const categoryAttr = rating.getAttribute('category');
            const optionAttr = rating.getAttribute('option');

            if (categoryAttr && optionAttr) {
                const categoryKey = categoryAttr.split('/').pop(); // e.g., 'WoO'
                const optionKey = optionAttr.split('/').pop()?.replace(/^[a-zA-Z]+/, ''); // e.g., '0' from 'WoO0'

                if (categoryKey && optionKey && categoryMap[categoryKey]) {
                    const apField = categoryMap[categoryKey];
                    const value = valueMap[apField]?.[optionKey];
                    if (value !== undefined) {
                        attackPotential[apField] = value;
                    }
                }
            }
        }

        const newLeaf: SphinxNeed = {
            id: name,
            title: title,
            type: NeedType.ATTACK,
            description: `Imported from threat catalog.`,
            status: NeedStatus.OPEN,
            tags: ['leaf', 'imported-catalog'],
            links: [],
            attackPotential: attackPotential,
        };
        newLeaves.push(newLeaf);
    }

    return newLeaves;
}
