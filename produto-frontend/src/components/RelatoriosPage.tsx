import { BarChart3 } from 'lucide-react';

export function RelatoriosPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Relatórios</h2>
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500">Em breve</h3>
        <p className="text-gray-400 mt-1">Funcionalidade de relatórios será adicionada futuramente.</p>
      </div>
    </div>
  );
}
