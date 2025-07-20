# Face Tracking Studio

Real-time face detection with video recording capabilities using React and face-api.js.

## Features

- ✅ Real-time face detection
- ✅ Face bounding boxes with landmarks
- ✅ Video recording with face overlays
- ✅ Multiple video format support (WebM, MP4)
- ✅ Download recorded videos
- ✅ Responsive design

## Technologies Used

- React 18
- face-api.js
- MediaRecorder API
- Canvas API
- Tailwind CSS
- Lucide React Icons

## Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/USERNAME/REPO_NAME.git
   cd REPO_NAME
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Download face-api.js models:
   - Create a `public/models` folder
   - Download models from [face-api.js models](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
   - Place model files in `public/models/`

4. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Allow camera permissions when prompted
2. Wait for face detection models to load
3. Position yourself in front of the camera
4. Click "Start Recording" to begin recording
5. Face detection boxes will appear around detected faces
6. Click "Stop Recording" to finish
7. Download your recorded videos

## Browser Compatibility

- Chrome 60+ (Recommended)
- Firefox 55+
- Safari 14+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## License

MIT License - see LICENSE file for details
\`\`\`

## Future Updates: Making Changes and Pushing

After making changes to your code:

```bash
# Check what files changed
git status

# Add specific files or all files
git add .
# or
git add src/components/VideoPlayer.js

# Commit with descriptive message
git commit -m "Fix video recording blank screen issue"

# Push to GitHub
git push origin main
