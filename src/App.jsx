import React, { useState, useMemo, useEffect } from 'react';
import { Info, Settings, RefreshCw } from 'lucide-react';

const factorial = (n) => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

const comb = (n, k) => {
  return factorial(n) / (factorial(k) * factorial(n - k));
};

const DAE11_LE_WEIGHT = 0.5035;
const DAE11_TE_THICKNESS = 0.0001;
const DAE11_UPPER = [0.1703, 0.1527, 0.5168, 0.0921, 0.6690, 0.1435, 0.2899, 0.1621];
const DAE11_LOWER = [-0.1631, -0.1440, 0.0890, -0.0706, 0.0974, 0.0147, 0.0789, 0.0808];

const SliderGroup = ({ weights, isUpper, onWeightChange }) => {
  const containerClass = isUpper ? 'bg-purple-50 border-purple-100' : 'bg-red-50 border-red-100';
  const dotClass = isUpper ? 'bg-purple-500' : 'bg-red-500';
  const accentClass = isUpper ? 'accent-purple-500' : 'accent-red-500';

  return (
    <div className={`p-4 rounded-lg border ${containerClass} flex-1`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/50">
        <div className={`w-3 h-3 rounded-full ${dotClass}`}></div>
        <h3 className="font-semibold text-slate-800">{isUpper ? 'Upper' : 'Lower'} Weights</h3>
        <span className="ml-auto text-xs text-slate-400">{weights.length} weights</span>
      </div>
      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {weights.map((w, i) => (
          <div key={`${isUpper ? 'u' : 'l'}-${i}`} className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 w-10 text-right shrink-0">
              A{i}
            </label>
            <input 
              type="range" 
              min={isUpper ? "-0.5" : "-1.0"} 
              max={isUpper ? "1.0" : "0.5"} 
              step="0.001"
              value={w}
              onChange={(e) => onWeightChange(i, isUpper, e.target.value)}
              className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200 ${accentClass}`}
            />
            <input 
              type="number" 
              value={w}
              step="0.001"
              onChange={(e) => onWeightChange(i, isUpper, e.target.value)}
              className="w-16 p-0.5 text-right text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const CSTVisualiser = () => {
  const [weightsCount, setWeightsCount] = useState(8);
  const [inputCount, setInputCount] = useState("8");
  const [leWeight, setLeWeight] = useState(DAE11_LE_WEIGHT);
  const [teThickness, setTeThickness] = useState(DAE11_TE_THICKNESS);
  
  const [upperWeights, setUpperWeights] = useState([...DAE11_UPPER]);
  const [lowerWeights, setLowerWeights] = useState([...DAE11_LOWER]);

  const handleUpdateOrder = () => {
    const count = parseInt(inputCount);
    if (!isNaN(count) && count >= 3 && count <= 21) {
      setWeightsCount(count);
      const uPts = [];
      const lPts = [];
      const n = count - 1;
      for (let i = 0; i <= n; i++) {
        const t = i / n; 
        uPts.push(parseFloat((0.2 * Math.pow(1-t,2) + 0.4*t*(1-t)).toFixed(3)));
        lPts.push(parseFloat((-0.2 * Math.pow(1-t,2) - 0.15*t*(1-t)).toFixed(3)));
      }
      uPts[n] = 0;
      lPts[n] = 0;
      setUpperWeights(uPts);
      setLowerWeights(lPts);
    }
  };

  const { upperPts, lowerPts } = useMemo(() => {
    const numPoints = 400;
    const uPts = [];
    const lPts = [];
    const teHalf = teThickness / 2;
    const order = weightsCount - 1;
    const K_LE = weightsCount + 0.5;
    
    for (let i = 0; i <= numPoints; i++) {
      const beta = (i / numPoints) * Math.PI;
      const psi = 0.5 * (1.0 - Math.cos(beta));
      const C = Math.sqrt(psi) * (1 - psi);
      
      let S_upper = 0;
      let S_lower = 0;
      
      for (let j = 0; j <= order; j++) {
        const K = comb(order, j);
        const basis = K * Math.pow(psi, j) * Math.pow(1 - psi, order - j);
        S_upper += upperWeights[j] * basis;
        S_lower += lowerWeights[j] * basis;
      }
      
      const leTerm = leWeight * psi * Math.pow(1 - psi, K_LE);
      
      uPts.push({ x: psi, y: C * S_upper + leTerm + psi * teHalf });
      lPts.push({ x: psi, y: C * S_lower + leTerm - psi * teHalf });
    }
    
    return { upperPts: uPts, lowerPts: lPts };
  }, [weightsCount, upperWeights, lowerWeights, leWeight, teThickness]);

  const width = 800;
  const height = 400;
  const padding = 40;
  const plotWidth = width - padding * 2;
  const scaleX = (val) => padding + val * plotWidth;
  
  // EQUAL SCALE: y=1 is same pixels as x=1
  const scaleY = (val) => (height / 2) - (val * plotWidth); 

  const generatePaths = () => {
    if (upperPts.length === 0) return { upper: "", lower: "", fill: "" };
    
    let dUpper = `M ${scaleX(upperPts[0].x)} ${scaleY(upperPts[0].y)}`;
    upperPts.forEach(p => dUpper += ` L ${scaleX(p.x)} ${scaleY(p.y)}`);
    
    let dLower = `M ${scaleX(lowerPts[0].x)} ${scaleY(lowerPts[0].y)}`;
    lowerPts.forEach(p => dLower += ` L ${scaleX(p.x)} ${scaleY(p.y)}`);
    
    let dFill = dUpper;
    for (let i = lowerPts.length - 1; i >= 0; i--) {
        dFill += ` L ${scaleX(lowerPts[i].x)} ${scaleY(lowerPts[i].y)}`;
    }
    dFill += " Z";

    return { upper: dUpper, lower: dLower, fill: dFill };
  };

  const paths = generatePaths();

  const handleWeightChange = (index, isUpper, value) => {
    const val = parseFloat(value);
    if (isNaN(val)) return;
    if (isUpper) {
      const newW = [...upperWeights];
      newW[index] = val;
      setUpperWeights(newW);
    } else {
      const newW = [...lowerWeights];
      newW[index] = val;
      setLowerWeights(newW);
    }
  };

  return (
    <div className="flex flex-col p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">CST Airfoil Visualiser</h2>
          <p className="text-slate-600 text-sm">
            <strong>DAE-11</strong> (Equal Scale). Cosine Spacing.
          </p>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <Settings className="w-4 h-4 text-slate-400" />
              <label className="text-sm font-medium text-slate-700">Weights Count (N+1):</label>
              <input 
                type="number" 
                min="3" max="21" 
                value={inputCount}
                onChange={(e) => setInputCount(e.target.value)}
                className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-mono text-sm focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={handleUpdateOrder}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>
        </div>
      </div>

      <div className="relative w-full bg-slate-50 rounded-lg border border-slate-200 mb-6 overflow-hidden h-[400px] flex items-center justify-center">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full block">
          <g stroke="#e2e8f0" strokeWidth="1">
            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(v => (
              <line key={`v-${v}`} x1={scaleX(v)} y1={padding} x2={scaleX(v)} y2={height-padding} strokeDasharray={v % 0.5 === 0 ? "" : "2 2"} />
            ))}
            <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#94a3b8" strokeDasharray="4 4" />
          </g>

          <path d={paths.fill} fill="rgba(147, 51, 234, 0.05)" stroke="none" />
          <path d={paths.upper} fill="none" stroke="#9333ea" strokeWidth="2.5" />
          <path d={paths.lower} fill="none" stroke="#ef4444" strokeWidth="2.5" />
          
          <text x={scaleX(0)} y={height/2 + 20} fontSize="12" fill="#64748b" textAnchor="middle">LE</text>
          <text x={scaleX(1)} y={height/2 + 20} fontSize="12" fill="#64748b" textAnchor="middle">TE</text>
        </svg>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        <div className="flex flex-col gap-4">
            <SliderGroup weights={upperWeights} isUpper={true} onWeightChange={handleWeightChange} />
            
            <div className="p-4 rounded-lg border bg-purple-50/50 border-purple-100">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-purple-700 uppercase tracking-wide">LE Mod Weight</label>
                    <input 
                        type="number" step="0.0001" value={leWeight}
                        onChange={(e) => setLeWeight(parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-purple-200 rounded text-right font-mono text-sm focus:outline-none focus:border-purple-400"
                    />
                </div>
                <input 
                    type="range" min="-2.0" max="2.0" step="0.001" value={leWeight}
                    onChange={(e) => setLeWeight(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-purple-200 text-purple-500"
                />
            </div>
        </div>

        <div className="flex flex-col gap-4">
            <SliderGroup weights={lowerWeights} isUpper={false} onWeightChange={handleWeightChange} />

            <div className="p-4 rounded-lg border bg-red-50/50 border-red-100">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-red-700 uppercase tracking-wide">TE Thickness (Δζ)</label>
                    <input 
                        type="number" step="0.0001" value={teThickness}
                        onChange={(e) => setTeThickness(parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-red-200 rounded text-right font-mono text-sm focus:outline-none focus:border-red-400"
                    />
                </div>
                <input 
                    type="range" min="0" max="0.02" step="0.0001" value={teThickness}
                    onChange={(e) => setTeThickness(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-red-200 text-red-500"
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default CSTVisualiser;