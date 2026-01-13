#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
#include <ctime>
#include <chrono>
#include <random>

using namespace std;

struct Question {
    vector<string> question;  // 改为vector存储多行题干
    vector<string> answers;
};

vector<Question> loadQuestions(const string& filename) {
    vector<Question> questions;
    ifstream file(filename);
    if (!file) {
        cerr << "Unable to open file: " << filename << endl;
        return questions;
    }

    string line;
    Question q;
    bool inQuestion = false;  // 新增标记：是否在读取题干
    bool inAnswers = false;

    while (getline(file, line)) {
        if (line == "#SUBJECTIVE") {
            if (!q.question.empty()) questions.push_back(q); // 保存上一个问题
            q = {};
            inQuestion = true;  // 开始读取题干
            inAnswers = false;
        } else if (line == "#ANSWER") {
            inQuestion = false; // 结束读取题干
            inAnswers = true;   // 开始读取答案
        } else if (line == "#END") {
            questions.push_back(q);
            q = {};
            inQuestion = false;
            inAnswers = false;
        } else if (inQuestion && !line.empty()) {
            q.question.push_back(line);  // 多行题干
        } else if (inAnswers && !line.empty()) {
            q.answers.push_back(line);
        }
    }

    if (!q.question.empty()) questions.push_back(q); // 保存最后一个问题
    file.close();
    return questions;
}

void writeAnswerToFile(const Question& q, const vector<string>& userAnswers) {
    ofstream answerFile("sub-answer.txt", ios::app);
    if (!answerFile) {
        cerr << "Unable to open sub-answer.txt\n";
        return;
    }

    answerFile << "#SUBJECTIVE\n";
    for (const auto& line : q.question) {  // 写入多行题干
        answerFile << line << "\n";
    }
    answerFile << "#USER_ANSWER\n";
    for (size_t idx = 0; idx < userAnswers.size(); ++idx) {
        answerFile << userAnswers[idx] << "\n";  // 不编号，保持原始输入格式
    }
    answerFile << "#CORRECT_ANSWER\n";
    for (const auto& ans : q.answers) {
        answerFile << ans << "\n";
    }
    answerFile << "#END\n\n";

    answerFile.close();
}

void quizMode(vector<Question>& questions, bool randomOrder) {
    if (randomOrder) {
        srand(static_cast<unsigned int>(time(nullptr)));
        default_random_engine rng(rand());
        shuffle(questions.begin(), questions.end(), rng);
    }

    for (size_t i = 0; i < questions.size(); ++i) {
        const auto& q = questions[i];
        cout << "\nQuestion " << i + 1 << ":\n";
        cout << "[Subjective Question]\n";

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
        
        cout << "\nPlease enter the main points of your response (one per line, end with a blank line):\n";
        vector<string> userAnswers;
        string line;
        for (int cnt = 1;; ++cnt) {
            cout << cnt << " - ";
            getline(cin, line);
            if (line.empty()) break;  // 空行结束输入
            userAnswers.push_back(line);
        }

        // 显示用户答案
        cout << "\nYour Answer:\n";
        for (const auto& ans : userAnswers) {
            cout << ans << "\n";
        }

        // 显示参考答案
        cout << "\nReference Answer:\n";
        for (const auto& ans : q.answers) {
            cout << ans << "\n";
        }

        // 写入答案文件
        writeAnswerToFile(q, userAnswers);
    }

    cout << "\nquiz over, and your answers are saved to sub-answer.txt\n";
    cout << "press [ENTER] to exit...";
    getchar();
}


int main() {
    string filename;
    cout << "Please enter the question bank filename: ";
    getline(cin, filename);
    if (filename.size() < 4 || filename.substr(filename.size() - 4) != ".txt") {
        filename += ".txt";
    }
    vector<Question> questions = loadQuestions(filename);
    
    if (questions.empty()) {
        cout << "No questions found, please use sub-insert.cpp to add questions\n";
        return 1;
    }

    string mode;
    cout << "Please select quiz mode:\n1. Sequential Quiz\n2. Random Quiz\nPlease choose: ";
    getline(cin, mode);

    quizMode(questions, mode[0] == '2');
    return 0;
}