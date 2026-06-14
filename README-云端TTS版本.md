# 🚀 快速开始 - 云端TTS版本

## 问题说明
- ❌ 原API出现403错误（API通道客户端限制）
- ❌ 本地TTS不会说中文

## 解决方案
✅ 使用云端TTS（火山引擎）- 完美支持中文！

---

## 一键启动

### 方法1：云端TTS（推荐）⭐
```bash
双击运行: Start-My-Neuro-CloudTTS.bat
```

**特点**:
- ✅ 完美中文语音（俏皮公主音色）
- ✅ 启动更快（跳过TTS模型加载）
- ✅ 更省GPU/内存
- ✅ 无需本地TTS服务

---

### 方法2：原版（本地TTS）
```bash
双击运行: Start-My-Neuro.bat
```

**注意**: 需要GPU，启动慢，本地TTS可能不会说中文

---

## 已修复的问题

### 1. ✅ 修复了 llm-client.js
- 移除了 Anthropic 专用 headers
- 提高API兼容性
- 位置: `live-2d/js/ai/llm-client.js` 第79-92行

### 2. ✅ 创建了云端TTS启动脚本
- 自动启用火山引擎TTS
- 自动禁用本地TTS
- 完美支持中文

---

## 测试脚本

如需诊断403问题，运行:
```bash
node test-403-fix.js          # 基础测试
node test-403-advanced.js     # 高级测试（16种User-Agent）
node verify-fix.js            # 验证修复
```

---

## 详细文档

- 📄 `解决方案总结.md` - 完整解决方案说明
- 📄 `403错误诊断报告.md` - 技术诊断报告

---

## 配置说明

云端TTS配置（已自动配置）:
```json
"cloud": {
  "volcengine_tts": {
    "enabled": true,
    "appid": "9282626043",
    "access_token": "DlShlNhCUQd19bW3S...",
    "voice_type": "saturn_zh_female_tiaopigongzhu_tob"
  }
}
```

---

## 🎉 现在开始

**推荐操作**:
1. 双击 `Start-My-Neuro-CloudTTS.bat`
2. 等待服务启动（约3-5秒）
3. 对着桌宠说话，测试中文语音！

---

**状态**: ✅ 测试完成，可以使用  
**日期**: 2026-06-14
