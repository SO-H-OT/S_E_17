import pandas as pd
import numpy as np
from flask import Flask, jsonify, request, send_file, safe_join, Response, send_from_directory
from flask_cors import CORS
import requests
import os
import pymysql
from werkzeug.utils import secure_filename
import time
from functools import wraps
from sklearn.linear_model import LinearRegression  # 修改导入语句

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:3000"],  # 允许的前端地址
    "methods": ["GET", "POST", "DELETE", "PUT", "OPTIONS"],  # 允许的 HTTP 方法
    "allow_headers": ["Content-Type", "Authorization"]  # 允许的请求头
}})

# 配置允许的文件上传类型
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',  # 请更改为你的数据库密码
    'db': 'oceanmonitor',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# 根路由 - 展示所有API端点
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "success",
        "message": "Ocean Monitor API 已启动",
        "endpoints": {
            "水质监测": [
                "/api/water-quality - 获取水质数据",
                "/api/water-quality/periods - 获取可用时间段",
                "/api/water-quality/provinces - 获取所有省份",
                "/api/water-quality/basins - 获取所有流域",
                "/api/water-quality/statistics - 获取水质统计数据"
            ],
            "鱼类数据": [
                "/api/fish-statistics - 获取鱼类统计数据"
            ],
            "用户管理": [
                "/api/register - 用户注册 (POST)",
                "/api/login - 用户登录 (POST)",
                "/api/users - 获取所有用户",
                "/api/get_user/<username> - 获取单个用户",
                "/api/users/<username> - 删除用户 (DELETE)",
                "/api/users/<username> - 更新用户 (PUT)"
            ],
            "违规信息": [
                "/api/violations - 获取违规数据",
                "/api/user-violations - 获取用户违规数据"
            ],
            "海洋生物识别": [
                "/api/identify-marine-life - 上传图片进行海洋生物识别 (POST)"
            ],
            "预测": [
                "/api/predict-length - 预测长度 (POST)"
            ]
        }
    })

# 数据库连接函数
def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

def get_fish_statistics():
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM fishes")
        fish_data = cursor.fetchall()
    conn.close()
    
    # 将结果转换为DataFrame
    fish_df = pd.DataFrame(fish_data)
    
    # 如果数据库中有数据，使用数据库数据
    if not fish_df.empty:
        # 1. 各种鱼的数量统计
        species_count = fish_df['species'].value_counts().to_dict()
        
        # 2. 各种鱼的平均重量
        weight_avg = fish_df.groupby('species')['weight'].mean().to_dict()
        
        # 3. 鱼的长度与重量关系数据
        length_weight_data = fish_df[['species', 'length1', 'weight']].to_dict('records')
        
        # 4. 各种鱼的体型比例（长度/高度）
        proportion = (fish_df['length1'] / fish_df['height']).groupby(fish_df['species']).mean().to_dict()
        
        return {
            'species_count': species_count,
            'weight_avg': weight_avg,
            'length_weight': length_weight_data,
            'proportion': proportion
        }


# 水质监测数据API
@app.route('/api/water-quality', methods=['GET'])
def get_water_quality():
    try:
        # 获取查询参数
        year = request.args.get('year', '2020')
        month = request.args.get('month', '05')
        province = request.args.get('province')
        basin = request.args.get('basin')
        
        # 构建表名
        table_name = f"{year}-{month}"
        
        # 构建SQL查询
        sql = f"SELECT * FROM `{table_name}`"
        conditions = []
        
        if province:
            conditions.append(f"province = '{province}'")
        if basin:
            conditions.append(f"basin = '{basin}'")
        
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        
        # 查询数据库
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql)
            data = cursor.fetchall()
        conn.close()
        
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取所有可用的年份和月份
@app.route('/api/water-quality/periods', methods=['GET'])
def get_available_periods():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
        conn.close()
        
        # 过滤出表示年月的表名 (格式: YYYY-MM)
        periods = []
        for table in tables:
            table_name = list(table.values())[0]  # 获取表名
            if len(table_name) == 7 and table_name[4] == '-':
                try:
                    year = int(table_name[:4])
                    month = int(table_name[5:])
                    if 2000 <= year <= 2100 and 1 <= month <= 12:
                        periods.append({"year": year, "month": month})
                except ValueError:
                    continue
        
        return jsonify({"success": True, "data": periods})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取所有省份
@app.route('/api/water-quality/provinces', methods=['GET'])
def get_provinces():
    try:
        # 获取最新的表
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
        
        # 找到最新的水质表 (假设表名格式为 YYYY-MM)
        water_tables = []
        for table in tables:
            table_name = list(table.values())[0]
            if len(table_name) == 7 and table_name[4] == '-':
                water_tables.append(table_name)
        
        if not water_tables:
            return jsonify({"success": False, "error": "No water quality tables found"}), 404
        
        latest_table = sorted(water_tables)[-1]
        
        # 查询所有省份
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT DISTINCT province FROM `{latest_table}`")
            provinces = [item['province'] for item in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({"success": True, "data": provinces})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取所有流域
@app.route('/api/water-quality/basins', methods=['GET'])
def get_basins():
    try:
        # 获取最新的表
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
        
        # 找到最新的水质表 (假设表名格式为 YYYY-MM)
        water_tables = []
        for table in tables:
            table_name = list(table.values())[0]
            if len(table_name) == 7 and table_name[4] == '-':
                water_tables.append(table_name)
        
        if not water_tables:
            return jsonify({"success": False, "error": "No water quality tables found"}), 404
        
        latest_table = sorted(water_tables)[-1]
        
        # 过滤条件
        province = request.args.get('province')
        
        # 构建SQL查询
        sql = f"SELECT DISTINCT basin FROM `{latest_table}`"
        if province:
            sql += f" WHERE province = '{province}'"
        
        # 查询所有流域
        with conn.cursor() as cursor:
            cursor.execute(sql)
            basins = [item['basin'] for item in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({"success": True, "data": basins})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取水质监测数据统计
@app.route('/api/water-quality/statistics', methods=['GET'])
def get_water_quality_stats():
    try:
        # 获取查询参数
        year = request.args.get('year', '2020')
        month = request.args.get('month', '05')
        
        # 构建表名
        table_name = f"{year}-{month}"
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 水质类别统计
            cursor.execute(f"SELECT water_quality_category, COUNT(*) as count FROM `{table_name}` GROUP BY water_quality_category")
            category_stats = cursor.fetchall()
            
            # 省份统计
            cursor.execute(f"SELECT province, COUNT(*) as count FROM `{table_name}` GROUP BY province")
            province_stats = cursor.fetchall()
            
            # 水质指标平均值
            cursor.execute(f"""
                SELECT 
                    AVG(water_temperature) as avg_temperature,
                    AVG(pH) as avg_ph,
                    AVG(dissolved_oxygen) as avg_oxygen,
                    AVG(conductivity) as avg_conductivity,
                    AVG(turbidity) as avg_turbidity,
                    AVG(permanganate_index) as avg_permanganate,
                    AVG(ammonia_nitrogen) as avg_ammonia,
                    AVG(total_phosphorus) as avg_phosphorus,
                    AVG(total_nitrogen) as avg_nitrogen,
                    AVG(chlorophyll_a) as avg_chlorophyll,
                    AVG(algae_density) as avg_algae
                FROM `{table_name}`
            """)
            metrics_avg = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            "success": True, 
            "data": {
                "categories": category_stats,
                "provinces": province_stats,
                "metrics_avg": metrics_avg
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# 读取市场数据


def update_market_data(item_name, quantity=None, price=None):
    global market_df
    if quantity is not None:
        market_df.loc[market_df['商品名称'] == item_name, '数量'] = quantity
    if price is not None:
        market_df.loc[market_df['商品名称'] == item_name, '单价'] = price
    market_df.to_csv('market_data.csv', index=False)
    return True

# API路由
@app.route('/api/fish-statistics', methods=['GET'])
def fish_statistics():
    try:
        data = get_fish_statistics()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/online-market', methods=['GET'])
def get_online_market():
    try:
        url = "http://www.xinfadi.com.cn/getPriceData.html"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.post(url, headers=headers)
        data = response.json()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/weather', methods=['GET'])
def get_weather():
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": 52.52,
            "longitude": 13.41,
            "hourly": ["temperature_2m", "relative_humidity_2m"],
            "models": "cma_grapes_global"
        }
        response = requests.get(url, params=params)
        data = response.json()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/air-quality', methods=['GET'])
def get_air_quality():
    try:
        url = "https://air-quality-api.open-meteo.com/v1/air-quality"
        params = {
            "latitude": 52.52,
            "longitude": 13.41,
            "hourly": ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"]
        }
        response = requests.get(url, params=params)
        data = response.json()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/video/<filename>')
def get_video(filename):
    try:
        video_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'videos')
        return send_from_directory(video_dir, filename)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    # 获取用户输入的注册信息
    username = data.get('username')
    password = data.get('password')
    gender = data.get('gender')
    age = data.get('age')
    role = data.get('role')
    unit = data.get('unit')

    # 检查必填字段是否存在
    if not all([username, password, gender, age, role, unit]):
        return jsonify({"success": False, "error": "请提供完整的用户信息"}), 400
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 检查用户名是否已经存在
            cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                return jsonify({"success": False, "error": "用户名已存在"}), 400
            
            # 创建新用户
            cursor.execute(
                "INSERT INTO users (username, password, gender, age, role, unit) VALUES (%s, %s, %s, %s, %s, %s)",
                (username, password, gender, age, role, unit)
            )
        
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "注册成功"}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "error": "缺少用户名或密码"}), 400
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 查找用户
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
        
        conn.close()
        
        if not user:
            return jsonify({"success": False, "error": "用户名不存在"}), 400
        
        # 检查密码是否正确
        if user['password'] != password:
            return jsonify({"success": False, "error": "密码错误"}), 400

        return jsonify({
            "success": True,
            "message": "登录成功",
            "user": {
                "username": user['username'],
                "gender": user['gender'],
                "age": user['age'],
                "role": user['role'],
                "unit": user['unit']
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT username, gender, age, role, unit FROM users")
            users = cursor.fetchall()
        conn.close()
        
        return jsonify({"success": True, "data": users})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<string:username>', methods=['DELETE'])
def delete_user(username):
    operator = request.get_json(force=True)  # 获取操作用户的信息
    if not operator or operator.get('role') != 'admin':
        return jsonify({"success": False, "message": "权限不足，只有管理员可以删除用户"}), 403

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 根据用户名查找用户
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({"success": False, "message": "用户未找到"}), 404
            
            if user['role'] == 'admin':  # 不允许删除管理员账号
                return jsonify({"success": False, "message": "不能删除管理员账号"}), 403
            
            # 删除用户
            cursor.execute("DELETE FROM users WHERE username = %s", (username,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "用户已删除"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<string:username>', methods=['PUT'])
def update_user(username):
    data = request.json
    operator_role = data.get("operator_role")  # 获取操作用户的角色

    if operator_role != "admin":
        return jsonify({"success": False, "message": "权限不足，只有管理员可以修改用户信息"}), 403

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 根据用户名查找用户
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({"success": False, "message": "用户未找到"}), 404
            
            # 更新用户信息
            cursor.execute(
                """UPDATE users 
                   SET username = %s, gender = %s, age = %s, role = %s, unit = %s 
                   WHERE username = %s""",
                (
                    data.get("username", user["username"]),
                    data.get("gender", user["gender"]),
                    data.get("age", user["age"]),
                    data.get("role", user["role"]),
                    data.get("unit", user["unit"]),
                    username
                )
            )
        
        conn.commit()
        
        # 获取更新后的用户数据
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (data.get("username", username),))
            updated_user = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            "success": True, 
            "message": "用户信息已更新", 
            "user": {
                "username": updated_user["username"],
                "gender": updated_user["gender"],
                "age": updated_user["age"],
                "role": updated_user["role"],
                "unit": updated_user["unit"]
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/get_user/<username>', methods=['GET'])
def get_user(username):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT username, gender, age, role, unit FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({"success": True, "user": user})
        else:
            return jsonify({"success": False, "message": "用户未找到"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 添加速率限制装饰器
def rate_limit(max_per_minute=10):
    min_interval = 60.0 / max_per_minute
    last_called = [0.0]  # 使用列表存储，以便在闭包中修改

    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            now = time.time()
            elapsed = now - last_called[0]
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
            result = func(*args, **kwargs)
            last_called[0] = time.time()
            return result
        return wrapped
    return decorator

# 添加重试机制
def retry_on_ratelimit(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if 'rate_limit' in str(e).lower():
                        retries += 1
                        if retries == max_retries:
                            raise
                        time.sleep(delay * (2 ** (retries - 1)))  # 指数退避
                    else:
                        raise
        return wrapped
    return decorator

@app.route('/api/identify-marine-life', methods=['POST'])
@rate_limit(max_per_minute=10)  # 限制每分钟最多10个请求
@retry_on_ratelimit(max_retries=3, delay=1)
def identify_marine_life():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "未找到文件"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "未选择文件"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join('uploads', filename)
        
        os.makedirs('uploads', exist_ok=True)
        file.save(filepath)

        try:
            api_key = "sk-c0oTwzXO874NWG0Ud0nh1SbRKjdhbfNSsCTa98RxyIHpUbzU"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # 读取图片文件并转换为base64
            with open(filepath, 'rb') as image_file:
                import base64
                image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
            
            # 修改后的请求格式
            payload = {
                "model": "moonshot-v1-32k",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "请识别这张图片中的海洋生物种类，只需回复生物的名称。"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ]
            }

            # 发送请求到API端点
            response = requests.post(
                "https://api.moonshot.cn/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                species = result.get('choices', [{}])[0].get('message', {}).get('content', '未知生物')
                return jsonify({"success": True, "data": {"species": species}})
            elif 'rate_limit' in response.text.lower():
                return jsonify({
                    "success": False,
                    "error": "服务器繁忙，请稍后再试",
                    "retry_after": "60"
                }), 429
            else:
                return jsonify({
                    "success": False,
                    "error": "识别失败，请重试",
                    "details": response.text
                }), response.status_code
                
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
    else:
        return jsonify({"success": False, "error": "不支持的文件格式"}), 400

def load_data(file_path):
    data = []
    with open(file_path, 'r') as f:
        for line in f:
            parts = line.strip().split(', ')
            if len(parts) == 3:
                try:
                    values = list(map(float, parts))
                    data.append(values)
                except ValueError:
                    print(f"跳过无效行: {line.strip()}")
    return np.array(data)

@app.route('/api/predict-length', methods=['POST'])
def predict_length():
    try:
        data = request.get_json()
        input_periods = data.get('periods')
        
        if not input_periods or len(input_periods) != 3:
            return jsonify({
                "success": False,
                "error": "请提供三个周期的数据"
            }), 400

        # 加载历史数据
        try:
            file_path = os.path.join(os.path.dirname(__file__), 'output.txt')
            training_data = load_data(file_path)
            
            if training_data.size == 0:
                return jsonify({
                    "success": False,
                    "error": "无法加载训练数据"
                }), 500
                
            # 构建训练数据
            X = training_data[:, :2]  # 使用前两个周期作为特征
            y = training_data[:, 2]   # 使用第三个周期作为目标
            
            # 创建并训练模型
            model = LinearRegression()
            model.fit(X, y)
            
            # 使用用户输入的数据进行预测
            input_features = np.array(input_periods[:2]).reshape(1, -1)
            predicted_length = model.predict(input_features)[0]
            
            # 确保预测结果合理
            min_growth = 1.0
            max_growth = 1.5
            last_period = input_periods[-1]
            
            if predicted_length < last_period * min_growth:
                predicted_length = last_period * min_growth
            elif predicted_length > last_period * max_growth:
                predicted_length = last_period * max_growth

            return jsonify({
                "success": True,
                "data": {
                    "predicted_length": float(predicted_length),
                    "current_length": float(last_period)
                }
            })
            
        except FileNotFoundError:
            return jsonify({
                "success": False,
                "error": "训练数据文件不存在"
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
