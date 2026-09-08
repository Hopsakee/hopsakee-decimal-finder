# Contributing to Johnny Decimal Manager

Thank you for your interest in contributing! This project welcomes contributions from everyone.

## Important Notice

This project was **vibe-coded using Lovable** and has been checked for security issues using Lovable's built-in security scanning tools. However, the repository owner has not manually reviewed all code. Please keep this in mind when contributing and reviewing.

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in the [Issues](../../issues) tab
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Browser and OS information

### Suggesting Features

1. Open a new issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain how it fits with the Johnny Decimal methodology

### Submitting Code Changes

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following the code style guidelines below
5. **Test** your changes locally:
   ```bash
   npm install
   npm run dev
   ```
6. **Commit** with a clear message:
   ```bash
   git commit -m "Add: brief description of changes"
   ```
7. **Push** to your fork and open a **Pull Request**

## Code Style Guidelines

- **TypeScript**: Use strict typing, avoid `any`
- **React**: Functional components with hooks
- **Styling**: Use Tailwind CSS with semantic tokens from the design system
- **Formatting**: The project uses standard Prettier/ESLint configuration
- **Components**: Keep components small and focused; create new files for new components

## Project Structure

```
src/
├── components/     # React components
│   └── ui/         # Reusable UI components (shadcn/ui)
├── hooks/          # Custom React hooks
│   └── useKeyboardHandlers.ts  # Unified keyboard handling
├── lib/            # Utility functions and validation
├── pages/          # Page components
└── types/          # TypeScript type definitions
```

## Key Architecture Decisions

### Keyboard Handling

All keyboard shortcuts are centralized in `src/hooks/useKeyboardHandlers.ts` to prevent regressions and ensure consistent behavior across components. This includes:

- `useInputKeyboard`: For simple input fields (Enter to submit, Escape to cancel/blur)
- `useDescriptionKeyboard`: For description textareas (item parsing, hashtag extraction)
- `useContainerNavigation`: For container-level arrow key navigation

When adding new keyboard interactions, extend these hooks rather than adding inline handlers.

### Item ID Format

Items use the format `prefix.categoryId.number` (e.g., `d1.22.03`). The system prefix is extracted from the system name using the pattern `^([a-zA-Z]\d+)` (e.g., "d1-Work" → "d1").

### Quick-Add Pattern

Users can add categories or items by typing `Name [XX]` in area or category descriptions. The regex `/^(.+?)\s*\[(\d+)\]$/` matches this pattern.

### Inline Rename

Areas, categories, and items can be renamed inline by clicking the pencil icon. The rename state is managed locally in `SystemTree.tsx` and `SearchResults.tsx` using `renamingId` and `renameValue` state variables.

### Deletion

Categories and items can be deleted using the X button that appears on hover. The `removeCategory` function in `useJohnnyDecimal.ts` handles category deletion.

## Development Tips

- All data is stored in `localStorage` - no backend required
- The app uses the [Johnny Decimal](https://johnnydecimal.com/) methodology
- Import/export uses JSON format with Zod validation
- Search uses BM25 algorithm for relevance ranking
- Press `?` to open the help dialog for keyboard shortcut reference

## Testing Keyboard Shortcuts

When modifying keyboard handling:

1. Test `/` focuses search from anywhere
2. Test `?` opens help dialog
3. Test `1`-`9` switch systems (only when not in an input)
4. Test `↑`/`↓` navigate search results
5. Test `Enter` expands results and focuses description
6. Test `Esc` blurs fields and closes editors
7. Test `Name [XX]` + Enter adds categories in area descriptions
8. Test `Name [XX]` + Enter adds items in category descriptions
9. Test `#tag` + Space adds tags in descriptions
10. Test pencil icon triggers rename mode for areas, categories, and items
11. Test X button deletes categories and items

## Questions?

Feel free to open an issue for any questions about contributing.

---

Thank you for helping improve Johnny Decimal Manager!
