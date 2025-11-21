import { AttackPotentialTuple, NeedType, SphinxNeed, ToeConfiguration } from '../types';
import { calculateAP } from './riskService';

type NeedsMap = Map<string, SphinxNeed>;

// Helper to combine two tuples by taking the MAX of each field (AND logic)
function combineTuplesMax(t1: AttackPotentialTuple, t2: AttackPotentialTuple): AttackPotentialTuple {
  return {
    time: Math.max(t1.time, t2.time),
    expertise: Math.max(t1.expertise, t2.expertise),
    knowledge: Math.max(t1.knowledge, t2.knowledge),
    access: Math.max(t1.access, t2.access),
    equipment: Math.max(t1.equipment, t2.equipment),
  };
}

interface NodeMetricsResult {
  ap: number;
  tuple: AttackPotentialTuple;
  criticalPaths: string[][]; // List of paths (each path is a list of node IDs)
}

function calculateNodeMetricsBottomUp(
  nodeId: string,
  needsMap: NeedsMap,
  memo: Map<string, NodeMetricsResult | null>,
  activeToeConfigs: Set<string>,
  visiting: Set<string> // To detect cycles
): NodeMetricsResult | null {
  // Cycle detection
  if (visiting.has(nodeId)) {
    return null; // Treat cycle as invalid path
  }

  // Memoization
  if (memo.has(nodeId)) {
    return memo.get(nodeId) || null;
  }

  const node = needsMap.get(nodeId);
  if (!node) return null;

  // Check if node is deactivated by TOE configuration
  if (node.toeConfigurationIds && node.toeConfigurationIds.length > 0) {
    const isInactive = node.toeConfigurationIds.some(id => !activeToeConfigs.has(id));
    if (isInactive) {
      memo.set(nodeId, null);
      return null;
    }
  }

  visiting.add(nodeId);

  // Base case: Leaf node
  const isLeaf = node.type === NeedType.ATTACK && !node.logic_gate && !node.tags.includes('attack-root');
  if (isLeaf) {
    const tuple = node.attackPotential || { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 };
    const ap = calculateAP(tuple);
    const result: NodeMetricsResult = {
      ap,
      tuple,
      criticalPaths: [[nodeId]]
    };
    visiting.delete(nodeId);
    memo.set(nodeId, result);
    return result;
  }

  // If not a leaf but has no links, treat as invalid/incomplete branch
  if (!node.links || node.links.length === 0) {
    // Exception: If it's an attack-root with no children, it might be treated as a leaf if it has AP?
    // But typically roots aggregate children. If a root has no children, it has no AP from children.
    // Existing logic returned empty paths.
    visiting.delete(nodeId);
    memo.set(nodeId, null);
    return null;
  }

  // Recursive step
  const childResults: (NodeMetricsResult | null)[] = node.links.map(childId =>
    calculateNodeMetricsBottomUp(childId, needsMap, memo, activeToeConfigs, visiting)
  );

  // Filter out null results (pruned branches)
  // If a child is null, it means that branch is invalid.
  // For AND gate: If ANY child is invalid, the AND gate is invalid.
  // For OR gate: If ALL children are invalid, the OR gate is invalid.

  let result: NodeMetricsResult | null = null;

  // Default to AND if not specified (e.g. root node)
  const logic = node.logic_gate || 'AND';

  if (logic === 'OR') {
    // OR Logic: Component-wise Min of valid children
    const validChildren = childResults.filter((r): r is NodeMetricsResult => r !== null);

    if (validChildren.length === 0) {
      result = null;
    } else {
      // Calculate component-wise minimum tuple
      const minTuple: AttackPotentialTuple = {
        time: Infinity,
        expertise: Infinity,
        knowledge: Infinity,
        access: Infinity,
        equipment: Infinity
      };

      for (const child of validChildren) {
        minTuple.time = Math.min(minTuple.time, child.tuple.time);
        minTuple.expertise = Math.min(minTuple.expertise, child.tuple.expertise);
        minTuple.knowledge = Math.min(minTuple.knowledge, child.tuple.knowledge);
        minTuple.access = Math.min(minTuple.access, child.tuple.access);
        minTuple.equipment = Math.min(minTuple.equipment, child.tuple.equipment);
      }

      const ap = calculateAP(minTuple);

      // For critical paths, we still want to highlight the "easiest" path(s) in terms of total AP sum.
      // Even though the parent AP is a mix, the attacker likely follows one path or another in reality,
      // or we just need to show *some* path.
      // Let's find the child with the minimum AP sum.
      let minChildAP = Infinity;
      for (const child of validChildren) {
        if (child.ap < minChildAP) {
          minChildAP = child.ap;
        }
      }

      const minChildren = validChildren.filter(c => c.ap === minChildAP);

      const combinedCriticalPaths: string[][] = [];
      for (const child of minChildren) {
        for (const path of child.criticalPaths) {
          combinedCriticalPaths.push([nodeId, ...path]);
        }
      }

      result = {
        ap,
        tuple: minTuple,
        criticalPaths: combinedCriticalPaths
      };
    }
  } else {
    // AND Logic: Max tuple of ALL children
    // If any child is invalid (null), the AND gate cannot be satisfied.
    if (childResults.some(r => r === null)) {
      result = null;
    } else {
      const validChildren = childResults as NodeMetricsResult[];

      // Combine tuples: Max of each field
      const combinedTuple = validChildren.reduce((acc, curr) => combineTuplesMax(acc, curr.tuple), {
        time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0
      });

      const ap = calculateAP(combinedTuple);

      // Combine critical paths: Cartesian product of all children's critical paths
      // Because ALL children must be attacked.
      let combinedPaths: string[][] = [[]];
      for (const child of validChildren) {
        const newCombinedPaths: string[][] = [];
        for (const existingPath of combinedPaths) {
          for (const childPath of child.criticalPaths) {
            newCombinedPaths.push([...existingPath, ...childPath]);
          }
        }
        combinedPaths = newCombinedPaths;
      }

      // Add current node to all paths
      const finalPaths = combinedPaths.map(path => [nodeId, ...path]);

      result = {
        ap,
        tuple: combinedTuple,
        criticalPaths: finalPaths
      };
    }
  }

  visiting.delete(nodeId);
  memo.set(nodeId, result);
  return result;
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
  const memo = new Map<string, NodeMetricsResult | null>();
  const visiting = new Set<string>();

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

  const result = calculateNodeMetricsBottomUp(rootId, filteredNeedsMap, memo, activeToeConfigs, visiting);

  if (!result) {
    return null;
  }

  return {
    attackPotential: result.ap,
    criticalPaths: result.criticalPaths,
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

export function traceCriticalPaths(rootId: string, criticalPaths: string[][], allNeeds: SphinxNeed[]): Set<string> {
  // The new criticalPaths structure already contains full paths from root to leaves (or vice versa, depending on construction).
  // In calculateNodeMetricsBottomUp, we constructed paths as [nodeId, ...childPath].
  // So they are full paths.
  // We just need to collect all unique nodes from these paths.

  const allCriticalNodes = new Set<string>();

  for (const path of criticalPaths) {
    for (const nodeId of path) {
      allCriticalNodes.add(nodeId);
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
  const memo = new Map<string, NodeMetricsResult | null>();
  const visiting = new Set<string>();

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

  const result = calculateNodeMetricsBottomUp(nodeId, filteredNeedsMap, memo, activeToeConfigs, visiting);

  if (!result) {
    return {
      attackPotential: Infinity,
      attackPotentialTuple: { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 },
      hasSubtree: false
    };
  }

  return {
    attackPotential: result.ap,
    attackPotentialTuple: result.tuple,
    hasSubtree: true
  };
}

/**
 * Detects if adding a link from sourceId to targetId would create a cycle.
 * Returns true if a cycle would be created (i.e., source is reachable from target).
 */
export function detectCycle(sourceId: string, targetId: string, allNeeds: SphinxNeed[]): boolean {
  if (sourceId === targetId) return true;

  const needsMap = new Map(allNeeds.map(n => [n.id, n]));
  const visited = new Set<string>();
  const queue: string[] = [targetId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;

    if (currentId === sourceId) return true;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = needsMap.get(currentId);
    if (node?.links) {
      queue.push(...node.links);
    }
  }

  return false;
}