#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""RAG服务测试脚本"""

import requests
import json

RAG_URL = "http://127.0.0.1:8002"

def test_rag_status():
    """测试RAG服务状态"""
    print("=== 测试RAG服务状态 ===")
    response = requests.get(f"{RAG_URL}/")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    print()

def test_rag_query(question, top_k=3):
    """测试RAG知识检索"""
    print(f"=== 查询: {question} ===")
    response = requests.post(
        f"{RAG_URL}/ask",
        json={"question": question, "top_k": top_k}
    )
    result = response.json()

    print(f"处理时间: {result['processing_time']:.4f}秒")
    print(f"找到 {len(result['relevant_passages'])} 个相关段落:\n")

    for passage in result['relevant_passages']:
        print(f"排名 {passage['rank']} (相似度: {passage['similarity']:.4f})")
        print(f"内容: {passage['content'][:200]}...")
        print()

if __name__ == "__main__":
    # 测试服务状态
    test_rag_status()

    # 测试不同查询
    test_rag_query("用户的名字是什么")
    test_rag_query("项目用的是什么技术栈")
    test_rag_query("肥牛的性格特点")
    test_rag_query("最近解决了什么问题")
