import re

def apply_diff(original_content: str, diff_content: str) -> str:
    """
    解析 diff_content 并应用到 original_content
    """
    # 按行分割原文件
    lines = original_content.splitlines()

    # 匹配 diff 块
    pattern = re.compile(
        r'(?<!\\)<<<<<<< SEARCH\n'     # SEARCH 标记
        r'([\s\S]*?)\n'                # SEARCH 内容
        r'=======\n'                   # 分隔
        r'([\s\S]*?)\n'                # REPLACE 内容
        r'>>>>>>> REPLACE',            # REPLACE 标记
        re.MULTILINE
    )

    # 存储结果
    modified_lines = lines[:]

    for match in pattern.finditer(diff_content):
        search_block, replace_block = match.groups()
        search_lines = search_block.splitlines()
        replace_lines = replace_block.splitlines()

        # 内容搜索模式
        found = False
        for i in range(len(modified_lines) - len(search_lines) + 1):
            if modified_lines[i:i+len(search_lines)] == search_lines:
                modified_lines[i:i+len(search_lines)] = replace_lines
                found = True
                break
        if not found:
            raise ValueError(f"SEARCH block not found:\n{search_block}")

    return "\n".join(modified_lines)