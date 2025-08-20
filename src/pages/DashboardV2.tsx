
import React from 'react';
import { Container, Widget, DashCard, DashButton, Progress } from '@/components/dashboardV2/DashboardV2Atoms';
import { Dots, Bars, RowStat } from '@/components/dashboardV2/DashboardV2Charts';
import DashboardV2Header from '@/components/dashboardV2/DashboardV2Header';
import { BarChart3, Users, TrendingUp, Activity } from 'lucide-react';

const DashboardV2 = () => {
  return (
    <div className="min-h-screen bg-v2-bg">
      <DashboardV2Header 
        title="Manager Dashboard" 
        subtitle="Analytics and team insights"
      />
      
      <Container className="py-8">
        <div className="space-y-8">
          {/* Key Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Widget tone="cyan" className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Users className="h-8 w-8 text-pastel-cyan" />
              </div>
              <div className="text-3xl font-bold mb-1">247</div>
              <div className="text-sm opacity-80">Total Candidates</div>
            </Widget>
            
            <Widget tone="pink" className="text-center">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-8 w-8 text-pastel-pink" />
              </div>
              <div className="text-3xl font-bold mb-1">89</div>
              <div className="text-sm opacity-80">This Week</div>
            </Widget>
            
            <Widget tone="yellow" className="text-center">
              <div className="flex items-center justify-center mb-3">
                <BarChart3 className="h-8 w-8 text-pastel-yellow" />
              </div>
              <div className="text-3xl font-bold mb-1">156</div>
              <div className="text-sm opacity-80">Qualified</div>
            </Widget>
            
            <Widget tone="green" className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Activity className="h-8 w-8 text-pastel-green" />
              </div>
              <div className="text-3xl font-bold mb-1">92%</div>
              <div className="text-sm opacity-80">Success Rate</div>
            </Widget>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashCard>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Weekly Activity</h3>
              <Dots series={[1,3,2,5,4,6,8,7,9,6,4,2]} />
            </DashCard>
            
            <DashCard>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Monthly Overview</h3>
              <Bars series={[2,5,9,7,4,8]} />
            </DashCard>
          </div>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashCard>
              <h3 className="text-lg font-semibold mb-6 text-foreground">Team Performance</h3>
              <div className="space-y-4">
                <RowStat label="Frontend Developers" value="234" color="pastel-cyan" />
                <RowStat label="Backend Engineers" value="189" color="pastel-pink" />
                <RowStat label="Full Stack" value="156" color="pastel-yellow" />
                <RowStat label="DevOps" value="78" color="white" />
              </div>
            </DashCard>
            
            <DashCard>
              <h3 className="text-lg font-semibold mb-6 text-foreground">Success Metrics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Interview Rate</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Hire Rate</span>
                    <span className="text-sm font-medium">62%</span>
                  </div>
                  <Progress value={62} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Retention</span>
                    <span className="text-sm font-medium">94%</span>
                  </div>
                  <Progress value={94} />
                </div>
              </div>
            </DashCard>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <DashButton variant="primary">
              Generate Report
            </DashButton>
            <DashButton variant="soft">
              Export Data
            </DashButton>
            <DashButton variant="ghost">
              View Details
            </DashButton>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default DashboardV2;
