import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CategoryData } from '../types';

interface ChartsProps {
  categoryData: CategoryData[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const Charts = ({ categoryData }: ChartsProps) => {
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
              labelLine={false} 
              label={(entry: any) => `${entry.name} (${(entry.percent * 100).toFixed(0)}%)`} 
              outerRadius={100} 
              dataKey="value"
            >
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
