# 🎵 AI 唱歌功能 - 快速测试指南

## 问题说明

网易云 API 有版权限制，很多歌曲无法直接下载。

---

## 推荐方案：使用 UVR 分离本地音频

### 步骤 1：下载 UVR

**Ultimate Vocal Remover (免费开源)**
- 官网：https://github.com/Anjok07/ultimatevocalremovergui/releases
- 下载最新版 Windows 安装包
- 安装后打开

### 步骤 2：准备音频文件

如果你有本地 MP3 文件（任何来源）：
- 从 QQ音乐、网易云下载
- 从 B站下载视频提取音频
- 自己录制的音频

### 步骤 3：使用 UVR 分离

1. 打开 UVR
2. 点击 "Select Input" 选择 MP3 文件
3. 选择模型：`UVR-MDX-NET-Inst_HQ_3`（高质量）
4. 点击 "Start Processing"
5. 等待 1-3 分钟

**输出文件**（在同一目录）：
```
告白气球.mp3
告白气球_(Vocals).wav      ← 人声
告白气球_(Instrumental).wav ← 伴奏
```

### 步骤 4：重命名文件

**重要：必须按照以下格式重命名**

```bash
# Windows 命令行
ren "告白气球_(Vocals).wav" "告白气球-Vocal.mp3"
ren "告白气球_(Instrumental).wav" "告白气球-Acc.mp3"
```

或者手动重命名：
- `告白气球_(Vocals).wav` → `告白气球-Vocal.mp3`
- `告白气球_(Instrumental).wav` → `告白气球-Acc.mp3`

### 步骤 5：移动到输出目录

```bash
# 移动到正确位置
move 告白气球-Vocal.mp3 song-library\output\
move 告白气球-Acc.mp3 song-library\output\
```

或者手动移动到：`my-neuro/song-library/output/`

### 步骤 6：创建元数据（可选）

在 `song-library/output/` 创建 `告白气球.json`：

```json
{
  "title": "告白气球",
  "artist": "周杰伦",
  "lyrics": "塞纳河畔 左岸的咖啡\n我手一杯 品尝你的美\n留下唇印的嘴\n\n花店玫瑰 名字写错谁\n告白气球 风吹到对街\n微笑在天上飞",
  "duration": 214
}
```

### 步骤 7：测试播放

1. 启动 AI 程序
2. 打开 `music-control-panel.html`
3. 在"手动输入"框输入：`告白气球-Acc.mp3`
4. 点击"播放"

**效果**：
- ✅ Live2D 模型拿起麦克风
- ✅ 嘴巴随人声开合
- ✅ 显示歌词（如果有 .json 文件）

---

## 🎬 完整视频教程（文字版）

### 场景：你有一首 MP3 文件

1. **下载安装 UVR**
   - 访问：https://github.com/Anjok07/ultimatevocalremovergui/releases
   - 下载：`UVR_v5.6.0_setup.exe`（或最新版）
   - 安装到默认位置

2. **打开 UVR**
   - 界面分为左右两部分
   - 左侧：输入文件选择
   - 右侧：模型选择

3. **选择文件**
   - 点击 "Select Input"
   - 选择你的 MP3 文件（例如 `D:\Music\告白气球.mp3`）

4. **选择模型**
   - 在 "Choose Process Method" 下拉框选择：`MDX-Net`
   - 在 "Select Model" 下拉框选择：`UVR-MDX-NET-Inst_HQ_3`
   - 这个模型质量最好

5. **开始处理**
   - 点击底部的 "Start Processing" 按钮
   - 进度条显示处理进度
   - 通常需要 1-3 分钟（取决于歌曲长度）

6. **查看输出**
   - 处理完成后，在原文件目录找到：
     ```
     告白气球_(Vocals).wav      ← 人声
     告白气球_(Instrumental).wav ← 伴奏
     ```

7. **重命名**
   - 右键 → 重命名：
     ```
     告白气球_(Vocals).wav      → 告白气球-Vocal.mp3
     告白气球_(Instrumental).wav → 告白气球-Acc.mp3
     ```

8. **移动文件**
   - 将两个文件复制到：
     ```
     D:\Github\my-neruo\my-neuro\song-library\output\
     ```

9. **测试播放**
   - 启动 AI 程序
   - 打开 `music-control-panel.html`
   - 输入 `告白气球-Acc.mp3` 点击播放

---

## 🎯 推荐歌曲（适合测试）

**适合 AI 唱歌的特点**：
- 旋律清晰
- 节奏稳定
- 人声突出
- 不要太快的说唱

**推荐列表**：
1. 周杰伦 - 告白气球
2. 周杰伦 - 晴天
3. 周杰伦 - 稻香
4. 邓紫棋 - 光年之外
5. 毛不易 - 消愁
6. 薛之谦 - 演员
7. 陈奕迅 - 富士山下
8. 林俊杰 - 江南

---

## ⚠️ 常见问题

### Q1: UVR 下载不了？
**A**: 使用 GitHub 代理或 VPN，或者搜索 "UVR 百度网盘"

### Q2: 分离后音质很差？
**A**: 
- 确保原始文件是高音质（320kbps 以上）
- 使用 `UVR-MDX-NET-Inst_HQ_3` 模型
- 避免使用压缩过的音频

### Q3: 分离需要很长时间？
**A**: 
- 正常情况：1 分钟歌曲需要 30秒-1分钟处理
- 如果超过 5 分钟，可能是模型下载中或电脑配置较低

### Q4: 播放时没有口型动画？
**A**: 
- 确保同时有 `-Acc.mp3` 和 `-Vocal.mp3` 两个文件
- 文件名必须完全相同（除了后缀）

---

## 📚 其他资源

**音频分离工具对比**：

| 工具 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| UVR | 免费、质量最好、界面友好 | 处理稍慢 | ⭐⭐⭐⭐⭐ |
| Spleeter | 开源、速度快 | 命令行、质量中等 | ⭐⭐⭐⭐ |
| LALAL.AI | 在线、质量好 | 付费、有额度限制 | ⭐⭐⭐ |
| Moises.ai | 在线、功能丰富 | 免费额度少 | ⭐⭐⭐ |

**推荐：UVR**（完全免费、质量最好）

---

## 🎉 开始使用

1. 下载 UVR
2. 准备一首 MP3
3. 分离音频
4. 重命名并放到 `song-library/output/`
5. 打开控制面板播放

**就是这么简单！** 🎤
