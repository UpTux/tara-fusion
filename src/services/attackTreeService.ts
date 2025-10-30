import { SphinxNeed, NeedType, AttackPotentialTuple, ToeConfiguration } from '../types';
import { calculateAP } from './riskService';

type NeedsMap = Map<string, SphinxNeed>;

function findAttackPathsRecursive(
  nodeId: string,
  needsMap: NeedsMap,
  memo: Map<string, string[][]>,
  activeToeConfigs: Set<string>
): string[][] {
  if (memo.has(nodeId)) {
    return memo.get(nodeId)!;
  }

  const node = needsMap.get(nodeId);
  if (!node) return [];

  // Check if node is deactivated by TOE configuration
  if (node.toeConfigurationIds && node.toeConfigurationIds.length > 0) {
      const isInactive = node.toeConfigurationIds.some(id => !activeToeConfigs.has(id));
      if (isInactive) {
          memo.set(nodeId, []);
          return []; // Prune this branch
      }
  }

  const isLeaf = node.type === NeedType.ATTACK && !node.logic_gate && !node.tags.includes('attack-root');
  if (isLeaf) {
    return [[nodeId]];
  }

  if (!node.links || node.links.length === 0) {
    return isLeaf ? [[nodeId]] : [];
  }

  if (node.logic_gate === 'OR') {
    const paths = node.links.flatMap(childId => findAttackPathsRecursive(childId, needsMap, memo, activeToeConfigs));
    memo.set(nodeId, paths);
    return paths;
  }

  if (node.logic_gate === 'AND') {
    const childPaths = node.links.map(childId => findAttackPathsRecursive(childId, needsMap, memo, activeToeConfigs));
    
    let combinedPaths: string[][] = [[]];
    for (const paths of childPaths) {
      if (paths.length === 0) continue;
      const newCombinedPaths: string[][] = [];
      for (const combined of combinedPaths) {
        for (const p of paths) {
          newCombinedPaths.push([...combined, ...p]);
        }
      }
      combinedPaths = newCombinedPaths;
    }
    memo.set(nodeId, combinedPaths);
    return combinedPaths;
  }

  // Default for root nodes with one child and no logic gate
  if (node.tags.includes('attack-root') && node.links.length > 0) {
     const paths = node.links.flatMap(childId => findAttackPathsRecursive(childId, needsMap, memo, activeToeConfigs));
     memo.set(nodeId, paths);
     return paths;
  }
  
  return [];
}


function calculateAttackPathAP(pathLeaves: SphinxNeed[]): number {
  if (pathLeaves.length === 0) return Infinity;

  const maxTuple: AttackPotentialTuple = {
    time: 0,
    expertise: 0,
    knowledge: 0,
    access: 0,
    equipment: 0,
  };

  for (const leaf of pathLeaves) {
    if (leaf.attackPotential) {
      maxTuple.time = Math.max(maxTuple.time, leaf.attackPotential.time);
      maxTuple.expertise = Math.max(maxTuple.expertise, leaf.attackPotential.expertise);
      maxTuple.knowledge = Math.max(maxTuple.knowledge, leaf.attackPotential.knowledge);
      maxTuple.access = Math.max(maxTuple.access, leaf.attackPotential.access);
      maxTuple.equipment = Math.max(maxTuple.equipment, leaf.attackPotential.equipment);
    }
  }

  return calculateAP(maxTuple);
}

export function calculateAttackTreeMetrics(rootId: string, allNeeds: SphinxNeed[], toeConfigurations: ToeConfiguration[] = []): { attackPotential: number; criticalPaths: string[][] } | null {
  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const memo = new Map<string, string[][]>();
  
  const activeToeConfigs = new Set(
    (toeConfigurations || []).filter(c => c.active).map(c => c.id)
  );

  const attackPaths = findAttackPathsRecursive(rootId, needsMap, memo, activeToeConfigs);

  if (attackPaths.length === 0) {
    return null;
  }

  let minAP = Infinity;
  const pathDetails: { path: string[], ap: number }[] = [];

  for (const path of attackPaths) {
    const uniqueLeaves = [...new Set(path)]; // Remove duplicate leaves if a node is reached twice
    const leafNodes = uniqueLeaves.map(id => needsMap.get(id)!).filter(Boolean);
    const ap = calculateAttackPathAP(leafNodes);
    minAP = Math.min(minAP, ap);
    pathDetails.push({ path: uniqueLeaves, ap });
  }

  const criticalPaths = pathDetails
    .filter(p => p.ap === minAP)
    .map(p => p.path);

  return {
    attackPotential: minAP,
    criticalPaths: criticalPaths,
  };
}

export function traceCriticalPaths(rootId: string, criticalLeafSets: string[][], allNeeds: SphinxNeed[]): Set<string> {
    const childToParentsMap = new Map<string, string[]>();
    allNeeds.forEach(need => {
        (need.links || []).forEach(link => {
            if (!childToParentsMap.has(link)) {
                childToParentsMap.set(link, []);
            }
            childToParentsMap.get(link)!.push(need.id);
        });
    });

    const allCriticalNodes = new Set<string>();

    for (const leafSet of criticalLeafSets) {
        const queue = [...leafSet];
        const visited = new Set<string>(leafSet);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            allCriticalNodes.add(currentId);

            if (currentId === rootId) continue;
            
            const parents = childToParentsMap.get(currentId) || [];
            for (const parentId of parents) {
                if (!visited.has(parentId)) {
                    visited.add(parentId);
                    queue.push(parentId);
                }
            }
        }
    }
    return allCriticalNodes;
}