const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
const APP_URL = 'http://localhost:3000';
const RESULTS_DIR = path.join(__dirname, '..', 'results');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR);
}

const aditya = {
  name: 'Aditya',
  email: `aditya_${Date.now()}@example.com`,
  password: 'password123'
};

async function seedData(token) {
  console.log('Seeding data...');
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Create Project
  const { data: { project } } = await api.post('/projects', {
    name: 'Machine Learning Portfolio',
    description: 'Various ML experiments and models',
    icon: '🤖',
    color: '#8b5cf6'
  });

  // Generate experiments over the last 6 months
  const now = new Date();
  const experiments = [];

  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Simulate learning curve (newer experiments have higher success)
    let status, rating;
    if (daysAgo < 30) {
      status = Math.random() > 0.2 ? 'completed' : 'in-progress';
      rating = Math.floor(Math.random() * 3) + 7; // 7-9
    } else if (daysAgo < 90) {
      status = Math.random() > 0.4 ? 'completed' : 'failed';
      rating = Math.floor(Math.random() * 4) + 5; // 5-8
    } else {
      status = Math.random() > 0.6 ? 'completed' : 'failed';
      rating = Math.floor(Math.random() * 4) + 3; // 3-6
    }

    experiments.push({
      title: `Experiment ${i + 1}: ${['Neural Network', 'Decision Tree', 'Clustering', 'API Build', 'React UI'][i % 5]}`,
      objective: 'Testing out various approaches and documenting results.',
      steps: '1. Data prep\n2. Model training\n3. Evaluation',
      results: status === 'completed' ? 'Successfully implemented and achieved 90% accuracy.' : 'Failed due to memory issues.',
      status: status,
      tags: [['ai', 'ml'], ['web', 'react'], ['python', 'data-science'], ['devops']][i % 4],
      successRating: rating,
      project: project._id,
      createdAt: date,
      updatedAt: date
    });
  }

  // We need to bypass the API for setting createdAt, but we can just use the DB directly since we have access,
  // OR we can just inject it into the DB directly using mongoose since we are in the backend dir.
  
  // Wait, directly connecting to in-memory mongodb from another script is hard because the URI is inside the server process.
  // Instead of a script, let's create a special endpoint in the backend to seed data!
}

async function run() {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Take Login Page Screenshot
  console.log('Navigating to login...');
  await page.goto(`${APP_URL}/login`);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(RESULTS_DIR, '01_login_page.png') });
  console.log('Login screenshot saved.');

  // 2. Signup Aditya
  console.log('Signing up as Aditya...');
  try {
    const { data } = await axios.post(`${API_URL}/auth/signup`, aditya);
    
    // We will trigger a seed endpoint we are about to create
    console.log('Triggering data seed...');
    await axios.post(`${API_URL}/auth/seed-demo-data`, { email: aditya.email });

    // Set local storage via Puppeteer to log in
    await page.evaluate((token, user) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, data.token, data.user);
    
    // 3. Go to Dashboard
    console.log('Navigating to dashboard...');
    await page.goto(`${APP_URL}/dashboard`);
    await new Promise(r => setTimeout(r, 3000)); // Wait for animations and charts
    await page.screenshot({ path: path.join(RESULTS_DIR, '02_dashboard.png') });
    console.log('Dashboard screenshot saved.');

  } catch (error) {
    console.error('Error during automation:', error.message);
  }

  await browser.close();
  console.log('Done!');
}

run();
