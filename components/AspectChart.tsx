import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AspectStats } from '../types';

interface AspectChartProps {
  data: AspectStats[];
  onAspectClick: (aspect: string) => void;
  selectedAspect: string | null;
}

export const AspectChart: React.FC<AspectChartProps> = ({ data, onAspectClick, selectedAspect }) => {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onClick={(data) => {
            // Cast to any to avoid TS error: Property 'activePayload' does not exist on type 'MouseHandlerDataParam'
            const chartData = data as any;
            if (chartData && chartData.activePayload && chartData.activePayload.length > 0) {
              onAspectClick(chartData.activePayload[0].payload.name);
            }
          }}
          className="cursor-pointer"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" fontSize={12} />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            stroke="#1e293b" 
            fontSize={12} 
            fontWeight={500}
            tick={({ x, y, payload }) => (
              <g transform={`translate(${x},${y})`}>
                <text 
                  x={-10} 
                  y={4} 
                  textAnchor="end" 
                  fill={selectedAspect === payload.value ? "#4f46e5" : "#1e293b"}
                  fontWeight={selectedAspect === payload.value ? 700 : 500}
                  className="transition-colors text-xs sm:text-sm"
                >
                  {payload.value}
                </text>
              </g>
            )}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          <Bar dataKey="positive" name="Positive" stackId="a" fill="#22c55e" barSize={20} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
               <Cell key={`cell-pos-${index}`} fillOpacity={selectedAspect && selectedAspect !== entry.name ? 0.3 : 1} />
            ))}
          </Bar>
          <Bar dataKey="negative" name="Negative" stackId="a" fill="#ef4444" barSize={20} radius={[0, 4, 4, 0]}>
             {data.map((entry, index) => (
               <Cell key={`cell-neg-${index}`} fillOpacity={selectedAspect && selectedAspect !== entry.name ? 0.3 : 1} />
            ))}
          </Bar>
           <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#94a3b8" barSize={20} radius={[0, 4, 4, 0]}>
             {data.map((entry, index) => (
               <Cell key={`cell-neu-${index}`} fillOpacity={selectedAspect && selectedAspect !== entry.name ? 0.3 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};