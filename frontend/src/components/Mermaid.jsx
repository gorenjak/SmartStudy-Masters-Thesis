import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useTranslation } from 'react-i18next';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'base', 
  logLevel: 5,
  fontFamily: 'Inter, sans-serif',
  themeVariables: {
    primaryColor: '#dbeafe',
    primaryTextColor: '#334155',
    primaryBorderColor: '#cbd5e1', 
    lineColor: '#cbd5e1',
    fontSize: '16px',
    mainBkg: '#ffffff',
    
    cScale0: '#f0f4ff',
    cScale1: '#fce7f3',
    cScale2: '#f0fdf4',
    cScale3: '#fef3c7',
    cScale4: '#faf5ff',
    cScale5: '#fff7ed',
    cScale6: '#ecfeff',
    cScale7: '#f8fafc',
    
    cScaleLabelColor0: '#334155',
    cScaleLabelColor1: '#334155',
    cScaleLabelColor2: '#334155',
    cScaleLabelColor3: '#334155',
    cScaleLabelColor4: '#334155',
    cScaleLabelColor5: '#334155',
    cScaleLabelColor6: '#334155',
    cScaleLabelColor7: '#334155',
  },
  mindmap: {
    useMaxWidth: true,
    padding: 20,
  }
});

const Mermaid = ({ chart }) => {
  const { t } = useTranslation();
  const ref = useRef(null);
  const previousChartRef = useRef('');

  useEffect(() => {
    const renderChart = async () => {
      if (!ref.current || !chart) return;

      try {
        let cleanChart = chart.trim();
        cleanChart = cleanChart.replace(/```mermaid/g, '').replace(/```/g, '').trim();

        const mindmapIndex = cleanChart.toLowerCase().indexOf("mindmap");
        if (mindmapIndex !== -1) {
          cleanChart = cleanChart.substring(mindmapIndex);
        }

        if (previousChartRef.current === cleanChart) {
          return;
        }

        previousChartRef.current = cleanChart;

        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanChart);
        
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid syntax error:", err);
        if (ref.current) {
          ref.current.innerHTML = `
            <div class="flex flex-col items-center p-6 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span class="text-xs font-bold uppercase tracking-widest mb-2">${t('visual_error_title')}</span>
              <p class="text-[10px] italic">${t('visual_error_desc')}</p>
            </div>`;
        }
      }
    };

    renderChart();
  }, [chart, t]);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden">
      <div 
        className="mermaid-container flex justify-center w-full transition-all duration-500 overflow-hidden rounded-[24px]" 
        ref={ref}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs font-medium animate-pulse">
            {t('loading_visual')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Mermaid);