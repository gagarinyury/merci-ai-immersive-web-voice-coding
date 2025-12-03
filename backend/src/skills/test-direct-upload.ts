import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/env.js';

async function testDirectUpload() {
  const skillContent = await fs.readFile(
    path.join(process.cwd(), 'backend/skills/test-micro/SKILL.md'),
    'utf-8'
  );

  const formData = new FormData();

  // Попробуем разные варианты paths
  const blob = new Blob([skillContent], { type: 'text/markdown' });

  const skillFile1 = new File([blob], 'SKILL.md', { type: 'text/markdown' });
  const skillFile2 = new File([blob], 'test/SKILL.md', { type: 'text/markdown' });
  const skillFile3 = new File([blob], './SKILL.md', { type: 'text/markdown' });

  const readmeFile = new File(
    [new Blob(['# Test'], { type: 'text/markdown' })],
    'README.md',
    { type: 'text/markdown' }
  );

  // Try different paths
  console.log('\n=== Test 1: SKILL.md (no path) ===');
  const formData1 = new FormData();
  formData1.append('files[]', skillFile1);
  formData1.append('display_title', 'Test Micro Skill');
  await testUpload(formData1);

  console.log('\n=== Test 2: test/SKILL.md (with dir) ===');
  const formData2 = new FormData();
  formData2.append('files[]', skillFile2);
  formData2.append('display_title', 'Test Micro Skill');
  await testUpload(formData2);

  console.log('\n=== Test 3: ./SKILL.md (relative) ===');
  const formData3 = new FormData();
  formData3.append('files[]', skillFile3);
  formData3.append('display_title', 'Test Micro Skill');
  await testUpload(formData3);

}

async function testUpload(formData: FormData) {
  console.log('📤 Sending direct request to Skills API...');

  const response = await fetch('https://api.anthropic.com/v1/skills', {
    method: 'POST',
    headers: {
      'x-api-key': config.anthropic.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'skills-2025-10-02',
    },
    body: formData,
  });

  const result = await response.json();
  console.log('Response status:', response.status);
  console.log('Response:', JSON.stringify(result, null, 2));
}

testDirectUpload().catch(console.error);
