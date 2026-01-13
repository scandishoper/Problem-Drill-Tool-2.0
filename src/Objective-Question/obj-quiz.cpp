#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <algorithm>
#include <random>
#include <sstream>
#include <ctime>
#include <cctype>  // 用于字符大小写转换

#ifdef _WIN32
#include <windows.h>
#endif

using namespace std;

struct Question {
    string type;       // 问题类型，JUDGE/CHOICE/MULTICHOICE
    vector<string> question;   // 问题（多行文本）
    vector<string> options;  // 选项
    vector<int> correctAnswers;  // 正确答案编号
};

// 辅助函数：将字母（A/B/C/D）转换为数字索引
int charToIndex(char c) {
    c = toupper(c);  // 转为大写
    if (c >= 'A' && c <= 'Z') {
        return c - 'A';
    }
    return -1;  // 无效字符
}

// 辅助函数：将数字索引转换为字母（A/B/C/D）
char indexToChar(int idx) {
    if (idx >= 0 && idx < 26) {
        return 'A' + idx;
    }
    return '?';  // 超出范围
}

// 读取问题
vector<Question> loadQuestions(const string& filename) {
    vector<Question> questions;
    ifstream file(filename);
    if (!file) {
        cerr << "Unable to read file: " << filename << endl;
        return questions;
    }

    string line;
    Question q;
    enum State { NONE, IN_QUESTION, IN_OPTIONS, IN_CORRECT } state = NONE;

    while (getline(file, line)) {
        if (line.substr(0, 7) == "#JUDGE" || 
            line.substr(0, 7) == "#CHOICE" || 
            line.substr(0, 12) == "#MULTICHOICE") {
            if (!q.question.empty()) {
                questions.push_back(q);
            }
            q = Question();
            q.type = line.substr(1);  // 去掉#号
            state = IN_QUESTION;  // 切换到读取题干状态
        } else if (line == "#OPTIONS") {
            state = IN_OPTIONS;
        } else if (line == "#CORRECT") {
            state = IN_CORRECT;
        } else if (line == "#END") {
            questions.push_back(q);
            q = Question();
            state = NONE;
        } else if (!line.empty()) {
            switch (state) {
                case IN_QUESTION:
                    q.question.push_back(line);  // 多行题干逐行添加
                    break;
                case IN_OPTIONS:
                    q.options.push_back(line);
                    break;
                case IN_CORRECT: {
                    // 解析正确答案
                    size_t pos = 0;
                    while (pos < line.size()) {
                        size_t comma = line.find(',', pos);
                        if (comma == string::npos) {
                            q.correctAnswers.push_back(stoi(line.substr(pos)) - 1);
                            break;
                        }
                        q.correctAnswers.push_back(stoi(line.substr(pos, comma - pos)) - 1);
                        pos = comma + 1;
                    }
                    break;
                }
                default:
                    break;
            }
        }
    }

    if (!q.question.empty()) {
        questions.push_back(q);
    }
    file.close();
    return questions;
}

// 写入答案到文件
void writeAnswerToFile(const Question& q, const vector<int>& userAnswers) {
    ofstream answerFile("obj-answers.txt", ios::app);
    if (!answerFile) {
        cerr << "Unable to create obj-answers.txt\n";
        return;
    }

    answerFile << "#" << q.type << "\n";
    // 写入多行题干
    for (const auto& line : q.question) {
        answerFile << line << "\n";
    }
    
    // 显示所有选项
    answerFile << "#OPTIONS\n";
    for (size_t j = 0; j < q.options.size(); ++j) {
        if (q.type == "JUDGE") {
            answerFile << j + 1 << ". " << q.options[j] << "\n";
        } else {
            answerFile << indexToChar(j) << ". " << q.options[j] << "\n";
        }
    }
    
    answerFile << "#USER_ANSWER\n";
    for (size_t i = 0; i < userAnswers.size(); ++i) {
        if (i > 0) answerFile << ",";
        answerFile << q.options[userAnswers[i]];  // 输出选项内容而不是序号
    }
    answerFile << "\n#CORRECT_ANSWER\n";
    for (size_t i = 0; i < q.correctAnswers.size(); ++i) {
        if (i > 0) answerFile << ",";
        answerFile << q.options[q.correctAnswers[i]];  // 输出选项内容而不是序号
    }
    answerFile << "\n#END\n\n";

    answerFile.close();
}

// 设置命令行颜色，仅限Windows系统
void setColor(int color) {
#ifdef _WIN32
    HANDLE hConsole = GetStdHandle(STD_OUTPUT_HANDLE);
    SetConsoleTextAttribute(hConsole, color);
#endif
}

// 解析用户答案（支持数字和字母）
vector<int> parseUserAnswer(const string& input, const vector<int>& optionIndices, const string& type) {
    vector<int> answers;
    size_t pos = 0;
    
    if (type == "JUDGE") {
        // 判断题特殊处理（T/F或1/2）
        string trimmed = input;
        trimmed.erase(remove_if(trimmed.begin(), trimmed.end(), ::isspace), trimmed.end());
        if (trimmed == "T" || trimmed == "t" || trimmed == "1") {
            answers.push_back(optionIndices[0]);
        } else if (trimmed == "F" || trimmed == "f" || trimmed == "2") {
            answers.push_back(optionIndices[1]);
        }
        return answers;
    }

    while (pos < input.size()) {
        // 跳过空格
        while (pos < input.size() && isspace(input[pos])) {
            pos++;
        }
        if (pos >= input.size()) break;

        size_t comma = input.find(',', pos);
        string token;
        if (comma == string::npos) {
            token = input.substr(pos);
            pos = input.size();
        } else {
            token = input.substr(pos, comma - pos);
            pos = comma + 1;
        }

        // 去除token中的空格
        token.erase(remove_if(token.begin(), token.end(), ::isspace), token.end());
        if (token.empty()) continue;

        int idx = -1;
        if (isdigit(token[0])) {
            // 数字输入（1/2/3/4）
            idx = stoi(token) - 1;
        } else {
            // 字母输入（A/B/C/D）
            idx = charToIndex(token[0]);
        }

        // 检查索引是否有效
        if (idx >= 0 && idx < (int)optionIndices.size()) {
            answers.push_back(optionIndices[idx]);
        }
    }

    return answers;
}

// 选择模式
void quizMode(vector<Question>& questions, bool randomOrder) {
    if (randomOrder) {
        srand(static_cast<unsigned int>(time(nullptr)));
        default_random_engine rng(rand());
        shuffle(questions.begin(), questions.end(), rng);
    }

    int correctCount = 0;
    int totalQuestions = questions.size();

    for (size_t i = 0; i < questions.size(); ++i) {
        const auto& q = questions[i];
        cout << "\nQuestion " << i + 1 << " / " << questions.size() << "\n\n";
        
        // 显示问题内容（多行）
        string typeStr;
        if (q.type == "JUDGE") typeStr = "[Judge/判断题]";
        else if (q.type == "CHOICE") typeStr = "[Choice/选择题]";
        else if (q.type == "MULTICHOICE") typeStr = "[Multi-choice/多选题]";
        cout << typeStr << "\n";

        int code_line = 0;
        for (size_t j = 0; j < q.question.size(); ++j) {
            // 如果检测到本行前面有连续的4个空格，则删除这4个空格，并认定为代码行
            if (q.question[j].size() >= 4 && q.question[j].substr(0,4) == "    ") {
                printf("%2d -| ", ++code_line);
                cout << q.question[j].substr(4) << "\n";
            } else {
                cout << q.question[j] << "\n";
            }
        }

        cout << "\nOptions:\n";
        
        // 生成选项索引并打乱
        vector<int> optionIndices(q.options.size());
        for (size_t j = 0; j < optionIndices.size(); ++j) {
            optionIndices[j] = j;
        }
        // 选择/多选打乱选项
        if (q.type == "CHOICE" || q.type == "MULTICHOICE") {
            default_random_engine rng(static_cast<unsigned int>(time(nullptr)) + i);
            shuffle(optionIndices.begin(), optionIndices.end(), rng);
        }
        
        // 显示打乱后的选项（判断题显示T/F，其他显示ABCD）
        for (size_t j = 0; j < optionIndices.size(); ++j) {
            if (q.type == "JUDGE") {
                cout << j + 1 << ". " << q.options[optionIndices[j]] << "\n";
            } else {
                cout << indexToChar(j) << ". " << q.options[optionIndices[j]] << "\n";
            }
        }
        
        // 获取用户答案
        vector<int> userAnswers;
        cout << "\nPlease enter the answer" << (q.type == "MULTICHOICE" ? " (separate multiple answers with [,])" : "") << ": ";
        string ansInput;
        getline(cin, ansInput);
        
        // 解析用户答案（支持数字和字母）
        userAnswers = parseUserAnswer(ansInput, optionIndices, q.type);
        
        // 判断用户答案是否正确，进行比较
        vector<int> userAnswersSorted = userAnswers;
        vector<int> correctAnswersSorted = q.correctAnswers;
        sort(userAnswersSorted.begin(), userAnswersSorted.end());
        sort(correctAnswersSorted.begin(), correctAnswersSorted.end());
        bool isCorrect = (userAnswersSorted == correctAnswersSorted && userAnswers.size() == q.correctAnswers.size());

        // 显示正确与否
        if (isCorrect) {
            setColor(10);  // 绿色
            cout << "\nCorrect!\n";
            setColor(7);   // 恢复默认颜色
            correctCount++;
        } else {
            setColor(12);  // 红色
            cout << "\nIncorrect!";
            cout << "Correct Answer: ";
            for (size_t j = 0; j < q.correctAnswers.size(); ++j) {
                if (j > 0) cout << ",";
                // 找到正确答案在打乱后的索引位置
                auto it = find(optionIndices.begin(), optionIndices.end(), q.correctAnswers[j]);
                int displayIdx = it - optionIndices.begin();
                if (q.type == "JUDGE") {
                    cout << (displayIdx + 1) << "(" << q.options[q.correctAnswers[j]] << ")";
                } else {
                    cout << indexToChar(displayIdx) << "(" << q.options[q.correctAnswers[j]] << ")";
                }
            }
            cout << "\n";
            setColor(7);   // 恢复默认颜色

            // 只记录错误答案到文件
            writeAnswerToFile(q, userAnswers);
        }
        cout << endl;
    }

    cout << "\nQuiz over, correct " << correctCount << " questions out of " << totalQuestions << ".";
    cout << " Accuracy: " << (correctCount * 100.0 / totalQuestions) << "%\n";

    cout << "\nIncorrect answers have been recorded in obj-answers.txt\n";
    cout << "Press [ENTER] to exit...";
    getchar();
}

int main() {
    string filename;
    cout << "Please enter the question bank filename: ";
    getline(cin, filename);
    // 如果 filename 不是.txt结尾，则添加
    if (filename.size() < 4 || filename.substr(filename.size() - 4) != ".txt") {
        filename += ".txt";
    }
    vector<Question> questions = loadQuestions(filename);
    if (questions.empty()) {
        cout << "No questions found, please use obj-insert.cpp to add questions\n";
        return 1;
    }

    string mode;
    cout << "Please select mode:\n1. Sequential Quiz\n2. Random Quiz\nPlease choose: ";
    getline(cin, mode);

    quizMode(questions, mode[0] == '2');
    return 0;
}