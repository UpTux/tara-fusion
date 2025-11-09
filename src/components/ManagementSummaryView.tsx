import React, { useEffect, useMemo, useState } from 'react';
import { calculateAP, calculateHighestImpact, calculateRiskLevel, getAttackFeasibilityRating, getRiskColor, riskLevelOrder } from '../services/riskService';
import { Project, RiskLevel, RiskTreatmentDecision } from '../types';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { BeakerIcon } from './icons/BeakerIcon';
import { CubeIcon } from './icons/CubeIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';

interface ManagementSummaryViewProps {
    project: Project;
    onProjectChange: (field: keyof Project, value: any) => void;
    isReadOnly: boolean;
}

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string; }> = ({ icon, label, value, color }) => (
    <div className="bg-vscode-bg-sidebar p-6 rounded-lg flex items-center space-x-4 border border-vscode-border">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-vscode-text-secondary">{label}</div>
        </div>
    </div>
);

export const ManagementSummaryView: React.FC<ManagementSummaryViewProps> = ({ project, onProjectChange, isReadOnly }) => {
    const [summary, setSummary] = useState(project.managementSummary || '');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setSummary(project.managementSummary || '');
    }, [project.managementSummary]);

    const scenariosWithRisk = useMemo(() => {
        return (project.threatScenarios || []).map(ts => {
            const impact = calculateHighestImpact(ts.damageScenarioIds, project.damageScenarios || []);
            const ap = calculateAP(ts.attackPotential);
            const rating = getAttackFeasibilityRating(ap);
            const risk = calculateRiskLevel(rating, impact);
            return { ...ts, risk };
        });
    }, [project.threatScenarios, project.damageScenarios]);

    const riskProfileData = useMemo(() => {
        const counts: Record<RiskLevel, number> = {
            [RiskLevel.CRITICAL]: 0,
            [RiskLevel.HIGH]: 0,
            [RiskLevel.MEDIUM]: 0,
            [RiskLevel.LOW]: 0,
            [RiskLevel.NEGLIGIBLE]: 0,
        };
        scenariosWithRisk.forEach(ts => {
            counts[ts.risk]++;
        });

        return Object.entries(counts).map(([label, value]) => ({
            label: label as RiskLevel,
            value,
            color: getRiskColor(label as RiskLevel).replace('bg-', 'fill-')
        })).sort((a, b) => riskLevelOrder[b.label] - riskLevelOrder[a.label]);
    }, [scenariosWithRisk]);

    const riskTreatmentData = useMemo(() => {
        const counts: Record<RiskTreatmentDecision, number> = {
            [RiskTreatmentDecision.REDUCE]: 0,
            [RiskTreatmentDecision.ACCEPT]: 0,
            [RiskTreatmentDecision.TRANSFER]: 0,
            [RiskTreatmentDecision.AVOID]: 0,
            [RiskTreatmentDecision.TBD]: 0,
        };
        (project.threatScenarios || []).forEach(ts => {
            counts[ts.treatmentDecision || RiskTreatmentDecision.TBD]++;
        });

        const colors: Record<RiskTreatmentDecision, string> = {
            [RiskTreatmentDecision.REDUCE]: '#3b82f6', // blue-500
            [RiskTreatmentDecision.ACCEPT]: '#f59e0b', // amber-500
            [RiskTreatmentDecision.TRANSFER]: '#8b5cf6', // violet-500
            [RiskTreatmentDecision.AVOID]: '#ef4444', // red-500
            [RiskTreatmentDecision.TBD]: '#6b7280', // gray-500
        };

        return Object.entries(counts)
            .filter(([, value]) => value > 0)
            .map(([label, value]) => ({
                label: label as RiskTreatmentDecision,
                value,
                color: colors[label as RiskTreatmentDecision]
            }));
    }, [project.threatScenarios]);

    const topRisks = useMemo(() => {
        return scenariosWithRisk
            .sort((a, b) => riskLevelOrder[b.risk] - riskLevelOrder[a.risk])
            .slice(0, 5);
    }, [scenariosWithRisk]);

    const handleSaveSummary = () => {
        if (isReadOnly) return;
        setSaveStatus('saving');
        onProjectChange('managementSummary', summary);
        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    };

    return (
        <div className="p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
            <h2 className="text-3xl font-bold text-vscode-text-primary">Management Summary</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard icon={<CubeIcon className="w-8 h-8" />} label="Assets" value={project.assets?.length || 0} color="bg-blue-500/30 text-blue-300" />
                <MetricCard icon={<ViewfinderCircleIcon className="w-8 h-8" />} label="Threats" value={project.threats?.length || 0} color="bg-red-500/30 text-red-300" />
                <MetricCard icon={<BeakerIcon className="w-8 h-8" />} label="Threat Scenarios" value={project.threatScenarios?.length || 0} color="bg-yellow-500/30 text-yellow-300" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-vscode-bg-sidebar p-6 rounded-lg border border-vscode-border">
                    <h3 className="text-2xl font-bold text-vscode-text-primary mb-4">Risk Profile</h3>
                    {scenariosWithRisk.length > 0 ? (
                        <BarChart data={riskProfileData} />
                    ) : <p className="text-center text-vscode-text-secondary py-10">No risk data to display.</p>}
                </div>
                <div className="bg-vscode-bg-sidebar p-6 rounded-lg border border-vscode-border">
                    <h3 className="text-2xl font-bold text-vscode-text-primary mb-4">Risk Treatment</h3>
                    {riskTreatmentData.length > 0 ? (
                        <PieChart data={riskTreatmentData} />
                    ) : <p className="text-center text-vscode-text-secondary py-10">No treatment decisions made.</p>}
                </div>
            </div>

            {/* Top Risks & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-vscode-bg-sidebar p-6 rounded-lg border border-vscode-border">
                    <h3 className="text-2xl font-bold text-vscode-text-primary mb-4">Top 5 Risk Scenarios</h3>
                    {topRisks.length > 0 ? (
                        <ul className="space-y-3">
                            {topRisks.map(ts => (
                                <li key={ts.id} className="flex items-start space-x-3">
                                    <span className={`flex-shrink-0 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getRiskColor(ts.risk)}`}>{ts.risk}</span>
                                    <div>
                                        <p className="text-sm font-medium">{ts.name}</p>
                                        <p className="text-xs text-vscode-text-secondary font-mono">{ts.id}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-vscode-text-secondary py-10">No risks to display.</p>}
                </div>
                <div className="bg-vscode-bg-sidebar p-6 rounded-lg border border-vscode-border flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-vscode-text-primary">Analyst Summary</h3>
                        <button
                            onClick={handleSaveSummary}
                            disabled={saveStatus !== 'idle' || summary === project.managementSummary || isReadOnly}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50
                                ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50'}
                            `}
                        >
                            {saveStatus === 'idle' && 'Save'}
                            {saveStatus === 'saving' && 'Saving...'}
                            {saveStatus === 'saved' && 'Saved!'}
                        </button>
                    </div>
                    <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Provide a high-level summary of the TARA results, key findings, and recommendations..."
                        className="w-full flex-1 p-3 bg-vscode-bg-sidebar border border-vscode-border rounded-md text-vscode-text-primary focus:ring-2 focus:ring-vscode-accent focus:border-vscode-accent transition resize-none"
                        readOnly={isReadOnly}
                    />
                </div>
            </div>
        </div>
    );
};
