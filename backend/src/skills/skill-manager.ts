import Anthropic, { toFile } from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/env.js';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

const SKILL_DIR = path.join(process.cwd(), 'backend/skills/test-micro');  // TEMPORARY: test with micro skill
const SKILL_ID_FILE = path.join(process.cwd(), '.skill-id');

interface SkillFile {
  path: string;
  content: Buffer;
}

/**
 * Recursively get all files from skill directory
 */
async function getSkillFiles(dir: string, baseDir: string = dir): Promise<SkillFile[]> {
  const files: SkillFile[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively get files from subdirectories
      const subFiles = await getSkillFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      // Read file content
      const content = await fs.readFile(fullPath);
      // Store relative path from skill base directory
      const relativePath = path.relative(baseDir, fullPath);
      files.push({ path: relativePath, content });
    }
  }

  return files;
}

/**
 * Upload IWSDK Skill to Claude API
 */
export async function uploadSkill(): Promise<string> {
  try {
    console.log('📦 Loading skill files from:', SKILL_DIR);

    // Get all files from skill directory
    const skillFiles = await getSkillFiles(SKILL_DIR);

    console.log(`✓ Found ${skillFiles.length} files`);

    // Convert to Uploadable format using toFile()
    const files = await Promise.all(
      skillFiles.map(file =>
        toFile(file.content, file.path, { type: 'text/markdown' })
      )
    );

    console.log('⬆️  Uploading skill to Claude API...');
    console.log(`📄 Files to upload: ${files.map(f => f.name).join(', ')}`);

    // Debug: intercept fetch to see what's being sent
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: any, init: any) => {
      if (url.toString().includes('/skills')) {
        console.log('🔍 DEBUG: Request to Skills API');
        console.log('URL:', url);

        if (init?.body) {
          // Try to get FormData entries
          try {
            let fieldCount = 0;
            const entries = [];
            for (const [key, value] of (init.body as any).entries()) {
              fieldCount++;
              const valueInfo = value instanceof File
                ? `File(${value.name}, ${value.size} bytes)`
                : value instanceof Blob
                ? `Blob(${value.size} bytes)`
                : typeof value === 'object'
                ? `Object(${JSON.stringify(value).length} chars)`
                : `${typeof value}`;
              entries.push(`  ${fieldCount}. ${key}: ${valueInfo}`);

              // Log first 10 fields
              if (fieldCount <= 10) {
                console.log(`  ${fieldCount}. ${key}: ${valueInfo}`);
              }
            }
            console.log(`📊 Total FormData fields: ${fieldCount}`);

            if (fieldCount > 10) {
              console.log('  ... (showing first 10 of', fieldCount, 'fields)');
            }
          } catch (e) {
            console.log('Could not iterate FormData:', e);
          }
        }
      }

      const result = await originalFetch(url, init);

      // Restore original fetch
      (global as any).fetch = originalFetch;

      return result;
    };

    // Create skill
    const skill = await anthropic.beta.skills.create({
      display_title: 'IWSDK Scene Generator',
      files,
      betas: ['skills-2025-10-02'],
    });

    console.log('✅ Skill uploaded successfully!');
    console.log('   Skill ID:', skill.id);
    console.log('   Version:', skill.latest_version);

    // Save skill ID to file for future use
    await fs.writeFile(SKILL_ID_FILE, skill.id);

    return skill.id;
  } catch (error) {
    console.error('❌ Failed to upload skill:', error);
    throw error;
  }
}

/**
 * Update existing skill with new version
 */
export async function updateSkill(skillId: string): Promise<string> {
  try {
    console.log('📦 Loading skill files from:', SKILL_DIR);

    const skillFiles = await getSkillFiles(SKILL_DIR);
    console.log(`✓ Found ${skillFiles.length} files`);

    // Convert to Uploadable format using toFile()
    const files = await Promise.all(
      skillFiles.map(file =>
        toFile(file.content, file.path, { type: 'text/markdown' })
      )
    );

    console.log('⬆️  Creating new skill version...');

    // Create new version
    const version = await anthropic.beta.skills.versions.create(skillId, {
      files,
      betas: ['skills-2025-10-02'],
    });

    console.log('✅ Skill updated successfully!');
    console.log('   Skill ID:', skillId);
    console.log('   New Version:', version.version);

    return version.version;
  } catch (error) {
    console.error('❌ Failed to update skill:', error);
    throw error;
  }
}

/**
 * Get saved skill ID or upload new skill
 */
export async function getOrCreateSkillId(): Promise<string> {
  try {
    // Try to read existing skill ID
    const skillId = await fs.readFile(SKILL_ID_FILE, 'utf-8');
    console.log('✓ Using existing skill ID:', skillId.trim());
    return skillId.trim();
  } catch {
    // Skill ID doesn't exist, upload new skill
    console.log('ℹ️  No existing skill found, uploading...');
    return await uploadSkill();
  }
}

/**
 * List all skills
 */
export async function listSkills() {
  try {
    const skills = [];
    for await (const skill of anthropic.beta.skills.list({
      betas: ['skills-2025-10-02'],
    })) {
      skills.push(skill);
    }
    return skills;
  } catch (error) {
    console.error('❌ Failed to list skills:', error);
    throw error;
  }
}
