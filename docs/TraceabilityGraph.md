# Traceability Graph Feature

## Overview

The Traceability Graph provides a comprehensive visual representation of all relationships and dependencies between TARA (Threat Analysis and Risk Assessment) artifacts in a project. This read-only view helps users understand and interpret the complete TARA workflow.

## Features

### Visual Representation

- **Interactive Graph**: Built with React Flow for smooth panning, zooming, and navigation
- **Multiple Layout Algorithms**: Choose from hierarchical, grid, radial, or force-directed layouts
- **Color-Coded Nodes**: Each artifact type has a distinct color for easy identification
- **Relationship Edges**: Connections show dependencies and relationships between artifacts
- **Auto-Layout**: Automatically arrange nodes based on selected layout algorithm

### Layout Options

The traceability graph supports four different layout algorithms:

1. **Hierarchical Layout** (Default) 📊
   - Organizes artifacts in logical layers from top to bottom
   - Best for understanding the flow from requirements to implementation
   - Shows clear dependency chains
   - Layer-based vertical arrangement

2. **Grid Layout** ⊞
   - Arranges all nodes in an evenly-spaced grid
   - Useful for comparing artifacts side-by-side
   - Provides uniform spacing and alignment
   - Good for presentations with many artifacts

3. **Radial Layout** ◉
   - Arranges nodes in a circular pattern
   - Emphasizes relationships over hierarchy
   - Good for identifying clusters and patterns
   - Useful for smaller graphs

4. **Force-Directed Layout** ⚡
   - Uses physics simulation to position nodes
   - Nodes repel each other while edges pull connected nodes together
   - Creates organic, balanced layouts
   - Best for understanding complex relationship networks

### Artifact Types Displayed

1. **TOE Configuration** (Gray) - Target of Evaluation configurations
2. **Assumptions** (Yellow/Amber) - Project assumptions
3. **Assets** (Dark Gray) - System assets being protected
4. **Damage Scenarios** (Red) - Potential damage outcomes
5. **Threats** (Orange/Coral) - Identified threats
6. **Threat Scenarios** (Light Orange) - Specific threat instances
7. **Attack Trees** (Red) - Attack path visualizations
8. **Circumvent Trees** (Teal) - Security control bypass paths
9. **Misuse Cases** (Deep Orange) - System misuse scenarios
10. **Security Controls** (Purple) - Implemented security measures
11. **Security Goals** (Green) - High-level security objectives
12. **Security Claims** (Blue) - Security assurance statements

### Graph Layers

The graph is organized in hierarchical layers:

```
Layer 1:  TOE Configurations & Assumptions
Layer 2:  Assets
Layer 3:  Misuse Cases
Layer 4:  Damage Scenarios
Layer 5:  Threats
Layer 6:  Threat Scenarios
Layer 7:  Attack Trees
Layer 8:  Circumvent Trees
Layer 9:  Security Controls
Layer 10: Security Goals
Layer 11: Security Claims
```

### Relationship Types

#### Direct Dependencies

- **TOE Config → Asset**: Assets linked to configurations (solid gray edge)
- **Asset → Misuse Case**: Misuse cases targeting assets (solid orange edge)
- **Asset → Threat**: Threats targeting assets (solid coral edge)
- **Threat → Damage Scenario**: Threats linked to damage scenarios (solid red edge)
- **Threat → Threat Scenario**: Threat scenarios realizing threats (solid light orange edge)
- **Security Goal → Security Control**: Controls implementing goals (solid green edge)
- **Security Control → Circumvent Tree**: Circumvent paths for controls (solid teal edge)
- **Assumption → Security Claim**: Claims based on assumptions (solid blue edge)

#### Treatment Relationships (Animated/Dashed)

- **Threat Scenario → Security Goal**: Risk reduction treatment (animated dashed green)
- **Threat Scenario → Security Claim**: Risk transfer/acceptance treatment (animated dashed blue)
- **Threat Scenario → Damage Scenario**: Scenario impacts (dashed red)
- **Threat → Misuse Case**: Related misuse cases (dashed orange)
- **Attack Tree → Threat**: Attack tree for threat (dashed red)

### Filter Options

The graph provides several filtering options to focus on specific aspects of the TARA:

1. **All Artifacts** - Shows the complete traceability graph
2. **Threat Chain** - Focuses on threat-related artifacts (assets, threats, threat scenarios, attack trees, misuse cases)
3. **Security Chain** - Shows security measures (security controls, goals, claims, assumptions)
4. **Asset Dependencies** - Displays asset-related connections (TOE configurations, assets, threats, misuse cases)
5. **TOE Configuration Filter** - Select specific TOE configurations to show only artifacts related to them
   - Click TOE configuration buttons to toggle selection
   - Multiple TOE configurations can be selected simultaneously
   - Shows all artifacts in the dependency chain starting from selected TOE configurations
   - "Clear" button resets the filter

Filters can be combined with layout options for optimal visualization.

## User Interface

### Layout Selection

Located in the header under "Layout:", four buttons allow switching between different layout algorithms:

- **Hierarchical** (📊): Layer-based top-to-bottom layout
- **Grid** (⊞): Uniform grid arrangement
- **Radial** (◉): Circular arrangement
- **Force** (⚡): Physics-based dynamic layout

Simply click a layout button to instantly rearrange the graph. The current layout is highlighted.

### Filter Controls

Located in the header under "Filter:", these buttons allow quick filtering of the graph view:

- **All Artifacts**: Show complete traceability
- **Threat Chain**: Show threat-related artifacts only
- **Security Chain**: Show security treatment artifacts only
- **Asset Dependencies**: Show asset relationships only

### TOE Configuration Filter

Below the filter controls, you can select specific TOE (Target of Evaluation) configurations:

- **TOE Configuration Buttons**: Click to toggle selection of specific TOE configurations
- **Multiple Selection**: Select multiple TOE configurations to see artifacts related to any of them
- **Connected Artifacts**: Shows all artifacts in the dependency chain starting from selected TOE configurations
- **Clear Button**: Appears when TOE configurations are selected; click to reset the filter
- **Selection Counter**: Displays the number of currently selected TOE configurations

This filter works in combination with other filters and layouts to provide focused views of specific TOE configurations.

### Navigation Controls

- **Pan**: Click and drag the background to move the view
- **Zoom**: Use mouse wheel or zoom controls (bottom-left)
- **Fit View**: Double-click background or use fit button to see all nodes
- **Mini-Map**: Overview of the entire graph (bottom-right)

### Legend

The legend (top-right panel) shows all artifact types with their corresponding colors.

## Use Cases

1. **Understanding TARA Flow**: Use hierarchical layout to see how threats flow from assets through scenarios to risk treatment
2. **Tracing Requirements**: Follow security goals back through their dependencies using hierarchical layout
3. **Impact Analysis**: Use force-directed layout to identify what artifacts depend on a specific component
4. **Completeness Check**: Use grid or radial layout to verify that all artifacts are properly connected
5. **TOE-Specific Analysis**: Select specific TOE configurations to analyze only relevant artifacts for that configuration
6. **Configuration Comparison**: Toggle between different TOE configurations to compare their security impact
7. **Documentation**: Switch between layouts to find the best visualization for documentation
8. **Communication**: Use different layouts to explain TARA methodology to different stakeholders
9. **Pattern Recognition**: Use force-directed or radial layouts to identify clusters and relationship patterns
10. **Presentation**: Use grid layout for clean, uniform presentations

## Technical Implementation

### Technology Stack

- **React Flow**: Graph visualization library
- **TypeScript**: Type-safe implementation
- **React Hooks**: State management (useState, useMemo, useEffect)
- **Tailwind CSS**: Styling

### Architecture

- **TraceabilityGraphView.tsx**: Main component
- **ArtifactNode**: Custom node component for artifacts
- **Graph Generation**: Automated layout based on project data
- **Layout Algorithms**: Four different layout algorithms (hierarchical, grid, radial, force-directed)
- **Filtering**: Dynamic node/edge filtering based on user selection
- **Auto-Layout**: Automatic node positioning with layout switching

### Layout Algorithms Implementation

1. **Hierarchical**: Pre-calculated during graph generation, organized in layers
2. **Grid**: Mathematical grid positioning based on node count
3. **Radial**: Circular arrangement using trigonometric calculations
4. **Force-Directed**: Physics simulation with node repulsion forces (50 iterations)

### Performance Considerations

- **Memoization**: Graph generation is memoized to prevent unnecessary recalculations
- **Efficient Updates**: Only affected nodes/edges are re-rendered
- **Layout Caching**: Layout calculations are optimized for smooth transitions
- **Large Datasets**: Tested with projects containing 100+ artifacts
- **Force Simulation**: Optimized with limited iterations for real-time performance

## Future Enhancements

Potential improvements for future versions:

1. **Search/Highlight**: Search for specific artifacts and highlight them
2. **Export**: Export graph as PNG/SVG image with current layout
3. **Layout Persistence**: Remember user's preferred layout
4. **Animated Transitions**: Smooth transitions when switching layouts
5. **Custom Layout Parameters**: Adjust spacing, forces, and other layout parameters
6. **Artifact Details**: Click nodes to see detailed information
7. **Path Highlighting**: Highlight all paths between two selected nodes
8. **Temporal View**: Show how the graph evolved over time
9. **Risk Overlay**: Color nodes by risk level
10. **Completeness Indicators**: Highlight incomplete or missing connections
11. **Subgraph Layouts**: Apply different layouts to filtered subgraphs

## Accessibility

- Keyboard navigation support
- Screen reader friendly (ARIA labels)
- High contrast color scheme compatible with VS Code dark theme
- Zoom functionality for visual clarity

## Internationalization

The feature supports all languages available in TARA Fusion:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)

Translation keys:

- `traceabilityGraphTitle`: View title
- `traceabilityGraphInfo`: Description text
- `traceabilityGraph`: Sidebar menu item
