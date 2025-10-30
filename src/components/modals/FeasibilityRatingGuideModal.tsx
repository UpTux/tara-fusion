
import React from 'react';

const timeData = [
    { score: '0', description: '≤ one day' },
    { score: '1', description: '≤ one week' },
    { score: '2', description: '≤ two weeks' },
    { score: '4', description: '≤ one month' },
    { score: '7', description: '≤ two months' },
    { score: '10', description: '≤ three months' },
    { score: '13', description: '≤ four months' },
    { score: '15', description: '≤ five months' },
    { score: '17', description: '≤ six months' },
    { score: '19', description: '> six months' },
    { score: '99', description: 'infeasible' },
];

const expertiseData = [
    { score: '0', level: 'layman', description: 'Laymen are unknowledgeable compared to experts or proficient persons, with no particular expertise.' },
    { score: '3', level: 'proficient', description: 'Proficient persons are knowledgeable in that they are familiar with the security behavior of the product or system type. When several proficient persons are required to complete the attack path, the resulting level of expertise still remains “proficient”.' },
    { score: '6', level: 'expert', description: 'Experts are familiar with the underlying algorithms, protocols, hardware, structures, security behavior, principles, and concepts of security employed, techniques and tools for the definition of new attacks, cryptography, classical attacks for the product type, attack methods, etc. implemented in or relevant for the product or system type.' },
    { score: '8', level: 'multiple experts', description: 'Different fields of expertise are required at an expert level for distinct steps of an attack.' },
    { score: '99', level: 'infeasible', description: 'Infeasible is for attacks that are impossible due to one or several assumptions.' },
];

const knowledgeData = [
    { score: '0', level: 'public', description: 'Public information concerning the product (e.g. as gained from the Internet).' },
    { score: '3', level: 'restricted', description: 'Restricted information concerning the product (e.g. knowledge that is controlled within the developer organization and shared with other organizations under a non-disclosure agreement).' },
    { score: '7', level: 'sensitive', description: 'Sensitive information about the product (e.g. knowledge that is shared between discrete teams within the developer organization, access to which is constrained only to members of the specified teams).' },
    { score: '11', level: 'critical', description: 'Critical information about the product (e.g. knowledge that is known by only a few individuals, access to which is very tightly controlled on a strict need to know basis and individual undertaking).' },
    { score: '99', level: 'infeasible', description: 'Infeasible is for attacks that are impossible due to one or several assumptions.' },
];

const accessData = [
    { score: '0', level: 'remote and unlimited', description: 'Logical or remote access without physical presence, for instance, wireless or via the Internet, e.g. a V2X or cellular interface or an IT backend. The attack does not need any kind of opportunity to be carried because there is no risk of being detected during the attack.' },
    { score: '2', level: 'remote and limited', description: 'Logical or remote access without physical presence. The window of opportunity is limited due to a potential detection or because the target is only exposed for a limited time frame.' },
    { score: '5', level: 'easy physical', description: 'Simple physical access is sufficient for the attack.' },
    { score: '7', level: 'medium physical', description: 'Complex disassembly to access deep internals, e.g. direct flash memory access. However, without breaking sophisticated tamper-protection boundaries, e.g. more than special screws and similar “unsophisticated” measures.' },
    { score: '11', level: 'difficult physical', description: 'Disassembly on microelectronic level, e.g. micro probing/cutting, chemistry, including breaking some sophisticated tamper-protection boundaries.' },
    { score: '99', level: 'infeasible', description: 'Infeasible is for attacks that are impossible due to one or several assumptions.' },
];

const equipmentData = [
    { score: '0', level: 'standard', description: 'Standard equipment is readily available to the attacker, either for the identification of a vulnerability or for an attack. This equipment may be a part of the product itself (e.g. a debugger in an operating system) or can be readily obtained (e.g. Internet downloads, protocol analyzer, or simple attack scripts).' },
    { score: '4', level: 'specialized', description: 'Specialized equipment is not readily available to the attacker, but could be acquired without undue effort. This could include purchase of moderate amounts of equipment (e.g. power analysis tools, use of hundreds of PCs linked across the Internet), or development of more extensive attack scripts or programs. If clearly different test benches consisting of specialized equipment are required for distinct steps of an attack, this would be rated as bespoke.' },
    { score: '7', level: 'bespoke', description: 'Bespoke equipment is not readily available to the public, as it may need to be specially produced (e.g. very sophisticated software), or because the equipment is so specialized that its distribution is controlled, possibly even restricted. Alternatively, the equipment may be very expensive.' },
    { score: '9', level: 'multiple bespoke', description: 'Different types of bespoke equipment are required for distinct steps of an attack.' },
    { score: '99', level: 'infeasible', description: 'Infeasible is for attacks that are impossible due to one or several assumptions.' },
];

const FeasibilitySection: React.FC<{title: string; description: string; data: any[]; columns: {header: string, key: string, className?: string}[];}> = ({ title, description, data, columns }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-indigo-300 mb-1">{title}</h3>
    <p className="text-sm text-gray-400 mb-3 leading-relaxed">{description}</p>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-gray-700/50">
          <tr>
            {columns.map(col => <th key={col.key} className="p-3 font-semibold">{col.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b border-gray-700">
              {columns.map(col => (
                <td key={col.key} className={`p-3 align-top ${col.className || ''}`}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const FeasibilityRatingGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Attacker Capability Rating Guide</h2>
        </div>
        <div className="p-6 overflow-y-auto">
          <FeasibilitySection 
            title="Time"
            description="Refers to the total amount of time taken by an attacker to identify a vulnerability, develop an attack method, and sustain the effort to mount the attack. The worst case scenario is used."
            data={timeData}
            columns={[
              { header: 'Score', key: 'score', className: 'font-mono text-center w-20' },
              { header: 'Description', key: 'description' }
            ]}
          />
          <FeasibilitySection 
            title="Expertise"
            description="Refers to the level of generic knowledge of the underlying principles, product type, or attack methods."
            data={expertiseData}
            columns={[
              { header: 'Score', key: 'score', className: 'font-mono text-center w-20' },
              { header: 'Level', key: 'level', className: 'font-semibold capitalize w-40' },
              { header: 'Description', key: 'description' }
            ]}
          />
           <FeasibilitySection 
            title="Knowledge of the Product"
            description="Refers to specific knowledge in relation to the product. This is distinct from generic expertise, but not unrelated to it."
            data={knowledgeData}
            columns={[
              { header: 'Score', key: 'score', className: 'font-mono text-center w-20' },
              { header: 'Level', key: 'level', className: 'font-semibold capitalize w-40' },
              { header: 'Description', key: 'description' }
            ]}
          />
           <FeasibilitySection 
            title="Access"
            description="Refers to the method of access required to perform the attack."
            data={accessData}
            columns={[
              { header: 'Score', key: 'score', className: 'font-mono text-center w-20' },
              { header: 'Level', key: 'level', className: 'font-semibold capitalize w-40' },
              { header: 'Description', key: 'description' }
            ]}
          />
           <FeasibilitySection 
            title="Equipment"
            description="Refers to the equipment required for identifying a vulnerability or executing an attack."
            data={equipmentData}
            columns={[
              { header: 'Score', key: 'score', className: 'font-mono text-center w-20' },
              { header: 'Level', key: 'level', className: 'font-semibold capitalize w-40' },
              { header: 'Description', key: 'description' }
            ]}
          />
        </div>
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
