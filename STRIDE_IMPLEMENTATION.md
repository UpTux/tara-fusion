# STRIDE Project Type Implementation

## Overview

This implementation adds support for the STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) threat modeling methodology as a new project type in TARA Fusion.

## Features

### 1. STRIDE Methodology Selection
- Users can now select STRIDE as a methodology when creating a new project
- Previously disabled "Coming Soon" option is now fully functional
- Located in the Create Project modal

### 2. Dynamic View Filtering
- Project views automatically adapt based on the selected methodology
- **For STRIDE projects**: Attack tree-related views are hidden:
  - Attack Trees
  - Technical Attack Trees
  - Circumvent Trees
  - Attack Leaves
- **For Attack Feasibility projects**: All views remain visible (default behavior)

### 3. STRIDE Threat Categories
New `StrideCategory` enum added with the 6 STRIDE categories:
- **Spoofing**: Identity-related threats
- **Tampering**: Data integrity threats
- **Repudiation**: Non-repudiation threats
- **Information Disclosure**: Confidentiality threats
- **Denial of Service**: Availability threats
- **Elevation of Privilege**: Authorization threats

### 4. Enhanced Threat Model
- `Threat` interface now includes optional `strideCategory` field
- Allows categorization of threats according to STRIDE methodology
- Field is optional to maintain backward compatibility

## Technical Changes

### Modified Files

1. **src/types.ts**
   - Added `StrideCategory` enum
   - Added `strideCategory` field to `Threat` interface
   - Added `getProjectViewsForMethodology()` helper function
   - Exported view filtering logic

2. **src/components/modals/CreateProjectModal.tsx**
   - Enabled STRIDE methodology selection
   - Removed "Coming Soon" badge
   - Made STRIDE option clickable and selectable

3. **src/components/ProjectSidebar.tsx**
   - Added `methodology` prop
   - Uses `getProjectViewsForMethodology()` to filter views
   - Dynamically renders only applicable views

4. **src/components/ProjectView.tsx**
   - Passes `project.methodology` to `ProjectSidebar`
   - Maintains view state management

5. **Test Files**
   - Fixed all test projects to include `methodology` field
   - Added comprehensive test suite in `src/types.test.ts`
   - 5 new tests specifically for view filtering logic

### New Files

- **src/types.test.ts**: Test suite for view filtering functionality

## Usage

### Creating a STRIDE Project

1. Click "Create New Project" button
2. Enter project name
3. Select "STRIDE" methodology card
4. Click "Create Project"

The project will be created with STRIDE methodology, and attack tree views will be automatically hidden from the sidebar.

### Working with STRIDE Categories

When creating threats in a STRIDE project, you can optionally assign a STRIDE category:

```typescript
const threat: Threat = {
  id: 'THR-001',
  name: 'Authentication Bypass',
  assetId: 'ASSET-001',
  securityProperty: SecurityProperty.AUTHENTICITY,
  strideCategory: StrideCategory.SPOOFING,  // Optional STRIDE categorization
  // ... other fields
};
```

## Testing

All existing tests pass (276/276), including:
- Unit tests for view filtering
- Integration tests for components
- Type checking
- Build process

### Running Tests

```bash
cd src
npm test
```

### Type Checking

```bash
cd src
npm run type-check
```

### Build

```bash
cd src
npm run build
```

## Design Decisions

1. **Optional STRIDE Category**: Made `strideCategory` optional in `Threat` interface to:
   - Maintain backward compatibility with existing projects
   - Allow gradual adoption of STRIDE categorization
   - Support both Attack Feasibility and STRIDE methodologies in the same codebase

2. **View Filtering at Runtime**: Implemented view filtering dynamically based on methodology rather than:
   - Creating separate components for each methodology
   - Hardcoding view lists
   - This approach is more maintainable and extensible

3. **No Attack Trees for STRIDE**: Following the requirement that "Attack trees shall not be supported for the stride/dread project type"
   - Attack tree views are completely hidden for STRIDE projects
   - Existing attack tree data is preserved but not accessible in UI
   - This aligns with STRIDE methodology which focuses on threat categorization rather than attack path analysis

## Future Enhancements

Potential future improvements:
1. STRIDE-specific threat templates
2. Automated threat suggestion based on STRIDE categories
3. STRIDE-specific reporting and documentation
4. Integration with DREAD (Damage, Reproducibility, Exploitability, Affected Users, Discoverability) risk rating
5. STRIDE category filtering in threat views
6. Visual STRIDE matrix/checklist

## References

- STRIDE methodology: Microsoft's threat modeling approach
- Threagile: https://github.com/Threagile/threagile
- OWASP Threat Modeling: https://owasp.org/www-community/Threat_Modeling_Process
