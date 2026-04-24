const fs = require('fs');
const path = require('path');
const { expandHome } = require('./scanner');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createSymlink(source, target) {
  const targetDir = path.dirname(target);
  ensureDir(targetDir);

  // Check if target already exists (including dangling symlinks)
  let stat;
  try {
    stat = fs.lstatSync(target);
  } catch {
    // Target does not exist at all — safe to create symlink
    stat = null;
  }

  if (stat) {
    if (stat.isSymbolicLink()) {
      const existing = fs.readlinkSync(target);
      const resolved = path.resolve(targetDir, existing);
      if (resolved.toLowerCase() === path.resolve(source).toLowerCase()) {
        return { status: 'skipped', message: 'Already linked' };
      }
      // Dangling or wrong symlink — remove and recreate
      fs.unlinkSync(target);
    } else {
      // Conflict: non-symlink file/dir exists
      return { status: 'conflict', message: 'Target exists and is not a symlink to source' };
    }
  }

  try {
    const sourceStat = fs.statSync(source);
    const linkType = sourceStat.isDirectory() ? 'junction' : 'file';
    fs.symlinkSync(source, target, linkType);
    return { status: 'ok', message: 'Symlink created' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

function removeSymlink(targetPath) {
  try {
    const stat = fs.lstatSync(targetPath);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(targetPath);
      return { status: 'ok', message: 'Symlink removed' };
    }
    return { status: 'skip', message: 'Not a symlink' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

function syncRulesToEditor(centralRepo, editor, selectedRules) {
  const results = [];
  const rulesDir = editor.rulesDir ? expandHome(editor.rulesDir) : null;
  if (!rulesDir) return [{ status: 'error', message: 'Editor has no rulesDir configured' }];

  for (const ruleName of selectedRules) {
    const source = path.join(centralRepo, 'rules', ruleName);
    const target = path.join(rulesDir, ruleName);
    if (!fs.existsSync(source)) {
      results.push({ name: ruleName, ...{ status: 'error', message: 'Source not found' } });
      continue;
    }
    results.push({ name: ruleName, ...createSymlink(source, target) });
  }
  return results;
}

function syncSkillsToEditor(centralRepo, editor, selectedSkills) {
  const results = [];
  const skillsDir = editor.skillsDir ? expandHome(editor.skillsDir) : null;
  if (!skillsDir) return [{ status: 'error', message: 'Editor has no skillsDir configured' }];

  for (const skillName of selectedSkills) {
    const source = path.join(centralRepo, 'skills', skillName);
    const target = path.join(skillsDir, skillName);
    if (!fs.existsSync(source)) {
      results.push({ name: skillName, ...{ status: 'error', message: 'Source not found' } });
      continue;
    }
    results.push({ name: skillName, ...createSymlink(source, target) });
  }
  return results;
}

function unsyncFromEditor(editor, items, type) {
  const dirKey = type === 'rule' ? 'rulesDir' : 'skillsDir';
  const dir = editor[dirKey] ? expandHome(editor[dirKey]) : null;
  if (!dir) return [{ status: 'error', message: `Editor has no ${dirKey} configured` }];

  const results = [];
  for (const name of items) {
    const target = path.join(dir, name);
    results.push({ name, ...removeSymlink(target) });
  }
  return results;
}

module.exports = { createSymlink, removeSymlink, syncRulesToEditor, syncSkillsToEditor, unsyncFromEditor };
