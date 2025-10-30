import { AttackerType, AttackPotentialTuple } from '../types';

export const attackerTypePresets: Record<AttackerType, Partial<AttackPotentialTuple>> = {
    [AttackerType.NONE]: {},
    [AttackerType.EXPERT]: {
        expertise: 6,
        knowledge: 3,
        equipment: 4,
    },
    [AttackerType.ADVANCED]: {
        expertise: 6,
        knowledge: 0,
        equipment: 4,
    },
    [AttackerType.PRO_WORKSHOP]: {
        expertise: 3,
        knowledge: 3,
        equipment: 4,
    },
    [AttackerType.LOCAL_LAYMAN]: {
        expertise: 0,
        knowledge: 0,
        equipment: 4,
    },
    [AttackerType.REMOTE_SCRIPT_KIDDY]: {
        expertise: 0,
        knowledge: 0,
        equipment: 0,
    },
};
