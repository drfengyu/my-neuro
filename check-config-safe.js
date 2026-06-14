// 安全的配置检查脚本 - 隐藏敏感信息
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'live-2d', 'config.json');

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log('═'.repeat(60));
    console.log('📋 My-Neuro 配置检查（安全模式）');
    console.log('═'.repeat(60));
    console.log('');

    // LLM配置
    console.log('🤖 LLM配置:');
    console.log(`   API URL: ${config.llm.api_url}`);
    console.log(`   API Key: ${maskKey(config.llm.api_key)}`);
    console.log(`   Model: ${config.llm.model}`);
    console.log('');

    // TTS配置
    console.log('🔊 TTS配置:');
    console.log(`   本地TTS: ${config.tts.enabled ? '✅ 启用' : '❌ 禁用'}`);
    if (config.tts.enabled) {
        console.log(`   本地TTS URL: ${config.tts.url}`);
    }
    console.log('');

    // 云端TTS
    console.log('☁️  云端TTS:');
    console.log(`   火山引擎: ${config.cloud.volcengine_tts.enabled ? '✅ 启用' : '❌ 禁用'}`);
    if (config.cloud.volcengine_tts.enabled) {
        console.log(`   音色: ${config.cloud.volcengine_tts.voice_type}`);
        console.log(`   Token: ${maskKey(config.cloud.volcengine_tts.access_token)}`);
    }

    console.log(`   阿里云TTS: ${config.cloud.aliyun_tts.enabled ? '✅ 启用' : '❌ 禁用'}`);
    console.log('');

    // ASR配置
    console.log('🎤 ASR配置:');
    console.log(`   状态: ${config.asr.enabled ? '✅ 启用' : '❌ 禁用'}`);
    console.log(`   VAD URL: ${config.asr.vad_url}`);
    console.log('');

    console.log('═'.repeat(60));

} catch (e) {
    console.error('❌ 读取配置失败:', e.message);
}

function maskKey(key) {
    if (!key) return '(未配置)';
    if (key.length <= 8) return '***';
    return key.substring(0, 6) + '...' + key.substring(key.length - 4);
}
