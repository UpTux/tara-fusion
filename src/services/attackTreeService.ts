import { AttackPotentialTuple, NeedType, SphinxNeed, ToeConfiguration } from '../types';
import { calculateAP } from './riskService';

type NeedsMap = Map<string, SphinxNeed>;

function findAttackPathsRecursive(
  nodeId: string,
  needsMap: NeedsMap,
  memo: Map<string, string[][]>,
  activeToeConfigs: Set<string>
): string[][] {
  const cached = memo.get(nodeId);
  if (cached) {
    return cached;
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

  // Attack-root nodes without explicit logic gate should default to AND logic
  if (node.tags.includes('attack-root') && node.links.length > 0) {
    // Treat as AND: need to combine paths from all children
    let combinedPaths: string[][] = [[]];
    for (const childId of node.links) {
      const childPaths = findAttackPathsRecursive(childId, needsMap, memo, activeToeConfigs);
      if (childPaths.length === 0) {
        memo.set(nodeId, []);
        return [];
      }
      const newCombinedPaths: string[][] = [];
      for (const existingPath of combinedPaths) {
        for (const childPath of childPaths) {
          newCombinedPaths.push([...existingPath, ...childPath]);
        }
      }
      combinedPaths = newCombinedPaths;
    }
    memo.set(nodeId, combinedPaths);
    return combinedPaths;
  }

  return [];
}


function calculateAttackPathAP(pathLeaves: SphinxNeed[]): number {
  if (pathLeaves.length === 0) return 0;

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

/**
 * Check if a node has any circumvent trees linked to it
 */
export function hasCircumventTrees(nodeId: string, allNeeds: SphinxNeed[]): boolean {
  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const node = needsMap.get(nodeId);

  if (!node || !node.links || node.links.length === 0) {
    return false;
  }

  // Check if any linked child is a circumvent tree root
  return node.links.some(linkId => {
    const linkedNode = needsMap.get(linkId);
    return linkedNode?.tags.includes('circumvent-root');
  });
}

/**
 * Find all nodes that link to a specific circumvent tree root
 */
export function findParentNodesOfCircumventTree(circumventTreeRootId: string, allNeeds: SphinxNeed[]): string[] {
  const parentNodes: string[] = [];

  for (const need of allNeeds) {
    if (need.links && need.links.includes(circumventTreeRootId)) {
      parentNodes.push(need.id);
    }
  }

  return parentNodes;
}

export function calculateAttackTreeMetrics(
  rootId: string,
  allNeeds: SphinxNeed[],
  toeConfigurations: ToeConfiguration[] = [],
  includeCircumventTrees: boolean = false
): { attackPotential: number; criticalPaths: string[][] } | null {
  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const memo = new Map<string, string[][]>();

  const activeToeConfigs = new Set(
    (toeConfigurations || []).filter(c => c.active).map(c => c.id)
  );

  // If not including circumvent trees, filter them out from the needs map
  const filteredNeedsMap = includeCircumventTrees ? needsMap : new Map(
    Array.from(needsMap.entries()).filter(([id, need]) => {
      // Keep all nodes except those in circumvent tree subtrees
      if (need.tags.includes('circumvent-root')) {
        return false;
      }
      // Check if this node is a descendant of a circumvent tree
      const isInCircumventTree = isNodeInCircumventSubtree(id, allNeeds);
      return !isInCircumventTree;
    })
  );

  const attackPaths = findAttackPathsRecursive(rootId, filteredNeedsMap, memo, activeToeConfigs);

  if (attackPaths.length === 0) {
    return null;
  }

  let minAP = Infinity;
  const pathDetails: { path: string[], ap: number }[] = [];

  for (const path of attackPaths) {
    const uniqueLeaves = [...new Set(path)]; // Remove duplicate leaves if a node is reached twice
    const leafNodes = uniqueLeaves.map(id => needsMap.get(id)).filter((node): node is SphinxNeed => node !== undefined);
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

/**
 * Helper function to check if a node is within a circumvent tree subtree
 */
export function isNodeInCircumventSubtree(nodeId: string, allNeeds: SphinxNeed[]): boolean {
  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const visited = new Set<string>();
  const queue: string[] = [];

  // Find all circumvent tree roots
  const circumventRoots = allNeeds.filter(n => n.tags.includes('circumvent-root'));

  // For each circumvent tree root, traverse its subtree
  for (const root of circumventRoots) {
    queue.push(root.id);
    visited.clear();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;

      visited.add(currentId);

      if (currentId === nodeId) {
        return true;
      }

      const currentNode = needsMap.get(currentId);
      if (currentNode?.links) {
        queue.push(...currentNode.links);
      }
    }
  }

  return false;
}

/**
 * Check if a node is part of a technical tree subtree
 */
export function isNodeInTechnicalSubtree(nodeId: string, allNeeds: SphinxNeed[]): boolean {
  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const visited = new Set<string>();
  const queue: string[] = [];

  // Find all technical tree roots
  const technicalRoots = allNeeds.filter(n => n.tags.includes('technical-root'));

  // For each technical tree root, traverse its subtree
  for (const root of technicalRoots) {
    queue.push(root.id);
    visited.clear();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;

      visited.add(currentId);

      if (currentId === nodeId) {
        return true;
      }

      const currentNode = needsMap.get(currentId);
      if (currentNode?.links) {
        queue.push(...currentNode.links);
      }
    }
  }

  return false;
}

/**
 * Find the technical tree root that a node belongs to (if any)
 */
export function findTechnicalTreeRoot(nodeId: string, allNeeds: SphinxNeed[]): SphinxNeed | null {
  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const visited = new Set<string>();
  const queue: string[] = [];

  // Find all technical tree roots
  const technicalRoots = allNeeds.filter(n => n.tags.includes('technical-root'));

  // For each technical tree root, traverse its subtree
  for (const root of technicalRoots) {
    queue.push(root.id);
    visited.clear();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;

      visited.add(currentId);

      if (currentId === nodeId) {
        return root;
      }

      const currentNode = needsMap.get(currentId);
      if (currentNode?.links) {
        queue.push(...currentNode.links);
      }
    }
  }

  return null;
}

/**
 * Find the circumvent tree root that a node belongs to (if any)
 */
export function findCircumventTreeRoot(nodeId: string, allNeeds: SphinxNeed[]): SphinxNeed | null {
  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const visited = new Set<string>();
  const queue: string[] = [];

  // Find all circumvent tree roots
  const circumventRoots = allNeeds.filter(n => n.tags.includes('circumvent-root'));

  // For each circumvent tree root, traverse its subtree
  for (const root of circumventRoots) {
    queue.push(root.id);
    visited.clear();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;

      visited.add(currentId);

      if (currentId === nodeId) {
        return root;
      }

      const currentNode = needsMap.get(currentId);
      if (currentNode?.links) {
        queue.push(...currentNode.links);
      }
    }
  }

  return null;
}

export function traceCriticalPaths(rootId: string, criticalLeafSets: string[][], allNeeds: SphinxNeed[]): Set<string> {
  const childToParentsMap = new Map<string, string[]>();
  allNeeds.forEach(need => {
    (need.links || []).forEach(link => {
      if (!childToParentsMap.has(link)) {
        childToParentsMap.set(link, []);
      }
      const parents = childToParentsMap.get(link);
      if (parents) {
        parents.push(need.id);
      }
    });
  });

  const allCriticalNodes = new Set<string>();

  for (const leafSet of criticalLeafSets) {
    const queue = [...leafSet];
    const visited = new Set<string>(leafSet);

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;
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

/**
 * Calculate attack metrics for a single node (intermediate or root)
 */
export function calculateNodeMetrics(
  nodeId: string,
  allNeeds: SphinxNeed[],
  toeConfigurations: ToeConfiguration[] = [],
  includeCircumventTrees: boolean = false
): {
  attackPotential: number;
  attackPotentialTuple: AttackPotentialTuple;
  hasSubtree: boolean;
} | null {
  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const node = needsMap.get(nodeId);

  if (!node || node.type !== NeedType.ATTACK) {
    return null;
  }

  const activeToeConfigs = new Set(
    (toeConfigurations || []).filter(c => c.active).map(c => c.id)
  );

  // If not including circumvent trees, filter them out from the needs map
  const filteredNeedsMap = includeCircumventTrees ? needsMap : new Map(
    Array.from(needsMap.entries()).filter(([id, need]) => {
      // Keep all nodes except those in circumvent tree subtrees
      if (need.tags.includes('circumvent-root')) {
        return false;
      }
      // Check if this node is a descendant of a circumvent tree
      const isInCircumventTree = isNodeInCircumventSubtree(id, allNeeds);
      return !isInCircumventTree;
    })
  );

  // Check if this node has any attack paths
  const memo = new Map<string, string[][]>();
  const attackPaths = findAttackPathsRecursive(nodeId, filteredNeedsMap, memo, activeToeConfigs);

  if (attackPaths.length === 0) {
    return {
      attackPotential: Infinity,
      attackPotentialTuple: { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 },
      hasSubtree: false
    };
  }

  // Calculate the minimum AP and the corresponding attack potential tuple
  let minAP = Infinity;
  let minAPTuple: AttackPotentialTuple = { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 };

  for (const path of attackPaths) {
    const uniqueLeaves = [...new Set(path)];
    const leafNodes = uniqueLeaves.map(id => needsMap.get(id)).filter((n): n is SphinxNeed => n !== undefined);

    // Calculate the max tuple for this path (AND logic across leaves)
    const pathTuple: AttackPotentialTuple = {
      time: 0,
      expertise: 0,
      knowledge: 0,
      access: 0,
      equipment: 0,
    };

    for (const leaf of leafNodes) {
      if (leaf.attackPotential) {
        pathTuple.time = Math.max(pathTuple.time, leaf.attackPotential.time);
        pathTuple.expertise = Math.max(pathTuple.expertise, leaf.attackPotential.expertise);
        pathTuple.knowledge = Math.max(pathTuple.knowledge, leaf.attackPotential.knowledge);
        pathTuple.access = Math.max(pathTuple.access, leaf.attackPotential.access);
        pathTuple.equipment = Math.max(pathTuple.equipment, leaf.attackPotential.equipment);
      }
    }

    const pathAP = calculateAP(pathTuple);
    if (pathAP < minAP) {
      minAP = pathAP;
      minAPTuple = pathTuple;
    }
  }

  return {
    attackPotential: minAP,
    attackPotentialTuple: minAPTuple,
    hasSubtree: true
  };
}