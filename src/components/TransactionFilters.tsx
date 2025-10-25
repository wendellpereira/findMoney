import { useState, useMemo } from 'react'
import { Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Transaction, Statement } from '../types'

interface TransactionFiltersProps {
  transactions: Transaction[]
  statements: Statement[]
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  years: number[]
  months: number[]
  statementIds: number[]
}

export const TransactionFilters = ({ transactions, statements, onFilterChange }: TransactionFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    years: [],
    months: [],
    statementIds: []
  })

  const [expandedSections, setExpandedSections] = useState({
    years: true,
    months: true,
    statements: true
  })

  // Extract available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    transactions.forEach(t => {
      const year = new Date(t.date).getFullYear()
      years.add(year)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [transactions])

  // Extract available months based on selected years
  const availableMonths = useMemo(() => {
    if (filters.years.length === 0) {
      // If no years selected, show all months from all transactions
      const months = new Set<number>()
      transactions.forEach(t => {
        const month = new Date(t.date).getMonth() + 1
        months.add(month)
      })
      return Array.from(months).sort((a, b) => a - b)
    }

    // Filter by selected years
    const months = new Set<number>()
    transactions.forEach(t => {
      const date = new Date(t.date)
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      if (filters.years.includes(year)) {
        months.add(month)
      }
    })
    return Array.from(months).sort((a, b) => a - b)
  }, [transactions, filters.years])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const toggleYear = (year: number) => {
    const newYears = filters.years.includes(year)
      ? filters.years.filter(y => y !== year)
      : [...filters.years, year]

    const newFilters = { ...filters, years: newYears }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleMonth = (month: number) => {
    const newMonths = filters.months.includes(month)
      ? filters.months.filter(m => m !== month)
      : [...filters.months, month]

    const newFilters = { ...filters, months: newMonths }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleStatement = (statementId: number) => {
    const newStatementIds = filters.statementIds.includes(statementId)
      ? filters.statementIds.filter(id => id !== statementId)
      : [...filters.statementIds, statementId]

    const newFilters = { ...filters, statementIds: newStatementIds }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const clearAllFilters = () => {
    const emptyFilters = { years: [], months: [], statementIds: [] }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters = filters.years.length > 0 || filters.months.length > 0 || filters.statementIds.length > 0

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Calendar size={20} />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Year Filter */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('years')}
          className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-2 hover:text-slate-900"
        >
          <span>Years {filters.years.length > 0 && `(${filters.years.length})`}</span>
          {expandedSections.years ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expandedSections.years && (
          <div className="flex flex-wrap gap-2">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => toggleYear(year)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.years.includes(year)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Month Filter */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('months')}
          className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-2 hover:text-slate-900"
        >
          <span>Months {filters.months.length > 0 && `(${filters.months.length})`}</span>
          {expandedSections.months ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expandedSections.months && (
          <div className="flex flex-wrap gap-2">
            {availableMonths.map(month => (
              <button
                key={month}
                onClick={() => toggleMonth(month)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.months.includes(month)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {monthNames[month - 1]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Statement Filter */}
      <div>
        <button
          onClick={() => toggleSection('statements')}
          className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-2 hover:text-slate-900"
        >
          <span className="flex items-center gap-2">
            <FileText size={16} />
            Statements {filters.statementIds.length > 0 && `(${filters.statementIds.length})`}
          </span>
          {expandedSections.statements ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expandedSections.statements && (
          <>
            <div className="flex flex-col gap-2 mb-2">
              {statements.map(statement => (
                <button
                  key={statement.id}
                  onClick={() => toggleStatement(statement.id)}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    filters.statementIds.includes(statement.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="font-medium">{statement.institution} - {statement.month}</div>
                  <div className="text-xs opacity-75">
                    {statement.actual_transaction_count || statement.transaction_count} transactions
                  </div>
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200">
              ℹ️ Statement billing cycles may span multiple calendar months
            </div>
          </>
        )}
      </div>
    </div>
  )
}
