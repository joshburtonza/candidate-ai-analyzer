
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
      title: "Sophisticated CV Analysis",
      description: "Advanced document processing with AI-powered insights",
    },
    {
      icon: Brain,
      title: "Intelligent Assessment",
      description: "Deep learning algorithms for precise candidate evaluation",
    },
    {
      icon: BarChart3,
      title: "Elite Analytics",
      description: "Comprehensive scoring and detailed assessment reports",
    },
    {
      icon: Users,
      title: "Executive Dashboard",
      description: "Elegant interface designed for discerning professionals",
    },
  ];

  const benefits = [
    "Precision-engineered candidate analysis",
    "AI-driven assessment intelligence", 
    "Enterprise-grade security architecture",
    "Real-time processing excellence",
    "Advanced filtering capabilities",
    "Refined user experience design",
  ];

  // Floating animation variants
  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const extractionVariants = {
    animate: {
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff6b35' fill-opacity='0.1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm-15-15v30l15-15-15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Floating extraction elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-16 left-8 text-orange-400/40 text-xs font-mono z-5"
        style={{ animationDelay: '0s' }}
      >
        → extracting: candidate_profile.json
      </motion.div>
      
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-28 right-16 text-orange-400/35 text-xs font-mono z-5"
        style={{ animationDelay: '2s' }}
      >
        → parsing: work_experience.xml
      </motion.div>
      
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-1/2 left-12 text-orange-400/30 text-xs font-mono z-5"
        style={{ animationDelay: '1s' }}
      >
        → analyzing: technical_skills.csv
      </motion.div>
      
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute bottom-32 right-8 text-orange-400/40 text-xs font-mono z-5"
        style={{ animationDelay: '3s' }}
      >
        → processing: education_history.json
      </motion.div>
      
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute bottom-16 left-1/4 text-orange-400/35 text-xs font-mono z-5"
        style={{ animationDelay: '0.5s' }}
      >
        → validating: certifications.xml
      </motion.div>

      {/* Floating geometric elements */}
      <motion.div
        variants={extractionVariants}
        animate="animate"
        className="absolute top-1/4 left-1/5 w-2 h-2 bg-orange-500/20 rounded-full z-5"
        style={{ animationDelay: '0s' }}
      />
      
      <motion.div
        variants={extractionVariants}
        animate="animate"
        className="absolute top-1/3 right-1/4 w-1 h-1 bg-orange-400/25 rounded-full z-5"
        style={{ animationDelay: '1.5s' }}
      />
      
      <motion.div
        variants={extractionVariants}
        animate="animate"
        className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-orange-600/15 rounded-full z-5"
        style={{ animationDelay: '2.5s' }}
      />
      
      <motion.div
        variants={extractionVariants}
        animate="animate"
        className="absolute top-2/3 right-1/5 w-1.5 h-1.5 bg-orange-500/30 rounded-full z-5"
        style={{ animationDelay: '1s' }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/25">
                <Brain className="w-7 h-7 text-black" />
              </div>
              <span className="text-2xl font-bold text-white tracking-wider">APPLICHUB</span>
            </div>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-white/5 backdrop-blur-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 px-6 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            >
              ENTER
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-orange-500/30 rounded-full px-6 py-3 mb-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-white/90 tracking-wider">ELITE TALENT ASSESSMENT</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
              BORN TO BE
              <br />
              <span className="text-orange-400">CURIOUS</span>
            </h1>
            
            <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Elevate your recruitment process with sophisticated AI-powered resume analysis. 
              Designed for organizations that demand excellence in every hire.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black px-10 py-4 text-lg font-semibold tracking-wider shadow-xl shadow-orange-500/25"
              >
                BEGIN ASSESSMENT
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
              <Button
                className="bg-white/5 backdrop-blur-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 px-10 py-4 text-lg tracking-wider shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
              >
                EXPLORE FEATURES
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              SOPHISTICATED CAPABILITIES
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Engineered for the most discerning recruitment professionals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border border-orange-500/30 p-8 h-full hover:bg-orange-500/5 hover:border-orange-500/50 transition-all duration-500 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl font-bold text-white mb-8">
                EXCELLENCE BY DESIGN
              </h2>
              <p className="text-xl text-white/80 mb-10 leading-relaxed">
                Crafted for organizations that understand the value of precision in talent acquisition.
              </p>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="flex items-center gap-4"
                  >
                    <CheckCircle className="w-6 h-6 text-orange-400" />
                    <span className="text-white/90 text-lg">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="bg-white/5 backdrop-blur-xl border border-orange-500/30 p-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <div className="text-center">
                  <Quote className="w-12 h-12 text-orange-400 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-white mb-6">READY TO ELEVATE?</h3>
                  <p className="text-white/80 mb-8 text-lg leading-relaxed">
                    Join the ranks of elite organizations leveraging artificial intelligence 
                    for superior recruitment outcomes.
                  </p>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black px-8 py-3 font-semibold tracking-wider shadow-xl shadow-orange-500/25"
                  >
                    COMMENCE JOURNEY
                    <ArrowRight className="w-5 h-5 ml-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 border-t border-white/10">
          <div className="text-center text-white/60">
            <p className="tracking-wider">&copy; 2024 APPLICHUB. CRAFTED WITH PRECISION.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
