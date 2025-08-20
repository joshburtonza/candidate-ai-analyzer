
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Upload, BarChart3, Users, ArrowRight, CheckCircle, Sparkles, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: "Smart CV Analysis",
      description: "AI-powered document processing with deep insights",
    },
    {
      icon: Brain,
      title: "Smart Assessment",
      description: "Advanced algorithms for precise candidate evaluation",
    },
    {
      icon: BarChart3,
      title: "Rich Analytics",
      description: "Comprehensive scoring and detailed reports",
    },
    {
      icon: Users,
      title: "Pro Dashboard",
      description: "Elegant interface for modern professionals",
    },
  ];

  const benefits = [
    "Precision candidate analysis",
    "AI-driven assessment intelligence", 
    "Enterprise-grade security",
    "Real-time processing",
    "Advanced filtering tools",
    "Refined user experience",
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(90deg, hsla(213, 77%, 14%, 1) 0%, hsla(202, 27%, 45%, 1) 100%)',
      backgroundAttachment: 'fixed'
    }}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23475569' fill-opacity='0.1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm-15-15v30l15-15-15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Floating extraction elements - hidden on mobile for cleaner look */}
      <div className="hidden md:block">
        <motion.div
          animate={{
            x: [-60, window.innerWidth * 0.4],
            y: [0, -8, 0],
          }}
          transition={{
            x: { duration: 25, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
            y: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }
          }}
          className="absolute top-16 text-slate-400/50 text-xs font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30 z-5"
        >
          → extracting: candidate_profile.json
        </motion.div>
        
        <motion.div
          animate={{
            x: [window.innerWidth * 0.6, -50],
            y: [0, -9, 0],
          }}
          transition={{
            x: { duration: 28, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 4 },
            y: { duration: 5.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 }
          }}
          className="absolute top-28 text-slate-400/45 text-xs font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30 z-5"
        >
          → parsing: work_experience.xml
        </motion.div>
        
        <motion.div
          animate={{
            x: [-40, window.innerWidth * 0.35],
            y: [0, -6, 0],
          }}
          transition={{
            x: { duration: 32, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 },
            y: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1 }
          }}
          className="absolute top-1/2 text-slate-400/40 text-xs font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30 z-5"
        >
          → analyzing: technical_skills.csv
        </motion.div>
        
        <motion.div
          animate={{
            x: [window.innerWidth * 0.75, -70],
            y: [0, -10, 0],
          }}
          transition={{
            x: { duration: 35, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 6 },
            y: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 3 }
          }}
          className="absolute bottom-32 text-slate-400/50 text-xs font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30 z-5"
        >
          → processing: education_history.json
        </motion.div>
        
        <motion.div
          animate={{
            x: [-45, window.innerWidth * 0.3],
            y: [0, -8, 0],
          }}
          transition={{
            x: { duration: 30, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1 },
            y: { duration: 5.2, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.5 }
          }}
          className="absolute bottom-16 text-slate-400/45 text-xs font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30 z-5"
        >
          → validating: certifications.xml
        </motion.div>

        {/* Floating geometric elements */}
        <motion.div
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.1, 1],
            x: [-15, window.innerWidth * 0.2],
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
            scale: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
            x: { duration: 40, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }
          }}
          className="absolute top-1/4 w-2 h-2 bg-slate-500/20 rounded-full z-5"
        />
        
        <motion.div
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.1, 1],
            x: [window.innerWidth * 0.8, -10],
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 },
            scale: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 },
            x: { duration: 36, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 6 }
          }}
          className="absolute top-1/3 w-1 h-1 bg-slate-400/25 rounded-full z-5"
        />
        
        <motion.div
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.1, 1],
            x: [-20, window.innerWidth * 0.25],
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 4 },
            scale: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 4 },
            x: { duration: 45, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 12 }
          }}
          className="absolute bottom-1/3 w-3 h-3 bg-slate-600/15 rounded-full z-5"
        />
        
        <motion.div
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.1, 1],
            x: [window.innerWidth * 0.7, -12],
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 },
            scale: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 },
            x: { duration: 42, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 9 }
          }}
          className="absolute top-2/3 w-1.5 h-1.5 bg-slate-500/30 rounded-full z-5"
        />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-brand-gradient rounded-xl shadow-lg shadow-slate-500/25">
                <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-slate-800" />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-white tracking-wider">APPLICHUB</span>
            </div>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-brand-gradient hover:opacity-90 text-slate-800 font-semibold px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-base tracking-wider shadow-xl shadow-slate-500/25 border-0"
            >
              ENTER
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-xl border border-slate-500/30 rounded-full px-4 py-2 sm:px-6 sm:py-3 mb-6 sm:mb-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
              <span className="text-xs sm:text-sm text-white/90 tracking-wider">ELITE TALENT ASSESSMENT</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold text-white mb-6 sm:mb-8 leading-tight px-2">
              BORN TO BE
              <br />
              <span 
                className="inline-block"
                style={{
                  background: 'linear-gradient(90deg, hsla(197, 14%, 57%, 1) 0%, hsla(192, 17%, 94%, 1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                CURIOUS
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-white/80 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Elevate your recruitment with AI-powered resume analysis. 
              Designed for organizations that demand excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
              <Button
                onClick={() => navigate('/auth')}
                className="bg-brand-gradient hover:opacity-90 text-slate-800 px-8 py-3 sm:px-10 sm:py-4 text-base sm:text-lg font-semibold tracking-wider shadow-xl shadow-slate-500/25 w-full sm:w-auto"
              >
                BEGIN ASSESSMENT
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
              </Button>
              <Button
                onClick={() => {
                  const featuresSection = document.getElementById('features-section');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/5 backdrop-blur-xl border border-slate-500/30 text-slate-400 hover:bg-slate-500/10 hover:border-slate-500/50 px-8 py-3 sm:px-10 sm:py-4 text-base sm:text-lg tracking-wider shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] w-full sm:w-auto"
              >
                EXPLORE FEATURES
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features-section" className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
              SMART CAPABILITIES
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto px-4">
              Engineered for modern recruitment professionals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border border-slate-500/30 p-6 sm:p-8 h-full hover:bg-slate-500/5 hover:border-slate-500/50 transition-all duration-500 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30 w-fit mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed text-sm sm:text-base">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 sm:mb-8">
                EXCELLENCE BY DESIGN
              </h2>
              <p className="text-lg sm:text-xl text-white/80 mb-8 sm:mb-10 leading-relaxed">
                Crafted for organizations that understand precision in talent acquisition.
              </p>
              
              <div className="space-y-4 sm:space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 flex-shrink-0" />
                    <span className="text-white/90 text-base sm:text-lg">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="bg-white/5 backdrop-blur-xl border border-slate-500/30 p-8 sm:p-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <div className="text-center">
                  <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-4 sm:mb-6" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">READY TO ELEVATE?</h3>
                  <p className="text-white/80 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                    Join elite organizations leveraging AI for superior recruitment outcomes.
                  </p>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-brand-gradient hover:opacity-90 text-slate-800 px-6 py-3 sm:px-8 sm:py-3 font-semibold tracking-wider shadow-xl shadow-slate-500/25 w-full sm:w-auto"
                  >
                    COMMENCE JOURNEY
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-white/10">
          <div className="text-center text-white/60">
            <p className="tracking-wider text-sm sm:text-base">&copy; 2024 APPLICHUB. CRAFTED WITH PRECISION.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
