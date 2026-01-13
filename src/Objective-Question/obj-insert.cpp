#include <iostream>
#include <fstream>
#include <vector>
#include <string>

using namespace std;

struct Question {
    string type;       // 题目类型：JUDGE/CHOICE/MULTICHOICE
    vector<string> question;   // 题干（多行文本）
    vector<string> options;  // 选项（判断题默认T/F）
    vector<int> correctAnswers;  // 正确答案索引（多选题可能有多个）
};

int main() {
    string filename;
    cout << "请输入保存题目的文件名：";
    getline(cin, filename);
    // 如果 filename 不是.txt结尾，则添加
    if (filename.size() < 4 || filename.substr(filename.size() - 4) != ".txt") {
        filename += ".txt";
    }
    ofstream outFile(filename, ios::app);
    if (!outFile) {
        cerr << "无法打开文件进行写入！\n";
        return 1;
    }

    string choice;
    string typeCHOICE = "";
    do {
        Question q;
        
        // 选择题目类型
        if(typeCHOICE == "" || typeCHOICE[0] != '0'){
            cout << "请选择题目类型：\n";
            cout << "1. 判断题\n";
            cout << "2. 选择题\n";
            cout << "3. 多选题\n";
            cout << "请输入选项(1-3)：";

            getline(cin, typeCHOICE);
        }

        if (typeCHOICE[0] == '1' || typeCHOICE == "01") {
            q.type = "JUDGE";
            // 判断题默认选项T/F
            q.options = {"T", "F"};
            cout << "请输入判断题题干（输入空行结束）：\n";
        } else if (typeCHOICE[0] == '2' || typeCHOICE[0] == '0' && typeCHOICE[1] == '2') {
            q.type = "CHOICE";
            int optCount = 0;
            if(typeCHOICE.length() > 2 && typeCHOICE[2] > '2' && typeCHOICE[2] <= '9'){
                optCount = typeCHOICE[2] - '0';
            }
            if(!optCount){
                cout << "请输入选项数量：";
                cin >> optCount;
                cin.ignore();  // 忽略换行符
            }

            if(optCount < 2 || optCount > 9){
                cout << "选项数量错误，已跳过此题！\n";
                continue;
            }
            
            cout << "请依次输入" << optCount << "个选项（每个一行）：\n";
            for (int i = 0; i < optCount; ++i) {
                string opt;
                getline(cin, opt);
                q.options.push_back(opt);
            }
            cout << "请输入选择题题干（输入空行结束）：\n";
        } else if (typeCHOICE[0] == '3' || typeCHOICE[0] == '0' && typeCHOICE[1] == '3') {
            q.type = "MULTICHOICE";
            int optCount = 0;
            if(typeCHOICE.length() > 2 && typeCHOICE[2] > '2' && typeCHOICE[2] <= '9'){
                optCount = typeCHOICE[2] - '0';
            }
            if(!optCount){
                cout << "请输入选项数量：";
                cin >> optCount;
                cin.ignore();  // 忽略换行符
            }
            
            cout << "请依次输入" << optCount << "个选项（每个一行）：\n";
            for (int i = 0; i < optCount; ++i) {
                string opt;
                getline(cin, opt);
                q.options.push_back(opt);
            }
            cout << "请输入多选题题干（输入空行结束）：\n";
        } else {
            cout << "无效选项，已跳过此题！\n";
            continue;
        }
        
        // 输入多行题干，空行结束
        string line;
        while (true) {
            getline(cin, line);
            if (line.empty()) {  // 空行标记输入结束
                break;
            }
            q.question.push_back(line);
        }
        
        // 输入正确答案
        cout << "输入正确选项序号（1开始），多选题用逗号分隔：";
        string ansInput;
        getline(cin, ansInput);
        
        // 解析正确答案
        size_t pos = 0;
        while (pos < ansInput.size()) {
            size_t comma = ansInput.find(',', pos);
            if (comma == string::npos) {
                q.correctAnswers.push_back(stoi(ansInput.substr(pos)) - 1);
                break;
            }
            q.correctAnswers.push_back(stoi(ansInput.substr(pos, comma - pos)) - 1);
            pos = comma + 1;
        }
        
        // 写入文件（兼容多行题干格式）
        outFile << "#" << q.type << "\n";
        for (const auto& qLine : q.question) {
            outFile << qLine << "\n";
        }
        outFile << "#OPTIONS\n";
        for (const auto& opt : q.options) {
            outFile << opt << "\n";
        }
        outFile << "#CORRECT\n";
        for (size_t i = 0; i < q.correctAnswers.size(); ++i) {
            if (i > 0) outFile << ",";
            outFile << (q.correctAnswers[i] + 1);
        }
        outFile << "\n#END\n\n";
        
        cout << "是否继续添加题目？([y]/n)：";
        getline(cin, choice);
    } while (choice[0] != 'n' && choice[0] != 'N');

    outFile.close();
    cout << "题目已保存到 " << filename << "\n";
    return 0;
}