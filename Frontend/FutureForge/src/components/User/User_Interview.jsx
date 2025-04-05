import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, LinearProgress, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DoneIcon from '@mui/icons-material/Done';
import axios from 'axios';
import AICircle from './AICircle';
import './User_Interview.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#03a9f4',
    }
  },
});

const User_Interview = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [scores, setScores] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [averageScore, setAverageScore] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

  useEffect(() => {
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      setAverageScore(avg);
    }
  }, [scores]);
  
  useEffect(() => {
    if (questions.length > 0 && currentQuestion < questions.length) {
      speakText(questions[currentQuestion]);
    }
  }, [questions, currentQuestion]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      const formData = new FormData();
      formData.append('resume', file);

      try {
        setIsLoading(true);
        const response = await axios.post('http://localhost:5000/api/interview/generate-questions', formData);
        if (response.data.questions && response.data.questions.length > 0) {
          setQuestions(response.data.questions);
        } else {
          alert('No questions were generated. Please try again with a different resume.');
        }
      } catch (error) {
        console.error('Error uploading resume:', error);
        alert('Error uploading resume. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const speakText = async (text) => {
    if (isSpeaking) return;
    
    try {
      setIsSpeaking(true);
      await axios.post('http://localhost:5000/api/interview/text-to-speech', {
        text
      });
      
      setTimeout(() => {
        setIsSpeaking(false);
      }, 2000);
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    try {
      await axios.post('http://localhost:5000/api/interview/start-recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      alert('Failed to start recording. Please check your microphone.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/interview/stop-recording', {
        question: questions[currentQuestion]
      });
      
      const data = response.data;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const newScore = data.score || 0;
      setScores([...scores, newScore]);
      setCurrentFeedback(data);
      
      const result = {
        question: questions[currentQuestion],
        answer: data.answer || "No answer recorded",
        evaluation: data
      };
      
      setResults([...results, result]);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      alert(`Error evaluating answer: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(curr => curr + 1);
      setCurrentFeedback(null);
    } else {
      finishInterview();
    }
  };

  const handleSkipQuestion = () => {
    setSkippedQuestions([...skippedQuestions, currentQuestion]);
    
    const result = {
      question: questions[currentQuestion],
      answer: "Question skipped",
      evaluation: {
        score: 0,
        feedback: "This question was skipped.",
        strengths: [],
        areas_for_improvement: ["Skipped this question"]
      }
    };
    
    setResults([...results, result]);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(curr => curr + 1);
      setCurrentFeedback(null);
    } else {
      finishInterview();
    }
  };

  const finishInterview = () => {
    setInterviewComplete(true);
    setShowSummary(true);
  };

  const generateSummary = () => {
    if (results.length === 0) return null;
    
    let allStrengths = [];
    let allWeaknesses = [];
    let topicStrengths = {};
    let topicWeaknesses = {};
    
    results.forEach(result => {
      const strengths = result.evaluation.strengths || [];
      const weaknesses = result.evaluation.areas_for_improvement || [];
      
      const questionWords = result.question.toLowerCase().split(' ');
      const potentialTopics = questionWords.filter(word => 
        word.length > 3 && !['what', 'when', 'where', 'which', 'your', 'have', 'that', 'this', 'with', 'about'].includes(word)
      );
      
      const topic = potentialTopics[0] || 'general';
      
      strengths.forEach(strength => {
        allStrengths.push(strength);
        
        if (!topicStrengths[topic]) {
          topicStrengths[topic] = [];
        }
        topicStrengths[topic].push(strength);
      });
      
      weaknesses.forEach(weakness => {
        allWeaknesses.push(weakness);
        
        if (!topicWeaknesses[topic]) {
          topicWeaknesses[topic] = [];
        }
        topicWeaknesses[topic].push(weakness);
      });
    });
    
    const strengthFrequency = {};
    const weaknessFrequency = {};
    
    allStrengths.forEach(s => {
      strengthFrequency[s] = (strengthFrequency[s] || 0) + 1;
    });
    
    allWeaknesses.forEach(w => {
      weaknessFrequency[w] = (weaknessFrequency[w] || 0) + 1;
    });
    
    const topStrengths = Object.entries(strengthFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    const topWeaknesses = Object.entries(weaknessFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    const topicSummary = {};
    const allTopics = [...new Set([...Object.keys(topicStrengths), ...Object.keys(topicWeaknesses)])];
    
    allTopics.forEach(topic => {
      topicSummary[topic] = {
        strengths: topicStrengths[topic] || [],
        weaknesses: topicWeaknesses[topic] || []
      };
    });
    
    return {
      topStrengths,
      topWeaknesses,
      topicSummary,
      averageScore,
      totalQuestions: questions.length,
      answeredQuestions: results.length - skippedQuestions.length,
      skippedQuestions: skippedQuestions.length
    };
  };

  const isLastQuestion = currentQuestion === questions.length - 1;
  const isQuestionSkipped = skippedQuestions.includes(currentQuestion);
  const summary = generateSummary();

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <AICircle isSpeaking={isSpeaking} isProcessing={isLoading} />
          
          {!questions.length ? (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
                Upload your resume to start the AI interview
              </Typography>
              <input
                accept=".doc,.docx"
                style={{ display: 'none' }}
                id="resume-upload"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="resume-upload">
                <Button variant="contained" component="span" size="large">
                  Upload Resume
                </Button>
              </label>
              {uploadedFile && (
                <Typography sx={{ mt: 2 }}>
                  Uploaded: {uploadedFile.name}
                </Typography>
              )}
              {isLoading && <LinearProgress sx={{ mt: 4 }} />}
            </Box>
          ) : (
            <Box>
              {!interviewComplete ? (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }} className="question-card">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" gutterBottom>
                      Question {currentQuestion + 1} of {questions.length}
                      {isQuestionSkipped && (
                        <Typography component="span" sx={{ ml: 2, color: 'warning.main', fontStyle: 'italic' }}>
                          (Skipped)
                        </Typography>
                      )}
                    </Typography>
                    <Tooltip title="Read question aloud">
                      <IconButton 
                        onClick={() => speakText(questions[currentQuestion])}
                        disabled={isSpeaking}
                        color="primary"
                      >
                        <VolumeUpIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, fontSize: '1.2rem' }}>
                    {questions[currentQuestion]}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color={isRecording ? "secondary" : "primary"}
                      startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading || isSpeaking}
                      className={`recording-button ${isRecording ? 'recording-active' : ''}`}
                      size="large"
                    >
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </Button>

                    {!currentFeedback && !isRecording && (
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<SkipNextIcon />}
                        onClick={handleSkipQuestion}
                        disabled={isLoading || isSpeaking}
                        size="large"
                      >
                        Skip Question
                      </Button>
                    )}

                    {currentFeedback && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<NavigateNextIcon />}
                        onClick={handleNextQuestion}
                        disabled={isLoading || isRecording}
                        size="large"
                      >
                        {isLastQuestion ? "Finish Interview" : "Next Question"}
                      </Button>
                    )}
                  </Box>

                  {isLoading && <LinearProgress sx={{ mt: 2 }} />}

                  {currentFeedback && (
                    <Box sx={{ mt: 3 }} className="feedback-section">
                      <Typography variant="h6">Feedback:</Typography>
                      <Typography variant="h4" sx={{ color: 'primary.main' }}>
                        Score: {currentFeedback.score}/10
                      </Typography>
                      
                      {currentFeedback.keywords_found && currentFeedback.keywords_found.length > 0 && (
                        <>
                          <Typography variant="subtitle1" sx={{ mt: 1 }}>
                            Keywords Used:
                          </Typography>
                          <Typography>
                            {currentFeedback.keywords_found.join(', ')}
                          </Typography>
                        </>
                      )}
                      
                      {currentFeedback.keywords_missing && currentFeedback.keywords_missing.length > 0 && (
                        <>
                          <Typography variant="subtitle1" sx={{ mt: 1 }}>
                            Missing Keywords:
                          </Typography>
                          <Typography>
                            {currentFeedback.keywords_missing.join(', ')}
                          </Typography>
                        </>
                      )}
                      
                      {currentFeedback.feedback && (
                        <Typography sx={{ mt: 1 }}>
                          {currentFeedback.feedback}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              ) : (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AssessmentIcon sx={{ fontSize: 30, mr: 1, color: 'info.main' }} />
                    <Typography variant="h4" component="h2">
                      Interview Summary
                    </Typography>
                  </Box>
                  
                  <Typography variant="h5" sx={{ mt: 3, color: 'primary.main' }}>
                    Overall Score: {averageScore.toFixed(2)}/10
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Questions answered: {summary?.answeredQuestions} of {summary?.totalQuestions}
                    </Typography>
                    <Typography variant="body2">
                      Questions skipped: {summary?.skippedQuestions}
                    </Typography>
                  </Box>
                  
                  <Typography variant="h6" sx={{ mt: 3, fontWeight: 'bold' }}>
                    Your Key Strengths:
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    {summary?.topStrengths?.map((strength, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DoneIcon sx={{ color: 'success.main', mr: 1 }} />
                        <Typography>{strength}</Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Typography variant="h6" sx={{ mt: 3, fontWeight: 'bold' }}>
                    Areas for Improvement:
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    {summary?.topWeaknesses?.map((weakness, index) => (
                      <Typography key={index} sx={{ mb: 1 }}>• {weakness}</Typography>
                    ))}
                  </Box>
                  
                  <Typography variant="h6" sx={{ mt: 3, fontWeight: 'bold' }}>
                    Topic-Based Analysis:
                  </Typography>
                  {summary?.topicSummary && Object.entries(summary.topicSummary).map(([topic, data], index) => (
                    <Box key={index} sx={{ mt: 2, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {topic}:
                      </Typography>
                      
                      {data.strengths.length > 0 && (
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            Strengths:
                          </Typography>
                          {data.strengths.slice(0, 2).map((s, i) => (
                            <Typography key={i} variant="body2" sx={{ ml: 2 }}>• {s}</Typography>
                          ))}
                        </Box>
                      )}
                      
                      {data.weaknesses.length > 0 && (
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                            Areas to improve:
                          </Typography>
                          {data.weaknesses.slice(0, 2).map((w, i) => (
                            <Typography key={i} variant="body2" sx={{ ml: 2 }}>• {w}</Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                  
                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => window.location.reload()}
                    >
                      Start New Interview
                    </Button>
                  </Box>
                </Paper>
              )}

              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Current Average Score: {averageScore.toFixed(2)}/10
                  </Typography>
                  {skippedQuestions.length > 0 && (
                    <Typography variant="body2" sx={{ color: 'warning.main' }}>
                      Questions skipped: {skippedQuestions.length}
                    </Typography>
                  )}
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={averageScore * 10} 
                  sx={{ height: 10, borderRadius: 5 }}
                  className="progress-bar"
                />
              </Box>
            </Box>
          )}
        </Box>
      </Container>

      <Dialog 
        open={showSummary && !interviewComplete} 
        onClose={() => setShowSummary(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 1 }} />
            Interview Complete!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Your Final Score: {averageScore.toFixed(2)}/10
          </Typography>
          
          <Typography>
            You've completed the interview! Click "View Full Summary" to see a detailed analysis
            of your performance, including strengths and areas for improvement.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummary(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              setShowSummary(false);
              setInterviewComplete(true);
            }}
          >
            View Full Summary
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default User_Interview; 