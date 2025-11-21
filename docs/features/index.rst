Use-Cases and Features
======================

Core Features
-------------

.. feature:: Visual Attack Tree Editor
   :id: FE_ATTACK_TREE
   :status: implemented
   :tags: attack-tree, visualization, risk-analysis

   Create and visualize attack paths with an intuitive drag-and-drop interface powered by ReactFlow.
   This feature enables security analysts to model complex attack scenarios using hierarchical tree structures
   with AND/OR gate logic, providing automatic attack feasibility calculations based on ISO/SAE 21434.

   Key capabilities:

   * Graphical attack modeling with drag-and-drop nodes
   * AND/OR gate logic for complex attack scenarios
   * Automatic attack potential calculation
   * Attack leaves management for reusable atomic attacks
   * Critical path visualization highlighting easiest attack routes
   * Export attack trees as PNG, SVG, or PDF

.. feature:: AI-Powered Threat Intelligence
   :id: FE_AI_THREATS
   :status: open
   :tags: ai, threat-generation, automation

   Leverage AI (preferrably local model) to enhance security analysis through automated threat generation,
   attack vector discovery, and control recommendations. This feature uses natural language processing
   to help security teams identify potential threats they might have overlooked.

   AI capabilities include:

   * Automated threat generation based on system assets
   * Attack vector discovery and expansion
   * Security control recommendations
   * Natural language threat modeling
   * MITRE ATT&CK technique mapping
   * Attack tree expansion suggestions

.. feature:: Multi-User Collaboration
   :id: FE_COLLABORATION
   :status: implemented
   :tags: collaboration, rbac, teams, organizations

   Enable teams to work together on security analysis through organizations, projects, and
   role-based access control. This feature supports multiple organizations with fine-grained
   permissions at both organization and project levels.

   Collaboration features:

   * Organization-based project grouping
   * Role-based access control (Admin, CISO, PSO, User, Viewer)
   * Project sharing via JSON export/import
   * User invitation and management
   * Project-level and organization-level permissions
   * Audit trail with user attribution

.. feature:: Attack Feasibility Rating (ISO/SAE 21434)
   :id: FE_AFR_METHODOLOGY
   :status: implemented
   :tags: methodology, iso-21434, automotive, risk-assessment

   Standard automotive cybersecurity approach using attack potential assessment compliant
   with ISO/SAE 21434 requirements. This methodology calculates attack feasibility based on
   five key factors with automatic scoring and rating.

   Attack potential factors:

   * Time (minutes to months)
   * Expertise (Layman to Expert)
   * Knowledge (Public to Critical)
   * Window of Opportunity (Unlimited to Difficult)
   * Equipment (Standard to Bespoke)
   * Automatic feasibility calculation (High, Medium, Enhanced-Basic, Moderate)

.. feature:: Comprehensive Documentation Export
   :id: FE_EXPORT
   :status: implemented
   :tags: export, documentation, sphinx-needs, traceability

   Generate professional security documentation in multiple formats including Sphinx-needs
   compatible reStructuredText for requirements traceability, JSON for project portability,
   and management summaries for executive reporting.

   Export formats:

   * Sphinx-needs RST with automatic traceability
   * JSON project export/import
   * Attack tree images (PNG, SVG, PDF)
   * Management summary reports
   * CSV data exports for analysis
   * Requirements traceability matrices

.. feature:: Target of Evaluation (TOE) Management
   :id: FE_TOE
   :status: implemented
   :tags: toe, scope, system-definition

   Define and document the system being analyzed with comprehensive TOE description,
   configuration, scope definition, and assumptions. This feature provides structured
   templates for documenting system boundaries and environmental assumptions.

   TOE components:

   * Detailed system description
   * System architecture and configuration
   * In-scope and out-of-scope definitions
   * Environmental assumptions
   * Operational assumptions
   * System boundaries

.. feature:: Asset Management
   :id: FE_ASSETS
   :status: implemented
   :tags: assets, security-properties, cia

   Identify and manage critical system assets with security properties (Confidentiality,
   Integrity, Availability). Assets are the foundation of threat analysis, representing
   what needs protection in the system.

   Asset features:

   * Asset definition and categorization
   * Security property assignment (CIA)
   * Asset relationships and dependencies
   * Asset-to-threat mapping
   * Asset criticality assessment

.. feature:: Damage Scenario Modeling
   :id: FE_DAMAGE_SCENARIOS
   :status: implemented
   :tags: damage, impact, risk

   Model potential harm and impact through damage scenarios with customizable impact
   categories. This feature helps assess the consequences of successful attacks and
   prioritize security efforts based on potential damage.

   Damage scenario capabilities:

   * Multiple impact categories (Safety, Financial, Privacy, Operational)
   * Impact severity ratings
   * Likelihood assessment
   * Asset linkage
   * Threat correlation
   * Customizable impact categories per domain

.. feature:: Threat Identification and Management
   :id: FE_THREATS
   :status: implemented
   :tags: threats, threat-modeling, mitre-attack

   Comprehensive threat identification and tracking system with support for multiple
   methodologies, MITRE ATT&CK mapping, and status management. Threats are linked to
   assets, damage scenarios, and attack trees for complete traceability.

   Threat management:

   * Threat definition and description
   * Asset and damage scenario linkage
   * Attack feasibility rating
   * MITRE ATT&CK technique mapping
   * Threat status tracking
   * AI-powered threat suggestions

.. feature:: Security Controls Catalog
   :id: FE_CONTROLS
   :status: implemented
   :tags: controls, mitigation, security-measures

   Document and track security controls (mitigations) with implementation status,
   verification methods, and residual risk assessment. Security controls are linked
   to threats they mitigate for traceability.

   Control features:

   * Control definition and categorization
   * Implementation status tracking
   * Threat linkage for coverage
   * Verification method specification
   * Residual risk assessment
   * Control effectiveness evaluation

.. feature:: Cross-Platform Desktop Applications
   :id: FE_DESKTOP
   :status: implemented
   :tags: electron, desktop, cross-platform

   Native desktop applications for macOS, Windows, and Linux built with Electron,
   providing offline capability and system integration. Desktop apps wrap the web
   application with native file system access and auto-update support.

   Desktop features:

   * macOS universal binary (Intel + Apple Silicon)
   * Windows 64-bit installer
   * Linux AppImage, .deb, .rpm packages
   * Offline capability
   * Native file dialogs
   * System tray integration (planned)

.. feature:: Internationalization (i18n)
   :id: FE_I18N
   :status: implemented
   :tags: i18n, localization, multilingual

   Interface available in 6 languages with instant language switching and persistent
   preferences. Translations cover all UI elements, making TARA analysis accessible
   to international teams.

   Supported languages:

   * English (en)
   * German (de)
   * Spanish (es)
   * French (fr)
   * Italian (it)
   * Portuguese (pt)

.. feature:: MITRE ATT&CK Integration
   :id: FE_MITRE
   :status: implemented
   :tags: mitre, attack-patterns, threat-intelligence

   Integrated MITRE ATT&CK framework database for linking threats to known attack
   techniques and tactics. Browse tactics, techniques, and sub-techniques with full
   STIX data support for standardized threat intelligence.

   MITRE capabilities:

   * Complete ATT&CK framework database
   * Tactic and technique browsing
   * Threat-to-technique mapping
   * STIX data import
   * Attack pattern documentation

.. feature:: EMB3D Device Profile Integration
   :id: FE_EMB3D
   :status: implemented
   :tags: emb3d, embedded, iot

   Import embedded device security profiles from EMB3D (Embedded Device Security Database)
   to leverage standardized embedded threat taxonomy and device property mappings.

   EMB3D features:

   * EMB3D property definition import
   * Device property to threat mapping
   * Standardized embedded threat taxonomy
   * IoT security considerations

Planned Features
----------------

.. feature:: STRIDE Methodology
   :id: FE_STRIDE
   :status: planned
   :tags: methodology, stride, threat-modeling

   Microsoft's threat categorization framework for systematic threat identification
   using the STRIDE mnemonic: Spoofing, Tampering, Repudiation, Information Disclosure,
   Denial of Service, and Elevation of Privilege.

   Planned for v0.3.0.

.. feature:: Likelihood Methodology
   :id: FE_LIKELIHOOD
   :status: planned
   :tags: methodology, likelihood, risk-matrix

   Traditional risk assessment using likelihood × impact matrices with customizable
   risk appetite and visual risk heat maps for executive reporting.

   Planned for v0.3.0.

.. feature:: MoRA - Modular Risk Assessment
   :id: FE_MORA
   :status: planned
   :tags: methodology, mora, modular, components

   Component-based risk analysis for complex systems with module-level threat assessment,
   interface risk analysis, and aggregated system risk calculation considering supply
   chain factors.

   Planned for v0.3.0.

.. feature:: Real-Time Collaboration
   :id: FE_REALTIME
   :status: planned
   :tags: collaboration, websocket, live-editing

   Live editing with team member presence, change notifications, conflict resolution,
   and thread-based discussions on threats and assets for synchronous teamwork.

   Planned for v0.4.0.

.. feature:: Advanced Reporting
   :id: FE_REPORTING
   :status: planned
   :tags: reporting, compliance, templates

   Generate comprehensive reports with compliance templates, custom branding,
   automated report generation, and support for multiple output formats.

   Planned for v0.4.0.

Traceability
------------

All features are traceable to:

* User stories and use cases
* Implementation components (see :doc:`../development/architecture`)
* Test coverage (see :doc:`../development/testing`)
* Documentation sections

See :doc:`attack-trees`, :doc:`ai-features`, :doc:`collaboration`, and :doc:`export`
for detailed feature documentation.
