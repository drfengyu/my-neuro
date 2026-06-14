// llm-client.js - 统一的LLM API客户端
const { logToTerminal, handleAPIError } = require('../api-utils.js');
const https = require('https');
const http = require('http');

/**
 * 统一的LLM客户端
 * 封装所有LLM API调用逻辑,消除重复代码
 */
class LLMClient {
    constructor(config) {
        this.apiKey = config.llm.api_key;
        this.apiUrl = config.llm.api_url;
        this.model = config.llm.model;
        this.temperature = config.llm.temperature || 1.0;  // 🔥 读取temperature配置，默认1.0
        this.temperatureEnabled = config.llm.temperature_enabled ?? false;

        // RAG配置
        this.ragEnabled = config.rag?.enabled || false;
        this.ragUrl = config.rag?.url || 'http://127.0.0.1:8002';
        this.ragTopK = config.rag?.top_k || 2;  // 默认检索2个最相关段落
    }

    /**
     * 发送聊天完成请求
     * @param {Array} messages - 消息数组
     * @param {Array} tools - 可选的工具列表
     * @param {boolean} stream - 是否使用流式响应
     * @param {Function} onChunk - 流式响应时的回调函数，接收每个文本块
     * @returns {Promise<Object>} API响应的消息对象
     */
    async chatCompletion(messages, tools = null, stream = false, onChunk = null) {
        // 🔥 清理消息格式,确保API兼容性
        let cleanedMessages = this._cleanMessagesForAPI(messages);

        // 📚 RAG: 如果启用，查询知识库并添加相关记忆到系统消息
        if (this.ragEnabled && cleanedMessages.length > 0) {
            // 获取最后一条用户消息作为查询
            const lastUserMessage = [...cleanedMessages].reverse().find(m => m.role === 'user');

            if (lastUserMessage) {
                const ragResults = await this.queryRAG(lastUserMessage.content);

                if (ragResults.length > 0) {
                    // 构建RAG上下文
                    const ragContext = ragResults.map((passage, idx) =>
                        `[记忆${idx + 1}] ${passage.content}`
                    ).join('\n\n');

                    // 将RAG上下文添加到系统消息中
                    const ragSystemMessage = {
                        role: 'system',
                        content: `以下是从你的长期记忆中检索到的相关信息，请在回答时参考这些内容：\n\n${ragContext}\n\n---\n注意：以上是你的记忆片段，请自然地融入对话中，不要明确提及"记忆"或"检索"等词。`
                    };

                    // 在第一个用户消息前插入RAG上下文（在系统消息之后）
                    const systemMsgIndex = cleanedMessages.findIndex(m => m.role === 'system');
                    const insertIndex = systemMsgIndex >= 0 ? systemMsgIndex + 1 : 0;
                    cleanedMessages.splice(insertIndex, 0, ragSystemMessage);
                }
            }
        }

        const requestBody = {
            model: this.model,
            messages: cleanedMessages,
            stream: stream  // 🔥 修复：使用传入的 stream 参数，而不是硬编码 false
        };
        if (this.temperatureEnabled) {
            requestBody.temperature = this.temperature;
        }

        // 添加工具列表(如果提供)
        if (tools && tools.length > 0) {
            requestBody.tools = tools;
//            logToTerminal('info', `🔧 发送工具列表到LLM: ${tools.length}个工具`);
        } else {
            logToTerminal('warn', `⚠️ 未发送工具列表到LLM (tools=${tools ? 'empty array' : 'null'})`);
        }

        logToTerminal('info', `已将内容发送给AI..`);

        // 🔥 调试：在发送前验证JSON格式
        try {
            const testJson = JSON.stringify(requestBody);
            JSON.parse(testJson); // 验证可以正确解析

            // 打印请求统计信息
            const stats = {
                messagesCount: requestBody.messages.length,
                toolsCount: requestBody.tools?.length || 0,
                requestSize: testJson.length,
                temperature: requestBody.temperature  // 🔥 添加temperature到统计信息
            };
//            logToTerminal('info', `📤 API请求统计: ${JSON.stringify(stats)}`);
//            logToTerminal('info', `🌡️ Temperature参数: ${requestBody.temperature}`);  // 🔥 明确打印temperature

            // 如果请求过大,警告
            if (stats.requestSize > 50000) {
//                logToTerminal('warn', `⚠️ 请求体过大 (${Math.round(stats.requestSize/1024)}KB)，可能导致API错误`);
            }
        } catch (jsonError) {
            logToTerminal('error', `❌ 请求体JSON格式错误: ${jsonError.message}`);
            console.error('请求体内容:', requestBody);
            throw new Error(`请求格式错误: ${jsonError.message}`);
        }

        try {
            const url = new URL(`${this.apiUrl}/chat/completions`);
            const postData = JSON.stringify(requestBody);

            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'Authorization': `Bearer ${this.apiKey}`
                    // 移除了 anthropic-version 和 x-api-key 以兼容更多API网关
                },
                timeout: 60000
            };

            const responseData = await new Promise((resolve, reject) => {
                const protocol = url.protocol === 'https:' ? https : http;
                const req = protocol.request(options, (res) => {
                    let data = '';
                    let fullContent = '';  // 累积的完整内容（用于流式）
                    let buffer = '';       // SSE 数据缓冲区

                    res.on('data', (chunk) => {
                        data += chunk;

                        // 🔥 如果是流式响应，逐块处理 SSE 数据
                        if (stream && onChunk) {
                            buffer += chunk;
                            const lines = buffer.split('\n');

                            // 保留最后一个可能不完整的行
                            buffer = lines.pop() || '';

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const jsonStr = line.substring(6).trim();
                                    if (jsonStr === '[DONE]') continue;

                                    try {
                                        const parsed = JSON.parse(jsonStr);
                                        const delta = parsed.choices?.[0]?.delta?.content;
                                        if (delta) {
                                            fullContent += delta;
                                            onChunk(delta);  // 🔥 调用流式回调
                                        }
                                    } catch (e) {
                                        // 忽略解析错误，继续处理下一行
                                    }
                                }
                            }
                        }
                    });

                    res.on('end', () => {
                        logToTerminal('info', `🏁 HTTP 响应结束，statusCode=${res.statusCode}, stream=${stream}, fullContent长度=${fullContent.length}`);
                        if (res.statusCode !== 200) {
                            reject(new Error(`API返回错误: ${res.statusCode} - ${data}`));
                        } else {
                            try {
                                // 🔥 流式模式：返回累积的完整内容
                                if (stream && fullContent) {
                                    logToTerminal('info', `✅ 流式响应完成，返回累积内容：${fullContent.substring(0, 50)}...`);
                                    resolve({
                                        choices: [{
                                            message: {
                                                role: 'assistant',
                                                content: fullContent
                                            }
                                        }]
                                    });
                                    return;
                                }

                                // 🔥 非流式模式：处理可能的 SSE 格式响应
                                let jsonData = data.trim();

                                // 如果返回的是 SSE 格式（data: {...}），提取 JSON
                                if (jsonData.startsWith('data: ')) {
                                    // 提取第一行的 JSON（非流式应该只有一行）
                                    const lines = jsonData.split('\n');
                                    for (const line of lines) {
                                        if (line.startsWith('data: ')) {
                                            jsonData = line.substring(6).trim();
                                            break;
                                        }
                                    }
                                }

                                resolve(JSON.parse(jsonData));
                            } catch (e) {
                                reject(new Error(`JSON解析失败: ${e.message}`));
                            }
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(error);
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('请求超时'));
                });

                req.write(postData);
                req.end();
            });

            // 验证响应格式
            this._validateResponse(responseData);

            logToTerminal('info', `AI回复中`);

            const message = responseData.choices[0].message;

            // 🔥 调试：打印消息内容
            logToTerminal('info', `✅ 收到AI回复: ${message.content ? message.content.substring(0, 50) : '[无内容]'}...`);

            // 🔥 处理 Qwen3 等模型的 reasoning_content 字段
            // 仅在没有 tool_calls 时才用 reasoning_content 替代空 content（Qwen3 推理模式）
            // 有 tool_calls 时 reasoning_content 是思考过程，不应作为回复内容（Gemini 等）
            if ((!message.content || message.content.trim() === '') && message.reasoning_content && !message.tool_calls) {
                message.content = message.reasoning_content;
            }

            // 🔥 过滤思考内容（Gemini / DeepSeek 等模型可能在 content 中混入思考）
            if (message.content) {
                message.content = this._filterThinkingContent(message.content);
            }

            // 🔥 解析 Qwen 模型的文本格式工具调用（Hermes/XML style）
            // Qwen 模型返回的是文本格式的 <tool_call>，而不是标准的 tool_calls 对象
            if (message.content && !message.tool_calls) {
                const parsedToolCalls = this._parseQwenToolCalls(message.content);
                if (parsedToolCalls && parsedToolCalls.length > 0) {
                    logToTerminal('info', `🔧 AI调用了 ${parsedToolCalls.length} 个工具`);
                    message.tool_calls = parsedToolCalls;
                    // 从 content 中移除工具调用部分，只保留文本回复
                    message.content = this._removeToolCallsFromContent(message.content);
                }
            }

            return message;

        } catch (error) {
            // 多模态不支持错误由上层 llm-handler 统一处理和记录，这里不重复打 ERROR
            const isMultimodalError = error.message.toLowerCase().includes('multimodal') ||
                error.message.toLowerCase().includes('不支持图片') ||
                error.message.toLowerCase().includes('模型不支持图片');

            if (!isMultimodalError) {
                logToTerminal('error', `LLM API调用失败: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * 清理消息格式,确保API兼容性
     * @private
     * @param {Array} messages - 原始消息数组
     * @returns {Array} 清理后的消息数组
     */
    _cleanMessagesForAPI(messages) {
        return messages.map(msg => {
            // 🔥 处理 assistant 消息的 content 为 null 的情况
            if (msg.role === 'assistant') {
                // 如果有 tool_calls 但 content 为 null,设为空字符串
                if (msg.content === null && msg.tool_calls) {
                    return {
                        ...msg,
                        content: '' // 某些API要求content不能为null
                    };
                }
            }

            // 🔥 处理 tool 消息,确保格式正确
            if (msg.role === 'tool') {
                let content = msg.content;

                // 如果content是对象或数组,转为JSON字符串
                if (typeof content === 'object' && content !== null) {
                    try {
                        content = JSON.stringify(content);
                    } catch (e) {
                        content = String(content);
                    }
                }

                // 确保content是字符串
                if (typeof content !== 'string') {
                    content = String(content || '');
                }

                // 🔥 确保字符串不包含控制字符(可能导致JSON解析失败)
                // 移除所有不可见的控制字符,但保留换行符(\n)和制表符(\t)
                content = content.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

                // 🔥 确保字符串长度不超过限制(避免超大响应)
                const MAX_CONTENT_LENGTH = 8000;
                if (content.length > MAX_CONTENT_LENGTH) {
                    content = content.substring(0, MAX_CONTENT_LENGTH) + '...(内容过长已截断)';
                }

                // 返回清理后的tool消息
                return {
                    role: 'tool',
                    name: msg.name || 'unknown_tool',
                    content: content,
                    tool_call_id: msg.tool_call_id
                };
            }

            // 其他消息保持原样
            return msg;
        });
    }

    /**
     * 验证API响应格式
     * @private
     */
    _validateResponse(responseData) {
        // 检查API错误响应
        if (responseData.error) {
            const errorMsg = responseData.error.message || responseData.error || '未知API错误';
            logToTerminal('error', `LLM API错误: ${errorMsg}`);
            // 🔥 将完整的错误信息传递出去，方便重试机制识别
            throw new Error(`API错误: ${errorMsg}`);
        }

        // 检查响应格式,适应不同的API响应结构
        let choices;
        if (responseData.choices) {
            choices = responseData.choices;
        } else if (responseData.data && responseData.data.choices) {
            choices = responseData.data.choices;
        } else {
            // 🔥 详细打印响应数据以便调试
            const debugInfo = JSON.stringify(responseData).substring(0, 500);
            logToTerminal('error', `LLM响应格式异常，缺少choices字段。响应数据: ${debugInfo}`);
            console.error('完整响应数据:', responseData);
            throw new Error('LLM响应格式异常：缺少choices字段或为空');
        }

        if (!choices || choices.length === 0) {
            // 🔥 打印完整响应数据
            const debugInfo = JSON.stringify(responseData).substring(0, 500);
            logToTerminal('error', `LLM响应choices为空。响应数据: ${debugInfo}`);
            console.error('完整响应数据:', responseData);

            // 🔥 检查响应数据中是否包含"不支持图片"相关的错误信息
            const responseStr = JSON.stringify(responseData).toLowerCase();
            if (responseStr.includes('image') &&
                (responseStr.includes('not support') ||
                 responseStr.includes('不支持') ||
                 responseStr.includes('invalid') ||
                 responseStr.includes('unsupported'))) {
                logToTerminal('error', '⚠️ 检测到模型不支持视觉功能');
                throw new Error('模型不支持图片：该模型不支持 image_url 参数');
            }

            // 🔥 检查是否是内容过滤（多种可能的字段）
            if (responseData.promptFilterResults ||
                responseData.finishReason === 'content_filter' ||
                responseData.finish_reason === 'content_filter') {
                throw new Error('API内容过滤：请求被API的内容过滤器拦截，可能包含敏感内容');
            }

            // 🔥 检查usage，如果有prompt_tokens但completion_tokens为0，很可能是内容过滤
            if (responseData.usage &&
                responseData.usage.prompt_tokens > 0 &&
                responseData.usage.completion_tokens === 0) {
                logToTerminal('warn', '⚠️ API处理了请求但拒绝生成内容，可能触发了安全过滤器');
                throw new Error('API拒绝生成内容：可能触发了安全过滤器或内容政策限制。请检查最近的对话内容。');
            }

            throw new Error('LLM响应格式异常：choices为空');
        }

        // 将标准化的choices写回
        responseData.choices = choices;
    }

    /**
     * 解析 Qwen 模型的文本格式工具调用
     * @private
     * @param {string} content - 包含工具调用的文本内容
     * @returns {Array|null} 标准格式的 tool_calls 数组
     */
    _parseQwenToolCalls(content) {
        const toolCalls = [];
        let index = 0;

        // 格式1: <tool_call> ... </tool_call> (JSON 格式)
        const toolCallRegex1 = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
        let match;

        while ((match = toolCallRegex1.exec(content)) !== null) {
            try {
                const toolCallJson = JSON.parse(match[1]);
                toolCalls.push({
                    id: `call_qwen_${Date.now()}_${index}`,
                    type: 'function',
                    function: {
                        name: toolCallJson.name,
                        arguments: JSON.stringify(toolCallJson.arguments || {})
                    }
                });
                index++;
            } catch (error) {
                logToTerminal('warn', `⚠️ 解析 Qwen 工具调用(格式1)失败: ${error.message}`);
            }
        }

        // 格式2: <function_name attr1="value1" attr2="value2"/> (XML 属性格式)
        // 匹配所有自闭合的 XML 标签，例如: <open_webpage url="..."/>
        const toolCallRegex2 = /<(\w+)\s+([^>]+?)\/>/g;

        while ((match = toolCallRegex2.exec(content)) !== null) {
            const functionName = match[1];
            const attributesStr = match[2];

            // 解析属性
            const attributes = {};
            const attrRegex = /(\w+)="([^"]*)"/g;
            let attrMatch;

            while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
                attributes[attrMatch[1]] = attrMatch[2];
            }

            // 转换为 OpenAI 标准格式
            toolCalls.push({
                id: `call_qwen_${Date.now()}_${index}`,
                type: 'function',
                function: {
                    name: functionName,
                    arguments: JSON.stringify(attributes)
                }
            });
            index++;
        }

        return toolCalls.length > 0 ? toolCalls : null;
    }

    /**
     * 过滤模型思考/推理内容，防止思考过程被TTS播放或显示为字幕
     * 支持 Gemini、DeepSeek、Qwen 等模型的多种思考格式
     * @param {string} text - 原始文本
     * @returns {string} 过滤后的文本
     */
    _filterThinkingContent(text) {
        if (!text) return text;

        let filtered = text;

        // 过滤 <think>...</think> 块（DeepSeek、部分 Gemini 格式）
        filtered = filtered.replace(/<think>[\s\S]*?<\/think>/gi, '');

        // 过滤 <thinking>...</thinking> 块
        filtered = filtered.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

        // 过滤 Qwen 的 <thoughts>...</thoughts> 块
        filtered = filtered.replace(/<thoughts>[\s\S]*?<\/thoughts>/gi, '');

        // 过滤包含"根据"、"分析"等关键词的长段落（Qwen推理模式）
        // 只在段落很长且包含多个推理关键词时才过滤
        const lines = filtered.split('\n');
        const filteredLines = lines.filter(line => {
            const thinkingKeywords = ['根据', '分析', '考虑到', '因此可以', '综合以上', '推理', '判断'];
            const hasMultipleKeywords = thinkingKeywords.filter(kw => line.includes(kw)).length >= 2;
            return !(hasMultipleKeywords && line.length > 50);
        });
        filtered = filteredLines.join('\n');

        // 过滤 Gemini 中文思考格式：整段以"思考"开头（独占一行）的内容
        // 仅在整段内容都是思考时才清除（避免误杀正常对话中的"思考"二字）
        if (/^思考\s*\n/.test(filtered)) {
            filtered = '';
        }

        // 过滤 Gemini 英文思考格式：整段以"Thinking"开头（独占一行）
        if (/^Thinking\s*\n/i.test(filtered)) {
            filtered = '';
        }

        // 过滤以"让我"开头的推理过程（Qwen常见模式）
        if (/^让我[分析思考推理]/.test(filtered)) {
            // 找到第一个非推理句子
            const sentences = filtered.split(/[。！？\n]/);
            const nonThinkingSentences = sentences.filter(s =>
                s.trim() && !(/^(让我|首先|其次|然后|接下来|综上|因此)[分析思考推理]/.test(s.trim()))
            );
            filtered = nonThinkingSentences.join('。');
        }

        return filtered.trim();
    }

    /**
     * 从内容中移除工具调用部分
     * @private
     * @param {string} content - 原始内容
     * @returns {string} 移除工具调用后的内容
     */
    _removeToolCallsFromContent(content) {
        // 移除格式1: <tool_call> ... </tool_call>
        let cleaned = content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '');

        // 移除格式2: <function_name attr="value"/>
        cleaned = cleaned.replace(/<\w+\s+[^>]+?\/>/g, '');

        return cleaned.trim();
    }

    /**
     * 处理流式响应
     * @private
     * @param {Response} response - Fetch响应对象
     * @param {Function} onChunk - 接收每个文本块的回调函数
     * @returns {Promise<Object>} 完整的消息对象
     */
    async _handleStreamResponse(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let buffer = '';
        let fullContent = '';
        let toolCalls = null;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // 解码数据块
                buffer += decoder.decode(value, { stream: true });

                // 处理SSE格式的数据（data: {...}\n\n）
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // 保留不完整的行

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]' || trimmed === 'data:[DONE]') continue;//添加心流API支持

                    if (trimmed.startsWith('data:')) {
                        try {
                            const jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5); // 移除 "data: " 前缀，自适应有无空格
                            const chunk = JSON.parse(jsonStr);

                            // 提取内容
                            const delta = chunk.choices?.[0]?.delta;
                            if (!delta) continue;

                            // 处理文本内容
                            if (delta.content) {
                                fullContent += delta.content;
                                onChunk(delta.content); // 🔥 实时回调
                            }

                            // 处理工具调用
                            if (delta.tool_calls) {
                                if (!toolCalls) toolCalls = [];
                                // 累积工具调用信息
                                for (const toolCall of delta.tool_calls) {
                                    const index = toolCall.index || 0;
                                    if (!toolCalls[index]) {
                                        toolCalls[index] = {
                                            id: toolCall.id || '',
                                            type: 'function',
                                            function: { name: '', arguments: '' }
                                        };
                                    }
                                    if (toolCall.id) toolCalls[index].id = toolCall.id;
                                    if (toolCall.function?.name) toolCalls[index].function.name = toolCall.function.name;
                                    if (toolCall.function?.arguments) toolCalls[index].function.arguments += toolCall.function.arguments;
                                }
                            }
                        } catch (parseError) {
                            // 忽略解析错误，继续处理下一行
                            logToTerminal('warn', `⚠️ 流式数据解析失败: ${parseError.message}`);
                        }
                    }
                }
            }

//            logToTerminal('info', `✅ 流式响应接收完成`);

            // 🔥 过滤思考内容（Gemini 等模型可能在流式 content 中混入思考过程）
            if (fullContent) {
                fullContent = this._filterThinkingContent(fullContent);
            }

            // 构建完整的消息对象
            const message = {
                role: 'assistant',
                content: fullContent || null
            };

            if (toolCalls && toolCalls.length > 0) {
                message.tool_calls = toolCalls;
            }

            // 🔥 解析 Qwen 模型的文本格式工具调用
            if (message.content && !message.tool_calls) {
                const parsedToolCalls = this._parseQwenToolCalls(message.content);
                if (parsedToolCalls && parsedToolCalls.length > 0) {
                    logToTerminal('info', `🔧 AI调用了 ${parsedToolCalls.length} 个工具`);
                    message.tool_calls = parsedToolCalls;
                    message.content = this._removeToolCallsFromContent(message.content);
                }
            }

            return message;

        } catch (error) {
            logToTerminal('error', `流式响应处理错误: ${error.message}`);
            throw error;
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * 更新API配置
     * @param {Object} newConfig - 新的配置对象
     */
    updateConfig(newConfig) {
        if (newConfig.llm) {
            this.apiKey = newConfig.llm.api_key || this.apiKey;
            this.apiUrl = newConfig.llm.api_url || this.apiUrl;
            this.model = newConfig.llm.model || this.model;
            this.temperature = newConfig.llm.temperature !== undefined ? newConfig.llm.temperature : this.temperature;  // 🔥 支持temperature更新
            this.temperatureEnabled = newConfig.llm.temperature_enabled !== undefined ? newConfig.llm.temperature_enabled : this.temperatureEnabled;
            logToTerminal('info', 'LLM客户端配置已更新');
        }
    }

    /**
     * 查询RAG知识库
     * @param {string} question - 用户的问题
     * @returns {Promise<Array>} 相关知识段落数组
     */
    async queryRAG(question) {
        if (!this.ragEnabled) {
            return [];
        }

        try {
            const url = new URL(`${this.ragUrl}/ask`);
            const postData = JSON.stringify({
                question: question,
                top_k: this.ragTopK
            });

            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            return new Promise((resolve, reject) => {
                const protocol = url.protocol === 'https:' ? https : http;
                const req = protocol.request(options, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        if (res.statusCode !== 200) {
                            logToTerminal('warn', `⚠️ RAG查询失败: ${res.statusCode}`);
                            resolve([]);
                            return;
                        }

                        try {
                            const result = JSON.parse(data);
                            const passages = result.relevant_passages || [];

                            if (passages.length > 0) {
                                logToTerminal('info', `📚 RAG找到 ${passages.length} 个相关记忆 (相似度: ${passages[0].similarity.toFixed(3)})`);
                            }

                            resolve(passages);
                        } catch (parseError) {
                            logToTerminal('warn', `⚠️ RAG响应解析失败: ${parseError.message}`);
                            resolve([]);
                        }
                    });
                });

                req.on('error', (error) => {
                    logToTerminal('warn', `⚠️ RAG服务不可用: ${error.message}`);
                    resolve([]);
                });

                req.write(postData);
                req.end();
            });
        } catch (error) {
            logToTerminal('warn', `⚠️ RAG查询异常: ${error.message}`);
            return [];
        }
    }

    /**
     * 获取当前配置
     * @returns {Object}
     */
    getConfig() {
        return {
            apiUrl: this.apiUrl,
            model: this.model
        };
    }
}

module.exports = { LLMClient };
