const { execSync } = require('child_process');

try {
  console.log('Starting merge of feat/omr-computational-grading into main...');

  const result = execSync('git merge feat/omr-computational-grading --no-edit', {
    cwd: 'c:\\Users\\Omkaar\\Desktop\\Projects\\EduAI_Suite',
    encoding: 'utf8'
  });

  console.log('Merge output:', result);
  console.log('Merge completed successfully!');
} catch (error) {
  console.error('Error during merge:', error.message);
  process.exit(1);
}
