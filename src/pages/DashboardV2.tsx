
import React from 'react';
import { DashboardV2Atoms } from '@/components/dashboardV2/DashboardV2Atoms';
import { DashboardV2Charts } from '@/components/dashboardV2/DashboardV2Charts';
import DashboardV2Header from '@/components/dashboardV2/DashboardV2Header';

const DashboardV2 = () => {
  return (
    <div className="min-h-screen bg-v2-bg">
      <DashboardV2Header 
        title="Manager Dashboard" 
        subtitle="Analytics and team insights"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <DashboardV2Atoms />
        
        {/* Charts and Analytics */}
        <DashboardV2Charts />
      </div>
    </div>
  );
};

export default DashboardV2;
