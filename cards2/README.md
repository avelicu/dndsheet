# D&D Spell Card Creator

A React-based application for creating custom D&D spell cards.

## Features

- **Class and Level Selection**: Choose from D&D classes and spell levels (including cantrips)
- **Page Management**: Create and manage multiple pages for spell cards
- **Print-Ready**: Optimized CSS for printing with proper page sizing
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
src/
├── components/
│   ├── ClassLevelSelector.jsx    # Class and level selection interface
│   ├── ClassLevelSelector.css
│   ├── Page.jsx                  # Individual page component
│   ├── Page.css
│   ├── PageContainer.jsx          # Manages multiple pages
│   └── PageContainer.css
├── App.jsx                       # Main application component
├── App.css                       # Main application styles
├── index.css                     # Global styles
└── main.jsx                      # Application entry point
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the local development URL (typically http://localhost:5173)

## Print Functionality

The application is designed with print functionality in mind:
- Pages are sized to US Letter (8.5" x 11")
- Print styles hide UI controls and show only page content
- Drop shadows are applied for preview but removed in print

## Future Enhancements

- CSV data integration for spell information
- Spell card templates and layouts
- Custom page sizing options
- Spell filtering and search functionality