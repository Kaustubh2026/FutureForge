// Using fetch instead of axios
/**
 * Generates a learning roadmap using the Gemini AI API
 * @param {Array} currentSkills - Array of skills the student already has
 * @param {Array} learningGoals - Array of topics/skills the student wants to learn
 * @returns {Promise<string>} - The generated roadmap as markdown text
 */
export const generateLearningRoadmap = async (currentSkills, learningGoals) => {
  try {
    // Your Gemini API key
    const GEMINI_API_KEY = 'AIzaSyCdcHMapMuYy3_IDDtA4-gRPVksqUKxe1Y';
    
    // Updated endpoint with the gemini-2.0-flash model
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a detailed learning roadmap for a student with the following skills: ${currentSkills.join(', ')}. 
                        They want to learn: ${learningGoals.join(', ')}. 
                        
                        Structure the response with clear sections using emojis for visual appeal:
                        1. ## 🌟 Overview of the Learning Path
                           Provide a concise summary of the entire learning journey.
                        
                        2. ## 🛣️ Step-by-Step Learning Milestones
                           Break down the learning journey into at least 4 sequential milestones.
                           Each milestone should be preceded by an emoji icon (e.g., 🔍, ⚒️, 🧩, 🏆).
                           Format each milestone as "**Milestone 1: [Title]**" (use double asterisks for bold).
                        
                        3. ## 📚 Recommended Resources 
                           List specific resources for each milestone including:
                           - Books with authors
                           - Online courses with ACTUAL links (e.g., Coursera, Udemy, edX)
                           - Tutorials with links
                           - Documentation with links
                           
                           For each resource use this exact format:
                           - 🔖 **[Resource Name](actual URL)**: Brief description of what it covers
                           
                           Include at least one FREE and one PAID resource for each milestone.
                           For online courses, include links to actual courses on platforms like:
                           - Coursera: https://www.coursera.org/search?query=[topic]
                           - Udemy: https://www.udemy.com/courses/search/?src=ukw&q=[topic]
                           - edX: https://www.edx.org/search?q=[topic]
                           - freeCodeCamp: https://www.freecodecamp.org/
                           - Khan Academy: https://www.khanacademy.org/
                        
                        4. ## ⏱️ Time Commitment 
                           Provide realistic timeframes for each milestone.
                           Include both weekly time commitment and total duration.
                           Format as "**Milestone 1**: [X] hours/week, approximately [Y] weeks"
                        
                        5. ## 🛠️ Practice Projects
                           Suggest at least one hands-on project for each milestone.
                           Make projects progressively more complex to reinforce learning.
                           Each project should include clear objectives and expected outcomes.
                           Format as "**Project X**: [Title] - Description"
                        
                        6. ## 🎓 Assessment & Progress Tracking
                           Provide methods for the student to evaluate their progress.
                           Include success metrics for each milestone.
                           Format as "**Milestone X Success Metrics**:" followed by bullet points
                        
                        IMPORTANT FORMATTING RULES:
                        1. Use double asterisks for bold (**text**) and NEVER use single asterisks.
                        2. For any emphasis, use double asterisks, not single asterisks.
                        3. When providing links, use markdown format: [text](URL)
                        4. Don't include any stray or unmatched asterisks.
                        5. Keep paragraphs concise and use bullet points where appropriate.
                        6. For all emojis, ensure there's a space after the emoji.
                        7. Make sure all sections are properly formatted with markdown headings (##).
                        8. Provide REAL, working links for resources - substitute [topic] with the actual topic name.
                        9. Include costs for paid resources (e.g., "$FREE", "$9.99-$12.99", etc.)`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown API error'}`);
    }

    // Extract the generated text from the response
    const data = await response.json();
    let roadmapText = data.candidates[0].content.parts[0].text;
    
    // Fix any potential asterisk issues
    roadmapText = fixAsteriskFormatting(roadmapText);
    
    return roadmapText;
    
  } catch (error) {
    console.error('Error generating roadmap with Gemini API:', error);
    
    // Handle different types of errors with meaningful messages
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    } else if (error.message.includes('API key')) {
      throw new Error('API authentication error. Please check your API key.');
    } else if (error.message.includes('429')) {
      throw new Error('Too many requests. Please try again later.');
    } else {
      throw new Error(`Error: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Fixes any asterisk formatting issues in the roadmap content
 * @param {string} content - The roadmap content text
 * @returns {string} - Properly formatted roadmap content
 */
const fixAsteriskFormatting = (content) => {
  // Replace any single asterisks with double asterisks
  let fixedContent = content.replace(/(?<!\*)\*(?!\*)/g, '**');
  
  // Ensure all bold sections have closing asterisks
  const boldMarkers = fixedContent.match(/\*\*/g);
  if (boldMarkers && boldMarkers.length % 2 !== 0) {
    // If there's an odd number of ** markers, add a closing ** at the end of the content
    fixedContent += '**';
  }
  
  // Make sure links are properly formatted
  fixedContent = fixedContent.replace(/\[([^\]]+)\]\s*\(([^)]+)\)/g, '[$1]($2)');
  
  return fixedContent;
};

/**
 * Handles formatting the roadmap content if needed
 * @param {string} roadmapContent - Raw roadmap content from Gemini
 * @returns {string} - Formatted roadmap content
 */
export const formatRoadmapContent = (roadmapContent) => {
  // If Gemini doesn't properly format with markdown, we can add formatting here
  let formattedContent = roadmapContent;
  
  // Ensure there are proper section headers if missing
  if (!formattedContent.includes('## ')) {
    const sections = [
      '🌟 Overview',
      '🛣️ Learning Milestones',
      '📚 Recommended Resources',
      '⏱️ Time Commitment',
      '🛠️ Practice Projects',
      '🎓 Assessment & Progress Tracking'
    ];
    
    // Split content into paragraphs
    const paragraphs = formattedContent.split('\n\n').filter(p => p.trim());
    
    // Create a new formatted content with proper headers
    formattedContent = '';
    sections.forEach((section, index) => {
      if (index < paragraphs.length) {
        formattedContent += `## ${section}\n\n${paragraphs[index]}\n\n`;
      }
    });
  }
  
  // Apply additional formatting fixes
  formattedContent = fixAsteriskFormatting(formattedContent);
  
  return formattedContent;
};

export default { generateLearningRoadmap, formatRoadmapContent };