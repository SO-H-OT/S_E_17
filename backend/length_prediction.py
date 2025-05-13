import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression  # 修正导入语句

# 读取数据集
def load_data(file_path):
    data = []
    with open(file_path, 'r') as f:
        for line in f:
            parts = line.strip().split(', ')
            if len(parts) == 3:
                try:
                    # 将字符串转换为浮点数
                    values = list(map(float, parts))
                    data.append(values)
                except ValueError:
                    print(f"跳过无效行: {line.strip()}")
    return np.array(data)

# 主函数，用于与用户交互并进行预测
def main():
    # 加载数据集
    file_path = 'output.txt'  # 替换为你的数据文件路径
    data = load_data(file_path)
    
    if data.size == 0:
        print("数据加载失败或数据为空。")
        return
    
    # 特征X为前三个周期的体长，目标y为第三个周期的体长（这里我们假设预测第四个周期）
    # 注意：这里我们使用第三个周期的体长作为目标变量，如果你有更多的周期数据，可以调整这部分
    X = data[:, :2]  # 使用前两个周期作为特征
    y = data[:, 2]   # 使用第三个周期作为目标
    
    # 创建并训练线性回归模型
    model = LinearRegression()
    model.fit(X, y)
    
    # 用户输入三个周期的体长
    input_data = input("请输入三个周期的体长，用空格隔开（例如：23.2 25.4 30）：")
    try:
        # 将输入转换为浮点数列表
        periods = list(map(float, input_data.split()))
        if len(periods) != 3:
            print("请输入三个数值。")
            return
        
        # 使用前两个周期作为特征进行预测
        input_features = np.array(periods[:2]).reshape(1, -1)
        predicted_length = model.predict(input_features)
        
        # 输出预测结果
        print(f"预测的第四个周期的体长为: {predicted_length[0]:.2f} cm")
    
    except ValueError:
        print("输入无效，请输入三个用空格隔开的数字。")

# 运行主函数
if __name__ == "__main__":
    main()