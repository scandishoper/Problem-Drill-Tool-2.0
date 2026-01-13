#include <iostream>
#include <fstream>
#include <vector>
#include <string>

using namespace std;

struct Question {
    vector<string> question;  // 多行题干
    vector<string> answers;
};

int main() {
    string filename;
    cout << "请输入要保存题目的文件名: ";
    getline(cin, filename);
    if (filename.size() < 4 || filename.substr(filename.size() - 4) != ".txt") {
        filename += ".txt";
    }
    ofstream outFile(filename, ios::app);
    if (!outFile) {
        cerr << "无法打开文件进行写入!\n";
        return 1;
    }

    string choice;
    do {
        Question q;
        cout << "请输入题干（支持多行，空行结束）:\n";
        string line;
        // 读取多行题干（空行结束）
        while (true) {
            getline(cin, line);
            if (line.empty()) break;
            q.question.push_back(line);
        }

        cout << "请输入参考答案要点（每行一个，空行结束）:\n";
        // 读取多行答案（空行结束）
        while (true) {
            getline(cin, line);
            if (line.empty()) break;
            q.answers.push_back(line);
        }

        // 写入文件
        outFile << "#SUBJECTIVE\n";
        for (const auto& qLine : q.question) {  // 写入多行题干
            outFile << qLine << "\n";
        }
        outFile << "#ANSWER\n";
        for (const auto& ans : q.answers) {
            outFile << ans << "\n";
        }
        outFile << "#END\n\n";

        cout << "是否继续添加题目(y/[n]): ";
        getline(cin, choice);
    } while (choice[0] == 'y' || choice[0] == 'Y');

    outFile.close();
    cout << "题目已保存到 " << filename << "\n";
    return 0;
}