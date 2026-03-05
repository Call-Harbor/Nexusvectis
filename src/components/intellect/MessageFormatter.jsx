import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Zap, AlertCircle } from "lucide-react";

export default function MessageFormatter({ content, isAssistant }) {
  if (!content || typeof content !== 'string') return null;

  // Remove excessive emojis and system markers
  let cleanedContent = content
    .replace(/^[\s\n]*[🔬🧠⚡🎯📊💡🔴🟠🟡💰📈⏱️✓]*\s*/gm, '')
    .trim();

  // Detect message type
  const isFindingText = cleanedContent.toLowerCase().includes('finding') || cleanedContent.toLowerCase().includes('root cause');
  const isRecommendation = cleanedContent.toLowerCase().includes('expected outcome') || cleanedContent.toLowerCase().includes('action');
  const isExecutive = cleanedContent.toLowerCase().includes('executive') || cleanedContent.toLowerCase().includes('summary');
  const isTechnical = cleanedContent.toLowerCase().includes('methodology') || cleanedContent.toLowerCase().includes('technical');

  // Parse markdown into proper paragraphs
  const formatParagraphs = (text) => {
    // Split by double newlines to preserve paragraph breaks
    return text.split(/\n\n+/).filter(p => p.trim());
  };

  const parseStructuredContent = (text) => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      if (line.match(/^#+\s/)) {
        // Header line
        if (currentSection) sections.push({ type: 'section', title: currentSection, content: currentContent });
        currentSection = line.replace(/^#+\s/, '').trim();
        currentContent = [];
      } else if (line.trim()) {
        currentContent.push(line);
      }
    }
    if (currentSection) sections.push({ type: 'section', title: currentSection, content: currentContent });
    return sections;
  };

  const sections = parseStructuredContent(cleanedContent);

  return (
    <div className="space-y-4 text-slate-100 text-base leading-relaxed">
      {sections.length > 0 ? (
        sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3">
            {section.title && (
              <h3 className="text-white font-bold text-lg flex items-center gap-2 mt-4">
                {isFindingText && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isRecommendation && <Zap className="w-5 h-5 text-emerald-400" />}
                {isExecutive && <TrendingUp className="w-5 h-5 text-cyan-400" />}
                {isTechnical && <AlertCircle className="w-5 h-5 text-violet-400" />}
                {!isFindingText && !isRecommendation && !isExecutive && !isTechnical && <Sparkles className="w-5 h-5 text-cyan-400" />}
                {section.title}
              </h3>
            )}
            
            <div className="space-y-2">
              {section.content.map((line, lIdx) => {
                if (!line.trim()) return null;
                
                // Detect if this is a bullet point or list item
                if (line.match(/^[\s]*[-•*]\s/)) {
                  return (
                    <div key={lIdx} className="flex gap-3 pl-2">
                      <span className="text-cyan-400 flex-shrink-0 mt-1">•</span>
                      <p className="text-slate-200">{line.replace(/^[\s]*[-•*]\s/, '')}</p>
                    </div>
                  );
                }
                
                // Bold text detection
                if (line.includes('**')) {
                  return (
                    <p key={lIdx} className="text-slate-200">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <span>{children}</span>,
                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="text-slate-300 italic">{children}</em>,
                          code: ({ children }) => <code className="bg-slate-800 px-2 py-0.5 rounded text-slate-200 text-sm font-mono">{children}</code>
                        }}
                      >
                        {line}
                      </ReactMarkdown>
                    </p>
                  );
                }
                
                return <p key={lIdx} className="text-slate-200">{line}</p>;
              })}
            </div>
          </div>
        ))
      ) : (
        // Fallback for simple content without structure
        <div className="space-y-3">
          {formatParagraphs(cleanedContent).map((para, idx) => (
            <p key={idx} className="text-slate-200">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <span>{children}</span>,
                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-slate-300 italic">{children}</em>,
                  code: ({ children }) => <code className="bg-slate-800 px-2 py-0.5 rounded text-slate-200 text-sm font-mono">{children}</code>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 ml-2">{children}</ul>,
                  li: ({ children }) => <li className="text-slate-200">{children}</li>
                }}
              >
                {para}
              </ReactMarkdown>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}