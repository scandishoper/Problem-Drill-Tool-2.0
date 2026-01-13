# 主观题刷题器

这是一个用于主观题练习的简单工具，包含两个主要程序：[sub-insert.cpp](./sub-insert.cpp) 用于添加主观题，[sub-quiz.cpp](./sub-quiz.cpp) 用于进行刷题练习。

## 功能说明

### 1. 添加题目（[sub-insert.cpp](./sub-insert.cpp)）

- 用于向题库文件（sub-questions.txt）中添加主观题及参考答案
- 支持添加多个题目，每个题目可包含多个参考答案要点

### 2. 刷题练习（[sub-quiz.cpp](./sub-quiz.cpp)）

- 从题库文件读取题目进行练习
- 支持两种模式：顺序答题和随机答题
- 答题完成后会显示参考答案
- 自动记录用户答案和参考答案到 sub-answer.txt 文件

## 使用方法

### 编译程序

```bash
g++ sub-insert.cpp -o sub-insert
g++ sub-quiz.cpp -o sub-quiz
```

### 添加题目

1. 运行 `sub-insert`
2. 按照提示输入题目内容
3. 输入参考答案要点（每行一个要点，空行结束）
4. 选择是否继续添加其他题目（默认结束，输入 y/Y 继续添加）

### 开始刷题

1. 运行 `sub-quiz`
2. 选择答题模式（1. 顺序答题 / 2. 随机答题）
3. 按照题目提示输入答案（每行一个要点，空行结束）
4. 系统会显示你的答案和参考答案进行对比
5. 所有题目完成后，答案会保存到 sub-answer.txt

## 文件说明

- [sub-insert.cpp](./sub-insert.cpp)：添加题目程序源代码
- [sub-quiz.cpp](./sub-quiz.cpp)：刷题程序源代码
- `sub-questions.txt`：题库文件，存储所有添加的题目和答案
- `sub-answer.txt`：答题记录文件，记录每次练习的题目、用户答案和参考答案

## 数据格式

题库文件 `sub-questions.txt` 采用以下格式存储题目：

```plaintext
#SUBJECTIVE
题目内容
#ANSWER
参考答案要点1
参考答案要点2
...
#END

#SUBJECTIVE
下一个题目内容
#ANSWER
下一个题目的参考答案要点1
...
#END
```

答题记录文件 `sub-answer.txt` 会按照类似格式记录每次答题情况，包含用户答案和参考答案的对比。