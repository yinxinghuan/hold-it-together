# Technical

## 1. 技术栈

- 游戏：Hold It Together
- 类型：casual
- 简述：AlterU After Dark「撑住别崩」—— 内耗生存模拟。Reigns 式左右滑卡: 老板深夜消息/老妈催婚/房东涨租/同事甩锅……每张卡两个选项, 选哪个都得拿一样换另一样, 心力与钱包此消彼长。卡中央那张脸就是你, 心力越掉脸越垮 (在线→疲惫→内耗→一点就炸→已崩), 任一归零 game over, 比谁撑得久。即点即懂。
- 框架 / 语言 / 构建：React, TypeScript, Vite, Matter.js, Less
- 渲染方式：Canvas/WebGL
- 依赖摘录：@types/matter-js@^0.19.7, @types/react@^18.2.0, @types/react-dom@^18.2.0, @vitejs/plugin-react@^4.2.1, less@^4.2.0, matter-js@^0.20.0, react@^18.2.0, react-dom@^18.2.0, typescript@^5.3.3, vite@^5.1.0
- 平台元信息：meta.title=Hold It Together；cover_url=/poster.png；category=casual；uuid=0e8a0ea2-43ac-417a-a534-bc3add3e2fbf

## 2. 目录结构

- `index.html`：Vite/浏览器入口，挂载根节点和基础 meta。
- `package.json`：定义 npm 脚本、依赖和工程名称。
- `vite.config.ts`：配置构建、插件和相对路径 base。
- `meta.json`：平台发布元信息，包含标题和封面。
- `src/App.tsx`：React 组件和交互界面。
- `src/main.tsx`：React 组件和交互界面。
- `src/index.less`：视觉样式、布局、动画和响应式规则。
- `src/shared.d.ts`：游戏源码模块。
- `src/vite-env.d.ts`：游戏源码模块。
- `src/game-id.ts`：游戏源码模块。
- `src/shared/runtime/useGameStats.ts`：游戏源码模块。
- `src/shared/runtime/useUpload.ts`：游戏源码模块。
- `src/shared/runtime/useChat.ts`：游戏源码模块。
- `src/shared/runtime/useGenImage.ts`：游戏源码模块。
- `src/shared/runtime/bridge.ts`：游戏源码模块。
- `src/shared/runtime/game-id.ts`：游戏源码模块。
- `src/shared/runtime/useGameEvent.ts`：游戏源码模块。
- `src/shared/runtime/index.ts`：游戏源码模块。

关键源码模块：

- `src/App.tsx`
- `src/main.tsx`
- `src/index.less`
- `src/shared.d.ts`
- `src/vite-env.d.ts`
- `src/game-id.ts`
- `src/shared/runtime/useGameStats.ts`
- `src/shared/runtime/useUpload.ts`
- `src/shared/runtime/useChat.ts`
- `src/shared/runtime/useGenImage.ts`
- `src/shared/runtime/bridge.ts`
- `src/shared/runtime/game-id.ts`
- `src/shared/runtime/useGameEvent.ts`
- `src/shared/runtime/index.ts`
- `src/shared/leaderboard/Leaderboard.tsx`
- `src/shared/leaderboard/Leaderboard.less`
- `src/shared/leaderboard/useGameScore.ts`
- `src/shared/leaderboard/index.ts`
- `src/Game/Game.tsx`
- `src/Game/stressors.ts`
- `src/Game/audio.ts`
- `src/Game/i18n.ts`
- `src/Game/engine.ts`
- `src/Game/Game.less`

## 3. 核心模块

- 状态管理与主循环：通过 React 状态/引用配合 `requestAnimationFrame` 推进游戏帧。
- 渲染方式：Canvas/WebGL，样式由 CSS/Less 和组件结构共同完成。
- 碰撞 / 更新：源码包含命中、距离、边界或重叠判断，结果会影响得分、生命或阶段。
- 音频：包含程序化音频或音频文件播放，按交互事件触发。
- 多语言：包含 i18n / locale 检测或 `t()` 文案函数。
- 存储：使用 localStorage、useGameSave 或 persist 保存分数、收藏、墙数据或本地状态。
- Aigram 运行时：接入 `@shared/runtime` 或平台桥接能力，用于用户、资料页、分享、通知或平台 API。
- 排行榜：源码包含分数提交、排名或榜单展示逻辑。

## 4. 扩展点

- 改玩法参数：优先查找 `src/` 内大写常量、hooks、主组件顶部配置或关卡数组。
- 换素材：替换 `public/`、`src/img/` 或源码 import 的图片/音频文件，并保持相对路径。
- 调视觉：修改主样式文件中的颜色、间距、动画时长、网格尺寸和响应式规则。
- 改文案：修改 i18n 字典、组件内标题按钮文案，保持 zh/en 同步。
- 加平台能力：在已有 `@shared/runtime`、useGameSave、排行榜、墙或通知调用附近扩展，避免另起一套存储。
