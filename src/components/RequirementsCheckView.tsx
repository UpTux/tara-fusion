import React, { useEffect, useMemo, useState } from 'react';
import {
    generateRequirementsSummary,
    groupViolationsBySeverity,
    RequirementSeverity,
    RequirementViolation,
    validateProjectRequirements
} from '../services/requirementsCheckService';
import { Project } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface RequirementsCheckViewProps {
    project: Project;
}

export const RequirementsCheckView: React.FC<RequirementsCheckViewProps> = ({ project }) => {
    const [expandedSeverity, setExpandedSeverity] = useState<string | null>('critical');
    const [autoUpdate, setAutoUpdate] = useState<boolean>(() => {
        const stored = localStorage.getItem('taraValidationAutoUpdate');
        return stored === null ? true : stored === 'true';
    });
    const [manualUpdateTrigger, setManualUpdateTrigger] = useState<number>(0);

    // Save auto-update preference to localStorage
    useEffect(() => {
        localStorage.setItem('taraValidationAutoUpdate', autoUpdate.toString());
    }, [autoUpdate]);

    const checkResult = useMemo(() => {
        // When auto-update is off, only recalculate when manual trigger changes
        if (!autoUpdate) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            return validateProjectRequirements(project);
        }
        // When auto-update is on, recalculate whenever project changes
        return validateProjectRequirements(project);
    }, [autoUpdate ? project : manualUpdateTrigger, autoUpdate, project]);

    const handleManualUpdate = () => {
        setManualUpdateTrigger(prev => prev + 1);
    };

    const handleToggleAutoUpdate = () => {
        setAutoUpdate(prev => !prev);
    };

    const groupedViolations = useMemo(() => {
        return groupViolationsBySeverity(checkResult.violations);
    }, [checkResult]);

    const summary = useMemo(() => {
        return generateRequirementsSummary(checkResult);
    }, [checkResult]);

    const toggleSeverity = (severity: string) => {
        setExpandedSeverity(expandedSeverity === severity ? null : severity);
    };

    const getSeverityIcon = (severity: RequirementSeverity) => {
        switch (severity) {
            case RequirementSeverity.CRITICAL:
                return '🔴';
            case RequirementSeverity.MAJOR:
                return '🟠';
            case RequirementSeverity.MINOR:
                return '🟡';
            case RequirementSeverity.INFO:
                return 'ℹ️';
        }
    };

    const getSeverityColor = (severity: RequirementSeverity) => {
        switch (severity) {
            case RequirementSeverity.CRITICAL:
                return 'border-red-500 bg-red-900/20';
            case RequirementSeverity.MAJOR:
                return 'border-orange-500 bg-orange-900/20';
            case RequirementSeverity.MINOR:
                return 'border-yellow-500 bg-yellow-900/20';
            case RequirementSeverity.INFO:
                return 'border-blue-500 bg-blue-900/20';
        }
    };

    const renderViolationSection = (
        severity: RequirementSeverity,
        violations: RequirementViolation[],
        count: number
    ) => {
        if (count === 0) return null;

        const severityKey = severity.toLowerCase();
        const isExpanded = expandedSeverity === severityKey;

        return (
            <div key={severity} className={`border rounded-lg overflow-hidden ${getSeverityColor(severity)}`}>
                <button
                    onClick={() => toggleSeverity(severityKey)}
                    className="w-full p-4 flex items-center justify-between hover:bg-vscode-bg-hover transition-colors"
                >
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getSeverityIcon(severity)}</span>
                        <div className="text-left">
                            <h3 className="text-lg font-semibold text-vscode-text-primary">
                                {severity} Issues
                            </h3>
                            <p className="text-sm text-vscode-text-secondary">
                                {count} requirement{count !== 1 ? 's' : ''} need attention
                            </p>
                        </div>
                    </div>
                    <ChevronDownIcon
                        className={`w-5 h-5 text-vscode-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {isExpanded && (
                    <div className="border-t border-vscode-border">
                        {violations.map((violation, idx) => (
                            <div
                                key={`${violation.requirementId}-${idx}`}
                                className="p-4 border-b border-vscode-border last:border-b-0 hover:bg-vscode-bg-hover"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <InformationCircleIcon className="w-5 h-5 text-vscode-accent" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="px-2 py-0.5 text-xs font-mono bg-vscode-bg-input border border-vscode-border rounded">
                                                {violation.requirementId}
                                            </span>
                                            <span className="text-xs text-vscode-text-secondary">
                                                {violation.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-vscode-text-primary mb-1">
                                            {violation.message}
                                        </p>
                                        <p className="text-xs text-vscode-text-secondary italic mb-2">
                                            Requirement: {violation.requirement}
                                        </p>
                                        {violation.affectedItems && violation.affectedItems.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs text-vscode-text-secondary mb-1">
                                                    Affected items ({violation.affectedItems.length}):
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {violation.affectedItems.slice(0, 10).map((item, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 text-xs font-mono bg-vscode-bg-input border border-vscode-border rounded"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                    {violation.affectedItems.length > 10 && (
                                                        <span className="px-2 py-0.5 text-xs text-vscode-text-secondary">
                                                            +{violation.affectedItems.length - 10} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <ShieldCheckIcon className="w-8 h-8 text-vscode-accent" />
                            <h1 className="text-3xl font-bold text-vscode-text-primary">
                                TARA Validation
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Manual Update Button */}
                            {!autoUpdate && (
                                <button
                                    onClick={handleManualUpdate}
                                    className="px-4 py-2 bg-vscode-accent hover:bg-vscode-accent/80 text-white rounded-md transition-colors flex items-center space-x-2 font-medium"
                                    title="Manually update validation results"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    <span>Update Now</span>
                                </button>
                            )}
                            {/* Auto-Update Toggle */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-vscode-text-secondary">Auto-update:</span>
                                <button
                                    onClick={handleToggleAutoUpdate}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoUpdate ? 'bg-vscode-accent' : 'bg-vscode-bg-input'
                                        }`}
                                    title={autoUpdate ? 'Disable auto-update' : 'Enable auto-update'}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoUpdate ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-vscode-text-secondary">
                        Validates the project against TARA requirements defined in ISO/SAE 21434 and related standards.
                    </p>
                </div>                {/* Summary Card */}
                <div className={`rounded-lg border p-6 mb-6 ${checkResult.passed
                    ? 'bg-green-900/20 border-green-500'
                    : 'bg-vscode-bg-sidebar border-vscode-border'
                    }`}>
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            {checkResult.passed ? (
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <span className="text-4xl">✅</span>
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <span className="text-4xl">⚠️</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-vscode-text-primary mb-2">
                                {checkResult.passed ? 'All Requirements Satisfied' : 'Validation Results'}
                            </h2>
                            <pre className="text-sm text-vscode-text-secondary whitespace-pre-wrap font-sans">
                                {summary}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Violations by Severity */}
                {!checkResult.passed && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-vscode-text-primary mb-4">
                            Detailed Issues
                        </h2>

                        {renderViolationSection(
                            RequirementSeverity.CRITICAL,
                            groupedViolations.critical,
                            checkResult.criticalCount
                        )}

                        {renderViolationSection(
                            RequirementSeverity.MAJOR,
                            groupedViolations.major,
                            checkResult.majorCount
                        )}

                        {renderViolationSection(
                            RequirementSeverity.MINOR,
                            groupedViolations.minor,
                            checkResult.minorCount
                        )}

                        {renderViolationSection(
                            RequirementSeverity.INFO,
                            groupedViolations.info,
                            checkResult.infoCount
                        )}
                    </div>
                )}

                {/* Help Section */}
                <div className="mt-8 p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                        <InformationCircleIcon className="w-5 h-5 mr-2" />
                        About TARA Validation
                    </h3>
                    <div className="text-sm text-vscode-text-secondary space-y-2">
                        <p>
                            This tool validates your TARA project against requirements from ISO/SAE 21434 and related standards.
                            The requirements are organized into several categories:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>TOE Definition:</strong> Target of Evaluation must be clearly defined</li>
                            <li><strong>Impact Determination:</strong> Damage scenarios with impact ratings</li>
                            <li><strong>Attack Feasibility:</strong> Assets, threats, and threat scenarios</li>
                            <li><strong>Risk Treatment:</strong> Security goals, controls, and treatment decisions</li>
                            <li><strong>Data Relationships:</strong> Proper linking between entities</li>
                        </ul>
                        <p className="mt-3">
                            <strong>Severity Levels:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Critical:</strong> Must be resolved for compliance</li>
                            <li><strong>Major:</strong> Should be resolved for completeness</li>
                            <li><strong>Minor:</strong> Recommended improvements</li>
                            <li><strong>Info:</strong> Informational notices</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
