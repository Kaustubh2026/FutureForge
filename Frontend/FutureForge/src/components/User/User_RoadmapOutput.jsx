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
    ? roadmapContent
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
        })
    : [];

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
            .milestone {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .milestone-title {
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .resource {
              padding-left: 20px;
              position: relative;
            }
            .resource::before {
              content: '🔖';
              position: absolute;
              left: 0;
            }
            .resource-link {
              color: #2563eb;
              text-decoration: underline;
            }
            .project {
              background-color: #e8f4ff;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 15px;
            }
            .price-tag {
              display: inline-block;
              padding: 2px 6px;
              font-size: 12px;
              border-radius: 4px;
              margin-left: 8px;
              font-weight: bold;
            }
            .free {
              background-color: #ecfdf5;
              color: #059669;
            }
            .paid {
              background-color: #eff6ff;
              color: #3b82f6;
            }
          </style>
        </head>
        <body>
          <h1>Learning Roadmap</h1>
          ${sections.map(section => `
            <div class="section">
              <h2>${section.title}</h2>
              <div>${formatContentForHTML(section.content)}</div>
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

  // Format content for HTML export (used in PDF generation)
  const formatContentForHTML = (content) => {
    // Replace markdown links with HTML links
    let formattedContent = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="resource-link" target="_blank">$1</a>');
    
    // Replace bold text
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Add paragraph tags
    formattedContent = formattedContent.replace(/\n\n/g, '</p><p>');
    
    // Convert lists to HTML lists
    const lines = formattedContent.split('\n');
    let inList = false;
    let listType = '';
    let result = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('- ')) {
        if (!inList || listType !== 'ul') {
          if (inList) result += `</${listType}>`;
          result += '<ul>';
          inList = true;
          listType = 'ul';
        }
        result += `<li>${line.trim().substring(2)}</li>`;
      } else if (line.trim().match(/^\d+\./)) {
        if (!inList || listType !== 'ol') {
          if (inList) result += `</${listType}>`;
          result += '<ol>';
          inList = true;
          listType = 'ol';
        }
        result += `<li>${line.trim().replace(/^\d+\.\s*/, '')}</li>`;
      } else {
        if (inList) {
          result += `</${listType}>`;
          inList = false;
        }
        result += line + ' ';
      }
    }
    
    if (inList) {
      result += `</${listType}>`;
    }
    
    return `<p>${result}</p>`;
  };

  // Detect resource type (Free/Paid) and add badges
  const getResourceType = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('free') || lowerText.includes('$0') || lowerText.includes('$free')) {
      return { type: 'free', label: 'FREE' };
    } else if (lowerText.includes('$') || lowerText.includes('paid') || lowerText.includes('premium')) {
      // Try to extract price
      const priceMatch = lowerText.match(/\$(\d+\.?\d*)/);
      const price = priceMatch ? `$${priceMatch[1]}` : 'PAID';
      return { type: 'paid', label: price };
    }
    return null;
  };

  // Enhanced format content with proper list rendering, link support and emoji support
  const formatContent = (content, sectionTitle) => {
    // Handle different types of content formatting
    return content.split('\n\n').map((paragraph, idx) => {
      // Special handling for milestones
      if (sectionTitle.includes('Milestone') && paragraph.includes('**Milestone')) {
        return (
          <div key={idx} className="milestone-card">
            <div dangerouslySetInnerHTML={{ 
              __html: paragraph
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="resource-link">$1</a>')
            }} />
          </div>
        );
      }
      
      // Special handling for projects
      if (sectionTitle.includes('Project') && paragraph.includes('**Project')) {
        return (
          <div key={idx} className="project-card">
            <div dangerouslySetInnerHTML={{ 
              __html: paragraph
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="resource-link">$1</a>')
            }} />
          </div>
        );
      }
      
      // Check if this paragraph is a list
      if (paragraph.trim().startsWith('- ') || paragraph.trim().match(/^\d+\./)) {
        // It's a list, render as a list
        const listItems = paragraph
          .split('\n')
          .filter(item => item.trim())
          .map((item, itemIdx) => {
            // Parse links in list items
            const processedItem = item
              .replace(/^-\s+|^\d+\.\s+/, '')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="resource-link">$1</a>');
            
            // Add resource type badge if it's in the resources section
            let resourceTypeBadge = '';
            if (sectionTitle.includes('Resources') && (item.includes('🔖') || item.includes('**['))) {
              const resourceType = getResourceType(item);
              if (resourceType) {
                resourceTypeBadge = `<span class="price-tag ${resourceType.type}">${resourceType.label}</span>`;
              }
            }
            
            return (
              <li key={itemIdx} dangerouslySetInnerHTML={{ 
                __html: processedItem + resourceTypeBadge
              }} />
            );
          });
          
        return paragraph.trim().startsWith('- ') ? 
          <ul key={idx} className="list-items">{listItems}</ul> : 
          <ol key={idx} className="list-items">{listItems}</ol>;
      }
      
      // Handle markdown for bold, links, etc. in regular paragraphs
      const formattedParagraph = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="resource-link">$1</a>');
      
      // Regular paragraph
      return <p key={idx} dangerouslySetInnerHTML={{ __html: formattedParagraph }} />;
    });
  };

  // Get card color class based on section title
  const getSectionColorClass = (title) => {
    if (title.includes('Overview')) return 'overview-section';
    if (title.includes('Milestones')) return 'milestones-section';
    if (title.includes('Resources')) return 'resources-section';
    if (title.includes('Time')) return 'time-section';
    if (title.includes('Projects')) return 'projects-section';
    if (title.includes('Assessment')) return 'assessment-section';
    return '';
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
            className={`roadmap-section ${expandedSections[section.id] ? 'expanded' : ''} ${getSectionColorClass(section.title)}`}
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
              {formatContent(section.content, section.title)}
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

      <style>
        {`
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
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .control-button:hover {
          background-color: #e5e7eb;
        }
        
        .roadmap-sections {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .roadmap-section {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.3s;
        }
        
        .roadmap-section:hover {
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
        
        .section-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .toggle-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          padding: 0;
        }
        
        .section-content {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease-out;
          padding: 0 20px;
        }
        
        .section-content.visible {
          padding: 20px;
          max-height: 2000px;
          opacity: 1;
        }
        
        .list-items {
          margin: 0;
          padding-left: 20px;
        }
        
        .list-items li {
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .roadmap-actions {
          display: flex;
          gap: 10px;
          margin-top: 25px;
          justify-content: flex-end;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 15px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .action-button:hover {
          background-color: #2563eb;
        }
        
        /* Section-specific styling */
        .overview-section .section-header {
          background-color: #f0f9ff;
          border-left: 4px solid #38bdf8;
        }
        
        .milestones-section .section-header {
          background-color: #f0fdfa;
          border-left: 4px solid #10b981;
        }
        
        .resources-section .section-header {
          background-color: #fdf2f8;
          border-left: 4px solid #ec4899;
        }
        
        .time-section .section-header {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
        }
        
        .projects-section .section-header {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
        }
        
        .assessment-section .section-header {
          background-color: #f5f3ff;
          border-left: 4px solid #8b5cf6;
        }
        
        /* Styled milestone cards */
        .milestone-card {
          background-color: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          border-left: 3px solid #10b981;
        }
        
        .project-card {
          background-color: #fff7ed;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          border-left: 3px solid #f97316;
        }
        
        /* Resource styling */
        .resource-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .resource-link:hover {
          text-decoration: underline;
          color: #1d4ed8;
        }
        
        .price-tag {
          display: inline-block;
          padding: 2px 6px;
          font-size: 11px;
          border-radius: 4px;
          margin-left: 6px;
          vertical-align: middle;
        }
        
        .free {
          background-color: #ecfdf5;
          color: #059669;
        }
        
        .paid {
          background-color: #eff6ff;
          color: #3b82f6;
        }
        
        /* Print styles */
        @media print {
          .roadmap-output {
            box-shadow: none;
            padding: 0;
          }
          
          .control-buttons,
          .roadmap-actions,
          .toggle-button {
            display: none;
          }
          
          .section-content {
            max-height: none;
            opacity: 1;
            padding: 20px !important;
          }
          
          .roadmap-section {
            break-inside: avoid;
            margin-bottom: 30px;
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .roadmap-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .control-buttons {
            width: 100%;
          }
          
          .control-button {
            flex: 1;
            text-align: center;
          }
          
          .roadmap-actions {
            flex-direction: column;
          }
          
          .action-button {
            width: 100%;
            justify-content: center;
          }
        }
        `}
      </style>
    </div>
  );
};

export default RoadmapOutput;