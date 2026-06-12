/**
 * 网易云音乐下载工具
 * 使用自定义网易云 API 下载歌曲
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const API_BASE = 'https://ncmapi.fuwari.fun';
const OUTPUT_DIR = path.join(__dirname, 'song-library', 'downloads');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ 创建目录: ${OUTPUT_DIR}`);
}

/**
 * 搜索歌曲
 * @param {string} keyword - 搜索关键词
 * @param {number} limit - 返回结果数量
 */
async function searchSong(keyword, limit = 10) {
    try {
        console.log(`🔍 搜索歌曲: ${keyword}`);
        const response = await axios.get(`${API_BASE}/search`, {
            params: {
                keywords: keyword,
                limit: limit,
                type: 1 // 1=单曲
            }
        });

        if (response.data.code === 200 && response.data.result.songs) {
            const songs = response.data.result.songs.map(song => ({
                id: song.id,
                name: song.name,
                artist: song.artists.map(a => a.name).join(', '),
                album: song.album.name,
                duration: Math.floor(song.duration / 1000)
            }));

            console.log(`\n📋 搜索结果 (共 ${songs.length} 首):\n`);
            songs.forEach((song, index) => {
                console.log(`${index + 1}. ${song.name} - ${song.artist}`);
                console.log(`   专辑: ${song.album} | 时长: ${formatDuration(song.duration)} | ID: ${song.id}`);
            });

            return songs;
        } else {
            console.error('❌ 搜索失败:', response.data);
            return [];
        }
    } catch (error) {
        console.error('❌ 搜索出错:', error.message);
        return [];
    }
}

/**
 * 获取歌曲下载链接
 * @param {number} songId - 歌曲 ID
 */
async function getSongUrl(songId) {
    try {
        const response = await axios.get(`${API_BASE}/song/url/v1`, {
            params: {
                id: songId,
                level: 'higher' // 音质: standard, higher, exhigh, lossless, hires
            }
        });

        if (response.data.code === 200 && response.data.data && response.data.data[0]) {
            return response.data.data[0].url;
        } else {
            console.error('❌ 获取链接失败:', response.data);
            return null;
        }
    } catch (error) {
        console.error('❌ 获取链接出错:', error.message);
        return null;
    }
}

/**
 * 获取歌曲详情
 * @param {number} songId - 歌曲 ID
 */
async function getSongDetail(songId) {
    try {
        const response = await axios.get(`${API_BASE}/song/detail`, {
            params: { ids: songId }
        });

        if (response.data.code === 200 && response.data.songs && response.data.songs[0]) {
            const song = response.data.songs[0];
            return {
                id: song.id,
                name: song.name,
                artist: song.ar.map(a => a.name).join(', '),
                album: song.al.name,
                duration: Math.floor(song.dt / 1000)
            };
        }
        return null;
    } catch (error) {
        console.error('❌ 获取详情出错:', error.message);
        return null;
    }
}

/**
 * 获取歌词
 * @param {number} songId - 歌曲 ID
 */
async function getLyrics(songId) {
    try {
        const response = await axios.get(`${API_BASE}/lyric`, {
            params: { id: songId }
        });

        if (response.data.code === 200 && response.data.lrc) {
            // 移除时间戳 [00:00.00]
            const lyrics = response.data.lrc.lyric
                .split('\n')
                .filter(line => !line.match(/^\[\d+:\d+\.\d+\]$/)) // 过滤空时间戳行
                .map(line => line.replace(/^\[\d+:\d+\.\d+\]/g, '').trim()) // 移除时间戳
                .filter(line => line.length > 0) // 过滤空行
                .join('\n');
            return lyrics;
        }
        return '暂无歌词';
    } catch (error) {
        console.error('❌ 获取歌词出错:', error.message);
        return '暂无歌词';
    }
}

/**
 * 下载歌曲
 * @param {number} songId - 歌曲 ID
 * @param {string} filename - 保存的文件名
 */
async function downloadSong(songId, filename = null) {
    try {
        console.log(`\n📥 准备下载歌曲 ID: ${songId}`);

        // 获取歌曲详情
        const detail = await getSongDetail(songId);
        if (!detail) {
            console.error('❌ 无法获取歌曲详情');
            return false;
        }

        console.log(`🎵 歌曲: ${detail.name} - ${detail.artist}`);

        // 获取下载链接
        const url = await getSongUrl(songId);
        if (!url) {
            console.error('❌ 无法获取下载链接');
            return false;
        }

        console.log(`🔗 下载链接: ${url}`);

        // 确定文件名
        if (!filename) {
            filename = `${sanitizeFilename(detail.name)}-${sanitizeFilename(detail.artist)}.mp3`;
        }

        const filepath = path.join(OUTPUT_DIR, filename);

        // 下载文件
        console.log(`⏬ 正在下载...`);
        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 60000 // 60秒超时
        });

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`✅ 下载完成: ${filepath}`);

        // 获取并保存歌词
        const lyrics = await getLyrics(songId);
        const metadataPath = filepath.replace('.mp3', '.json');
        const metadata = {
            title: detail.name,
            artist: detail.artist,
            album: detail.album,
            duration: detail.duration,
            lyrics: lyrics,
            songId: songId
        };

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log(`📝 元数据已保存: ${metadataPath}`);

        return true;
    } catch (error) {
        console.error('❌ 下载失败:', error.message);
        return false;
    }
}

/**
 * 批量下载歌曲
 * @param {Array<number>} songIds - 歌曲 ID 数组
 */
async function downloadMultipleSongs(songIds) {
    console.log(`\n🎵 开始批量下载 ${songIds.length} 首歌曲\n`);

    for (let i = 0; i < songIds.length; i++) {
        console.log(`\n[${i + 1}/${songIds.length}]`);
        await downloadSong(songIds[i]);

        // 延迟避免请求过快
        if (i < songIds.length - 1) {
            console.log('⏳ 等待 2 秒...');
            await sleep(2000);
        }
    }

    console.log('\n✅ 所有歌曲下载完成！');
}

/**
 * 清理文件名（移除非法字符）
 */
function sanitizeFilename(name) {
    return name.replace(/[\/\\:*?"<>|]/g, '-').trim();
}

/**
 * 格式化时长
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 延迟函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 主程序
// ============================================

async function main() {
    console.log('🎵 网易云音乐下载工具\n');

    // 从命令行参数获取搜索关键词
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('📖 使用方法:');
        console.log('  node download-music.js <搜索关键词>');
        console.log('  node download-music.js <歌曲ID1> <歌曲ID2> ...');
        console.log('\n示例:');
        console.log('  node download-music.js 告白气球');
        console.log('  node download-music.js 25906124 25906125');
        return;
    }

    // 判断是歌曲 ID 还是搜索关键词
    const isAllNumbers = args.every(arg => /^\d+$/.test(arg));

    if (isAllNumbers) {
        // 直接下载指定 ID 的歌曲
        const songIds = args.map(id => parseInt(id));
        await downloadMultipleSongs(songIds);
    } else {
        // 搜索歌曲
        const keyword = args.join(' ');
        const songs = await searchSong(keyword, 10);

        if (songs.length === 0) {
            console.log('❌ 没有找到相关歌曲');
            return;
        }

        console.log('\n💡 提示: 使用以下命令下载:');
        console.log(`  node download-music.js ${songs[0].id}  # 下载第一首`);
        console.log(`  node download-music.js ${songs.map(s => s.id).slice(0, 3).join(' ')}  # 下载前三首`);
    }
}

// 运行主程序
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 程序出错:', error);
        process.exit(1);
    });
}

// 导出函数供其他模块使用
module.exports = {
    searchSong,
    getSongUrl,
    getSongDetail,
    getLyrics,
    downloadSong,
    downloadMultipleSongs
};
