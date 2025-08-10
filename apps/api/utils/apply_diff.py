from typing import Tuple

def remove_lines(file_content: str, start_line: int = None, end_line: int = None) -> Tuple[bool, str]:
  lines = file_content.split("\n")
  start_index = start_line - 1 if start_line is not None else 0
  end_index = end_line - 1 if end_line is not None else len(lines) - 1
  pass

def insert_lines(file_content: str, insert_content: str, start_line: int = None) -> Tuple[bool, str]:
  lines = file_content.split("\n")
  pass



######################################### 

from typing import List, Dict, Any

def apply_diff(file_content: str, modifications: List[Dict[str, Any]]) -> str:
    """
    通用的代码文件修改函数，支持替换、添加、删除、移动、合并和分裂行。
    支持多种常见的 diff 操作。
    
    :param file_content: 代码文件的内容 (str)
    :param modifications: 修改操作的列表，每个操作是字典形式
    :return: 修改后的代码内容 (str)
    """
    # 将文件内容按行分割为列表
    lines = file_content.splitlines()

    # 按照行号排序修改操作，确保先处理较小的行号
    modifications.sort(key=lambda x: x.get("line_number", 0))

    # 逐个应用修改操作
    for mod in modifications:
        operation_type = mod["type"]
        line_number = mod["line_number"] - 1  # 转换为 0 索引

        if operation_type == "replace":
            # 单行替换
            new_content = mod["new_content"]
            if 0 <= line_number < len(lines):
                lines[line_number] = new_content

        elif operation_type == "replace_range":
            # 多行替换为单行或替换多行为多行
            start_line = mod["start_line"] - 1
            end_line = mod["end_line"]
            new_content = mod["new_content"]

            if start_line < len(lines):
                lines[start_line:end_line] = [new_content]  # 替换为指定行数

                # 动态调整后续操作的行号
                for m in modifications:
                    if m["line_number"] > mod["start_line"]:
                        offset = (end_line - start_line - 1)
                        m["line_number"] -= offset

        elif operation_type == "delete":
            # 删除单行或多行
            if 0 <= line_number < len(lines):
                del lines[line_number]

        elif operation_type == "add":
            # 添加单行或多行
            new_content = mod["new_content"]
            if 0 <= line_number < len(lines):
                lines.insert(line_number, new_content)
            else:
                lines.append(new_content)  # 如果指定行号超出范围，添加到末尾

        elif operation_type == "move":
            # 移动单行或多行
            start_line = mod["start_line"] - 1
            end_line = mod["end_line"]
            target_line = mod["target_line"] - 1
            if start_line < len(lines) and target_line < len(lines):
                lines_to_move = lines[start_line:end_line]
                # 删除原位置的行
                del lines[start_line:end_line]
                # 插入到目标位置
                lines.insert(target_line, lines_to_move)

        elif operation_type == "merge":
            # 合并两行
            start_line = mod["start_line"] - 1
            end_line = mod["end_line"]
            if start_line < len(lines) and end_line < len(lines):
                merged_line = "".join(lines[start_line:end_line])
                lines[start_line] = merged_line
                del lines[start_line + 1:end_line]

        elif operation_type == "split":
            # 分裂一行
            line_number = mod["line_number"] - 1
            split_content = mod["new_content"]
            if 0 <= line_number < len(lines):
                line_to_split = lines[line_number]
                # 用新内容替换该行
                lines[line_number] = split_content[0]
                for line in split_content[1:]:
                    lines.insert(line_number + 1, line)

    # 返回修改后的代码内容
    return "\n".join(lines)


# 示例：修改操作列表
modifications = [
    {
        "type": "replace_range",
        "start_line": 3,  # 替换 3-5 行为 1 行
        "end_line": 5,
        "new_content": '    print("Replaced 3-5")'
    },
    {
        "type": "replace_range",
        "start_line": 7,  # 替换 7-9 行为 1 行
        "end_line": 9,
        "new_content": '    print("Replaced 7-9")'
    },
    {
        "type": "move",
        "start_line": 2,
        "end_line": 3,
        "target_line": 6  # 将第 2 到 3 行移动到第 6 行
    },
    {
        "type": "merge",
        "start_line": 1,
        "end_line": 2,  # 合并第 1 和 2 行
    },
    {
        "type": "split",
        "line_number": 4,  # 将第 4 行分裂成两行
        "new_content": ["    hello_world()", "    print('Additional Line')"]
    }
]

# 示例代码内容 (Python 代码)
file_content = """
def hello_world():
    print("Hello, world!")

def add_numbers(a, b):
    return a + b

if __name__ == "__main__":
    hello_world()
    print("Some extra text")
    add_numbers(1, 2)
    print("Another extra text")
"""

# 执行修改
modified_content = apply_diff(file_content, modifications)
print(modified_content)
