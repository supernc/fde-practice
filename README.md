# 腾讯云 FDE 备考学习站

[打开 GitHub Pages 网页](https://supernc.github.io/fde-practice/#/) · [腾讯云官方认证页](https://cloud.tencent.com/edu/training/cert/detail?type=CID) · [学习资料存档](public/fde-study-notes.md)

面向腾讯云人工智能前沿部署工程师（FDE）职业认证。基于原有 [TCCP 练习系统](https://github.com/supernc/tccp-practice) 的 React、Vite、Tailwind、HashRouter 和 GitHub Pages 工作流构建，延续与 [基金练习站](https://github.com/supernc/fund-practice) 一致的刷题界面。

- 12 章 76 节课程摘要，支持搜索、已学标记、章节笔记及官方课程跳转。
- 524 道原创练习题，含原有 68 道、76 道现场决策、76 道验收证据和 304 道多场景综合辨析。每节对应一个基础案例，综合题交叉复用这些案例。每题附解析与课程出处。运行 `node scripts/expand-bank.mjs` 可从逐节案例重建题库与学习存档。
- 全卷模拟为 120 分钟，40 道单选每题 1.5 分，20 道多选每题 2 分。总分 100，70 分通过，多选须完整选对才计分。
- 章节与随机练习、错题本、收藏、学习统计及备份。学习记录保存在使用本网页的浏览器里。

课程与考试规则核对于 2026-11-25。官方课程全文、模拟题和考试沙盒以腾讯云页面为准。

## 本地运行

```sh
npm ci
npm test
npm run dev
npm run build
```

通过 `.github/workflows/deploy.yml` 自动验证、构建，部署到当前仓库的 GitHub Pages。
