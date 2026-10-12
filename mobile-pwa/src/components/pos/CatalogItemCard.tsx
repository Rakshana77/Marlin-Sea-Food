import React, { useState } from 'react';
import { Seafood, SeafoodGrade } from '../../types/models';
import { Plus, Check, AlertCircle } from 'lucide-react';

interface CatalogItemCardProps {
  seafood: Seafood;
  grades: SeafoodGrade[];
  ratesMap: Record<string, string>; // key: `${seafoodId}_${gradeId}` -> rate
  stockMap: Record<string, number>; // key: `${seafoodId}_${gradeId}` -> availableKg
  onSelectItem: (seafood: Seafood, grade: SeafoodGrade, rate: string, availableKg: number) => void;
}

export const CatalogItemCard: React.FC<CatalogItemCardProps> = ({
  seafood,
  grades,
  ratesMap,
  stockMap,
  onSelectItem,
}) => {
  // Order grades consistently: Grade A, Grade B, Grade C
  const sortedGrades = React.useMemo(() => {
    const order = ['Grade A', 'Grade B', 'Grade C'];
    return [...grades].sort((a, b) => {
      const idxA = order.indexOf(a.name);
      const idxB = order.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [grades]);

  // Default to Grade A or first available grade
  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    sortedGrades[0]?.id || ''
  );

  const activeGrade = sortedGrades.find((g) => g.id === selectedGradeId) || sortedGrades[0];
  const rateKey = `${seafood.id}_${activeGrade?.id}`;
  const rate = ratesMap[rateKey] || '0.00';
  const availableKg = stockMap[rateKey] ?? 0;
  const isOutOfStock = availableKg <= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-3 sm:p-4 flex flex-col justify-between gap-2.5">
      {/* Header Info */}
      <div>
        <div className="flex items-start justify-between gap-1">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug tracking-tight">
              {seafood.name}
            </h3>
            {seafood.vernacularName && (
              <p className="text-xs text-slate-500 font-medium">
                {seafood.vernacularName}
              </p>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
            {seafood.category?.name || 'Seafood'}
          </span>
        </div>

        {/* Grade Chips */}
        {sortedGrades.length > 1 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {sortedGrades.map((grade) => (
              <button
                key={grade.id}
                type="button"
                onClick={() => setSelectedGradeId(grade.id)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                  selectedGradeId === grade.id
                    ? 'bg-primary-container text-teal-300 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grade.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stock & Pricing Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold font-tabular text-teal-800">
              ₹{rate}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              /{seafood.unit || 'KG'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-[11px] font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${
              isOutOfStock 
                ? 'bg-rose-500' 
                : availableKg < 10 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
            }`} />
            <span className={isOutOfStock ? 'text-rose-600 font-bold' : 'text-slate-600'}>
              {isOutOfStock ? 'Out of Stock' : `${availableKg.toFixed(2)} ${seafood.unit || 'KG'} avail`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (activeGrade) {
              onSelectItem(seafood, activeGrade, rate, availableKg);
            }
          }}
          disabled={parseFloat(rate) <= 0}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
};
