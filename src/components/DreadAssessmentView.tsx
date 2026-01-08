import React, { useMemo } from 'react';
import {
  calculateDreadScore,
  calculateStrideStatistics,
  dreadRiskThresholds,
  getDreadRiskLevel,
  getDreadScoreColor,
  getStrideCategoryColor,
  getStrideCategoryLetter,
  sortThreatsByRisk,
} from '../services/strideDreadService';
import { getRiskColor } from '../services/riskService';
import { Project, RiskLevel, StrideCategory, StrideThreat } from '../types';

interface DreadAssessmentViewProps {
  project: Project;
}

// Risk Distribution Bar Component
const RiskDistributionBar: React.FC<{ threats: StrideThreat[] }> = ({ threats }) => {
  const distribution = useMemo(() => {
    const counts: Record<RiskLevel, number> = {
      [RiskLevel.CRITICAL]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.LOW]: 0,
      [RiskLevel.NEGLIGIBLE]: 0,
    };

    threats.forEach(threat => {
      const score = calculateDreadScore(threat.dpiaDreadRating);
      const level = getDreadRiskLevel(score);
      counts[level]++;
    });

    const total = threats.length || 1;
    return Object.entries(counts).map(([level, count]) => ({
      level: level as RiskLevel,
      count,
      percentage: (count / total) * 100,
    }));
  }, [threats]);

  if (threats.length === 0) {
    return (
      <div className="h-8 bg-vscode-bg-input rounded-md flex items-center justify-center text-vscode-text-secondary text-sm">
        No threats to display
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex h-8 rounded-md overflow-hidden">
        {distribution.map(({ level, percentage }) => (
          percentage > 0 && (
            <div
              key={level}
              className={`${getRiskColor(level)} transition-all`}
              style={{ width: `${percentage}%` }}
              title={`${level}: ${percentage.toFixed(1)}%`}
            />
          )
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {distribution.filter(d => d.count > 0).map(({ level, count }) => (
          <div key={level} className="flex items-center">
            <div className={`w-3 h-3 rounded-sm mr-1.5 ${getRiskColor(level)}`} />
            <span className="text-vscode-text-secondary">{level}:</span>
            <span className="text-vscode-text-primary ml-1 font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// STRIDE Category Distribution Component
const CategoryDistribution: React.FC<{ statistics: ReturnType<typeof calculateStrideStatistics> }> = ({ statistics }) => {
  const categories = (Object.entries(statistics.byCategory) as [StrideCategory, number][])
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (categories.length === 0) {
    return (
      <div className="text-center text-vscode-text-secondary py-4">
        No threats categorized yet
      </div>
    );
  }

  const maxCount = Math.max(...(Object.values(statistics.byCategory) as number[]));

  return (
    <div className="space-y-3">
      {categories.map(([category, count]) => (
        <div key={category} className="flex items-center">
          <span className={`px-2 py-1 rounded text-xs font-bold border mr-3 ${getStrideCategoryColor(category)}`}>
            {getStrideCategoryLetter(category)}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-vscode-text-primary">{category}</span>
              <span className="text-sm text-vscode-text-secondary">{count}</span>
            </div>
            <div className="h-2 bg-vscode-bg-input rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getStrideCategoryColor(category).replace('bg-', 'bg-').replace('/30', '')}`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Top Risks Table Component
const TopRisksTable: React.FC<{ threats: StrideThreat[]; limit?: number }> = ({ threats, limit = 10 }) => {
  const topThreats = useMemo(() => {
    return sortThreatsByRisk(threats).slice(0, limit);
  }, [threats, limit]);

  if (topThreats.length === 0) {
    return (
      <div className="text-center text-vscode-text-secondary py-4">
        No threats to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-vscode-border">
            <th className="text-left py-2 px-3 text-vscode-text-secondary font-medium">ID</th>
            <th className="text-left py-2 px-3 text-vscode-text-secondary font-medium">Category</th>
            <th className="text-left py-2 px-3 text-vscode-text-secondary font-medium">Threat</th>
            <th className="text-center py-2 px-3 text-vscode-text-secondary font-medium">DREAD</th>
            <th className="text-center py-2 px-3 text-vscode-text-secondary font-medium">Risk</th>
            <th className="text-left py-2 px-3 text-vscode-text-secondary font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {topThreats.map(threat => {
            const score = calculateDreadScore(threat.dpiaDreadRating);
            const riskLevel = getDreadRiskLevel(score);
            return (
              <tr key={threat.id} className="border-b border-vscode-border/50 hover:bg-vscode-bg-hover">
                <td className="py-2 px-3 font-mono text-indigo-400">{threat.id}</td>
                <td className="py-2 px-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStrideCategoryColor(threat.strideCategory)}`}>
                    {getStrideCategoryLetter(threat.strideCategory)}
                  </span>
                </td>
                <td className="py-2 px-3 text-vscode-text-primary max-w-[200px] truncate" title={threat.name}>
                  {threat.name}
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getDreadScoreColor(score)}`}>
                    {score}
                  </span>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${getRiskColor(riskLevel)}`}>
                    {riskLevel}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={`text-xs ${threat.status === 'Mitigated' ? 'text-green-400' : threat.status === 'Identified' ? 'text-yellow-400' : 'text-vscode-text-secondary'}`}>
                    {threat.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Status Overview Component
const StatusOverview: React.FC<{ statistics: ReturnType<typeof calculateStrideStatistics> }> = ({ statistics }) => {
  const statuses = (Object.entries(statistics.byStatus) as [string, number][]).filter(([, count]) => count > 0);

  const statusColors: Record<string, string> = {
    'Identified': 'bg-yellow-500',
    'In Analysis': 'bg-blue-500',
    'Mitigated': 'bg-green-500',
    'Accepted': 'bg-purple-500',
    'Transferred': 'bg-orange-500',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statuses.map(([status, count]) => (
        <div key={status} className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-4 text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${statusColors[status] || 'bg-gray-500'}`} />
          <div className="text-2xl font-bold text-vscode-text-primary">{count}</div>
          <div className="text-xs text-vscode-text-secondary">{status}</div>
        </div>
      ))}
    </div>
  );
};

// DREAD Score Breakdown Component
const DreadBreakdown: React.FC<{ threats: StrideThreat[] }> = ({ threats }) => {
  const averages = useMemo(() => {
    if (threats.length === 0) return null;

    const totals = {
      damage: 0,
      reproducibility: 0,
      exploitability: 0,
      affectedUsers: 0,
      discoverability: 0,
    };

    threats.forEach(threat => {
      totals.damage += threat.dpiaDreadRating.damage;
      totals.reproducibility += threat.dpiaDreadRating.reproducibility;
      totals.exploitability += threat.dpiaDreadRating.exploitability;
      totals.affectedUsers += threat.dpiaDreadRating.affectedUsers;
      totals.discoverability += threat.dpiaDreadRating.discoverability;
    });

    const count = threats.length;
    return {
      damage: Math.round((totals.damage / count) * 10) / 10,
      reproducibility: Math.round((totals.reproducibility / count) * 10) / 10,
      exploitability: Math.round((totals.exploitability / count) * 10) / 10,
      affectedUsers: Math.round((totals.affectedUsers / count) * 10) / 10,
      discoverability: Math.round((totals.discoverability / count) * 10) / 10,
    };
  }, [threats]);

  if (!averages) {
    return (
      <div className="text-center text-vscode-text-secondary py-4">
        No DREAD data available
      </div>
    );
  }

  const factors = [
    { key: 'damage', label: 'Damage', color: 'bg-red-500' },
    { key: 'reproducibility', label: 'Reproducibility', color: 'bg-orange-500' },
    { key: 'exploitability', label: 'Exploitability', color: 'bg-yellow-500' },
    { key: 'affectedUsers', label: 'Affected Users', color: 'bg-blue-500' },
    { key: 'discoverability', label: 'Discoverability', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-3">
      {factors.map(({ key, label, color }) => (
        <div key={key} className="flex items-center">
          <span className="w-32 text-sm text-vscode-text-secondary">{label}</span>
          <div className="flex-1 h-4 bg-vscode-bg-input rounded-full overflow-hidden mr-3">
            <div
              className={`h-full ${color} rounded-full transition-all`}
              style={{ width: `${(averages[key as keyof typeof averages] / 10) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right text-sm font-medium text-vscode-text-primary">
            {averages[key as keyof typeof averages]}
          </span>
        </div>
      ))}
    </div>
  );
};

export const DreadAssessmentView: React.FC<DreadAssessmentViewProps> = ({ project }) => {
  const threats = project.strideThreats || [];
  const statistics = useMemo(() => calculateStrideStatistics(threats), [threats]);

  // Calculate overall risk score
  const overallRiskScore = statistics.averageDreadScore;
  const overallRiskLevel = getDreadRiskLevel(overallRiskScore);

  // Count unmitigated high/critical risks
  const unmitgatedHighRisks = useMemo(() => {
    return threats.filter(t => {
      const score = calculateDreadScore(t.dpiaDreadRating);
      const level = getDreadRiskLevel(score);
      return (level === RiskLevel.CRITICAL || level === RiskLevel.HIGH) && t.status !== 'Mitigated';
    }).length;
  }, [threats]);

  return (
    <div className="p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-vscode-text-primary mb-2">DREAD Risk Assessment</h1>
        <p className="text-vscode-text-secondary mb-8">
          Overview of threat risk ratings using the DREAD methodology
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
            <h3 className="text-sm text-vscode-text-secondary mb-2">Total Threats</h3>
            <div className="text-4xl font-bold text-vscode-text-primary">{statistics.total}</div>
          </div>

          <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
            <h3 className="text-sm text-vscode-text-secondary mb-2">Average DREAD Score</h3>
            <div className="flex items-center">
              <span className={`text-4xl font-bold px-3 py-1 rounded ${getDreadScoreColor(overallRiskScore)}`}>
                {overallRiskScore || '-'}
              </span>
            </div>
          </div>

          <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
            <h3 className="text-sm text-vscode-text-secondary mb-2">Overall Risk Level</h3>
            <div className="flex items-center">
              {threats.length > 0 ? (
                <span className={`text-xl font-bold px-3 py-1 rounded text-white ${getRiskColor(overallRiskLevel)}`}>
                  {overallRiskLevel}
                </span>
              ) : (
                <span className="text-xl text-vscode-text-secondary">-</span>
              )}
            </div>
          </div>

          <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
            <h3 className="text-sm text-vscode-text-secondary mb-2">Unmitigated High Risks</h3>
            <div className={`text-4xl font-bold ${unmitgatedHighRisks > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {unmitgatedHighRisks}
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-vscode-text-primary mb-4">Threat Status Overview</h2>
          <StatusOverview statistics={statistics} />
        </div>

        {/* Risk Distribution */}
        <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-vscode-text-primary mb-4">Risk Distribution</h2>
          <RiskDistributionBar threats={threats} />
          <div className="mt-4 pt-4 border-t border-vscode-border">
            <h4 className="text-sm font-medium text-vscode-text-secondary mb-2">DREAD Risk Thresholds</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              {Object.entries(dreadRiskThresholds).map(([level, { label }]) => (
                <div key={level} className="flex items-center">
                  <div className={`w-3 h-3 rounded-sm mr-1.5 ${getRiskColor(level as RiskLevel)}`} />
                  <span className="text-vscode-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* STRIDE Category Distribution */}
          <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-vscode-text-primary mb-4">Threats by STRIDE Category</h2>
            <CategoryDistribution statistics={statistics} />
          </div>

          {/* DREAD Factor Breakdown */}
          <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-vscode-text-primary mb-4">Average DREAD Factors</h2>
            <DreadBreakdown threats={threats} />
          </div>
        </div>

        {/* Top Risks Table */}
        <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-vscode-text-primary mb-4">Top Risk Threats</h2>
          <TopRisksTable threats={threats} limit={10} />
        </div>

        {/* Empty State */}
        {threats.length === 0 && (
          <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-12 text-center">
            <h3 className="text-xl font-semibold text-vscode-text-primary mb-2">No Threats Defined</h3>
            <p className="text-vscode-text-secondary mb-4">
              Start by creating STRIDE threats in the "STRIDE Threats" view to see risk assessments here.
            </p>
            <div className="text-sm text-vscode-text-secondary">
              <p className="mb-2">The DREAD methodology rates threats on five factors:</p>
              <div className="inline-block text-left">
                <ul className="space-y-1">
                  <li><strong>D</strong>amage Potential - How much damage could occur?</li>
                  <li><strong>R</strong>eproducibility - How easy is it to reproduce?</li>
                  <li><strong>E</strong>xploitability - How easy is it to exploit?</li>
                  <li><strong>A</strong>ffected Users - How many users are affected?</li>
                  <li><strong>D</strong>iscoverability - How easy is it to discover?</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
