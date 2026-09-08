# Johnny Decimal Manager

A progressive web application (PWA) for managing and organizing your digital life using the [Johnny.Decimal](https://johnnydecimal.com/) system.

## What is Johnny.Decimal?

Johnny.Decimal is a system to organize your digital (and physical) life. It provides a structured way to categorize everything using a simple numbering scheme:

- **Domains** (optional prefix): High-level life areas (e.g., `d1` for Work, `d2` for Personal)
- **Areas** (10-19, 20-29, etc.): Broad categories within a domain
- **Categories** (11, 12, 21, 22, etc.): Specific topics within an area
- **Items** (d1.11.01, d1.11.02, etc.): Individual items within a category

## Features

- **Hierarchical Organization**: Create and manage domains, areas, categories, and items
- **Full-Text Search**: Quickly find anything using BM25-powered search
- **Tag Support**: Add tags to categories and items for additional organization
- **Quick Entry**: Type `Name [XX]` in descriptions to instantly add categories or items
- **Inline Rename**: Click the pencil icon to rename areas, categories, or items
- **Easy Deletion**: Remove categories and items with the X button (hover to reveal)
- **Keyboard-First Design**: Navigate and manage everything with keyboard shortcuts
- **Import/Export**: Backup and restore your system as JSON files
- **Offline Support**: Works offline as a PWA - install it on your device
- **Privacy-First**: All data stored locally in your browser - no server, no accounts
- **Responsive Design**: Works on desktop, tablet, and mobile

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `?` | Open help dialog |
| `1`-`9` | Switch to system 1-9 (alphabetical order) |
| `↑` `↓` | Navigate search results |
| `Enter` | Expand result / focus description |
| `Esc` | Clear search / close editor / blur field |

### In Description Fields

| Input | Action |
|-------|--------|
| `#tag` + Space | Add a tag |
| `Name [XX]` + Enter | Add category (in area) or item (in category) |

**Examples:**
- In area "90-99": `Contracten [92]` → creates category "92 Contracten"
- In category "22": `Router [03]` → creates item "d1.22.03"

## Installation (Without Lovable)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm, yarn, or bun

### Steps

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Create a production build
npm run build

# Preview the production build locally
npm run preview
```

The built files will be in the `dist` folder, ready to be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## Usage

1. **Import a System**: Start by importing your Johnny.Decimal structure as JSON
2. **Search**: Use the search bar (`/`) to quickly find anything
3. **Edit**: Click on areas or categories to edit descriptions, tags, and items
4. **Rename**: Click the pencil icon (✏️) on areas, categories, or items to rename
5. **Delete**: Click the X button on categories or items to remove them
6. **Add Categories**: In an area description, type `Name [XX]` + Enter
7. **Add Items**: In a category description, type `Name [XX]` + Enter
8. **Add Tags**: Type `#tagname` in descriptions and press Space
9. **Switch Systems**: Press `1`-`9` to switch between systems alphabetically
10. **Export**: Regularly export your data as a backup

## Technology Stack

- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Zod](https://zod.dev/) - Input validation

## Development Disclaimer

> **⚠️ Important Notice**
>
> This project was **vibe-coded** using [Lovable](https://lovable.dev/), an AI-powered development platform. The code was generated through natural language conversations with AI.
>
> **Security checks** have been performed using Lovable's built-in security scanning tools, which check for common vulnerabilities including:
> - Input validation issues
> - Information leakage
> - Resource cleanup (memory leaks, blob URLs)
> - General security best practices
>
> However, **the repository owner has not manually reviewed the code line-by-line**. While the AI-generated code has passed automated security checks, users should be aware that:
> - No manual code audit has been performed
> - The code is provided as-is without warranty
> - You are encouraged to review the code yourself before using in production environments

## Privacy

All data is stored locally in your browser's localStorage. No data is ever sent to any server. You can clear all data at any time through the Help menu.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ using [Lovable](https://lovable.dev/)
