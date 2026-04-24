const fs = require('fs');
const path = require('path');

function expandHome(filePath) {
  if (filePath.startsWith('~')) {
    return path.join(require('os').homedir(), filePath.slice(1));
  }
  return filePath;
}

function scanRules(centralRepo) {
  const rulesDir = path.join(centralRepo, 'rules');
  if (!fs.existsSync(rulesDir)) return [];
  return fs.readdirSync(rulesDir)
    .filter(f => fs.statSync(path.join(rulesDir, f)).isFile())
    .map(f => ({
      name: f,
      path: path.join(rulesDir, f),
    }));
}

function scanSkills(centralRepo) {
  const skillsDir = path.join(centralRepo, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir)
    .filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory())
    .map(f => ({
      name: f,
      path: path.join(skillsDir, f),
    }));
}

function getSyncStatus(centralRepo, editor) {
  const rules = scanRules(centralRepo);
  const skills = scanSkills(centralRepo);
  const result = { rules: [], skills: [] };

  const rulesDir = editor.rulesDir ? expandHome(editor.rulesDir) : null;
  const skillsDir = editor.skillsDir ? expandHome(editor.skillsDir) : null;

  for (const rule of rules) {
    if (!rulesDir) { result.rules.push({ ...rule, synced: false, targetPath: null }); continue; }
    const targetPath = path.join(rulesDir, rule.name);
    const synced = isSymlink(targetPath, rule.path);
    result.rules.push({ ...rule, synced, targetPath });
  }

  for (const skill of skills) {
    if (!skillsDir) { result.skills.push({ ...skill, synced: false, targetPath: null }); continue; }
    const targetPath = path.join(skillsDir, skill.name);
    const synced = isSymlink(targetPath, skill.path);
    result.skills.push({ ...skill, synced, targetPath });
  }

  return result;
}

function isSymlink(targetPath, expectedSource) {
  try {
    const stat = fs.lstatSync(targetPath);
    if (!stat.isSymbolicLink()) return false;
    const linkTarget = fs.readlinkSync(targetPath);
    // Resolve both to absolute for comparison
    const resolved = path.resolve(path.dirname(targetPath), linkTarget);
    const expected = path.resolve(expectedSource);
    return resolved.toLowerCase() === expected.toLowerCase();
  } catch {
    return false;
  }
}

module.exports = { expandHome, scanRules, scanSkills, getSyncStatus, isSymlink };
