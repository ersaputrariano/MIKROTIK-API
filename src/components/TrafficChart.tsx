import React from 'react';
import { Activity } from 'lucide-react';

interface TrafficData {
  time: string;
  inbound: number;
  outbound: number;
}

interface TrafficChartProps {
  data: TrafficData[];
}

const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-2">
        <Activity className="h-8 w-8 opacity-50" />
        <p>No traffic data available</p>
        <p className="text-sm">Data will appear once devices are connected</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.inbound, d.outbound)));
  
  return (
    <div className="h-64">
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Inbound Traffic</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Outbound Traffic</span>
        </div>
      </div>
      
      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end justify-between space-x-1">
          {data.map((point, index) => {
            const inboundHeight = (point.inbound / maxValue) * 100;
            const outboundHeight = (point.outbound / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col justify-end space-y-1">
                <div 
                  className="bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${inboundHeight}%` }}
                  title={`Inbound: ${point.inbound.toFixed(1)} Mbps`}
                />
                <div 
                  className="bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${outboundHeight}%` }}
                  title={`Outbound: ${point.outbound.toFixed(1)} Mbps`}
                />
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <span>{maxValue.toFixed(0)} Mbps</span>
          <span>{(maxValue * 0.75).toFixed(0)}</span>
          <span>{(maxValue * 0.5).toFixed(0)}</span>
          <span>{(maxValue * 0.25).toFixed(0)}</span>
          <span>0</span>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>24h ago</span>
        <span>12h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
};

export default TrafficChart;