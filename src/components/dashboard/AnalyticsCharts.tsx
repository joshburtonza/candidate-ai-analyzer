import { CVUpload } from '@/types/candidate';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticsChartsProps {
  uploads: CVUpload[];
}

const COLORS = ['#8399A2', '#A8B5BA', '#BCC7CB', '#D1DADC', '#E6ECED', '#3b82f6', '#8b5cf6', '#ec4899'];

const filterValidCandidatesForAnalytics = (uploads: CVUpload[]): CVUpload[] => {
  const seenEmails = new Set<string>();
  
  return uploads.filter(upload => {
    if (!upload.extracted_json?.candidate_name || !upload.extracted_json?.email_address) return false;
    
    const score = parseFloat(upload.extracted_json?.score || '0') || 0;
    if (score < 5) return false;
    
    const candidateEmail = upload.extracted_json.email_address;
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
    'postgres': 'PostgreSQL',
    'student engagement': 'Student Engagement',
    'adaptability': 'Adaptability',
    'powerpoint': 'PowerPoint',
    'curriculum development': 'Curriculum Development',
    'lesson planning': 'Lesson Planning',
    'classroom management': 'Classroom Management',
    'microsoft office': 'Microsoft Office',
    'excel': 'Excel',
    'word': 'Word',
    'communication': 'Communication',
    'leadership': 'Leadership',
    'teamwork': 'Teamwork',
    'project management': 'Project Management'
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
    // Split by various delimiters and handle multi-line strings
    skills = skillsData
      .split(/[,;|\n\r•\-\*]/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => !s.match(/^[\d\.\-\s]*$/)); // Remove numeric-only entries
  } else if (Array.isArray(skillsData)) {
    skills = skillsData
      .map(s => String(s).trim())
      .filter(s => s.length > 0)
      .filter(s => !s.match(/^[\d\.\-\s]*$/)); // Remove numeric-only entries
  } else if (typeof skillsData === 'object' && skillsData !== null) {
    // Handle object format - extract values
    skills = Object.values(skillsData)
      .filter(value => typeof value === 'string')
      .map(s => String(s).trim())
      .filter(s => s.length > 0);
  }
  
  console.log('Extracted skills before normalization:', skills);
  
  // Normalize skill names
  const normalizedSkills = skills.map(normalizeSkillName);
  console.log('Normalized skills:', normalizedSkills);
  
  return normalizedSkills;
};

export const AnalyticsCharts = ({ uploads }: AnalyticsChartsProps) => {
  const validUploads = filterValidCandidatesForAnalytics(uploads);
  console.log('Valid uploads for analytics:', validUploads.length);

  // Score distribution data
  const scoreDistribution = validUploads.reduce((acc, upload) => {
    const score = parseFloat(upload.extracted_json?.score || '0') || 0;
    const range = `${Math.round(score)}/10`;
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scoreData = Object.entries(scoreDistribution)
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => parseInt(a.score) - parseInt(b.score));

  // Country distribution data
  const countryDistribution = validUploads.reduce((acc, upload) => {
    if (upload.extracted_json?.countries) {
      const countries = upload.extracted_json.countries.split(',').map(c => c.trim());
      countries.forEach(country => {
        if (country) {
          const normalizedCountry = normalizeCountryName(country);
          acc[normalizedCountry] = (acc[normalizedCountry] || 0) + 1;
        }
      });
    }
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

  // Top skills
  const skillsDistribution = validUploads.reduce((acc, upload) => {
    if (upload.extracted_json?.skill_set) {
      const skills = upload.extracted_json.skill_set.split(',').map(s => s.trim());
      skills.forEach(skill => {
        if (skill && skill.length > 1) {
          const normalizedSkill = normalizeSkillName(skill);
          acc[normalizedSkill] = (acc[normalizedSkill] || 0) + 1;
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillsDistribution)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  console.log('Skills distribution:', skillsDistribution);
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
          <div className="glass hover-lift p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-wide">SCORE DISTRIBUTION</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="score" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    color: '#ffffff',
                    backdropFilter: 'blur(24px)'
                  }} 
                />
                <Bar dataKey="count" fill="url(#brandGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8399A2" />
                    <stop offset="100%" stopColor="#EEF2F3" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Country Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="glass hover-lift p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-wide">TOP COUNTRIES</h3>
            {countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={countryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={0}
                    paddingAngle={5}
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
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '20px',
                      color: '#ffffff',
                      backdropFilter: 'blur(24px)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-400">No country data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="glass hover-lift p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-wide">7-DAY TREND</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    color: '#ffffff',
                    backdropFilter: 'blur(24px)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="candidates" 
                  stroke="#8399A2" 
                  strokeWidth={3}
                  dot={{ fill: '#8399A2', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="glass hover-lift p-6">
            <h3 className="text-lg font-bold text-white mb-6 tracking-wide">TOP SKILLS</h3>
            {topSkills.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSkills} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.7)" />
                  <YAxis 
                    dataKey="skill" 
                    type="category" 
                    stroke="rgba(255,255,255,0.7)" 
                    width={120}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '20px',
                      color: '#ffffff',
                      backdropFilter: 'blur(24px)'
                    }} 
                  />
                  <Bar dataKey="count" fill="url(#skillsGradient)" radius={[0, 8, 8, 0]} />
                  <defs>
                    <linearGradient id="skillsGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8399A2" />
                      <stop offset="100%" stopColor="#EEF2F3" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-400">No skills data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
