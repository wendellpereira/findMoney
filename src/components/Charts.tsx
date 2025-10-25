import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { CategoryData } from '../types'
import { useMemo } from 'react'

interface ChartsProps {
  categoryData: CategoryData[];
}

// Generate color gradient from red (highest) to green (lowest)
const generateColorScale = (dataLength: number) => {
  const colors: string[] = []

  for (let i = 0; i < dataLength; i++) {
    // Normalize position from 0 (highest spending - red) to 1 (lowest spending - green)
    const normalized = i / (dataLength - 1 || 1)

    // Interpolate from red to yellow to green
    let r, g, b

    if (normalized < 0.5) {
      // Red to Yellow (0 to 0.5)
      const t = normalized * 2
      r = 239 // Red stays high
      g = Math.round(68 + (234 - 68) * t) // Green increases
      b = 68 // Blue stays low
    } else {
      // Yellow to Green (0.5 to 1)
      const t = (normalized - 0.5) * 2
      r = Math.round(239 - (239 - 34) * t) // Red decreases
      g = Math.round(234 - (234 - 197) * t) // Green adjusts
      b = Math.round(68 + (94 - 68) * t) // Blue increases slightly
    }

    colors.push(`rgb(${r}, ${g}, ${b})`)
  }

  return colors
}

export const Charts = ({ categoryData }: ChartsProps) => {
  // Generate colors based on spending order (already sorted by value descending)
  const colors = useMemo(() => generateColorScale(categoryData.length), [categoryData.length])

  // Create color mapping for bar chart
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {}
    categoryData.forEach((category, index) => {
      map[category.name] = colors[index]
    })
    return map
  }, [categoryData, colors])

  return (
    <div className="grid md:grid-cols-2 gap-8 mb-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Spending by Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={(entry: any) => `${entry.name} (${(entry.percent * 100).toFixed(0)}%)`}
              outerRadius={100}
              dataKey="value"
            >
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Top Categories</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData.slice(0, 8)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
            <Bar dataKey="value">
              {categoryData.slice(0, 8).map((entry, index) => (
                <Cell key={`bar-cell-${index}`} fill={colorMap[entry.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
