# 🎵 AI 唱歌功能使用指南

**功能赞助**: [@jonnytri53](https://github.com/jonnytri53)

---

## 功能特性

- ✅ 支持播放分离音频（伴奏 + 人声）
- ✅ 自动触发 Live2D 麦克风动作
- ✅ 根据人声音频实时驱动口型
- ✅ 同步显示歌词（在聊天气泡中）
- ✅ 支持多种音频格式（.mp3, .wav, .m4a, .ogg）
- ✅ 自动从网易云音乐获取歌词（如果本地没有）

---

## 📁 第一步：准备音乐文件

### 1. 创建音乐目录

在项目根目录下创建以下结构：
```
my-neuro/
└── song-library/
    └── output/
        ├── 歌曲1-Acc.mp3
        ├── 歌曲1-Vocal.mp3
        ├── 歌曲1.json (可选)
        ├── 歌曲2-Acc.mp3
        ├── 歌曲2-Vocal.mp3
        └── ...
```

### 2. 音频文件命名规范

**必须遵循以下命名格式**：
- **伴奏文件**：`歌曲名-Acc.扩展名`
- **人声文件**：`歌曲名-Vocal.扩展名`

**示例**：
```
告白气球-Acc.mp3     ← 伴奏
告白气球-Vocal.mp3   ← 人声
告白气球.json        ← 元数据（可选）
```

**注意事项**：
- 基础文件名必须完全相同（例如都是"告白气球"）
- 后缀必须是 `-Acc` 和 `-Vocal`（区分大小写）
- 支持的格式：`.mp3`, `.wav`, `.m4a`, `.ogg`

### 3. 如何获取分离音频？

**方法 1：使用 AI 音频分离工具**
- [UVR (Ultimate Vocal Remover)](https://github.com/Anjok07/ultimatevocalremovergui) - 免费开源
- [Spleeter](https://github.com/deezer/spleeter) - 命令行工具
- [LALAL.AI](https://www.lalal.ai/) - 在线服务（付费）

**方法 2：下载已分离的伴奏**
- B站、网易云音乐搜索"伴奏版"
- 人声可以用原曲 - 伴奏提取

### 4. 元数据文件（可选）

创建 `歌曲名.json` 文件，格式如下：
```json
{
  "title": "告白气球",
  "artist": "周杰伦",
  "lyrics": "塞纳河畔 左岸的咖啡\n我手一杯 品尝你的美\n留下唇印的嘴\n\n花店玫瑰 名字写错谁\n告白气球 风吹到对街\n微笑在天上飞",
  "duration": 210
}
```

**字段说明**：
- `title`: 歌曲名
- `artist`: 歌手名
- `lyrics`: 歌词（用 `\n` 换行）
- `duration`: 时长（秒）

**如果不提供元数据**：
- 系统会尝试从网易云音乐自动获取歌词
- 如果获取失败，将显示"暂无歌词"

---

## 🎮 第二步：播放音乐

### 方法 1：HTTP API（推荐）

程序启动后，HTTP 音乐控制服务会在 **端口 3001** 上运行。

#### 1.1 播放随机歌曲

**请求**：
```bash
curl http://localhost:3001/music?action=play_random
```

**或者在浏览器中访问**：
```
http://localhost:3001/music?action=play_random
```

**响应**：
```json
{
  "success": true,
  "message": {
    "message": "开始播放: 告白气球-Acc.mp3",
    "metadata": {
      "title": "告白气球",
      "artist": "周杰伦",
      "lyrics": "..."
    }
  }
}
```

#### 1.2 播放指定歌曲

**请求**：
```bash
curl "http://localhost:3001/music?action=play_specific&filename=告白气球-Acc.mp3"
```

**或者在浏览器中访问**：
```
http://localhost:3001/music?action=play_specific&filename=告白气球-Acc.mp3
```

**注意**：
- `filename` 参数传入伴奏文件名（`-Acc.mp3` 结尾）
- 系统会自动查找对应的人声文件（`-Vocal.mp3`）

#### 1.3 停止播放

**请求**：
```bash
curl http://localhost:3001/music?action=stop
```

**或者在浏览器中访问**：
```
http://localhost:3001/music?action=stop
```

---

### 方法 2：浏览器控制台（开发调试）

打开程序后，按 `F12` 或 `Ctrl+Shift+I` 打开开发者工具，在控制台中输入：

#### 2.1 播放随机歌曲
```javascript
global.musicPlayer.playRandomMusic();
```

#### 2.2 播放指定歌曲
```javascript
global.musicPlayer.playSpecificSong('告白气球-Acc.mp3');
```

#### 2.3 停止播放
```javascript
global.musicPlayer.stop();
```

---

### 方法 3：集成到网页（外部控制）

你可以创建一个简单的 HTML 控制面板：

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI 音乐控制面板</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>🎵 AI 音乐控制面板</h1>
    
    <button onclick="playRandom()">播放随机歌曲</button>
    <button onclick="stopMusic()">停止播放</button>
    
    <hr>
    
    <label>选择歌曲：</label>
    <input type="text" id="songName" placeholder="歌曲名-Acc.mp3">
    <button onclick="playSpecific()">播放</button>
    
    <hr>
    
    <div id="status"></div>
    
    <script>
        const API_URL = 'http://localhost:3001/music';
        
        async function playRandom() {
            const response = await fetch(`${API_URL}?action=play_random`);
            const result = await response.json();
            document.getElementById('status').innerText = JSON.stringify(result, null, 2);
        }
        
        async function playSpecific() {
            const filename = document.getElementById('songName').value;
            const response = await fetch(`${API_URL}?action=play_specific&filename=${encodeURIComponent(filename)}`);
            const result = await response.json();
            document.getElementById('status').innerText = JSON.stringify(result, null, 2);
        }
        
        async function stopMusic() {
            const response = await fetch(`${API_URL}?action=stop`);
            const result = await response.json();
            document.getElementById('status').innerText = JSON.stringify(result, null, 2);
        }
    </script>
</body>
</html>
```

保存为 `music-control.html`，用浏览器打开即可控制 AI 唱歌。

---

## 🎬 播放效果

当播放开始时，你会看到：

1. **Live2D 模型动作**：
   - 自动触发"麦克风动作"（索引 8，对应 Ctrl+Shift+9）
   - 模型做出唱歌姿势

2. **口型同步**：
   - 根据人声音频的音量实时驱动嘴部开合
   - 使用 Web Audio API 分析音频频谱

3. **歌词显示**：
   - 在聊天气泡中逐句显示歌词
   - 支持时间轴同步（如果元数据包含时间戳）

4. **播放结束**：
   - 自动恢复默认动作
   - 隐藏歌词气泡

---

## 🔧 高级配置

### 修改音乐目录

编辑 `js/services/music-player.js` 第 9 行：
```javascript
this.musicFolder = 'song-library\\output';  // 修改为你的目录
```

### 调整口型灵敏度

编辑 `js/services/music-player.js`，找到 `startMouthAnimation()` 方法：
```javascript
startMouthAnimation() {
    // ...
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    const mouthOpen = Math.min(1, average / 128);  // 调整 128 这个值
    // 值越小，口型越敏感
}
```

### 自定义麦克风动作

如果你的 Live2D 模型麦克风动作不是索引 8，修改 `js/services/music-player.js` 第 36 行：
```javascript
this.emotionMapper.playMotion(8);  // 改为你的动作索引
```

---

## ❓ 常见问题

### Q1: 播放时没有声音？
**A**: 检查：
1. 音频文件是否存在于 `song-library/output/` 目录
2. 文件命名是否符合规范（`-Acc.mp3` 和 `-Vocal.mp3`）
3. 浏览器控制台是否有错误信息

### Q2: 只有伴奏，没有口型动画？
**A**: 确保同时存在伴奏和人声文件，口型动画由人声驱动。

### Q3: 没有歌词显示？
**A**: 
1. 检查是否有 `.json` 元数据文件
2. 系统会尝试从网易云音乐自动获取，需要网络连接
3. 如果仍无法显示，手动创建元数据文件

### Q4: 如何只播放单音频（非分离音频）？
**A**: 将音频文件命名为不带 `-Acc` 或 `-Vocal` 后缀，系统会自动使用单音频播放模式（但没有口型同步）。

### Q5: 如何批量添加歌曲？
**A**: 
1. 使用音频分离工具批量处理
2. 按命名规范重命名文件
3. 放入 `song-library/output/` 目录
4. 调用 `playRandomMusic()` 会随机选择一首

### Q6: HTTP API 无法访问？
**A**: 
1. 确认程序已启动
2. 检查端口 3001 是否被占用
3. 查看控制台是否有"音乐控制服务启动在端口3001"的提示

---

## 🎯 完整示例

假设你有一首《晴天》：

### 1. 准备文件
```
song-library/output/
├── 晴天-Acc.mp3      (伴奏)
├── 晴天-Vocal.mp3    (人声)
└── 晴天.json         (元数据)
```

### 2. 创建元数据 `晴天.json`
```json
{
  "title": "晴天",
  "artist": "周杰伦",
  "lyrics": "故事的小黄花 从出生那年就飘着\n童年的荡秋千 随记忆一直晃到现在",
  "duration": 270
}
```

### 3. 播放
在浏览器中访问：
```
http://localhost:3001/music?action=play_specific&filename=晴天-Acc.mp3
```

### 4. 效果
- Live2D 模型拿起麦克风
- 嘴巴随人声开合
- 聊天气泡显示歌词

---

## 📚 相关代码文件

- `js/services/music-player.js` - 核心播放器
- `js/services/http-server.js` - HTTP API 服务
- `js/ipc-handlers.js` - IPC 事件处理
- `js/model/model-setup.js` - Live2D 模型初始化

---

## 🎉 开始使用

1. 准备好分离音频文件
2. 放入 `song-library/output/` 目录
3. 启动程序
4. 访问 `http://localhost:3001/music?action=play_random`
5. 享受 AI 唱歌！🎤

---

**提示**：如果遇到问题，打开开发者工具（F12）查看控制台日志，会有详细的错误信息。
