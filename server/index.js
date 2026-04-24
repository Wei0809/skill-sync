const express = require('express');
const fs = require('fs');
const path = require('path');
const { expandHome, scanRules, scanSkills, getSyncStatus } = require('./lib/scanner');
const { syncRulesToEditor, syncSkillsToEditor, unsyncFromEditor } = require('./lib/linker');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// --- API Routes ---

// Get config
app.get('/api/config', (req, res) => {
  res.json(loadConfig());
});

// Update central repo
app.put('/api/config/repo', (req, res) => {
  const config = loadConfig();
  config.centralRepo = req.body.centralRepo;
  saveConfig(config);
  res.json({ status: 'ok' });
});

// Get editors
app.get('/api/editors', (req, res) => {
  const config = loadConfig();
  res.json(config.editors);
});

// Update editor
app.put('/api/editors/:id', (req, res) => {
  const config = loadConfig();
  const idx = config.editors.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Editor not found' });
  config.editors[idx] = { ...config.editors[idx], ...req.body };
  saveConfig(config);
  res.json({ status: 'ok' });
});

// Add editor
app.post('/api/editors', (req, res) => {
  const config = loadConfig();
  const editor = {
    id: req.body.id || req.body.name.toLowerCase().replace(/\s+/g, '-'),
    name: req.body.name,
    rulesDir: req.body.rulesDir || '',
    skillsDir: req.body.skillsDir || '',
    enabled: true,
  };
  if (config.editors.find(e => e.id === editor.id)) {
    return res.status(400).json({ error: 'Editor ID already exists' });
  }
  config.editors.push(editor);
  saveConfig(config);
  res.json({ status: 'ok', editor });
});

// Delete editor
app.delete('/api/editors/:id', (req, res) => {
  const config = loadConfig();
  config.editors = config.editors.filter(e => e.id !== req.params.id);
  saveConfig(config);
  res.json({ status: 'ok' });
});

// Scan central repo
app.get('/api/scan', (req, res) => {
  const config = loadConfig();
  if (!config.centralRepo) return res.json({ rules: [], skills: [] });
  res.json({
    rules: scanRules(config.centralRepo),
    skills: scanSkills(config.centralRepo),
  });
});

// Get full sync status (all editors × all rules/skills)
app.get('/api/status', (req, res) => {
  const config = loadConfig();
  if (!config.centralRepo) return res.json([]);
  const status = config.editors
    .filter(e => e.enabled)
    .map(editor => ({
      editor: { id: editor.id, name: editor.name },
      ...getSyncStatus(config.centralRepo, editor),
    }));
  res.json(status);
});

// Get status for one editor
app.get('/api/status/:editorId', (req, res) => {
  const config = loadConfig();
  const editor = config.editors.find(e => e.id === req.params.editorId);
  if (!editor) return res.status(404).json({ error: 'Editor not found' });
  if (!config.centralRepo) return res.json({ rules: [], skills: [] });
  res.json(getSyncStatus(config.centralRepo, editor));
});

// Sync
app.post('/api/sync', (req, res) => {
  const config = loadConfig();
  if (!config.centralRepo) return res.status(400).json({ error: 'No central repo configured' });

  const { editorIds, rules, skills } = req.body;
  const results = {};

  for (const editorId of editorIds) {
    const editor = config.editors.find(e => e.id === editorId);
    if (!editor || !editor.enabled) continue;
    results[editorId] = {};
    if (rules && rules.length > 0) {
      results[editorId].rules = syncRulesToEditor(config.centralRepo, editor, rules);
    }
    if (skills && skills.length > 0) {
      results[editorId].skills = syncSkillsToEditor(config.centralRepo, editor, skills);
    }
  }

  res.json({ status: 'ok', results });
});

// Unsync
app.post('/api/unsync', (req, res) => {
  const config = loadConfig();
  const { editorIds, rules, skills } = req.body;
  const results = {};

  for (const editorId of editorIds) {
    const editor = config.editors.find(e => e.id === editorId);
    if (!editor) continue;
    results[editorId] = {};
    if (rules && rules.length > 0) {
      results[editorId].rules = unsyncFromEditor(editor, rules, 'rule');
    }
    if (skills && skills.length > 0) {
      results[editorId].skills = unsyncFromEditor(editor, skills, 'skill');
    }
  }

  res.json({ status: 'ok', results });
});

const PORT = 3456;
app.listen(PORT, () => {
  console.log(`Skill Sync running at http://localhost:${PORT}`);
});
