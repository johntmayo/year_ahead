# Debugging Guide

## Common Issues After Separating Files

### 1. Calendar Not Showing

**Most Common Cause: ES Modules Require a Web Server**

When using ES modules (`type="module"`), you cannot simply open `index.html` directly in a browser. You need to serve the files through a web server.

#### Quick Solutions:

**Option A: Python (if installed)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open: `http://localhost:8000`

**Option B: Node.js (if installed)**
```bash
npx serve
```
Or install globally:
```bash
npm install -g serve
serve
```

**Option C: VS Code Live Server Extension**
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

**Option D: PHP (if installed)**
```bash
php -S localhost:8000
```

### 2. Check Browser Console

Open Developer Tools (F12) and check the Console tab for errors:

- **CORS errors**: You need a web server (see above)
- **Module not found**: Check file paths are correct
- **Element not found**: Check HTML structure matches JavaScript expectations

### 3. Verify File Structure

Make sure your file structure looks like this:
```
year_ahead/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── store.js
│   ├── constants.js
│   └── ... (other JS files)
└── README.md
```

### 4. Check CSS Loading

In browser DevTools:
1. Go to Network tab
2. Refresh the page
3. Check if `styles.css` loads (status should be 200)

### 5. Check JavaScript Loading

In browser DevTools Console, you should see:
- "Year Ahead Planner: Initializing..."
- "Initializing Year Ahead Planner..."
- "Rendering year view..."
- "Rendered 12 months"
- "Initialization complete!"

If you don't see these messages, JavaScript isn't loading.

### 6. Manual Test

Open browser console and type:
```javascript
document.getElementById('yearView')
```

If this returns `null`, the HTML structure is wrong.
If it returns an element, check if it has children:
```javascript
document.getElementById('yearView').children.length
```

Should be 12 (one for each month).

## Still Not Working?

1. Check all file paths in `index.html` are correct
2. Verify all JavaScript files exist
3. Check browser console for specific error messages
4. Make sure you're using a web server (not file:// protocol)

