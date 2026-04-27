const express = require('express');
const Experiment = require('../models/Experiment');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// AI Summary generation
router.post('/summarize', authenticate, async (req, res) => {
  try {
    const { title, objective, steps, results } = req.body;
    // Generate AI summary using built-in logic (OpenAI integration ready)
    const summary = generateSummary(title, objective, steps, results);
    const tags = generateTags(title, objective, steps);
    const recommendations = generateRecommendations(title, objective, results);
    res.json({ summary, tags, recommendations });
  } catch (error) {
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

// AI Chat assistant
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, experimentId } = req.body;
    let context = '';
    if (experimentId) {
      const exp = await Experiment.findOne({ _id: experimentId, user: req.user.id });
      if (exp) {
        context = `Experiment: ${exp.title}\nObjective: ${exp.objective}\nSteps: ${exp.steps}\nResults: ${exp.results}`;
      }
    }
    const reply = generateChatReply(message, context);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Chat failed.' });
  }
});

// AI Pattern detection
router.post('/patterns', authenticate, async (req, res) => {
  try {
    const experiments = await Experiment.find({ user: req.user.id })
      .sort('-createdAt').limit(50).lean();
    const patterns = detectPatterns(experiments);
    res.json({ patterns });
  } catch (error) {
    res.status(500).json({ error: 'Pattern detection failed.' });
  }
});

// Smart built-in AI functions (no API key needed)
function generateSummary(title, objective, steps, results) {
  const stepCount = steps ? steps.split('\n').filter(s => s.trim()).length : 0;
  const hasResults = results && results.trim().length > 0;
  let summary = `This experiment "${title}" aims to ${objective ? objective.toLowerCase().substring(0, 100) : 'explore a technical concept'}. `;
  if (stepCount > 0) summary += `The approach involves ${stepCount} documented step${stepCount > 1 ? 's' : ''}. `;
  if (hasResults) summary += `Results have been recorded and analyzed. `;
  else summary += `Results are pending documentation. `;
  summary += `Key focus areas include ${extractKeywords(title + ' ' + (objective || '')).slice(0, 3).join(', ')}.`;
  return summary;
}

function generateTags(title, objective, steps) {
  const text = `${title} ${objective || ''} ${steps || ''}`.toLowerCase();
  const tagMap = {
    'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'neural', 'ai', 'ml', 'nlp', 'gpt', 'transformer'],
    'web': ['web', 'html', 'css', 'javascript', 'react', 'frontend', 'backend', 'api', 'rest', 'http'],
    'python': ['python', 'pip', 'django', 'flask', 'pandas', 'numpy'],
    'data-science': ['data', 'analysis', 'visualization', 'statistics', 'dataset', 'csv'],
    'devops': ['docker', 'kubernetes', 'ci/cd', 'deployment', 'aws', 'cloud'],
    'mobile': ['mobile', 'android', 'ios', 'react native', 'flutter'],
    'database': ['database', 'sql', 'mongodb', 'postgres', 'redis'],
    'security': ['security', 'encryption', 'auth', 'vulnerability'],
    'testing': ['test', 'unit test', 'integration', 'qa', 'debug'],
    'algorithms': ['algorithm', 'sorting', 'search', 'optimization', 'complexity']
  };
  const tags = [];
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(k => text.includes(k))) tags.push(tag);
  }
  return tags.length > 0 ? tags : ['general'];
}

function generateRecommendations(title, objective, results) {
  const recs = [];
  if (!results || results.trim().length < 20) {
    recs.push('Document your results in detail to track progress effectively.');
  }
  recs.push('Consider adding metrics or benchmarks to quantify your results.');
  recs.push('Try comparing this approach with an alternative method.');
  recs.push('Document any challenges faced for future reference.');
  if (title && title.toLowerCase().includes('ml')) {
    recs.push('Try hyperparameter tuning to improve model performance.');
  }
  return recs.slice(0, 4);
}

function generateChatReply(message, context) {
  const msg = message.toLowerCase();
  if (msg.includes('summarize') || msg.includes('summary')) {
    return context ? `Based on your experiment: ${context.substring(0, 200)}... I'd suggest focusing on documenting key findings and metrics.` : 'Please select an experiment first so I can provide a summary.';
  }
  if (msg.includes('improve') || msg.includes('better')) {
    return 'To improve your experiments: 1) Add quantitative metrics, 2) Document failure cases, 3) Compare with baselines, 4) Iterate systematically.';
  }
  if (msg.includes('next') || msg.includes('suggest')) {
    return 'Based on your work, consider: 1) Exploring variations of your current approach, 2) Testing with different datasets, 3) Optimizing performance metrics, 4) Documenting a comprehensive comparison.';
  }
  if (msg.includes('help')) {
    return 'I can help you: summarize experiments, suggest improvements, recommend next steps, analyze patterns in your work, and answer questions about your experiments.';
  }
  return `Great question! ${context ? 'Looking at your experiment data, I recommend' : 'I suggest'} breaking this down into smaller, testable hypotheses and documenting each iteration carefully.`;
}

function detectPatterns(experiments) {
  const patterns = [];
  if (experiments.length === 0) return [{ type: 'info', message: 'Start adding experiments to see patterns.' }];

  const completed = experiments.filter(e => e.status === 'completed').length;
  const failed = experiments.filter(e => e.status === 'failed').length;
  const total = experiments.length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  patterns.push({ type: 'metric', label: 'Success Rate', value: `${successRate}%`, trend: successRate > 60 ? 'positive' : 'needs-improvement' });

  const tagCounts = {};
  experiments.forEach(e => (e.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topTags.length > 0) {
    patterns.push({ type: 'insight', label: 'Top Focus Areas', value: topTags.map(([t]) => t).join(', ') });
  }

  if (failed > completed) {
    patterns.push({ type: 'warning', label: 'High Failure Rate', value: 'Consider reviewing methodology', trend: 'negative' });
  }

  const recentDates = experiments.slice(0, 7).map(e => new Date(e.createdAt));
  if (recentDates.length >= 2) {
    const avgGap = recentDates.reduce((sum, d, i) => i > 0 ? sum + (recentDates[i - 1] - d) : sum, 0) / (recentDates.length - 1);
    const gapDays = Math.round(avgGap / (1000 * 60 * 60 * 24));
    patterns.push({ type: 'metric', label: 'Avg. Experiment Frequency', value: `Every ${gapDays || 1} days` });
  }

  return patterns;
}

function extractKeywords(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'my']);
  return text.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w)).slice(0, 10);
}

module.exports = router;
