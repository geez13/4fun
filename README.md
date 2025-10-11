# Four.Fun - Digital Signature Platform

Four.Fun is a modern web application for digital image signing and verification using blockchain technology. Built with React, TypeScript, and Solana integration, it provides a secure and user-friendly platform for digital asset authentication.

## Features

- **Image Upload & Processing**: Drag-and-drop image upload with validation
- **Digital Signatures**: Blockchain-based digital signing using Solana
- **Wallet Integration**: Support for various Solana wallets
- **History Tracking**: View and manage your signed images
- **VWall Gallery**: Showcase of signed digital assets
- **Real-time Processing**: Live updates on signature status

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Blockchain**: Solana Web3.js + Wallet Adapters
- **Backend**: Express.js + TypeScript
- **Database**: Supabase
- **Image Processing**: Sharp
- **File Upload**: React Dropzone + Multer

## Installation

1. Clone the repository:
```bash
git clone <your-fork-url>
cd four.fun
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in your Supabase and other required environment variables.

4. Start the development server:
```bash
pnpm dev
```

## Usage

1. **Upload Images**: Drag and drop images onto the upload area
2. **Connect Wallet**: Connect your Solana wallet for signing
3. **Sign Images**: Process and digitally sign your images
4. **View History**: Track all your signed images
5. **Browse VWall**: Explore the gallery of signed digital assets

## Development

For production builds and advanced ESLint configuration:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```
