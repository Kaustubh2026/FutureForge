import React, { useState, useRef } from 'react';

/**
 * Component to display the generated roadmap with collapsible sections
 * @param {Object} props
 * @param {string} props.roadmapContent - The markdown content from Gemini API
 */
const RoadmapOutput = ({ roadmapContent }) => {
  // Initialize all sections as expanded by default
  const [expandedSections, setExpandedSections] = useState({});
  const roadmapRef = useRef(null);

  // Parse the roadmap content into sections
  const sections = roadmapContent
    .split(/^## /m)
    .filter(Boolean)
    .map((section, index) => {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      // Initialize all sections as expanded
      if (expandedSections[index] === undefined) {
        expandedSections[index] = true;
      }
      
      return { id: index, title, content };
    });

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    });
  };

  // Expand all sections
  const expandAll = () => {
    const allExpanded = {};
    sections.forEach(section => {
      allExpanded[section.id] = true;
    });
    setExpandedSections(allExpanded);
  };

  // Collapse all sections
  const collapseAll = () => {
    const allCollapsed = {};
    sections.forEach(section => {
      allCollapsed[section.id] = false;
    });
    setExpandedSections(allCollapsed);
  };

  // Generate PDF from content
  const generatePDF = () => {
    // This is a simplified approach that prepares the content for download as PDF
    // In a real implementation, you would use a library like jsPDF or html2pdf.js
    
    // Create a hidden element with roadmap content for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Learning Roadmap</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #2563eb;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            h2 {
              color: #4b5563;
              margin-top: 25px;
            }
            ul, ol {
              padding-left: 25px;
            }
            li {
              margin-bottom: 8px;
            }
            p {
              margin-bottom: 16px;
            }
            .section {
              margin-bottom: 30px;
            }
          </style>
        </head>
        <body>
          <h1>Learning Roadmap</h1>
          ${sections.map(section => `
            <div class="section">
              <h2>${section.title}</h2>
              <div>${section.content.replace(/\n\n/g, '<p>').replace(/\n/g, '<br>')}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a short delay to allow content to load
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Format content with proper list rendering
  const formatContent = (content) => {
    // Handle different types of content formatting
    return content.split('\n\n').map((paragraph, idx) => {
      // Check if this paragraph is a list
      if (paragraph.trim().startsWith('- ') || paragraph.trim().match(/^\d+\./)) {
        // It's a list, render as a list
        const listItems = paragraph
          .split('\n')
          .filter(item => item.trim())
          .map((item, itemIdx) => (
            <li key={itemIdx} dangerouslySetInnerHTML={{ 
              __html: item.replace(/^-\s+|^\d+\.\s+/, '')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>') 
            }} />
          ));
          
        return paragraph.trim().startsWith('- ') ? 
          <ul key={idx} className="list-items">{listItems}</ul> : 
          <ol key={idx} className="list-items">{listItems}</ol>;
      }
      
      // Handle markdown for bold and italic in regular paragraphs
      const formattedParagraph = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Regular paragraph
      return <p key={idx} dangerouslySetInnerHTML={{ __html: formattedParagraph }} />;
    });
  };

  if (!roadmapContent) {
    return null;
  }

  return (
    <div className="roadmap-output" ref={roadmapRef}>
      <div className="roadmap-header">
        <h2>Your Personalized Learning Path</h2>
        <div className="control-buttons">
          <button onClick={expandAll} className="control-button">Expand All</button>
          <button onClick={collapseAll} className="control-button">Collapse All</button>
        </div>
      </div>

      <div className="roadmap-sections">
        {sections.map((section) => (
          <div 
            key={section.id} 
            className={`roadmap-section ${expandedSections[section.id] ? 'expanded' : ''}`}
          >
            <div 
              className="section-header"
              onClick={() => toggleSection(section.id)}
            >
              <h3>{section.title}</h3>
              <button className="toggle-button">
                {expandedSections[section.id] ? '−' : '+'}
              </button>
            </div>
            
            <div className={`section-content ${expandedSections[section.id] ? 'visible' : ''}`}>
              {formatContent(section.content)}
            </div>
          </div>
        ))}
      </div>

      <div className="roadmap-actions">
        <button className="action-button" onClick={() => window.print()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print Roadmap
        </button>
        <button 
          className="action-button"
          onClick={generatePDF}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download PDF
        </button>
      </div>

      <style jsx>{`
        .roadmap-output {
          background-color: #fff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          margin-top: 30px;
        }
        
        .roadmap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .roadmap-output h2 {
          font-size: 24px;
          color: #1a1a1a;
          margin: 0;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        
        .control-buttons {
          display: flex;
          gap: 10px;
        }
        
        .control-button {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .control-button:hover {
          background-color: #e5e7eb;
          color: #1f2937;
        }
        
        .roadmap-sections {
          margin-bottom: 25px;
        }
        
        .roadmap-section {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          margin-bottom: 16px;
          overflow: hidden;
          transition: box-shadow 0.3s;
        }
        
        .roadmap-section:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background-color: #f9fafb;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .section-header:hover {
          background-color: #f3f4f6;
        }
        
        .expanded .section-header {
          border-bottom: 1px solid #e5e7eb;
          background-color: #f3f4f6;
        }
        
        .section-header h3 {
          margin: 0;
          font-size: 18px;
          color: #3b82f6;
          font-weight: 600;
        }
        
        .toggle-button {
          background: none;
          border: 1px solid #d1d5db;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-button:hover {
          background-color: #e5e7eb;
          color: #374151;
        }
        
        .section-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }
        
        .section-content.visible {
          max-height: 2000px;
          transition: max-height 0.5s ease-in;
          padding: 20px;
        }
        
        .section-content p {
          margin: 0 0 16px;
          line-height: 1.7;
          color: #4b5563;
          font-size: 16px;
          text-align: left;
        }
        
        .section-content p:last-child {
          margin-bottom: 0;
        }
        
        .section-content strong {
          color: #1f2937;
          font-weight: 600;
        }
        
        .list-items {
          margin: 0 0 16px;
          padding-left: 25px;
          text-align: left;
        }
        
        .list-items li {
          margin-bottom: 10px;
          line-height: 1.6;
          color: #4b5563;
        }
        
        .list-items li strong {
          color: #1f2937;
          font-weight: 600;
        }
        
        .roadmap-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background-color: #f9fafb;
          color: #3b82f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-button:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .action-button svg {
          color: #4b5563;
        }
        
        @media (max-width: 768px) {
          .roadmap-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .roadmap-output {
            padding: 20px;
          }
          
          .section-content.visible {
            padding: 15px;
          }
        }
        
        @media print {
          .roadmap-actions, .control-buttons, .toggle-button {
            display: none;
          }
          
          .roadmap-section {
            break-inside: avoid;
            border: none;
            margin-bottom: 20px;
          }
          
          .section-header {
            background-color: transparent;
            padding: 0 0 10px 0;
            border-bottom: 1px solid #000;
          }
          
          .section-content {
            max-height: none !important;
            display: block !important;
            padding: 15px 0 !important;
          }
          
          .expanded .section-header {
            border-bottom: 1px solid #000;
            background-color: transparent;
          }
        }
      `}</style>
    </div>
  );
};

export default RoadmapOutput;