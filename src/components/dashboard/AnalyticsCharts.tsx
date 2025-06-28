import { CVUpload } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticsChartsProps {
  uploads: CVUpload[];
}

const COLORS = ['#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const filterValidCandidates = (uploads: CVUpload[]): CVUpload[] => {
  const seenEmails = new Set<string>();
  
  return uploads.filter(upload => {
    if (upload.processing_status !== 'completed' || !upload.extracted_json) return false;
    
    const data = upload.extracted_json;
    if (!(data.candidate_name && data.contact_number && data.email_address && 
          data.countries && data.skill_set && data.educational_qualifications && 
          data.job_history && data.justification)) return false;
    
    const rawScore = parseFloat(data.score || '0');
    const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
    if (score < 5) return false;
    
    const candidateEmail = data.email_address;
    if (candidateEmail) {
      const normalizedEmail = candidateEmail.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) return false;
      seenEmails.add(normalizedEmail);
    }
    
    return true;
  });
};

const normalizeCountryName = (country: string): string => {
  const normalized = country.toLowerCase().trim();
  
  // Country name mappings
  const countryMappings: Record<string, string> = {
    'usa': 'United States',
    'united states': 'United States',
    'united states of america': 'United States',
    'us': 'United States',
    'america': 'United States',
    'uae': 'United Arab Emirates',
    'united arab emirates': 'United Arab Emirates',
    'emirates': 'United Arab Emirates',
    'uk': 'United Kingdom',
    'united kingdom': 'United Kingdom',
    'britain': 'United Kingdom',
    'great britain': 'United Kingdom',
    'south africa': 'South Africa',
    'rsa': 'South Africa'
  };
  
  return countryMappings[normalized] || country.trim();
};

const normalizeSkillName = (skill: string): string => {
  const normalized = skill.toLowerCase().trim();
  
  // Skill name mappings for common variations
  const skillMappings: Record<string, string> = {
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'react': 'React',
    'reactjs': 'React',
    'react.js': 'React',
    'nodejs': 'Node.js',
    'node': 'Node.js',
    'node.js': 'Node.js',
    'python': 'Python',
    'java': 'Java',
    'c#': 'C#',
    'csharp': 'C#',
    'c++': 'C++',
    'cpp': 'C++',
    'html': 'HTML',
    'css': 'CSS',
    'sql': 'SQL',
    'mysql': 'MySQL',
    'postgresql': 'PostgreSQL',
    'postgres': 'PostgreSQL'
  };
  
  return skillMappings[normalized] || skill.trim();
};

const extractCountries = (countriesData: any): string[] => {
  console.log('Countries data:', countriesData, 'Type:', typeof countriesData);
  
  if (!countriesData) return [];
  
  let countries: string[] = [];
  
  if (typeof countriesData === 'string') {
    countries = countriesData.split(/[,;|]/).map(c => c.trim()).filter(c => c.length > 0);
  } else if (Array.isArray(countriesData)) {
    countries = countriesData.map(c => String(c).trim()).filter(c => c.length > 0);
  }
  
  // Normalize country names
  return countries.map(normalizeCountryName);
};

const extractSkills = (skillsData: any): string[] => {
  console.log('Skills data:', skillsData, 'Type:', typeof skillsData);
  
  if (!skillsData) return [];
  
  let skills: string[] = [];
  
  if (typeof skillsData === 'string') {
    skills = skillsData.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
  } else if (Array.isArray(skillsData)) {
    skills = skillsData.map(s => String(s).trim()).filter(s => s.length > 0);
  }
  
  // Normalize skill names
  return skills.map(normalizeSkillName);
};

export const AnalyticsCharts = ({ uploads }: AnalyticsChartsProps) => {
  const validUploads = filterValidCandidates(uploads);
  console.log('Valid uploads for analytics:', validUploads.length);

  // Score distribution data
  const scoreDistribution = validUploads.reduce((acc, upload) => {
    const rawScore = parseFloat(upload.extracted_json?.score || '0');
    const score = rawScore > 10 ? Math.round(rawScore / 10) : Math.round(rawScore);
    const range = `${score}/10`;
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scoreData = Object.entries(scoreDistribution)
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => parseInt(a.score) - parseInt(b.score));

  // Country distribution data with improved extraction and normalization
  const countryDistribution = validUploads.reduce((acc, upload) => {
    const countries = extractCountries(upload.extracted_json?.countries);
    countries.forEach(country => {
      if (country) {
        acc[country] = (acc[country] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const countryData = Object.entries(countryDistribution)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 countries

  console.log('Country data:', countryData);

  // Upload trends (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  const trendData = last7Days.map(date => {
    const dayUploads = validUploads.filter(upload => {
      const uploadDate = new Date(upload.uploaded_at);
      return uploadDate.toDateString() === date.toDateString();
    });
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      candidates: dayUploads.length
    };
  });

  // Top skills with improved extraction and normalization
  const skillsDistribution = validUploads.reduce((acc, upload) => {
    const skills = extractSkills(upload.extracted_json?.skill_set);
    skills.forEach(skill => {
      if (skill) {
        acc[skill] = (acc[skill] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillsDistribution)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  console.log('Top skills:', topSkills);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card elegant-border p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-wide">SCORE DISTRIBUTION</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="score" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Country Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="glass-card elegant-border p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-wide">TOP COUNTRIES</h3>
            {countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={countryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ country, count }) => `${country}: ${count}`}
                  >
                    {countryData.map((entry, index) => (
                      <Cell key={`country-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-400">No country data available</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-card elegant-border p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-wide">7-DAY TREND</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="candidates" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Top Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="glass-card elegant-border p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-wide">TOP SKILLS</h3>
            {topSkills.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSkills} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="skill" type="category" stroke="#9CA3AF" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Bar dataKey="count" fill="#eab308" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-400">No skills data available</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
