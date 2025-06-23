# 案件管理システム

Next.js + Supabase + TypeScript で構築された案件管理システムです。

## 機能

- ユーザー認証（Supabase Auth）
- 案件管理（カンバンボード形式）
- タスク管理
- 制作状況管理
- ダッシュボード（統計・分析）
- パフォーマンス最適化

## 技術スタック

- **フロントエンド**: Next.js 14, React, TypeScript
- **UI**: Tailwind CSS
- **バックエンド**: Supabase
- **データベース**: PostgreSQL
- **認証**: Supabase Auth
- **ドラッグ&ドロップ**: @dnd-kit
- **デプロイ**: Vercel

## 開発環境

```bash
npm install
npm run dev
```

## 本番環境

- URL: https://task-2h1htww1w-katacreates-projects.vercel.app/
- 最終デプロイ: 2025年6月23日

## 修正履歴

- 2025年6月23日: カンバンボードの無限ループ修正、パフォーマンス最適化

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
