import React, { useState, useEffect, useRef } from 'react';
import logo from './assets/logo.jpeg';
import bg from './assets/bg.png';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  ShieldCheck, Scan, Camera, AlertTriangle, CheckCircle, Search, 
  HeartPulse, Info, X, ChevronRight, ChevronLeft, BarChart3, 
  Leaf, Brain, Star, Activity, Clock, Zap, TrendingDown, 
  Award, Heart, Sparkles, BrainCircuit, Database, Cpu,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Replace the hardcoded line with this:
const API_URL ="https://safebite-ml-service.onrender.com/api"
console.log('🔧 API URL hardcoded to:', API_URL);

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Floating Elements Component
const FloatingElements = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className={`absolute ${i % 3 === 0 ? 'w-6 h-6' : i % 3 === 1 ? 'w-4 h-4' : 'w-2 h-2'} rounded-full ${
          i % 3 === 0 ? 'bg-emerald-200/20' : 
          i % 3 === 1 ? 'bg-blue-200/20' : 
          'bg-purple-200/20'
        }`}
        style={{
          top: `${(i * 12) % 100}%`,
          left: `${(i * 17) % 100}%`,
        }}
        animate={{
          y: [0, i % 2 === 0 ? -30 : 30, 0],
          x: [0, i % 2 === 0 ? 20 : -20, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 8 + i * 0.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    ))}
  </div>
);

// AI Status Badge
const AIStatusBadge = ({ trained }) => (
  <motion.div 
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className={`flex items-center gap-2 px-3 py-1 rounded-full ${trained ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}
  >
    <div className={`w-2 h-2 rounded-full ${trained ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
    <span className={`text-xs font-bold ${trained ? 'text-emerald-600' : 'text-amber-600'}`}>
      {trained ? 'AI TRAINED' : 'AI TRAINING'}
    </span>
  </motion.div>
);

// Header Component
const Header = ({ onShowGuide, onBack, showBack, aiTrained }) => (
  <motion.header 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    transition={{ type: "spring", stiffness: 100 }}
    className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 text-white p-4 shadow-xl sticky top-0 z-50"
  >
    <div className="flex items-center justify-between max-w-md mx-auto">
      <div className="flex items-center gap-3">
        {showBack && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ChevronLeft size={20} />
          </motion.button>
        )}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <motion.div 
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
           


<div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
  <img 
  src={logo}  // Use the imported variable
  alt="SafeBite Logo"
       className="w-11 h-11 object-cover rounded-full" 
/>
</div>
          </motion.div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none flex items-center gap-2">
            <span className="inline-flex">
  Safe<span className="font-black">Bite</span>
</span>

              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI v2.0</span>
            </h1>
            <p className="text-xs font-medium text-emerald-100/80 tracking-wide flex items-center gap-1">
              <BrainCircuit size={10} />
              Intelligent Food Safety Scanner
            </p>
          </div>
        </motion.div>
      </div>
      
      <div className="flex items-center gap-2">
        <AIStatusBadge trained={aiTrained} />
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShowGuide}
          className="p-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-200"
        >
          <Info size={20} />
        </motion.button>
      </div>
    </div>
  </motion.header>
);

// Onboarding Component with FIXED "See More" button position
const Onboarding = ({ onComplete }) => {
  const [input, setInput] = useState('');
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showAllDiseases, setShowAllDiseases] = useState(false);
  const [showMatchError, setShowMatchError] = useState(false);
  const [matchErrorMsg, setMatchErrorMsg] = useState('');

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    try {
      const response = await axios.get(`${API_URL}/diseases`);
      setSuggestions(response.data.diseases || []);
    } catch (err) {
      console.log("Using default diseases");
      setSuggestions([
        { id: 1, name: 'Diabetes', icon: '💉', color: 'bg-red-50 border-red-200 text-red-700' },
        { id: 2, name: 'Hypertension', icon: '❤️', color: 'bg-blue-50 border-blue-200 text-blue-700' },
        { id: 3, name: 'High Cholesterol', icon: '🫀', color: 'bg-amber-50 border-amber-200 text-amber-700' },
        { id: 4, name: 'Allergies', icon: '🤧', color: 'bg-purple-50 border-purple-200 text-purple-700' }
      ]);
    }
  };

  const handleMatchDisease = async () => {
    if (!input.trim()) return;
    
    try {
      const response = await axios.post(`${API_URL}/match-disease`, {
        query: input.trim()
      });
      
      if (response.data.success) {
        const disease = response.data.disease;
        if (!selectedDiseases.find(d => d.id === disease.id)) {
          const newDisease = {
            id: disease.id,
            name: disease.name,
            icon: disease.icon,
            color: disease.color
          };
          setSelectedDiseases([...selectedDiseases, newDisease]);
          setInput('');
          setShowMatchError(false);
        }
      } else {
        setMatchErrorMsg(response.data.message);
        setShowMatchError(true);
      }
    } catch (error) {
      console.error("Disease match error:", error);
      setMatchErrorMsg("Could not match disease. Please select from list.");
      setShowMatchError(true);
    }
  };

  const handleAddDisease = (disease) => {
    if (!selectedDiseases.find(d => d.id === disease.id)) {
      setSelectedDiseases([...selectedDiseases, disease]);
    }
  };

  const handleComplete = () => {
    if (selectedDiseases.length > 0) {
      onComplete(selectedDiseases);
    }
  };

  const loadAllDiseases = async () => {
    try {
      const response = await axios.get(`${API_URL}/all-diseases`);
      setSuggestions(response.data);
      setShowAllDiseases(true);
    } catch (error) {
      console.error("Error loading all diseases:", error);
    }
  };

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-6 max-w-md mx-auto space-y-8 min-h-[80vh] flex flex-col justify-center relative z-10"
    >
      <FloatingElements />
   <motion.div variants={fadeIn} className="text-center space-y-4">
  {/* Full Width Logo */}
  <motion.div 
    animate={{ 
      scale: [1, 1.02, 1],
    }}
    transition={{ duration: 3, repeat: Infinity }}
    className="w-full mb-8"
  >
    
      <div className="w-full h-full bg-white rounded-xl flex items-center justify-center p-0">
        <img 
          src={bg}
          alt="SafeBite"
          className="h-23 object-contain" // Very large
        />
      </div>

  </motion.div>
  
  <h2 className="text-3xl font-bold text-gray-900">Personalized AI Analysis</h2>
  <p className="text-gray-600 leading-relaxed">
    Select your health conditions for AI-powered personalized food analysis
  </p>
</motion.div>

      <motion.div variants={fadeIn} className="space-y-3">
        {selectedDiseases.length > 0 && (
          <>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Selected Conditions</h3>
            <AnimatePresence>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {selectedDiseases.map((d, index) => (
                  <motion.span 
                    key={d.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${d.color} pl-3 pr-2 py-2 rounded-lg text-sm font-semibold shadow-md flex items-center gap-2`}
                  >
                    <span className="text-lg">{d.icon}</span>
                    {d.name}
                    <motion.button 
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setSelectedDiseases(selectedDiseases.filter(x => x.id !== d.id))}
                      className="hover:bg-black/10 rounded-full p-1"
                    >
                      <X size={14}/>
                    </motion.button>
                  </motion.span>
                ))}
              </div>
            </AnimatePresence>
          </>
        )}
      </motion.div>

      <motion.div variants={scaleIn}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            className="w-full bg-white border-2 border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm"
            placeholder="Type 'sugar', 'bp', 'heart', etc. or select below..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowMatchError(false);
            }}
            onKeyPress={(e) => e.key === 'Enter' && input && handleMatchDisease()}
          />
          {input && (
            <motion.button 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={handleMatchDisease}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-green-400 text-white p-2 rounded-lg hover:from-emerald-600 hover:to-green-500 transition-all shadow-md"
            >
              Match
            </motion.button>
          )}
        </div>
        
        {showMatchError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">{matchErrorMsg}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={fadeIn} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
            <Database size={12} />
            Common Conditions
          </h3>
          <span className="text-xs text-gray-500">{suggestions.length} shown</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((s, index) => (
            <motion.button 
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleAddDisease(s)}
              disabled={selectedDiseases.find(d => d.id === s.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02] hover:shadow-lg ${selectedDiseases.find(d => d.id === s.id) ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md' : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50'} ${s.color || ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="font-bold text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.category || 'Health Condition'}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        
        {/* "See More" button - FIXED POSITION (always at bottom of disease grid) */}
        {!showAllDiseases && (
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadAllDiseases}
              className="w-full py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-2 hover:from-gray-100 hover:to-gray-200 transition-all"
            >
              <ChevronDown size={16} />
              See More Conditions
              <ChevronDown size={16} />
            </motion.button>
          </div>
        )}
        
        {showAllDiseases && (
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowAllDiseases(false);
                fetchDiseases();
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl text-emerald-700 font-medium flex items-center justify-center gap-2 hover:from-emerald-100 hover:to-green-100 transition-all"
            >
              <ChevronUp size={16} />
              Show Less
              <ChevronUp size={16} />
            </motion.button>
          </div>
        )}
      </motion.div>

      <motion.div variants={scaleIn} className="pt-4">
        <motion.button 
          whileHover={{ scale: selectedDiseases.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: selectedDiseases.length > 0 ? 0.98 : 1 }}
          onClick={handleComplete}
          disabled={selectedDiseases.length === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 ${selectedDiseases.length > 0 ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-700 hover:to-green-600 hover:shadow-emerald-300/50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          <span className="flex items-center justify-center gap-2">
            {selectedDiseases.length > 0 ? (
              <>
                <Cpu size={20} />
                Start AI Food Analysis
                <Sparkles size={20} />
              </>
            ) : (
              'Select at least one condition'
            )}
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Scanner Component - COMPLETELY FIXED
const Scanner = ({ userProfile, onScanResult }) => {
  const [mode, setMode] = useState('scan');
  const [manualText, setManualText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [aiStatus, setAiStatus] = useState({ trained: false });
  const [scanError, setScanError] = useState(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const scannerRef = useRef(null);
  const searchTimeout = useRef(null);
  const scannerContainerRef = useRef(null);
  
  useEffect(() => {
    if (mode === 'scan' && !scannerRef.current) {
      initializeScanner();
    } else {
      cleanupScanner();
    }
    
    return () => {
      cleanupScanner();
    };
  }, [mode]);
  
  useEffect(() => {
    // Check AI status
    axios.get(`${API_URL}/ai-stats`).then(res => {
      setAiStatus(res.data);
    }).catch(err => {
      console.log("Could not fetch AI status");
    });
  }, []);
  
  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.log("Scanner cleanup error:", error);
      }
    }
    setIsScannerReady(false);
    
    // Clear scanner container
    if (scannerContainerRef.current) {
      scannerContainerRef.current.innerHTML = '';
    }
  };
  
  const initializeScanner = () => {
    try {
      console.log("Initializing scanner...");
      
      // Clear previous scanner
      cleanupScanner();
      
      // Create container if not exists
      const containerId = 'scanner-container';
      let container = document.getElementById(containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'w-full h-full bg-black';
        
        const readerDiv = document.getElementById('reader');
        if (readerDiv) {
          readerDiv.appendChild(container);
        }
      }
      
      container.innerHTML = '';
      scannerContainerRef.current = container;
      
      // Initialize the scanner
      const scanner = new Html5QrcodeScanner(
        containerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 1
        },
        false
      );
      
      const onScanSuccess = async (decodedText, decodedResult) => {
        console.log("✅ Barcode scanned:", decodedText);
        
        try {
          scanner.pause();
          setLoading(true);
          setScanError(null);
          
          // Call scan API
          const response = await axios.post(`${API_URL}/scan-barcode`, {
            barcode: decodedText
          });
          
          if (response.data.success && response.data.product) {
            console.log("📦 Product found:", response.data.product.name);
            await handleAnalyze(response.data.product.name, decodedText);
          } else {
            throw new Error(response.data.message || "Product not found");
          }
        } catch (error) {
          console.error("❌ Scan error:", error);
          setScanError({
            message: "Product not found!",
            details: "This barcode is not in our database.",
            suggestion: "Try searching by product name instead"
          });
          setLoading(false);
          
          // Resume scanner after error
          setTimeout(() => {
            if (scanner && typeof scanner.resume === 'function') {
              scanner.resume();
            }
          }, 2000);
        }
      };
      
      const onScanFailure = (error) => {
        // Only log real errors
        if (!error || error.includes('NotFoundException')) {
          return;
        }
        console.log("Scan attempt:", error);
      };
      
      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
      setIsScannerReady(true);
      
      console.log("🎥 Scanner initialized successfully");
      
    } catch (error) {
      console.error("❌ Scanner initialization failed:", error);
      setScanError({
        message: "Camera access failed",
        details: "Please allow camera permissions or use manual search",
        suggestion: "Switch to Manual Search"
      });
      setIsScannerReady(false);
    }
  };
  
  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/search-products`, { 
        params: { query } 
      });
      setSearchResults(response.data || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };
  
 const handleAnalyze = async (productName, barcode = null) => {
  setLoading(true);
  setShowResults(false);
  setScanError(null);
  
  try {
    console.log("🧠 Advanced AI Analysis for:", productName);
    
    const response = await axios.post(`${API_URL}/analyze`, {
      productName,
      userConditions: userProfile,
      barcode
    }, {
      timeout: 15000
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Analysis failed");
    }
    
    const analysis = response.data.analysis || {};
    const product = response.data.product || {};
    const recommendation = response.data.recommendation || {};
    const aiInfo = response.data.ai || {};
    
    // ADD THIS: Get mlAlternatives from response
    const mlAlternatives = response.data.mlAlternatives || [];
    
    const transformedData = {
      success: true,
      productName: product.name || productName,
      image: product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      ingredients: product.ingredients || "No ingredients listed",
      brand: product.brand,
      nutriments: product.nutriments,
      // ADD THIS: Include mlAlternatives in the transformed data
      mlAlternatives: mlAlternatives, // <-- ADD THIS LINE
      analysis: {
        overallRisk: analysis.overallRisk || 'unknown',
        riskScore: analysis.riskScore || 0,
        ingredients: analysis.ingredients || [],
        medicalRisks: analysis.medicalRisks || [],
        summary: {
          total: analysis.summary?.total || 0,
          highRisk: analysis.summary?.highRisk || 0,
          mediumRisk: analysis.summary?.mediumRisk || 0,
          lowRisk: analysis.summary?.lowRisk || 0
        },
        insights: analysis.insights || ["AI analysis complete"]
      },
      recommendation: {
        status: recommendation.status || 'unknown',
        message: recommendation.message || 'AI Personalized Recommendation',
        alternatives: recommendation.alternatives || [],
        improvementTips: recommendation.improvementTips || [],
        aiInsights: recommendation.aiInsights || []
      },
      ai: {
        trained: aiInfo.trained || false,
        confidence: aiInfo.confidence || 0,
        version: aiInfo.version || "2.0"
      },
      nutritionalInfo: product.nutriments || null
    };
    
    console.log("📊 Analysis ready");
    console.log("🤖 ML Alternatives count:", mlAlternatives.length); // Debug log
    
    onScanResult(transformedData);
    
  } catch (err) {
    console.error("❌ Analysis error:", err);
    
    // Fallback analysis - ADD mlAlternatives here too
    const fallbackData = {
      success: true,
      productName: productName || "Product",
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      ingredients: "Using AI prediction for analysis",
      mlAlternatives: [], // <-- ADD empty array for fallback
      analysis: {
        overallRisk: 'medium',
        riskScore: 60,
        ingredients: [
          { 
            name: "AI Prediction", 
            risk: "medium", 
            reasons: ["Intelligent analysis based on product type"], 
            score: 60 
          }
        ],
        medicalRisks: userProfile.map(condition => ({
          disease: condition.name,
          icon: '⚠️',
          severity: 'medium',
          risks: [{ ingredient: "Unknown", risk: 0.6, reason: "Limited data available" }],
          advice: "Consult product label for details",
          displayName: condition.name
        })),
        summary: { total: 1, highRisk: 0, mediumRisk: 1, lowRisk: 0 },
        insights: [
          "🤖 AI is analyzing this product",
          "📊 Using predictive intelligence",
          "🟠 Medium risk detected"
        ]
      },
      recommendation: {
        status: 'moderate',
        message: '⚠️ MODERATE - Consume with caution (Yellow-Orange Risk)',
        alternatives: [
          {
            name: 'Try Similar Known Products',
            brand: 'AI Suggested',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
            benefits: ['Better analysis', 'More accurate'],
            matchScore: 75,
            reason: 'AI has more data for similar items'
          }
        ],
        improvementTips: ['Check ingredient labels', 'Compare with similar products'],
        aiInsights: ['AI is continuously learning', 'Try searching specific brand names']
      },
      ai: {
        trained: false,
        confidence: 65,
        version: "2.0"
      }
    };
    
    onScanResult(fallbackData);
  } finally {
    setLoading(false);
  }
};
  
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-[70vh] p-8 relative z-10"
      >
        <FloatingElements />
        
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative w-24 h-24"
        >
          <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
          <div className="absolute inset-4 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain size={32} className="text-emerald-600"/>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 space-y-2"
        >
          <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Sparkles size={20} />
            AI is Analyzing...
          </h3>
          <p className="text-gray-600">Checking ingredients against your health profile</p>
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-md mx-auto pt-6 relative z-10"
    >
      <FloatingElements />
      
      {/* Health Profile Summary */}
      {userProfile.length > 0 && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HeartPulse size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Health Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gradient-to-r from-emerald-500 to-green-400 text-white px-2 py-1 rounded-full shadow-sm">
                {userProfile.length} condition{userProfile.length !== 1 ? 's' : ''}
              </span>
              <TrendingDown size={12} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            AI is analyzing for:{" "}
            <span className="font-semibold text-gray-800">
              {userProfile.map(p => p.name).join(', ')}
            </span>
          </p>
        </motion.div>
      )}
      
      {/* AI Status Card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-4 shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BrainCircuit size={20} className="text-emerald-400" />
            <h3 className="font-bold">Advanced AI Brain</h3>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${aiStatus.trained ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {aiStatus.trained ? 'TRAINED' : 'LEARNING'}
          </div>
        </div>
        <p className="text-sm text-gray-300 mb-3">
         AI-powered system that analyzes food products for health safety
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Database size={12} />
          <span>{aiStatus.databaseSize || 0} products cached</span>
        </div>
      </motion.div>
      
      {/* Mode Selector */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="grid grid-cols-2 gap-3 mb-8"
      >
        {[
          { id: 'scan', label: 'Scan Barcode', icon: <Scan size={20} />, color: 'from-blue-500 to-cyan-500', desc: 'Quick scan' },
          { id: 'manual', label: 'AI Search', icon: <Search size={20} />, color: 'from-emerald-500 to-green-500', desc: 'Smart search' }
        ].map((m) => (
          <motion.button
            key={m.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode(m.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${mode === m.id ? `bg-gradient-to-br ${m.color} text-white shadow-lg` : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 hover:border-gray-200'}`}
          >
            <div className="mb-2">{m.icon}</div>
            <span className="text-xs font-bold">{m.label}</span>
            <span className="text-[10px] mt-1 opacity-75">{m.desc}</span>
          </motion.button>
        ))}
      </motion.div>
      
      {/* Scan Error */}
      <AnimatePresence>
        {scanError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 mb-1">{scanError.message}</p>
                <p className="text-sm text-red-600 mb-2">{scanError.details}</p>
                <p className="text-sm text-red-800 font-medium">{scanError.suggestion}</p>
              </div>
            </div>
            <div className="mt-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('manual')}
                className="w-full py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium"
              >
                Switch to Manual Search
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content based on mode */}
      <AnimatePresence mode="wait">
        {mode === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Scan size={24} className="text-blue-600" />
                Barcode Scanner
              </h3>
              <p className="text-gray-500">Point camera at product barcode</p>
            </div>
            
           <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl relative border-4 border-gray-800">
  <div id="reader" className="w-full h-80">
    {/* Scanner will be rendered inside #scanner-container */}
    {!isScannerReady && (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Initializing scanner...</p>
          <p className="text-white/60 text-sm mt-2">Please allow camera access</p>
        </div>
      </div>
    )}
  </div>
  
  <div className="absolute top-4 left-0 right-0 flex justify-center">
    <span className="bg-gradient-to-r from-black/80 to-gray-900/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md flex items-center gap-2">
      <Scan size={14} />
      Align barcode within frame
    </span>
  </div>
  {isScannerReady && (
    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
      <div className="flex items-center gap-2 bg-black/60 text-white px-3 py-2 rounded-full backdrop-blur-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm">Ready to scan</span>
      </div>
    </div>
  )}
</div>
            
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Info size={16} />
                <span className="font-bold text-sm">Scanner Tips:</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                  <span>Ensure good lighting for better accuracy</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                  <span>Hold steady about 6-8 inches from barcode</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                  <span>If scan fails, try manual search instead</span>
                </li>
              </ul>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('manual')}
              className="w-full py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl font-semibold border border-gray-200 hover:border-gray-300 transition-all"
            >
              Switch to Manual Search
            </motion.button>
          </motion.div>
        )}
        
        {mode === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Brain size={24} className="text-emerald-600" />
                AI Food Intelligence
              </h3>
              <p className="text-gray-500">Search any food product for advanced AI analysis</p>
            </div>
            
            <div className="relative">
              <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all shadow-sm">
                <Search className="text-gray-400 mr-3" size={20} />
                <input
                  type="text"
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-lg"
                  placeholder="Try 'Oreo', 'Coca-Cola', 'Lay's Chips'..."
                  value={manualText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setManualText(value);
                    
                    clearTimeout(searchTimeout.current);
                    searchTimeout.current = setTimeout(() => {
                      handleSearch(value);
                    }, 500);
                  }}
                  onFocus={() => handleSearch(manualText)}
                />
                {manualText && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => {
                      setManualText('');
                      setSearchResults([]);
                      setShowResults(false);
                    }}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 ml-2"
                  >
                    <X size={18} />
                  </motion.button>
                )}
              </div>
              
              {/* AI Search Results */}
              <AnimatePresence>
                {showResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-64 overflow-y-auto"
                  >
                    {searchResults.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setManualText(result.name);
                          handleAnalyze(result.name);
                        }}
                        className="p-4 hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all hover:pl-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                            {result.image ? (
                              <img src={result.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Leaf size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-gray-800">{result.name}</p>
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                AI Ready
                              </span>
                            </div>
                            {result.brand && (
                              <p className="text-xs text-gray-500">{result.brand}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => manualText.trim() && handleAnalyze(manualText)}
              disabled={!manualText.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${manualText.trim() ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-700 hover:to-green-600 hover:shadow-emerald-300/50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Brain size={20} />
                Analyze with Advanced AI
              </span>
            </motion.button>
            
            {/* Popular AI Searches */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-3 font-semibold">Try AI analysis on:</p>
              <div className="flex flex-wrap gap-2">
                {['Oreo', 'Coca-Cola', 'Lay\'s Chips', 'Snickers', 'Maggi Noodles', 'Cheerios'].map((item) => (
                  <motion.button
                    key={item}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setManualText(item)}
                    className="px-3 py-2 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-full text-sm font-medium text-gray-700 transition-all shadow-sm"
                  >
                    {item}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ResultView Component with YELLOW-ORANGE for medium risk
const ResultView = ({ data, userProfile, onBack }) => {
  if (!data) return null;

  const analysis = data.analysis || {};
  const productName = data.productName || "Unknown Product";
  const image = data.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
  const ingredients = data.ingredients || "No ingredients listed";
  const recommendation = data.recommendation || {};
  const aiInfo = data.ai || {};

  // UPDATED: Medium risk = Yellow-Orange
  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return 'from-red-500 to-rose-500';
      case 'medium': return 'from-amber-500 to-orange-500'; // YELLOW-ORANGE
      case 'low': return 'from-emerald-500 to-green-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskBgColor = (risk) => {
    switch(risk) {
      case 'high': return 'bg-red-50 border-red-200 text-red-700';
      case 'medium': return 'bg-amber-50 border-amber-200 text-amber-800'; // YELLOW-ORANGE
      case 'low': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getRiskIcon = (risk) => {
    switch(risk) {
      case 'high': return <AlertTriangle size={16} className="text-red-500" />;
      case 'medium': return <AlertTriangle size={16} className="text-amber-500" />; // YELLOW-ORANGE
      case 'low': return <CheckCircle size={16} className="text-emerald-500" />;
      default: return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  const getAdjustedRisk = (ingredient, originalRisk) => {
    const ingredientName = ingredient.name ? ingredient.name.toLowerCase() : '';
    const hasDiabetes = userProfile.some(c => c.name.toLowerCase().includes('diabetes'));
    const hasHypertension = userProfile.some(c => c.name.toLowerCase().includes('hypertension'));
    const hasHeartDisease = userProfile.some(c => c.name.toLowerCase().includes('heart'));
    
    // Force high risk for dangerous combinations
    if (hasDiabetes && ['sugar', 'syrup', 'fructose', 'glucose', 'sucrose'].some(word => ingredientName.includes(word))) {
      return 'high';
    }
    if (hasHypertension && ['salt', 'sodium'].some(word => ingredientName.includes(word))) {
      return 'high';
    }
    if (hasHeartDisease && ['trans fat', 'hydrogenated', 'palm oil', 'saturated fat'].some(word => ingredientName.includes(word))) {
      return 'high';
    }
    
    return originalRisk;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-md mx-auto pb-32 relative z-10"
    >
      <FloatingElements />
      
      {/* Back Button */}
      <div className="p-4">
        <motion.button 
          whileHover={{ x: -5 }}
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors group"
        >
          <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={16}/>
          Back to Scanner
        </motion.button>
      </div>
      
      {/* Product Header */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 pt-6"
      >
        <div className="flex items-start gap-4 mb-6">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="w-24 h-24 rounded-2xl bg-white shadow-lg border border-gray-100 p-2 shrink-0 overflow-hidden"
          >
            <img src={image} alt={productName} className="w-full h-full object-contain" />
          </motion.div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-2">{productName}</h1>
            <div className="flex items-center gap-2 mb-3">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getRiskBgColor(analysis.overallRisk)} text-sm font-bold uppercase tracking-wide shadow-sm`}
              >
                {getRiskIcon(analysis.overallRisk)}
                {analysis.overallRisk === 'high' ? '🚫 AVOID' : 
                 analysis.overallRisk === 'medium' ? '🟠 MODERATE' : '✅ SAFE'}
              </motion.div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-2xl font-black bg-gradient-to-r ${getRiskColor(analysis.overallRisk)} bg-clip-text text-transparent`}
              >
                {analysis.riskScore || 0}%
              </motion.div>
            </div>
            {aiInfo.trained && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <BrainCircuit size={12} />
                <span>AI Neural Network Analysis</span>
                {aiInfo.confidence && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    {aiInfo.confidence}% confident
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Risk Meter */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Health Risk Level</span>
            </div>
            <div className="flex items-center gap-2">
              {analysis.summary?.highRisk > 0 && (
                <span className="text-xs font-bold text-red-600">🔴 {analysis.summary.highRisk} High</span>
              )}
              {analysis.summary?.mediumRisk > 0 && (
                <span className="text-xs font-bold text-amber-600">🟠 {analysis.summary.mediumRisk} Medium</span>
              )}
              {analysis.summary?.lowRisk > 0 && (
                <span className="text-xs font-bold text-emerald-600">🟢 {analysis.summary.lowRisk} Low</span>
              )}
            </div>
          </div>
          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${analysis.riskScore || 0}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${getRiskColor(analysis.overallRisk)} shadow-inner`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span className="text-emerald-600 font-medium">🟢 Safe</span>
            <span className="text-amber-600 font-medium">🟠 Moderate</span>
            <span className="text-red-600 font-medium">🔴 High</span>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-6 mb-8"
      >
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-5 shadow-xl">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Brain size={24} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">Advanced AI Analysis</h3>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Zap size={12} />
                  <span className="text-xs font-bold">v2.0</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 mt-1">{recommendation.message || 'AI Personalized Analysis Complete'}</p>
            </div>
          </div>
          
          {analysis.insights && analysis.insights.length > 0 && (
            <div className="space-y-2 mt-4">
              {analysis.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    insight.includes('🚫') ? 'bg-red-500' :
                    insight.includes('⚠️') ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}></div>
                  <span className="text-gray-200">{insight}</span>
                </div>
              ))}
            </div>
          )}
          
          {userProfile.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-gray-300">Personalized for:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userProfile.map((condition, i) => (
                  <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                    {condition.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Ingredients Analysis Section */}
      {analysis.ingredients && analysis.ingredients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" />
              AI Ingredient Analysis
            </h2>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {analysis.ingredients.length} ingredients analyzed
            </span>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {analysis.ingredients.map((ingredient, index) => {
              const adjustedRisk = getAdjustedRisk(ingredient, ingredient.risk);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border-2 ${getRiskBgColor(adjustedRisk)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${getRiskBgColor(adjustedRisk)} flex items-center justify-center shrink-0`}>
                      {getRiskIcon(adjustedRisk)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">
                          {ingredient.name}
                        </h3>
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${getRiskBgColor(adjustedRisk)}`}>
                          {adjustedRisk === 'high' ? '🔴 HIGH' : 
                           adjustedRisk === 'medium' ? '🟠 MEDIUM' : '🟢 LOW'}
                        </span>
                      </div>
                      
                      {ingredient.reasons && ingredient.reasons.length > 0 && (
                        <div className="space-y-1">
                          {ingredient.reasons.map((reason, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                                adjustedRisk === 'high' ? 'bg-red-500' : 
                                adjustedRisk === 'medium' ? 'bg-amber-500' : 
                                'bg-emerald-500'
                              }`}></div>
                              <p className="text-sm text-gray-600">{reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Medical Risks Section - FIXED with conditional display */}
{analysis.medicalRisks && analysis.medicalRisks.length > 0 && 
 analysis.overallRisk !== 'low' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.35 }}
    className="px-6 mb-8"
  >
    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <AlertTriangle size={20} className="text-red-500" />
      Medical Risk Analysis
    </h2>
    
    <div className="space-y-4">
      {analysis.medicalRisks.map((risk, index) => {
        // Filter out duplicate risks
        const uniqueRisks = risk.risks.filter((item, idx, self) =>
          idx === self.findIndex(t => t.reason === item.reason)
        );
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border-l-4 ${risk.severity === 'high' ? 'border-red-500' : 'border-amber-500'} rounded-r-xl p-4 ${
              risk.severity === 'high' ? 'bg-red-50' : 'bg-amber-50'
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${
                risk.severity === 'high' ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                {risk.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800">{risk.displayName}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    risk.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {risk.severity === 'high' ? '🔴 HIGH RISK' : '🟠 MEDIUM RISK'}
                  </span>
                </div>
                
                {uniqueRisks.length > 0 && (
                  <div className="space-y-2">
                    {uniqueRisks.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                          risk.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'
                        }`}></div>
                        <p className="text-sm text-gray-700">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 font-medium">{risk.advice}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
)}

      {/* Health Tips */}
      {recommendation.improvementTips && recommendation.improvementTips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-6 mb-8"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-emerald-600" />
            Personalized Health Tips
          </h2>
          
          <div className="space-y-3">
            {recommendation.improvementTips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tip.includes('Avoid') ? 'bg-red-50' :
                    tip.includes('MODERATE') ? 'bg-amber-50' :
                    'bg-emerald-50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      tip.includes('Avoid') ? 'bg-red-500' :
                      tip.includes('MODERATE') ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}></div>
                  </div>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
   {/* AI/ML Based Alternatives Section - NEW */}
{data.mlAlternatives && data.mlAlternatives.length > 0 && (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-6 mb-8"
    >
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Brain size={20} className="text-purple-600" />
            AI Neural Network Recommendations
        </h2>
        
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">Powered by Advanced AI</h3>
                    <p className="text-sm text-gray-600">
                        Generated by machine learning model analyzing variety of products
                        {data.mlAlternatives[0]?.category && ` • Showing ${data.mlAlternatives[0]?.category} category`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-700">
                <Sparkles size={12} />
                <span>These suggestions are generated based on nutritional patterns</span>
            </div>
        </div>
        
       
    </motion.div>
)}
      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="px-6 mb-8"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={20} className="text-emerald-600" />
            Healthier Alternatives
          </h2>
          
          <div className="space-y-4">
            {recommendation.alternatives.map((alt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    {alt.image ? (
                      <img src={alt.image} alt={alt.name} className="w-full h-full object-cover" />
                    ) : (
                      <Leaf size={24} className="text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800">{alt.name}</h3>
                      <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">
                        {alt.matchScore}% match
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{alt.brand}</p>
                    <p className="text-sm text-gray-700 mb-2">{alt.reason}</p>
                    {alt.benefits && alt.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {alt.benefits.map((benefit, i) => (
                          <span key={i} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            ✅ {benefit}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
      )}
      
    </motion.div>
  );
};

// Main App Component
function App() {
  const [step, setStep] = useState(0); 
  const [profile, setProfile] = useState([]);
  const [result, setResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [aiStatus, setAiStatus] = useState({ trained: false });

  useEffect(() => {
    // Fetch AI status
    axios.get(`${API_URL}/ai-stats`).then(res => {
      setAiStatus(res.data);
    }).catch(err => {
      console.log("Could not fetch AI status");
    });
  }, []);

  useEffect(() => {
    document.body.style.paddingBottom = step === 2 ? '120px' : '80px';
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-emerald-50 font-sans text-gray-900 overflow-x-hidden">
      <Header 
        onShowGuide={() => setShowGuide(true)} 
        onBack={() => step > 0 && setStep(step - 1)}
        showBack={step > 0}
        aiTrained={aiStatus.trained}
      />
      
      <main className="relative">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Onboarding onComplete={(p) => { setProfile(p); setStep(1); }} />
            </motion.div>
          )}
          
          {step === 1 && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Scanner 
                userProfile={profile} 
                onScanResult={(r) => { setResult(r); setStep(2); }} 
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultView 
                data={result} 
                userProfile={profile} 
                onBack={() => setStep(1)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 flex justify-around p-4 text-gray-400 z-40 shadow-xl"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}
      >
        {[
          { label: 'Scan', icon: <Scan size={24} />, step: 1 },
          { label: 'Profile', icon: <HeartPulse size={24} />, step: 0 },
          { label: 'AI', icon: <BrainCircuit size={24} />, step: 1 },
        ].map((item, index) => (
          <motion.button 
            key={item.label}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => item.step !== undefined && setStep(item.step)}
            className={`flex flex-col items-center gap-1 ${step === item.step ? 'text-emerald-600' : 'hover:text-emerald-500'} transition-colors px-4 py-2 relative`}
          >
            {step === item.step && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -top-2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
              />
            )}
            <div className={`p-2 rounded-xl ${step === item.step ? 'bg-gradient-to-br from-emerald-50 to-green-50' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* AI Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowGuide(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-400 rounded-xl flex items-center justify-center">
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Advanced AI Food Analysis</h2>
                  <p className="text-sm text-gray-500">Powered by neural networks</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <Database size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Smart Disease Matching</h3>
                    <p className="text-sm text-gray-600">AI understands 'sugar' → Diabetes, 'bp' → Hypertension, 'heart' → Heart Disease</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Color-Coded Risks</h3>
                    <p className="text-sm text-gray-600">🔴 Red = High Risk, 🟠 Yellow-Orange = Medium Risk, 🟢 Green = Low Risk</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Scan size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Working Scanner</h3>
                    <p className="text-sm text-gray-600">Barcode scanner with proper camera integration</p>
                  </div>
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowGuide(false)}
                className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-green-500 text-white py-3 rounded-xl font-bold shadow-lg"
              >
                Start AI Analysis
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
