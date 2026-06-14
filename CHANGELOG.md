# 更新日志 (CHANGELOG)

## [2026-06-14] - 云端TTS修复与优化

### 🎯 重大修复

#### 云端TTS功能恢复
- **问题**: 配置了云端TTS但无法播放语音
- **根本原因**: 
  1. `app.js` 和 `tts-factory.js` 只检查本地TTS配置，未检查云端TTS
  2. 火山引擎TTS凭据已过期（403错误）
- **解决方案**:
  1. 修改TTS启用逻辑，同时检查本地和云端TTS
  2. 切换到阿里云CosyVoice TTS
- **影响文件**:
  - `live-2d/app.js` - 修复TTS模块启用检查
  - `live-2d/js/voice/tts-factory.js` - 修复TTS处理器创建逻辑
  - `live-2d/js/voice/tts-processor.js` - 添加详细调试日志

#### API配置更新
- **旧配置**: Claude API (anthropic.com)
- **新配置**: Qwen API (ai.littlesheep.cc)
- **模型**: qwen3.5-397b-a17b
- **原因**: 切换到更稳定的API服务

### ✨ 新增功能

#### 思考内容过滤增强
- **功能**: 自动过滤模型推理过程，不显示在字幕中
- **支持格式**:
  - `<think>...</think>` (DeepSeek)
  - `<thinking>...</thinking>` (通用)
  - `<thoughts>...</thoughts>` (Qwen)
  - 长推理段落（包含多个推理关键词）
  - "让我分析/思考/推理"开头的内容
- **影响文件**: `live-2d/js/ai/llm-client.js`

#### 安全工具
- **check-config-safe.js**: 配置检查工具，自动隐藏API密钥
- **使用**: `node check-config-safe.js`
- **输出**: 显示配置状态但隐藏敏感信息

#### 启动脚本优化
- **Start-My-Neuro.bat**: 主启动脚本
- **Start-My-Neuro-CloudTTS.bat**: 云端TTS专用启动
- **Start-My-Neuro-NewAPI.bat**: 新API配置启动
- **Start-Debug.bat**: 诊断启动脚本，检查依赖

### 🐛 Bug修复

1. **TTS模块未正确识别云端TTS**
   - 修复前: `TTS模块: 禁用` (即使配置了云端TTS)
   - 修复后: `TTS模块: 启用 (本地:false, 云端:true)`

2. **火山引擎TTS 403错误**
   - 原因: access_token过期
   - 解决: 切换到阿里云TTS

3. **volcEnabled检查失效**
   - 修复前: `volcEnabled=false`
   - 修复后: `volcEnabled=true`
   - 位置: `tts-request-handler.js`

### 📝 文档更新

- ✅ 创建 `功能状态文档.md` - 详细列出已启用/未启用功能
- ✅ 创建 `语音问题解决指南.md` - TTS故障排查步骤
- ✅ 创建 `问题修复总结.md` - 本次修复的详细记录
- ✅ 创建 `403错误诊断报告.md` - 火山引擎认证失败分析

### 🔧 配置变更

#### config.json 主要变更:

```json
{
  "llm": {
    "api_url": "https://ai.littlesheep.cc/v1",  // 变更
    "model": "qwen3.5-397b-a17b"                 // 变更
  },
  "tts": {
    "enabled": false                             // 禁用本地TTS
  },
  "cloud": {
    "volcengine_tts": {
      "enabled": false                           // 禁用（403错误）
    },
    "aliyun_tts": {
      "enabled": true                            // 启用 ✅
    }
  }
}
```

### 📊 测试结果

**测试环境**:
- OS: Windows 11 Home China 10.0.26200
- Python: hermes-agent venv
- Node: 内置版本

**测试项目**:
- ✅ ASR服务启动 (端口1000)
- ✅ BERT服务启动 (端口6007)
- ✅ Live2D前端启动
- ✅ 云端TTS播放成功
- ✅ 语音识别正常
- ✅ 情感分类正常
- ✅ LLM回复正常
- ✅ 思考内容过滤生效
- ✅ 字幕显示正常

**性能指标**:
- TTS转换: <500ms
- 音频播放: 正常
- 对话延迟: ~2-3秒（包含网络API调用）

### 🎨 代码改进

1. **添加详细日志**
   - 火山引擎TTS连接日志
   - Token发送日志
   - 错误详细信息

2. **错误处理增强**
   - WebSocket连接失败捕获
   - Token发送失败提示
   - Finalize失败处理

3. **代码可读性**
   - 统一日志格式（emoji + 描述）
   - 添加关键检查点日志
   - 清晰的状态输出

### ⚠️ 已知问题

1. **火山引擎TTS不可用**
   - 原因: access_token过期（403 Forbidden）
   - 状态: 已切换到阿里云TTS
   - 修复: 需要重新申请有效的火山引擎凭据

2. **RAG服务未启动**
   - 状态: 配置启用但服务未运行
   - 端口: 8002
   - 影响: 无法使用知识库检索

3. **视觉功能未配置**
   - 状态: 未启用
   - 需要: 配置支持视觉的多模态模型

### 🚀 升级步骤

1. **拉取最新代码**:
   ```bash
   git pull origin main
   ```

2. **检查配置**:
   ```bash
   node check-config-safe.js
   ```

3. **重启程序**:
   - 关闭所有运行的服务
   - 双击 `Start-My-Neuro.bat`

4. **验证功能**:
   - 对桌宠说话测试语音
   - 检查是否有思考过程显示

### 📌 注意事项

1. **API密钥安全**
   - 不要在公开代码中提交完整密钥
   - 使用 `check-config-safe.js` 进行安全检查

2. **云端TTS选择**
   - 阿里云: 当前使用 ✅
   - 火山引擎: 需要更新凭据
   - SiliconFlow: 可用备选

3. **启动顺序**
   - ASR服务 → BERT服务 → Live2D前端
   - 等待5-10秒让服务初始化

### 💪 贡献者

- **修复**: Drfen
- **测试**: Drfen
- **文档**: Drfen

---

## [历史版本]

### [v6.5.5] - 2024-06-12
- 原始版本
- 支持本地TTS (GPT-SoVITS)
- 支持Claude API

---

**完整更新**: 查看 [功能状态文档.md](./功能状态文档.md)

**问题反馈**: 在 GitHub Issues 中提交
